import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

let cachedAccessToken: string | null = null;
let profileEmail: string | null = null;
let profileName: string | null = null;
let profilePhoto: string | null = null;

// Handle Google Login and capture token + profile details with designated Workspace scopes
export const authorizeGoogleWorkspace = async (): Promise<{
  accessToken: string;
  email: string;
  name: string;
  photoUrl: string;
} | null> => {
  if (!auth) {
    throw new Error("[WORKSPACE] Firebase authentication is not initialized or configured.");
  }

  const provider = new GoogleAuthProvider();
  // Request metadata search/reading and spreadsheets reading
  provider.addScope("https://www.googleapis.com/auth/drive.metadata.readonly");
  provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");

  try {
    console.log("[WORKSPACE] Triggering sign-in popup for Google Workspace APIs...");
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error("[WORKSPACE] Failed to capture access token from Google sign-in result.");
    }

    cachedAccessToken = credential.accessToken;
    profileEmail = result.user.email || "unknown@gmail.com";
    profileName = result.user.displayName || "Google Workspace User";
    profilePhoto = result.user.photoURL || "";

    console.log("[WORKSPACE] Authentication and scope grant successful:", profileEmail);
    return {
      accessToken: cachedAccessToken,
      email: profileEmail,
      name: profileName,
      photoUrl: profilePhoto,
    };
  } catch (error) {
    console.error("[WORKSPACE] Google Sign-In Popup Error:", error);
    throw error;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getWorkspaceProfile = () => {
  if (!cachedAccessToken) return null;
  return {
    email: profileEmail,
    name: profileName,
    photoUrl: profilePhoto,
  };
};

export const clearWorkspaceAuth = () => {
  cachedAccessToken = null;
  profileEmail = null;
  profileName = null;
  profilePhoto = null;
};

// Check if user has active session
export const checkGoogleTokenStatus = (): boolean => {
  return cachedAccessToken !== null;
};

// List Spreadsheet Files from User's Google Drive
export const fetchSpreadsheetsFromDrive = async (token: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc,name`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[WORKSPACE] Drive list request failed:", response.status, errorBody);
    throw new Error(`Google Drive retrieval failed with status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.files || [];
};

// Fetch sub-sheets (tabs) of a spreadsheet
export const fetchSpreadsheetTabs = async (token: string, spreadsheetId: string): Promise<string[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[WORKSPACE] Sheets sheets list request failed:", response.status, errorBody);
    throw new Error(`Google Sheets sheets list request failed: ${response.status}`);
  }

  const data = await response.json();
  const list = data.sheets || [];
  return list.map((s: any) => s.properties?.title || "").filter(Boolean);
};

// Fetch raw grid values of a chosen tab/sheet
export const fetchSpreadsheetRows = async (token: string, spreadsheetId: string, sheetTitle: string): Promise<string[][]> => {
  // Use range format to read first 250 rows which is substantial and safe for dashboard
  const range = encodeURIComponent(`${sheetTitle}!A1:Z250`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[WORKSPACE] Sheets fetch values request failed:", response.status, errorBody);
    throw new Error(`Google Sheets values retrieval failed: ${response.status}`);
  }

  const data = await response.json();
  return data.values || [];
};
