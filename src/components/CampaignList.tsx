import React, { useState } from "react";
import { Campaign, ChangeLogEntry, UserRolePermission, MetricComparison, CreativeAsset } from "../types";
import { formatINR, formatIndianNumber, formatIndianShort } from "../utils/indiaHelpers";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Play,
  Pause,
  CloudOff,
  CloudLightning,
  LayoutGrid,
  Table,
  Users,
  MousePointerClick,
  TrendingUp,
  Percent,
  X,
  ArrowDownUp,
  History,
  Clock,
  CheckCircle2,
  Activity,
  Sliders,
} from "lucide-react";

interface CampaignListProps {
  campaigns: Campaign[];
  creatives?: CreativeAsset[];
  onSaveCampaign: (campaign: Campaign) => Promise<void>;
  onDeleteCampaign: (id: string, name: string) => Promise<void>;
  onSaveChangeLog?: (chg: ChangeLogEntry) => Promise<void>;
  rolePermission?: UserRolePermission;
  changeLogs?: ChangeLogEntry[];
  comparisons?: MetricComparison[];
  onSaveComparison?: (comp: MetricComparison) => Promise<void>;
  onDeleteComparison?: (id: string) => Promise<void>;
  onDeleteChangeLog?: (id: string) => Promise<void>;
  onClearAllCampaigns?: () => Promise<void>;
}

export default function CampaignList({
  campaigns,
  creatives = [],
  onSaveCampaign,
  onDeleteCampaign,
  onSaveChangeLog,
  onDeleteChangeLog,
  changeLogs = [],
  comparisons = [],
  onSaveComparison,
  onDeleteComparison,
  onClearAllCampaigns,
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
}: CampaignListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [editedOnly, setEditedOnly] = useState(false);

  // Ledger Sub-Tab dedicated filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerProject, setLedgerProject] = useState("All");
  const [ledgerCategory, setLedgerCategory] = useState("All");
  const [ledgerProgress, setLedgerProgress] = useState("All");

  // Ledger Quick Add forms
  const [showQuickLogForm, setShowQuickLogForm] = useState(false);
  const [quickLogCampaignId, setQuickLogCampaignId] = useState("");
  const [quickLogType, setQuickLogType] = useState("Budget Scale");
  const [quickLogChanged, setQuickLogChanged] = useState("");
  const [quickLogReasonText, setQuickLogReasonText] = useState("");
  const [quickLogProgress, setQuickLogProgress] = useState("Implemented");

  // Comparative metrics section state variables
  const [campaignSubTab, setCampaignSubTab] = useState<"list" | "ledger" | "compare">("list");
  const [compareAId, setCompareAId] = useState("");
  const [compareBId, setCompareBId] = useState("");

  // Benchmark metrics CRUD form & state handlers
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<MetricComparison | null>(null);
  const [compSearch, setCompSearch] = useState("");

  // Benchmark form controls
  const [compMetricName, setCompMetricName] = useState("");
  const [compBeforeValue, setCompBeforeValue] = useState("");
  const [compAfterValue, setCompAfterValue] = useState("");
  const [compImprovedStatus, setCompImprovedStatus] = useState<"Yes" | "No" | "Neutral">("Yes");
  const [compLeadsVal, setCompLeadsVal] = useState<number>(0);
  const [compSvcVal, setCompSvcVal] = useState<number>(0);
  const [compSvcPercentVal, setCompSvcPercentVal] = useState<number>(0);
  const [compBookedVal, setCompBookedVal] = useState<number>(0);
  const [compBookedPercentVal, setCompBookedPercentVal] = useState<number>(0);
  const [compOwnerName, setCompOwnerName] = useState("");
  const [compFollowUpAction, setCompFollowUpAction] = useState("");
  const [compStatusVal, setCompStatusVal] = useState("Active");

  // Modern modal state management
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Custom dialog states for confirmations and alerts inside iframes
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [feedbackAlert, setFeedbackAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState<Campaign["platform"]>("Google Ads");
  const [formStatus, setFormStatus] = useState<Campaign["status"]>("active");
  const [formBudget, setFormBudget] = useState(1000);
  const [formSpend, setFormSpend] = useState(0);
  const [formConversions, setFormConversions] = useState(0);
  const [formLeads, setFormLeads] = useState(0);
  const [formSvcBooking, setFormSvcBooking] = useState(0);
  const [formClicks, setFormClicks] = useState(0);
  const [formImpressions, setFormImpressions] = useState(0);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formObjectives, setFormObjectives] = useState("");
  const [formEditReason, setFormEditReason] = useState("");
  const [formAdset, setFormAdset] = useState("");
  const [formCreativeType, setFormCreativeType] = useState<"static" | "video">("static");
  const [formCampaignManager, setFormCampaignManager] = useState("");
  const [formCpl, setFormCpl] = useState<number | "">("");

  const platformOptions: Campaign["platform"][] = [
    "Google Ads",
    "Meta (Facebook)",
    "LinkedIn",
    "TikTok",
    "YouTube",
  ];

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setFormName("");
    setFormPlatform("Google Ads");
    setFormStatus("active");
    setFormBudget(3000);
    setFormSpend(0);
    setFormConversions(0);
    setFormLeads(0);
    setFormSvcBooking(0);
    setFormClicks(0);
    setFormImpressions(0);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setFormObjectives("");
    setFormEditReason("");
    setFormAdset("");
    setFormCreativeType("static");
    setFormCampaignManager("");
    setFormCpl("");
    setShowModal(true);
  };

  const handleOpenEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setFormName(c.name);
    setFormPlatform(c.platform);
    setFormStatus(c.status);
    setFormBudget(c.budget);
    setFormSpend(c.spend);
    setFormConversions(c.conversions);
    setFormLeads(c.leads ?? c.conversions ?? 0);
    setFormSvcBooking(c.svcBooking ?? 0);
    setFormClicks(c.clicks);
    setFormImpressions(c.impressions);
    setFormStartDate(c.startDate || "");
    setFormEndDate(c.endDate || "");
    setFormObjectives(c.objectives || "");
    setFormEditReason("");
    setFormAdset(c.adset || "");
    setFormCreativeType(c.creativeType || "static");
    setFormCampaignManager(c.campaignManager || "");
    setFormCpl(c.cpl !== undefined ? c.cpl : "");
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const baseCampaign: Campaign = {
      id: editingCampaign ? editingCampaign.id : "temp-" + Date.now(),
      name: formName,
      platform: formPlatform,
      status: formStatus,
      budget: Number(formBudget),
      spend: Number(formSpend),
      conversions: Number(formLeads),
      leads: Number(formLeads),
      svcBooking: Number(formSvcBooking),
      clicks: Number(formClicks),
      impressions: Number(formImpressions),
      startDate: formStartDate,
      endDate: formEndDate,
      objectives: formObjectives,
      createdAt: editingCampaign ? editingCampaign.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adset: formAdset.trim() || undefined,
      creativeType: formCreativeType,
      campaignManager: formCampaignManager.trim() || undefined,
      cpl: formCpl !== "" ? Number(formCpl) : undefined,
    };

    await onSaveCampaign(baseCampaign);

    // If editing an existing campaign, automatically append a detailed audit ChangeLogEntry entry
    if (editingCampaign && onSaveChangeLog) {
      const changes: string[] = [];
      if (editingCampaign.name !== formName) {
        changes.push(`Name: "${editingCampaign.name}" ➔ "${formName}"`);
      }
      if (editingCampaign.status !== formStatus) {
        changes.push(`Status: "${editingCampaign.status}" ➔ "${formStatus}"`);
      }
      if (Number(editingCampaign.budget) !== Number(formBudget)) {
        changes.push(`Budget: $${editingCampaign.budget.toLocaleString()} ➔ $${Number(formBudget).toLocaleString()}`);
      }
      if (Number(editingCampaign.spend) !== Number(formSpend)) {
        changes.push(`Spend: $${editingCampaign.spend.toLocaleString()} ➔ $${Number(formSpend).toLocaleString()}`);
      }
      const oldLeads = editingCampaign.leads ?? editingCampaign.conversions ?? 0;
      if (Number(oldLeads) !== Number(formLeads)) {
        changes.push(`Leads: ${oldLeads} ➔ ${Number(formLeads)}`);
      }
      const oldSvc = editingCampaign.svcBooking ?? 0;
      if (Number(oldSvc) !== Number(formSvcBooking)) {
        changes.push(`SVC Booking: ${oldSvc} ➔ ${Number(formSvcBooking)}`);
      }
      if (Number(editingCampaign.clicks) !== Number(formClicks)) {
        changes.push(`Clicks: ${editingCampaign.clicks} ➔ ${Number(formClicks)}`);
      }
      if (Number(editingCampaign.impressions) !== Number(formImpressions)) {
        changes.push(`Impressions: ${editingCampaign.impressions} ➔ ${Number(formImpressions)}`);
      }
      if ((editingCampaign.objectives || "") !== formObjectives) {
        changes.push("Objectives/Targeting modified");
      }
      if ((editingCampaign.adset || "") !== formAdset) {
        changes.push(`Adset: "${editingCampaign.adset || "None"}" ➔ "${formAdset || "None"}"`);
      }
      if ((editingCampaign.creativeType || "static") !== formCreativeType) {
        changes.push(`Format: "${editingCampaign.creativeType || "static"}" ➔ "${formCreativeType}"`);
      }
      if ((editingCampaign.campaignManager || "") !== formCampaignManager) {
        changes.push(`Manager: "${editingCampaign.campaignManager || "None"}" ➔ "${formCampaignManager || "None"}"`);
      }
      if ((editingCampaign.cpl ?? "") !== formCpl) {
        changes.push(`Manual CPL: "${editingCampaign.cpl ?? "None"}" ➔ "${formCpl ?? "None"}"`);
      }

      const activeChanges = changes.length > 0 ? changes.join(", ") : "Saved attributes without changes";
      const reasonText = formEditReason.trim() || "Routine parameter optimizations and budget fine-tuning.";

      const chgLog: ChangeLogEntry = {
        id: "chg-" + Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString().split("T")[0],
        project: formPlatform,
        campaignId: editingCampaign.id,
        campaignName: formName,
        adSetName: formAdset || "Primary",
        campaignStatus: formStatus,
        type: "Parameter Adjustment",
        changed: activeChanges,
        reason: reasonText,
        createdAt: new Date().toISOString()
      };

      await onSaveChangeLog(chgLog);
    }

    setShowModal(false);
  };

  // Open modal for editing or adding comparative metrics
  const handleOpenAddComp = () => {
    setEditingComp(null);
    setCompMetricName("");
    setCompBeforeValue("");
    setCompAfterValue("");
    setCompImprovedStatus("Yes");
    setCompLeadsVal(0);
    setCompSvcVal(0);
    setCompSvcPercentVal(0);
    setCompBookedVal(0);
    setCompBookedPercentVal(0);
    setCompOwnerName("");
    setCompFollowUpAction("");
    setCompStatusVal("Active");
    setShowCompModal(true);
  };

  const handleOpenEditComp = (comp: MetricComparison) => {
    setEditingComp(comp);
    setCompMetricName(comp.metric || "");
    setCompBeforeValue(comp.beforeValue || "");
    setCompAfterValue(comp.afterValue || "");
    setCompImprovedStatus(comp.improved || "Yes");
    setCompLeadsVal(comp.leads || 0);
    setCompSvcVal(comp.svc || 0);
    setCompSvcPercentVal(comp.svcPercent || 0);
    setCompBookedVal(comp.booked || 0);
    setCompBookedPercentVal(comp.bookedPercent || 0);
    setCompOwnerName(comp.owner || "");
    setCompFollowUpAction(comp.followUp || "");
    setCompStatusVal(comp.status || "Active");
    setShowCompModal(true);
  };

  const handleSaveCompSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compMetricName.trim()) return;

    if (onSaveComparison) {
      await onSaveComparison({
        id: editingComp ? editingComp.id : "comp-" + Math.random().toString(36).substring(2, 9),
        metric: compMetricName,
        beforeValue: compBeforeValue,
        afterValue: compAfterValue,
        improved: compImprovedStatus,
        leads: Number(compLeadsVal),
        svc: Number(compSvcVal),
        svcPercent: Number(compSvcPercentVal),
        booked: Number(compBookedVal),
        bookedPercent: Number(compBookedPercentVal),
        owner: compOwnerName,
        followUp: compFollowUpAction,
        status: compStatusVal,
        createdAt: editingComp ? editingComp.createdAt : new Date().toISOString(),
      });
    }
    setShowCompModal(false);
  };

  // Helper to extract project name safely
  const getProjectName = (c: Campaign) => {
    if (c.objectives && c.objectives.includes("Project: ")) {
      const match = c.objectives.match(/Project:\s*([^|]+)/);
      if (match) return match[1].trim();
    }
    return "Vivaana"; // Default fallback project name matching existing data
  };

  // Get distinct list of dynamic developer projects across all campaigns
  const availableProjects = Array.from(
    new Set(campaigns.map((c) => getProjectName(c)))
  ).filter(Boolean);

  // Filters logic
  const filteredCampaigns = campaigns.filter((c) => {
    // Audit log check: check if the campaign has any edited/update history logged
    const campaignLogs = (changeLogs || []).filter((log) => log.campaignId === c.id);
    const hasEdits = campaignLogs.length > 0;
    
    if (editedOnly && !hasEdits) {
      return false;
    }

    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === "All" || c.platform === platformFilter;
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    
    // Project filter logic
    const matchesProject = projectFilter === "All" || getProjectName(c) === projectFilter;

    // Date range overlapping check
    const matchesStartDate = !startDateFilter || !c.startDate || c.startDate >= startDateFilter;
    const matchesEndDate = !endDateFilter || !c.endDate || c.endDate <= endDateFilter;

    return matchesSearch && matchesPlatform && matchesStatus && matchesProject && matchesStartDate && matchesEndDate;
  });

  // Calculate dynamic dashboard summaries based on the active filtered campaigns
  const totalCampaignsCount = filteredCampaigns.length;
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + (Number(c.conversions) || 0), 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);

  const blendedCpl = totalConversions > 0 ? (totalSpend / totalConversions) : 0;
  const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : (totalClicks > 0 ? 1.25 : 0);

  // Advanced dynamic calculations for layman campaign summaries
  const uniqueAdsets = new Set();
  filteredCampaigns.forEach((c) => {
    if (c.objectives && c.objectives.includes("Adset: ")) {
      const match = c.objectives.match(/Adset:\s*([^(|)]+)/);
      if (match) {
        uniqueAdsets.add(match[1].trim());
      } else {
        uniqueAdsets.add("Default_Adset_" + c.id);
      }
    } else {
      uniqueAdsets.add("Default_Adset_" + c.id);
    }
  });
  const totalAdsetsCount = uniqueAdsets.size;

  const filteredCampaignIds = new Set(filteredCampaigns.map((c) => c.id));
  const associatedCreatives = (creatives || []).filter((cr) => filteredCampaignIds.has(cr.campaignId));
  const totalCreativesCount = associatedCreatives.length;

  const creativeChangesCount = (changeLogs || []).filter((log) => 
    filteredCampaignIds.has(log.campaignId) && 
    (log.changeCategory === "Creative" || log.type.toLowerCase().includes("creative") || String(log.changed).toLowerCase().includes("creative"))
  ).length;

  const totalBookingsCount = filteredCampaigns.reduce((sum, c) => sum + (c.svcBooking ?? 0), 0);

  // === CHANGE LEDGER DYNAMIC FILTERS & METHODS ===
  const ledgerProjects = Array.from(new Set(changeLogs.map(l => l.project || "Vivaana"))).filter(Boolean);

  const filteredLedgerEntries = changeLogs.filter((l) => {
    const matchesSearch =
      l.campaignName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      l.changed.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      l.reason.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      l.type.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesProject = ledgerProject === "All" || (l.project || "Vivaana") === ledgerProject;
    const matchesCategory = ledgerCategory === "All" || (l.changeCategory || "Other") === ledgerCategory;
    const matchesProgress = ledgerProgress === "All" || (l.progress || "Implemented") === ledgerProgress;
    return matchesSearch && matchesProject && matchesCategory && matchesProgress;
  });

  const handleQuickLogCampaignChange = (campaignId: string) => {
    setQuickLogCampaignId(campaignId);
    if (!campaignId) return;

    const matchedCamp = campaigns.find(c => c.id === campaignId);
    if (matchedCamp) {
      if (!quickLogChanged || quickLogChanged.trim() === "") {
        setQuickLogChanged(`Optimized budget and audience demographics for ${matchedCamp.name}`);
      }
      if (!quickLogReasonText || quickLogReasonText.trim() === "") {
        const roasVal = matchedCamp.spend > 0 ? ((matchedCamp.conversions * 149) / matchedCamp.spend).toFixed(1) : "0.0";
        setQuickLogReasonText(`Audited performance of campaign "${matchedCamp.name}" on ${matchedCamp.platform}. Status: ${matchedCamp.status}. Recorded clicks: ${matchedCamp.clicks?.toLocaleString() || 0} with ${matchedCamp.conversions || 0} conversions achieving an estimated ${roasVal}x ROAS.`);
      }
    }
  };

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogCampaignId) return;

    const matchedCamp = campaigns.find(c => c.id === quickLogCampaignId);
    let pName = "Vivaana";
    if (matchedCamp) {
      pName = getProjectName(matchedCamp);
    }

    const finalChanged = quickLogChanged.trim() || (matchedCamp ? `Adjusted specifications for ${matchedCamp.name}` : "Adjusted active campaign specifications");
    const finalReason = quickLogReasonText.trim() || "Performance review: monitored KPI progress values.";

    const newLog: ChangeLogEntry = {
      id: "quicklog-" + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split("T")[0],
      project: pName,
      campaignId: quickLogCampaignId,
      campaignName: matchedCamp ? matchedCamp.name : "Ad Campaign Reference",
      adSetName: "Manual_Update",
      campaignStatus: matchedCamp ? matchedCamp.status : "active",
      type: quickLogType,
      changed: finalChanged,
      reason: finalReason,
      createdAt: new Date().toISOString(),
      progress: quickLogProgress,
      changeCategory: quickLogType.includes("Creative") ? "Creative" : quickLogType.includes("Budget") ? "Budget" : "Audience",
    };

    if (onSaveChangeLog) {
      await onSaveChangeLog(newLog);
    }

    // Reset Form
    setQuickLogCampaignId("");
    setQuickLogChanged("");
    setQuickLogReasonText("");
    setShowQuickLogForm(false);
  };

  const handleUpdateEntryProgress = async (entry: ChangeLogEntry, newPrg: string) => {
    if (onSaveChangeLog) {
      const updated: ChangeLogEntry = {
        ...entry,
        progress: newPrg,
        lastEditedAt: new Date().toISOString(),
        lastEditedBy: "System Auditor"
      };
      await onSaveChangeLog(updated);
    }
  };

  const handleClearCampaignsWithConfirmation = () => {
    if (!onClearAllCampaigns) return;
    setConfirmDialog({
      isOpen: true,
      title: "EXTREME CRITICAL: Purge Campaigns Database?",
      message: "WARNING: This administrative purge operation will immediately and permanently erase ALL configured campaigns, creative mappings, performance histories, and audit change logs from the persistent tracking database. This resets the dashboard completely and cannot be undone. Proceed?",
      onConfirm: async () => {
        try {
          await onClearAllCampaigns();
          setConfirmDialog(null);
          setFeedbackAlert({
            isOpen: true,
            title: "Campaign Database Reset",
            message: "All ad campaigns, audit change logs, and visual performance histories have successfully been cleared. Your system is now initialized with a clean state."
          });
        } catch (e) {
          console.error(e);
          setConfirmDialog(null);
          setFeedbackAlert({
            isOpen: true,
            title: "Database Error",
            message: "An unexpected storage engine response interrupted the delete routines."
          });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Premium Campaigns Sub-Tabs Navigator */}
      <div className="bg-white border border-slate-200/85 p-1 rounded-xl shadow-xs flex select-none max-w-2xl" id="campaigns-tab-navigator">
        <button
          type="button"
          onClick={() => setCampaignSubTab("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            campaignSubTab === "list"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/70"
          }`}
        >
          <Layers size={14} />
          <span>Active Campaigns List</span>
        </button>
        <button
          type="button"
          onClick={() => setCampaignSubTab("compare")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            campaignSubTab === "compare"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/70"
          }`}
        >
          <ArrowDownUp size={14} />
          <span>Comparative Metrics &amp; Sandbox</span>
        </button>
      </div>

      {campaignSubTab === "list" && (
        <>
          {/* Upper header controls */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
          <h2 className="text-base font-bold text-slate-900">Campaigns</h2>
          <p className="text-xs text-slate-500">
            Publish campaigns, modify budgets, track performance metrics, and audit history logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Edited Campaigns Filter Segment Switcher */}
          <div className="flex bg-amber-50/75 p-1 rounded-lg border border-amber-200" id="edited-campaigns-toggle">
            <button
              type="button"
              onClick={() => setEditedOnly(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all text-xs font-bold cursor-pointer ${
                editedOnly
                  ? "bg-amber-500 text-white shadow-xs font-extrabold"
                  : "text-amber-800 hover:text-amber-900"
              }`}
              title="Only show campaigns with edited history"
            >
              <Activity size={12} className={editedOnly ? "animate-pulse" : ""} />
              <span>Edited Only</span>
            </button>
            <button
              type="button"
              onClick={() => setEditedOnly(false)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all text-xs font-bold cursor-pointer ${
                !editedOnly
                  ? "bg-white text-slate-800 border border-slate-200/50 shadow-3xs"
                  : "text-amber-700 hover:text-amber-800"
              }`}
              title="Show all campaigns"
            >
              <span>All Campaigns</span>
            </button>
          </div>

          {/* View Mode Segment Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200" id="view-mode-selector">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-bold font-display cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-indigo-705 text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="End-to-End Table View"
            >
              <Table size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-xs font-bold font-display cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-indigo-755 text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Modern Grid View"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
          </div>

          {rolePermission.canCreateCampaigns ? (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-4 py-2.5 rounded-lg shadow-sm font-display transition-all cursor-pointer self-stretch sm:self-auto grow sm:grow-0"
            >
              <Plus size={15} />
              <span>Create Ad Campaign</span>
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg self-stretch sm:self-auto grow sm:grow-0 cursor-not-allowed"
              title="Campaign creation is disabled under your simulated security role policy"
            >
              <Plus size={15} className="text-slate-300" />
              <span>Creation Locked</span>
            </button>
          )}
        </div>
      </div>

      {/* Premium Analytics Dashboard Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 animate-fade-in" id="campaigns-mini-dashboard">
        {/* Card 1: Total Campaigns */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Layers size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Total Campaigns</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {totalCampaignsCount}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">Active tracked</span>
          </div>
        </div>

        {/* Card 2: Total Adsets */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <Sliders size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Total Adsets</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {totalAdsetsCount}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">Target groupings</span>
          </div>
        </div>

        {/* Card 3: Total Creatives */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Sparkles size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Total Creatives</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {totalCreativesCount}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">Ad variants list</span>
          </div>
        </div>

        {/* Card 4: Creatives Changed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <History size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Creatives Changed</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {creativeChangesCount}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">Audit log tracer</span>
          </div>
        </div>

        {/* Card 5: Amount Spent */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 shrink-0">
            <DollarSign size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Amount Spent</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {formatINR(totalSpend)}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">Blended direct cost</span>
          </div>
        </div>

        {/* Card 6: Total Bookings */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs flex items-center gap-3.5 hover:border-slate-350 hover:shadow-sm transition-all">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <CheckCircle2 size={17} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block leading-tight">Total Bookings</span>
            <span className="text-base font-extrabold text-slate-900 block mt-0.5 font-mono">
              {totalBookingsCount}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">SVC Bookings achieved</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Multi-factor Search & Filter Module */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4" id="campaigns-advanced-filters-panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold uppercase tracking-wider font-display">
            <Filter size={13} className="text-indigo-600" />
            <span>Interactive Filtering &amp; Date Chronology Matrix</span>
          </div>
          {(searchTerm || platformFilter !== "All" || statusFilter !== "All" || projectFilter !== "All" || startDateFilter || endDateFilter || !editedOnly) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPlatformFilter("All");
                setStatusFilter("All");
                setProjectFilter("All");
                setStartDateFilter("");
                setEndDateFilter("");
                setEditedOnly(true);
              }}
              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"
            >
              <X size={11} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Row 1, Col 1-2: Campaign Search Input */}
          <div className="md:col-span-2 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Campaign</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Type to filter by campaign title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-705 outline-hidden focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400 font-semibold"
              />
            </div>
          </div>

          {/* Row 1, Col 3: Platform Selection Option */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Marketing Network</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold cursor-pointer"
            >
              <option value="All">All Networks</option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Row 1, Col 4: Status Filter Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Leads Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Row 2, Col 1: Project Dropdown Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Marketing Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-605 text-slate-600 font-bold cursor-pointer"
            >
              <option value="All">All Projects</option>
              {availableProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2, Col 2: Start Date picker */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-display flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              <span>Range Start Date</span>
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden font-medium"
            />
          </div>

          {/* Row 2, Col 3: End Date picker */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-display flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              <span>Range End Date</span>
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden font-medium"
            />
          </div>

          {/* Row 2, Col 4: Performance feedback counter */}
          <div className="flex items-end">
            <div className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg text-center text-[10.5px] font-bold text-slate-500 select-none">
              Found <span className="text-indigo-600 font-mono font-extrabold">{filteredCampaigns.length}</span> matching records
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Listing */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <HelpCircle size={44} className="mx-auto text-slate-350 text-slate-350 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-800">No campaigns found matching criteria</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Try adjusting your search queries, clearing active network filters, or launch a brand new campaign.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* END-TO-END TABLE VIEW MODE */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in" id="campaigns-table-container">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-650 font-bold font-display">
                  <th className="p-4 w-[340px]">Campaign &amp; Platform</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Date Range</th>
                  <th className="p-4 text-center">Amount Spent</th>
                  <th className="p-4 text-center">Impressions</th>
                  <th className="p-4 text-center">Clicks (CTR)</th>
                  <th className="p-4 text-center">Leads</th>
                  <th className="p-4 text-center">SVC Booking</th>
                  <th className="p-4 text-center">Est. ROAS</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705 font-medium">
                {filteredCampaigns.map((c) => {
                  const spendRatio = c.budget > 0 ? (c.spend / c.budget) * 100 : 0;
                  const leadsVal = c.leads ?? c.conversions ?? 0;
                  const svcVal = c.svcBooking ?? 0;
                  const roas = c.spend > 0 ? ((leadsVal * 149) / c.spend).toFixed(1) : "0.0";
                  const clicksCTR = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
                  const svcPercent = leadsVal > 0 ? ((svcVal / leadsVal) * 100).toFixed(1) : "0.0";

                  // Find latest changelog log for this campaign
                  const campaignLogs = (changeLogs || [])
                    .filter((log) => log.campaignId === c.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  const latestLog = campaignLogs[0];
                  
                  const campCreatives = creatives.filter((cr) => cr.campaignId === c.id);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 transition-all">
                      {/* Campaign & Platform */}
                      <td className="p-4 space-y-1.5 whitespace-normal">
                        <div className="font-bold text-slate-900 text-sm font-display leading-tight">{c.name}</div>
                        {c.objectives && (
                          <p className="text-[10.5px] text-slate-500 line-clamp-2 max-w-[320px] italic">
                            "{c.objectives}"
                          </p>
                        )}
                        <span className="inline-block text-[9px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-120">
                          {c.platform}
                        </span>

                        {/* Operational tags row */}
                        {(c.adset || c.creativeType || c.campaignManager) && (
                          <div className="flex flex-wrap items-center gap-1 mt-1 pl-0.5">
                            {c.adset && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-sans text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200" title={`Adset: ${c.adset}`}>
                                <span className="font-extrabold text-[8px] uppercase text-slate-400 font-display">Set:</span>
                                <span className="font-bold truncate max-w-[130px]">{c.adset}</span>
                              </span>
                            )}
                            {c.creativeType && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-sans px-2 py-0.5 rounded border ${
                                c.creativeType === 'static' 
                                  ? 'text-indigo-650 bg-indigo-50/50 border-indigo-150' 
                                  : 'text-rose-650 bg-rose-50/50 border-rose-150'
                              }`} title={`Format: ${c.creativeType}`}>
                                <span className="font-extrabold text-[8px] uppercase opacity-70 font-display">Type:</span>
                                <span className="font-bold capitalize">{c.creativeType}</span>
                              </span>
                            )}
                            {c.campaignManager && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-sans text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-150" title={`Manager: ${c.campaignManager}`}>
                                <span className="font-extrabold text-[8px] uppercase text-emerald-400 font-display">Mgr:</span>
                                <span className="font-bold">{c.campaignManager}</span>
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Display change log audit details */}
                        {latestLog && (
                          <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg text-[10px] text-slate-700 leading-normal max-w-[325px] shadow-3xs space-y-1">
                            <div className="flex items-center justify-between text-amber-800 text-[9.5px] font-black uppercase tracking-wider border-b border-amber-200/40 pb-1">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                🔧 Active Updated Campaign
                              </span>
                              <span className="text-[8px] bg-amber-200/60 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">
                                {latestLog.changeCategory || "Audit Edit"}
                              </span>
                            </div>
                            <div className="space-y-1 mt-1 text-[10.5px]">
                              <div>
                                <span className="font-extrabold text-amber-900">Latest Update: </span>
                                <span className="font-semibold text-slate-800">{latestLog.changed}</span>
                              </div>
                              <div>
                                <span className="font-extrabold text-amber-900">Reason for Edit: </span>
                                <span className="italic text-slate-650 font-medium">{latestLog.reason}</span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono pt-1 flex justify-between items-center border-t border-amber-100/40 mt-1">
                                <span className="font-medium text-slate-500">
                                  Last Updated: <span className="font-semibold text-slate-700">{latestLog.lastEditedAt ? new Date(latestLog.lastEditedAt).toLocaleString() : latestLog.date}</span>
                                </span>
                                {latestLog.lastEditedBy && (
                                  <span className="font-semibold text-slate-650">By: {latestLog.lastEditedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Display associated creatives performance if present */}
                        {campCreatives.length > 0 && (
                          <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-[10.5px] max-w-[320px] space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-650 font-display">
                              <span>🖼️ Associated Creatives ({campCreatives.length})</span>
                            </div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                              {[...campCreatives].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((cr, idx) => {
                                const crCtr = cr.spend > 0 ? ((cr.clicks / cr.spend) * 100).toFixed(2) : "0.00";
                                const isLatestUploaded = idx === 0;
                                return (
                                  <div key={cr.id} className="flex gap-2 items-start pt-1.5 first:pt-0">
                                    <div className="w-9 h-9 bg-slate-100 rounded overflow-hidden border border-slate-200 shrink-0 relative">
                                      <img 
                                        src={cr.imageUrl} 
                                        alt={cr.name} 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="font-bold text-slate-800 truncate block max-w-[150px]" title={cr.name}>{cr.name}</span>
                                        {isLatestUploaded && (
                                          <span className="text-[7.5px] bg-indigo-50 text-indigo-705 border border-indigo-150 px-1 py-0 rounded font-extrabold font-sans uppercase shrink-0">Latest</span>
                                        )}
                                      </div>
                                      <p className="text-[9px] text-slate-500 block truncate mt-0.5 leading-none">
                                        "{cr.headline}"
                                      </p>
                                      <p className="text-[9px] text-slate-505 font-mono mt-0.5 font-semibold">
                                        Sp: {formatINR(cr.spend)} • Cl: {cr.clicks} ({crCtr}%) • Co: {cr.conversions}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span
                          className={`text-[9.5px] uppercase tracking-wide px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                            c.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : c.status === "paused"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : c.status === "completed"
                              ? "bg-slate-50 text-slate-600 border border-slate-200"
                              : "bg-blue-50 text-blue-600 border border-blue-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {c.status}
                        </span>
                      </td>

                      {/* Date Range */}
                      <td className="p-4 text-center text-slate-500 text-[11px] font-mono whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar size={11} className="text-slate-400 shrink-0" />
                          <span>{c.startDate || "N/A"} - {c.endDate || "N/A"}</span>
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="p-4 text-center font-mono text-slate-800 font-bold whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span>{formatINR(c.spend)}</span>
                          <span className="text-[9px] text-slate-450 font-normal mt-0.5">
                            {spendRatio.toFixed(0)}% Util.
                          </span>
                        </div>
                      </td>

                      {/* Impressions */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-800">{c.impressions.toLocaleString()}</div>
                      </td>

                      {/* Clicks (CTR) */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-800">{c.clicks.toLocaleString()}</div>
                        <div className="text-[9.5px] text-slate-400">({clicksCTR}%)</div>
                      </td>

                      {/* Leads */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-850">{leadsVal.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5" title={c.cpl !== undefined ? "Manual Override target CPL" : "Dynamic computed CPL based on actual spend"}>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">CPL:</span>{" "}
                          <span className={`${c.cpl !== undefined ? 'text-indigo-600 font-bold' : 'text-slate-700'} font-mono`}>
                            {formatINR(c.cpl !== undefined ? c.cpl : (leadsVal > 0 ? (c.spend / leadsVal) : 0))}
                          </span>
                        </div>
                      </td>

                      {/* SVC Booking */}
                      <td className="p-4 text-center font-mono whitespace-nowrap">
                        <div className="font-bold text-indigo-800">{svcVal.toLocaleString()}</div>
                        <div className="text-[9.5px] text-slate-450">({svcPercent}%)</div>
                      </td>

                      {/* Est. ROAS */}
                      <td className="p-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20 whitespace-nowrap">
                        {roas}x
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (rolePermission.canEditCampaigns) {
                                handleOpenEditModal(c);
                              } else {
                                setFeedbackAlert({
                                  isOpen: true,
                                  title: "Access Restricted",
                                  message: "Locked: Your simulated role does not grant campaign modification permissions."
                                });
                              }
                            }}
                            disabled={!rolePermission.canEditCampaigns}
                            className={`p-1.5 border rounded-lg transition-all ${
                              rolePermission.canEditCampaigns
                                ? "border-slate-150 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                                : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                            }`}
                            title={rolePermission.canEditCampaigns ? "Edit Analytics" : "Edit Locked"}
                          >
                            <Edit size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!rolePermission.canDeleteCampaigns) {
                                setFeedbackAlert({
                                  isOpen: true,
                                  title: "Deletion Locked",
                                  message: "Policy violation: Campaign deletions are forbidden under your simulated role."
                                });
                                return;
                              }
                              setConfirmDialog({
                                isOpen: true,
                                title: "Confirm Campaign Deletion",
                                message: `Are you absolutely sure you want to permanently delete campaign "${c.name}"? This operation will append a deletion log in the audit history.`,
                                onConfirm: async () => {
                                  await onDeleteCampaign(c.id, c.name);
                                  setConfirmDialog(null);
                                }
                              });
                            }}
                            disabled={!rolePermission.canDeleteCampaigns}
                            className={`p-1.5 border rounded-lg transition-all ${
                              rolePermission.canDeleteCampaigns
                                ? "border-slate-150 text-slate-400 hover:text-rose-500 hover:bg-slate-50 hover:border-rose-100 cursor-pointer"
                                : "border-slate-100 text-slate-200 cursor-not-allowed"
                            }`}
                            title={rolePermission.canDeleteCampaigns ? "Delete Campaign" : "Deletion Locked"}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* TABLE BOTTOM SUMMARY TOTALS ROW */}
                <tr className="bg-slate-50/80 border-t border-slate-200 text-slate-900 font-bold">
                  <td className="p-4 text-slate-800 text-[11px] font-extrabold uppercase tracking-wider font-sans" colSpan={3}>
                    Summary Totals ({filteredCampaigns.length} Campaigns)
                  </td>
                  <td className="p-4 text-center font-mono whitespace-nowrap text-slate-900 font-bold">
                    {formatINR(filteredCampaigns.reduce((sum, c) => sum + c.spend, 0))}
                  </td>
                  <td className="p-4 text-center font-mono whitespace-nowrap text-slate-900 font-bold">
                    {filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-center font-mono whitespace-nowrap">
                    <div className="font-bold text-slate-905">{filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}</div>
                    <div className="text-[9.5px] text-slate-500 font-normal">
                      {(() => {
                        const clicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
                        const imps = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
                        return imps > 0 ? `(${(clicks / imps * 100).toFixed(2)}%)` : "N/A";
                      })()}
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                    {filteredCampaigns.reduce((sum, c) => sum + (c.leads ?? c.conversions ?? 0), 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-center font-mono whitespace-nowrap">
                    <div className="font-bold text-indigo-900">
                      {filteredCampaigns.reduce((sum, c) => sum + (c.svcBooking ?? 0), 0).toLocaleString()}
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-normal">
                      {(() => {
                        const totalLeads = filteredCampaigns.reduce((sum, c) => sum + (c.leads ?? c.conversions ?? 0), 0);
                        const totalSvc = filteredCampaigns.reduce((sum, c) => sum + (c.svcBooking ?? 0), 0);
                        return totalLeads > 0 ? `(${(totalSvc / totalLeads * 100).toFixed(1)}%)` : "(0.0%)";
                      })()}
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/40 whitespace-nowrap">
                    {(() => {
                      const spent = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
                      const leads = filteredCampaigns.reduce((sum, c) => sum + (c.leads ?? c.conversions ?? 0), 0);
                      return spent > 0 ? `${((leads * 149) / spent).toFixed(1)}x` : "0.0x";
                    })()}
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((c) => {
            // Spend ratio helper
            const spendRatio = c.budget > 0 ? (c.spend / c.budget) * 100 : 0;
            const roas = c.spend > 0 ? ((c.conversions * 149) / c.spend).toFixed(1) : "0.0"; // Simulated average checkout value of $149/conv
            const clicksCTR = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";

            // Find latest changelog log for this campaign
            const campaignLogs = (changeLogs || [])
              .filter((log) => log.campaignId === c.id)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latestLog = campaignLogs[0];

            const campCreatives = creatives.filter((cr) => cr.campaignId === c.id);

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status & icon Platform header */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded">
                      {c.platform}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        c.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : c.status === "paused"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : c.status === "completed"
                          ? "bg-slate-50 text-slate-655 text-slate-600 border border-slate-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {c.status}
                    </span>
                  </div>

                  {/* Campaign Title */}
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 pb-1">{c.name}</h3>

                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[32px] mt-1 italic">
                    "{c.objectives || "No specific goal objective defined."}"
                  </p>

                  <div className="h-px bg-slate-50 my-3" />

                  {/* Date information */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{c.startDate || "N/A"}</span>
                    <span>to</span>
                    <span>{c.endDate || "N/A"}</span>
                  </div>

                  {/* Operational Tags block in Grid Card */}
                  {(c.adset || c.creativeType || c.campaignManager || c.cpl) && (
                    <div className="flex flex-wrap gap-1 mb-4 pt-1 bg-slate-50/45 p-1 rounded-lg border border-slate-100/60">
                      {c.adset && (
                        <div className="inline-flex items-center gap-1 text-[9.5px] font-sans text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded" title={`Adset: ${c.adset}`}>
                          <span className="font-extrabold text-[8px] uppercase text-slate-400 font-display">Set:</span>
                          <span className="font-bold truncate max-w-[85px]">{c.adset}</span>
                        </div>
                      )}
                      {c.creativeType && (
                        <div className={`inline-flex items-center gap-1 text-[9.5px] font-sans px-1.5 py-0.5 rounded border ${
                          c.creativeType === 'static' 
                            ? 'text-indigo-650 bg-indigo-50 border-indigo-150' 
                            : 'text-rose-650 bg-rose-50 border-rose-150'
                        }`} title={`Format: ${c.creativeType}`}>
                          <span className="font-extrabold text-[8px] uppercase font-display opacity-85">Type:</span>
                          <span className="font-bold capitalize">{c.creativeType}</span>
                        </div>
                      )}
                      {c.campaignManager && (
                        <div className="inline-flex items-center gap-1 text-[9.5px] font-sans text-emerald-700 bg-emerald-50/50 border border-emerald-150 px-1.5 py-0.5 rounded" title={`Manager: ${c.campaignManager}`}>
                          <span className="font-extrabold text-[8px] uppercase text-emerald-400 font-display">Mgr:</span>
                          <span className="font-bold truncate max-w-[90px]">{c.campaignManager}</span>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-0.5 text-[9.5px] font-sans text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded" title={`CPL Metric`}>
                        <span className="font-extrabold text-[8px] uppercase text-slate-400 font-display">CPL:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {formatINR(c.cpl !== undefined ? c.cpl : (c.conversions > 0 ? (c.spend / c.conversions) : 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Metrics grid row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                    <div>
                      <p className="text-[9px] font-medium text-slate-400 font-display">Conversions</p>
                      <p className="font-bold text-slate-700 mt-0.5 font-mono">{c.conversions}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-slate-400 font-display">Clicks (CTR)</p>
                      <p className="font-bold text-slate-700 mt-0.5 font-mono">
                        {c.clicks} <span className="text-[9px] text-slate-400 font-normal">({clicksCTR}%)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-medium text-slate-400 font-display">Est ROAS</p>
                      <p className="font-bold text-indigo-600 mt-0.5 font-mono">{roas}x</p>
                    </div>
                  </div>

                  {/* Display change log audit details */}
                  {latestLog && (
                    <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg text-[10px] text-slate-700 leading-normal shadow-3xs space-y-1">
                      <div className="flex items-center justify-between text-amber-800 text-[9.5px] font-black uppercase tracking-wider border-b border-amber-200/40 pb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          🔧 Active Updated Campaign
                        </span>
                        <span className="text-[8px] bg-amber-200/60 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">
                          {latestLog.changeCategory || "Audit Edit"}
                        </span>
                      </div>
                      <div className="space-y-1 mt-1 text-[10.5px]">
                        <div>
                          <span className="font-extrabold text-amber-900">Latest Update: </span>
                          <span className="font-semibold text-slate-800">{latestLog.changed}</span>
                        </div>
                        <div>
                          <span className="font-extrabold text-amber-900">Reason for Edit: </span>
                          <span className="italic text-slate-650 font-medium">{latestLog.reason}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono pt-1 flex justify-between items-center border-t border-amber-100/40 mt-1 font-semibold">
                          <span className="font-medium text-slate-500">
                            Last Updated: <span className="font-semibold text-slate-700">{latestLog.lastEditedAt ? new Date(latestLog.lastEditedAt).toLocaleString() : latestLog.date}</span>
                          </span>
                          {latestLog.lastEditedBy && (
                            <span className="font-semibold text-slate-650">By: {latestLog.lastEditedBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display associated creatives performance if present */}
                  {campCreatives.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[10.5px] space-y-2">
                      <div className="flex items-center justify-between text-[10.5px] font-bold text-indigo-755 text-indigo-650 font-display">
                        <span>🖼️ Associated Creatives ({campCreatives.length})</span>
                      </div>
                      <div className="space-y-2.5 max-h-[175px] overflow-y-auto scrollbar-thin divide-y divide-slate-100">
                        {[...campCreatives].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((cr, idx) => {
                          const crCtr = cr.spend > 0 ? ((cr.clicks / cr.spend) * 100).toFixed(2) : "0.00";
                          const isLatestUploaded = idx === 0;
                          return (
                            <div key={cr.id} className="flex gap-2.5 items-start pt-2 first:pt-0">
                              <div className="w-11 h-11 bg-slate-100 rounded overflow-hidden border border-slate-200 shrink-0 relative">
                                <img 
                                  src={cr.imageUrl} 
                                  alt={cr.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-800 truncate block max-w-[140px]" title={cr.name}>{cr.name}</span>
                                  {isLatestUploaded && (
                                    <span className="text-[8.5px] bg-indigo-50 text-indigo-705 border border-indigo-150 px-1 py-0.2 rounded font-extrabold font-sans uppercase shrink-0">Latest</span>
                                  )}
                                </div>
                                <p className="text-[9.5px] text-slate-500 block truncate mt-0.5 font-sans leading-none">
                                  "{cr.headline}"
                                </p>
                                <p className="text-[9.5px] text-slate-505 font-mono mt-1 font-semibold">
                                  Spend: ${cr.spend} • Clicks: {cr.clicks} ({crCtr}%) • Conv: {cr.conversions}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit and Delete controls */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => {
                      if (rolePermission.canEditCampaigns) {
                        handleOpenEditModal(c);
                      } else {
                        setFeedbackAlert({
                          isOpen: true,
                          title: "Access Restricted",
                          message: "Locked: Your simulated role does not grant campaign modification permissions."
                        });
                      }
                    }}
                    disabled={!rolePermission.canEditCampaigns}
                    className={`flex-1 py-1.5 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      rolePermission.canEditCampaigns
                        ? "border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:bg-slate-50 cursor-pointer"
                        : "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                    }`}
                    title={rolePermission.canEditCampaigns ? "Edit Analytics" : "Edit Locked (Check simulated role)"}
                  >
                    <Edit size={12} />
                    Edit Analytics
                  </button>
                  <button
                    onClick={async () => {
                      if (!rolePermission.canDeleteCampaigns) {
                        setFeedbackAlert({
                          isOpen: true,
                          title: "Deletion Locked",
                          message: "Policy violation: Campaign deletions are forbidden under your simulated role."
                        });
                        return;
                      }
                      setConfirmDialog({
                        isOpen: true,
                        title: "Confirm Campaign Deletion",
                        message: `Are you absolutely sure you want to permanently delete campaign "${c.name}"? This operation will append a deletion log in the audit history.`,
                        onConfirm: async () => {
                          await onDeleteCampaign(c.id, c.name);
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    disabled={!rolePermission.canDeleteCampaigns}
                    className={`p-1.5 border rounded-lg transition-all ${
                      rolePermission.canDeleteCampaigns
                        ? "border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-slate-50 cursor-pointer"
                        : "border-slate-100 text-slate-200 bg-slate-50 cursor-not-allowed"
                    }`}
                    title={rolePermission.canDeleteCampaigns ? "Delete Campaign" : "Deletion Locked (Check simulated role)"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Database Control panel */}
      {rolePermission?.role === "Admin" && (
        <div className="mt-8 p-6 bg-rose-50/40 border border-red-100 rounded-2xl space-y-4 shadow-3xs" id="admin-campaign-purger-zone">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Sliders size={16} className="text-rose-650 shrink-0" />
            <span>Super Admin Campaigns Control Panel</span>
          </div>
          <p className="text-xs text-slate-505 font-sans leading-relaxed">
            Highly sensitive action panel. You possess administrative clearance to purge all configured active ad campaigns, creative mappings, performance history nodes, and audit ledger logs. This action resets your performance dashboards completely.
          </p>
          <div>
            <button
              type="button"
              onClick={handleClearCampaignsWithConfirmation}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-rose-100 text-rose-750 font-bold rounded-lg border border-red-200 hover:border-red-300 transition-all text-xs cursor-pointer shadow-3xs hover:shadow-2xs"
            >
              <Trash2 size={13} />
              <span>Purge All Campaigns &amp; Audits</span>
            </button>
          </div>
        </div>
      )}
    </>
  )}

      {campaignSubTab === "ledger" && (
        <div className="space-y-6 animate-fade-in text-slate-800" id="campaign-change-ledger-and-dashboard">
          {/* Part 1: Optimization Dashboard Summary Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1 px-2 border border-indigo-100 text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-50/70 rounded-md">
                    Audit Core
                  </span>
                  <span className="text-slate-350 text-xs">•</span>
                  <span className="text-xs text-slate-500 font-bold font-sans">Campaign Change Ledger Portal</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <History size={18} className="text-indigo-600 animate-pulse" />
                  <span>Strategic Optimization Ledger &amp; Performance Tracker</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Trace historical campaign improvements, audit timestamped action logs, verify reasoning, and inspect visual creative updates side-by-side.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickLogForm(!showQuickLogForm);
                    setQuickLogCampaignId(campaigns[0]?.id || "");
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Log Manual Change Entry</span>
                </button>
              </div>
            </div>

            {/* Performance KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
              {/* Stat 1: Total Campaigns */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Campaigns Monitored</span>
                <span className="text-xl font-black text-slate-900 mt-1 block font-mono">{campaigns.length}</span>
                <span className="text-[10px] text-indigo-600 font-semibold block mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Active platform sync
                </span>
              </div>

              {/* Stat 2: Total Changes Registered */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Registered Updates</span>
                <span className="text-xl font-black text-indigo-700 mt-1 block font-mono">{changeLogs.length}</span>
                <span className="text-[10px] text-slate-500 block mt-1 truncate">
                  Latest: {changeLogs.length > 0 
                    ? new Date(changeLogs[changeLogs.length - 1].createdAt || changeLogs[changeLogs.length - 1].date).toLocaleDateString("en-IN", {day: 'numeric', month: 'short'}) 
                    : "No entries logged"}
                </span>
              </div>

              {/* Stat 3: Sandbox Verification Experiments */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Sandbox Trial Runs</span>
                <span className="text-xl font-black text-amber-700 mt-1 block font-mono">{comparisons.length}</span>
                <span className="text-[10px] text-slate-500 block mt-1 truncate">
                  Win Rate: {(() => {
                    const totalT = comparisons.length;
                    const wins = comparisons.filter(c => c.improved === "Yes").length;
                    return totalT > 0 ? ((wins / totalT) * 100).toFixed(0) : "100";
                  })()}% Improved ratio
                </span>
              </div>

              {/* Stat 4: Last Registered Activity */}
              <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Last Audit Action</span>
                <span className="text-xs font-bold text-slate-800 mt-1.5 block truncate">
                  {(() => {
                    const sorted = [...changeLogs].sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
                    return sorted[0] ? `[${sorted[0].changeCategory || "Optip"}] ${sorted[0].type}` : "None logged today";
                  })()}
                </span>
                <span className="text-[9.5px] text-slate-400 block mt-1 font-mono">
                  {(() => {
                    const sorted = [...changeLogs].sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
                    return sorted[0] 
                      ? new Date(sorted[0].createdAt || sorted[0].date).toLocaleString("en-IN", {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'}) 
                      : "Awaiting adjustments";
                  })()}
                </span>
              </div>
            </div>

            {/* Quick Add Manual Change Log Form (when visible) */}
            {showQuickLogForm && (
              <div className="mt-5 p-4 border border-indigo-100 bg-indigo-50/10 rounded-xl space-y-4 animate-fade-in shadow-2xs">
                <div className="flex items-center justify-between border-b border-indigo-50 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders size={13} className="text-indigo-600 animate-pulse" />
                    <span>Audit New Manual Campaign Change Log Entry</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickLogForm(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleQuickLogSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Target Marketing Campaign</label>
                    <select
                      value={quickLogCampaignId}
                      onChange={(e) => handleQuickLogCampaignChange(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                    >
                      <option value="">-- Choose Campaign --</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          [{getProjectName(c)}] {c.name.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Update Category Type</label>
                    <select
                      value={quickLogType}
                      onChange={(e) => setQuickLogType(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                    >
                      <option value="Budget Scale">Budget Scale / Scaling</option>
                      <option value="Bid Adjustment">Bid Adjustment / Capping</option>
                      <option value="Creative Rotation">Creative Rotation / Copy</option>
                      <option value="Targeting Expansion">Targeting Expansion / Locations</option>
                      <option value="Bid Rule Execution">Bid Rule Automated Action</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Abridged Progress Status</label>
                    <select
                      value={quickLogProgress}
                      onChange={(e) => setQuickLogProgress(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                    >
                      <option value="Planned">Planned / Scheduled</option>
                      <option value="In Progress">In Progress / Testing</option>
                      <option value="Implemented">Implemented / Live</option>
                      <option value="Rolled Back">Rolled Back</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Improvements Made &amp; Metrics Impact</label>
                    <input
                      type="text"
                      value={quickLogChanged}
                      placeholder="e.g. Scaled daily spend budget from $2,500 to $3,200 to maximize high CPA conversion margins"
                      onChange={(e) => setQuickLogChanged(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10.5px] font-bold text-slate-600 mb-1">Explanation / Reason for Amendment</label>
                    <textarea
                      rows={2}
                      value={quickLogReasonText}
                      placeholder="e.g. Campaign CTR hit 2.45% surpassing standard 1.5% target, hence budget scaling requested by developer."
                      onChange={(e) => setQuickLogReasonText(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg text-slate-700 resize-none focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickLogForm(false)}
                      className="px-4 py-1.5 border border-slate-250 text-slate-650 rounded-md font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-all hover:shadow-xs cursor-pointer"
                    >
                      Audit Entry
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Comparative Metrics Live Sandbox Scorecard Summary Block */}
          {comparisons.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
              <h4 className="text-xs font-extrabold text-slate-900 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-500" />
                <span>Historic Comparative Benchmark Targets ({comparisons.length})</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {[...comparisons].reverse().slice(0, 3).map((comp) => {
                  const hasSvc = comp.svc && comp.svc > 0;
                  const hasDeals = comp.booked && comp.booked > 0;
                  return (
                    <div key={comp.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] text-slate-800 line-clamp-1" title={comp.metric}>
                            {comp.metric}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            comp.improved === "Yes"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : comp.improved === "No"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {comp.improved === "Yes" ? "🚀 Improved" : "⚠️ Neutral/Declined"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] mt-2 bg-white p-2 border border-slate-100 rounded-lg">
                          <div>
                            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Baseline (Before)</span>
                            <span className="font-bold text-slate-500 font-mono line-through mt-0.5 block">{comp.beforeValue}</span>
                          </div>
                          <div>
                            <span className="text-[8.5px] font-bold text-indigo-500 uppercase tracking-widest block">Challenger (After)</span>
                            <span className="font-extrabold text-indigo-750 font-mono text-indigo-700 mt-0.5 block">{comp.afterValue}</span>
                          </div>
                        </div>
                        <div className="text-[9.5px] text-slate-500 space-y-0.5 mt-2 select-none">
                          <p className="truncate"><span className="font-bold text-slate-655">Leads:</span> <span className="font-mono">{comp.leads ?? 0}</span></p>
                          {hasSvc && <p className="truncate"><span className="font-bold text-slate-655">SVC:</span> <span className="font-mono">{comp.svc} conducted ({comp.svcPercent}%)</span></p>}
                          {hasDeals && <p className="truncate"><span className="font-bold text-slate-655">Deals:</span> <span className="font-mono">{comp.booked} bookings ({comp.bookedPercent}%)</span></p>}
                        </div>
                      </div>
                      <div className="border-t border-slate-150 pt-2 mt-2 flex items-center justify-between text-[9px] text-slate-400">
                        <span className="font-medium">Audited by: {comp.owner || "Marketing Auditor"}</span>
                        <span className="font-semibold text-slate-450 font-mono truncate max-w-[120px]" title={comp.followUp}>
                          {comp.followUp || "Continuous optimization tracking"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Part 3: Change Ledger Core Interactive Audit Sheet View */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Control Filters Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-50 p-3 border border-slate-150 rounded-xl">
              <div className="flex-1 min-w-0 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  placeholder="Search change logs details, campaign targets, action reasons..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-hidden focus:border-indigo-500 focus:bg-white text-slate-755 font-medium transition-all"
                />
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Project Filter */}
                <div className="flex items-center gap-1">
                  <Filter size={11} className="text-slate-400" />
                  <select
                    value={ledgerProject}
                    onChange={(e) => setLedgerProject(e.target.value)}
                    className="text-[10.5px] px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-705 font-bold outline-hidden cursor-pointer"
                  >
                    <option value="All">All Projects</option>
                    {ledgerProjects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <select
                  value={ledgerCategory}
                  onChange={(e) => setLedgerCategory(e.target.value)}
                  className="text-[10.5px] px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-705 font-bold outline-hidden cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Budget">Budget Amendments</option>
                  <option value="Creative">Creative Rotations</option>
                  <option value="Audience">Audience Targeting</option>
                  <option value="Other">Other Adjustments</option>
                </select>

                {/* Progress Filter */}
                <select
                  value={ledgerProgress}
                  onChange={(e) => setLedgerProgress(e.target.value)}
                  className="text-[10.5px] px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-705 font-bold outline-hidden cursor-pointer"
                >
                  <option value="All">All Progress Stages</option>
                  <option value="Planned">Planned</option>
                  <option value="In Progress">Testing / Active</option>
                  <option value="Implemented">Implemented</option>
                  <option value="Rolled Back">Rolled Back</option>
                </select>

                {/* Clear Filters Button */}
                {(ledgerSearch || ledgerProject !== "All" || ledgerCategory !== "All" || ledgerProgress !== "All") && (
                  <button
                    onClick={() => {
                      setLedgerSearch("");
                      setLedgerProject("All");
                      setLedgerCategory("All");
                      setLedgerProgress("All");
                    }}
                    className="p-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg shrink-0 transition-colors text-[10.5px]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Change Ledger Sheets Table */}
            <div className="border border-slate-150 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="p-3.5 pl-4">Timestamp &amp; Auditor</th>
                    <th className="p-3.5">Target Campaign Info</th>
                    <th className="p-3.5">Improvements Details</th>
                    <th className="p-3.5">Reason for Amendment</th>
                    <th className="p-3.5 text-center">Progress Summary</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(() => {
                    const sorted = [...filteredLedgerEntries].sort((a,b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
                    
                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-14 text-center font-display text-slate-400 text-xs">
                            <History size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="font-bold text-slate-500">No ledger entries match your filter criteria.</p>
                            <p className="text-[10px] text-slate-400 mt-1">Try resetting the parameters or click Log Manual Change Entry to submit an update.</p>
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((log) => {
                      const logDateStr = new Date(log.createdAt || log.date).toLocaleString("en-IN", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const detailList = log.changed ? log.changed.split(" • ") : [];

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Timestamp column */}
                          <td className="p-3.5 pl-4 align-top w-[200px]">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold tracking-tight block flex items-center gap-1 font-mono">
                                <Clock size={10} className="text-slate-350" />
                                {logDateStr}
                              </span>
                              <span className="text-[10.5px] font-extrabold text-slate-850 block">By: Admin Co-Pilot</span>
                              {log.lastEditedAt && (
                                <span className="text-[8.5px] bg-slate-100 border border-slate-205 text-slate-500 block p-1 rounded font-mono">
                                  edited {new Date(log.lastEditedAt).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Target Campaign Info Column */}
                          <td className="p-3.5 align-top w-[220px]">
                            <div className="space-y-1">
                              <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8.5px] font-black uppercase rounded block w-fit">
                                Project: {log.project || "Vivaana"}
                              </span>
                              <p className="font-bold text-slate-900 leading-snug" title={log.campaignName}>
                                {log.campaignName}
                              </p>
                              <span className="text-[9.5px] text-slate-400 font-bold block bg-slate-100 w-fit px-1 py-0.2 rounded mt-0.5">
                                {log.adSetName === "Manual_Update" ? "Manual Registry" : "Automated Rotation"}
                              </span>
                            </div>
                          </td>

                          {/* Improvements details and associated creatives */}
                          <td className="p-3.5 align-top">
                            <div className="space-y-2 max-w-sm">
                              {/* Display textual list of edits */}
                              <div className="space-y-1">
                                {detailList.map((dt, dIdx) => (
                                  <div key={dIdx} className="text-[11.5px] text-slate-705 leading-snug flex items-start gap-1">
                                    <span className="text-indigo-500 shrink-0 mt-1">•</span>
                                    <span>{dt}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Associated Creative Graphical Asset Preview inside the ledger */}
                              {log.creativeImageUrl && (
                                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 max-w-xs animate-fade-in relative group">
                                  <div className="aspect-video w-full max-h-[85px] bg-slate-100 rounded-md overflow-hidden border border-slate-200 relative">
                                    <img 
                                      src={log.creativeImageUrl} 
                                      alt={log.creativeName || "Uploaded variant"} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute top-1 left-1 bg-slate-900/40 text-white font-black text-[8px] px-1 py-0.2 rounded pr-2">
                                      🖼️ PREVIEW
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-[10px] text-slate-900 block truncate leading-tight">
                                      {log.creativeName || "Creative Asset"}
                                    </span>
                                    {log.creativeHeadline && (
                                      <p className="text-[9.5px] text-slate-500 italic truncate leading-snug mt-0.5">
                                        &quot;{log.creativeHeadline}&quot;
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Reason for Amendment Column */}
                          <td className="p-3.5 align-top">
                            <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl text-[11px] text-slate-600 leading-normal max-w-xs italic">
                              &quot;{log.reason || "Uploaded optimized design parameters under active channel targeting to decrease blended CPL."}&quot;
                            </div>
                          </td>

                          {/* Progress Status interactive drop down category wrapper */}
                          <td className="p-3.5 align-center text-center align-top w-[140px]">
                            <div className="space-y-2 flex flex-col items-center">
                              {/* Inline status tag styles */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-block block ${
                                log.progress === "Implemented"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : log.progress === "In Progress"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : log.progress === "Planned"
                                  ? "bg-cyan-50 text-cyan-705 border border-cyan-100"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {log.progress || "Implemented"}
                              </span>

                              {/* Fast inline stage modifier dropdown */}
                              {onSaveChangeLog && (
                                <select
                                  value={log.progress || "Implemented"}
                                  onChange={(e) => handleUpdateEntryProgress(log, e.target.value)}
                                  className="text-[9.5px] px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-655 font-bold outline-hidden cursor-pointer"
                                  title="Reposition adjustment lifecycle stage"
                                >
                                  <option value="Planned">Planned</option>
                                  <option value="In Progress">Testing</option>
                                  <option value="Implemented">Live (Live)</option>
                                  <option value="Rolled Back">Rolled Back</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Action Column for ledger delete */}
                          <td className="p-3.5 text-center align-top w-[80px]">
                            {onDeleteChangeLog && rolePermission.canDeleteCampaigns ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Delete Change Log Entry?",
                                    message: "Are you sure you want to permanently delete this change log entry from the audit records?",
                                    onConfirm: async () => {
                                      await onDeleteChangeLog(log.id);
                                      setConfirmDialog(null);
                                    }
                                  });
                                }}
                                className="p-1 px-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-lg transition-all"
                                title="Delete change log entry"
                              >
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-350">Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {campaignSubTab === "compare" && (
        <div className="space-y-6 animate-fade-in" id="comparative-metrics-hub">
          {/* Section 1: Dashboard Sandbox Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
            <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600 animate-pulse" />
              <span>Interactive Campaign Sandbox Comparator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Select two campaigns side-by-side to instantaneously calculate real-time margin conversions, CTR deltas, and micro-optimization indicators.
            </p>

            {/* Selection Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">Baseline Campaign A (Reference)</label>
                <select
                  value={compareAId}
                  onChange={(e) => setCompareAId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-lg text-slate-705 font-bold outline-hidden focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose Campaign A --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{getProjectName(c)}] {c.name.slice(0, 45)}... ({formatINR(Number(c.spend) || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-display">Comparison Campaign B (Challenger)</label>
                <select
                  value={compareBId}
                  onChange={(e) => setCompareBId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-lg text-slate-705 font-bold outline-hidden focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose Campaign B --</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{getProjectName(c)}] {c.name.slice(0, 45)}... ({formatINR(Number(c.spend) || 0)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sandbox Comparison Output Engine */}
            {(() => {
              const cA = campaigns.find((c) => c.id === compareAId);
              const cB = campaigns.find((c) => c.id === compareBId);

              if (!cA || !cB) {
                return (
                  <div className="border border-dashed border-slate-250 bg-slate-50/50 p-10 rounded-xl text-center mt-5 text-slate-450 font-semibold space-y-1">
                    <ArrowDownUp className="mx-auto text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-600">Dual Campaign Select Required</p>
                    <p className="text-[11px] text-slate-400">Choose a baseline and a challenger campaign from the dropdown lists above to project dynamic analytics.</p>
                  </div>
                );
              }

              // Compute stats campaign A
              const spendA = Number(cA.spend) || 0;
              const imprA = Number(cA.impressions) || 0;
              const clicksA = Number(cA.clicks) || 0;
              const ctrA = imprA > 0 ? (clicksA / imprA) * 100 : (clicksA > 0 ? 1.25 : 0);
              const leadsA = Number(cA.conversions) || 0;
              const cplA = leadsA > 0 ? (spendA / leadsA) : 0;

              // Compute stats campaign B
              const spendB = Number(cB.spend) || 0;
              const imprB = Number(cB.impressions) || 0;
              const clicksB = Number(cB.clicks) || 0;
              const ctrB = imprB > 0 ? (clicksB / imprB) * 100 : (clicksB > 0 ? 1.25 : 0);
              const leadsB = Number(cB.conversions) || 0;
              const cplB = leadsB > 0 ? (spendB / leadsB) : 0;

              // Deltas
              const spendDiff = spendB - spendA;
              const pctSpendDiff = spendA > 0 ? ((spendB - spendA) / spendA) * 105 : 0;

              const imprDiff = imprB - imprA;
              const pctImprDiff = imprA > 0 ? ((imprB - imprA) / imprA) * 100 : 0;

              const clicksDiff = clicksB - clicksA;
              const pctClicksDiff = clicksA > 0 ? ((clicksB - clicksA) / clicksA) * 100 : 0;

              const ctrDiff = ctrB - ctrA;
              const pctCtrDiff = ctrA > 0 ? ((ctrB - ctrA) / ctrA) * 100 : 0;

              const leadsDiff = leadsB - leadsA;
              const pctLeadsDiff = leadsA > 0 ? ((leadsB - leadsA) / leadsA) * 100 : 0;

              const cplDiff = cplB - cplA;
              const pctCplDiff = cplA > 0 ? ((cplB - cplA) / cplA) * 100 : 0;

              return (
                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-750 uppercase tracking-wider">Dynamic Variance Sandbox Results</span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full font-mono">
                      Real-time Comparison
                    </span>
                  </div>

                  <div className="p-5 bg-white space-y-4">
                    {/* Visual columns headers */}
                    <div className="grid grid-cols-12 gap-4 text-center items-center pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-4 text-left">Performance Parameter</div>
                      <div className="col-span-2 text-slate-600 font-extrabold bg-slate-50 py-1 rounded truncate">A: {cA.name.slice(0, 15)}...</div>
                      <div className="col-span-2 text-indigo-700 font-extrabold bg-indigo-50/70 py-1 rounded truncate">B: {cB.name.slice(0, 15)}...</div>
                      <div className="col-span-2">Absolute Delta</div>
                      <div className="col-span-2">Percentage Change</div>
                    </div>

                    {/* Metric 1: Spend */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1">
                      <div className="col-span-4 font-bold text-slate-800">Total Capital Spent</div>
                      <div className="col-span-2 text-center font-mono">{formatINR(spendA)}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{formatINR(spendB)}</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${spendDiff > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {spendDiff >= 0 ? "+" : ""}{formatINR(spendDiff)}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${spendDiff > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {pctSpendDiff >= 0 ? "+" : ""}{pctSpendDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 2: Impressions */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1 border-t border-slate-100">
                      <div className="col-span-4 font-bold text-slate-800">Total Impressions</div>
                      <div className="col-span-2 text-center font-mono">{formatIndianNumber(imprA)}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{formatIndianNumber(imprB)}</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${imprDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {imprDiff >= 0 ? "+" : ""}{formatIndianNumber(imprDiff)}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${imprDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pctImprDiff >= 0 ? "+" : ""}{pctImprDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 3: Clicks */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1 border-t border-slate-100">
                      <div className="col-span-4 font-bold text-slate-800">Ad Click Throughs</div>
                      <div className="col-span-2 text-center font-mono">{formatIndianNumber(clicksA)}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{formatIndianNumber(clicksB)}</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${clicksDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {clicksDiff >= 0 ? "+" : ""}{formatIndianNumber(clicksDiff)}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${clicksDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pctClicksDiff >= 0 ? "+" : ""}{pctClicksDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 4: CTR */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1 border-t border-slate-100">
                      <div className="col-span-4 font-bold text-slate-800">Click-Through Rate (CTR)</div>
                      <div className="col-span-2 text-center font-mono">{ctrA.toFixed(2)}%</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{ctrB.toFixed(2)}%</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${ctrDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {ctrDiff >= 0 ? "+" : ""}{ctrDiff.toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${ctrDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pctCtrDiff >= 0 ? "+" : ""}{pctCtrDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 5: Leads / Conversions */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1 border-t border-slate-100">
                      <div className="col-span-4 font-bold text-slate-800">Conversions (Leads)</div>
                      <div className="col-span-2 text-center font-mono">{leadsA}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{leadsB}</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${leadsDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {leadsDiff >= 0 ? "+" : ""}{leadsDiff}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${leadsDiff >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pctLeadsDiff >= 0 ? "+" : ""}{pctLeadsDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Metric 6: CPL */}
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-755 items-center py-1 border-t border-slate-100">
                      <div className="col-span-4 font-bold text-slate-800">Cost per Lead (CPL)</div>
                      <div className="col-span-2 text-center font-mono">{formatINR(cplA)}</div>
                      <div className="col-span-2 text-center font-mono font-bold text-indigo-705 bg-indigo-50/20">{formatINR(cplB)}</div>
                      <div className={`col-span-2 text-center font-mono font-bold ${cplDiff <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {cplDiff >= 0 ? "+" : ""}{formatINR(cplDiff)}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${cplDiff <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pctCplDiff >= 0 ? "+" : ""}{pctCplDiff.toFixed(1)}% {cplDiff <= 0 ? "Saving" : "Increase"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 2: Historical Benchmark Comparative Ledger */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2 font-display">
                  <ArrowDownUp size={16} className="text-indigo-650 text-indigo-600" />
                  <span>Historical Benchmarks &amp; Comparative Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track and audit multi-factor testing logs, historical before vs after matrices, and site visit booking rates.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddComp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-display"
              >
                <Plus size={14} />
                <span>Add Benchmark Metric</span>
              </button>
            </div>

            {/* Quick Filter Search Benchmarks */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search benchmark parameters or metrics..."
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:bg-white outline-hidden transition-all"
              />
            </div>

            {/* Table of Historic Comparative Benchmarks */}
            <div className="border border-slate-150 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-3 pl-4">Tested Parameter</th>
                    <th className="p-3">Baseline (Before)</th>
                    <th className="p-3">Challenger (After)</th>
                    <th className="p-3 text-center">Improved?</th>
                    <th className="p-3 text-center">Leads</th>
                    <th className="p-3 text-center">SVC Booked / %</th>
                    <th className="p-3 text-center">Deals Booked / %</th>
                    <th className="p-3">Auditor</th>
                    <th className="p-3">Follow-Up Actions</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filteredComps = comparisons.filter(
                      (c) =>
                        c.metric.toLowerCase().includes(compSearch.toLowerCase()) ||
                        c.owner.toLowerCase().includes(compSearch.toLowerCase()) ||
                        c.followUp.toLowerCase().includes(compSearch.toLowerCase())
                    );

                    if (filteredComps.length === 0) {
                      return (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold space-y-1">
                            <HelpCircle className="mx-auto text-slate-200" size={28} />
                            <p className="text-xs text-slate-500">No benchmark comparison logs found.</p>
                            <p className="text-[10px] text-slate-400">Click &quot;Add Benchmark Metric&quot; to log your first benchmark run.</p>
                          </td>
                        </tr>
                      );
                    }

                    return filteredComps.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors font-semibold text-slate-700">
                        <td className="p-3 pl-4 font-bold text-slate-905 text-slate-900">{c.metric}</td>
                        <td className="p-3 font-mono text-slate-550 line-through decoration-slate-300">{c.beforeValue}</td>
                        <td className="p-3 font-mono font-bold text-indigo-705 text-indigo-700 bg-indigo-50/20">{c.afterValue}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                              c.improved === "Yes"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : c.improved === "No"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {c.improved}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{c.leads}</td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-bold text-slate-800">{c.svc}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">({c.svcPercent}%)</span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="font-extrabold text-violet-750 text-violet-750">{c.booked}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">({c.bookedPercent}%)</span>
                        </td>
                        <td className="p-3 text-slate-550">{c.owner}</td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate" title={c.followUp}>
                          {c.followUp || "--"}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-display">
                            <button
                              type="button"
                              onClick={() => handleOpenEditComp(c)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Edit Row"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (onDeleteComparison) {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Delete Comparison Row?",
                                    message: "Are you sure you want to delete this comparison ledger row?",
                                    onConfirm: async () => {
                                      await onDeleteComparison(c.id);
                                      setConfirmDialog(null);
                                    }
                                  });
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Delete Row"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Add / Edit Modal */}
      {showCompModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold font-display text-slate-800 mb-1">
              {editingComp ? "Edit Benchmark Metric Record" : "Log New Benchmark Comparison Run"}
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-sans">
              Enter tested marketing parameters, values before vs after optimization, and recorded conversions/SVC rates.
            </p>

            <form onSubmit={handleSaveCompSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tested Metric / Scenario Title</label>
                <input
                  type="text"
                  placeholder="e.g. CTA Headline A/B Testing on Landing-page"
                  value={compMetricName}
                  onChange={(e) => setCompMetricName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-755 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Baseline Setup (Before Value)</label>
                  <input
                    type="text"
                    placeholder="e.g. CPL Rs.340 / CTR 1.1%"
                    value={compBeforeValue}
                    onChange={(e) => setCompBeforeValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-755"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-605 mb-1 text-slate-600">Challenger Setup (After Value)</label>
                  <input
                    type="text"
                    placeholder="e.g. CPL Rs.230 / CTR 1.8%"
                    value={compAfterValue}
                    onChange={(e) => setCompAfterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-755"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Has Performance Improved?</label>
                  <select
                    value={compImprovedStatus}
                    onChange={(e) => setCompImprovedStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Total Leads Generated</label>
                  <input
                    type="number"
                    min="0"
                    value={compLeadsVal}
                    onChange={(e) => setCompLeadsVal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Campaign Owner / Auditor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul S."
                    value={compOwnerName}
                    onChange={(e) => setCompOwnerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-3.5 border border-slate-100 rounded-xl">
                <div className="sm:col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Site Visit Conversions (SVC)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Visits"
                      value={compSvcVal}
                      onChange={(e) => setCompSvcVal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700 font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={compSvcPercentVal}
                      onChange={(e) => setCompSvcPercentVal(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Booked Deals (Revenue)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Deals"
                      value={compBookedVal}
                      onChange={(e) => setCompBookedVal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700 font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="%"
                      value={compBookedPercentVal}
                      onChange={(e) => setCompBookedPercentVal(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Follow-Up Action Points</label>
                <textarea
                  placeholder="Describe future tasks or optimization directives..."
                  value={compFollowUpAction}
                  onChange={(e) => setCompFollowUpAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg h-16 resize-none text-slate-705"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 font-display">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save Benchmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation and Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-100 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold font-display text-slate-800 mb-1">
              {editingCampaign ? "Edit Ad Campaign Analytics & Settings" : "Configure New Ad Campaign"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Input the baseline properties, goals, and metrics. Saving registers a historical audit log trail automatically.
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Google Search - Eco Rooftop Panels"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Marketing Channel Network</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as Campaign["platform"])}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                  >
                    {platformOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Gate</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Campaign["status"])}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Approved Budget (INR - ₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Spend */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Accumulated Spend (INR - ₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formSpend}
                    onChange={(e) => setFormSpend(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Leads */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Leads Count</label>
                  <input
                    type="number"
                    min={0}
                    value={formLeads}
                    onChange={(e) => setFormLeads(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* SVC Booking */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Service (SVC) Bookings</label>
                  <input
                    type="number"
                    min={0}
                    value={formSvcBooking}
                    onChange={(e) => setFormSvcBooking(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Clicks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ad Clicks</label>
                  <input
                    type="number"
                    min={0}
                    value={formClicks}
                    onChange={(e) => setFormClicks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Impressions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ad Impressions</label>
                  <input
                    type="number"
                    min={0}
                    value={formImpressions}
                    onChange={(e) => setFormImpressions(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Objectives */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Campaign Objectives & Targeting Brief
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe direct marketing audience parameters, targeted keywords, or general objectives"
                    value={formObjectives}
                    onChange={(e) => setFormObjectives(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 resize-none font-sans"
                  />
                </div>

                {/* Operational Meta Configuration Header */}
                <div className="md:col-span-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sliders size={13} className="text-indigo-500" />
                    <span>Operational Metadata &amp; Manager Profile</span>
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mb-3">
                    Assign granular operational owners, specify target Cost Per Lead (CPL) benchmarks, and map direct adset targeting structures.
                  </p>
                </div>

                {/* Adset */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Targeting Adset/Ad Group</label>
                  <input
                    type="text"
                    placeholder="e.g. LAL_5%_RealEstate_Buyers"
                    value={formAdset}
                    onChange={(e) => setFormAdset(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 bg-white"
                  />
                </div>

                {/* Creative Format */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Campaign Creative Format Type</label>
                  <select
                    value={formCreativeType}
                    onChange={(e) => setFormCreativeType(e.target.value as "static" | "video")}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-650 bg-white"
                  >
                    <option value="static">Static Banner / Image Ad</option>
                    <option value="video">Pre-roll Video / Reel / Motion Ad</option>
                  </select>
                </div>

                {/* Campaign Manager */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Campaign Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Rachel Green / Ad Ops Team"
                    value={formCampaignManager}
                    onChange={(e) => setFormCampaignManager(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 bg-white"
                  />
                </div>

                {/* Manual overriding Target CPL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target CPL (INR - ₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Leave empty for auto-calculated spend/leads"
                    value={formCpl}
                    onChange={(e) => setFormCpl(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-705 bg-white"
                  />
                </div>

                {/* Edit Reason - Only show when editing an existing campaign */}
                {editingCampaign && (
                  <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <HelpCircle size={13} className="text-indigo-500" />
                      <span>Reason for Amendment / Edit</span>
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2">
                      Please supply an operational explanation. This is stored in the Change Ledger audit trail.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="e.g. Budget scaled up due to CPA beating targets, pausing low ROI Facebook lookalike sets..."
                      value={formEditReason}
                      onChange={(e) => setFormEditReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 resize-none font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Save Campaign Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Native Confirmation Dialog (No window.confirm blocks) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 animate-fade-in" style={{ zIndex: 9999 }} id="campaign-list-custom-confirm-modal">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{confirmDialog.title}</h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold border border-slate-200 rounded-lg text-xs cursor-pointer"
              >
                Cancel Action
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic System Notice Alert Dialog (No window.alert blocks) */}
      {feedbackAlert && feedbackAlert.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-51 animate-fade-in" style={{ zIndex: 9999 }} id="campaign-list-custom-alert-modal">
          <div className="bg-white border border-slate-150 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <AlertCircle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{feedbackAlert.title}</h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">{feedbackAlert.message}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setFeedbackAlert(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
