import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Cloud,
  Check,
  AlertCircle,
  TrendingUp,
  Users,
  Coins,
  ArrowRight,
  Database,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Lock,
  ListFilter,
  FileText,
  Grid
} from "lucide-react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, isFirebaseEnabled } from "../firebase";
import { Lead, CampaignPerformance, TargetBudgetRow } from "../types";

interface GoogleSheetsSyncProps {
  onImportLeads: (leads: Lead[]) => Promise<void>;
  onImportPerformance: (perf: CampaignPerformance[]) => Promise<void>;
  onImportTargets: (targets: TargetBudgetRow[]) => Promise<void>;
  onSaveChangeLog?: (entry: any) => Promise<void>;
  campaigns?: any[];
}

interface SpreadsheetFile {
  id: string;
  name: string;
  modifiedTime: string;
}

export default function GoogleSheetsSync({
  onImportLeads,
  onImportPerformance,
  onImportTargets,
  onSaveChangeLog,
  campaigns = []
}: GoogleSheetsSyncProps) {
  // Authentication & session state
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Source selection states
  const [sourceType, setSourceType] = useState<"drive" | "url">("drive");
  const [pastedUrl, setPastedUrl] = useState("");
  const [driveFiles, setDriveFiles] = useState<SpreadsheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");

  // Worksheet tabs states
  const [worksheetTabs, setWorksheetTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("");
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  // Import entity config
  const [importType, setImportType] = useState<"leads" | "performance" | "targets">("leads");

  // Spreadsheet raw data rows state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]); // Excludes header
  const [isFetchingData, setIsFetchingData] = useState(false);
  
  // Mapping dropdown configuration
  // Maps a database schema property key to the column index in rawRows
  const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});

  // Validation & Alignment results
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Monitor auth state to fetch drive files if logged in
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        setGoogleUser(user);
        // Scopes are stored server side or acquired during login pop-ups
      } else {
        setGoogleUser(null);
        setAccessToken(null);
        setDriveFiles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Sign out / disconnect
  const handleDisconnect = async () => {
    if (auth) {
      await signOut(auth);
    }
    setAccessToken(null);
    setGoogleUser(null);
    setDriveFiles([]);
    setSelectedFileId("");
    setWorksheetTabs([]);
    setSelectedTab("");
    setRawHeaders([]);
    setRawRows([]);
    setPreviewRecords([]);
  };

  // Google Provider Login requesting readonly scopes
  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");
      provider.addScope("https://www.googleapis.com/auth/drive.readonly");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("No Google access token was unlocked. Please confirm permissions.");
      }

      setAccessToken(token);
      setGoogleUser(result.user);
      
      // Auto-load Drive files upon successful authentication
      fetchDriveSpreadsheets(token);
    } catch (err: any) {
      console.error("Workspace Auth Error:", err);
      setAuthError(err.message || "Failed to establish Workspace integration trust link.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // List Spreadsheets from User's Drive
  const fetchDriveSpreadsheets = async (token: string) => {
    setIsLoadingFiles(true);
    setDriveFiles([]);
    try {
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&orderBy=modifiedTime desc&fields=files(id, name, modifiedTime)",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search Drive items. Token might be stale.");
      }

      const data = await response.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error("Error retrieving search:", err);
      setAuthError("Failed to fetch recent files. Please try reconnecting Google to refresh security credentials.");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Extract Spreadsheet ID from URL
  const extractSpreadsheetId = (url: string): string | null => {
    const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return matches ? matches[1] : null;
  };

  // Fetch Tabs configuration of active sheet
  const fetchWorksheetDetails = async (spreadsheetId: string) => {
    if (!accessToken) return;
    setIsLoadingTabs(true);
    setWorksheetTabs([]);
    setSelectedTab("");
    setRawHeaders([]);
    setRawRows([]);
    setPreviewRecords([]);
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error("Spreadsheet inaccessible. Verify sharing controls or check permissions.");
      }

      const data = await response.json();
      const sheetNames = (data.sheets || []).map((s: any) => s.properties.title);
      setWorksheetTabs(sheetNames);
      if (sheetNames.length > 0) {
        setSelectedTab(sheetNames[0]);
        // Trigger values load
        fetchWorksheetData(spreadsheetId, sheetNames[0]);
      }
    } catch (err: any) {
      console.error("Sheets model retrieve failed:", err);
      setAuthError(err.message || "Could not resolve spreadsheet layout tabs.");
    } finally {
      setIsLoadingTabs(false);
    }
  };

  // Trigger Sheet Details based on active selection method
  const handleResolveSpreadsheet = () => {
    let sheetId = "";
    let name = "Custom Remote Sheet";
    
    if (sourceType === "drive") {
      sheetId = selectedFileId;
      const found = driveFiles.find(f => f.id === selectedFileId);
      if (found) name = found.name;
    } else {
      const extracted = extractSpreadsheetId(pastedUrl);
      if (!extracted) {
        alert("Invalid URL format. Please paste a valid docs.google.com/spreadsheets/ URL.");
        return;
      }
      sheetId = extracted;
    }

    if (!sheetId) {
      alert("Please select a file or paste a link first.");
      return;
    }

    setSelectedFileName(name);
    fetchWorksheetDetails(sheetId);
  };

  // Fetch rows for a specific worksheet tab
  const fetchWorksheetData = async (spreadsheetId: string, sheetName: string) => {
    if (!accessToken) return;
    setIsFetchingData(true);
    setRawHeaders([]);
    setRawRows([]);
    setPreviewRecords([]);
    setValidationErrors([]);
    try {
      // Fetch maximum 1000 rows to ensure snappy UI responsiveness
      const range = `${encodeURIComponent(sheetName)}!A1:Z1000`;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to render workbook sheet values.");
      }

      const responseData = await response.json();
      const rows: string[][] = responseData.values || [];

      if (rows.length === 0) {
        throw new Error("No grid data found inside selected worksheet tab.");
      }

      const headers = rows[0];
      const remainingRows = rows.slice(1);

      setRawHeaders(headers);
      setRawRows(remainingRows);

      // Initialize mapping suggestions based on keyword similarity matching
      autoMapColumns(headers);
    } catch (err: any) {
      console.error("Fetch range data error:", err);
      setAuthError(err.message || "Failed to fetch spreadsheet rows.");
    } finally {
      setIsFetchingData(false);
    }
  };

  // Automatically suggestion mappings based on simple keywords
  const autoMapColumns = (headers: string[]) => {
    const freshMapping: Record<string, number> = {};
    const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Database core keys mapping presets
    const fieldsToMatch: Record<string, string[]> = {
      // Leads fields
      leadName: ["name", "leadname", "fullname", "contact", "person", "client"],
      email: ["email", "mail", "emailaddress"],
      phone: ["phone", "mobile", "cell", "telephone", "phone_number"],
      platform: ["platform", "channel", "source", "medium", "network"],
      notes: ["notes", "note", "leadsnotes", "comment", "remarks", "details"],
      status: ["status", "lead_status"],
      campaignName: ["campaign", "campaignname", "camp", "adname"],

      // Campaign Performance fields
      campaignPerfName: ["campaign", "campaignname", "campaign_name", "campaigns"],
      adsetName: ["adset", "adsetname", "ad_set_name", "category"],
      adAccountId: ["account", "accountid", "adaccount", "ad_account_id"],
      projectName: ["project", "projectname", "brand", "client"],
      leadsCount: ["leads", "conversions", "lead_count"],
      impressionsCount: ["impressions", "reach", "impression"],
      reachCount: ["reach", "reach_count"],
      clicksCount: ["clicks", "clickcount", "click_count"],
      spendAmount: ["spend", "amount", "budget", "cost", "amountspend"],
      svcCount: ["svc", "site_visits", "sitevisits"],
      bookedCount: ["booked", "bookings", "bookings_count"],

      // Target ledger fields
      month: ["month", "date", "period", "target_month"],
      targetBudget: ["budget", "targetbudget", "allocated_budget"],
      leadTarget: ["targetleads", "leads_target", "leadtarget"]
    };

    headers.forEach((hdr, idx) => {
      const cleanHdr = norm(hdr);
      Object.entries(fieldsToMatch).forEach(([key, list]) => {
        if (list.includes(cleanHdr) || list.some(item => cleanHdr.includes(item))) {
          if (freshMapping[key] === undefined) {
            freshMapping[key] = idx;
          }
        }
      });
    });

    setColumnMapping(freshMapping);
  };

  // Handle change in mapping dropdown
  const handleMapChange = (fieldKey: string, colIndex: number) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldKey]: colIndex
    }));
  };

  // Run dynamic row conversion & validation
  const handleRunValidation = () => {
    const errors: string[] = [];
    const formatted: any[] = [];

    if (rawRows.length === 0) {
      setValidationErrors(["No data rows present to compile."]);
      return;
    }

    rawRows.forEach((row, rowIdx) => {
      const realIndex = rowIdx + 2; // spreadsheet 1-indexed plus header offset
      
      const valOf = (fieldKey: string): string => {
        const colIdx = columnMapping[fieldKey];
        if (colIdx === undefined || colIdx >= row.length) return "";
        return (row[colIdx] || "").trim();
      };

      const valNumOf = (fieldKey: string, fallback: number = 0): number => {
        const str = valOf(fieldKey);
        if (!str) return fallback;
        const cleansed = str.replace(/[^0-9.]/g, "");
        const num = parseFloat(cleansed);
        return isNaN(num) ? fallback : num;
      };

      if (importType === "leads") {
        const leadName = valOf("leadName");
        const email = valOf("email");
        const phone = valOf("phone");
        
        if (!leadName) {
          errors.push(`Row ${realIndex}: "Lead Name" column value is missing.`);
          return;
        }

        const normStatus = valOf("status") || "New";
        const cleanStatus = ["New", "Contacted", "Negotiating", "Closed Won", "Closed Lost"].includes(normStatus)
          ? normStatus as Lead["status"]
          : "New";

        const newLead: Lead = {
          id: `lead-sheet-${Date.now()}-${rowIdx}`,
          leadName,
          email: email || `${normStatus.toLowerCase()}-placeholder@example.com`,
          phone: phone || "9999999999",
          platform: valOf("platform") || "Google Sheets Sync",
          status: cleanStatus,
          notes: valOf("notes") || `Synced from ${selectedFileName}`,
          createdAt: new Date().toISOString()
        };

        const campName = valOf("campaignName");
        if (campName) {
          newLead.campaignName = campName;
          const matchedCamp = campaigns.find(c => c.name.toLowerCase() === campName.toLowerCase());
          if (matchedCamp) {
            newLead.campaignId = matchedCamp.id;
          }
        }

        formatted.push(newLead);
      }

      else if (importType === "performance") {
        const campaignName = valOf("campaignPerfName");
        if (!campaignName) {
          errors.push(`Row ${realIndex}: "Campaign Name" key is missing.`);
          return;
        }

        const clicksVal = valNumOf("clicksCount");
        const spendVal = valNumOf("spendAmount");
        const calculatedCtr = spendVal > 0 ? (clicksVal / spendVal) * 100 : 0;

        const newPerf: CampaignPerformance = {
          id: `perf-sheet-${Date.now()}-${rowIdx}`,
          campaignName,
          adsetName: valOf("adsetName") || "General Base Group",
          adAccountId: valOf("adAccountId") || "ACT-SHEET-SYNC",
          projectName: valOf("projectName") || "Global Venture",
          leads: valNumOf("leadsCount"),
          impression: valNumOf("impressionsCount"),
          reach: valNumOf("reachCount") || valNumOf("impressionsCount") * 0.95,
          ctr: valNumOf("ctr") || calculatedCtr,
          amountSpend: spendVal,
          clicks: clicksVal,
          svc: valNumOf("svcCount"),
          booked: valNumOf("bookedCount"),
          createdAt: new Date().toISOString()
        };

        formatted.push(newPerf);
      }

      else if (importType === "targets") {
        const month = valOf("month");
        const project = valOf("projectName") || "Corporate Expansion";
        
        if (!month) {
          errors.push(`Row ${realIndex}: Period/Month column (YYYY-MM) is blank.`);
          return;
        }

        const newTarget: TargetBudgetRow = {
          id: `target-sheet-${Date.now()}-${rowIdx}`,
          month: month.includes("-") ? month.substring(0, 7) : month,
          project,
          medium: valOf("platform") || "Digital Channels",
          budget: valNumOf("targetBudget"),
          spend: valNumOf("spendAmount"),
          totalLeadTarget: valNumOf("leadTarget"),
          totalLeadAchieved: valNumOf("leadsCount"),
          digitalLeadTarget: Math.round(valNumOf("leadTarget") * 0.8),
          digitalLeadAchieved: Math.round(valNumOf("leadsCount") * 0.8),
          btlLeadTarget: Math.round(valNumOf("leadTarget") * 0.2),
          btlLeadAchieved: Math.round(valNumOf("leadsCount") * 0.2),
          leadAllocation: Math.round(valNumOf("leadsCount") * 0.9),
          siteVisit: valNumOf("svcCount"),
          booking: valNumOf("bookedCount"),
          week1: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
          week2: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
          week3: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
          week4: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
          week5: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
          createdAt: new Date().toISOString()
        };

        formatted.push(newTarget);
      }
    });

    setValidationErrors(errors);
    setPreviewRecords(formatted);
  };

  // Convert schema variable key to user friendly label
  const getSchemaFieldLabel = (key: string) => {
    switch(key) {
      case "leadName": return "Lead/Contact Name *";
      case "email": return "Email Address *";
      case "phone": return "Phone Number *";
      case "platform": return "Channel/Platform name";
      case "notes": return "Specific notes/Feedback";
      case "campaignName": return "Linked Campaign Name";
      case "status": return "Status (e.g. New, Contacted)";

      case "campaignPerfName": return "Campaign Name *";
      case "adsetName": return "Ad Set Category";
      case "adAccountId": return "Ad Account ID Code";
      case "projectName": return "Active Project Name";
      case "leadsCount": return "Conversions / Leads *";
      case "impressionsCount": return "Total Impressions *";
      case "reachCount": return "Total Reach";
      case "clicksCount": return "Clicks count";
      case "spendAmount": return "Total Spend / Cost *";
      case "svcCount": return "Site Visits Scheduled/Conducted";
      case "bookedCount": return "Bookings Saved";

      case "month": return "Month (YYYY-MM) *";
      case "targetBudget": return "Allocated Monthly Budget *";
      case "leadTarget": return "Leads Milestone Target *";
      default: return key;
    }
  };

  // Select core mapping keys depending on active target schema
  const getMappingKeys = () => {
    if (importType === "leads") {
      return ["leadName", "email", "phone", "campaignName", "platform", "status", "notes"];
    } else if (importType === "performance") {
      return ["campaignPerfName", "adsetName", "adAccountId", "projectName", "leadsCount", "impressionsCount", "reachCount", "clicksCount", "spendAmount", "svcCount", "bookedCount"];
    } else {
      return ["month", "projectName", "platform", "targetBudget", "spendAmount", "leadTarget", "leadsCount", "svcCount", "bookedCount"];
    }
  };

  // Process data injection back to dataService hooks
  const handleCommitImport = async () => {
    if (previewRecords.length === 0) return;
    
    // Explicit user authorization confirmation
    const confirmed = window.confirm(
      `Confirm pulling ${previewRecords.length} records dynamically into active database systems? Existing matching values will compile safely.`
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      if (importType === "leads") {
        await onImportLeads(previewRecords);
      } else if (importType === "performance") {
        await onImportPerformance(previewRecords);
      } else if (importType === "targets") {
        await onImportTargets(previewRecords);
      }

      // Record in Change Log Ledger if present
      if (onSaveChangeLog) {
        await onSaveChangeLog({
          id: `log-sheets-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          project: "Google Sheets Sync",
          campaignId: "all",
          campaignName: "Multiple Groups",
          adSetName: "Google Workspace Integration",
          campaignStatus: "active",
          type: "Google Workspace Spreadsheet Sync",
          changed: `Imported ${previewRecords.length} items from worksheet "${selectedTab}" of "${selectedFileName}" into database storage collections.`,
          reason: `Automated records ingestion requested, targeting schema class: ${importType.toUpperCase()}.`,
          createdAt: new Date().toISOString()
        });
      }

      setImportSuccessMessage(
        `Successfully imported ${previewRecords.length} items into local/live databases. Operation logged in optimizations ledger.`
      );
      
      // Clear selections
      setRawHeaders([]);
      setRawRows([]);
      setPreviewRecords([]);
      setColumnMapping({});
    } catch (err: any) {
      console.error("Import ingestion failed:", err);
      setAuthError(err.message || "Failed during transactional database write.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/50 uppercase tracking-wider mb-1 font-mono">
            <Cloud size={11} className="text-emerald-600 animate-pulse" />
            Google Sheets Workspace Connection
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Real-Time Spreadsheet Sync Utility
          </h2>
          <p className="text-xs text-slate-500 leading-normal">
            Eliminate tedious manual transfers. Import team contact leads, actual ad campaign performance, or monthly budgets directly from any shared Google Sheet safely.
          </p>
        </div>

        {googleUser && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-150 p-2 rounded-xl shrink-0">
            <img
              src={googleUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt="Google User"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-slate-250 bg-white"
            />
            <div className="text-left leading-none">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-650 block text-emerald-600">CONNECTED</span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">{googleUser.displayName || googleUser.email}</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="Disconnect Account"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-start gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Sync Transaction Authorized:</span>
            <p className="mt-0.5 text-emerald-700">{importSuccessMessage}</p>
          </div>
          <button
            onClick={() => setImportSuccessMessage(null)}
            className="text-[10px] font-bold text-emerald-800 underline uppercase"
          >
            Acknowledge
          </button>
        </div>
      )}

      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2.5 animate-fade-in">
          <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Google Auth Inquiries:</span>
            <p className="mt-0.5 text-rose-700">{authError}</p>
          </div>
        </div>
      )}

      {/* Connection & Setup Flow Panel if NOT linked */}
      {!accessToken ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-6 max-w-xl mx-auto py-12">
          <FileSpreadsheet className="w-14 h-14 text-indigo-600 mx-auto animate-bounce" />
          
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-900">Authorize Google Account Connection</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Google Workspace permissions are required to scan sheets in your Google Drive or access cells from a shared link safely.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleConnectGoogle}
              disabled={isAuthenticating}
              className="inline-flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-lg shadow-xs cursor-pointer transition-all disabled:opacity-50 text-xs font-mono"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                  <span>Configuring integration brand...</span>
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span className="font-sans font-bold">Connect Google Sheets Account</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Lock size={11} />
            <span>Secure SSL encryption. Permissions are transient & kept in-memory.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SEC 1: Pick Resource spreadsheet */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">1. Select Data Source</h3>
                <span className="text-[10px] text-slate-500">Pick spreadsheet files from your Drive account</span>
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => { setSourceType("drive"); setPastedUrl(""); }}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${sourceType === "drive" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"}`}
                >
                  Drive List
                </button>
                <button
                  onClick={() => { setSourceType("url"); setSelectedFileId(""); }}
                  className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${sourceType === "url" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500"}`}
                >
                  Custom Link
                </button>
              </div>
            </div>

            {sourceType === "drive" ? (
              <div className="space-y-3 text-xs">
                <label className="block text-slate-600 font-bold">Files Found in Google Drive</label>
                {isLoadingFiles ? (
                  <div className="py-6 text-center space-y-1 text-slate-400">
                    <RefreshCw className="animate-spin w-5 h-5 mx-auto text-indigo-505 text-indigo-500" />
                    <span>Indexing active files...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="py-6 text-center border rounded-lg bg-slate-50 space-y-2">
                    <p className="text-[11px] text-slate-400">No spreadsheets detected in Root folders.</p>
                    <button
                      onClick={() => fetchDriveSpreadsheets(accessToken)}
                      className="text-[10px] font-extrabold text-indigo-650 text-indigo-600 uppercase flex items-center gap-1 mx-auto underline"
                    >
                      Retry Discovery Search
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {driveFiles.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFileId(f.id)}
                        className={`w-full text-left p-2 rounded-lg border flex items-center justify-between text-[11px] transition-all cursor-pointer ${
                          selectedFileId === f.id
                            ? "bg-indigo-600/5 text-indigo-950 border-indigo-400 ring-1 ring-indigo-400 font-semibold"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">
                          {new Date(f.modifiedTime).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Paste Spreadsheet Shared URL *</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvGNB_dGRSgX789/edit"
                    value={pastedUrl}
                    onChange={(e) => setPastedUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs bg-white outline-hidden"
                  />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-[10.5px] text-slate-500">
                  <span className="font-bold text-slate-700">Link Access Rule:</span> Ensure the spreadsheet is marked as "Anyone with link can view" or shared directly with your email to grant read operations.
                </div>
              </div>
            )}

            <button
              onClick={handleResolveSpreadsheet}
              disabled={isLoadingTabs || (!selectedFileId && !pastedUrl)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
            >
              {isLoadingTabs ? (
                <>
                  <RefreshCw className="animate-spin text-white" size={13} />
                  <span>Loading structures...</span>
                </>
              ) : (
                <>
                  <Search size={13} />
                  <span>Fetch Worksheet Tabs</span>
                </>
              )}
            </button>

            {/* Render worksheets dropdown if loaded */}
            {worksheetTabs.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs animate-fade-in">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">2. Select Active Worksheet (Tab)</label>
                  <select
                    value={selectedTab}
                    onChange={(e) => {
                      setSelectedTab(e.target.value);
                      const fileId = sourceType === "drive" ? selectedFileId : extractSpreadsheetId(pastedUrl);
                      if (fileId) fetchWorksheetData(fileId, e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs bg-white cursor-pointer outline-hidden focus:border-indigo-500"
                  >
                    {worksheetTabs.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">3. Ingest Target Database Schema</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setImportType("leads"); setPreviewRecords([]); }}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        importType === "leads"
                          ? "bg-indigo-55 bg-indigo-50/60 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <Users size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="text-[10px]">Contact Leads</span>
                    </button>
                    <button
                      onClick={() => { setImportType("performance"); setPreviewRecords([]); }}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        importType === "performance"
                          ? "bg-indigo-50/60 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <TrendingUp size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="text-[10px]">Perf Metrics</span>
                    </button>
                    <button
                      onClick={() => { setImportType("targets"); setPreviewRecords([]); }}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        importType === "targets"
                          ? "bg-indigo-50/60 border-indigo-400 text-indigo-950 font-bold"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      <Coins size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="text-[10px]">Target Budgets</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEC 2: Column mapping & Preview */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Column Mapping Configuration */}
            {rawHeaders.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">4. Align Spreadsheet Mappings</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    We scanned <strong className="text-slate-800">{rawHeaders.length} columns</strong> and <strong className="text-slate-800">{rawRows.length} rows</strong> in "{selectedTab}". Match sheet columns to the webapp database requirements below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {getMappingKeys().map((mappingKey) => {
                    const mappedValue = columnMapping[mappingKey];
                    return (
                      <div key={mappingKey} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs gap-3">
                        <span className="font-bold text-slate-700 block truncate leading-tight">
                          {getSchemaFieldLabel(mappingKey)}
                        </span>
                        
                        <select
                          value={mappedValue === undefined ? "" : mappedValue.toString()}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleMapChange(mappingKey, val === "" ? -1 : parseInt(val));
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 outline-hidden max-w-[150px] truncate cursor-pointer"
                        >
                          <option value="">-- Choose Column --</option>
                          {rawHeaders.map((hdr, hIdx) => (
                            <option key={hdr + hIdx} value={hIdx}>
                              Col {String.fromCharCode(65 + hIdx)}: "{hdr}"
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[10.5px] text-slate-500 font-mono">
                    Workbook Source: {selectedFileName} ({selectedTab})
                  </span>
                  <button
                    onClick={handleRunValidation}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto shadow-xs"
                  >
                    <Grid size={13} />
                    <span>Run Data Grid Validation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Validation Errors block */}
            {validationErrors.length > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl space-y-1.5 animate-fade-in text-xs max-h-[160px] overflow-y-auto">
                <div className="font-extrabold text-rose-950 flex items-center gap-1">
                  <AlertCircle size={14} className="text-rose-600" />
                  <span>Validation Warning Notes:</span>
                </div>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-[11px] text-rose-800 font-mono leading-normal">
                  {validationErrors.slice(0, 10).map((err, errIdx) => (
                    <li key={errIdx}>{err}</li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li>...and {validationErrors.length - 10} more warning flags. Take action to clean columns.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview and Commit block */}
            {previewRecords.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">5. Aligned Records Compile Preview</h3>
                    <span className="text-[10px] text-slate-400">Review mapped schema objects before active database write</span>
                  </div>
                  
                  <button
                    onClick={handleCommitImport}
                    disabled={isImporting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="animate-spin text-white" size={13} />
                        <span>Injecting values...</span>
                      </>
                    ) : (
                      <>
                        <Database size={13} />
                        <span>Authorize Sheets Ingestion ({previewRecords.length} Rows)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Grid tabular preview depending on active import group */}
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-650 min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase font-mono">
                        <th className="p-3 pl-4">Col Row</th>
                        {importType === "leads" ? (
                          <>
                            <th className="p-3">Matched Contact Name</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3">Phone Line</th>
                            <th className="p-3">Origin network</th>
                            <th className="p-3 pr-4">Status Map</th>
                          </>
                        ) : importType === "performance" ? (
                          <>
                            <th className="p-3">Campaign Name</th>
                            <th className="p-3 text-center">Incurred Cost</th>
                            <th className="p-3 text-center">Conversions</th>
                            <th className="p-3 text-center">Clicks count</th>
                            <th className="p-3 text-center pr-4">Site visits</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3">Year period</th>
                            <th className="p-3">Target Project</th>
                            <th className="p-3 text-right">Target budget</th>
                            <th className="p-3 text-right">Target Leads</th>
                            <th className="p-3 text-right pr-4">Bookings</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {previewRecords.slice(0, 5).map((rec, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 font-mono font-bold text-slate-400">#{rIdx + 1}</td>
                          {importType === "leads" ? (
                            <>
                              <td className="p-3 font-extrabold text-slate-905 text-slate-900">{rec.leadName}</td>
                              <td className="p-3 font-mono text-slate-500">{rec.email}</td>
                              <td className="p-3">{rec.phone}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{rec.platform}</span>
                              </td>
                              <td className="p-3 pr-4">
                                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150">
                                  {rec.status}
                                </span>
                              </td>
                            </>
                          ) : importType === "performance" ? (
                            <>
                              <td className="p-3 font-extrabold text-slate-900">{rec.campaignName}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-700">₹{rec.amountSpend.toLocaleString()}</td>
                              <td className="p-3 text-center font-mono text-emerald-600 font-bold">{rec.leads}</td>
                              <td className="p-3 text-center font-mono">{rec.clicks}</td>
                              <td className="p-3 text-center pr-4 font-mono font-bold">{rec.svc || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-extrabold text-slate-900">{rec.month}</td>
                              <td className="p-3">{rec.project}</td>
                              <td className="p-3 text-right font-mono text-emerald-700 font-bold">₹{rec.budget.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono text-indigo-650 font-bold">{rec.totalLeadTarget}</td>
                              <td className="p-3 text-right pr-4 font-mono text-slate-700">{rec.booking || 0}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {previewRecords.length > 5 && (
                  <p className="text-[11px] text-slate-400 text-center italic">
                    Showing top 5 rows. There are {previewRecords.length - 5} additional successfully aligned records queued below.
                  </p>
                )}
              </div>
            )}

            {/* Empty selection layout */}
            {rawHeaders.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3 bg-white">
                <FileSpreadsheet className="mx-auto text-slate-350 text-slate-300 animate-spin-slow" size={38} />
                <p className="text-slate-400 max-w-sm mx-auto text-xs leading-normal font-sans">
                  Choose a shared file or paste a worksheet link, then launch the tabs details extractor to configure parameters coordinates mapping.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
