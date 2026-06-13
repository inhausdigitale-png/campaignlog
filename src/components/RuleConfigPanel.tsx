import React, { useState, useEffect } from "react";
import { RuleConfiguration, Campaign, UserRolePermission } from "../types";
import { formatINR } from "../utils/indiaHelpers";
import { Save, ShieldAlert, CheckCircle2, Sliders, PlayCircle, Eye, AlertCircle, Info, Sparkles } from "lucide-react";

interface RuleConfigPanelProps {
  ruleSetting: RuleConfiguration | null;
  campaigns: Campaign[];
  onSaveRule: (rule: RuleConfiguration) => Promise<void>;
  rolePermission?: UserRolePermission;
}

export default function RuleConfigPanel({
  ruleSetting,
  campaigns,
  onSaveRule,
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
  // Local state for rule configuration edits
  const [targetCpa, setTargetCpa] = useState(500);
  const [minRoas, setMinRoas] = useState(2.5);
  const [minCtr, setMinCtr] = useState(1.5);
  const [minCvr, setMinCvr] = useState(2.0);
  const [reviewDays, setReviewDays] = useState(3);
  const [warningSpend, setWarningSpend] = useState(1000);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Sync state when default props loaded
  useEffect(() => {
    if (ruleSetting) {
      setTargetCpa(ruleSetting.targetCpa);
      setMinRoas(ruleSetting.minRoas);
      setMinCtr(ruleSetting.minCtr);
      setMinCvr(ruleSetting.minCvr);
      setReviewDays(ruleSetting.reviewDays);
      setWarningSpend(ruleSetting.warningSpend);
    }
  }, [ruleSetting]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const updatedRule: RuleConfiguration = {
        id: "global",
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

  // Compile real-time Sentinel Diagnostics based on the current thresholds and campaigns
  interface SentinelAlert {
    type: "critical" | "warning";
    campaignName: string;
    metric: string;
    valueText: string;
    thresholdText: string;
    message: string;
  }

  const alertsList: SentinelAlert[] = [];

  campaigns.forEach((camp) => {
    if (camp.status !== "active") return; // examine only running activities

    // CPA Eval
    const campCpa = camp.conversions > 0 ? camp.spend / camp.conversions : 0;
    if (camp.conversions > 0 && campCpa > targetCpa) {
      alertsList.push({
        type: "critical",
        campaignName: camp.name,
        metric: "CPA (Cost per Acquisition)",
        valueText: `₹${campCpa.toFixed(2)}`,
        thresholdText: `₹${targetCpa}`,
        message: `High Cost per Acquisition detected! The evaluated campaign CPA of ₹${campCpa.toFixed(2)} exceeds your team threshold of ₹${targetCpa}.`,
      });
    }

    // Warning Spend Eval
    if (camp.spend > warningSpend) {
      alertsList.push({
        type: "warning",
        campaignName: camp.name,
        metric: "Spend Limit Threshold",
        valueText: `₹${camp.spend.toLocaleString()}`,
        thresholdText: `₹${warningSpend}`,
        message: `Campaign spent (₹${camp.spend.toLocaleString()}) has breached the warning spend constraint of ₹${warningSpend}. Review budget capping.`,
      });
    }

    // CTR Eval (Clicks / Impressions)
    const campCtr = camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
    if (camp.impressions > 0 && campCtr < minCtr) {
      alertsList.push({
        type: "critical",
        campaignName: camp.name,
        metric: "CTR (Click-Through Rate)",
        valueText: `${campCtr.toFixed(2)}%`,
        thresholdText: `${minCtr}%`,
        message: `Low interaction click rate: current CTR metrics (${campCtr.toFixed(2)}%) dips below target min of ${minCtr}%. Ad creatives may need retargeting copy variations.`,
      });
    }

    // CVR Eval (Conversions / Clicks)
    const campCvr = camp.clicks > 0 ? (camp.conversions / camp.clicks) * 100 : 0;
    if (camp.clicks > 0 && campCvr < minCvr) {
      alertsList.push({
        type: "warning",
        campaignName: camp.name,
        metric: "CVR (Conversion Rate)",
        valueText: `${campCvr.toFixed(2)}%`,
        thresholdText: `${minCvr}%`,
        message: `Conversion capture rate is poor. Campaign landing-page CVR evaluates to ${campCvr.toFixed(2)}% vs target minimum of ${minCvr}%.`,
      });
    }
  });

  return (
    <div className="space-y-6" id="rule-configuration-panel">
      {/* Visual Header banner */}
      <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-32 h-32 bg-indigo-50/50 rounded-full blur-xl pointer-events-none" />
        <div className="space-y-1 relative">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full inline-block">
            Rules Governance Engine
          </span>
          <h2 className="text-sm font-bold text-slate-800 font-display">Thresholds, Sentinel alerts, and CPA governance parameters</h2>
          <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
            Define programmatic limit rules. The background Sentinel auto-audits campaigns in real-time, pointing out metrics violating your standard operating agreements.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 p-2 bg-indigo-50/30 border border-indigo-100/50 rounded-lg text-[10.5px] font-bold text-slate-650">
          <Sparkles size={13} className="text-indigo-500 animate-pulse" />
          <span>Active diagnostics</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form panel configuration fields */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-50">
            <Sliders size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-700">Governance Parameters Thresholds</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <span>Target CPA (INR - ₹)</span>
                  <Info size={11} className="text-slate-400" title="Target Cost per Acquisition. Trigger high CPA alert." />
                </label>
                <input
                  type="number"
                  min="1"
                  value={targetCpa}
                  onChange={(e) => setTargetCpa(parseInt(e.target.value) || 0)}
                  disabled={!rolePermission.canManageRules}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-bold font-mono focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <span>Warning Spend Cap (INR - ₹)</span>
                  <Info size={11} className="text-slate-400" title="Triggers warns when campaign spend exceeds this volume" />
                </label>
                <input
                  type="number"
                  min="1"
                  value={warningSpend}
                  onChange={(e) => setWarningSpend(parseInt(e.target.value) || 0)}
                  disabled={!rolePermission.canManageRules}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-bold font-mono focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <span>Minimum ROAS index</span>
                  <Info size={11} className="text-slate-400" title="Target return on ad spend index (e.g. 2.5)" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={minRoas}
                  onChange={(e) => setMinRoas(parseFloat(e.target.value) || 0)}
                  disabled={!rolePermission.canManageRules}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-mono focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <span>Minimum CTR (%)</span>
                  <Info size={11} className="text-slate-400" title="Underperforming threshold for click through rate" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={minCtr}
                  onChange={(e) => setMinCtr(parseFloat(e.target.value) || 0)}
                  disabled={!rolePermission.canManageRules}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-mono focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <span>Minimum CVR (%)</span>
                  <Info size={11} className="text-slate-400" title="Conversion rate checklist threshold" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={minCvr}
                  onChange={(e) => setMinCvr(parseFloat(e.target.value) || 0)}
                  disabled={!rolePermission.canManageRules}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-mono focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-505 mb-1 flex items-center gap-1">
                <span>Evaluation Interval (Review Days)</span>
                <Info size={11} className="text-slate-400" title="How many days before auto queueing optimizations" />
              </label>
              <input
                type="number"
                min="1"
                value={reviewDays}
                onChange={(e) => setReviewDays(parseInt(e.target.value) || 1)}
                disabled={!rolePermission.canManageRules}
                className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-bold text-center focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10.5px] text-slate-400 font-medium">
                Last updated at: {ruleSetting?.updatedAt ? new Date(ruleSetting.updatedAt).toLocaleString() : "First Session Setup"}
              </span>

              <div className="flex items-center gap-3">
                {saveStatus === "success" && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1" id="save-rules-success-msg">
                    <CheckCircle2 size={13} /> Rules Deployed!
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-[11px] text-rose-600 font-bold" id="save-rules-error-msg">
                    Deploy failed. Check Auth.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saveStatus === "saving"}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-all font-display"
                  id="btn-save-rule-configs"
                >
                  <Save size={13} />
                  <span>{saveStatus === "saving" ? "Deploying..." : "Update Settings"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Realtime Alert Diagnostics sentinel panel */}
        <div className="lg:col-span-4" id="sentinel-diagnostics-card">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-full flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldAlert size={15} className="text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">Sentinel Diagnostics</h3>
            </div>

            <div className="flex-1 mt-4 space-y-4 overflow-y-auto">
              {alertsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-450 h-full space-y-2">
                  <CheckCircle2 size={32} className="text-teal-550" />
                  <div>
                    <h4 className="text-[11.5px] font-bold text-slate-800 tracking-tight">Governance Compliant</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      All active multi-platform campaigns adhere with configured Target CPA, spend cap limits, CTR, and landing CVR parameters!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Active Warnings</span>
                    <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                      {alertsList.length} alert(s)
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {alertsList.map((al, index) => {
                      const isCri = al.type === "critical";

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border text-xs space-y-1 ${
                            isCri
                              ? "bg-rose-50/50 border-rose-100 text-rose-900"
                              : "bg-amber-50/50 border-amber-200/55 text-amber-900"
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <AlertCircle size={13} className={`shrink-0 mt-0.5 ${isCri ? "text-rose-500" : "text-amber-500"}`} />
                            <div>
                              <p className="text-[10.5px] font-extrabold capitalize leading-tight">
                                {al.metric} Breach
                              </p>
                              <span className="text-[9.5px] text-slate-450 uppercase block font-semibold truncate max-w-[180px]">
                                {al.campaignName}
                              </span>
                            </div>
                          </div>

                          <p className="text-[10.5px] text-slate-650 leading-normal pl-5 py-0.5 font-semibold">
                            {al.message}
                          </p>

                          <div className="pl-5 pt-1.5 flex items-center gap-4 text-[9.5px] font-mono font-bold text-slate-500">
                            <span>Actual: <b className={isCri ? "text-rose-600 font-extrabold" : "text-amber-700 font-extrabold"}>{al.valueText}</b></span>
                            <span>Limit: <b className="text-slate-700">{al.thresholdText}</b></span>
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
