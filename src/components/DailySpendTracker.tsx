import React, { useState, useMemo, useEffect } from "react";
import { DailySpendEntry, UserRolePermission } from "../types";
import { Plus, Trash2, Calendar, Coins, TrendingUp, CheckSquare, Edit, Save, ArrowLeftRight, Percent, Filter, Layers, Upload, Download, Sparkles, CheckCircle, Info, Sliders, X, RefreshCw, AlertTriangle, Link, ShieldAlert, Check, Lock, Unlock } from "lucide-react";

interface DailySpendTrackerProps {
  dailySpendList: DailySpendEntry[];
  onSave: (entries: DailySpendEntry[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  projects: string[];
  rolePermission?: UserRolePermission;
  adAccounts?: string[];
}

export default function DailySpendTracker({
  dailySpendList,
  onSave,
  onDelete,
  projects,
  rolePermission = {
    role: "Admin",
    label: "Super Admin",
    description: "",
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
  },
  adAccounts = []
}: DailySpendTrackerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"report" | "database" | "import" | "sync" | "settings">("report");
  const [reportViewMode, setReportViewMode] = useState<"date" | "account">("date");
  
  // Custom projects / mediums loaded from localStorage with deep props fallbacks
  const [customProjects, setCustomProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_copilot_custom_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const combined = Array.from(new Set([...(projects || []), "Grand Horizon Residence", "Vivaana", "Oakridge Estate", "Skyline Residency"]));
    return combined;
  });

  const [customMediums, setCustomMediums] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_copilot_custom_mediums");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ["Meta Ad Acc", "Projectwise Acc", "Google Ads", "LinkedIn Ads", "TikTok Ads"];
  });

  const [customAdAccounts, setCustomAdAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem("marketing_copilot_custom_ad_accounts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ["act_40391039 (Meta Direct)", "act_20938491 (Google Ads)", "act_102948192 (LinkedIn Corp)", "act_883019284 (In-house)"];
  });

  // Meta and Google Sync States
  const [syncPlatform, setSyncPlatform] = useState<"meta" | "google">("meta");
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  
  // Storage of active session tokens
  const [syncMetaToken, setSyncMetaToken] = useState<string | null>(() => localStorage.getItem("sync_meta_access_token"));
  const [syncGoogleToken, setSyncGoogleToken] = useState<string | null>(() => localStorage.getItem("sync_google_access_token"));
  
  // Date selection for sync
  const [syncStartDate, setSyncStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [syncEndDate, setSyncEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  
  // Fetched results for preview/mapping
  const [syncAdAccounts, setSyncAdAccounts] = useState<Array<{id: string, name: string}>>([]);
  const [selectedSyncAccount, setSelectedSyncAccount] = useState<string>("");
  const [fetchedCampaignSpends, setFetchedCampaignSpends] = useState<any[]>([]);
  const [isDemoSync, setIsDemoSync] = useState<boolean>(true);
  
  // Dynamic mapping: platform project name mapped to workspace project name
  const [projectMappings, setProjectMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (syncMetaToken) {
      localStorage.setItem("sync_meta_access_token", syncMetaToken);
    } else {
      localStorage.removeItem("sync_meta_access_token");
    }
  }, [syncMetaToken]);

  useEffect(() => {
    if (syncGoogleToken) {
      localStorage.setItem("sync_google_access_token", syncGoogleToken);
    } else {
      localStorage.removeItem("sync_google_access_token");
    }
  }, [syncGoogleToken]);

  // OAuth success listener
  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      
      if (event.data?.type === "GOOGLE_ADS_AUTH_SUCCESS") {
        const token = event.data.accessToken;
        setSyncGoogleToken(token);
        setSyncSuccess("Successfully authenticated working Google Ads connection!");
        setSyncError(null);
      } else if (event.data?.type === "META_ADS_AUTH_SUCCESS") {
        const token = event.data.accessToken;
        setSyncMetaToken(token);
        setSyncSuccess("Successfully authenticated working Meta Ads connection!");
        setSyncError(null);
      }
    };

    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, []);

  const triggerPlatformOauth = async () => {
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const endpoint = syncPlatform === "meta" ? "/api/auth/meta-ads/url" : "/api/auth/google-ads/url";
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to construct authorization channel.");
      
      const data = await response.json();
      
      const popup = window.open(
        data.url,
        syncPlatform === "meta" ? "meta_ads_oauth" : "google_ads_oauth",
        "width=560,height=680,resizable=yes,scrollbars=yes"
      );

      if (!popup) {
        throw new Error("Popup blocked by your browser. Please allow popup access in address bar to login.");
      }
    } catch (err: any) {
      setSyncError(err.message || "OAuth login error occurred.");
    }
  };

  const fetchSpendsFromPlatform = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const token = syncPlatform === "meta" ? syncMetaToken : syncGoogleToken;
      if (!token) {
        throw new Error(`Please connect your ${syncPlatform === "meta" ? "Meta" : "Google"} account before invoking sync.`);
      }

      const endpoint = syncPlatform === "meta" ? "/api/sync/meta-ads" : "/api/sync/google-ads";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: token,
          startDate: syncStartDate,
          endDate: syncEndDate,
          isDemo: isDemoSync
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load channel campaigns.");
      }

      setSyncAdAccounts(data.accounts || []);
      if (data.accounts?.length > 0) {
        setSelectedSyncAccount(data.accounts[0].name);
      }

      setFetchedCampaignSpends(data.campaignSpends || []);
      
      // Setup default mappings
      const initialMappings: Record<string, string> = {};
      const uniqueSourceProjects = Array.from(new Set((data.campaignSpends || []).map((e: any) => e.project))) as string[];
      uniqueSourceProjects.forEach(sourceProj => {
        const matched = customProjects.find(p => 
          p.toLowerCase().includes(sourceProj.toLowerCase()) || 
          sourceProj.toLowerCase().includes(p.toLowerCase())
        );
        initialMappings[sourceProj] = matched || customProjects[0] || "Grand Horizon Residence";
      });
      setProjectMappings(initialMappings);

      if (data.mode === "sandbox") {
        setSyncSuccess(`Demonstration Account Connected: Fetched ${data.campaignSpends?.length || 0} synthetic campaign spends.`);
      } else {
        setSyncSuccess(`Channel Sync Succeeded! Found ${data.campaignSpends?.length || 0} active daily records to import.`);
      }
    } catch (err: any) {
      setSyncError(err.message || "Failed to download campaigns.");
    } finally {
      setSyncing(false);
    }
  };

  const importSyncedLogs = async () => {
    if (fetchedCampaignSpends.length === 0) return;
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);
    try {
      const mappedEntries: DailySpendEntry[] = fetchedCampaignSpends.map(item => {
        const mappedProj = projectMappings[item.project] || item.project;
        return {
          id: `entry_${item.date}_${mappedProj}_${item.medium}_${item.adAccount}`.replace(/[\s\(\):]/g, "_").toLowerCase(),
          date: item.date,
          project: mappedProj,
          medium: item.medium,
          adAccount: item.adAccount,
          spend: item.spend,
          leads: item.leads,
          createdAt: new Date().toISOString()
        };
      });

      await onSave(mappedEntries);
      
      // Auto-register
      mappedEntries.forEach(entry => {
        if (!customProjects.includes(entry.project)) {
          setCustomProjects(prev => [...prev, entry.project]);
        }
        if (entry.adAccount && !customAdAccounts.includes(entry.adAccount)) {
          setCustomAdAccounts(prev => [...prev, entry.adAccount]);
        }
      });

      setSyncSuccess(`Success! Instantly imported ${mappedEntries.length} marketing log entries into your live report!`);
      setFetchedCampaignSpends([]);
    } catch (err: any) {
      setSyncError(err.message || "Import operation failed.");
    } finally {
      setSyncing(false);
    }
  };

  // Local state for settings panel inputs
  const [newProjectInput, setNewProjectInput] = useState("");
  const [newMediumInput, setNewMediumInput] = useState("");
  const [newAdAccountInput, setNewAdAccountInput] = useState("");
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Sync settings back to localStorage
  useEffect(() => {
    localStorage.setItem("marketing_copilot_custom_projects", JSON.stringify(customProjects));
  }, [customProjects]);

  useEffect(() => {
    localStorage.setItem("marketing_copilot_custom_mediums", JSON.stringify(customMediums));
  }, [customMediums]);

  useEffect(() => {
    localStorage.setItem("marketing_copilot_custom_ad_accounts", JSON.stringify(customAdAccounts));
  }, [customAdAccounts]);

  // Pivot Medium Configurations (combining explicit custom mediums & database values)
  const availableMediums = useMemo(() => {
    const set = new Set(customMediums);
    dailySpendList.forEach(e => {
      if (e.medium) set.add(e.medium);
    });
    return Array.from(set);
  }, [customMediums, dailySpendList]);

  // Unique Ad Accounts combining props, custom, and logs
  const uniqueAdAccounts = useMemo(() => {
    const set = new Set([...adAccounts, ...customAdAccounts]);
    dailySpendList.forEach(e => {
      if (e.adAccount) set.add(e.adAccount);
    });
    return Array.from(set);
  }, [adAccounts, customAdAccounts, dailySpendList]);

  const [selectedMedium, setSelectedMedium] = useState<string>("");

  // Filter states
  const uniqueProjects = useMemo(() => {
    const set = new Set(customProjects);
    dailySpendList.forEach(e => {
      if (e.project) set.add(e.project);
    });
    return Array.from(set);
  }, [customProjects, dailySpendList]);

  const [selectedProject, setSelectedProject] = useState<string>(() => {
    return customProjects[0] || "Grand Horizon Residence";
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // CRUD Form states
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formProject, setFormProject] = useState<string>(() => {
    return customProjects[0] || "Grand Horizon Residence";
  });
  const [formMedium, setFormMedium] = useState<string>(() => {
    return customMediums[0] || "Meta Ad Acc";
  });
  const [formAdAccount, setFormAdAccount] = useState<string>(() => {
    return uniqueAdAccounts[0] || "act_40391039 (Meta Direct)";
  });
  const [formSpend, setFormSpend] = useState<string>("");
  const [formLeads, setFormLeads] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // Bulk CSV Import states
  const [csvText, setCsvText] = useState<string>("");
  const [csvFeedback, setCsvFeedback] = useState<{ status: "success" | "error" | ""; message: string }>({ status: "", message: "" });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // File Picker / Drag and Drop handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFeedback({ status: "", message: "" });
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.slice(-4).toLowerCase() !== ".csv") {
        setCsvFeedback({ status: "error", message: "Only CSV (.csv) files are supported for import." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        setCsvFeedback({ status: "success", message: `Successfully loaded file '${file.name}'. Review and click parse below.` });
      };
      reader.onerror = () => {
        setCsvFeedback({ status: "error", message: "Failed to read CSV file." });
      };
      reader.readAsText(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setCsvFeedback({ status: "", message: "" });
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.slice(-4).toLowerCase() !== ".csv") {
        setCsvFeedback({ status: "error", message: "Only CSV (.csv) files are supported for import." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        setCsvFeedback({ status: "success", message: `Successfully loaded file '${file.name}' into textarea. Review and click parse below.` });
      };
      reader.onerror = () => {
        setCsvFeedback({ status: "error", message: "Failed to read CSV file." });
      };
      reader.readAsText(file);
    }
  };

  const downloadCsvTemplateFile = () => {
    const headers = "Date,Project,Medium,Spend,Leads\n";
    const rows = [
      "2026-06-03,Vivaana,Meta Ad Acc,1450.50,11",
      "2026-06-03,Vivaana,Projectwise Acc,2380.00,14",
      "2026-06-04,Grand Horizon Residence,Meta Ad Acc,1390.20,9",
      "2026-06-04,Grand Horizon Residence,Projectwise Acc,2110.50,16",
      "2026-05-30,Oakridge Estate,Meta Ad Acc,890.00,5",
      "2026-05-30,Oakridge Estate,Projectwise Acc,1740.00,10"
    ].join("\n");
    const content = headers + rows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "daily_spend_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCsvFeedback({ status: "success", message: "CSV upload template file downloaded to your system!" });
  };

  const formatINRDecimals = (value: number) => {
    return "₹" + new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Seeding support internally if no data is present
  const mergedSpendList = useMemo(() => {
    if (dailySpendList.length > 0) {
      return dailySpendList;
    }
    // Return mock seed data that matches the user instructions and photo format
    return [
      {
        id: "seed_1_meta",
        date: "2026-06-01",
        project: "Grand Horizon Residence",
        medium: "Meta Ad Acc",
        spend: 1292.76,
        leads: 8,
        createdAt: "2026-06-01T10:00:00.000Z"
      },
      {
        id: "seed_1_projectwise",
        date: "2026-06-01",
        project: "Grand Horizon Residence",
        medium: "Projectwise Acc",
        spend: 2299.37,
        leads: 17,
        createdAt: "2026-06-01T10:05:00.000Z"
      },
      {
        id: "seed_2_meta",
        date: "2026-06-02",
        project: "Grand Horizon Residence",
        medium: "Meta Ad Acc",
        spend: 1318.22,
        leads: 9,
        createdAt: "2026-06-02T10:00:00.000Z"
      },
      {
        id: "seed_2_projectwise",
        date: "2026-06-02",
        project: "Grand Horizon Residence",
        medium: "Projectwise Acc",
        spend: 2152.71,
        leads: 12,
        createdAt: "2026-06-02T10:05:00.000Z"
      }
    ];
  }, [dailySpendList]);

  // Aggregate by Date and Project for the report table
  const pivotReportData = useMemo(() => {
    // Filter raw list by project first
    let filtered = mergedSpendList;
    if (selectedProject) {
      filtered = filtered.filter(e => e.project === selectedProject);
    }
    if (selectedMedium) {
      filtered = filtered.filter(e => e.medium === selectedMedium);
    }
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    // Group by Date and Project
    const groups: Record<string, DailySpendEntry[]> = {};
    filtered.forEach(entry => {
      const key = `${entry.date}__${entry.project}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    // Calculate aggregated parameters
    const rows = Object.keys(groups).map(key => {
      const entries = groups[key];
      const dateStr = entries[0].date;
      const projectStr = entries[0].project;

      const totalSpendWithoutGst = entries.reduce((acc, c) => acc + c.spend, 0);
      const totalLeads = entries.reduce((acc, c) => acc + c.leads, 0);
      const cplWithoutGst = totalLeads > 0 ? (totalSpendWithoutGst / totalLeads) : 0;
      const totalSpendWithGst = totalSpendWithoutGst * 1.18; // 18% standard GST

      return {
        date: dateStr,
        project: projectStr,
        totalSpendWithoutGst,
        totalLeads,
        cplWithoutGst,
        totalSpendWithGst
      };
    });

    // Sort by Date Descending, then project name Ascending
    return rows.sort((a, b) => {
      const dComp = b.date.localeCompare(a.date);
      if (dComp !== 0) return dComp;
      return a.project.localeCompare(b.project);
    });
  }, [mergedSpendList, selectedProject, selectedMedium, startDate, endDate]);

  // Calculate Cumulative Overall metrics
  const cumulativeMetrics = useMemo(() => {
    let totalSpendWithoutGst = 0;
    let totalLeads = 0;

    pivotReportData.forEach(row => {
      totalSpendWithoutGst += row.totalSpendWithoutGst;
      totalLeads += row.totalLeads;
    });

    const avgCplWithoutGst = totalLeads > 0 ? (totalSpendWithoutGst / totalLeads) : 0;
    const totalSpendWithGst = totalSpendWithoutGst * 1.18;

    return {
      totalSpendWithoutGst,
      totalLeads,
      avgCplWithoutGst,
      totalSpendWithGst
    };
  }, [pivotReportData]);

  const exportPivotReportToCsv = () => {
    if (pivotReportData.length === 0) return;
    const headers = "Date,Project,Total Spend (W/O GST),Total Leads,CPL (W/O GST),Total Spend with GST (18%)\n";
    const rows = pivotReportData.map(row => {
      const dateStr = parseLocalDate(row.date).replace(/,/g, "");
      const projName = row.project.replace(/,/g, "");
      return `"${dateStr}","${projName}",${row.totalSpendWithoutGst.toFixed(2)},${row.totalLeads},${row.cplWithoutGst.toFixed(2)},${row.totalSpendWithGst.toFixed(2)}`;
    }).join("\n");
    
    const content = headers + rows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `daywise_finance_performance_report_${(selectedProject || "all").toLowerCase().replace(/[\s\(\):]/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Style helper for different ad channels or mediums
  const getMediumBadgeStyles = (medium: string) => {
    const norm = medium.toLowerCase();
    if (norm.includes("meta") || norm.includes("facebook") || norm.includes("instagram")) {
      return "bg-violet-50 text-violet-700 border border-violet-100";
    } else if (norm.includes("google") || norm.includes("projectwise")) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    } else if (norm.includes("linkedin")) {
      return "bg-cyan-50 text-cyan-700 border border-cyan-100";
    } else if (norm.includes("tiktok") || norm.includes("snapchat")) {
      return "bg-pink-50 text-pink-700 border border-pink-100";
    } else {
      return "bg-indigo-50 text-indigo-700 border border-indigo-100";
    }
  };

  // Group and summarize metrics strictly by Ad Account (Medium)
  const adAccountSummary = useMemo(() => {
    let filtered = mergedSpendList;
    if (selectedProject) {
      filtered = filtered.filter(e => e.project === selectedProject);
    }
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    const groups: Record<string, { spend: number; leads: number; dates: Set<string> }> = {};
    
    filtered.forEach(entry => {
      const med = entry.medium || "Unknown Account";
      if (!groups[med]) {
        groups[med] = { spend: 0, leads: 0, dates: new Set() };
      }
      groups[med].spend += entry.spend;
      groups[med].leads += entry.leads;
      groups[med].dates.add(entry.date);
    });

    const totalOverallSpend = Object.values(groups).reduce((acc, c) => acc + c.spend, 0);

    return Object.entries(groups).map(([medium, data]) => {
      const spendWithoutGst = data.spend;
      const spendWithGst = data.spend * 1.18;
      const leads = data.leads;
      const cpl = leads > 0 ? (spendWithoutGst / leads) : 0;
      const activeDays = data.dates.size;
      const percentageOfTotal = totalOverallSpend > 0 ? (spendWithoutGst / totalOverallSpend) * 100 : 0;

      return {
        medium,
        spendWithoutGst,
        spendWithGst,
        leads,
        cpl,
        activeDays,
        percentageOfTotal
      };
    }).sort((a, b) => b.spendWithoutGst - a.spendWithoutGst);
  }, [mergedSpendList, selectedProject, startDate, endDate]);

  // Handle addition of a single record
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const spendNum = parseFloat(formSpend);
    const leadsNum = parseInt(formLeads, 10);

    if (!formDate) {
      setFormError("Please select a date.");
      return;
    }
    if (!formProject) {
      setFormError("Please enter or select a project.");
      return;
    }
    if (!formMedium) {
      setFormError("Please enter or select a medium.");
      return;
    }
    if (isNaN(spendNum) || spendNum < 0) {
      setFormError("Valid non-negative spend amount required.");
      return;
    }
    if (isNaN(leadsNum) || leadsNum < 0) {
      setFormError("Valid non-negative leads number required.");
      return;
    }

    const uniqueId = `entry_${formDate}_${formProject}_${formMedium}_${formAdAccount || ""}`.replace(/[\s\(\):]/g, "_").toLowerCase();

    // Check if entry already exists in seed/active state to prompt or override
    const newEntry: DailySpendEntry = {
      id: uniqueId,
      date: formDate,
      project: formProject,
      medium: formMedium,
      spend: spendNum,
      leads: leadsNum,
      createdAt: new Date().toISOString(),
      adAccount: formAdAccount || undefined
    };

    try {
      await onSave([newEntry]);
      
      // Auto register custom ones
      if (!customProjects.includes(formProject)) {
        setCustomProjects(prev => [...prev, formProject]);
      }
      if (!customMediums.includes(formMedium)) {
        setCustomMediums(prev => [...prev, formMedium]);
      }
      if (formAdAccount && !customAdAccounts.includes(formAdAccount)) {
        setCustomAdAccounts(prev => [...prev, formAdAccount]);
      }

      setFormSuccess(true);
      setFormSpend("");
      setFormLeads("");
      // Temporary success timeout
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err.message || "Failed to persist daily spend entry.");
    }
  };

  // Settings Handlers
  const handleAddProjectSetting = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    const trimmed = newProjectInput.trim();
    if (!trimmed) return;
    if (customProjects.includes(trimmed)) {
      setSettingsError(`The project "${trimmed}" is already on your tracking list.`);
      return;
    }
    setCustomProjects(prev => [...prev, trimmed]);
    setNewProjectInput("");
    setSettingsSuccess(`Successfully added project "${trimmed}"`);
  };

  const handleRemoveProjectSetting = (projToRemove: string) => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setCustomProjects(prev => prev.filter(p => p !== projToRemove));
    if (selectedProject === projToRemove) {
      setSelectedProject(customProjects.find(p => p !== projToRemove) || "");
    }
    if (formProject === projToRemove) {
      setFormProject(customProjects.find(p => p !== projToRemove) || "");
    }
    setSettingsSuccess(`Successfully removed project "${projToRemove}"`);
  };

  const handleAddMediumSetting = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    const trimmed = newMediumInput.trim();
    if (!trimmed) return;
    if (customMediums.includes(trimmed)) {
      setSettingsError(`The medium "${trimmed}" is already on your tracking list.`);
      return;
    }
    setCustomMediums(prev => [...prev, trimmed]);
    setNewMediumInput("");
    setSettingsSuccess(`Successfully added medium "${trimmed}"`);
  };

  const handleRemoveMediumSetting = (medToRemove: string) => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setCustomMediums(prev => prev.filter(m => m !== medToRemove));
    if (selectedMedium === medToRemove) {
      setSelectedMedium("");
    }
    if (formMedium === medToRemove) {
      setFormMedium(customMediums.find(m => m !== medToRemove) || "");
    }
    setSettingsSuccess(`Successfully removed medium "${medToRemove}"`);
  };

  const handleAddAdAccountSetting = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    const trimmed = newAdAccountInput.trim();
    if (!trimmed) return;
    if (customAdAccounts.includes(trimmed)) {
      setSettingsError(`The Ad Account "${trimmed}" is already on your tracking list.`);
      return;
    }
    setCustomAdAccounts(prev => [...prev, trimmed]);
    setNewAdAccountInput("");
    setSettingsSuccess(`Successfully added Ad Account "${trimmed}"`);
  };

  const handleRemoveAdAccountSetting = (acctToRemove: string) => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setCustomAdAccounts(prev => prev.filter(a => a !== acctToRemove));
    if (formAdAccount === acctToRemove) {
      setFormAdAccount(customAdAccounts.find(a => a !== acctToRemove) || "");
    }
    setSettingsSuccess(`Successfully removed Ad Account "${acctToRemove}"`);
  };

  // Preload CSV template for users to load
  const loadCsvTemplate = () => {
    const sample = `Date,Project,Medium,AdAccount,Spend,Leads
2026-06-03,Grand Horizon Residence,Meta Ad Acc,act_40391039 (Meta Direct),1450.50,11
2026-06-03,Grand Horizon Residence,Projectwise Acc,act_883019284 (In-house),2380.00,14
2026-06-04,Grand Horizon Residence,Meta Ad Acc,act_40391039 (Meta Direct),1390.20,9
2026-06-04,Grand Horizon Residence,Projectwise Acc,act_883019284 (In-house),2110.50,16
2026-06-03,Vivaana,Meta Ad Acc,act_40391039 (Meta Direct),890.00,5
2026-06-03,Vivaana,Projectwise Acc,act_883019284 (In-house),1740.00,10`;
    setCsvText(sample);
    setCsvFeedback({ status: "success", message: "Sample CSV template preloaded successfully!" });
  };

  // Handle parsing and importing bulk CSV
  const handleBulkImport = async () => {
    setCsvFeedback({ status: "", message: "" });
    if (!csvText.trim()) {
      setCsvFeedback({ status: "error", message: "Please enter or paste CSV data first." });
      return;
    }

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        setCsvFeedback({ status: "error", message: "CSV content must contain at least a header row and a data row." });
        return;
      }

      // Headers index match
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const dateIdx = headers.findIndex(h => h.includes("date"));
      const projIdx = headers.findIndex(h => h.includes("project"));
      const medIdx = headers.findIndex(h => h.includes("medium") || h.includes("channel") || h.includes("platform"));
      const acctIdx = headers.findIndex(h => h.includes("adaccount") || h.includes("account"));
      const spendIdx = headers.findIndex(h => h.includes("spend") || h.includes("cost") || h.includes("amount"));
      const leadsIdx = headers.findIndex(h => h.includes("leads") || h.includes("conversions"));

      if (dateIdx === -1 || projIdx === -1 || medIdx === -1 || spendIdx === -1 || leadsIdx === -1) {
        setCsvFeedback({
          status: "error",
          message: `Could not parse headers automatically. Ensure your first row contains: 'Date', 'Project', 'Medium', 'Spend', 'Leads'. Found headers: [${lines[0]}]`
        });
        return;
      }

      const parsedEntries: DailySpendEntry[] = [];
      let skippedLines = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // split columns (simple comma split)
        const cols = line.split(",").map(c => c.trim());
        if (cols.length < Math.max(dateIdx, projIdx, medIdx, spendIdx, leadsIdx)) {
          skippedLines++;
          continue;
        }

        const rawDate = cols[dateIdx];
        const project = cols[projIdx];
        const medium = cols[medIdx];
        const adAccountVal = acctIdx !== -1 && cols[acctIdx] ? cols[acctIdx] : "";
        const spendVal = parseFloat(cols[spendIdx]);
        const leadsVal = parseInt(cols[leadsIdx], 10);

        if (!rawDate || !project || !medium || isNaN(spendVal) || isNaN(leadsVal)) {
          skippedLines++;
          continue;
        }

        // Standardize YYYY-MM-DD
        let formattedDate = rawDate;
        if (rawDate.includes("/")) {
          const parts = rawDate.split("/");
          if (parts[0].length === 2 && parts[2]?.length === 4) {
            // DD/MM/YYYY to YYYY-MM-DD
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const id = `entry_${formattedDate}_${project}_${medium}_${adAccountVal || ""}`.replace(/[\s\(\):]/g, "_").toLowerCase();

        parsedEntries.push({
          id,
          date: formattedDate,
          project,
          medium,
          spend: spendVal,
          leads: leadsVal,
          createdAt: new Date().toISOString(),
          adAccount: adAccountVal || undefined
        });
      }

      if (parsedEntries.length === 0) {
        setCsvFeedback({ status: "error", message: "Parsed 0 valid records from the input CSV." });
        return;
      }

      await onSave(parsedEntries);
      
      // Auto-register unique projects and mediums found in CSV
      const newProjs = Array.from(new Set(parsedEntries.map(e => e.project)));
      const newMeds = Array.from(new Set(parsedEntries.map(e => e.medium)));
      const newAdAccs = Array.from(new Set(parsedEntries.map(e => e.adAccount).filter(Boolean))) as string[];
      
      setCustomProjects(prev => {
        const next = [...prev];
        newProjs.forEach(p => {
          if (!next.includes(p)) next.push(p);
        });
        return next;
      });
      setCustomMediums(prev => {
        const next = [...prev];
        newMeds.forEach(m => {
          if (!next.includes(m)) next.push(m);
        });
        return next;
      });
      setCustomAdAccounts(prev => {
        const next = [...prev];
        newAdAccs.forEach(a => {
          if (!next.includes(a)) next.push(a);
        });
        return next;
      });

      setCsvFeedback({
        status: "success",
        message: `Successfully imported ${parsedEntries.length} daily spend records! ${skippedLines > 0 ? `(Skipped ${skippedLines} empty/invalid lines)` : ""}`
      });
      setCsvText("");
    } catch (err: any) {
      setCsvFeedback({ status: "error", message: err.message || "Failed during CSV processing/sync." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info Block */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
          <TrendingUp size={240} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 text-xs bg-indigo-500/50 text-indigo-100 rounded-md font-mono">FINANCE LEDGER</span>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/50 text-emerald-100 rounded-md font-mono">18% GST READY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
              Day-wise Spend Tracker
            </h1>
            <p className="text-indigo-100 text-sm max-w-2xl mt-1.5">
              Log, adjust, and pivot marketing spends day-by-day. Integrates automatically with cost metrics, lead calculations, and tax offsets for Indian real estate setups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab("report")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSubTab === "report" ? "bg-white text-indigo-900 shadow-sm font-bold" : "bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              📊 Daily Report Sheet
            </button>
            <button
              onClick={() => setActiveSubTab("database")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSubTab === "database" ? "bg-white text-indigo-900 shadow-sm font-bold" : "bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              ✍️ Manage Logs
            </button>
            <button
              onClick={() => setActiveSubTab("import")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSubTab === "import" ? "bg-white text-indigo-900 shadow-sm font-bold" : "bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              📥 CSV Bulk Import
            </button>
            <button
              onClick={() => setActiveSubTab("sync")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeSubTab === "sync" ? "bg-white text-indigo-900 shadow-sm font-bold" : "bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              🔗 Sync Meta & Google
            </button>
            <button
              onClick={() => setActiveSubTab("settings")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeSubTab === "settings" ? "bg-white text-indigo-900 shadow-sm font-bold" : "bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600"
              }`}
            >
              ⚙️ Manage Projects & Mediums
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend without GST */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Total Spend (W/O GST)</span>
            <span className="text-xl font-bold text-slate-900 block mt-1">
              {formatINRDecimals(cumulativeMetrics.totalSpendWithoutGst)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Net advertising expense</span>
          </div>
          <div className="bg-violet-50 text-violet-600 p-3 rounded-xl">
            <Coins size={22} />
          </div>
        </div>

        {/* GST Amount (18%) */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">18% GST Offset</span>
            <span className="text-xl font-bold text-slate-900 block mt-1">
              {formatINRDecimals(cumulativeMetrics.totalSpendWithoutGst * 0.18)}
            </span>
            <span className="text-[10px] text-indigo-600 font-bold block mt-1">Tax offset amount</span>
          </div>
          <div className="bg-slate-50 text-slate-600 p-3 rounded-xl">
            <Percent size={22} />
          </div>
        </div>

        {/* Total Spend with GST */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">Total spend with GST</span>
            <span className="text-xl font-bold text-slate-900 block mt-1">
              {formatINRDecimals(cumulativeMetrics.totalSpendWithGst)}
            </span>
            <span className="text-[10px] text-indigo-600 block mt-1">Gross paid amount</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <Coins size={22} />
          </div>
        </div>

        {/* Leads card */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 block font-bold uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap">Overall Leads ({cumulativeMetrics.totalLeads})</span>
            <span className="text-xl font-black text-emerald-955 block mt-0.5">
              CPL: {cumulativeMetrics.avgCplWithoutGst > 0 ? formatINRDecimals(cumulativeMetrics.avgCplWithoutGst) : "₹0.00"}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-1">
              With GST CPL: {cumulativeMetrics.avgCplWithoutGst > 0 ? formatINRDecimals(cumulativeMetrics.avgCplWithoutGst * 1.18) : "₹0.00"}
            </span>
          </div>
          <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Filter and settings Drawer */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
          <Filter size={12} className="text-slate-400" />
          Filter Settings & Dynamic Mapping
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
          {/* Project dropdown */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Project Selector</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800"
            >
              <option value="">-- View All Projects Combined --</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Medium Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Channel / Medium Selector</label>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800"
            >
              <option value="">-- All Mediums/Channels combined --</option>
              {availableMediums.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Date range helpers */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Main SubTab Panels */}
      {activeSubTab === "report" && (
        <div className="space-y-4">
          {/* Sub-view mode toggles */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setReportViewMode("date")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                reportViewMode === "date"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Calendar size={13} /> Day-wise Sheet
            </button>
            <button
              onClick={() => setReportViewMode("account")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                reportViewMode === "account"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Layers size={13} /> Ad Account-wise Spend
            </button>
          </div>

          {reportViewMode === "date" ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedProject || "All Projects combined"} - Day wise Spend Performance Sheet
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Daily project-wise finance ledger details tracking marketing spends, leads, CPL and GST compliance.
                  </p>
                </div>
                {pivotReportData.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={exportPivotReportToCsv}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Export compiled day-wise spend report to CSV spreadsheet"
                    >
                      <Download size={13} />
                      Export CSV Report
                    </button>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-emerald-100">
                      {pivotReportData.length} active reporting days
                    </span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="p-3.5 font-semibold text-center w-28">Date</th>
                      <th className="p-3.5 font-bold text-left text-violet-700 min-w-[200px]">Project Wise (Column A)</th>
                      <th className="p-3.5 font-bold text-right text-slate-900 bg-amber-50/40 min-w-[160px]">Total Spend without GST</th>
                      <th className="p-3.5 font-bold text-right text-slate-900 bg-amber-50/40 min-w-[125px]">Total Leads</th>
                      <th className="p-3.5 font-bold text-right text-teal-800 bg-teal-50/10 min-w-[130px]">CPL W/O GST</th>
                      <th className="p-3.5 font-bold text-right text-slate-955 bg-indigo-50/40 min-w-[170px]">Total Spends with GST (18%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pivotReportData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <Info size={32} className="text-slate-300" />
                            <h4 className="font-bold text-slate-700">No raw records match filters</h4>
                            <p className="text-xs">Go to the "Manage Logs" or "CSV Bulk Import" tabs near the top right to register entry spends.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pivotReportData.map((row, idx) => (
                        <tr key={`${row.date}_${row.project}_${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 text-center font-mono font-medium text-slate-800 bg-slate-50/30">
                            {parseLocalDate(row.date)}
                          </td>
                          <td className="p-3.5 text-left font-semibold text-slate-800">
                            {row.project}
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900 bg-amber-50/10">
                            {formatINRDecimals(row.totalSpendWithoutGst)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900 bg-amber-50/10">
                            {row.totalLeads}
                          </td>
                          <td className="p-3.5 text-right font-bold text-teal-700 bg-teal-50/5">
                            {row.cplWithoutGst > 0 ? formatINRDecimals(row.cplWithoutGst) : "₹0.00"}
                          </td>
                          <td className="p-3.5 text-right font-extrabold text-indigo-900 bg-indigo-50/10">
                            {formatINRDecimals(row.totalSpendWithGst)}
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {/* Aggregate totals table footer */}
                    {pivotReportData.length > 0 && (
                      <tr className="bg-slate-900 text-white font-bold text-xs border-t border-slate-800">
                        <td className="p-4 text-center font-bold uppercase tracking-wide bg-slate-955">
                          Grand Total
                        </td>
                        <td className="p-4 text-left font-bold bg-slate-900">
                          - All Filtered Projects -
                        </td>
                        <td className="p-4 text-right text-amber-300">
                          {formatINRDecimals(cumulativeMetrics.totalSpendWithoutGst)}
                        </td>
                        <td className="p-4 text-right text-amber-300">
                          {cumulativeMetrics.totalLeads}
                        </td>
                        <td className="p-4 text-right text-teal-300">
                          {formatINRDecimals(cumulativeMetrics.avgCplWithoutGst)}
                        </td>
                        <td className="p-4 text-right text-indigo-300">
                          {formatINRDecimals(cumulativeMetrics.totalSpendWithGst)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ad Account Grid Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {adAccountSummary.length === 0 ? (
                  <div className="col-span-full bg-white rounded-xl p-8 border border-slate-100 text-center text-slate-400">
                    No ad accounts detected in this range.
                  </div>
                ) : (
                  adAccountSummary.map((acc) => (
                    <div key={acc.medium} className="bg-white rounded-xl border border-slate-100 p-5 shadow-2xs relative overflow-hidden">
                      {/* Decorative colored badge highlight */}
                      <span className={`absolute right-4 top-4 text-[10px] font-bold px-2 py-0.5 rounded-full ${getMediumBadgeStyles(acc.medium)}`}>
                        {acc.medium}
                      </span>
                      
                      <h4 className="text-sm font-bold text-slate-800 pr-24 truncate mb-1">
                        {acc.medium}
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-4 font-mono">
                        Active run span: {acc.activeDays} days
                      </p>

                      <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Spend (W/O GST)</span>
                          <span className="font-bold text-slate-900 font-mono block mt-0.5">{formatINRDecimals(acc.spendWithoutGst)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">With GST (18%)</span>
                          <span className="font-bold text-indigo-600 font-mono block mt-0.5">{formatINRDecimals(acc.spendWithGst)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Total Leads</span>
                          <span className="font-bold text-slate-800 font-mono block mt-0.5">{acc.leads}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600 block font-bold">AVG. CPL</span>
                          <span className="font-extrabold text-emerald-700 font-mono block mt-0.5">
                            {acc.cpl > 0 ? formatINRDecimals(acc.cpl) : "₹0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Budget Proportion Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                          <span>Share of Spend</span>
                          <span className="font-bold">{acc.percentageOfTotal.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full" 
                            style={{ width: `${Math.min(acc.percentageOfTotal, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Fully Consolidated Ad Account Table */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                      Ad Account Summary Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Relative advertising channels performance, budget weight distribution, and cost metrics comparison.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <th className="p-3">Ad Account / Medium</th>
                        <th className="p-3 text-center w-28">Active Days Run</th>
                        <th className="p-3 text-right">Spend (W/O GST)</th>
                        <th className="p-3 text-right text-slate-500">18% GST Offset</th>
                        <th className="p-3 text-right">Total Spend with GST</th>
                        <th className="p-3 text-right w-24">Leads</th>
                        <th className="p-3 text-right text-teal-800">Effective CPL</th>
                        <th className="p-3 text-right w-32">Budget Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adAccountSummary.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-400">
                            No channels tracked.
                          </td>
                        </tr>
                      ) : (
                        adAccountSummary.map((acc) => (
                          <tr key={acc.medium} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getMediumBadgeStyles(acc.medium)}`}>
                                {acc.medium}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-600 font-mono">
                              {acc.activeDays}
                            </td>
                            <td className="p-3 text-right font-medium text-slate-950 font-mono">
                              {formatINRDecimals(acc.spendWithoutGst)}
                            </td>
                            <td className="p-3 text-right text-slate-400 font-mono">
                              {formatINRDecimals(acc.spendWithoutGst * 0.18)}
                            </td>
                            <td className="p-3 text-right font-extrabold text-slate-900 font-mono">
                              {formatINRDecimals(acc.spendWithGst)}
                            </td>
                            <td className="p-3 text-right text-slate-600 font-mono font-medium">
                              {acc.leads}
                            </td>
                            <td className="p-3 text-right font-bold text-teal-700 bg-teal-50/5 font-mono">
                              {acc.cpl > 0 ? formatINRDecimals(acc.cpl) : "₹0.00"}
                            </td>
                            <td className="p-3 text-right font-bold text-indigo-600 font-mono bg-indigo-50/5">
                              {acc.percentageOfTotal.toFixed(2)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "database" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick interactive form */}
          <div className="lg:col-span-1 bg-white rounded-xl p-5 border border-slate-100 shadow-xs h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded bg-indigo-50 text-indigo-600">
                <Plus size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Daily Spend Entry</h3>
                <p className="text-[10px] text-slate-400">Register direct channel logs</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 px-0.5">
              {/* Form success banner */}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-lg flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span>Entry recorded. Changes synced back!</span>
                </div>
              )}

              {/* Form error banner */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-[11px] rounded-lg">
                  {formError}
                </div>
              )}

              {/* Date Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reporting Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800"
                  required
                />
              </div>

              {/* Project Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Project</label>
                <div className="space-y-1">
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800"
                  >
                    {uniqueProjects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__custom__">+ Enter Custom Project Name</option>
                  </select>
                  {formProject === "__custom__" && (
                    <input
                      type="text"
                      placeholder="e.g. Whispering Pines"
                      onChange={(e) => setFormProject(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Medium Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ad Ledger / Medium</label>
                <div className="space-y-1">
                  <select
                    value={formMedium}
                    onChange={(e) => setFormMedium(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800"
                  >
                    {availableMediums.map((med) => (
                      <option key={med} value={med}>{med}</option>
                    ))}
                    <option value="__custom__">+ Register Custom Channel</option>
                  </select>
                  {formMedium === "__custom__" && (
                    <input
                      type="text"
                      placeholder="e.g. TikTok Ads"
                      onChange={(e) => setFormMedium(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Ad Account Input */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ad Account Name / ID</label>
                <div className="space-y-1">
                  <select
                    value={formAdAccount}
                    onChange={(e) => setFormAdAccount(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white text-slate-800"
                  >
                    {uniqueAdAccounts.map((acct) => (
                      <option key={acct} value={acct}>{acct}</option>
                    ))}
                    <option value="__custom__">+ Enter Custom Ad Account</option>
                  </select>
                  {formAdAccount === "__custom__" && (
                    <input
                      type="text"
                      placeholder="e.g. act_77182939"
                      onChange={(e) => setFormAdAccount(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Spend and Leads */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Daily Spend (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1500"
                    value={formSpend}
                    onChange={(e) => setFormSpend(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Daily Leads</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={formLeads}
                    onChange={(e) => setFormLeads(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500 text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!rolePermission.canManageTargets}
                className={`w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all rounded-lg mt-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                  !rolePermission.canManageTargets ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Plus size={14} />
                Save Daily Log
              </button>
            </form>
          </div>

          {/* Database List Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registered Daily Logs</h3>
                <p className="text-[10px] text-slate-400">Database rows synced in the current partition</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                {mergedSpendList.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="p-3 text-center">Date</th>
                    <th className="p-3">Project</th>
                    <th className="p-3">Medium</th>
                    <th className="p-3">Ad Account</th>
                    <th className="p-3 text-right">Spend</th>
                    <th className="p-3 text-right">Leads</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mergedSpendList.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-mono text-slate-600">{parseLocalDate(entry.date)}</td>
                      <td className="p-3 font-semibold text-slate-800">{entry.project}</td>
                      <td className="p-3 text-slate-600">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.medium === "Meta Ad Acc" ? "bg-violet-50 text-violet-700 border border-violet-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {entry.medium}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {entry.adAccount ? (
                          <span className="font-mono text-[10.5px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {entry.adAccount}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-900 font-mono">{formatINRDecimals(entry.spend)}</td>
                      <td className="p-3 text-right text-slate-600 font-mono">{entry.leads}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDelete(entry.id)}
                          disabled={!rolePermission.canDeleteTargets}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1.5 hover:bg-red-50 rounded transition-all cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "import" && (
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bulk Daily Spend Importer</h3>
                <p className="text-[11px] text-slate-400">Load large numbers of data entries in seconds using CSV files or custom lists.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCsvTemplateFile}
                className="px-3 py-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} /> Download CSV Template
              </button>
              <button
                onClick={loadCsvTemplate}
                className="px-3 py-1.5 text-[11px] font-semibold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers size={13} /> Preload Sample
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-4">
              
              {/* Dynamic drag and drop dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative ${
                  isDragging 
                    ? "border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-inner" 
                    : "border-slate-200 bg-slate-50/35 hover:bg-slate-50/90"
                }`}
              >
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
                  <div className="mx-auto w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Drag and drop your Spend CSV file here</p>
                    <p className="text-[10px] text-slate-500 mt-1">Or click to browse files on your computer (.csv files supported)</p>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CSV Data Preview / Edit</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV comma-separated rows of daily logs here..."
                  rows={8}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono focus:bg-white text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBulkImport}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={13} /> Parse and Sync Logs
                </button>
                {csvText && (
                  <button
                    onClick={() => setCsvText("")}
                    className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Clear Content
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-1 bg-slate-50/50 rounded-xl border border-slate-200/60 p-4 font-sans text-xs space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <Info size={13} className="text-indigo-600" />
                Formatting Directives
              </h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Ensure your pasted data contains standard comma separated values. Row header names must matches these parameters:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-600 text-[11px]">
                <li><strong>Date</strong>: Standard format (e.g., <code>YYYY-MM-DD</code> or <code>DD/MM/YYYY</code>).</li>
                <li><strong>Project</strong>: Target project string.</li>
                <li><strong>Medium</strong>: Ad Account channel identifier (e.g., <code>Meta Ad Acc</code> or <code>Projectwise Acc</code>).</li>
                <li><strong>Spend</strong>: Daily marketing capital spent.</li>
                <li><strong>Leads</strong>: Verified contacts captured.</li>
              </ul>

              {csvFeedback.status && (
                <div className={`p-3 rounded-lg text-[11px] border ${
                  csvFeedback.status === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
                }`}>
                  {csvFeedback.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "sync" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-2xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg border border-indigo-100">
                <RefreshCw size={22} className={syncing ? "animate-spin" : ""} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Campaign API Synchronization Network</h3>
                <p className="text-xs text-slate-500">Connect securely and pull spends directly from Meta Graph and Google Ads dashboards without standard spreadsheet exports.</p>
              </div>
            </div>

            {syncError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl flex items-start gap-2.5 shadow-3xs">
                <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Sync Mismatch:</span> {syncError}
                </div>
                <button onClick={() => setSyncError(null)} className="text-red-400 hover:text-red-650 cursor-pointer">
                  <X size={15} />
                </button>
              </div>
            )}

            {syncSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 shadow-3xs">
                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">API Handshake:</span> {syncSuccess}
                </div>
                <button onClick={() => setSyncSuccess(null)} className="text-emerald-400 hover:text-emerald-650 cursor-pointer">
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Platform settings & authorization status */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-slate-50/55 border border-slate-200/60 p-4.5 rounded-xl space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">1. Choose Platform</h4>
                  
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => {
                        setSyncPlatform("meta");
                        setFetchedCampaignSpends([]);
                      }}
                      className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        syncPlatform === "meta" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Meta Ads
                    </button>
                    <button
                      onClick={() => {
                        setSyncPlatform("google");
                        setFetchedCampaignSpends([]);
                      }}
                      className={`py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        syncPlatform === "google" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Google Ads
                    </button>
                  </div>

                  {/* Authorization panel */}
                  <div className="bg-white rounded-lg p-3.5 border border-slate-100 shadow-3xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Secure Status</span>
                      {(syncPlatform === "meta" ? syncMetaToken : syncGoogleToken) ? (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex items-center gap-1 animate-pulse">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
                          Inactive
                        </span>
                      )}
                    </div>

                    {(syncPlatform === "meta" ? syncMetaToken : syncGoogleToken) ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center gap-2">
                          <Check size={16} className="text-emerald-500" />
                          <div className="text-[10px] text-slate-650 truncate w-full font-mono">
                            {(syncPlatform === "meta" ? syncMetaToken : syncGoogleToken)?.substring(0, 24)}...
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (syncPlatform === "meta") {
                              setSyncMetaToken(null);
                            } else {
                              setSyncGoogleToken(null);
                            }
                            setFetchedCampaignSpends([]);
                          }}
                          className="w-full text-center py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-100 transition-all cursor-pointer"
                        >
                          Revoke Active Session Token
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">
                          Authorize secure popup queries to connect your campaign metrics to the reporting ledger.
                        </p>
                        <button
                          onClick={triggerPlatformOauth}
                          className={`w-full py-2.5 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                            syncPlatform === "meta" 
                              ? "bg-blue-600 hover:bg-blue-700" 
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          <Link size={13} /> OAuth Connect {syncPlatform === "meta" ? "Meta Ads" : "Google Ads"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter and Date Criteria Card */}
                <div className="bg-slate-50/55 border border-slate-200/60 p-4.5 rounded-xl space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">2. Configure Date Limits</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={syncStartDate}
                        onChange={(e) => setSyncStartDate(e.target.value)}
                        className="w-full text-xs border border-slate-250/70 p-2 rounded-lg bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date</label>
                      <input
                        type="date"
                        value={syncEndDate}
                        onChange={(e) => setSyncEndDate(e.target.value)}
                        className="w-full text-xs border border-slate-250/70 p-2 rounded-lg bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-indigo-900 block">Interactive Sandbox Mode</span>
                      <input
                        type="checkbox"
                        checked={isDemoSync}
                        onChange={(e) => setIsDemoSync(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Active by default. Feeds working demo campaigns for evaluating performance filters without configuring GCP or Facebook App credentials first.
                    </p>
                  </div>

                  <button
                    disabled={syncing || !(syncPlatform === "meta" ? syncMetaToken : syncGoogleToken)}
                    onClick={fetchSpendsFromPlatform}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-250 text-white font-bold text-xs rounded-xl shadow-md disabled:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Retriculating API Spends...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} /> Pull Active Spends Report
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Mapping & Live preview */}
              <div className="lg:col-span-8 flex flex-col justify-between border border-slate-100 rounded-xl bg-slate-50/20 p-4 min-h-[420px]">
                {fetchedCampaignSpends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-20 px-6 my-auto space-y-4">
                    <div className="mx-auto bg-slate-100 text-slate-400 p-4 rounded-full border border-slate-220">
                      <Link size={26} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Choose Ad Account & Sync</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-1">
                        Connect Meta Ads or Google Ads in Sandbox or Custom parameters mode. Clicking "Pull Spends" will list campaigns and let you map them securely.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dynamic mapping helper */}
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-2.5 mb-4">
                        <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-black uppercase">
                          <AlertTriangle size={14} className="text-amber-500" />
                          Coordinate Project Mappings
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Meta and Google campaigns return custom ad names. Select which of your designated projects each unique platform campaigns logs into:
                        </p>

                        <div className="divide-y divide-slate-150/65 max-h-48 overflow-y-auto bg-white p-2.5 rounded-lg border border-slate-100 space-y-2">
                          {Object.keys(projectMappings).map(sourceProj => (
                            <div key={sourceProj} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-[10.5px] font-semibold text-slate-700 truncate max-w-xs block select-all font-mono">
                                🌐 {sourceProj}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-400 block">maps to</span>
                                <select
                                  value={projectMappings[sourceProj] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProjectMappings(prev => ({
                                      ...prev,
                                      [sourceProj]: val
                                    }));
                                  }}
                                  className="text-[10.5px] font-semibold border border-slate-200 bg-slate-50/50 p-1 px-1.5 rounded focus:bg-white text-slate-800"
                                >
                                  {customProjects.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fetched list preview */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black uppercase text-slate-450 tracking-wider block">API Spends Log Response</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                            {fetchedCampaignSpends.length} individual dates
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto border border-slate-150/60 rounded-lg max-h-56 bg-white shadow-3xs">
                          <table className="w-full text-xs text-left text-slate-650 divide-y divide-slate-150">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 divide-x divide-slate-150">
                              <tr>
                                <th className="px-3 py-2 bg-slate-100">Date</th>
                                <th className="px-3 py-2 bg-slate-50">Campaign Group (Mapped)</th>
                                <th className="px-3 py-2 bg-slate-100 text-right">Raw Spend</th>
                                <th className="px-3 py-2 bg-slate-50 text-right">Leads</th>
                                <th className="px-3 py-2 bg-slate-100 text-right">CPL</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-650">
                              {fetchedCampaignSpends.map((item, idx) => {
                                const mappedProj = projectMappings[item.project] || item.project;
                                const spendVal = item.spend || 0;
                                const Cpl = item.leads > 0 ? (spendVal / item.leads).toFixed(1) : "0.0";
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-3 py-1.5 font-mono text-slate-500 font-bold whitespace-nowrap bg-slate-50/40 select-all">{item.date}</td>
                                    <td className="px-3 py-1.5 leading-tight font-semibold text-slate-800">
                                      <div className="truncate max-w-[200px]" title={item.project}>{item.project}</div>
                                      <div className="text-[9px] text-indigo-600 block">→ {mappedProj}</div>
                                    </td>
                                    <td className="px-3 py-1.5 text-right font-bold text-slate-800">₹{spendVal.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-emerald-600">{item.leads}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-slate-400">₹{Cpl}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-150 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-3xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sync Summary</span>
                        <p className="text-xs text-slate-700 font-semibold">
                          Total sync commits: <span className="text-indigo-600 font-black">{fetchedCampaignSpends.length} records</span> • Total spend ₹{fetchedCampaignSpends.reduce((sum, e) => sum + e.spend, 0).toLocaleString()}  
                        </p>
                      </div>
                      <button
                        onClick={importSyncedLogs}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer leading-none"
                      >
                        <CheckCircle size={14} /> Commit Sync & Save Entries
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Credentials Info & Settings Manual */}
          <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-900 flex items-center gap-1.5 tracking-wider">
              <Info size={15} className="text-indigo-600" />
              Developer Credentials & Setup Instruction Handbook
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard secure oauth integrations utilize Facebook developers console and GCP credential consoles respectively. Ensure you add the dynamic live redirection parameters inside your developer portals before running production-ready API handshakes:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white rounded-lg border border-slate-150 shadow-4xs space-y-2">
                <span className="px-1.5 py-0.5 text-[9px] bg-blue-50 text-blue-600 rounded font-black uppercase">Meta Developers</span>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">developers.facebook.com</a>, create a Business App, register your `ads_read` permission scope and define the redirect callback:
                </p>
                <div className="p-2 bg-slate-50 text-[10px] font-mono rounded border select-all scrollbar-thin text-slate-800 break-all leading-tight">
                  {window.location.origin}/auth/meta-ads/callback
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-slate-150 shadow-4xs space-y-2">
                <span className="px-1.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-600 rounded font-black uppercase">GCP Cloud Console</span>
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">console.cloud.google.com</a>, generate safe OAuth Client Credentials, include Google Ads API and specify your OAuth Authorized redirect callback:
                </p>
                <div className="p-2 bg-slate-50 text-[10px] font-mono rounded border select-all scrollbar-thin text-slate-800 break-all leading-tight">
                  {window.location.origin}/auth/google-ads/callback
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-450 leading-relaxed font-mono">
              * Required Secrets configuration variables: `META_CLIENT_ID`, `META_CLIENT_SECRET`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`. Configure them dynamically in the AI Studio Settings secret panels.
            </p>
          </div>
        </div>
      )}

      {activeSubTab === "settings" && (
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Manage Mapping Configurations</h3>
              <p className="text-xs text-slate-500">Configure, add, or remove dynamic marketing channels and project tags on-the-fly.</p>
            </div>
          </div>

          {settingsError && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-800 text-xs rounded-lg flex items-center justify-between">
              <span>{settingsError}</span>
              <button onClick={() => setSettingsError(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {settingsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
              <span>{settingsSuccess}</span>
              <button onClick={() => setSettingsSuccess(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project List Configuration */}
            <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Dynamic Projects List</h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  {customProjects.length} defined
                </span>
              </div>

              {/* Form to add */}
              <form onSubmit={handleAddProjectSetting} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Whispering Groves"
                  value={newProjectInput}
                  onChange={(e) => setNewProjectInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              {/* Scrollable list of projects */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-100">
                {customProjects.map((proj) => (
                  <div key={proj} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-all font-medium text-slate-800">
                    <span>{proj}</span>
                    <button
                      onClick={() => handleRemoveProjectSetting(proj)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-all cursor-pointer"
                      title={`Remove project '${proj}' from the options`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Removing a project from this list prevents newly added logs or filters from mapping to it, but doesn't modify underlying historical databases.
              </p>
            </div>

            {/* Mediums configuration */}
            <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Ad Ledgers / Mediums List</h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  {customMediums.length} defined
                </span>
              </div>

              {/* Form to add */}
              <form onSubmit={handleAddMediumSetting} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. YouTube Ads"
                  value={newMediumInput}
                  onChange={(e) => setNewMediumInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              {/* Scrollable list of mediums */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-100">
                {customMediums.map((med) => (
                  <div key={med} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-all text-slate-800 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{med}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMediumSetting(med)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-all cursor-pointer"
                      title={`Remove medium '${med}' from the options`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Removing channel channels prevents them from registering in reports and form lists. Essential defaults like `Meta Ad Acc` are highly recommended.
              </p>
            </div>

            {/* Ad Accounts configuration */}
            <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Dynamic Ad Accounts</h4>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  {customAdAccounts.length} defined
                </span>
              </div>

              {/* Form to add */}
              <form onSubmit={handleAddAdAccountSetting} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. act_712891 (Meta)"
                  value={newAdAccountInput}
                  onChange={(e) => setNewAdAccountInput(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-indigo-500"
                  required
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </form>

              {/* Scrollable list of accounts */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-100">
                {customAdAccounts.map((acct) => (
                  <div key={acct} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-all text-slate-800 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span>{acct}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveAdAccountSetting(acct)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-all cursor-pointer"
                      title={`Remove Ad Account '${acct}' from the options`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Configuring custom Ad Accounts will let you select them inside your daily spend forms to align spends with platform account structures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Footer */}
      <footer className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10.5px] text-slate-400">
        <div>
          &copy; 2026 Marketing Performance Copilot • Secure Cloud Integration
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/privacy-policy" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 hover:underline font-bold"
          >
            Privacy Policy
          </a>
          <span className="text-slate-300">•</span>
          <a 
            href="/data-deletion" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 hover:underline font-bold"
          >
            Data Deletion Policy
          </a>
        </div>
      </footer>
    </div>
  );
}
