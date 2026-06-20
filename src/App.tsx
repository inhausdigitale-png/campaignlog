import React, { useState, useEffect } from "react";
import { Campaign, AuditLog, Lead, CreativeAsset, CampaignReport, MetricComparison, ChangeLogEntry, PortalReportRow, TargetBudgetRow, RuleConfiguration, SimulatedRoleType, CampaignPerformance, UserRolePermission, Invite, DailySpendEntry } from "./types";
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
import UserRolesSettings from "./components/UserRolesSettings";
import LoginPage from "./components/LoginPage";
import TargetPerformanceComparison from "./components/TargetPerformanceComparison";
import DailySpendTracker from "./components/DailySpendTracker";
import GlobalActivityLogs from "./components/GlobalActivityLogs";
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
  ArrowUpDown,
  Target,
  ChevronDown,
  Upload,
  CalendarDays,
} from "lucide-react";


export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "campaigns" | "creatives" | "leads" | "portals" | "targets" | "rules" | "performance" | "download_reports" | "ai" | "sheets_sync" | "roles" | "comparison" | "daily_spend" | "activity_logs">("dashboard");
  const [campaignsMenuOpen, setCampaignsMenuOpen] = useState(true);

  // Custom/Simulated Roles & Permissions state
  const [rolePermissions, setRolePermissions] = useState<Record<string, UserRolePermission>>(() => {
    const saved = localStorage.getItem("custom_role_permissions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse custom role permissions", e);
      }
    }
    return ROLE_PERMISSIONS;
  });

  const [userRole, setUserRole] = useState<SimulatedRoleType>(() => {
    const saved = localStorage.getItem("simulated_user_role");
    return (saved as SimulatedRoleType) || "Admin";
  });

  useEffect(() => {
    localStorage.setItem("simulated_user_role", userRole);
  }, [userRole]);

  const handleSaveRolePermissions = (newPermissions: Record<string, UserRolePermission>) => {
    setRolePermissions(newPermissions);
    localStorage.setItem("custom_role_permissions", JSON.stringify(newPermissions));
  };

  const currentRolePermission = rolePermissions[userRole] || rolePermissions.Admin || ROLE_PERMISSIONS.Admin;

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
  const [ruleSettingsList, setRuleSettingsList] = useState<RuleConfiguration[]>([]);
  const [campaignPerformances, setCampaignPerformances] = useState<CampaignPerformance[]>([]);
  const [portalSubTab, setPortalSubTab] = useState<"pivot" | "database">("pivot");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [dailySpendList, setDailySpendList] = useState<DailySpendEntry[]>([]);

  // Auth States
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("authenticated_guest_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          dataService.setUserEmail(parsed.email);
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(isFirebaseConfigured);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load database snapshots
  const loadAllDatabaseStates = async (showLoader: boolean = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      if (isFirebaseEnabled && !localStorage.getItem("migration_firebase_v1_sync")) {
        console.log("[MIGRATION] Syncing local offline data to Firebase for the first time...");
        try {
          const localCampaigns = JSON.parse(localStorage.getItem("marketing_copilot_campaigns") || "[]");
          for (const c of localCampaigns) { await dataService.saveCampaign(c, user?.email || "migration@copilot.local"); }
          
          const localLeads = JSON.parse(localStorage.getItem("marketing_copilot_portal_leads") || "[]");
          if (localLeads.length > 0) await dataService.saveLeadsBulk(localLeads);
          
          const localCreatives = JSON.parse(localStorage.getItem("marketing_copilot_creatives") || "[]");
          for (const c of localCreatives) { await dataService.saveCreative(c); }
          
          const localReports = JSON.parse(localStorage.getItem("marketing_copilot_portal_reports") || "[]");
          if (localReports.length > 0) await dataService.savePortalReportsBulk(localReports);
          
          const localBudgets = JSON.parse(localStorage.getItem("marketing_copilot_target_budgets") || "[]");
          if (localBudgets.length > 0) await dataService.saveTargetBudgetsBulk(localBudgets);
          
          const localPerfs = JSON.parse(localStorage.getItem("marketing_copilot_perf_trackers") || "[]");
          if (localPerfs.length > 0) await dataService.saveCampaignPerformancesBulk(localPerfs);
          
          const localChg = JSON.parse(localStorage.getItem("marketing_copilot_change_logs") || "[]");
          for (const ch of localChg) { await dataService.saveChangeLogEntry(ch); }

          localStorage.setItem("migration_firebase_v1_sync", "true");
        } catch (err) {
          console.error("[MIGRATION] Failed to migrate offline data:", err);
        }
      }

      const safeLoad = async <T,>(p: Promise<T>, fallback: T): Promise<T> => {
        try {
          const res = await p;
          return res !== undefined ? res : fallback;
        } catch (e) {
          console.warn("Failed to load a specific database partition, fallback applied:", e);
          return fallback;
        }
      };

      const [cRes, aRes, lRes, crRes, rRes, comRes, chgRes, pRes, tRes, sRes, perfRes, invRes, allRulesRes, dailySpendRes] = await Promise.all([
        safeLoad(dataService.getCampaigns(), []),
        safeLoad(dataService.getAuditLogs(), []),
        safeLoad(dataService.getLeads(), []),
        safeLoad(dataService.getCreatives(), []),
        safeLoad(dataService.getCampaignReports(), []),
        safeLoad(dataService.getMetricComparisons(), []),
        safeLoad(dataService.getChangeLogEntries(), []),
        safeLoad(dataService.getPortalReports(), []),
        safeLoad(dataService.getTargetBudgets(), []),
        safeLoad(dataService.getRuleConfiguration(), null),
        safeLoad(dataService.getCampaignPerformances(), []),
        safeLoad(dataService.getInvites(), []),
        safeLoad(dataService.getRuleConfigurations(), []),
        safeLoad(dataService.getDailySpends(), []),
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
      setRuleSetting(sRes);
      setCampaignPerformances(perfRes || []);
      setInvites(invRes || []);
      setRuleSettingsList(allRulesRes || []);
      setDailySpendList(dailySpendRes || []);
    } catch (err) {
      console.error("Failed to load records state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let authTimeout: any;
    let autoRefreshInterval: any;

    if (!isFirebaseConfigured) {
      loadAllDatabaseStates();
    } else if (auth) {
      // Robust responsive fail-safe timeout for sandbox iframe iframe cookie blocks
      authTimeout = setTimeout(() => {
        console.warn("[AUTH] State resolution took too long. Initializing workspace directly in Sandbox mode.");
        setAuthLoading(false);
        loadAllDatabaseStates();
      }, 5000);

      const unsubscribe = auth.onAuthStateChanged((currUser: any) => {
        if (authTimeout) clearTimeout(authTimeout);
        if (currUser) {
          setUser(currUser);
          dataService.setUserEmail(currUser.email);
          // Auto promotion check on real sign in too!
          if (currUser.email) {
            const emailLower = currUser.email.toLowerCase();
            dataService.getInvites().then((activeInv) => {
              const pendingInvite = activeInv.find(inv => inv.email.toLowerCase() === emailLower && inv.status === "pending");
              if (pendingInvite) {
                setUserRole(pendingInvite.role);
                localStorage.setItem("simulated_user_role", pendingInvite.role);
                
                // Set accepted
                dataService.saveInvite({
                  ...pendingInvite,
                  status: "accepted" as const,
                });
              }
            });
          }
        } else {
          // If no Google auth user, fallback to guest user saved in local storage if any
          const savedGuest = localStorage.getItem("authenticated_guest_user");
          if (savedGuest) {
            try {
              const parsed = JSON.parse(savedGuest);
              setUser(parsed);
              dataService.setUserEmail(parsed.email);
            } catch (e) {
              setUser(null);
              dataService.setUserEmail(null);
            }
          } else {
            setUser(null);
            dataService.setUserEmail(null);
          }
        }
        setAuthLoading(false);
        loadAllDatabaseStates();

        if (isFirebaseEnabled) {
          if (autoRefreshInterval) clearInterval(autoRefreshInterval);
          autoRefreshInterval = setInterval(() => {
            loadAllDatabaseStates(false);
          }, 15000);
        }
      });
      
      return () => {
        if (authTimeout) clearTimeout(authTimeout);
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
        unsubscribe();
      };
    }
    
    return () => {
      if (autoRefreshInterval) clearInterval(autoRefreshInterval);
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

  const handleAddInvite = async (email: string, roleToInvite: string, password?: string) => {
    const newInvite: Invite = {
      id: "inv-" + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      role: roleToInvite as any,
      invitedBy: user?.email || "anonymous_sandbox_admin",
      status: "accepted",
      password: password || "admin123",
      createdAt: new Date().toISOString()
    };
    await dataService.saveInvite(newInvite);
    await loadAllDatabaseStates();
  };

  const handleDeleteInvite = async (id: string) => {
    await dataService.deleteInvite(id);
    await loadAllDatabaseStates();
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      if (googleUser && googleUser.email) {
        const emailLower = googleUser.email.toLowerCase();
        const activeInvites = await dataService.getInvites();
        const pendingInvite = activeInvites.find(inv => inv.email.toLowerCase() === emailLower && inv.status === "pending");
        if (pendingInvite) {
          setUserRole(pendingInvite.role);
          localStorage.setItem("simulated_user_role", pendingInvite.role);
          
          await dataService.saveInvite({
            ...pendingInvite,
            status: "accepted" as const,
          });
        }
      }
      
      setUser(googleUser);
      localStorage.removeItem("authenticated_guest_user");
      await loadAllDatabaseStates();
    } catch (err: any) {
      console.error("Google login failed:", err);
      let errorMsg = err?.message || String(err);
      if (err?.code === "auth/unauthorized-domain") {
        errorMsg = "Unauthorized Domain: This preview URL is not authorized in your Firebase console. Please go to Auth -> Settings -> Authorized Domains and append this workspace hostname.";
      } else if (err?.code === "auth/popup-blocked") {
        errorMsg = "Popup Blocked: Your browser blocked the authentication popup. Please click allow or try opening this sandbox page in a new fullscreen window.";
      } else if (err?.code === "auth/operation-not-allowed") {
        errorMsg = "Sign-in Provider Disabled: Google Auth is disabled in Firebase. Enable it in Auth -> Sign-in methods.";
      } else if (err?.code === "auth/network-request-failed") {
        errorMsg = "Network Blocked / Cookies Disabled: Sandbox iframe restrictions may be preventing Google Sign-In. Try opening the workspace in a new tab, or use the direct corporate email access option below.";
      } else {
        errorMsg = `Authentication error (${err?.code || 'unknown'}): ${err?.message || errorMsg}`;
      }
      setAuthError(errorMsg);
    }
  };

  const handleGuestSignIn = async (email: string, selectedRole: SimulatedRoleType) => {
    const emailLower = email.toLowerCase();
    const pendingInvite = invites.find(inv => inv.email.toLowerCase() === emailLower && inv.status === "pending");
    
    let roleToSet = selectedRole;
    if (pendingInvite) {
      roleToSet = pendingInvite.role;
      await dataService.saveInvite({
        ...pendingInvite,
        status: "accepted" as const,
      });
    }
    
    const guestUser = {
      displayName: email.split("@")[0],
      email: email,
      photoURL: null,
      isGuest: true,
      providerId: "simulated-provider"
    };
    
    dataService.setUserEmail(email);
    setUser(guestUser);
    setUserRole(roleToSet);
    localStorage.setItem("authenticated_guest_user", JSON.stringify(guestUser));
    localStorage.setItem("simulated_user_role", roleToSet);
    
    await loadAllDatabaseStates();
  };

  const handleSignOut = async () => {
    if (auth && !user?.isGuest) {
      await signOut(auth);
    }
    dataService.setUserEmail(null);
    setUser(null);
    localStorage.removeItem("authenticated_guest_user");
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
        // Optimistic State Update
        setCampaignPerformances(prev => prev.map(p => p.id === campaign.id ? updatedPerf : p));
        await dataService.saveCampaignPerformance(updatedPerf);
      }
    } else {
      // Optimistic State Update
      setCampaigns(prev => {
        const exist = prev.some(c => c.id === campaign.id);
        if (exist) {
          return prev.map(c => c.id === campaign.id ? campaign : c);
        } else {
          return [campaign, ...prev];
        }
      });
      await dataService.saveCampaign(campaign, operatorEmail);
    }
    await loadAllDatabaseStates(false); // background reload, no spinner overlay
  };

  // Action: Campaign Deletion
  const handleDeleteCampaign = async (id: string, name: string) => {
    const operatorEmail = user?.email || "anonymous_sandbox@example.com";
    if (id.startsWith("perf-")) {
      setCampaignPerformances(prev => prev.filter(c => c.id !== id));
      await dataService.deleteCampaignPerformance(id);
    } else {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      await dataService.deleteCampaign(id, name, operatorEmail);
    }
    loadAllDatabaseStates(false);
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
    if (creative.id.startsWith("perf-creative-")) {
      const perfId = creative.id.replace("perf-creative-", "");
      const perf = (campaignPerformances || []).find((p) => p.id === perfId);
      if (perf) {
        const updatedPerf: CampaignPerformance = {
          ...perf,
          creativeImageUrl: creative.imageUrl,
          creativeNewUpdatedFlag: creative.creativeNewUpdatedFlag !== undefined ? creative.creativeNewUpdatedFlag : (creative as any).creativeNewUpdatedFlag,
          creativeUpdatedAt: new Date().toISOString()
        };
        await dataService.saveCampaignPerformance(updatedPerf);
        await loadAllDatabaseStates();
        return;
      }
    }
    await dataService.saveCreative(creative);
    await loadAllDatabaseStates();
  };

  // Action: Creative deletion
  const handleDeleteCreative = async (id: string) => {
    if (id.startsWith("perf-creative-")) {
      const perfId = id.replace("perf-creative-", "");
      const perf = (campaignPerformances || []).find((p) => p.id === perfId);
      if (perf) {
        const updatedPerf: CampaignPerformance = {
          ...perf,
          creativeImageUrl: undefined,
          creativeNewUpdatedFlag: false,
          creativeUpdatedAt: new Date().toISOString()
        };
        await dataService.saveCampaignPerformance(updatedPerf);
        await loadAllDatabaseStates();
        return;
      }
    }
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
    // Optimistic State Update
    setChangeLogEntries(prev => {
      const idx = prev.findIndex(item => item.id === chg.id);
      if (idx !== -1) {
        return prev.map(item => item.id === chg.id ? chg : item);
      } else {
        return [chg, ...prev];
      }
    });
    await dataService.saveChangeLogEntry(chg);
    await loadAllDatabaseStates(false); // background sync, no spinner overlay
  };

  const handleSaveCampaignsBulk = async (camps: Campaign[]) => {
    const operatorEmail = user?.email || "anonymous_sandbox@example.com";
    
    // 1. Optimistic Updates
    setCampaigns(prev => {
      const copy = [...prev];
      camps.forEach(camp => {
        if (!camp.id.startsWith("perf-")) {
          const idx = copy.findIndex(c => c.id === camp.id);
          if (idx !== -1) {
            copy[idx] = camp;
          } else {
            copy.unshift(camp);
          }
        }
      });
      return copy;
    });

    setCampaignPerformances(prev => {
      const copy = [...prev];
      camps.forEach(camp => {
        if (camp.id.startsWith("perf-")) {
          const idx = copy.findIndex(p => p.id === camp.id);
          if (idx !== -1) {
            copy[idx] = {
              ...copy[idx],
              campaignName: camp.name,
              amountSpend: camp.spend,
              leads: camp.conversions,
              clicks: camp.clicks,
              impression: camp.impressions,
            };
          }
        }
      });
      return copy;
    });

    // 2. Database Save
    await dataService.saveCampaignsBulk(camps, operatorEmail);

    // 3. Low priority reload
    await loadAllDatabaseStates(false);
  };

  const handleSaveChangeLogEntriesBulk = async (logs: ChangeLogEntry[]) => {
    // 1. Optimistic Update
    setChangeLogEntries(prev => {
      const copy = [...prev];
      logs.forEach(log => {
        const idx = copy.findIndex(l => l.id === log.id);
        if (idx !== -1) {
          copy[idx] = log;
        } else {
          copy.unshift(log);
        }
      });
      return copy;
    });

    // 2. Database Save
    await dataService.saveChangeLogEntriesBulk(logs);

    // 3. Low priority reload
    await loadAllDatabaseStates(false);
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

  const handleSavePortalReportsBulk = async (rows: PortalReportRow[]) => {
    await dataService.savePortalReportsBulk(rows);
    await loadAllDatabaseStates();
  };

  const handleDeletePortalReport = async (id: string) => {
    await dataService.deletePortalReport(id);
    await loadAllDatabaseStates();
  };

  const handleClearAllPortalReports = async () => {
    setPortalReports([]);
    await dataService.clearAllPortalReports();
    loadAllDatabaseStates(false);
  };

  const handleClearAllCampaigns = async () => {
    setCampaigns([]);
    setCampaignPerformances([]);
    setCreatives([]);
    setAuditLogs([]);
    await dataService.clearAllCampaigns();
    loadAllDatabaseStates(false);
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

  const handleDeleteRuleConfiguration = async (id: string) => {
    await dataService.deleteRuleConfiguration(id);
    await loadAllDatabaseStates();
  };

  // Action: Bulk Google Sheet Imports
  const handleImportLeads = async (importedLeads: Lead[]) => {
    await dataService.saveLeadsBulk(importedLeads);
    await loadAllDatabaseStates();
  };

  const handleImportPerformance = async (importedPerf: CampaignPerformance[]) => {
    await dataService.saveCampaignPerformancesBulk(importedPerf);
    await loadAllDatabaseStates();
  };

  const handleImportTargets = async (importedTargets: TargetBudgetRow[]) => {
    await dataService.saveTargetBudgetsBulk(importedTargets);
    await loadAllDatabaseStates();
  };

  const handleImportPortalReports = async (importedPortals: PortalReportRow[]) => {
    await dataService.savePortalReportsBulk(importedPortals);
    await loadAllDatabaseStates();
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
        projectName: perf.projectName,
        createdAt: perf.createdAt || new Date().toISOString(),
        updatedAt: perf.createdAt || new Date().toISOString(),
        adset: perf.adsetName,
        creativeType: perf.creativeType,
        campaignManager: perf.campaignManager,
        cpl: perf.cpl,
      };
    });
  const mergedCampaigns = [...campaigns, ...mappedPerformanceCampaigns];

  const mergedCreatives = React.useMemo(() => {
    const list = [...creatives];
    
    (campaignPerformances || []).forEach((perf) => {
      if (perf.creativeImageUrl) {
        const matchedCamp = (campaigns || []).find(
          (c) => c.name.toLowerCase() === perf.campaignName.toLowerCase()
        );
        
        let platform: "Google Ads" | "Meta (Facebook)" | "LinkedIn" | "TikTok" | "YouTube" = "Google Ads";
        const nameLower = (perf.campaignName || "").toLowerCase();
        if (nameLower.includes("meta") || nameLower.includes("facebook") || nameLower.includes("insta")) {
          platform = "Meta (Facebook)";
        } else if (nameLower.includes("linkedin")) {
          platform = "LinkedIn";
        } else if (nameLower.includes("tiktok")) {
          platform = "TikTok";
        } else if (nameLower.includes("youtube")) {
          platform = "YouTube";
        } else if (matchedCamp) {
          platform = matchedCamp.platform;
        }

        const derivedId = `perf-creative-${perf.id}`;
        const existingIdx = list.findIndex((c) => c.id === derivedId);

        const derivedCreative: CreativeAsset & { 
          isPerformanceAsset: boolean; 
          creativeNewUpdatedFlag: boolean; 
          impressions: number;
          reach: number;
          svc: number;
          booked: number;
          ctr: number;
        } = {
          id: derivedId,
          campaignId: matchedCamp?.id || perf.id,
          campaignName: perf.campaignName,
          name: `${perf.campaignName} — ${perf.adsetName}`,
          platform,
          imageUrl: perf.creativeImageUrl,
          headline: perf.adsetName || "Adset Performance Variant",
          bodyText: `Project: ${perf.projectName} | Ad Account: ${perf.adAccountId}`,
          clicks: perf.clicks || 0,
          conversions: perf.leads || 0,
          spend: perf.amountSpend || 0,
          status: "active",
          createdAt: perf.creativeUpdatedAt || perf.createdAt || new Date().toISOString(),
          isPerformanceAsset: true,
          creativeNewUpdatedFlag: !!perf.creativeNewUpdatedFlag,
          impressions: perf.impression || 0,
          reach: perf.reach || 0,
          svc: perf.svc || 0,
          booked: perf.booked || 0,
          ctr: perf.ctr || 0,
        };

        if (existingIdx !== -1) {
          list[existingIdx] = {
            ...list[existingIdx],
            ...derivedCreative,
            aiScore: list[existingIdx].aiScore || derivedCreative.aiScore,
            aiStrengths: list[existingIdx].aiStrengths || derivedCreative.aiStrengths,
            aiWeaknesses: list[existingIdx].aiWeaknesses || derivedCreative.aiWeaknesses,
            aiSuggestedBody: list[existingIdx].aiSuggestedBody || derivedCreative.aiSuggestedBody,
            aiSuggestedHeadline: list[existingIdx].aiSuggestedHeadline || derivedCreative.aiSuggestedHeadline,
          };
        } else {
          list.push(derivedCreative);
        }
      }
    });

    return list;
  }, [creatives, campaignPerformances, campaigns]);

  if (!user) {
    if (authLoading || loading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs font-semibold text-slate-500">Checking authorization context...</p>
          </div>
        </div>
      );
    }

    return (
      <LoginPage
        onGoogleSignIn={handleGoogleSignIn}
        onGuestSignIn={handleGuestSignIn}
        isFirebaseConfigured={isFirebaseConfigured}
        isFirebaseEnabled={isFirebaseEnabled}
        invites={invites}
        authError={authError}
        onClearAuthError={() => setAuthError(null)}
      />
    );
  }

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
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 flex-shrink-0 font-sans">
              <Shield size={14} className="text-indigo-600 animate-pulse shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">Security Role</span>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as SimulatedRoleType)}
                  className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer pr-1 py-0.5 leading-tight font-sans"
                >
                  {Object.keys(rolePermissions).map((rk) => (
                    <option value={rk} key={rk}>
                      {rolePermissions[rk].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isFirebaseEnabled && user ? (
              <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-750 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CloudCheck size={12} className="text-emerald-500 animate-pulse" />
                <span>Cloud Sync Connected</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Database size={11} className="text-amber-500" />
                <span>Local Database Mode</span>
              </div>
            )}

            {/* Authorized Teammate details */}
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-slate-800 leading-none capitalize">{user.displayName || user.email.split("@")[0]}</div>
                    <span className="text-[9px] text-slate-400 font-semibold leading-none">{user.email}</span>
                  </div>
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold font-display uppercase shadow-xs">
                    {(user.displayName || user.email)?.[0] || "U"}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1 px-2 border border-slate-200 hover:text-rose-500 hover:border-rose-100 rounded-xl text-[11px] font-semibold cursor-pointer transition-all bg-white"
                    title="Log Out User"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              )}
            </div>
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "dashboard"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>

              {/* Campaigns Collapsible Sub-menu Container */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => setCampaignsMenuOpen(!campaignsMenuOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                    activeTab === "campaigns" || activeTab === "performance"
                      ? "bg-slate-100/90 text-slate-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Megaphone size={16} />
                    <span>Campaigns</span>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 transition-transform duration-250 ${campaignsMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {campaignsMenuOpen && (
                  <div className="pl-4 space-y-1.5 border-l-2 border-indigo-100 ml-5 mt-1 animate-fade-in">
                    {/* Campaign Upload */}
                    <button
                      onClick={() => setActiveTab("campaigns")}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-left text-[11px] ${
                        activeTab === "campaigns"
                          ? "bg-indigo-50 text-indigo-700 font-bold shadow-3xs"
                          : "hover:bg-slate-50 text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <Upload size={13} />
                      <span>Campaign Upload</span>
                    </button>

                    {/* Change Log */}
                    <button
                      onClick={() => setActiveTab("performance")}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-left text-[11px] ${
                        activeTab === "performance"
                          ? "bg-indigo-50 text-indigo-700 font-bold shadow-3xs"
                          : "hover:bg-slate-50 text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      <History size={13} />
                      <span>Change Log</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Creative Hub btn */}
              <button
                onClick={() => setActiveTab("creatives")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "creatives"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Briefcase size={16} />
                <span>Creative Performance</span>
              </button>

              {/* Portal Leads btn */}
              <button
                onClick={() => setActiveTab("portals")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "portals"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users size={16} />
                <span>Portal Leads</span>
              </button>

              {/* Leads Pipeline btn */}
              <button
                onClick={() => setActiveTab("leads")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "leads"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Workflow size={16} className="text-slate-500" />
                <span>Leads Pipeline</span>
              </button>

              {/* Central master Audit Logs btn */}
              <button
                id="sidebar_global_audit_logs_btn"
                onClick={() => setActiveTab("activity_logs")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "activity_logs"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History size={16} className="text-indigo-650 text-indigo-600" />
                <span>Audit Logs &amp; History</span>
              </button>

              {/* Target performance comparison btn */}
              <button
                onClick={() => setActiveTab("comparison")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "comparison"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ArrowUpDown size={16} />
                <span>Target vs Performance</span>
              </button>

              {/* Weekly Target Ledger btn */}
              <button
                onClick={() => setActiveTab("targets")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "targets"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Coins size={16} />
                <span>Weekly Target Ledger</span>
              </button>

              {/* Day-wise Spend btn */}
              <button
                onClick={() => setActiveTab("daily_spend")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "daily_spend"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <CalendarDays size={16} />
                <span>Day-wise Spend</span>
              </button>

              {/* Exclusive Download Reports btn */}
              <button
                onClick={() => setActiveTab("download_reports")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "sheets_sync"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>Google Sheets Sync</span>
              </button>

              {/* AI Hub btn */}
              <button
                onClick={() => setActiveTab("ai")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "ai"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sparkles size={16} />
                <span>AI</span>
              </button>

              {/* Rule Configuration btn */}
              <button
                onClick={() => setActiveTab("rules")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "rules"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sliders size={16} />
                <span>Rule Configuration</span>
              </button>

              {/* User Roles Configuration btn */}
              <button
                id="sidebar_roles_btn"
                onClick={() => setActiveTab("roles")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
                  activeTab === "roles"
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Shield size={16} />
                <span>User Roles Settings</span>
              </button>
            </nav>
          </div>

          {/* Active Security Permissions Status Panel */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-left">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 font-sans mb-2">
              <Shield size={14} className="text-indigo-650 text-indigo-600" />
              <span className="text-xs uppercase tracking-wider">Active Security Policy</span>
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
                <span>Local Database Active</span>
              </div>
              <p>
                All campaigns, change logs, and visual creatives persist durably inside your browser's secure local storage context.
              </p>
              <div className="text-[10px] text-amber-700/90 font-medium">
                Once Cloud database connectivity is configured, database synchronization switches automatically to active cloud structures.
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
                  portalReports={portalReports}
                  onSavePerformance={handleSaveCampaignPerformance}
                  changeLogEntries={changeLogEntries}
                  dailySpendList={dailySpendList}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === "campaigns" && (
                <CampaignList
                  campaigns={mergedCampaigns}
                  creatives={mergedCreatives}
                  onSaveCampaign={handleSaveCampaign}
                  onSaveCampaignsBulk={handleSaveCampaignsBulk}
                  onDeleteCampaign={handleDeleteCampaign}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                  onSaveChangeLogEntriesBulk={handleSaveChangeLogEntriesBulk}
                  onDeleteChangeLog={handleDeleteChangeLogEntry}
                  changeLogs={changeLogEntries}
                  comparisons={metricComparisons}
                  onSaveComparison={handleSaveMetricComparison}
                  onDeleteComparison={handleDeleteMetricComparison}
                  rolePermission={currentRolePermission}
                  onClearAllCampaigns={handleClearAllCampaigns}
                />
              )}
              {activeTab === "creatives" && (
                <CreativeHub
                  creatives={mergedCreatives}
                  campaigns={mergedCampaigns}
                  onSaveCreative={handleSaveCreative}
                  onDeleteCreative={handleDeleteCreative}
                  onSaveChangeLog={handleSaveChangeLogEntry}
                />
              )}
              {activeTab === "ai" && (
                <AIHub
                  creatives={mergedCreatives}
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
                  creatives={mergedCreatives}
                  metricComparisons={metricComparisons}
                  campaignReports={campaignReports}
                />
              )}
              {activeTab === "portals" && (
                <div className="space-y-6 animate-fade-in" id="portal-leads-module-container">
                  <PortalReportModule
                    portalReports={portalReports}
                    onSaveReport={handleSavePortalReport}
                    onSaveReportsBulk={handleSavePortalReportsBulk}
                    onDeleteReport={handleDeletePortalReport}
                    onClearAllReports={handleClearAllPortalReports}
                    rolePermission={currentRolePermission}
                    leads={leads}
                  />
                </div>
              )}
              {activeTab === "leads" && (
                <div className="space-y-6 animate-fade-in" id="leads-portal-container">
                  <LeadPortal
                    leads={leads}
                    campaigns={mergedCampaigns}
                    onSaveLead={handleSaveLead}
                    onDeleteLead={handleDeleteLead}
                  />
                </div>
              )}
              {activeTab === "activity_logs" && (
                <div className="space-y-6 animate-fade-in" id="global-activity-logs-container">
                  <GlobalActivityLogs
                    auditLogs={auditLogs}
                    changeLogs={changeLogEntries}
                  />
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
              {activeTab === "comparison" && (
                <TargetPerformanceComparison
                  targets={targetBudgets}
                  performances={campaignPerformances}
                />
              )}
              {activeTab === "rules" && (
                <RuleConfigPanel
                  ruleSetting={ruleSetting}
                  ruleSettingsList={ruleSettingsList}
                  campaigns={mergedCampaigns}
                  onSaveRule={handleSaveRuleConfiguration}
                  onDeleteRule={handleDeleteRuleConfiguration}
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
                  onImportPortalReports={handleImportPortalReports}
                />
              )}
              {activeTab === "roles" && (
                <UserRolesSettings
                  rolePermissions={rolePermissions}
                  onSaveRolePermissions={handleSaveRolePermissions}
                  userRole={userRole}
                  onSetUserRole={setUserRole}
                  invites={invites}
                  onAddInvite={handleAddInvite}
                  onDeleteInvite={handleDeleteInvite}
                  currentUserEmail={user?.email || "anonymous_sandbox_admin"}
                />
              )}
              {activeTab === "daily_spend" && (
                <DailySpendTracker
                  dailySpendList={dailySpendList}
                  onSave={async (entries) => {
                    const newList = await dataService.saveDailySpends(entries);
                    setDailySpendList(newList);
                  }}
                  onDelete={async (id) => {
                    await dataService.deleteDailySpend(id);
                    setDailySpendList(dailySpendList.filter(e => e.id !== id));
                  }}
                  projects={(Array.from(new Set(campaignPerformances.map(c => c.projectName).filter(Boolean))) as string[]).concat(["Grand Horizon Residence", "Vivaana", "Oakridge Estate"])}
                  adAccounts={Array.from(new Set(campaignPerformances.map(c => c.adAccountId).filter(Boolean))) as string[]}
                  rolePermission={currentRolePermission}
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
