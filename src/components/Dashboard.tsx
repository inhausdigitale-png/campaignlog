import React, { useState } from "react";
import { Campaign, CampaignPerformance, AIRecommendationReport, ChangeLogEntry } from "../types";
import { formatINR, formatIndianShort, formatIndianNumber } from "../utils/indiaHelpers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Target,
  MousePointerClick,
  Eye,
  ArrowRightLeft,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  Calendar,
  Filter,
  History,
  User,
  Clock,
  FileText,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface DashboardProps {
  campaigns: Campaign[];
  campaignPerformances?: CampaignPerformance[];
  onSavePerformance?: (p: CampaignPerformance) => Promise<void>;
  changeLogEntries?: ChangeLogEntry[];
}

export default function Dashboard({ 
  campaigns, 
  campaignPerformances = [], 
  onSavePerformance,
  changeLogEntries = []
}: DashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const [aiReport, setAiReport] = useState<AIRecommendationReport | null>(null);

  // Activity Feed States
  const [activitySearch, setActivitySearch] = useState<string>("");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>("All");
  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});

  const toggleActivityDetails = (id: string) => {
    setExpandedActivityIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Platform list
  const platforms = ["All", "Google Ads", "Meta (Facebook)", "LinkedIn", "TikTok", "YouTube"];

  // Helper to extract project name safely
  const getProjectName = (c: Campaign) => {
    if (c.objectives && c.objectives.includes("Project: ")) {
      const match = c.objectives.match(/Project:\s*([^|]+)/);
      if (match) return match[1].trim();
    }
    return "Vivaana"; // Default fallback matching existing data
  };

  // Map CampaignPerformances to Campaign form for a comprehensive combined dataset
  const mappedPerformanceCampaigns: Campaign[] = campaignPerformances.map((perf) => {
    let platform: Campaign["platform"] = "Google Ads";
    const nameLower = perf.campaignName.toLowerCase();
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
      budget: Number(perf.amountSpend) || 0,
      spend: Number(perf.amountSpend) || 0,
      conversions: Number(perf.leads) || 0,
      clicks: Number(perf.clicks) || 0,
      impressions: Number(perf.impression) || 0,
      startDate: perf.createdAt ? perf.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: perf.createdAt ? perf.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
      objectives: `Project: ${perf.projectName} | Adset: ${perf.adsetName} (Uploaded)`,
      createdAt: perf.createdAt || new Date().toISOString(),
      updatedAt: perf.createdAt || new Date().toISOString(),
    };
  });

  const mergedCampaigns = [...campaigns, ...mappedPerformanceCampaigns];

  // Distinct developer projects across the combined dataset
  const availableProjects = Array.from(
    new Set(mergedCampaigns.map((c) => getProjectName(c)))
  ).filter(Boolean);

  // Filter campaigns dynamically based on active filter choices
  const filteredCampaigns = mergedCampaigns.filter((c) => {
    const matchesPlatform = selectedPlatform === "All" || c.platform === selectedPlatform;
    const matchesProject = selectedProject === "All" || getProjectName(c) === selectedProject;
    const matchesStartDate = !startDateFilter || !c.startDate || c.startDate >= startDateFilter;
    const matchesEndDate = !endDateFilter || !c.endDate || c.endDate <= endDateFilter;
    return matchesPlatform && matchesProject && matchesStartDate && matchesEndDate;
  });

  // Dynamic stats calculation
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const totalConversions = filteredCampaigns.reduce((sum, c) => sum + (Number(c.conversions) || 0), 0);
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);

  // Safe calculated metrics
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  // Recharts: Data grouped dynamically based on current output criteria
  const platformGroupDataMap = filteredCampaigns.reduce((acc, c) => {
    if (!acc[c.platform]) {
      acc[c.platform] = { platform: c.platform, spend: 0, conversions: 0, clicks: 0, budget: 0 };
    }
    acc[c.platform].spend += Number(c.spend) || 0;
    acc[c.platform].conversions += Number(c.conversions) || 0;
    acc[c.platform].clicks += Number(c.clicks) || 0;
    acc[c.platform].budget += Number(c.budget) || 0;
    return acc;
  }, {} as Record<string, { platform: string; spend: number; conversions: number; clicks: number; budget: number }>);

  const platformChartData = Object.values(platformGroupDataMap);

  // Pie colors
  const COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#94a3b8", "#cbd5e1"];

  // Fetch AI Insights
  const handleFetchAiInsights = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/gemini/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact optimization copilot.");
      }

      const data = await response.json();
      setAiReport(data);
    } catch (err: any) {
      setAiError(err.message || "An unexpected error occurred during report generation.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Newly Updated Creatives Indicator Banner */}
      {campaignPerformances && campaignPerformances.some(p => p.creativeNewUpdatedFlag) && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-2 text-indigo-700 rounded-lg shrink-0 mt-0.5 animate-pulse">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <span>🎨 Newly Updated Creative Campaign Assets</span>
                <span className="bg-indigo-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
                  {campaignPerformances.filter(p => p.creativeNewUpdatedFlag).length}
                </span>
              </h4>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                New creative assets have been updated in Campaign Upload &amp; Change Log.
              </p>
              
              {/* Mini thumbnails list */}
              <div className="flex flex-wrap gap-2.5 mt-2.5">
                {campaignPerformances.filter(p => p.creativeNewUpdatedFlag).map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg p-1.5 pr-2.5 shadow-3xs">
                    {p.creativeImageUrl ? (
                      <img 
                        src={p.creativeImageUrl} 
                        alt="Creative thumbnail" 
                        className="w-7 h-7 object-cover rounded border border-indigo-100"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-slate-50 flex items-center justify-center rounded border border-slate-200 text-[8px] italic text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="leading-tight">
                      <span className="font-black text-[10px] text-slate-900 block max-w-[150px] truncate">{p.campaignName}</span>
                      <span className="text-[8px] text-indigo-600 font-bold block bg-indigo-50/50 px-1 py-0.2 rounded mt-0.5 w-max">{p.projectName}</span>
                    </div>
                    {onSavePerformance && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onSavePerformance({
                            ...p,
                            creativeNewUpdatedFlag: false
                          });
                        }}
                        className="ml-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 font-bold text-[8.5px] px-1 py-0.5 rounded transition-all border border-slate-200 hover:border-indigo-200 cursor-pointer"
                        title="Dismiss Notice"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Advanced Filter Control Desk */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4" id="dashboard-advanced-filters-panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display flex items-center gap-1.5 uppercase tracking-wider">
              <Filter size={14} className="text-indigo-650 text-indigo-600" />
              <span>Interactive Analytics Control Board</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Set multi-dimensional parameters of projects, date intervals, and platforms below to filter real-time metrics.
            </p>
          </div>
          {(selectedPlatform !== "All" || selectedProject !== "All" || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSelectedPlatform("All");
                setSelectedProject("All");
                setStartDateFilter("");
                setEndDateFilter("");
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Project selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full text-xs h-10 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-semibold transition-all cursor-pointer"
            >
              <option value="All">All Real Estate Projects</option>
              {availableProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full text-xs h-10 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-medium transition-all cursor-pointer"
            />
          </div>

          {/* Date Range End */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full text-xs h-10 px-3 bg-slate-50 border border-slate-200 hover:border-slate-305 rounded-lg text-slate-600 font-medium transition-all cursor-pointer"
            />
          </div>

          {/* Platform selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ad Network</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full text-xs h-10 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-semibold transition-all cursor-pointer"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All Platforms" : p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Budget info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display">Target Budget</span>
            <div className="p-1 text-slate-500 font-bold font-sans text-sm">
              ₹
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900">
              {formatINR(totalBudget)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Sum of current plans</p>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display">Amount Spent</span>
            <div className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold font-sans">
              ₹
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900">
              {formatINR(totalSpend)}
            </h3>
            <p className="text-[10px] text-indigo-700 font-medium mt-1">
              {totalBudget > 0 ? `${((totalSpend / totalBudget) * 100).toFixed(0)}% budget burn rate` : "0% spent"}
            </p>
          </div>
        </div>

        {/* Conversions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display">Conversions</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900">
              {formatIndianNumber(totalConversions)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Avg. Conv Rate: <span className="font-semibold text-slate-700">{convRate.toFixed(2)}%</span>
            </p>
          </div>
        </div>

        {/* Average CPA */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display">Avg CPA</span>
            <div className="p-0.5 bg-slate-50 text-slate-600 rounded text-[11px] font-bold font-sans">
              ₹/c
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900">
              {formatINR(cpa)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Cost per acquiring customer</p>
          </div>
        </div>

        {/* CTR & Clicks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display">Click CTR</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
              <MousePointerClick size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900">
              {ctr.toFixed(2)}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              From <span className="font-semibold">{formatIndianNumber(totalClicks)}</span> clicks
            </p>
          </div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <LayoutDashboard className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700 font-display">No campaigns declared yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Build your first ad campaign in the <strong>Campaigns</strong> tab to populate statistics.
          </p>
        </div>
      ) : (
        <>
          {/* Charts section with Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Bar chart: spend & conversions */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <h3 className="text-xs font-bold font-display text-slate-705 text-slate-800 mb-4 flex items-center gap-2">
                <span>Multi-Platform Ad Performance (Spend vs. Conversions)</span>
              </h3>
              <div className="h-72 w-full text-xs">
                {platformChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Not enough transaction histories.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="platform" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]} />
                      <Legend wrapperStyle={{ paddingTop: 10 }} />
                      <Bar yAxisId="left" dataKey="spend" name="Spend (INR - ₹)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie Chart: Budget Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold font-display text-slate-805 text-slate-800 mb-4">
                Share of Budget by Advertising Network
              </h3>
              <div className="h-60 w-full flex items-center justify-center text-xs">
                {platformChartData.length === 0 ? (
                  <span className="text-slate-400">No active network budgets.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformChartData}
                        dataKey="budget"
                        nameKey="platform"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        label={({ name, percent }) => `${name} (${(percent * 105 / 1.05 * 10 / 1000).toFixed(0)}%)`}
                      >
                        {platformChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Budget"]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 justify-center text-[10px] text-slate-500 font-medium font-mono">
                {platformChartData.map((entry, idx) => (
                  <div key={entry.platform} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{entry.platform}: {formatINR(entry.budget)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Operations & Modification Feed (Audit Trail) */}
          {(() => {
            // Sort activities by date/timestamp descending
            const sortedActivities = [...changeLogEntries].sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date ? new Date(a.date).getTime() : 0);
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date ? new Date(b.date).getTime() : 0);
              return dateB - dateA;
            });

            const getCategory = (entry: ChangeLogEntry) => {
              if (entry.changeCategory) return entry.changeCategory;
              const typeLower = (entry.type || "").toLowerCase();
              if (typeLower.includes("budget")) return "Budget";
              if (typeLower.includes("creative") || typeLower.includes("copy") || typeLower.includes("headline")) return "Creative";
              if (typeLower.includes("audience") || typeLower.includes("target") || typeLower.includes("location") || typeLower.includes("interest")) return "Audience";
              return "Other";
            };

            const filteredActivities = sortedActivities.filter((entry) => {
              const category = getCategory(entry);
              const matchesCategory = activityCategoryFilter === "All" || category === activityCategoryFilter;
              
              const searchLower = activitySearch.toLowerCase();
              const matchesSearch = 
                (entry.project || "").toLowerCase().includes(searchLower) ||
                (entry.campaignName || "").toLowerCase().includes(searchLower) ||
                (entry.type || "").toLowerCase().includes(searchLower) ||
                (entry.changed || "").toLowerCase().includes(searchLower) ||
                (entry.reason || "").toLowerCase().includes(searchLower) ||
                (entry.lastEditedBy || "").toLowerCase().includes(searchLower);

              return matchesCategory && matchesSearch;
            });

            const totalModifications = sortedActivities.length;
            const implementedCount = sortedActivities.filter(a => a.progress === "Implemented").length;
            const inProgressCount = sortedActivities.filter(a => a.progress === "In Progress" || a.progress === "In-Progress").length;
            const plannedCount = sortedActivities.filter(a => a.progress === "Planned").length;

            return (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-full uppercase tracking-wider mb-2 font-mono">
                      <Clock size={11} className="text-emerald-500 animate-pulse" />
                      Live Feed Stream
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Administrator Activity & Change Log</h3>
                    <p className="text-xs text-slate-500 max-w-2xl mt-1">
                      High-level audit feed displaying recent system modifications, target budget relocations, active target changes, and ad asset tunings.
                    </p>
                  </div>

                  {/* Micro statistics badges */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      Total Actions: <strong className="font-mono">{totalModifications}</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-250">
                      Implemented: <strong className="font-mono">{implementedCount}</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-250">
                      In Progress: <strong className="font-mono">{inProgressCount}</strong>
                    </span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-250">
                      Planned: <strong className="font-mono">{plannedCount}</strong>
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search logged modifications or operations rationale..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="w-full text-xs h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg text-slate-700 transition-all outline-hidden"
                    />
                    <div className="absolute left-3 top-2.5 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 self-start md:self-auto select-none">
                    {["All", "Budget", "Creative", "Audience", "Other"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActivityCategoryFilter(cat)}
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                          activityCategoryFilter === cat
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed Log Stream */}
                <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                      <History size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No matching operations found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try relaxing your search terms or selecting another category.</p>
                    </div>
                  ) : (
                    filteredActivities.map((entry) => {
                      const category = getCategory(entry);
                      const isExpanded = !!expandedActivityIds[entry.id];

                      // Icon assignment based on category
                      let categoryIcon = <History size={15} className="text-indigo-600" />;
                      let iconBg = "bg-indigo-50 border-indigo-100";
                      
                      if (category === "Budget") {
                        categoryIcon = <DollarSign size={15} className="text-emerald-600" />;
                        iconBg = "bg-emerald-50 border-emerald-100";
                      } else if (category === "Creative") {
                        categoryIcon = <FileText size={15} className="text-blue-600" />;
                        iconBg = "bg-blue-50 border-blue-100";
                      } else if (category === "Audience") {
                        categoryIcon = <User size={15} className="text-amber-600" />;
                        iconBg = "bg-amber-50 border-amber-100";
                      }

                      // Progress styles
                      let progressStyle = "bg-slate-50 text-slate-600 border-slate-200";
                      if (entry.progress === "Implemented") {
                        progressStyle = "bg-emerald-50 text-emerald-800 border-emerald-200/60";
                      } else if (entry.progress === "In Progress" || entry.progress === "In-Progress") {
                        progressStyle = "bg-amber-50 text-amber-800 border-amber-200/60";
                      } else if (entry.progress === "Planned") {
                        progressStyle = "bg-sky-50 text-sky-800 border-sky-200/60";
                      } else if (entry.progress === "Rolled Back") {
                        progressStyle = "bg-rose-50 text-rose-850 text-rose-700 border-rose-200/60";
                      }

                      return (
                        <div
                          key={entry.id}
                          className="group border border-slate-200 bg-white hover:border-slate-300/90 rounded-xl transition-all shadow-xs"
                        >
                          <div
                            onClick={() => toggleActivityDetails(entry.id)}
                            className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`p-2 rounded-lg border ${iconBg} shrink-0`}>
                                {categoryIcon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {entry.campaignName}
                                  </span>
                                  {entry.project && (
                                    <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                      {entry.project}
                                    </span>
                                  )}
                                  <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${progressStyle} font-sans`}>
                                    {entry.progress || "General Log"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-1">
                                  {entry.changed || "Campaign configurations edited"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 text-right">
                              <div className="text-right">
                                <span className="block text-[10.5px] font-semibold text-slate-700">
                                  {entry.type || "Modification"}
                                </span>
                                <span className="block text-[9.5px] text-slate-400 font-mono mt-0.5">
                                  {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  }) : entry.date}
                                </span>
                              </div>
                              <div className="text-slate-400 group-hover:text-slate-700 transition-colors">
                                <svg
                                  className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Detail expansion area */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/60 p-4 rounded-b-xl text-xs space-y-3 animate-fade-in">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Operations Rationale</span>
                                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                                    {entry.reason || "No explicit modification explanation was declared."}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">System Parameters</span>
                                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1.5 font-mono text-[11px] text-slate-600">
                                    <div className="flex justify-between border-b border-slate-100 pb-1">
                                      <span>Ad Set Context:</span>
                                      <span className="font-semibold text-slate-800">{entry.adSetName || "All Ad Sets"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1">
                                      <span>Network Status:</span>
                                      <span className="font-semibold text-slate-800">{entry.campaignStatus || "Active"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1">
                                      <span>Log Operator ID:</span>
                                      <span className="font-semibold text-slate-800">{entry.lastEditedBy || "authorized_operator@example.in"}</span>
                                    </div>
                                    <div className="flex justify-between pb-0">
                                      <span>Logged Timestamp:</span>
                                      <span className="font-semibold text-slate-800 truncate select-all">{entry.createdAt || entry.date}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* AI recommendations drawer (Gemini Powered) */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full uppercase tracking-wider mb-2 font-mono">
                  <Sparkles size={11} className="text-indigo-600 animate-pulse" />
                  Gemini Copilot Active
                </span>
                <h3 className="text-base font-bold text-slate-900">Continuous Spend & ROI Recommendations</h3>
                <p className="text-xs text-slate-500 max-w-2xl mt-1">
                  Query the Gemini server intelligence matrix to run statistical evaluations of click rates, cost values, and conversions, calculating proper percentage relocation targets across networks.
                </p>
              </div>
              <button
                onClick={handleFetchAiInsights}
                disabled={isAiLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 text-xs font-bold text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-all self-stretch sm:self-auto cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-slate-450 text-slate-400" />
                    Crunching Metrics...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="text-white" />
                    Evaluate With Gemini AI
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="bg-rose-50 border border-rose-250 border-rose-200 p-4 rounded-lg mt-5 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Optimization Error</h4>
                  <p className="mt-0.5 text-[11px] text-rose-600/95">{aiError}</p>
                </div>
              </div>
            )}

            {aiReport && (
              <div className="mt-6 space-y-6 pt-5 border-t border-slate-200 animate-fade-in text-xs leading-relaxed text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Performance Appraisal */}
                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[10px] mb-2 font-display">
                      Performance Appraisal Summary
                    </h4>
                    <p className="text-slate-650">{aiReport.performanceAppraisal}</p>
                  </div>

                  {/* Network Comparison */}
                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-700 uppercase tracking-wide text-[10px] mb-2 font-display">
                      Platform Channel Comparison
                    </h4>
                    <p className="text-slate-650">{aiReport.platformComparison}</p>
                  </div>
                </div>

                {/* Relocation suggestions */}
                <div>
                  <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[10px] mb-3 font-display flex items-center gap-1">
                    <ArrowRightLeft size={12} className="text-indigo-600" />
                    Suggested Budget Allocation Adjustments
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiReport.budgetShifts && aiReport.budgetShifts.length > 0 ? (
                      aiReport.budgetShifts.map((shift, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 text-slate-700 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800">{shift.sourcePlatform}</span>
                              <span className="text-rose-600 text-[10px] font-mono font-bold">-{shift.percentage}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-3 text-indigo-650 text-indigo-600 font-bold text-xs">
                              <span className="font-bold text-slate-800">{shift.targetPlatform}</span>
                              <span className="font-mono">+{shift.percentage}% shift</span>
                            </div>
                            <p className="text-[11px] text-slate-500 italic">"{shift.reason}"</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-4 bg-slate-50 text-slate-400 rounded-xl border border-slate-200">
                        Existing platform ratios appear highly optimal. Maintain continuous surveillance.
                      </div>
                    )}
                  </div>
                </div>

                {/* Actionable Tips */}
                <div className="bg-indigo-50/55 p-4.5 rounded-xl border border-indigo-100">
                  <h4 className="font-semibold text-indigo-700 uppercase tracking-wide text-[10px] mb-2.5 font-display">
                    High-Conversion Creative & Copy Enhancements
                  </h4>
                  <ul className="space-y-2 text-slate-600">
                    {aiReport.actionableTips && aiReport.actionableTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
