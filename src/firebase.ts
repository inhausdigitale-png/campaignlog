import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

let app;
let db: any = null;
let auth: any = null;
let isFirebaseEnabled = false;
let isCloudSyncActive = false;

// Determine if the config is realistic or just placeholder
if (
  firebaseConfig &&
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("placeholder") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("placeholder")
) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (firebaseConfig && (firebaseConfig as any).firestoreDatabaseId) {
      db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    auth = getAuth(app);
    isFirebaseEnabled = true;
    console.log("[FIREBASE] Initialized successfully with Cloud Firestore.");

    // Track active signed-in session dynamically
    onAuthStateChanged(auth, (usr) => {
      isCloudSyncActive = usr !== null;
      console.log(`[FIREBASE] Live sync state updated. Active: ${isCloudSyncActive}`);
    });
  } catch (error) {
    console.error("[FIREBASE] Initialization error, falling back to local sandbox:", error);
  }
} else {
  console.log("[FIREBASE] Configuration is placeholder. Running on durable Sandbox LocalStorage mode.");
}

export { db, auth, isFirebaseEnabled, isCloudSyncActive };

// Standardized Firestore Error Logger
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || "anonymous_local",
      email: auth?.currentUser?.email || "anonymous_local@example.com",
      emailVerified: auth?.currentUser?.emailVerified || false,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
