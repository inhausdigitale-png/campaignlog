import React, { useState, useEffect } from "react";
import { Campaign, AuditLog, Lead, CreativeAsset, CampaignReport, MetricComparison, ChangeLogEntry, PortalReportRow, TargetBudgetRow, RuleConfiguration, SimulatedRoleType, CampaignPerformance } from "./types";
import { dataService } from "./services/dataService";
import { isFirebaseEnabled, isFirebaseConfigured, auth } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ROLE_PERMISSIONS } from "./utils/indiaHelpers";
import Dashboard from "./components/Dashboard";
import CampaignList from "./components/CampaignList";
import LeadPortal from "./components/LeadPortal";
import CreativeHub from "./components/CreativeHub";
import PortalReportModule from "./components/PortalReportModule";
import TargetBudgetLedger from "./components/TargetBudgetLedger";
import RuleConfigPanel from "./components/RuleConfigPanel";
import CampaignPerformanceTracker from "./components/CampaignPerformanceTracker";
import DownloadReportsHub from "./components/DownloadReportsHub";
import OnboardingGuide from "./components/OnboardingGuide";
import AIHub from "./components/AIHub";
import GoogleSheetsSync from "./components/GoogleSheetsSync";
import {
  Sparkles,
  LayoutDashboard,
  Megaphone,
  Briefcase,
  Users,
  History,
  LogIn,
  LogOut,
  Workflow,
  CloudCheck,
  ServerCrash,
  Coins,
  ShieldAlert,
  HardDriveDownload,
  Database,
  Mail,
  Globe,
  Sliders,
  Shield,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";


export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "campaigns" | "creatives" | "leads" | "portals" | "targets" | "rules" | "performance" | "download_reports" | "ai" | "sheets_sync">("dashboard");

  // Simulated Roles & Permissions state
  const [userRole, setUserRole] = useState<SimulatedRoleType>(() => {
    const saved = localStorage.getItem("simulated_user_role");
    return (saved as SimulatedRoleType) || "Admin";
  });
  const [bypassSecurity, setBypassSecurity] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem("simulated_user_role", userRole);
  }, [userRole]);

  const rawRolePermission = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.Admin;
  const currentRolePermission = bypassSecurity
    ? {
        role: rawRolePermission.role,
        label: `${rawRolePermission.label} (Testing Mode - Unrestricted)`,
        description: "Testing mode is active: all client-side restriction features are fully unlocked.",
        canCreateCampaigns: true,
        canEditCampaigns: true,
        canDeleteCampaigns: true,
        canCreateCreatives: true,
        canDeleteCreatives: true,
        canAnalyzeCreatives: true,
        canManageLeads: true,
        canDeleteLeads: true,
        canManageTargets: true,
        canDeleteTargets: true,
        canManageRules: true
      }
    : rawRolePermission;

  // Databases States
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [creatives, setCreatives] = useState<CreativeAsset[]>([]);
  const [campaignReports, setCampaignReports] = useState<CampaignReport[]>([]);
  const [metricComparisons, setMetricComparisons] = useState<MetricComparison[]>([]);
  const [changeLogEntries, setChangeLogEntries] = useState<ChangeLogEntry[]>([]);
  const [portalReports, setPortalReports] = useState<PortalReportRow[]>([]);
  const [targetBudgets, setTargetBudgets] = useState<TargetBudgetRow[]>([]);
  const [ruleSetting, setRuleSetting] = useState<RuleConfiguration | null>(null);
  const [campaignPerformances, setCampaignPerformances] = useState<CampaignPerformance[]>([]);
  const [portalSubTab, setPortalSubTab] = useState<"pivot" | "database">("pivot");

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isFirebaseConfigured);
  const [loading, setLoading] = useState<boolean>(true);

  // Load database snapshots
  const loadAllDatabaseStates = async () => {
    try {
      setLoading(true);
      const [cRes, aRes, lRes, crRes, rRes, comRes, chgRes, pRes, tRes, sRes, perfRes] = await Promise.all([
        dataService.getCampaigns(),
        dataService.getAuditLogs(),
        dataService.getLeads(),
        dataService.getCreatives(),
        dataService.getCampaignReports(),
        dataService.getMetricComparisons(),
        dataService.getChangeLogEntries(),
        dataService.getPortalReports(),
        dataService.getTargetBudgets(),
        dataService.getRuleConfiguration(),
        dataService.getCampaignPerformances(),
      ]);

      setCampaigns(cRes || []);
      setAuditLogs(aRes || []);
      setLeads(lRes || []);
      setCreatives(crRes || []);
      setCampaignReports(rRes || []);
      setMetricComparisons(comRes || []);
      setChangeLogEntries(chgRes || []);
      setPortalReports(pRes || []);
      setTargetBudgets(tRes || []);
      setRuleSetting(sRes || null);
      setCampaignPerformances(perfRes || []);
    } catch (err) {
      console.error("Failed to load records state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let authTimeout: any;
    if (!isFirebaseConfigured) {
      loadAllDatabaseStates();
    } else if (auth) {
      // Robust responsive fail-safe timeout for sandbox iframe iframe cookie blocks
      authTimeout = setTimeout(() => {
        console.warn("[AUTH] State resolution took too long. Initializing workspace directly in Sandbox mode.");
        setAuthLoading(false);
        loadAllDatabaseStates();
      }, 1500);

      const unsubscribe = auth.onAuthStateChanged((currUser: any) => {
        if (authTimeout) clearTimeout(authTimeout);
        setUser(currUser);
        setAuthLoading(false);
        // Load whatever state is active dynamically (Cloud if user is active, Local Sandbox if null)
        loadAllDatabaseStates();
      });
      
      return () => {
        if (authTimeout) clearTimeout(authTimeout);
        unsubscribe();
      };
    }
  }, []);

  const handleSaveCampaignPerformance = async (perf: CampaignPerformance) => {
    await dataService.saveCampaignPerformance(perf);
    await loadAllDatabaseStates();
  };

  const handleDeleteCampaignPerformance = async (id: string) => {
    await dataService.deleteCampaignPerformance(id);
    await loadAllDatabaseStates();
  };

  // Action: Campaign Saving
  const handleSaveCampaign = async (campaign: Campaign) => {
    const operatorEmail = user?.email || "anonymous_sandbox@example.com";
    if (campaign.id.startsWith("perf-")) {
      const originalPerf = campaignPerformances.find(p => p.id === campaign.id);
      if (originalPerf) {
        const updatedPerf: CampaignPerformance = {
          ...originalPerf,
          campaignName: campaign.name,
          amountSpend: campaign.spend,
          leads: campaign.conversions,
          clicks: campaign.clicks,
          impression: campaign.impressions,
        };
        await dataService.saveCampaignPerformance(updatedPerf);
      }
    } else {
      await dataService.saveCampaign(campaign, operatorEmail);
    }
    await loadAllDatabaseStates(); // reload state maps
  };

  // Action: Campaign Deletion
  const handleDeleteCampaign = async (id: string, name: string) => {
    const operatorEmail = user?.email || "anonymous_sandbox@example.com";
    if (id.startsWith("perf-")) {
      await dataService.deleteCampaignPerformance(id);
    } else {
      await dataService.deleteCampaign(id, name, operatorEmail);
    }
    await loadAllDatabaseStates();
  };

  // Action: Lead saving
  const handleSaveLead = async (lead: Lead) => {
    await dataService.saveLead(lead);
    await loadAllDatabaseStates();
  };

  // Action: Lead deletion
  const handleDeleteLead = async (id: string) => {
    await dataService.deleteLead(id);
    await loadAllDatabaseStates();
  };

  // Action: Creative saving
  const handleSaveCreative = async (creative: CreativeAsset) => {
    await dataService.saveCreative(creative);
    await loadAllDatabaseStates();
  };

  // Action: Creative deletion
  const handleDeleteCreative = async (id: string) => {
    await dataService.deleteCreative(id);
    await loadAllDatabaseStates();
  };

  const handleSaveCampaignReport = async (rep: CampaignReport) => {
    await dataService.saveCampaignReport(rep);
    await loadAllDatabaseStates();
  };

  const handleDeleteCampaignReport = async (id: string) => {
    await dataService.deleteCampaignReport(id);
    await loadAllDatabaseStates();
  };

  const handleSaveMetricComparison = async (comp: MetricComparison) => {
    await dataService.saveMetricComparison(comp);
    await loadAllDatabaseStates();
  };

  const handleDeleteMetricComparison = async (id: string) => {
    await dataService.deleteMetricComparison(id);
    await loadAllDatabaseStates();
  };

  const handleSaveChangeLogEntry = async (chg: ChangeLogEntry) => {
    await dataService.saveChangeLogEntry(chg);
    await loadAllDatabaseStates();
  };

  const handleDeleteChangeLogEntry = async (id: string) => {
    await dataService.deleteChangeLogEntry(id);
    await loadAllDatabaseStates();
  };

  // Action: Portal Row CRUD
  const handleSavePortalReport = async (row: PortalReportRow) => {
    await dataService.savePortalReport(row);
    await loadAllDatabaseStates();
  };

  const handleDeletePortalReport = async (id: string) => {
    await dataService.deletePortalReport(id);
    await loadAllDatabaseStates();
  };

  // Action: Target Budget CRUD
  const handleSaveTargetBudget = async (row: TargetBudgetRow) => {
    await dataService.saveTargetBudget(row);
    await loadAllDatabaseStates();
  };

  const handleDeleteTargetBudget = async (id: string) => {
    await dataService.deleteTargetBudget(id);
    await loadAllDatabaseStates();
  };

  // Action: Rules SLA update
  const handleSaveRuleConfiguration = async (rule: RuleConfiguration) => {
    await dataService.saveRuleConfiguration(rule);
    await loadAllDatabaseStates();
  };

  // Action: Bulk Google Sheet Imports
  const handleImportLeads = async (importedLeads: Lead[]) => {
    for (const l of importedLeads) {
      await dataService.saveLead(l);
    }
    await loadAllDatabaseStates();
  };

  const handleImportPerformance = async (importedPerf: CampaignPerformance[]) => {
    for (const p of importedPerf) {
      await dataService.saveCampaignPerformance(p);
    }
    await loadAllDatabaseStates();
  };

  const handleImportTargets = async (importedTargets: TargetBudgetRow[]) => {
    for (const t of importedTargets) {
      await dataService.saveTargetBudget(t);
    }
    await loadAllDatabaseStates();
  };

  // Authenticators
  const handleGoogleSignIn = async () => {
    if (!isFirebaseEnabled || !auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Popup Auth failed:", error);
    }
  };

  const handleSignOut = async () => {
    if (!isFirebaseEnabled || !auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const mappedPerformanceCampaigns: Campaign[] = (campaignPerformances || [])
    .filter(perf => perf && perf.campaignName)
    .map((perf) => {
      let platform: Campaign["platform"] = "Google Ads";
      const nameLower = (perf.campaignName || "").toLowerCase();
      if (nameLower.includes("meta") || nameLower.includes("facebook") || nameLower.includes("insta")) {
        platform = "Meta (Facebook)";
      } else if (nameLower.includes("linkedin")) {
        platform = "LinkedIn";
      } else if (nameLower.includes("tiktok")) {
        platform = "TikTok";
      } else if (nameLower.includes("youtube")) {
        platform = "YouTube";
      }
      return {
        id: perf.id,
        name: perf.campaignName,
        status: "active" as const,
        platform,
        budget: perf.amountSpend || 0,
        spend: perf.amountSpend || 0,
        conversions: perf.leads || 0,
        clicks: perf.clicks || 0,
        impressions: perf.impression || 0,
        startDate: perf.createdAt && typeof perf.createdAt === "string" ? perf.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        endDate: perf.createdAt && typeof perf.createdAt === "string" ? perf.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        objectives: `Project: ${perf.projectName || "Default"} | Adset: ${perf.adsetName || "Default"} (Uploaded)`,
        createdAt: perf.createdAt || new Date().toISOString(),
        updatedAt: perf.createdAt || new Date().toISOString(),
      };
    });
  const mergedCampaigns = [...campaigns, ...mappedPerformanceCampaigns];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Upper Navigation & Status Banner Bar */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold font-display shadow-sm">
              <Workflow size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display leading-none text-slate-900 tracking-tight">
                Campaign Intelligence
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold font-display">
                &amp; Logging Copilot
              </span>
            </div>
          </div>

          {/* Database Mode status + Google authentication block */}
          <div className="flex items-center gap-3.5">
            {/* Highly Polished Simulated Role Selection dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 flex-shrink-0">
              <Shield size={14} className="text-indigo-600 animate-pulse shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Role</span>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as SimulatedRoleType)}
                  className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1 py-0.5 leading-tight"
                >
                  <option value="Admin">🛡️ Super Admin</option>
                  <option value="CampaignManager">📣 Campaign Manager</option>
                  <option value="LeadAgent">👥 Sales Lead Agent</option>
                  <option value="Auditor">👁️ View-Only Auditor</option>
                </select>
              </div>
            </div>

            {/* Security Bypass Button for Testing */}
            <button
              onClick={() => setBypassSecurity(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                bypassSecurity
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-[#FEF3C7]"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
              title={bypassSecurity ? "Client security is completely relaxed. Click to enable restrictions." : "Security checks active. Click to bypass restrictions for debugging."}
            >
              <ShieldAlert size={14} className={bypassSecurity ? "text-amber-500 animate-pulse" : "text-slate-400"} />
              <span>{bypassSecurity ? "Bypass: Active" : "Bypass: Inactive"}</span>
            </button>

            {isFirebaseEnabled && user ? (
              <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-750 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CloudCheck size={12} className="text-emerald-500 animate-pulse" />
                <span>Cloud Sync Connected</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Database size={11} className="text-amber-500" />
                <span>Sandbox Mode (Offline Local)</span>
              </div>
            )}

            {/* Firebase Auth details */}
            {isFirebaseEnabled && auth && (
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-bold text-slate-800 leading-none">{user.displayName}</div>
                      <span className="text-[9px] text-slate-400 leading-none">{user.email}</span>
                    </div>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile avatar"
                        className="w-8 h-8 rounded-full border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-display">
                        {user.displayName?.[0] || "U"}
                      </div>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="p-1 px-2 border border-slate-200 hover:text-rose-500 hover:border-rose-100 rounded text-[11px] font-semibold cursor-pointer transition-all"
                      title="Log Out User"
                    >
                      <LogOut size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 font-bold text-xs text-white px-3.5 py-1.5 rounded-lg shadow-sm font-display transition-all cursor-pointer"
                  >
                    <LogIn size={13} />
                    Google Login
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main layout frame */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar Panel */}
        <aside className="w-full md:w-60 shrink-0 self-start space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-display block mb-3 pl-2">
              Main Menu
            </span>
            <nav className="space-y-1 text-xs font-medium text-slate-600">
              {/* Dashboard btn */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>

              {/* Campaigns Manager btn */}
              <button
                onClick={() => setActiveTab("campaigns")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "campaigns"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Megaphone size={16} />
                <span>Campaigns</span>
              </button>

              {/* Creative Hub btn */}
              <button
                onClick={() => setActiveTab("creatives")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "creatives"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Briefcase size={16} />
                <span>Creative Performance</span>
              </button>

              {/* AI Hub btn */}
              <button
                onClick={() => setActiveTab("ai")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sparkles size={16} />
                <span>AI</span>
              </button>

              {/* Portal Leads btn */}
              <button
                onClick={() => setActiveTab("portals")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "portals"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users size={16} />
                <span>Portal Leads</span>
              </button>

              {/* Exclusive Download Reports btn */}
              <button
                onClick={() => setActiveTab("download_reports")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "download_reports"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <HardDriveDownload size={16} />
                <span>Download Reports</span>
              </button>

              {/* Google Sheets Sync btn */}
              <button
                onClick={() => setActiveTab("sheets_sync")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "sheets_sync"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>Google Sheets Sync</span>
              </button>

              {/* Campaign Upload & Change Log btn */}
              <button
                onClick={() => setActiveTab("performance")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "performance"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <TrendingUp size={16} />
                <span>Campaign Upload &amp; Change Log</span>
              </button>

              {/* Weekly Target Ledger btn */}
              <button
                onClick={() => setActiveTab("targets")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "targets"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Coins size={16} />
                <span>Weekly Target Ledger</span>
              </button>

              {/* Rule Configuration btn */}
              <button
                onClick={() => setActiveTab("rules")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "rules"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sliders size={16} />
                <span>Rule Configuration</span>
              </button>
            </nav>
          </div>

          {/* Active Security Permissions Status Panel */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-left">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 font-sans mb-2">
              <Shield size={14} className="text-indigo-650 text-indigo-600" />
              <span className="text-xs uppercase tracking-wider">Active Sandbox Policy</span>
            </div>
            <h4 className="font-bold text-slate-900 font-sans text-xs">{currentRolePermission.label}</h4>
            <p className="text-slate-500 mt-1 text-[10.5px] leading-relaxed">
              {currentRolePermission.description}
            </p>
            <div className="mt-3.5 pt-2.5 border-t border-slate-150 font-mono text-[9.5px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Create Campaigns:</span>
                <span className={currentRolePermission.canCreateCampaigns ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {currentRolePermission.canCreateCampaigns ? "ALLOWED" : "DENIED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delete Records:</span>
                <span className={currentRolePermission.canDeleteCampaigns ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {currentRolePermission.canDeleteCampaigns ? "ALLOWED" : "DENIED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>SLA Target Edit:</span>
                <span className={currentRolePermission.canManageTargets ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {currentRolePermission.canManageTargets ? "ALLOWED" : "DENIED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rule Changes:</span>
                <span className={currentRolePermission.canManageRules ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                  {currentRolePermission.canManageRules ? "ALLOWED" : "DENIED"}
                </span>
              </div>
            </div>
          </div>

          {/* Sandbox Info badge for client user education */}
          {!isFirebaseEnabled && (
            <div className="bg-amber-50 border border-amber-200/60 p-4.5 rounded-2xl text-[11px] text-amber-800 space-y-2 leading-relaxed shadow-xs">
              <div className="flex items-center gap-1 font-bold text-amber-900 font-display">
                <Database size={13} className="text-amber-600" />
                <span>Local Sandbox persistence Active</span>
              </div>
              <p>
                All campaigns, change logs, and visual creatives persist durably inside your browser's local sandbox storage context.
              </p>
              <div className="text-[10px] text-amber-700/90 font-medium">
                Once Firebase terms are accepted in the credentials panel, database sync switches automatically to active cloud instances.
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Inner Panel Body */}
        <main className="flex-1 min-w-0">
          {authLoading || loading ? (
            <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-semibold font-display text-slate-600">Reticulating database connections...</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <OnboardingGuide onNavigate={setActiveTab} />
              {activeTab === "dashboard" && (
                <Dashboard 
                  campaigns={campaigns} 
                  campaignPerformances={campaignPerformances}
                  onSavePerformance={handleSaveCampaignPerformance}
                />
              )}
              {activeTab === "campaigns" && (
                <CampaignList
                  campaigns={mergedCampaigns}
                  creatives={creatives}
                  onSaveCampaign={handleSaveCampaign}
                  onDeleteCampaign={handleDeleteCampaign}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                  onDeleteChangeLog={handleDeleteChangeLogEntry}
                  changeLogs={changeLogEntries}
                  comparisons={metricComparisons}
                  onSaveComparison={handleSaveMetricComparison}
                  onDeleteComparison={handleDeleteMetricComparison}
                />
              )}
              {activeTab === "creatives" && (
                <CreativeHub
                  creatives={creatives}
                  campaigns={mergedCampaigns}
                  onSaveCreative={handleSaveCreative}
                  onDeleteCreative={handleDeleteCreative}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                />
              )}
              {activeTab === "ai" && (
                <AIHub
                  creatives={creatives}
                  campaigns={mergedCampaigns}
                  onSaveCreative={handleSaveCreative}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                />
              )}
              {activeTab === "download_reports" && (
                <DownloadReportsHub
                  campaigns={mergedCampaigns}
                  leads={leads}
                  portalReports={portalReports}
                  targetBudgets={targetBudgets}
                  creatives={creatives}
                  metricComparisons={metricComparisons}
                  campaignReports={campaignReports}
                />
              )}
              {activeTab === "portals" && (
                <div className="space-y-6 animate-fade-in" id="portal-leads-module-container">
                  {/* Outer Premium Nav Sub-Tabs inside Portal Leads View */}
                  <div className="bg-white border border-slate-200/85 p-1 rounded-xl shadow-xs flex select-none max-w-2xl">
                    <button
                      type="button"
                      onClick={() => setPortalSubTab("pivot")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        portalSubTab === "pivot"
                          ? "bg-indigo-650 text-white shadow-sm bg-indigo-600"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/70"
                      }`}
                    >
                      <TrendingUp size={14} />
                      <span>Daily Site Visits (SVC) Matrix</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalSubTab("database")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        portalSubTab === "database"
                          ? "bg-indigo-650 text-white shadow-sm bg-indigo-600"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/70"
                      }`}
                    >
                      <Database size={14} />
                      <span>Profile Database (CSV Import Option)</span>
                    </button>
                  </div>

                  {portalSubTab === "pivot" ? (
                    <PortalReportModule
                      portalReports={portalReports}
                      onSaveReport={handleSavePortalReport}
                      onDeleteReport={handleDeletePortalReport}
                    />
                  ) : (
                    <LeadPortal
                      leads={leads}
                      campaigns={mergedCampaigns}
                      onSaveLead={handleSaveLead}
                      onDeleteLead={handleDeleteLead}
                    />
                  )}
                </div>
              )}
              {activeTab === "targets" && (
                <TargetBudgetLedger
                  targets={targetBudgets}
                  onSaveTarget={handleSaveTargetBudget}
                  onDeleteTarget={handleDeleteTargetBudget}
                  rolePermission={currentRolePermission}
                />
              )}
              {activeTab === "rules" && (
                <RuleConfigPanel
                  ruleSetting={ruleSetting}
                  campaigns={mergedCampaigns}
                  onSaveRule={handleSaveRuleConfiguration}
                  rolePermission={currentRolePermission}
                />
              )}
              {activeTab === "performance" && (
                <CampaignPerformanceTracker
                  performances={campaignPerformances}
                  onSavePerformance={handleSaveCampaignPerformance}
                  onDeletePerformance={handleDeleteCampaignPerformance}
                  rolePermission={currentRolePermission}
                  changeLogs={changeLogEntries}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                  onDeleteChangeLog={handleDeleteChangeLogEntry}
                />
              )}
              {activeTab === "sheets_sync" && (
                <GoogleSheetsSync
                  campaigns={mergedCampaigns}
                  onImportLeads={handleImportLeads}
                  onImportPerformance={handleImportPerformance}
                  onImportTargets={handleImportTargets}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-150 py-4.5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center text-[11.5px] text-slate-400 font-medium">
          <p>© 2026 Google AI Studio Build. Campaign Tracking & Trace-Reporting Dashboard.</p>
          <p className="mt-1.5 sm:mt-0 font-display">Crafted in high-contrast professional slate layout</p>
        </div>
      </footer>
    </div>
  );
}
