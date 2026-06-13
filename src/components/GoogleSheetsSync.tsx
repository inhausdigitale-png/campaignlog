import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Lead, CampaignPerformance, TargetBudgetRow, Campaign } from "../types";
import {
  authorizeGoogleWorkspace,
  getCachedAccessToken,
  getWorkspaceProfile,
  clearWorkspaceAuth,
  fetchSpreadsheetsFromDrive,
  fetchSpreadsheetTabs,
  fetchSpreadsheetRows
} from "../services/googleService";
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  Database,
  ArrowRight,
  LogOut,
  Sparkles,
  ShieldAlert,
  HardDrive,
  Check,
  Columns,
  Link,
  UploadCloud,
  FileCode,
  Trash2,
  Eye,
  Info
} from "lucide-react";

interface GoogleSheetsSyncProps {
  campaigns: Campaign[];
  onImportLeads: (leads: Lead[]) => Promise<void>;
  onImportPerformance: (perf: CampaignPerformance[]) => Promise<void>;
  onImportTargets: (targets: TargetBudgetRow[]) => Promise<void>;
}

type SyncTargetType = "leads" | "performance" | "targets";

export default function GoogleSheetsSync({
  campaigns,
  onImportLeads,
  onImportPerformance,
  onImportTargets
}: GoogleSheetsSyncProps) {
  // Source Selection (Offline Excel file vs Cloud Google Sheets)
  const [sourceType, setSourceType] = useState<"offline" | "google">(() => {
    return (localStorage.getItem("g_sheet_source_type") as "offline" | "google") || "offline";
  });

  // Auto-Sync Option
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem("g_sheet_auto_sync") === "true";
  });

  // Authentication states
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ email: string | null; name: string | null; photoUrl: string | null } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState<boolean>(false);

  // Google Drive & Sheets States
  const [files, setFiles] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [fileSearch, setFileSearch] = useState<string>("");
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Google Spreadsheet URL direct load states
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loadingByUrl, setLoadingByUrl] = useState<boolean>(false);

  // Offline excel/csv upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [offlineWorkbook, setOfflineWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const [selectedFileId, setSelectedFileId] = useState<string | null>(() => {
    return localStorage.getItem("g_sheet_selected_file_id");
  });
  const [selectedFileName, setSelectedFileName] = useState<string>(() => {
    return localStorage.getItem("g_sheet_selected_file_name") || "";
  });
  const [loadingTabs, setLoadingTabs] = useState<boolean>(false);
  const [tabs, setTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    return localStorage.getItem("g_sheet_selected_tab") || "";
  });

  // Raw rows fetched from either Sheets interface or local Excel parser
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [loadingRows, setLoadingRows] = useState<boolean>(false);
  const [rowsError, setRowsError] = useState<string | null>(null);

  // Raw rows sub-grid inspection mode states
  const [showRawGrid, setShowRawGrid] = useState<boolean>(true);
  const [gridSearch, setGridSearch] = useState<string>("");

  // Configuration of sync properties
  const [syncType, setSyncType] = useState<SyncTargetType>(() => {
    return (localStorage.getItem("g_sheet_sync_type") as SyncTargetType) || "leads";
  });
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Columns indices mapping dictionary
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [itemsToImport, setItemsToImport] = useState<any[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-fill states on initialization
  useEffect(() => {
    const activeToken = getCachedAccessToken();
    if (activeToken) {
      setAuthToken(activeToken);
      setAuthorized(true);
      setProfile(getWorkspaceProfile());
      loadDriveFiles(activeToken);

      const isAutoSync = localStorage.getItem("g_sheet_auto_sync") === "true";
      const savedSource = localStorage.getItem("g_sheet_source_type") || "offline";
      const savedFileId = localStorage.getItem("g_sheet_selected_file_id");
      const savedTab = localStorage.getItem("g_sheet_selected_tab");

      if (isAutoSync && savedSource === "google" && savedFileId && savedTab) {
        // Trigger auto-sync data fetch function (tabs list and rows content)
        const runAutoSyncFetch = async () => {
          setLoadingTabs(true);
          setRowsError(null);
          try {
            const list = await fetchSpreadsheetTabs(activeToken, savedFileId);
            setTabs(list);
            const tabToLoad = list.includes(savedTab) ? savedTab : (list[0] || "");
            if (tabToLoad) {
              setSelectedTab(tabToLoad);
              setLoadingRows(true);
              try {
                const vals = await fetchSpreadsheetRows(activeToken, savedFileId, tabToLoad);
                setRawRows(vals);
                if (vals.length > 0) {
                  setHeaders(vals[0]);
                } else {
                  setHeaders([]);
                }
              } catch (err: any) {
                setRowsError("Auto-Sync: Failed reading values range. Verify sharing permission.");
              } finally {
                setLoadingRows(false);
              }
            }
          } catch (err: any) {
            setRowsError("Auto-Sync: Could not read sheet properties database. Is sharing scope enabled?");
          } finally {
            setLoadingTabs(false);
          }
        };
        runAutoSyncFetch();
      }
    }
  }, []);

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem("g_sheet_source_type", sourceType);
    if (selectedFileId) {
      localStorage.setItem("g_sheet_selected_file_id", selectedFileId);
    } else {
      localStorage.removeItem("g_sheet_selected_file_id");
    }
    localStorage.setItem("g_sheet_selected_file_name", selectedFileName);
    localStorage.setItem("g_sheet_selected_tab", selectedTab);
    localStorage.setItem("g_sheet_sync_type", syncType);
    localStorage.setItem("g_sheet_auto_sync", String(autoSync));
  }, [sourceType, selectedFileId, selectedFileName, selectedTab, syncType, autoSync]);

  // Sync state reset on type switch
  useEffect(() => {
    resetMappings();
  }, [syncType, rawRows]);

  // Handle Sign-In with popup
  const handleConnect = async () => {
    setAuthenticating(true);
    setAuthError(null);
    setSuccessMessage(null);
    try {
      const res = await authorizeGoogleWorkspace();
      if (res) {
        setAuthToken(res.accessToken);
        setAuthorized(true);
        setProfile({
          email: res.email,
          name: res.name,
          photoUrl: res.photoUrl
        });
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate with Google. Ensure popups are allowed.");
    } finally {
      setAuthenticating(false);
    }
  };

  // Sign out
  const handleDisconnect = () => {
    clearWorkspaceAuth();
    setAuthorized(false);
    setAuthToken(null);
    setProfile(null);
    setFiles([]);
    setSelectedFileId(null);
    setTabs([]);
    setRawRows([]);
    setSuccessMessage(null);
  };

  // Retrieve files list
  const loadDriveFiles = async (token: string) => {
    setLoadingFiles(true);
    setDriveError(null);
    try {
      const res = await fetchSpreadsheetsFromDrive(token);
      setFiles(res);
    } catch (err: any) {
      console.error(err);
      setDriveError("Failed retrieving file inventory from Google Drive. Try reconnecting your account.");
    } finally {
      setLoadingFiles(false);
    }
  };

  // Parser for Spreadsheet ID from Google Sheets URL
  const parseSpreadsheetId = (url: string): string | null => {
    // Normal spreadsheet URL structure
    // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKv1aM9ldF5MQ9bc8v/edit#gid=0
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Check if the input is direct Spreadsheet ID (typically 44 chars)
    const cleanId = url.trim();
    if (cleanId.length >= 25 && !cleanId.includes("/") && !cleanId.includes(".")) {
      return cleanId;
    }
    
    return null;
  };

  const handleLoadFromUrl = async () => {
    setUrlError(null);
    setSuccessMessage(null);
    const parsedId = parseSpreadsheetId(urlInput);
    if (!parsedId) {
      setUrlError("Invalid Spreadsheet URL format. Please paste a valid Google Sheets URL.");
      return;
    }

    if (!authToken) {
      setUrlError("Please authenticate with Google first to authorize the request.");
      return;
    }

    setLoadingByUrl(true);
    try {
      // Trigger select using parsed ID
      await handleSelectFile(parsedId, "Pasted Spreadsheet link");
      setUrlInput(""); // Reset input on successful loading
    } catch (err: any) {
      console.error("[WORKSPACE] URL loader error:", err);
      setUrlError("Failed to fetch spreadsheet rows. Verify URL sharing permissions or active OAuth scopes.");
    } finally {
      setLoadingByUrl(false);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseOfflineFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseOfflineFile(e.target.files[0]);
    }
  };

  const parseOfflineFile = (file: File) => {
    setUploadedFile(file);
    setRowsError(null);
    setSuccessMessage(null);
    setRawRows([]);
    setHeaders([]);
    setTabs([]);
    setSelectedTab("");
    setLoadingRows(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        setOfflineWorkbook(workbook);
        setTabs(workbook.SheetNames);
        setSelectedFileId("offline-file");
        setSelectedFileName(file.name);
        
        if (workbook.SheetNames.length > 0) {
          const firstSheet = workbook.SheetNames[0];
          setSelectedTab(firstSheet);
          loadOfflineSheetRows(workbook, firstSheet);
        }
      } catch (err: any) {
        console.error(err);
        setRowsError("Could not parse this spreadsheet file. Verify it is a valid .xlsx, .xls, .xlsm, or .csv file.");
      } finally {
        setLoadingRows(false);
      }
    };
    reader.onerror = () => {
      setRowsError("Error reading the selected file.");
      setLoadingRows(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadOfflineSheetRows = (workbook: XLSX.WorkBook, sheetName: string) => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        setRawRows([]);
        setHeaders([]);
        return;
      }
      // Read all rows as matrix arrays
      const vals = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
      
      const stringifiedVals: string[][] = vals.map(row => 
        (Array.isArray(row) ? row : []).map(cell => (cell !== null && cell !== undefined) ? String(cell).trim() : "")
      );

      setRawRows(stringifiedVals);
      if (stringifiedVals.length > 0) {
        setHeaders(stringifiedVals[0]);
      } else {
        setHeaders([]);
      }
    } catch (err: any) {
      console.error(err);
      setRowsError("Failed to parse sheet data row structure.");
    }
  };

  // Reset/Remove active offline file
  const handleRemoveOfflineFile = () => {
    setUploadedFile(null);
    setOfflineWorkbook(null);
    setSelectedFileId(null);
    setSelectedFileName("");
    setTabs([]);
    setSelectedTab("");
    setRawRows([]);
    setHeaders([]);
  };

  // Select spreadsheet & fetch its inner tabs
  const handleSelectFile = async (id: string, name: string) => {
    handleRemoveOfflineFile(); // clear offline file if switching to google sheets
    setSelectedFileId(id);
    setSelectedFileName(name);
    setTabs([]);
    setSelectedTab("");
    setRawRows([]);
    setLoadingTabs(true);
    setRowsError(null);
    setSuccessMessage(null);
    
    if (!authToken) return;
    try {
      const list = await fetchSpreadsheetTabs(authToken, id);
      setTabs(list);
      if (list.length > 0) {
        setSelectedTab(list[0]);
        await loadSheetRows(id, list[0]);
      }
    } catch (err: any) {
      setRowsError("Could not read sheet properties database. Is sharing scope enabled?");
    } finally {
      setLoadingTabs(false);
    }
  };

  // Switch tabs inside selected Spreadsheet
  const handleSelectTab = async (sheetName: string) => {
    setSelectedTab(sheetName);
    setRawRows([]);
    setSuccessMessage(null);
    if (sourceType === "offline" && offlineWorkbook) {
      loadOfflineSheetRows(offlineWorkbook, sheetName);
    } else if (selectedFileId) {
      await loadSheetRows(selectedFileId, sheetName);
    }
  };

  // Load raw sheet rows
  const loadSheetRows = async (fileId: string, sheetName: string, passedToken?: string) => {
    setLoadingRows(true);
    setRowsError(null);
    const tokenToUse = passedToken || authToken;
    if (!tokenToUse) return;
    try {
      const vals = await fetchSpreadsheetRows(tokenToUse, fileId, sheetName);
      setRawRows(vals);
      if (vals.length > 0) {
        setHeaders(vals[0]);
      } else {
        setHeaders([]);
      }
    } catch (err: any) {
      setRowsError("Failed reading values range inside chosen sheet. Please check permissions.");
    } finally {
      setLoadingRows(false);
    }
  };

  // Attempt smart mapping of columns
  const resetMappings = () => {
    if (rawRows.length === 0 || !headers.length) {
      setColumnMapping({});
      return;
    }

    const mapping: Record<string, number> = {};
    const normHeaders = headers.map(h => h.toLowerCase().trim());

    if (syncType === "leads") {
      // Leads expected fields: Name, Email, Phone, Platform/Source, Remarks
      const nameIdx = normHeaders.findIndex(h => h.includes("name") || h.includes("lead"));
      const emailIdx = normHeaders.findIndex(h => h.includes("email") || h.includes("mail"));
      const phoneIdx = normHeaders.findIndex(h => h.includes("phone") || h.includes("contact") || h.includes("mobile"));
      const platformIdx = normHeaders.findIndex(h => h.includes("source") || h.includes("platform") || h.includes("portal"));
      const notesIdx = normHeaders.findIndex(h => h.includes("notes") || h.includes("remarks") || h.includes("detail") || h.includes("text"));

      if (nameIdx !== -1) mapping["leadName"] = nameIdx;
      if (emailIdx !== -1) mapping["email"] = emailIdx;
      if (phoneIdx !== -1) mapping["phone"] = phoneIdx;
      if (platformIdx !== -1) mapping["platform"] = platformIdx;
      if (notesIdx !== -1) mapping["notes"] = notesIdx;
    } 
    else if (syncType === "performance") {
      // performance tracker expected fields: Campaign Name, Adset Name, Ad Account ID, Project, Leads, Impression, Reach, CTR, Amount Spend, Clicks, SVC, Booked
      const campaignIdx = normHeaders.findIndex(h => h.includes("campaign") || h.includes("adname"));
      const adsetIdx = normHeaders.findIndex(h => h.includes("adset") || h.includes("ad set") || h.includes("group"));
      const acctIdx = normHeaders.findIndex(h => h.includes("account") || h.includes("act_") || h.includes("id"));
      const projectIdx = normHeaders.findIndex(h => h.includes("project") || h.includes("site") || h.includes("product"));
      const leadsIdx = normHeaders.findIndex(h => h.includes("leads") || h.includes("conversions") || h.includes("lead count"));
      const impIdx = normHeaders.findIndex(h => h.includes("impression") || h.includes("imp") || h.includes("view"));
      const reachIdx = normHeaders.findIndex(h => h.includes("reach"));
      const ctrIdx = normHeaders.findIndex(h => h.includes("ctr") || h.includes("click rate"));
      const spendIdx = normHeaders.findIndex(h => h.includes("spend") || h.includes("amount") || h.includes("cost") || h.includes("budget"));
      const clicksIdx = normHeaders.findIndex(h => h.includes("clicks") || h.includes("click"));
      const svcIdx = normHeaders.findIndex(h => h.includes("svc") || h.includes("visits") || h.includes("visit"));
      const bookedIdx = normHeaders.findIndex(h => h.includes("booked") || h.includes("bookings") || h.includes("won"));

      if (campaignIdx !== -1) mapping["campaignName"] = campaignIdx;
      if (adsetIdx !== -1) mapping["adsetName"] = adsetIdx;
      if (acctIdx !== -1) mapping["adAccountId"] = acctIdx;
      if (projectIdx !== -1) mapping["projectName"] = projectIdx;
      if (leadsIdx !== -1) mapping["leads"] = leadsIdx;
      if (impIdx !== -1) mapping["impression"] = impIdx;
      if (reachIdx !== -1) mapping["reach"] = reachIdx;
      if (ctrIdx !== -1) mapping["ctr"] = ctrIdx;
      if (spendIdx !== -1) mapping["amountSpend"] = spendIdx;
      if (clicksIdx !== -1) mapping["clicks"] = clicksIdx;
      if (svcIdx !== -1) mapping["svc"] = svcIdx;
      if (bookedIdx !== -1) mapping["booked"] = bookedIdx;
    } 
    else if (syncType === "targets") {
      // targets fields: Month (YYYY-MM), Project, Medium/Channel, Budget, Total Lead Target, Total Lead Achieved, Digital Lead Target, Digital Lead Achieved, ...
      const monthIdx = normHeaders.findIndex(h => h.includes("month") || h.includes("date") || h.includes("period"));
      const projIdx = normHeaders.findIndex(h => h.includes("project") || h.includes("client"));
      const medIdx = normHeaders.findIndex(h => h.includes("medium") || h.includes("channel") || h.includes("source"));
      const budgetIdx = normHeaders.findIndex(h => h.includes("budget") || h.includes("cost"));
      const spendIdx = normHeaders.findIndex(h => h.includes("spend") || h.includes("actual"));
      const leadsTargetIdx = normHeaders.findIndex(h => h.includes("target leads") || h.includes("lead target") || h.includes("total target"));
      const leadsAchIdx = normHeaders.findIndex(h => h.includes("lead achieved") || h.includes("leads total") || h.includes("achieved leads"));

      if (monthIdx !== -1) mapping["month"] = monthIdx;
      if (projIdx !== -1) mapping["project"] = projIdx;
      if (medIdx !== -1) mapping["medium"] = medIdx;
      if (budgetIdx !== -1) mapping["budget"] = budgetIdx;
      if (spendIdx !== -1) mapping["spend"] = spendIdx;
      if (leadsTargetIdx !== -1) mapping["totalLeadTarget"] = leadsTargetIdx;
      if (leadsAchIdx !== -1) mapping["totalLeadAchieved"] = leadsAchIdx;
    }

    setColumnMapping(mapping);
  };

  // Build mapped array to preview before running safe mutation
  const buildMappedItems = () => {
    if (rawRows.length <= 1) return [];

    const parsed: any[] = [];
    const rowsSubset = rawRows.slice(1); // skip headers row

    for (const row of rowsSubset) {
      if (row.length === 0 || !row.some(val => val.trim())) continue;

      if (syncType === "leads") {
        const nameCol = columnMapping["leadName"];
        const emailCol = columnMapping["email"];
        const phoneCol = columnMapping["phone"];
        const platCol = columnMapping["platform"];
        const noteCol = columnMapping["notes"];

        const name = nameCol !== undefined && row[nameCol] ? row[nameCol].trim() : "Spreadsheet Lead Prospect";
        const email = emailCol !== undefined && row[emailCol] ? row[emailCol].trim() : `synced_${Math.random().toString(36).substring(7)}@example.com`;
        const phone = phoneCol !== undefined && row[phoneCol] ? row[phoneCol].trim() : "";
        const source = platCol !== undefined && row[platCol] ? row[platCol].trim() : "Other";
        const notes = noteCol !== undefined && row[noteCol] ? row[noteCol].trim() : "Imported via Google Sheets.";

        const isPortal = ["housing", "99 acres", "magicbricks", "roof&floor"].includes(source.toLowerCase());

        parsed.push({
          id: `lead-g-${Math.random().toString(36).substring(2, 9)}`,
          leadName: name,
          email,
          phone,
          status: "New",
          platform: source,
          notes,
          createdAt: new Date().toISOString(),
          isPortalLead: isPortal,
          portalSource: isPortal ? (source as any) : undefined
        } as Lead);
      } 
      else if (syncType === "performance") {
        const campaignCol = columnMapping["campaignName"];
        const adsetCol = columnMapping["adsetName"];
        const acctCol = columnMapping["adAccountId"];
        const projCol = columnMapping["projectName"];
        const leadsCol = columnMapping["leads"];
        const impCol = columnMapping["impression"];
        const reachCol = columnMapping["reach"];
        const ctrCol = columnMapping["ctr"];
        const spendCol = columnMapping["amountSpend"];
        const clicksCol = columnMapping["clicks"];
        const svcCol = columnMapping["svc"];
        const bookedCol = columnMapping["booked"];

        const campaignName = campaignCol !== undefined && row[campaignCol] ? row[campaignCol].trim() : "Spreadsheet Campaign";
        const adsetName = adsetCol !== undefined && row[adsetCol] ? row[adsetCol].trim() : "Spreadsheet Adset";
        const adAccountId = acctCol !== undefined && row[acctCol] ? row[acctCol].trim() : "act_synced";
        const projectName = projCol !== undefined && row[projCol] ? row[projCol].trim() : "General Solar";
        const leadsNum = leadsCol !== undefined && row[leadsCol] ? parseInt(row[leadsCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const impNum = impCol !== undefined && row[impCol] ? parseInt(row[impCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const reachNum = reachCol !== undefined && row[reachCol] ? parseInt(row[reachCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const ctrNum = ctrCol !== undefined && row[ctrCol] ? parseFloat(row[ctrCol].replace(/[^\d.]/g, "")) || 0 : 0;
        const spendNum = spendCol !== undefined && row[spendCol] ? parseFloat(row[spendCol].replace(/[^\d.]/g, "")) || 0 : 0;
        const clicksNum = clicksCol !== undefined && row[clicksCol] ? parseInt(row[clicksCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const svcNum = svcCol !== undefined && row[svcCol] ? parseInt(row[svcCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const bookedNum = bookedCol !== undefined && row[bookedCol] ? parseInt(row[bookedCol].replace(/[^0-9]/g, "")) || 0 : 0;

        parsed.push({
          id: `perf-g-${Math.random().toString(36).substring(2, 9)}`,
          campaignName,
          adsetName,
          adAccountId,
          projectName,
          leads: leadsNum,
          impression: impNum,
          reach: reachNum,
          ctr: ctrNum,
          amountSpend: spendNum,
          clicks: clicksNum,
          svc: svcNum,
          booked: bookedNum,
          cplCpa: leadsNum > 0 ? Math.round(spendNum / leadsNum) : 0,
          createdAt: new Date().toISOString()
        } as CampaignPerformance);
      } 
      else if (syncType === "targets") {
        const monthCol = columnMapping["month"];
        const projCol = columnMapping["project"];
        const medCol = columnMapping["medium"];
        const budCol = columnMapping["budget"];
        const spendCol = columnMapping["spend"];
        const leadTCol = columnMapping["totalLeadTarget"];
        const leadACol = columnMapping["totalLeadAchieved"];

        const month = monthCol !== undefined && row[monthCol] ? row[monthCol].trim() : new Date().toISOString().substring(0, 7);
        const project = projCol !== undefined && row[projCol] ? row[projCol].trim() : "Project Solar";
        const medium = medCol !== undefined && row[medCol] ? row[medCol].trim() : "Google Search Ads";
        const budgetValue = budCol !== undefined && row[budCol] ? parseFloat(row[budCol].replace(/[^\d.]/g, "")) || 0 : 0;
        const spendValue = spendCol !== undefined && row[spendCol] ? parseFloat(row[spendCol].replace(/[^\d.]/g, "")) || 0 : 0;
        const totalLeadTarget = leadTCol !== undefined && row[leadTCol] ? parseInt(row[leadTCol].replace(/[^0-9]/g, "")) || 0 : 0;
        const totalLeadAchieved = leadACol !== undefined && row[leadACol] ? parseInt(row[leadACol].replace(/[^0-9]/g, "")) || 0 : 0;

        // Initialize template week buckets conforming to strict ledger structure format
        const defaultWeek = { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 };

        parsed.push({
          id: `target-g-${Math.random().toString(36).substring(2, 9)}`,
          month,
          project,
          medium,
          budget: budgetValue,
          spend: spendValue,
          totalLeadTarget,
          totalLeadAchieved,
          digitalLeadTarget: Math.round(totalLeadTarget * 0.7),
          digitalLeadAchieved: Math.round(totalLeadAchieved * 0.7),
          btlLeadTarget: Math.round(totalLeadTarget * 0.3),
          btlLeadAchieved: Math.round(totalLeadAchieved * 0.3),
          leadAllocation: totalLeadAchieved,
          siteVisit: Math.round(totalLeadAchieved * 0.4),
          booking: Math.round(totalLeadAchieved * 0.15),
          week1: { ...defaultWeek, spend: Math.round(spendValue / 4), totalLeadAchieved: Math.round(totalLeadAchieved / 4) },
          week2: { ...defaultWeek, spend: Math.round(spendValue / 4), totalLeadAchieved: Math.round(totalLeadAchieved / 4) },
          week3: { ...defaultWeek, spend: Math.round(spendValue / 4), totalLeadAchieved: Math.round(totalLeadAchieved / 4) },
          week4: { ...defaultWeek, spend: Math.round(spendValue / 4), totalLeadAchieved: Math.round(totalLeadAchieved / 4) },
          week5: { ...defaultWeek },
          createdAt: new Date().toISOString()
        } as TargetBudgetRow);
      }
    }
    return parsed;
  };

  // Launch modal
  const handleInitiateImport = () => {
    const list = buildMappedItems();
    if (list.length === 0) {
      alert("No valid rows discovered or parsed from mapping settings. Check header matches.");
      return;
    }
    setItemsToImport(list);
    setShowConfirmModal(true);
  };

  // Run final safe DB update
  const handleExecuteImport = async () => {
    setImporting(true);
    try {
      if (syncType === "leads") {
        await onImportLeads(itemsToImport);
        setSuccessMessage(`Successfully synchronized ${itemsToImport.length} Leads from Google Sheet!`);
      } else if (syncType === "performance") {
        await onImportPerformance(itemsToImport);
        setSuccessMessage(`Successfully synchronized ${itemsToImport.length} Performance Tracker rows!`);
      } else if (syncType === "targets") {
        await onImportTargets(itemsToImport);
        setSuccessMessage(`Successfully synchronized ${itemsToImport.length} Weekly Targeting Ledger plans!`);
      }
      setShowConfirmModal(false);
      setItemsToImport([]);
    } catch (err: any) {
      alert(`Synchronization failed: ${err.message || String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const filteredFileList = files.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));
  const previewItems = buildMappedItems().slice(0, 5); // show top 5 in preview tab grid

  return (
    <div className="space-y-6">
      {/* Premium Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 border border-slate-100 text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50/50 rounded-md">
              Spreadsheet Hub
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium font-sans">Multi-Sheet Workbook Integrator</span>
          </div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" size={20} />
            Spreadsheet Sync &amp; Upload Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Browse and sync marketing data. Upload general Excel/CSV documents directly from your computer or authorize real-time Google Sheets database sync.
          </p>
        </div>
        
        {authorized && profile && sourceType === "google" && (
          <div className="flex items-center gap-3 bg-indigo-50/60 p-2 pl-3 pr-4 border border-indigo-100 rounded-xl">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Google Profile" className="w-8 h-8 rounded-full border border-indigo-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                {profile.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="text-left font-sans">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">{profile.name}</h4>
              <p className="text-[10px] text-indigo-700 font-semibold">{profile.email}</p>
            </div>
            <button
              onClick={handleDisconnect}
              title="Disconnect Google Account"
              className="ml-2 p-1.5 hover:bg-indigo-100 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-all"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Connection Mode Selection Toggle Tabs & Auto-Sync Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 max-w-xs md:max-w-sm w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSourceType("offline");
              setSuccessMessage(null);
              setRowsError(null);
              if (uploadedFile && offlineWorkbook) {
                loadOfflineSheetRows(offlineWorkbook, selectedTab || offlineWorkbook.SheetNames[0]);
                setSelectedFileId("offline-file");
                setSelectedFileName(uploadedFile.name);
              } else {
                setSelectedFileId(null);
                setSelectedFileName("");
                setRawRows([]);
                setHeaders([]);
                setTabs([]);
                setSelectedTab("");
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sourceType === "offline"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <UploadCloud size={13} />
            <span>Local Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceType("google");
              setSuccessMessage(null);
              setRowsError(null);
              
              // Try to restore saved Google Sheets file selection
              const savedFileId = localStorage.getItem("g_sheet_selected_file_id");
              const savedFileName = localStorage.getItem("g_sheet_selected_file_name") || "";
              const savedTab = localStorage.getItem("g_sheet_selected_tab") || "";
              
              if (savedFileId) {
                setSelectedFileId(savedFileId);
                setSelectedFileName(savedFileName);
                setSelectedTab(savedTab);
                if (authToken) {
                  const fetchTabsAndLoad = async () => {
                    setLoadingTabs(true);
                    try {
                      const list = await fetchSpreadsheetTabs(authToken, savedFileId);
                      setTabs(list);
                      const activeT = list.includes(savedTab) ? savedTab : (list[0] || "");
                      if (activeT) {
                        setSelectedTab(activeT);
                        await loadSheetRows(savedFileId, activeT);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoadingTabs(false);
                    }
                  };
                  fetchTabsAndLoad();
                }
              } else {
                setSelectedFileId(null);
                setSelectedFileName("");
                setRawRows([]);
                setHeaders([]);
                setTabs([]);
                setSelectedTab("");
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sourceType === "google"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Google Sheets Sync</span>
          </button>
        </div>

        {sourceType === "google" && (
          <div className="flex items-center" id="g_sheet_autosync_container">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white py-1.5 px-3 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50 transition-all">
              <input
                id="g_sheet_autosync_checkbox"
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className={`text-indigo-600 ${autoSync ? "animate-spin" : ""}`} />
                <span>Enable Auto-Sync when returning to tab</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Workspace Explorer Dashboard Grid split side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar Panel: File Browsers & Explorers */}
        <div className="lg:col-span-4 space-y-4">
          
          {sourceType === "offline" && (
            /* Left Sidebar: Offline Excel Uploader / Sheet selector view */
            <div className="space-y-4">
              {/* Dropzone frame uploader */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/20"
                }`}
              >
                <div className="h-11 w-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 mb-1">
                  <UploadCloud size={20} />
                </div>
                <div className="space-y-1">
                  <p className="font-display font-bold text-slate-800 text-xs">Upload General Excel / CSV</p>
                  <p className="text-[10px] text-slate-400">Drag &amp; drop your workbook file here or click below</p>
                </div>
                <input
                  type="file"
                  id="excel-file-uploader"
                  accept=".xlsx,.xls,.csv,.xlsm"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("excel-file-uploader")?.click()}
                  className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-[10.5px] transition-all cursor-pointer border border-indigo-100"
                >
                  Select Document
                </button>
                <p className="text-[9px] text-slate-400 font-mono">Supports XLS, XLSX, XLSM, CSV</p>
              </div>

              {/* Uploaded File status card with worksheet sheets selector */}
              {uploadedFile && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode size={16} className="text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveOfflineFile}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                      title="Clear workbook"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                      Worksheets / Tabs ({tabs.length})
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      Click a sheet tab below to read its content columns and rows matrix:
                    </p>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {tabs.map((tabName) => {
                        const isSelected = selectedTab === tabName;
                        return (
                          <button
                            key={tabName}
                            type="button"
                            onClick={() => handleSelectTab(tabName)}
                            className={`w-full text-left p-2 px-2.5 rounded-lg text-xs transition-all flex items-center justify-between border cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold"
                                : "border-transparent bg-slate-50 hover:bg-slate-100/90 text-slate-700"
                            }`}
                          >
                            <span className="truncate pr-2">{tabName}</span>
                            <CheckCircle size={11} className={isSelected ? "text-indigo-600 shrink-0" : "opacity-0 shrink-0"} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {sourceType === "google" && !authorized && (
            /* Mini Authorization Sidebar widget */
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-4 shadow-sm">
              <div className="h-10 w-10 mx-auto rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                <HardDrive size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-xs">Link Google Workspace</h3>
                <p className="text-slate-500 text-[10px] mt-1 leading-normal">
                  Connect via secure Google Auth popup to browse spreadsheets in your active GDrive storage.
                </p>
              </div>
              {authError && (
                <p className="text-[10px] font-semibold text-rose-600 leading-snug">{authError}</p>
              )}
              <button
                onClick={handleConnect}
                disabled={authenticating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {authenticating ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <FileSpreadsheet size={12} />
                )}
                <span>Authorize Google account</span>
              </button>
            </div>
          )}

          {sourceType === "google" && authorized && (
            <>
            {/* Direct Spreadsheet URL Loader */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Link size={13} className="text-indigo-600" />
                Load Spreadsheet via URL
              </h3>
              
              <p className="text-[10px] text-slate-500 leading-normal">
                Paste any Google Spreadsheet URL link below to parse its ID and load its tabs directly.
              </p>

              <div className="space-y-2 pt-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>

                {urlError && (
                  <p className="text-[10.5px] font-semibold text-rose-600 leading-snug animate-fade-in">{urlError}</p>
                )}

                <button
                  type="button"
                  onClick={handleLoadFromUrl}
                  disabled={loadingByUrl || !urlInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 cursor-pointer shadow-xs"
                >
                  {loadingByUrl ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <FileSpreadsheet size={13} />
                  )}
                  <span>{loadingByUrl ? "Loading URL..." : "Load Spreadsheet"}</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-800">Drive Spreadsheets</h3>
                <button
                  onClick={() => authToken && loadDriveFiles(authToken)}
                  disabled={loadingFiles}
                  title="Refetch files list"
                  className="p-1 hover:bg-slate-100 text-slate-500 rounded-md cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Search bar inside list */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter spreadsheet names..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {loadingFiles ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="animate-spin h-5 w-5 mx-auto mb-2 text-indigo-600" />
                  Loading spreadsheets queue...
                </div>
              ) : driveError ? (
                <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-lg text-[11px] text-amber-800 text-center">
                  {driveError}
                </div>
              ) : filteredFileList.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl text-center text-slate-400 text-xs">
                  No spreadsheet files found in Google Drive.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {filteredFileList.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectFile(file.id, file.name)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 border cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                            : "border-transparent bg-slate-50 hover:bg-slate-100/90 text-slate-700"
                        }`}
                      >
                        <FileSpreadsheet className="shrink-0 mt-0.5 text-emerald-600" size={14} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate leading-tight">{file.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Mod: {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            </>
          )}
        </div>

          {/* Right panel: Active Sheet values mapping and sync options */}
          <div className="lg:col-span-8 space-y-4">
            {selectedFileId ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                {/* File Header */}
                <div className="border-b border-slate-150 pb-3 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50 p-3 rounded-xl">
                  <div className="min-w-0">
                    <span className="text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">Viewing Workspace Spreadsheet</span>
                    <h3 className="font-display font-medium text-slate-900 text-sm truncate">{selectedFileName}</h3>
                  </div>

                  {/* Tab listing navigator inside selected Sheet file */}
                  {tabs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium font-sans">Active Tab:</span>
                      <select
                        value={selectedTab}
                        onChange={(e) => handleSelectTab(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                      >
                        {tabs.map((tName) => (
                          <option key={tName} value={tName}>
                            {tName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-205 border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 text-xs shadow-xs animate-fade-in">
                    <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={15} />
                    <div>
                      <h4 className="font-bold">Sync Completed Successfully!</h4>
                      <p className="mt-0.5 text-emerald-700">{successMessage}</p>
                    </div>
                  </div>
                )}

                {rowsError && (
                  <div className="bg-rose-50 border border-rose-220 text-rose-700 p-3 rounded-xl text-xs flex gap-2">
                    <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={14} />
                    <span>{rowsError}</span>
                  </div>
                )}

                {loadingRows || loadingTabs ? (
                  <div className="py-24 text-center text-slate-400 text-xs">
                    <RefreshCw className="animate-spin h-6 w-6 text-indigo-600 mx-auto mb-2" />
                    Fetching rows index...
                  </div>
                ) : rawRows.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-xl">
                    No rows data populated inside selected Google Sheets tab scope.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Choose Database Sync Mode Section */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-display">
                        1. Select Destination Database Table
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "leads", label: "Leads Database", desc: "For raw marketing inquiries and prospects." },
                          { id: "performance", label: "Performance Metrics", desc: "Campaign ad-spend and performance logs." },
                          { id: "targets", label: "Targeting Ledgers", desc: "Monthly target records and week divisions." }
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSyncType(m.id as SyncTargetType)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              syncType === m.id
                                ? "bg-indigo-50 border-indigo-200 text-indigo-900 ring-1 ring-indigo-500/20"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                            }`}
                          >
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <Database size={12} className={syncType === m.id ? "text-indigo-600" : "text-slate-450 text-slate-400"} />
                              {m.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed leading-snug">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Sheet Raw Grid Viewer */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-4 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5 font-display">
                            <Eye size={13} className="text-emerald-600" />
                            Active Sheet Raw Grid Viewer ({selectedTab})
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                            Below are the live cell values parsed from your file tab. Search to filter rows immediately.
                          </p>
                        </div>
                        <div className="relative max-w-xs w-full">
                          <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search grid row content..."
                            value={gridSearch}
                            onChange={(e) => setGridSearch(e.target.value)}
                            className="w-full text-xs pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-[11px] font-sans text-slate-600 border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200">
                              <th className="p-1 px-2.5 text-center font-mono bg-slate-200 border-r border-slate-150 min-w-[32px] text-[10px]">Row</th>
                              {headers.map((h, i) => (
                                <th key={i} className="p-2 border-r border-slate-150 whitespace-nowrap min-w-[95px]">
                                  <span className="text-[9px] font-mono text-indigo-600 block leading-none">Col {i + 1}</span>
                                  <span className="truncate block mt-0.5 text-slate-700 font-bold">{h || `Empty`}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const subset = rawRows.slice(0, 20); // show top 20 rows for rich visibility
                              const filtered = subset.filter(row => 
                                gridSearch === "" || row.some(cell => cell.toLowerCase().includes(gridSearch.toLowerCase()))
                              );

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={headers.length + 1} className="py-6 text-center text-slate-400 text-xs italic">
                                      No matching rows found or empty tab dataset.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                  <td className="p-1.5 px-2 text-center font-mono font-bold text-slate-400 bg-slate-50 border-r border-slate-150">{rIdx + 1}</td>
                                  {headers.map((_, cIdx) => (
                                    <td key={cIdx} className="p-1.5 px-2 border-r border-slate-100 text-slate-600 max-w-[140px] truncate" title={row[cIdx]}>
                                      {row[cIdx] || <span className="text-slate-300 italic">empty</span>}
                                    </td>
                                  ))}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                        <Info size={11} className="text-slate-400" />
                        <span>Showing top sheet bounds of {rawRows.length} rows inside "<span className="font-bold">{selectedTab}</span>" tab worksheet.</span>
                      </div>
                    </div>

                    {/* Columns Mapper UI */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                          <Columns size={13} className="text-indigo-650" />
                          2. Configure Column Headers Mapping
                        </h4>
                        <button
                          type="button"
                          onClick={resetMappings}
                          className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
                        >
                          Auto-Match Columns
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-normal mb-2">
                        Associate your Spreadsheet row header list (top row index) with fields in the target database:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {syncType === "leads" && (
                          <>
                            {/* Lead Name mapping */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Lead Name field:</span>
                              <select
                                value={columnMapping["leadName"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, leadName: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Email */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Email Address:</span>
                              <select
                                value={columnMapping["email"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, email: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Phone */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Phone Number:</span>
                              <select
                                value={columnMapping["phone"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, phone: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Source */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Portal Source/Medium:</span>
                              <select
                                value={columnMapping["platform"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, platform: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Remarks */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Remarks/Notes:</span>
                              <select
                                value={columnMapping["notes"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, notes: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}

                        {syncType === "performance" && (
                          <>
                            {/* Campaign name */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Campaign Name:</span>
                              <select
                                value={columnMapping["campaignName"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, campaignName: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Project Name */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Project Tag Name:</span>
                              <select
                                value={columnMapping["projectName"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, projectName: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Spends */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Cost / Amount Spend:</span>
                              <select
                                value={columnMapping["amountSpend"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, amountSpend: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Leads */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Leads / Conversions:</span>
                              <select
                                value={columnMapping["leads"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, leads: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Clicks */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Clicks:</span>
                              <select
                                value={columnMapping["clicks"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, clicks: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Impressions */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Impressions count:</span>
                              <select
                                value={columnMapping["impression"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, impression: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}

                        {syncType === "targets" && (
                          <>
                            {/* Month */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Month (YYYY-MM):</span>
                              <select
                                value={columnMapping["month"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, month: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Project Name */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Project Name:</span>
                              <select
                                value={columnMapping["project"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, project: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Medium-Channel */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Lead Type Medium:</span>
                              <select
                                value={columnMapping["medium"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, medium: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {/* Budget */}
                            <div className="space-y-1">
                              <span className="text-[10.5px] text-slate-500 font-medium">Campaign Target Budget:</span>
                              <select
                                value={columnMapping["budget"] ?? ""}
                                onChange={(e) => setColumnMapping({ ...columnMapping, budget: parseInt(e.target.value) })}
                                className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Ignore / Skip --</option>
                                {headers.map((h, idx) => (
                                  <option key={idx} value={idx}>
                                    Column {idx + 1}: {h || `Unnamed (${idx})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-4 space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block font-display">
                          3. Previewing Sample Records ({rawRows.length - 1} records identified)
                        </label>
                      </div>

                      {previewItems.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          Please map critical columns to see structural preview.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-sans text-slate-700 min-w-[500px]">
                            <thead>
                              <tr className="bg-slate-50 text-[10.5px] font-bold text-slate-450 border-b border-slate-150">
                                {syncType === "leads" && (
                                  <>
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Phone</th>
                                    <th className="p-2">Source</th>
                                    <th className="p-2">Notes</th>
                                  </>
                                )}
                                {syncType === "performance" && (
                                  <>
                                    <th className="p-2">Campaign</th>
                                    <th className="p-2">Adset</th>
                                    <th className="p-2">Project</th>
                                    <th className="p-2">Spends</th>
                                    <th className="p-2">Leads</th>
                                  </>
                                )}
                                {syncType === "targets" && (
                                  <>
                                    <th className="p-2">Month</th>
                                    <th className="p-2">Project</th>
                                    <th className="p-2">Medium</th>
                                    <th className="p-2">Budget</th>
                                    <th className="p-2">Target Leads</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {previewItems.map((item, index) => (
                                <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                  {syncType === "leads" && (
                                    <>
                                      <td className="p-2 font-bold text-slate-900">{item.leadName}</td>
                                      <td className="p-2 truncate max-w-[120px]">{item.email}</td>
                                      <td className="p-2 text-slate-500 font-mono">{item.phone}</td>
                                      <td className="p-2 text-slate-500">{item.platform}</td>
                                      <td className="p-2 truncate max-w-[120px]">{item.notes}</td>
                                    </>
                                  )}
                                  {syncType === "performance" && (
                                    <>
                                      <td className="p-2 font-bold text-slate-900">{item.campaignName}</td>
                                      <td className="p-2 truncate">{item.adsetName}</td>
                                      <td className="p-2">{item.projectName}</td>
                                      <td className="p-2 font-mono text-emerald-600 font-semibold">₹{item.amountSpend.toLocaleString()}</td>
                                      <td className="p-2 font-bold font-mono">{item.leads}</td>
                                    </>
                                  )}
                                  {syncType === "targets" && (
                                    <>
                                      <td className="p-2 font-semibold text-slate-700 font-mono">{item.month}</td>
                                      <td className="p-2 font-bold">{item.project}</td>
                                      <td className="p-2 text-slate-500">{item.medium}</td>
                                      <td className="p-2 font-mono font-semibold">₹{item.budget.toLocaleString()}</td>
                                      <td className="p-2 font-mono text-indigo-600 font-bold">{item.totalLeadTarget}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleInitiateImport}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
                        >
                          <span>Synchronize Workbook Records</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No Spreadsheet Selected Empty State */
              <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 flex flex-col justify-center items-center space-y-4 shadow-xs">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <FileSpreadsheet className="text-slate-400" size={20} />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="font-display font-bold text-slate-800 text-xs">No Workbook Active</h4>
                  <p className="text-[10.5px] leading-relaxed">
                    Select a spreadsheet database file from Google Drive on the sidebar explorer panel to parse and map content rows.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Safe Confirmation Modal to satisfy Mandated Guidelines */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-fade-in text-left">
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-650 text-indigo-600">
                <ShieldAlert size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-slate-900 text-sm">Confirm Google Sheets Import</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  You are about to modify your local campaign metrics database with records fetched dynamically from Google Workspace.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium font-sans">Spreadsheet File:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{selectedFileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium font-sans">Workbook Tab Name:</span>
                <span className="font-semibold text-slate-800">{selectedTab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium font-sans">Destination Table:</span>
                <span className="font-bold text-indigo-700 uppercase tracking-wide font-mono text-[10.5px]">
                  {syncType === "leads" ? "Leads Database" : syncType === "performance" ? "Performance Tracker" : "Weekly Targeting Ledger"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-150 pt-2 mt-1">
                <span className="text-slate-500 font-medium font-sans font-bold">Records Count:</span>
                <span className="font-extrabold text-slate-800">{itemsToImport.length} elements</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 text-slate-400 leading-normal leading-relaxed">
              This action will securely load, validation-align, and seed these rows into your workspace state, refreshing any downstream charts and metrics dashboards automatically.
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={importing}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 bg-white transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {importing ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : (
                  <Check size={13} />
                )}
                <span>Authorize &amp; Import Rows</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
