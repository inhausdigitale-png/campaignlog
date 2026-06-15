import React, { useState } from "react";
import {
  Sparkles,
  Cpu,
  Tv,
  Check,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Plus,
  Loader2,
  FileText,
  BadgeAlert,
  Copy,
  ChevronRight,
  RefreshCw,
  Compass,
  FileImage
} from "lucide-react";
import { CreativeAsset, Campaign } from "../types";

interface AIHubProps {
  creatives: CreativeAsset[];
  campaigns: Campaign[];
  onSaveCreative: (creative: CreativeAsset) => Promise<void>;
  onSaveChangeLog?: (entry: any) => Promise<void>;
}

interface AICopySuggestion {
  headline: string;
  bodyText: string;
  creativeConcept: string;
}

export default function AIHub({
  creatives = [],
  campaigns = [],
  onSaveCreative,
  onSaveChangeLog
}: AIHubProps) {
  // --- SECTION A: Ad Performance Diagnostics States ---
  const [selectedCreativeId, setSelectedCreativeId] = useState<string>("");
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [activeDiagnosticCreative, setActiveDiagnosticCreative] = useState<CreativeAsset | null>(null);

  // --- SECTION B: AI Copy Copilot States ---
  const [copilotProductName, setCopilotProductName] = useState("");
  const [copilotAudience, setCopilotAudience] = useState("");
  const [copilotPlatform, setCopilotPlatform] = useState<Campaign["platform"]>("Google Ads");
  const [copilotObjectives, setCopilotObjectives] = useState("");
  const [copilotIsLoading, setCopilotIsLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotSuggestions, setCopilotSuggestions] = useState<AICopySuggestion[]>([]);
  const [copilotBestPractices, setCopilotBestPractices] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Find currently selected creative
  const currentCreative = creatives.find((c) => c.id === selectedCreativeId);

  // Handle Trigger Creative Analysis (Gemini)
  const handleRunCreativeDiagnostics = async (creative: CreativeAsset) => {
    setIsDiagnosticRunning(true);
    setDiagnosticsError(null);
    try {
      const res = await fetch("/api/gemini/analyze-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creative }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to parse creative characteristics.");
      }

      const report = await res.json();
      const augmentedCreative: CreativeAsset = {
        ...creative,
        aiScore: report.optimizationScore,
        aiStrengths: report.strengths,
        aiWeaknesses: report.weaknesses,
        aiSuggestedHeadline: report.suggestedHeadlineFix,
        aiSuggestedBody: report.suggestedBodyFix,
        aiAnalyzedAt: new Date().toISOString(),
      };

      // Persist values
      await onSaveCreative(augmentedCreative);
      setActiveDiagnosticCreative(augmentedCreative);

      // Save to audit change logs if hook is present
      if (onSaveChangeLog) {
        const matchedCamp = campaigns.find((c) => c.id === creative.campaignId);
        const campName = matchedCamp ? matchedCamp.name : "Ad Campaign Reference";
        const campStatus = matchedCamp ? matchedCamp.status : "Action Required";
        const changeDesc = `Evaluated "${creative.name}". Assigned AI Quality score of ${report.optimizationScore}/100. Suggested headline: "${report.suggestedHeadlineFix || "N/A"}".`;

        await onSaveChangeLog({
          id: `log-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          campaignId: creative.campaignId,
          campaignName: campName,
          campaignStatus: campStatus,
          adSetName: "Creative Diagnostics",
          project: "AI Optimization",
          type: "AI Creative Diagnostics",
          changed: changeDesc,
          reason: `AI diagnostics assessment identified weaknesses: ${(report.weaknesses || []).slice(0, 2).join(", ") || "underperforming CTR features"}.`,
          createdAt: new Date().toISOString(),
          lastEditedBy: "AI Assistant (Gemini)",
          progress: "Implemented",
          changeCategory: "Creative",
          creativeName: creative.name,
          creativeHeadline: report.suggestedHeadlineFix,
          creativeBodyText: report.suggestedBodyFix,
        });
      }
    } catch (err: any) {
      setDiagnosticsError(err.message || "Creative audit diagnostics were disrupted.");
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  // Trigger copy generation
  const handleGenerateCopyCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotProductName) {
      setCopilotError("Please state a Product/Service name to generate.");
      return;
    }

    setCopilotIsLoading(true);
    setCopilotError(null);
    setCopilotSuggestions([]);
    try {
      const res = await fetch("/api/gemini/generate-ad-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: copilotProductName,
          audience: copilotAudience,
          platform: copilotPlatform,
          objectives: copilotObjectives,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to synthesize ad copy concepts.");
      }

      const data = await res.json();
      setCopilotSuggestions(data.variations || []);
      setCopilotBestPractices(data.bestPractices || "Always alignment with user pain points.");
    } catch (err: any) {
      setCopilotError(err.message || "Failed to compile copywriting variations.");
    } finally {
      setCopilotIsLoading(false);
    }
  };

  // Helper to copy copy text to clipboard
  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Dynamic performance indicators
  const getPerformanceIndicatorBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 82) {
      return {
        label: "Campaign Champion",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🏆"
      };
    } else if (score < 75) {
      return {
        label: "Underperforming Variant",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "⚠️"
      };
    } else {
      return {
        label: "Steady Performer",
        color: "bg-slate-50 text-slate-700 border-slate-200",
        icon: "⚖️"
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/50 uppercase tracking-wider mb-2 font-mono">
            <Sparkles size={11} className="text-indigo-600 animate-pulse" />
            Gemini GenAI Engine Connected
          </span>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            AI Growth Optimization Center
          </h2>
          <p className="text-xs text-slate-500 leading-normal">
            Harness high-performance server-side Gemini 3.5 AI to analyze copy friction, grade uploaded creative variants, and draft world-class marketing collateral instantly.
          </p>
        </div>
      </div>

      {/* Grid containing Diagnostic audits & AI copywriting generator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Dedicated Ad Creative Performance Diagnostics Audit */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono block">MODULE 1</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">Creative Diagnostics &amp; Audit</h3>
            <p className="text-xs text-slate-500">
              Run diagnostics on existing campaigns' text hooks or image assets to calculate optimized scores.
            </p>
          </div>

          {/* Selector */}
          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2">
            <label className="block text-[11px] font-bold text-slate-600">Select Up-and-running Resource Variant</label>
            <div className="flex gap-2">
              <select
                value={selectedCreativeId}
                onChange={(e) => {
                  setSelectedCreativeId(e.target.value);
                  const found = creatives.find(c => c.id === e.target.value);
                  setActiveDiagnosticCreative(found || null);
                  setDiagnosticsError(null);
                }}
                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-250 border-slate-200 rounded-lg text-slate-700 font-medium outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="">-- Click to choose variant --</option>
                {creatives.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.platform} • Conversions: {c.conversions})
                  </option>
                ))}
              </select>

              {currentCreative && (
                <button
                  type="button"
                  disabled={isDiagnosticRunning}
                  onClick={() => handleRunCreativeDiagnostics(currentCreative)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {isDiagnosticRunning ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <>
                      <Cpu size={13} />
                      <span>Run Gemini Audit</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {diagnosticsError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-start gap-2 animate-fade-in">
              <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{diagnosticsError}</span>
            </div>
          )}

          {/* Selected asset diagnostic dashboard card */}
          {activeDiagnosticCreative ? (
            <div className="border border-slate-150 rounded-xl overflow-hidden animate-fade-in text-xs space-y-4">
              {/* Asset header display */}
              <div className="bg-slate-50/70 p-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                  {activeDiagnosticCreative.imageUrl && (
                    <img 
                      src={activeDiagnosticCreative.imageUrl} 
                      alt={activeDiagnosticCreative.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white"
                    />
                  )}
                  <div>
                    <h4 className="font-extrabold text-slate-900 leading-tight block">{activeDiagnosticCreative.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      ID Ref: {activeDiagnosticCreative.id} • Platform Channel: {activeDiagnosticCreative.platform}
                    </span>
                  </div>
                </div>

                {activeDiagnosticCreative.aiScore ? (
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Gemini Grade Index</span>
                    <span className="text-lg font-mono font-black text-indigo-705 text-indigo-600">
                      {activeDiagnosticCreative.aiScore}% Quality
                    </span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 text-[9.5px] uppercase font-bold text-amber-600 bg-amber-50 border border-amber-200/50 rounded-lg shrink-0">
                    Audit Pending
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4 pt-1">
                {/* Meta properties */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10.5px] font-mono">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Impressions</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {activeDiagnosticCreative.spend > 0 ? (activeDiagnosticCreative.clicks * 42).toLocaleString() : "1,240"}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Spend Logged</div>
                    <div className="font-bold text-slate-800 mt-0.5">${activeDiagnosticCreative.spend}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Clicks Captured</div>
                    <div className="font-bold text-slate-800 mt-0.5">{activeDiagnosticCreative.clicks}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-400 font-sans font-semibold">Conversions</div>
                    <div className="font-bold text-slate-800 mt-0.5">{activeDiagnosticCreative.conversions}</div>
                  </div>
                </div>

                {/* Main Copy values */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Active Headline Hook:</span>
                    <p className="font-bold text-slate-800 mt-0.5">"{activeDiagnosticCreative.headline}"</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Active Slogan / Body text:</span>
                    <p className="text-slate-600 leading-normal mt-0.5">"{activeDiagnosticCreative.bodyText}"</p>
                  </div>
                </div>

                {/* Audited Gemini diagnostics results */}
                {activeDiagnosticCreative.aiScore ? (
                  <div className="space-y-3.5 pt-2 border-t border-slate-100 animate-fade-in">
                    {/* Performance Indicator dynamic highlight badge */}
                    {(() => {
                      const badge = getPerformanceIndicatorBadge(activeDiagnosticCreative.aiScore);
                      if (!badge) return null;
                      return (
                        <div className={`p-2 rounded-lg border ${badge.color} flex items-center gap-2 font-bold text-[11px]`}>
                          <span>{badge.icon}</span>
                          <div>
                            <span className="uppercase text-[9px] block text-slate-400 font-bold leading-none">Diagnostic Class</span>
                            <span className="mt-0.5 block leading-none">{badge.label}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Strengths */}
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 text-emerald-950 rounded-xl space-y-1">
                      <span className="text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider block">
                        Targeted Strengths & Copy Positives
                      </span>
                      <p className="leading-relaxed font-sans">{activeDiagnosticCreative.aiStrengths}</p>
                    </div>

                    {/* Weaknesses */}
                    <div className="p-3 bg-rose-50/30 border border-rose-100 text-rose-950 rounded-xl space-y-1">
                      <span className="text-[9px] font-extrabold uppercase text-rose-500 tracking-wider block">
                        Identified Creative Friction Points
                      </span>
                      <p className="leading-relaxed font-sans">{activeDiagnosticCreative.aiWeaknesses}</p>
                    </div>

                    {/* Suggested fixes alternatives */}
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-100/10 space-y-3 shadow-xs">
                      <div className="font-semibold text-xs flex items-center gap-1.5 text-indigo-300">
                        <Lightbulb size={13} className="text-amber-400 font-bold shrink-0 animate-bounce" />
                        <span>Optimized Testing Blueprint Alternative</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Suggested Headline Hook:</span>
                          <p className="text-[11px] text-white font-extrabold leading-snug mt-1 italic shrink-0 font-sans">
                            {activeDiagnosticCreative.aiSuggestedHeadline}
                          </p>
                        </div>
                        <div className="md:pl-3 pt-2.5 md:pt-0">
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">Suggested Variant Slogan:</span>
                          <p className="text-[11px] text-slate-300 leading-normal mt-1 italic font-sans">
                            {activeDiagnosticCreative.aiSuggestedBody}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-indigo-50/30 border border-dashed border-indigo-200 rounded-xl space-y-2">
                    <p className="text-slate-500 font-sans max-w-sm mx-auto text-xs">
                      No live diagnostics report is loaded for this creative variant. Tap the audit run button to query Gemini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
              <Compass className="mx-auto text-slate-300 animate-spin-slow" size={38} />
              <p className="text-slate-400 max-w-sm mx-auto text-xs font-sans">
                Choose an asset variant from the drop-down selector above to launch the performance diagnostics compiler.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Copy copywriting Copilot Wizard */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 font-mono block">MODULE 2</span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">Copywriting Concepts Generator</h3>
            <p className="text-xs text-slate-500">
              Draft scroll-stopping headlines and conversion-focused copy variants for any network channel instatnly.
            </p>
          </div>

          <form onSubmit={handleGenerateCopyCopilot} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-650 text-slate-600 mb-1">Product/Service Name *</label>
              <input
                type="text"
                placeholder="e.g. Vivaana Meadows Luxury Villas"
                value={copilotProductName}
                onChange={(e) => setCopilotProductName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-indigo-150 focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Target Persona</label>
                <input
                  type="text"
                  placeholder="e.g. Families, High-earning tech professionals"
                  value={copilotAudience}
                  onChange={(e) => setCopilotAudience(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-indigo-150 focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Marketing Channel</label>
                <select
                  value={copilotPlatform}
                  onChange={(e) => setCopilotPlatform(e.target.value as Campaign["platform"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs bg-white focus:ring-1 focus:ring-indigo-150 focus:border-indigo-500 outline-hidden cursor-pointer"
                >
                  <option value="Google Ads">Google Ads (Search)</option>
                  <option value="Meta">Meta (Facebook/Instagram)</option>
                  <option value="LinkedIn">LinkedIn Professional</option>
                  <option value="YouTube">YouTube Ads</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Slogan Objectives / Specific Focus</label>
              <textarea
                rows={2}
                placeholder="e.g. Highlight ready-to-move-in amenities, zero GST, pre-launch discounts"
                value={copilotObjectives}
                onChange={(e) => setCopilotObjectives(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs bg-white focus:ring-1 focus:ring-indigo-150 focus:border-indigo-500 outline-hidden resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={copilotIsLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {copilotIsLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Generating Marketing Angles...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300 animate-pulse" />
                  <span>Draft Copy Concepts</span>
                </>
              )}
            </button>
          </form>

          {copilotError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-650 text-xs">
              {copilotError}
            </div>
          )}

          {/* Render list of suggestions */}
          {copilotSuggestions.length > 0 && (
            <div className="space-y-3.5 pt-3 border-t border-slate-100 animate-fade-in text-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Generated Variations Output
              </span>

              <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
                {copilotSuggestions.map((s, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2 relative group hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <span className="inline-flex items-center justify-center bg-indigo-650 bg-indigo-600 text-white font-mono text-[9.5px] w-4.5 h-4.5 rounded-full font-bold">
                        {idx + 1}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(`Headline: ${s.headline}\nBody: ${s.bodyText}\nConcept: ${s.creativeConcept}`, idx)}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-white transition-all border border-transparent hover:border-slate-150 cursor-pointer"
                        title="Copy Variation Text"
                      >
                        {copiedIndex === idx ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1 text-[11px] leading-relaxed">
                      <div>
                        <span className="text-[8.5px] font-extrabold uppercase text-indigo-400/80 tracking-wide font-mono block">Headline Hook:</span>
                        <p className="font-extrabold text-slate-800 font-sans">"{s.headline}"</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-extrabold uppercase text-indigo-400/80 tracking-wide font-mono block">Persuasive Slogan:</span>
                        <p className="text-slate-600 font-sans">{s.bodyText}</p>
                      </div>
                      <div className="pt-1.5 border-t border-indigo-100/50 mt-1.5 bg-white/40 p-2 rounded-lg text-[9.5px] italic text-slate-500">
                        <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 not-italic block leading-none mb-0.5">Asset Visual Concept Recommended:</span>
                        {s.creativeConcept}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {copilotBestPractices && (
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-[10.5px]">
                  <span className="font-bold uppercase tracking-wider text-[8px] text-slate-400 block font-mono">Expert Pro Tips Summary</span>
                  <p className="text-slate-600 whitespace-pre-line font-sans leading-normal">{copilotBestPractices}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
