import React, { useState, useEffect, useMemo } from "react";
import { RuleConfiguration, Campaign, UserRolePermission } from "../types";
import { formatINR } from "../utils/indiaHelpers";
import { 
  Save, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Plus, 
  Trash2, 
  Folder, 
  Tv, 
  Settings, 
  HelpCircle,
  Database,
  ArrowRight
} from "lucide-react";

interface RuleConfigPanelProps {
  ruleSetting: RuleConfiguration | null;
  ruleSettingsList?: RuleConfiguration[];
  campaigns: Campaign[];
  onSaveRule: (rule: RuleConfiguration) => Promise<void>;
  onDeleteRule?: (id: string) => Promise<void>;
  rolePermission?: UserRolePermission;
}

const getCampaignProject = (camp: Campaign): string => {
  if ((camp as any).projectName) return (camp as any).projectName;
  if (camp.objectives) {
    const match = camp.objectives.match(/Project:\s*([^|]+)/i);
    if (match) return match[1].trim();
  }
  return "General";
};

export default function RuleConfigPanel({
  ruleSetting,
  ruleSettingsList = [],
  campaigns,
  onSaveRule,
  onDeleteRule,
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
}: RuleConfigPanelProps) {
  
  // List of platforms
  const allPlatforms = ["Google Ads", "Meta (Facebook)", "LinkedIn", "TikTok", "YouTube"];

  // Unique projects retrieved from actual Campaigns and mapped performances
  const uniqueProjectsList = useMemo(() => {
    const projects = new Set<string>();
    campaigns.forEach((c) => {
      const proj = getCampaignProject(c);
      if (proj && proj !== "Default" && proj !== "General" && proj !== "Unallocated Projects") {
        projects.add(proj);
      }
    });
    // Fallback known database projects
    const defaults = ["Grand Horizon Residence", "Oakridge Estate", "Solar Lead Expansion", "CRM Enterprise Pitch", "General Solar", "Vivaana"];
    defaults.forEach(d => projects.add(d));
    return Array.from(projects).sort();
  }, [campaigns]);

  // Handle local state for active rule selection
  const [selectedRuleId, setSelectedRuleId] = useState<string>("global");

  // Selection rule sync states
  const [targetCpa, setTargetCpa] = useState(500);
  const [minRoas, setMinRoas] = useState(2.5);
  const [minCtr, setMinCtr] = useState(1.5);
  const [minCvr, setMinCvr] = useState(2.0);
  const [reviewDays, setReviewDays] = useState(3);
  const [warningSpend, setWarningSpend] = useState(1000);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  // Quick Override creator state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [newOverrideScope, setNewOverrideScope] = useState<"project" | "medium">("project");
  const [newOverrideValue, setNewOverrideValue] = useState("");

  // Sync builder values when type switches
  useEffect(() => {
    if (newOverrideScope === "project") {
      setNewOverrideValue(uniqueProjectsList[0] || "");
    } else {
      setNewOverrideValue(allPlatforms[0]);
    }
  }, [newOverrideScope, uniqueProjectsList]);

  // Lookup the rule being currently selected / edited
  const currentEditingRule = useMemo(() => {
    const list = ruleSettingsList || [];
    const found = list.find((r) => r.id === selectedRuleId);
    if (found) return found;

    if (selectedRuleId === "global") {
      return ruleSetting || {
        id: "global",
        targetCpa: 450,
        minRoas: 2.8,
        minCtr: 1.8,
        minCvr: 2.2,
        reviewDays: 4,
        warningSpend: 1200,
        updatedAt: new Date().toISOString()
      };
    }

    // Return empty placeholder for creation with standard global values as defaults
    const globalBase = list.find((r) => r.id === "global") || ruleSetting || {
      targetCpa: 450,
      minRoas: 2.8,
      minCtr: 1.8,
      minCvr: 2.2,
      reviewDays: 4,
      warningSpend: 1200
    };

    return {
      id: selectedRuleId,
      targetCpa: globalBase.targetCpa,
      minRoas: globalBase.minRoas,
      minCtr: globalBase.minCtr,
      minCvr: globalBase.minCvr,
      reviewDays: globalBase.reviewDays,
      warningSpend: globalBase.warningSpend,
      updatedAt: new Date().toISOString()
    };
  }, [selectedRuleId, ruleSettingsList, ruleSetting]);

  // Populate numeric editor variables when switching rules
  useEffect(() => {
    if (currentEditingRule) {
      setTargetCpa(currentEditingRule.targetCpa);
      setMinRoas(currentEditingRule.minRoas);
      setMinCtr(currentEditingRule.minCtr);
      setMinCvr(currentEditingRule.minCvr);
      setReviewDays(currentEditingRule.reviewDays);
      setWarningSpend(currentEditingRule.warningSpend);
    }
  }, [currentEditingRule]);

  // Form Submit: Save current configuration
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolePermission.canManageRules) return;
    setSaveStatus("saving");
    try {
      // Determine scope
      let scope: "global" | "project" | "medium" = "global";
      let scopeValue = "all";
      if (selectedRuleId.startsWith("project:")) {
        scope = "project";
        scopeValue = selectedRuleId.substring("project:".length);
      } else if (selectedRuleId.startsWith("medium:")) {
        scope = "medium";
        scopeValue = selectedRuleId.substring("medium:".length);
      }

      const updatedRule: RuleConfiguration = {
        id: selectedRuleId,
        scope,
        scopeValue,
        targetCpa: Number(targetCpa),
        minRoas: Number(minRoas),
        minCtr: Number(minCtr),
        minCvr: Number(minCvr),
        reviewDays: Number(reviewDays),
        warningSpend: Number(warningSpend),
        updatedAt: new Date().toISOString(),
      };

      await onSaveRule(updatedRule);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  };

  // Delete an override rule
  const handleDeleteOverride = async (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent setting selected editing
    if (!onDeleteRule || !rolePermission.canManageRules) return;
    if (confirm(`Are you sure you want to delete this specific rule override? Campaigns under this scope will fall back to Global Ruleset defaults.`)) {
      setDeleteStatus(ruleId);
      try {
        await onDeleteRule(ruleId);
        if (selectedRuleId === ruleId) {
          setSelectedRuleId("global");
        }
        setDeleteStatus(null);
      } catch (err) {
        console.error("Failed to delete rule override:", err);
        setDeleteStatus(null);
      }
    }
  };

  // Action: Add new custom scope override option
  const handleAddOverrideOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideValue) return;

    const newId = `${newOverrideScope}:${newOverrideValue}`;
    setSelectedRuleId(newId);
    setShowOverrideForm(false);
  };

  // Compile real-time Sentinel Diagnostics with Project and Medium wise specificity!
  interface SentinelAlert {
    type: "critical" | "warning";
    campaignName: string;
    metric: string;
    valueText: string;
    thresholdText: string;
    message: string;
    appliedRuleName: string;
  }

  const alertsList: SentinelAlert[] = [];

  campaigns.forEach((camp) => {
    // Only examine active/running campaigns
    if (camp.status !== "active") return;

    // 1. Resolve applicable rule for this campaign
    const projName = getCampaignProject(camp);
    const projRuleId = `project:${projName}`;
    const medRuleId = `medium:${camp.platform}`;

    const list = ruleSettingsList || [];
    let matchedRule = list.find(r => r.id === projRuleId);
    let matchedRuleLabel = `🏢 Project: ${projName}`;

    if (!matchedRule) {
      matchedRule = list.find(r => r.id === medRuleId);
      matchedRuleLabel = `📺 Medium: ${camp.platform}`;
    }

    if (!matchedRule) {
      matchedRule = list.find(r => r.id === "global") || ruleSetting || {
        id: "global",
        targetCpa: 450,
        minRoas: 2.8,
        minCtr: 1.8,
        minCvr: 2.2,
        reviewDays: 4,
        warningSpend: 1200,
        updatedAt: ""
      };
      matchedRuleLabel = "🌐 Global Standard";
    }

    const ruleThresholdCpa = matchedRule.targetCpa;
    const ruleThresholdSpend = matchedRule.warningSpend;
    const ruleThresholdRoas = matchedRule.minRoas;
    const ruleThresholdCtr = matchedRule.minCtr;
    const ruleThresholdCvr = matchedRule.minCvr;

    // Evaluated CPA (Cost Per Lead / Acquisition)
    const campCpa = camp.conversions > 0 ? camp.spend / camp.conversions : 0;
    if (camp.conversions > 0 && campCpa > ruleThresholdCpa) {
      alertsList.push({
        type: "critical",
        campaignName: camp.name,
        metric: "CPA Violation",
        valueText: `₹${campCpa.toFixed(0)}`,
        thresholdText: `₹${ruleThresholdCpa}`,
        message: `Actual CPL/CPA of ₹${campCpa.toFixed(0)} exceeds target ₹${ruleThresholdCpa}.`,
        appliedRuleName: matchedRuleLabel,
      });
    }

    // Warning Spend Eval
    if (camp.spend > ruleThresholdSpend) {
      alertsList.push({
        type: "warning",
        campaignName: camp.name,
        metric: "Budget Overrun",
        valueText: `₹${camp.spend.toLocaleString()}`,
        thresholdText: `₹${ruleThresholdSpend}`,
        message: `Campaign spend of ₹${camp.spend.toLocaleString()} exceeded spend ceiling warn threshold ₹${ruleThresholdSpend.toLocaleString()}.`,
        appliedRuleName: matchedRuleLabel,
      });
    }

    // CTR Eval (Clicks / Impressions)
    const campCtr = camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
    if (camp.impressions > 0 && campCtr < ruleThresholdCtr) {
      alertsList.push({
        type: "critical",
        campaignName: camp.name,
        metric: "Low CTR Alert",
        valueText: `${campCtr.toFixed(2)}%`,
        thresholdText: `${ruleThresholdCtr}%`,
        message: `Interaction CTR rate is low (${campCtr.toFixed(2)}% vs rule minimum ${ruleThresholdCtr}%). Ad copy variations needed.`,
        appliedRuleName: matchedRuleLabel,
      });
    }

    // CVR Eval (Conversions / Clicks)
    const campCvr = camp.clicks > 0 ? (camp.conversions / camp.clicks) * 100 : 0;
    if (camp.clicks > 0 && campCvr < ruleThresholdCvr) {
      alertsList.push({
        type: "warning",
        campaignName: camp.name,
        metric: "Poor Conversion Scale",
        valueText: `${campCvr.toFixed(2)}%`,
        thresholdText: `${ruleThresholdCvr}%`,
        message: `Landing page conversion speed has declined to ${campCvr.toFixed(2)}% below the rule minimum tag ${ruleThresholdCvr}%.`,
        appliedRuleName: matchedRuleLabel,
      });
    }
  });

  // Split configurations into groups
  const globalRuleRecord = (ruleSettingsList || []).find((r) => r.id === "global") || ruleSetting;
  const projectRuleRecords = (ruleSettingsList || []).filter((r) => r.id.startsWith("project:"));
  const mediumRuleRecords = (ruleSettingsList || []).filter((r) => r.id.startsWith("medium:"));

  return (
    <div className="space-y-6 animate-fade-in" id="rule-configuration-panel">
      
      {/* Banner Header Accent */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative visual elements */}
        <div className="absolute right-0 top-0 translate-x-24 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-300 bg-indigo-950/80 border border-indigo-850 px-2.5 py-0.5 rounded-full">
              SLA Governance System
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-300 bg-emerald-950/80 border border-emerald-850 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full animate-ping" />
              Sentinel Diagnostics: Active
            </span>
          </div>

          <h2 className="text-lg font-bold font-display tracking-tight text-white md:text-xl">
            SLA Threshold Governance Board
          </h2>
          <p className="text-xs text-slate-350 max-w-3xl leading-relaxed font-normal">
            Configure target metrics and spends with granular precision. Define general defaults or create specialized 
            <b> project-wise overrides</b> or <b>medium-wise overrides</b>. The Sentinel Diagnostics auditor dynamically evaluates 
            every live campaign using the most specific active scope matches.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL 1: Rules Directory list & Override Creator (Col Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col space-y-3.5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
                  Rules Directory
                </h3>
              </div>
              
              {rolePermission.canManageRules && (
                <button
                  onClick={() => setShowOverrideForm(!showOverrideForm)}
                  className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 cursor-pointer transition-all border border-indigo-100"
                >
                  <Plus size={11} />
                  <span>New Override</span>
                </button>
              )}
            </div>

            {/* In-Line Custom Override Creation Form */}
            {showOverrideForm && (
              <form onSubmit={handleAddOverrideOption} className="bg-slate-50 border border-indigo-100 rounded-lg p-3.5 space-y-3 animate-fade-in text-xs">
                <h4 className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide">
                  Configure Override Scope
                </h4>

                <div className="space-y-2 text-slate-600 font-semibold">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Override Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewOverrideScope("project")}
                        className={`py-1.5 rounded-md font-bold text-[10.5px] cursor-pointer transition-all border text-center ${
                          newOverrideScope === "project"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Project-wise
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOverrideScope("medium")}
                        className={`py-1.5 rounded-md font-bold text-[10.5px] cursor-pointer transition-all border text-center ${
                          newOverrideScope === "medium"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Medium-wise
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      {newOverrideScope === "project" ? "Select Project Source" : "Select Platform"}
                    </label>
                    {newOverrideScope === "project" ? (
                      <select
                        value={newOverrideValue}
                        onChange={(e) => setNewOverrideValue(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                      >
                        {uniqueProjectsList.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={newOverrideValue}
                        onChange={(e) => setNewOverrideValue(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-md text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                      >
                        {allPlatforms.map((pt) => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowOverrideForm(false)}
                    className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-md font-bold text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-[10px]"
                  >
                    Configure Custom Rules
                  </button>
                </div>
              </form>
            )}

            {/* List of active rule documents */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              
              {/* Category: Global Fallback Ruleset */}
              <div className="space-y-1.5">
                <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Fallback Defaults
                </span>
                <div
                  onClick={() => setSelectedRuleId("global")}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedRuleId === "global"
                      ? "bg-indigo-50/70 border-indigo-200 shadow-2xs"
                      : "bg-white hover:bg-slate-50/50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                      🌐
                    </span>
                    <div className="text-xs">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-950">
                        Global Standard SLA
                      </h4>
                      <p className="text-[9.5px] text-indigo-650 font-bold mt-0.5">
                        CPA ₹{globalRuleRecord?.targetCpa || 450} • Spend Limit ₹{globalRuleRecord?.warningSpend || 1200}
                      </p>
                    </div>
                  </div>
                  <ChevronRightSelected active={selectedRuleId === "global"} />
                </div>
              </div>

              {/* Category: Project-wise Override Ruleset */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Project-Wise SLA Overrides ({projectRuleRecords.length})
                </span>
                {projectRuleRecords.length === 0 ? (
                  <span className="text-[9.50px] text-slate-400 italic block pl-1">No active overrides configured for project parameters.</span>
                ) : (
                  projectRuleRecords.map((r) => {
                    const projectValue = r.scopeValue || r.id.substring("project:".length);
                    const isSelected = selectedRuleId === r.id;

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRuleId(r.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group relative ${
                          isSelected
                            ? "bg-slate-50 border-indigo-400 shadow-3xs"
                            : "bg-white hover:bg-slate-5/50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 max-w-[80%]">
                          <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                            🏢
                          </span>
                          <div className="text-xs truncate">
                            <h4 className="font-bold text-slate-800 truncate group-hover:text-slate-950" title={projectValue}>
                              {projectValue}
                            </h4>
                            <p className="text-[9.5px] text-emerald-700 font-bold mt-0.5">
                              CPA ₹{r.targetCpa} • Spend Limit ₹{r.warningSpend}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {onDeleteRule && rolePermission.canManageRules && (
                            <button
                              onClick={(e) => handleDeleteOverride(r.id, e)}
                              disabled={deleteStatus === r.id}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-sm hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Specific Rule"
                            >
                              <Trash2 size={12} className={deleteStatus === r.id ? "animate-spin" : ""} />
                            </button>
                          )}
                          <ChevronRightSelected active={isSelected} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Category: Medium-wise Override Ruleset */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 block mb-1">
                  Medium-Wise SLA Overrides ({mediumRuleRecords.length})
                </span>
                {mediumRuleRecords.length === 0 ? (
                  <span className="text-[9.50px] text-slate-400 italic block pl-1">No active overrides configured for platform avenues.</span>
                ) : (
                  mediumRuleRecords.map((r) => {
                    const mediumValue = r.scopeValue || r.id.substring("medium:".length);
                    const isSelected = selectedRuleId === r.id;

                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRuleId(r.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group relative ${
                          isSelected
                            ? "bg-slate-50 border-indigo-400 shadow-3xs"
                            : "bg-white hover:bg-slate-5/50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 max-w-[80%]">
                          <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5">
                            📺
                          </span>
                          <div className="text-xs truncate">
                            <h4 className="font-bold text-slate-800 truncate group-hover:text-slate-950" title={mediumValue}>
                              {mediumValue}
                            </h4>
                            <p className="text-[9.5px] text-indigo-650 font-bold mt-0.5 font-mono">
                              CPA ₹{r.targetCpa} • CTR {r.minCtr}%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {onDeleteRule && rolePermission.canManageRules && (
                            <button
                              onClick={(e) => handleDeleteOverride(r.id, e)}
                              disabled={deleteStatus === r.id}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-sm hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Specific Rule"
                            >
                              <Trash2 size={12} className={deleteStatus === r.id ? "animate-spin" : ""} />
                            </button>
                          )}
                          <ChevronRightSelected active={isSelected} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </div>

        {/* PANEL 2: Active Rule Thresholds Editor Card (Col Span 5) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Editor Label Header info */}
            <div className="flex items-start justify-between pb-3.5 border-b border-rose-50/50">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-slate-700 shrink-0" />
                <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-850">
                  SLA parameter edits
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[8.5px] text-slate-450 block font-bold font-mono">
                  {selectedRuleId === "global" ? "GLOBAL SCOPE" : "SPECIFIC OVERRIDE"}
                </span>
                <span className="inline-block px-2 py-0.5 rounded-sm font-bold bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] uppercase font-mono tracking-xs mt-1">
                  {selectedRuleId.replace("project:", "🏢 Project: ").replace("medium:", "📺 Platform: ")}
                </span>
              </div>
            </div>

            {/* Editing Warning banner if custom override */}
            {selectedRuleId !== "global" && (
              <div className="p-3 bg-indigo-50/40 border border-indigo-100/60 rounded-lg text-[10.5px] text-slate-650 flex gap-2 font-medium">
                <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  Campaigns matching <b className="text-slate-800">{selectedRuleId.substring(selectedRuleId.indexOf(":")+1)}</b> will automatically prioritize these rule configurations instead of global system defaults.
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4.5 text-xs font-semibold text-slate-650">
              
              {/* Cost-Based Threshold Parameters group */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  1. Financial Constraints (INR)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1.5">
                      <span>Target CPA / CPL (₹)</span>
                      <HelpTip text="Target Cost per Acquisition / Lead. Trigger high cost alert warning if exceeded." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={targetCpa}
                      onChange={(e) => setTargetCpa(parseInt(e.target.value) || 0)}
                      disabled={!rolePermission.canManageRules}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1.5">
                      <span>Warning Spend Cap (₹)</span>
                      <HelpTip text="Sentinel warns if campaign spend exceeds this amount." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={warningSpend}
                      onChange={(e) => setWarningSpend(parseInt(e.target.value) || 0)}
                      disabled={!rolePermission.canManageRules}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Metric-Based Performance SLA parameters */}
              <div className="space-y-3 pt-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  2. Conversion & CTR SLA targets
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1">
                      <span>Min CTR (%)</span>
                      <HelpTip text="Click-Through Rate lower target. Below this triggers optimization alerts." />
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={minCtr}
                      onChange={(e) => setMinCtr(parseFloat(e.target.value) || 0)}
                      disabled={!rolePermission.canManageRules}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1">
                      <span>Min CVR (%)</span>
                      <HelpTip text="Conversion Rate lower boundary. Below this triggers landing page health checks." />
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={minCvr}
                      onChange={(e) => setMinCvr(parseFloat(e.target.value) || 0)}
                      disabled={!rolePermission.canManageRules}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 flex items-center gap-1">
                      <span>Min ROAS index</span>
                      <HelpTip text="Ad revenue multipliers index (e.g., 2.5)" />
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={minRoas}
                      onChange={(e) => setMinRoas(parseFloat(e.target.value) || 0)}
                      disabled={!rolePermission.canManageRules}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Evaluation Parameters */}
              <div className="space-y-3 pt-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  3. System Audit Settings
                </span>

                <div>
                  <label className="block text-slate-505 mb-1 flex items-center gap-1">
                    <span>Evaluation Interval (Review Days)</span>
                    <HelpTip text="Minimum day cohort size to wait before evaluating breaches on programmatic actions." />
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reviewDays}
                    onChange={(e) => setReviewDays(parseInt(e.target.value) || 1)}
                    disabled={!rolePermission.canManageRules}
                    className="w-32 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 outline-hidden font-bold font-mono text-center focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Footer action bar with status response */}
              <div className="flex items-center justify-between pt-4.5 border-t border-slate-100 mt-4">
                <span className="text-[9.5px] text-slate-400 font-medium font-mono">
                  Modified: {currentEditingRule?.updatedAt ? new Date(currentEditingRule.updatedAt).toLocaleString() : "First Session Setup"}
                </span>

                <div className="flex items-center gap-2.5">
                  {saveStatus === "success" && (
                    <span className="text-[10.5px] text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse" id="save-rules-success-msg">
                      <CheckCircle2 size={12} /> SLA Saved!
                    </span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-[10.5px] text-rose-600 font-extrabold" id="save-rules-error-msg">
                      Authentication blocked.
                    </span>
                  )}
                  {rolePermission.canManageRules && (
                    <button
                      type="submit"
                      disabled={saveStatus === "saving"}
                      className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all font-display text-[11px]"
                      id="btn-save-rule-configs"
                    >
                      <Save size={12.5} />
                      <span>{saveStatus === "saving" ? "Saving..." : "Deploy SLA"}</span>
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* PANEL 3: Realtime dynamic Alert Diagnostics Sentinel Panel (Col Span 3) */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-indigo-600 animate-pulse shrink-0" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
                  Sentinel Audits
                </h3>
              </div>
              <span className="bg-indigo-100 text-indigo-850 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold">
                {alertsList.length} alert{alertsList.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex-1 mt-4 space-y-4 overflow-y-auto max-h-[500px]">
              {alertsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-450 h-full space-y-3.5 mt-10">
                  <span className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 text-[20px] flex items-center justify-center animate-bounce shadow-3xs">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 tracking-tight uppercase">
                      Fully SLA Compliant
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">
                      All live campaigns metrics pass multi-layered project and platform SLA parameters with zero active breaches!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pr-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    Governance Threshold Warnings
                  </span>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-0.5">
                    {alertsList.map((al, index) => {
                      const isCri = al.type === "critical";

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border text-xs space-y-2 transition-all hover:scale-[1.01] ${
                            isCri
                              ? "bg-rose-50/40 border-rose-100 text-rose-950"
                              : "bg-amber-50/40 border-amber-200/50 text-amber-950"
                          }`}
                        >
                          <div className="space-y-1">
                            {/* Rule detail title */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[8.5px] uppercase px-1.5 py-0.2 rounded font-extrabold font-mono ${
                                isCri ? "bg-rose-100/70 text-rose-800" : "bg-amber-100/70 text-amber-800"
                              }`}>
                                {al.metric}
                              </span>
                              <span className="text-[8.5px] font-mono font-bold text-slate-500 opacity-90 truncate max-w-[85px]" title={al.appliedRuleName}>
                                {al.appliedRuleName}
                              </span>
                            </div>

                            <p className="text-[10.5px] font-extrabold leading-tight text-slate-900 truncate" title={al.campaignName}>
                              {al.campaignName}
                            </p>
                          </div>

                          <p className="text-[10px] text-slate-650 leading-normal font-medium">
                            {al.message}
                          </p>

                          <div className="flex items-center justify-between text-[9px] font-mono font-extrabold border-t border-slate-100/10 pt-1.5 mt-1 text-slate-500">
                            <span>Actual: <b className={isCri ? "text-rose-600" : "text-amber-700"}>{al.valueText}</b></span>
                            <span>Limit: <b className="text-slate-800">{al.thresholdText}</b></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

// Chevron selector sub-helper component
function ChevronRightSelected({ active }: { active: boolean }) {
  return (
    <span className={`text-[12px] font-extrabold transition-all duration-200 ${active ? "translate-x-0.5 text-indigo-600 scale-120" : "text-slate-300 opacity-0 group-hover:opacity-100"}`}>
      →
    </span>
  );
}

// Help Icon Tooltip
function HelpTip({ text }: { text: string }) {
  return (
    <span className="text-slate-400 hover:text-indigo-600 cursor-pointer inline-block" title={text}>
      <HelpCircle size={10.5} />
    </span>
  );
}
