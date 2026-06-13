import React, { useState, useRef } from "react";
import { CreativeAsset, Campaign, AICopySuggestion, ChangeLogEntry } from "../types";
import {
  Sparkles,
  Camera,
  Layers,
  TrendingUp,
  Target,
  Edit3,
  HelpCircle,
  Plus,
  Compass,
  Check,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Trash2,
  FileImage,
  UploadCloud,
  CheckCircle2,
  Loader2,
  LayoutGrid,
  List,
  History,
} from "lucide-react";

interface CreativeHubProps {
  creatives: CreativeAsset[];
  campaigns: Campaign[];
  onSaveCreative: (creative: CreativeAsset) => Promise<void>;
  onDeleteCreative: (id: string) => Promise<void>;
  onSaveChangeLog?: (chg: ChangeLogEntry) => Promise<void>;
}

export default function CreativeHub({
  creatives,
  campaigns,
  onSaveCreative,
  onDeleteCreative,
  onSaveChangeLog,
}: CreativeHubProps) {
  // Active states
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("All");
  const [activeAnalysisCreative, setActiveAnalysisCreative] = useState<CreativeAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Creative manual addition form controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCampaignId, setAssetCampaignId] = useState("");
  const [assetPlatform, setAssetPlatform] = useState<CreativeAsset["platform"]>("Google Ads");
  const [assetHeadline, setAssetHeadline] = useState("");
  const [assetBodyText, setAssetBodyText] = useState("");
  const [assetImageUrl, setAssetImageUrl] = useState("");
  const [imageUrlType, setImageUrlType] = useState<"url" | "upload">("url");
  const [assetClicks, setAssetClicks] = useState(0);
  const [assetConversions, setAssetConversions] = useState(0);
  const [assetSpend, setAssetSpend] = useState(0);

  // Syncing to Change Log states
  const [logChangeAsEntry, setLogChangeAsEntry] = useState(true);
  const [changeLogReason, setChangeLogReason] = useState("");

  // AI Copy Copilot assistant states
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotProductName, setCopilotProductName] = useState("");
  const [copilotAudience, setCopilotAudience] = useState("");
  const [copilotPlatform, setCopilotPlatform] = useState<Campaign["platform"]>("Google Ads");
  const [copilotObjectives, setCopilotObjectives] = useState("");
  const [copilotIsLoading, setCopilotIsLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotSuggestions, setCopilotSuggestions] = useState<AICopySuggestion[]>([]);

  // File drag-and-drop references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const platformColors: Record<string, string> = {
    "Google Ads": "bg-blue-50 text-blue-600 border-blue-200",
    "Meta (Facebook)": "bg-indigo-50 text-indigo-600 border-indigo-200",
    "LinkedIn": "bg-sky-50 text-sky-700 border-sky-250",
    "TikTok": "bg-pink-50 text-pink-600 border-pink-200",
    "YouTube": "bg-rose-50 text-rose-600 border-rose-250",
  };

  // Drag and drop processing
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a standard image file (PNG, JPG, JPEG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAssetImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Auto-load details based on selected campaign data
  const handleCampaignChange = (campaignId: string) => {
    setAssetCampaignId(campaignId);
    if (!campaignId) return;

    const selectedCamp = campaigns.find((c) => c.id === campaignId);
    if (selectedCamp) {
      // Auto-set the platform
      setAssetPlatform(selectedCamp.platform);

      // Auto-populate variant name if empty or generic
      if (!assetName || assetName.trim() === "" || assetName.includes("Banner") || assetName.includes("Variant")) {
        setAssetName(`${selectedCamp.name} - Creative Banner`);
      }

      // Auto-populate headline if empty
      if (!assetHeadline || assetHeadline.trim() === "") {
        setAssetHeadline(`Unlock Modern Performance with ${selectedCamp.name}!`);
      }

      // Auto-populate description/body if empty
      if (!assetBodyText || assetBodyText.trim() === "") {
        setAssetBodyText(`Discover how our strategic ${selectedCamp.platform} campaigns drive outstanding conversion results for your marketing funnel.`);
      }

      // Auto-populate metrics
      setAssetConversions(selectedCamp.conversions || 0);
      setAssetClicks(selectedCamp.clicks || 0);
      setAssetSpend(selectedCamp.spend || 0);

      // Auto-populate a relevant mockup banner based on platform
      if (!assetImageUrl || assetImageUrl.startsWith("https://images.unsplash.com/") || assetImageUrl === "") {
        const platformImages: Record<string, string> = {
          "Google Ads": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
          "Meta (Facebook)": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80",
          "LinkedIn": "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=800&q=80",
          "TikTok": "https://images.unsplash.com/photo-1611250282006-448f7122916d?auto=format&fit=crop&w=800&q=80",
          "YouTube": "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=800&q=80",
        };
        const fallbackImg = platformImages[selectedCamp.platform] || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
        setAssetImageUrl(fallbackImg);
      }
    }
  };

  // Save manual creative action
  const handleSaveCreativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCampaignId) {
      alert("Please choose a targeted marketing campaign.");
      return;
    }

    const matchedCamp = campaigns.find((c) => c.id === assetCampaignId);
    const finalName = assetName.trim() || (matchedCamp ? `${matchedCamp.name} Variant` : "Ad Creative Variant");
    const finalImageUrl = assetImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";

    const newCreative: CreativeAsset = {
      id: "creative-" + Math.random().toString(36).substring(2, 9),
      name: finalName,
      campaignId: assetCampaignId,
      campaignName: matchedCamp ? matchedCamp.name : "Ad Campaign Reference",
      platform: assetPlatform,
      imageUrl: finalImageUrl,
      headline: assetHeadline || "Explore and Discover Amazing Features Today",
      bodyText: assetBodyText,
      clicks: Number(assetClicks),
      conversions: Number(assetConversions),
      spend: Number(assetSpend),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await onSaveCreative(newCreative);

    if (logChangeAsEntry && onSaveChangeLog) {
      let projectName = "Vivaana";
      if (matchedCamp && matchedCamp.objectives && matchedCamp.objectives.includes("Project: ")) {
        const pMatch = matchedCamp.objectives.match(/Project:\s*([^|]+)/);
        if (pMatch) projectName = pMatch[1].trim();
      }

      const newLogEntry: ChangeLogEntry = {
        id: "changelog-" + Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString().split("T")[0],
        project: projectName,
        campaignId: assetCampaignId,
        campaignName: matchedCamp ? matchedCamp.name : "Ad Campaign Reference",
        adSetName: "Creative_Update",
        campaignStatus: matchedCamp ? matchedCamp.status : "active",
        type: "Creative Rotation",
        changed: `Uploaded new image and added creative asset: "${assetName}" with copy "${assetHeadline}"`,
        reason: changeLogReason.trim() || `Uploaded new design variant under ${assetPlatform} guidelines to enhance performance metrics.`,
        createdAt: new Date().toISOString(),
        progress: "Implemented",
        changeCategory: "Creative",
        creativeName: assetName,
        creativeHeadline: assetHeadline,
        creativeBodyText: assetBodyText,
        creativeImageUrl: assetImageUrl,
      };

      await onSaveChangeLog(newLogEntry);
    }

    setShowAddModal(false);

    // Reset fields
    setAssetName("");
    setAssetCampaignId("");
    setAssetPlatform("Google Ads");
    setAssetHeadline("");
    setAssetBodyText("");
    setAssetImageUrl("");
    setAssetClicks(0);
    setAssetConversions(0);
    setAssetSpend(0);
    setChangeLogReason("");
  };

  // AI Creative Diagnostics (Gemini)
  const handleTriggerCreativeAnalysis = async (creative: CreativeAsset) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setActiveAnalysisCreative(creative);
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

      // Persist values in DB/LocalStorage
      await onSaveCreative(augmentedCreative);
      setActiveAnalysisCreative(augmentedCreative);
    } catch (err: any) {
      setAnalysisError(err.message || "Creative audit was disrupted.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Copy Generation (Gemini)
  const handleGenerateCopyCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotProductName.trim()) return;

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
        const errData = await res.json();
        throw new Error(errData.error || "Ad copy assistant is busy.");
      }

      const data = await res.json();
      setCopilotSuggestions(data.variations || []);
    } catch (err: any) {
      setCopilotError(err.message || "Failed to compile copywriting variations.");
    } finally {
      setCopilotIsLoading(false);
    }
  };

  const handleApplyCopilotSuggestion = (s: AICopySuggestion) => {
    // Fill the add creative form with the results
    setAssetHeadline(s.headline);
    setAssetBodyText(s.bodyText);
    setAssetPlatform(copilotPlatform as CreativeAsset["platform"]);
    setAssetName(`${copilotProductName} - Gemini Copy v${Math.floor(Math.random() * 90 + 10)}`);
    // auto trigger opening corresponding form and closing copilot!
    setShowCopilot(false);
    setShowAddModal(true);
  };

  // Helper to determine performance status of each creative within its campaign
  const getCreativePerformanceStatus = (c: CreativeAsset) => {
    // Get other creatives for the same campaign
    const sisterCreatives = creatives.filter(sec => sec.campaignId === c.campaignId);
    const ctrValue = c.spend > 0 ? (c.clicks / c.spend) * 100 : 0;
    
    if (sisterCreatives.length <= 1) {
      if (c.conversions >= 15 || ctrValue >= 1.5) {
        return {
          status: "Top Performer",
          color: "bg-emerald-500/10 text-emerald-800 border-emerald-300",
          textColor: "text-emerald-800",
          desc: "Excellent lead volume and landing efficiency.",
          icon: "🔥",
          label: "Outstanding Performer"
        };
      } else if (c.conversions === 0 || (c.spend > 80 && ctrValue < 0.45)) {
        return {
          status: "Underperforming",
          color: "bg-rose-500/10 text-rose-800 border-rose-300",
          textColor: "text-rose-800",
          desc: "High cost relative to conversion yield (Critical).",
          icon: "⚠️",
          label: "Critical Concern"
        };
      } else {
        return {
          status: "Stable",
          color: "bg-slate-50 text-slate-600 border-slate-200 text-slate-600",
          textColor: "text-slate-600",
          desc: "Stable progress, split-test to check alternatives.",
          icon: "📊",
          label: "Steady Performer"
        };
      }
    }

    // Sort to identify champions
    const maxConversions = Math.max(...sisterCreatives.map(s => s.conversions));
    const minConversions = Math.min(...sisterCreatives.map(s => s.conversions));
    const maxCTR = Math.max(...sisterCreatives.map(s => s.spend > 0 ? (s.clicks / s.spend) * 100 : 0));

    if (c.conversions === maxConversions && c.conversions > minConversions) {
      return {
        status: "Top Performer",
        color: "bg-emerald-50 text-emerald-800 border-emerald-300",
        textColor: "text-emerald-800",
        desc: `Leads campaign with ${c.conversions} conversions! Best alignment.`,
        icon: "🏆",
        label: "Campaign Champion"
      };
    }
    
    if (c.conversions === minConversions && c.conversions < maxConversions) {
      return {
        status: "Underperforming",
        color: "bg-rose-50 text-rose-800 border-rose-300",
        textColor: "text-rose-800",
        desc: `Lowest conversions in this campaign. Consider update/pausing details.`,
        icon: "⚠️",
        label: "Underperforming Variant"
      };
    }

    if (ctrValue === maxCTR && maxCTR > 0) {
      return {
        status: "Top Performer",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        textColor: "text-emerald-700",
        desc: "Highest click-through efficiency among variants.",
        icon: "⚡",
        label: "Top CTR Efficiency"
      };
    }

    return {
      status: "Stable",
      color: "bg-slate-50 text-slate-600 border-slate-200",
      textColor: "text-slate-600",
      desc: "Delivering balanced metrics relative to options.",
      icon: "⚖️",
      label: "Steady Performer"
    };
  };

  // Filter listings
  const filteredCreatives = selectedCampaignId === "All"
    ? creatives
    : creatives.filter((c) => c.campaignId === selectedCampaignId);

  // Latest uploaded creative finder
  const latestCreative = creatives && creatives.length > 0
    ? [...creatives].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0]
    : null;

  // Group creative performance by campaign for campaigns which already have creatives uploaded
  const campaignsWithCreatives = campaigns.filter((camp) => creatives.some((c) => c.campaignId === camp.id));

  const campaignPerformanceList = campaignsWithCreatives.map((camp) => {
    const campCreatives = creatives.filter((c) => c.campaignId === camp.id);
    const totalConversions = campCreatives.reduce((sum, c) => sum + (Number(c.conversions) || 0), 0);
    const totalClicks = campCreatives.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    const totalSpend = campCreatives.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
    const blendedCTR = totalSpend > 0 ? ((totalClicks / totalSpend) * 100).toFixed(2) : "0.00";
    const blendedCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : "0.00";

    return {
      campaignId: camp.id,
      campaignName: camp.name,
      platform: camp.platform,
      uploadedCount: campCreatives.length,
      conversions: totalConversions,
      clicks: totalClicks,
      spend: totalSpend,
      ctr: blendedCTR,
      cpa: blendedCPA,
    };
  });

  return (
    <div className="w-full space-y-6">
      {/* List creatives Section */}
        {/* Header Title */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Creative Performance Hub</h2>
            <p className="text-xs text-slate-500">
              Evaluate image banners, headlines, dynamic performance metrics, and highlight top vs underperforming variants under each campaign.
            </p>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => setShowCopilot(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Cpu size={14} />
              AI Copy Copilot
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-3.5 py-2.5 rounded-lg shadow-xs font-display transition-all cursor-pointer"
            >
              <Plus size={14} />
              Add Creative asset
            </button>
          </div>
        </div>

        {/* Dynamic Creative Insights Panel: Latest Uploaded & Campaign Performance Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="creative-insights-matrix-panel">
          {/* Section A: Last Creative Uploaded */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-display">
                  Last Creative Uploaded
                </h3>
                <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                  Latest Upload
                </span>
              </div>
              
              {latestCreative ? (
                <div className="mt-2.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative">
                      <img 
                        src={latestCreative.imageUrl} 
                        alt={latestCreative.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 truncate" title={latestCreative.name}>
                        {latestCreative.name}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 truncate italic mt-0.5" title={latestCreative.headline}>
                        "{latestCreative.headline}"
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.2 rounded font-bold ${platformColors[latestCreative.platform] || "bg-slate-100"}`}>
                          {latestCreative.platform}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {latestCreative.createdAt ? new Date(latestCreative.createdAt).toLocaleDateString() : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance sub-metrics of this latest asset */}
                  <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 font-display">
                      Recorded Performance
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10.5px]">
                      <div className="bg-white py-1.5 rounded border border-slate-100">
                        <div className="text-[8.5px] text-slate-400 font-sans">Conversions</div>
                        <div className="font-bold text-slate-700">{latestCreative.conversions}</div>
                      </div>
                      <div className="bg-white py-1.5 rounded border border-slate-100">
                        <div className="text-[8.5px] text-slate-400 font-sans">Clicks (CTR)</div>
                        <div className="font-bold text-slate-700">
                          {latestCreative.clicks} ({latestCreative.spend > 0 ? ((latestCreative.clicks / latestCreative.spend) * 100).toFixed(1) : "0.0"}%)
                        </div>
                      </div>
                      <div className="bg-white py-1.5 rounded border border-slate-100">
                        <div className="text-[8.5px] text-slate-400 font-sans">Spend</div>
                        <div className="font-bold text-slate-700">${latestCreative.spend}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-[11px] italic">
                  No creative assets have been uploaded yet. Publish assets to monitor operational feedback.
                </div>
              )}
            </div>
            {latestCreative && (
              <p className="text-[10px] text-slate-400 text-right italic leading-none">
                Auto-synced with advertising network dashboards
              </p>
            )}
          </div>

          {/* Section B: Campaign-level Creative Performance Tracker */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-display">
                  Active Campaigns Creative Performance
                </h3>
                <span className="text-[9.5px] text-slate-500 font-mono font-bold bg-slate-50 border border-slate-205 px-1.5 rounded">
                  {campaignPerformanceList.length} Active
                </span>
              </div>

              <div className="mt-2 text-xs divide-y divide-slate-100 max-h-[145px] overflow-y-auto scrollbar-thin space-y-1.5">
                {campaignPerformanceList.length > 0 ? (
                  campaignPerformanceList.map((cp) => (
                    <div key={cp.campaignId} className="pt-2 flex items-center justify-between gap-3 text-[11px]">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 hover:text-indigo-600 transition-colors block truncate" title={cp.campaignName}>
                          {cp.campaignName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-450 mt-0.5">
                          <span className="bg-slate-100 px-1 py-0.2 rounded font-mono font-medium">{cp.platform}</span>
                          <span>•</span>
                          <span className="font-bold text-indigo-500">{cp.uploadedCount} Creative Asset(s) Link</span>
                        </div>
                      </div>
                      
                      <div className="text-right font-mono shrink-0">
                        <span className="font-bold text-slate-800 text-xs block">{cp.conversions} Conversions</span>
                        <span className="text-[9px] text-slate-400 font-sans font-semibold">
                          ${cp.spend} Spend • {cp.ctr}% CTR
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-[11px] italic">
                    Campaign performance metrics will appear here once creative assets are added.
                  </div>
                )}
              </div>
            </div>
            
            {campaignPerformanceList.length > 0 && (
              <div className="text-[10px] text-slate-400 mt-2 text-right italic leading-none border-t border-slate-50 pt-1.5">
                Reflects creative contributions per workspace channel
              </div>
            )}
          </div>
        </div>

        {/* Campaign Filter Selector & Layout Switcher */}
        <div className="bg-white p-4 rounded-xl border border-slate-205 border-slate-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider font-display shrink-0">
              Target Campaign:
            </span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-pointer"
            >
              <option value="All">All Marketing Projects</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="creative-view-mode-switch">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                viewMode === "grid" 
                  ? "bg-white text-indigo-600 shadow-xs" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
              title="Grid Layout View"
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                viewMode === "list" 
                  ? "bg-white text-indigo-600 shadow-xs" 
                  : "text-slate-500 hover:text-slate-850"
              }`}
              title="List Table View"
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>

        {/* List of creatives render switcher */}
        {filteredCreatives.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
            <FileImage size={44} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-805 text-slate-800 font-display">No creative variations filed yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your copy, image metrics, and spend records to benchmark creative ROI or test with Gemini copilot.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
            {filteredCreatives.map((c) => {
              const ctr = c.spend > 0 ? ((c.clicks / c.spend) * 100).toFixed(2) : "0.00";
              const cpa = c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : "0.00";

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                    activeAnalysisCreative?.id === c.id ? "border-indigo-650 border-indigo-600 ring-2 ring-indigo-600/10" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Visual Graphic Banner */}
                    <div className="h-44 w-full bg-slate-100 relative group overflow-hidden">
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                        <span className={`text-[9px] uppercase tracking-wide px-2 py-0.5 rounded font-bold ${platformColors[c.platform] || "bg-slate-100"}`}>
                          {c.platform}
                        </span>
                      </div>

                      {c.aiScore && (
                        <div className="absolute top-2.5 right-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] font-mono shadow-xs">
                          Score: {c.aiScore}/100
                        </div>
                      )}
                    </div>

                    {/* Metadata specs */}
                    <div className="p-4 space-y-3.5">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-display font-semibold truncate leading-none mb-1">
                          {c.campaignName}
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{c.name}</h4>
                      </div>

                      {/* Headline body copies review */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Headline:</span>
                          <p className="text-xs font-bold text-slate-700 leading-tight mt-0.5">{c.headline}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Primary Body Text:</span>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-tight">
                            {c.bodyText || "No body description copy added."}
                          </p>
                        </div>
                      </div>

                      {/* Performance Insight Indicator Pill */}
                      {(() => {
                        const marker = getCreativePerformanceStatus(c);
                        return (
                          <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${marker.color}`}>
                            <span className="text-sm leading-none shrink-0" role="img" aria-label="performance-status">{marker.icon}</span>
                            <div className="min-w-0">
                              <span className="font-extrabold uppercase tracking-wide text-[8.5px] block leading-none">
                                Performance:
                              </span>
                              <span className="text-[10.5px] font-semibold block mt-0.5 leading-snug">
                                {marker.label}
                              </span>
                              <p className="text-[9.5px] text-slate-505 font-medium leading-tight mt-0.5 text-slate-500">
                                {marker.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Creative performance parameters table */}
                      <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-100/50 p-2 rounded-xl text-slate-600 font-mono text-[11px]">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-display font-medium">Conversions</div>
                          <div className="font-bold text-slate-700 mt-0.5">{c.conversions}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-display font-medium">Clicks</div>
                          <div className="font-bold text-slate-700 mt-0.5">{c.clicks}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-display font-medium">Spent ($)</div>
                          <div className="font-bold text-slate-700 mt-0.5">${c.spend}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creative Hub Action triggers */}
                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      onClick={() => handleTriggerCreativeAnalysis(c)}
                      className="flex-1 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} className="text-indigo-500 animate-spin-slow" />
                      Gemini Diagnostics
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Do you wish to delete creative variations file "${c.name}"?`)) {
                          await onDeleteCreative(c.id);
                        }
                      }}
                      className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50 hover:border-rose-100 rounded-lg shrink-0 cursor-pointer transition-all"
                      title="Delete Creative"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* OPTIMIZED widescreen List view to avoid table shrinkage and make tracking clean */
          <div className="overflow-x-auto scrollbar-thin bg-white rounded-xl border border-slate-200 shadow-xs animate-fade-in" id="creatives-list-table-container">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="p-4 pl-5">Preview</th>
                  <th className="p-4">Variant &amp; Copy Headline</th>
                  <th className="p-4">Campaign Name</th>
                  <th className="p-4 text-center">Platform</th>
                  <th className="p-4 text-center">Conversions</th>
                  <th className="p-4 text-center">Clicks</th>
                  <th className="p-4 text-center">Spend</th>
                  <th className="p-4 text-center">CTR / CPA KPI</th>
                  <th className="p-4 text-center">Audit Score</th>
                  <th className="p-4 text-center">Performance Indicator</th>
                  <th className="p-4 text-center pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-705 text-slate-700">
                {filteredCreatives.map((c) => {
                  const ctr = c.spend > 0 ? ((c.clicks / c.spend) * 100).toFixed(2) : "0.00";
                  const cpa = c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : "0.00";
                  const isDiagnosed = !!c.aiScore;

                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        activeAnalysisCreative?.id === c.id ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      <td className="p-4 pl-5">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-4xs shrink-0 bg-slate-100">
                          <img 
                            src={c.imageUrl} 
                            alt={c.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      <td className="p-4 max-w-[250px]">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate" title={c.name}>{c.name}</span>
                          <span className="text-[10px] text-slate-450 block truncate italic mt-1 leading-snug" title={c.headline}>
                            "{c.headline}"
                          </span>
                        </div>
                      </td>

                      <td className="p-4 max-w-[180px]">
                        <span className="text-slate-600 block truncate" title={c.campaignName}>{c.campaignName}</span>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block text-[9px] uppercase tracking-wide px-2 py-0.5 rounded font-bold border ${platformColors[c.platform] || "bg-slate-100"}`}>
                          {c.platform}
                        </span>
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-slate-800">
                        {c.conversions.toLocaleString()}
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-slate-800">
                        {c.clicks.toLocaleString()}
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-slate-800">
                        ${c.spend.toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono text-[11px] font-bold text-slate-850 px-1.5 py-0.2 bg-slate-100 rounded border border-slate-200/60">{ctr}% CTR</span>
                          <span className="text-[8.5px] text-slate-400 font-bold uppercase mt-1 tracking-wider">${cpa} CPA</span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        {isDiagnosed ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold font-mono border border-emerald-200/70" title={`Audited score: ${c.aiScore}/100`}>
                            {c.aiScore}/100
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 font-semibold italic">Un-diagnosed</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {(() => {
                          const marker = getCreativePerformanceStatus(c);
                          return (
                            <span 
                              className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10.5px] font-bold border rounded-lg ${marker.color} cursor-help`}
                              title={`${marker.label}: ${marker.desc}`}
                            >
                              <span>{marker.icon}</span>
                              <span>{marker.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      <td className="p-4 text-center pr-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTriggerCreativeAnalysis(c)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-150 rounded-lg shadow-4xs transition-all cursor-pointer font-bold flex items-center gap-1 text-[10px]"
                            title="Run Gemini Diagnostics on visual content"
                          >
                            <Sparkles size={11} className="text-indigo-500" />
                            <span>Diagnose</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Do you wish to delete creative variations file "${c.name}"?`)) {
                                await onDeleteCreative(c.id);
                              }
                            }}
                            className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50 hover:border-rose-100 rounded-lg shrink-0 cursor-pointer transition-all"
                            title="Delete Creative Variant"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {/* Manual creative additions */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-150 shadow-xl p-5 relative max-h-[92vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-sm font-bold font-display text-slate-900 mb-0.5">
              Add Creative asset
            </h3>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Upload custom visual artwork or write text headlines to analyze comparative clicks and budget conversions.
            </p>

            <form onSubmit={handleSaveCreativeSubmit} className="space-y-3.5 text-[11px]">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {/* Variant Name */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Creative Variant Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Testimonial Infographic - Blue Theme"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                  />
                </div>

                {/* Campaign Link */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Marketing Campaign</label>
                  <select
                    value={assetCampaignId}
                    onChange={(e) => handleCampaignChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-[11px] bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                  >
                    <option value="">-- Choose Campaign --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Network Channel</label>
                  <select
                    value={assetPlatform}
                    onChange={(e) => setAssetPlatform(e.target.value as CreativeAsset["platform"])}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-[11px] bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta (Facebook)">Meta (Facebook)</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>

                {/* Headline copy */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ad Copy Headline (displayed)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cut Your CRM Workload in Half with Automation"
                    value={assetHeadline}
                    onChange={(e) => setAssetHeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                  />
                </div>

                {/* Body Text */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Primary Body Description copy</label>
                  <textarea
                    rows={1.5}
                    placeholder="Provide standard marketing description, features, benefits..."
                    value={assetBodyText}
                    onChange={(e) => setAssetBodyText(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs resize-none font-sans focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                  />
                </div>

                {/* Graphic input selector */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-600">Creative Graphic Asset</label>
                    <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setImageUrlType("url")}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${imageUrlType === 'url' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                      >
                        Web Link URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUrlType("upload")}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded cursor-pointer ${imageUrlType === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                      >
                        Image Upload
                      </button>
                    </div>
                  </div>

                  {imageUrlType === "url" ? (
                    <input
                      type="url"
                      placeholder="e.g. https://images.unsplash.com/photo-example..."
                      value={assetImageUrl}
                      onChange={(e) => setAssetImageUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                    />
                  ) : (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                        dragActive ? "border-indigo-500 bg-indigo-50/10" : "border-slate-200 bg-slate-50 hover:bg-slate-100/30"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      {assetImageUrl ? (
                        <div className="space-y-1">
                          <CheckCircle2 size={18} className="mx-auto text-indigo-600" />
                          <p className="text-[10px] text-slate-605 font-bold">Image loaded successfully</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <UploadCloud size={20} className="mx-auto text-slate-400" />
                          <p className="text-[10px] text-slate-600 font-bold">Drag & drop or Click to browse</p>
                          <p className="text-[9px] text-slate-400">Supports PNG, JPG, or WEBP</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3-Column Metrics Row */}
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 text-center">Conversions</label>
                    <input
                      type="number"
                      min={0}
                      value={assetConversions}
                      onChange={(e) => setAssetConversions(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 text-center">Clicks</label>
                    <input
                      type="number"
                      min={0}
                      value={assetClicks}
                      onChange={(e) => setAssetClicks(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 text-center">Budget Spend ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={assetSpend}
                      onChange={(e) => setAssetSpend(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden bg-white"
                    />
                  </div>
                </div>

                {/* Audit Change Ledger Sync */}
                <div className="col-span-2 bg-indigo-50/20 p-3 border border-indigo-100/50 rounded-xl space-y-1.5 mt-0.5">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={logChangeAsEntry}
                      onChange={(e) => setLogChangeAsEntry(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <History size={12} className="text-indigo-600" />
                      Automatic Change Log Registry
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal pl-5">
                    Populates the Change Ledger sheet inside the Reports portal dynamically on publish.
                  </p>
                  
                  {logChangeAsEntry && (
                    <div className="pl-5 space-y-1 animate-fade-in">
                      <label className="block text-[10px] font-bold text-slate-600">Reason for this Creative Amendment / Upgrade</label>
                      <textarea
                        rows={1.5}
                        placeholder="e.g. Launched new high-contrast summer promotional graphic to improve click-through rates."
                        value={changeLogReason}
                        onChange={(e) => setChangeLogReason(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 bg-white rounded-lg text-slate-700 text-[10.5px] resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 outline-hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal control */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-all"
                >
                  Publish Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Copy Copilot side panel dialog */}
      {showCopilot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-100 shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Cpu size={18} />
              </span>
              <h3 className="text-base font-bold font-display text-slate-800">
                Ad Copy Copywriting Copilot
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 text-slate-400">
              Supply basic details of your products, and Gemini will generate 3 options of scroll-stopping ad copy headlines and graphic suggestions.
            </p>

            <form onSubmit={handleGenerateCopyCopilot} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Product/Service */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product or Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serene Mindfulness App"
                    value={copilotProductName}
                    onChange={(e) => setCopilotProductName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Channels */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Platform Channel</label>
                  <select
                    value={copilotPlatform}
                    onChange={(e) => setCopilotPlatform(e.target.value as Campaign["platform"])}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
                  >
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta (Facebook)">Meta (Facebook)</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>

                {/* Target audience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Audience parameters</label>
                  <input
                    type="text"
                    placeholder="e.g. Overworked tech professionals with 3+ years experience"
                    value={copilotAudience}
                    onChange={(e) => setCopilotAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>

                {/* Objective details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Campaign Objective Brief</label>
                  <input
                    type="text"
                    placeholder="e.g. Sign up for 14-day premium free trial"
                    value={copilotObjectives}
                    onChange={(e) => setCopilotObjectives(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>

              {/* Help trigger */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={copilotIsLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-350"
                >
                  {copilotIsLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      Generating Copy Options...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Ad Copy
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error Copilot notification */}
            {copilotError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-start gap-2.5 mt-5">
                <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                <p>{copilotError}</p>
              </div>
            )}

            {/* Suggestions listings */}
            {copilotSuggestions.length > 0 && (
              <div className="mt-6 space-y-4 pt-5 border-t border-slate-50">
                <h4 className="font-bold text-slate-700 font-display text-sm">Copy Variations Generated by Gemini:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {copilotSuggestions.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-4.5 rounded-xl flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Option #{idx + 1}
                        </span>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Headline:</div>
                          <p className="font-bold text-slate-800 leading-tight mt-0.5">"{s.headline}"</p>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Primary Text:</div>
                          <p className="text-slate-600 text-[11px] leading-tight select-all">"{s.bodyText}"</p>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Creative Mockup Idea:</div>
                          <p className="text-slate-500 font-sans text-[10px] italic leading-tight mt-0.5">
                            "{s.creativeConcept}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApplyCopilotSuggestion(s)}
                        className="mt-4 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check size={12} className="text-white" />
                        Apply Copy and Create Asset
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end">
              <button
                onClick={() => setShowCopilot(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Copilot Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
