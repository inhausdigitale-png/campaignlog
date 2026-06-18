import React, { useState } from "react";
import { Campaign, CampaignPerformance, AIRecommendationReport, ChangeLogEntry, PortalReportRow, DailySpendEntry } from "../types";
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
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  TrendingUp,
  IndianRupee,
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
  Share2,
  Compass,
  Info,
  Download,
} from "lucide-react";
import { dataService } from "../services/dataService";
import PortalDashboard from "./PortalDashboard";

interface DashboardProps {
  campaigns: Campaign[];
  campaignPerformances?: CampaignPerformance[];
  portalReports?: PortalReportRow[];
  onSavePerformance?: (p: CampaignPerformance) => Promise<void>;
  changeLogEntries?: ChangeLogEntry[];
  dailySpendList?: DailySpendEntry[];
  onNavigate?: (tab: "dashboard" | "campaigns" | "creatives" | "leads" | "portals" | "targets" | "rules" | "performance" | "download_reports" | "ai" | "sheets_sync" | "roles" | "comparison" | "daily_spend") => void;
}

export default function Dashboard({ 
  campaigns, 
  campaignPerformances = [], 
  portalReports = [],
  onSavePerformance,
  changeLogEntries = [],
  dailySpendList = [],
  onNavigate
}: DashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [dashboardView, setDashboardView] = useState<"digital" | "portal">("digital");

  // Interactive Campaign Charts Analytics States
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"channels" | "campaigns" | "efficiency" | "timeSeries" | "dailySpends">("channels");
  const [groupedBy, setGroupedBy] = useState<"platform" | "project">("platform");
  const [primaryMetric, setPrimaryMetric] = useState<"spend" | "conversions" | "clicks" | "budget">("spend");
  const [secondaryMetric, setSecondaryMetric] = useState<"conversions" | "clicks" | "cpa" | "ctr" | "none">("conversions");
  const [selectedInspectorCampaignId, setSelectedInspectorCampaignId] = useState<string | null>(null);
  const [simulatedBudgetChange, setSimulatedBudgetChange] = useState<number>(0); // slider percent change (-50% to +200%)

  // Helper metric translation functions
  const getMetricLabel = (key: string) => {
    switch(key) {
      case "spend": return "Amount Spent (₹)";
      case "conversions": return "Conversions (Leads)";
      case "clicks": return "Clicks";
      case "impressions": return "Impressions";
      case "budget": return "Planned Budget (₹)";
      case "cpa": return "Cost per Lead (CPA - ₹)";
      case "ctr": return "Click Through Rate (% CTR)";
      case "none": return "None";
      default: return key;
    }
  };

  const getMetricColor = (key: string, isSec?: boolean) => {
    if (isSec) {
      switch(key) {
        case "conversions": return "#10b981"; // Emerald
        case "clicks": return "#3b82f6"; // Blue
        case "cpa": return "#f43f5e"; // Rose
        case "ctr": return "#d97706"; // Amber
        default: return "#64748b";
      }
    }
    switch(key) {
      case "spend": return "#6366f1"; // Indigo
      case "conversions": return "#10b981"; // Emerald
      case "clicks": return "#06b6d4"; // Cyan
      case "budget": return "#f59e0b"; // Orange
      default: return "#4f46e5";
    }
  };

  const [aiReport, setAiReport] = useState<AIRecommendationReport | null>(null);

  const handleShare = async () => {
    const reportData = {
        campaigns,
        performances: campaignPerformances,
        timestamp: new Date().toISOString()
    };
    const id = await dataService.saveSharedReport(reportData);
    alert(`Report shared! Link: ${window.location.origin}/shared?shareId=${id}`);
  };

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

  // Filter daily spend list based on Dashboard Project and Date Range filters
  const filteredDailySpends = React.useMemo(() => {
    let list = dailySpendList && dailySpendList.length > 0 ? dailySpendList : [
      { id: "seed_1_meta", date: "2026-06-01", project: "Grand Horizon Residence", medium: "Meta Ad Acc", spend: 1292.76, leads: 8, createdAt: "2026-06-01" },
      { id: "seed_1_projectwise", date: "2026-06-01", project: "Grand Horizon Residence", medium: "Projectwise Acc", spend: 2299.37, leads: 17, createdAt: "2026-06-01" },
      { id: "seed_2_meta", date: "2026-06-02", project: "Grand Horizon Residence", medium: "Meta Ad Acc", spend: 1318.22, leads: 9, createdAt: "2026-06-02" },
      { id: "seed_2_projectwise", date: "2026-06-02", project: "Grand Horizon Residence", medium: "Projectwise Acc", spend: 2152.71, leads: 12, createdAt: "2026-06-02" },
      { id: "seed_3_meta", date: "2026-06-03", project: "Vivaana", medium: "Meta Ad Acc", spend: 890.00, leads: 5, createdAt: "2026-06-03" },
      { id: "seed_3_projectwise", date: "2026-06-03", project: "Vivaana", medium: "Projectwise Acc", spend: 1740.00, leads: 10, createdAt: "2026-06-03" }
    ];

    if (selectedProject !== "All") {
      list = list.filter(e => e.project === selectedProject);
    }
    if (startDateFilter) {
      list = list.filter(e => e.date >= startDateFilter);
    }
    if (endDateFilter) {
      list = list.filter(e => e.date <= endDateFilter);
    }
    return list;
  }, [dailySpendList, selectedProject, startDateFilter, endDateFilter]);

  // Aggregate for rendering a day-wise list on the Dashboard
  const pivotedDailySpends = React.useMemo(() => {
    const groups: Record<string, DailySpendEntry[]> = {};
    filteredDailySpends.forEach(entry => {
      const key = `${entry.date}__${entry.project}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    const rows = Object.keys(groups).map(key => {
      const entries = groups[key];
      const dateStr = entries[0].date;
      const projectStr = entries[0].project;
      const totalSpendWithoutGst = entries.reduce((acc, c) => acc + c.spend, 0);
      const totalLeads = entries.reduce((acc, c) => acc + c.leads, 0);
      const cplWithoutGst = totalLeads > 0 ? (totalSpendWithoutGst / totalLeads) : 0;
      const totalSpendWithGst = totalSpendWithoutGst * 1.18;

      return {
        date: dateStr,
        project: projectStr,
        totalSpendWithoutGst,
        totalLeads,
        cplWithoutGst,
        totalSpendWithGst
      };
    });

    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredDailySpends]);

  // Calculate totals for the filtered day-wise spends
  const dailySpendsTotals = React.useMemo(() => {
    let spendWithoutGst = 0;
    let leads = 0;
    filteredDailySpends.forEach(e => {
      spendWithoutGst += e.spend || 0;
      leads += e.leads || 0;
    });
    const spendWithGst = spendWithoutGst * 1.18;
    const avgCpl = leads > 0 ? (spendWithoutGst / leads) : 0;
    return { spendWithoutGst, spendWithGst, leads, avgCpl };
  }, [filteredDailySpends]);

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const exportDashboardDailySpendsToCsv = () => {
    if (pivotedDailySpends.length === 0) return;
    const headers = "Date,Project,Total Spend W/O GST,Leads,CPL W/O GST,Total Spend With GST (18%)\n";
    const rows = pivotedDailySpends.map(row => {
      const dateStr = parseLocalDate(row.date).replace(/,/g, "");
      const projName = row.project.replace(/,/g, "");
      return `"${dateStr}","${projName}",${row.totalSpendWithoutGst.toFixed(2)},${row.totalLeads},${row.cplWithoutGst.toFixed(2)},${row.totalSpendWithGst.toFixed(2)}`;
    }).join("\n");

    const content = headers + rows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_daywise_spend_${(selectedProject || "all").toLowerCase().replace(/[\s\(\):]/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculation of last 7 days of total lead generation performance
  const latestDateStr = React.useMemo(() => {
    if (filteredDailySpends && filteredDailySpends.length > 0) {
      const dates = filteredDailySpends.map(e => e.date).filter(Boolean);
      if (dates.length > 0) {
        return dates.reduce((max, d) => d > max ? d : max);
      }
    }
    // Fallback to latest campaign date if available, otherwise fixed string
    if (filteredCampaigns && filteredCampaigns.length > 0) {
      const dates = filteredCampaigns.map(c => c.startDate).filter(Boolean);
      if (dates.length > 0) {
        return dates.reduce((max, d) => d > max ? d : max);
      }
    }
    return "2026-06-18";
  }, [filteredDailySpends, filteredCampaigns]);

  const last7DaysData = React.useMemo(() => {
    const dates: string[] = [];
    try {
      const baseDate = new Date(latestDateStr);
      // Generate last 7 days ending at latestDateStr
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    } catch (e) {
      dates.push("2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18");
    }

    return dates.map(date => {
      // Leads from daily spends
      const dailySpendsForDate = filteredDailySpends.filter(e => e.date === date);
      let totalDailyLeads = dailySpendsForDate.reduce((sum, e) => sum + (Number(e.leads) || 0), 0);

      // If no daily spends, look for campaigns starting on this day or active during this day
      let campaignLeadsOnDate = 0;
      if (dailySpendsForDate.length === 0) {
        const matchingCampaigns = filteredCampaigns.filter(c => c.startDate === date);
        campaignLeadsOnDate = matchingCampaigns.reduce((sum, c) => sum + (Number(c.conversions) || Number(c.leads) || 0), 0);
      }

      const totalLeads = totalDailyLeads || campaignLeadsOnDate;

      return {
        date,
        formattedDate: parseLocalDate(date),
        shortDate: (() => {
          try {
            const parts = date.split("-");
            return `${parts[2]}/${parts[1]}`;
          } catch {
            return date;
          }
        })(),
        leads: totalLeads,
        spend: dailySpendsForDate.reduce((sum, e) => sum + (Number(e.spend) || 0), 0)
      };
    });
  }, [latestDateStr, filteredDailySpends, filteredCampaigns]);

  // Aggregate sum of total leads over this 7-day interval
  const total7DayLeadsSum = React.useMemo(() => {
    return last7DaysData.reduce((sum, day) => sum + day.leads, 0);
  }, [last7DaysData]);

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
        body: JSON.stringify({ campaigns: mergedCampaigns }),
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
      <div className="flex bg-slate-100 p-1.5 rounded-xl w-max border border-slate-200">
        <button
          onClick={() => setDashboardView("digital")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            dashboardView === "digital" 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          Digital Marketing
        </button>
        <button
          onClick={() => setDashboardView("portal")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            dashboardView === "portal" 
              ? "bg-white text-indigo-700 shadow-sm" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          Portals & Projects
        </button>
      </div>

      {dashboardView === "portal" ? (
        <PortalDashboard portalReports={portalReports} />
      ) : (
        <div className="space-y-6 animate-fade-in">
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
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="text-[10px] font-bold text-white hover:bg-slate-800 bg-slate-700 px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Share2 size={12} />
                Share Snapshot
              </button>
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
            </div>
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
        <button
          type="button"
          onClick={() => onNavigate?.("targets")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all text-left w-full group cursor-pointer duration-200"
          title="Click to view full Target Budget Ledger"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display group-hover:text-indigo-600 transition-colors">Target Budget</span>
            <div className="p-1 text-slate-500 group-hover:text-indigo-600 font-bold font-sans text-sm transition-colors">
              ₹
            </div>
          </div>
          <div className="mt-4 w-full">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 group-hover:text-indigo-950 transition-colors">
              {formatINR(totalBudget)}
            </h3>
            <div className="flex items-center justify-between mt-1 h-3.5">
              <span className="text-[10px] text-slate-500">Sum of current plans</span>
              <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center gap-0.5 whitespace-nowrap">
                Ledger &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Total Spend */}
        <button
          type="button"
          onClick={() => onNavigate?.("daily_spend")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all text-left w-full group cursor-pointer duration-200"
          title="Click to view detailed Day-wise Spend ledger"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display group-hover:text-indigo-600 transition-colors">Amount Spent</span>
            <div className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold font-sans group-hover:bg-indigo-100 transition-colors">
              ₹
            </div>
          </div>
          <div className="mt-4 w-full">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 group-hover:text-indigo-950 transition-colors">
              {formatINR(totalSpend)}
            </h3>
            <div className="flex items-center justify-between mt-1 h-3.5">
              <span className="text-[10px] text-indigo-700 font-medium">
                {totalBudget > 0 ? `${((totalSpend / totalBudget) * 100).toFixed(0)}% burn rate` : "0% spent"}
              </span>
              <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center gap-0.5 whitespace-nowrap">
                Spends &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Conversions */}
        <button
          type="button"
          onClick={() => onNavigate?.("performance")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all text-left w-full group cursor-pointer duration-200"
          title="Click to view ROI Campaign Performance Tracker"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display group-hover:text-indigo-600 transition-colors">Conversions</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md group-hover:bg-indigo-100 transition-colors">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-4 w-full">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 group-hover:text-indigo-950 transition-colors">
              {formatIndianNumber(totalConversions)}
            </h3>
            <div className="flex items-center justify-between mt-1 h-3.5">
              <span className="text-[10px] text-slate-500">
                Rate: <span className="font-semibold text-slate-700">{convRate.toFixed(2)}%</span>
              </span>
              <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center gap-0.5 whitespace-nowrap">
                ROI &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Average CPA */}
        <button
          type="button"
          onClick={() => onNavigate?.("performance")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all text-left w-full group cursor-pointer duration-200"
          title="Click to view detailed campaign ROI analysis"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display group-hover:text-indigo-600 transition-colors">Avg CPA</span>
            <div className="p-0.5 px-1 bg-slate-50 text-slate-600 rounded text-[11px] font-bold font-sans group-hover:bg-indigo-55 group-hover:text-indigo-700 transition-colors">
              ₹/c
            </div>
          </div>
          <div className="mt-4 w-full">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 group-hover:text-indigo-950 transition-colors">
              {formatINR(cpa)}
            </h3>
            <div className="flex items-center justify-between mt-1 h-3.5">
              <span className="text-[10px] text-slate-500">Cost/acquisition</span>
              <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center gap-0.5 whitespace-nowrap">
                Analyze &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* CTR & Clicks */}
        <button
          type="button"
          onClick={() => onNavigate?.("campaigns")}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md active:scale-[0.98] transition-all text-left w-full group cursor-pointer duration-200"
          title="Click to view digital campaign details"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase text-slate-400 font-display group-hover:text-indigo-600 transition-colors">Click CTR</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md group-hover:bg-indigo-100 transition-colors">
              <MousePointerClick size={16} />
            </div>
          </div>
          <div className="mt-4 w-full">
            <h3 className="text-lg md:text-xl font-bold font-mono text-slate-900 group-hover:text-indigo-950 transition-colors">
              {ctr.toFixed(2)}%
            </h3>
            <div className="flex items-center justify-between mt-1 h-3.5">
              <span className="text-[10px] text-slate-500">
                From <span className="font-semibold">{formatIndianNumber(totalClicks)}</span> clicks
              </span>
              <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex items-center gap-0.5 whitespace-nowrap">
                Campaigns &rarr;
              </span>
            </div>
          </div>
        </button>
      </div>

      {mergedCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <LayoutDashboard className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700 font-display">No campaigns declared yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Build your first ad campaign in the <strong>Campaigns</strong> tab to populate statistics.
          </p>
        </div>
      ) : (
        <>
          {/* Advanced Interactive Campaigns Analytics & Intelligence Centre */}
          <div className="space-y-6" id="interactive-analytics-desktop">
            {/* Top Navigation & Config Workspace bar */}
            <div className="bg-slate-900 text-white rounded-xl p-4.5 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4.5">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase text-indigo-400 tracking-wider">
                  <Flame size={12} className="text-amber-500 animate-pulse animate-bounce" />
                  Interactive Analytics & Simulation Desk
                </span>
                <p className="text-[11px] text-slate-400">
                  Select a view model below to run real-time metric evaluations or simulate budget relocation scenarios.
                </p>
              </div>

              {/* Chart Tab Navigation */}
              <div className="flex flex-wrap gap-1.5 bg-slate-8ba p-1 rounded-lg border border-slate-800/80 bg-slate-800/60 max-w-max self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAnalysisTab("channels");
                    setSimulatedBudgetChange(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeAnalysisTab === "channels"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-450 text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  📊 Channel Grouping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAnalysisTab("campaigns");
                    setSimulatedBudgetChange(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeAnalysisTab === "campaigns"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-450 text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  🏆 Campaigns Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAnalysisTab("efficiency");
                    setSimulatedBudgetChange(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeAnalysisTab === "efficiency"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-450 text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  🎯 Efficiency Map (CPA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAnalysisTab("timeSeries");
                    setSimulatedBudgetChange(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeAnalysisTab === "timeSeries"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-350 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  📈 Growth Timeline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAnalysisTab("dailySpends");
                    setSimulatedBudgetChange(0);
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    activeAnalysisTab === "dailySpends"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-350 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  📅 Day-wise Spends
                </button>
              </div>
            </div>

            {/* Dynamic Controls Drawer and Summary Stats */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4.5">
                {/* Channel-Specific toggles */}
                {activeAnalysisTab === "channels" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wide">Group By:</span>
                    <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setGroupedBy("platform")}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                          groupedBy === "platform"
                            ? "bg-white text-indigo-750 shadow-3xs"
                            : "text-slate-500 hover:text-slate-805"
                        }`}
                      >
                        Platforms
                      </button>
                      <button
                        type="button"
                        onClick={() => setGroupedBy("project")}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                          groupedBy === "project"
                            ? "bg-white text-indigo-750 shadow-3xs"
                            : "text-slate-500 hover:text-slate-805"
                        }`}
                      >
                        Projects
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary Metric selection */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wide">Primary (Bar):</span>
                  <select
                    value={primaryMetric}
                    onChange={(e) => setPrimaryMetric(e.target.value as any)}
                    className="text-[11px] font-semibold h-8 px-2.5 bg-slate-55 border border-slate-22 px-2 py-0.5 bg-slate-50 border-slate-200 rounded-lg text-slate-700 cursor-pointer outline-hidden"
                  >
                    <option value="spend">Spend (₹)</option>
                    <option value="conversions">Conversions (Leads)</option>
                    <option value="clicks">Clicks</option>
                    <option value="budget">Planned Budget (₹)</option>
                  </select>
                </div>

                {/* Secondary Metric selection */}
                {activeAnalysisTab !== "efficiency" && activeAnalysisTab !== "timeSeries" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wide">Secondary (Line):</span>
                    <select
                      value={secondaryMetric}
                      onChange={(e) => setSecondaryMetric(e.target.value as any)}
                      className="text-[11px] font-semibold h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer outline-hidden"
                    >
                      <option value="conversions">Conversions (Leads)</option>
                      <option value="clicks">Clicks</option>
                      <option value="cpa">CPA (₹ Cost/Lead)</option>
                      <option value="ctr">CTR (% Click Rate)</option>
                      <option value="none">None (Single Plot)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Micro Status Indicators */}
              <div className="text-[11px] font-medium font-mono text-slate-500 flex items-center gap-2">
                <span>Active campaigns in sandbox:</span>
                <span className="bg-indigo-50 border border-indigo-150 text-indigo-705 px-2 py-0.5 rounded font-black text-xs font-mono">
                  {filteredCampaigns.length}
                </span>
              </div>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Canvas Panel: Interactive Charts (col-span-2) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-5">
                
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-display shrink-0 flex items-center gap-1.5">
                      <span>📈 Active Analytics:</span>
                      <span className="text-indigo-650 text-indigo-600 font-extrabold normal-case font-sans">
                        {activeAnalysisTab === "channels" 
                          ? `Performance Channels grouped by ${groupedBy === "platform" ? "Ad Platform" : "Real Estate Projects"}`
                          : activeAnalysisTab === "campaigns"
                            ? `Campaign Leaderboarding Matrix (Sorted by ${getMetricLabel(primaryMetric)})`
                            : activeAnalysisTab === "efficiency"
                              ? `Efficiency quadrant distribution: leads volume vs Cost Per Lead`
                              : `Cumulative Digital Marketing Progression Timeline`
                        }
                      </span>
                    </h3>
                  </div>

                  {activeAnalysisTab !== "efficiency" && activeAnalysisTab !== "timeSeries" && (
                    <div className="flex items-center gap-3 text-[10px] font-bold font-mono">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded hover:scale-105 transition-all" style={{ backgroundColor: getMetricColor(primaryMetric) }} />
                        <span className="text-slate-600">{getMetricLabel(primaryMetric)}</span>
                      </div>
                      {secondaryMetric !== "none" && (
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full hover:scale-105 transition-all" style={{ backgroundColor: getMetricColor(secondaryMetric, true) }} />
                          <span className="text-slate-600">{getMetricLabel(secondaryMetric)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Main chart viewport container */}
                <div className={`${activeAnalysisTab === "dailySpends" ? "h-auto" : "h-80"} w-full text-xs`}>
                  {activeAnalysisTab === "dailySpends" ? (
                    // Day-wise spends grid view inside the Dashboard
                    <div className="space-y-4 animate-fade-in w-full text-slate-800">
                      {/* Inner KPI and Export Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-slate-100/60 border border-slate-200 p-4 rounded-xl">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                             Day-Wise Spend Tracker (Active Ledger)
                          </h4>
                          <p className="text-[11px] text-slate-500">Pivoted and compiled real-time spend ledger, fully reflective of project and date range filters.</p>
                        </div>
                        {pivotedDailySpends.length > 0 && (
                          <button
                            onClick={exportDashboardDailySpendsToCsv}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer w-fit self-start sm:self-auto"
                            title="Export compiled day-wise spends to CSV spreadsheet"
                          >
                            <Download size={13} />
                            Export Day-wise CSV
                          </button>
                        )}
                      </div>

                      {/* Inner KPI row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-indigo-50/20 p-4 rounded-xl border border-indigo-150/40">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Spend W/O GST</p>
                          <p className="text-sm font-extrabold text-slate-900 font-mono">₹{dailySpendsTotals.spendWithoutGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered GST (18%)</p>
                          <p className="text-sm font-semibold text-slate-600 font-mono font-medium">₹{(dailySpendsTotals.spendWithoutGst * 0.18).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Spends With GST</p>
                          <p className="text-sm font-extrabold text-indigo-700 font-mono">₹{dailySpendsTotals.spendWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg. Cost Per Lead (CPL)</p>
                          <p className="text-sm font-extrabold text-emerald-700 font-mono font-bold">₹{dailySpendsTotals.avgCpl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {pivotedDailySpends.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          <Info size={24} className="mx-auto text-slate-300 mb-1.5" />
                          <p className="font-bold text-slate-650">No day-wise spend entries match the current dashboard filters.</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Please modify selected project or date ranges in the dashboard header above.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200/50 max-h-[300px]">
                          <table className="w-full text-left text-xs border-collapse bg-white">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                                <th className="p-3">Date</th>
                                <th className="p-3">Project Wise (Col A)</th>
                                <th className="p-3 text-right bg-indigo-50/20 text-indigo-900 border-x border-slate-250/40">Spends (W/O GST)</th>
                                <th className="p-3 text-right">Leads</th>
                                <th className="p-3 text-right">CPL (W/O GST)</th>
                                <th className="p-3 text-right bg-emerald-50/10 text-emerald-850 border-l border-slate-250/40">Spends With GST (18%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {pivotedDailySpends.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/85 transition-colors">
                                  <td className="p-3 font-mono text-slate-500 font-semibold">{parseLocalDate(row.date)}</td>
                                  <td className="p-3 text-slate-900 font-bold">{row.project}</td>
                                  <td className="p-3 text-right font-mono text-indigo-700 bg-indigo-50/10 font-bold border-x border-slate-200/20">₹{row.totalSpendWithoutGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="p-3 text-right font-mono font-semibold">{row.totalLeads}</td>
                                  <td className="p-3 text-right font-mono text-emerald-650 font-bold">₹{row.cplWithoutGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="p-3 text-right font-mono text-indigo-950 font-extrabold bg-emerald-50/5 border-l border-slate-200/20">₹{row.totalSpendWithGst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : filteredCampaigns.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Info className="animate-pulse text-indigo-500" size={24} />
                      <p className="font-semibold">No active campaign metrics fit the designated date/project filters.</p>
                      <p className="text-[11px] text-slate-400">Please adjust your filters on the dashboard top header.</p>
                    </div>
                  ) : activeAnalysisTab === "channels" ? (() => {
                    // Render Tab 1: Channels
                    const groupedDataMap = filteredCampaigns.reduce((acc, c) => {
                      const key = groupedBy === "platform" ? c.platform : getProjectName(c);
                      if (!acc[key]) {
                        acc[key] = { name: key, spend: 0, conversions: 0, clicks: 0, budget: 0, impressions: 0 };
                      }
                      acc[key].spend += Number(c.spend) || 0;
                      acc[key].conversions += Number(c.conversions) || Number(c.leads) || 0;
                      acc[key].clicks += Number(c.clicks) || 0;
                      acc[key].budget += Number(c.budget) || 0;
                      acc[key].impressions += Number(c.impressions) || 0;
                      return acc;
                    }, {} as Record<string, any>);

                    const channelChartData = Object.values(groupedDataMap).map((item: any) => {
                      const cpa = item.conversions > 0 ? (item.spend / item.conversions) : 0;
                      const ctr = item.impressions > 0 ? ((item.clicks / item.impressions) * 100) : 0;
                      return {
                        ...item,
                        cpa: Math.round(cpa),
                        ctr: parseFloat(ctr.toFixed(2))
                      };
                    });

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis yAxisId="left" stroke={getMetricColor(primaryMetric)} fontSize={10} tickLine={false} />
                          {secondaryMetric !== "none" && (
                            <YAxis yAxisId="right" orientation="right" stroke={getMetricColor(secondaryMetric, true)} fontSize={10} tickLine={false} />
                          )}
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                            formatter={(value, name) => [[`${typeof value === 'number' && name.toString().includes("₹") ? "₹" : ""}${Number(value).toLocaleString("en-IN")}`], name]} 
                          />
                          <Bar 
                            yAxisId="left" 
                            dataKey={primaryMetric} 
                            name={`${getMetricLabel(primaryMetric)}`} 
                            fill={getMetricColor(primaryMetric)} 
                            radius={[6, 6, 0, 0]} 
                            className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                          />
                          {secondaryMetric !== "none" && (
                            <Line 
                              yAxisId="right" 
                              type="monotone" 
                              dataKey={secondaryMetric} 
                              name={`${getMetricLabel(secondaryMetric)}`} 
                              stroke={getMetricColor(secondaryMetric, true)} 
                              strokeWidth={2.5}
                              dot={{ r: 4, strokeWidth: 1.5, fill: "#fff" }}
                              activeDot={{ r: 6 }}
                            />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })() : activeAnalysisTab === "campaigns" ? (() => {
                    // Render Tab 2: Campaigns Leaderboard
                    const sortedCampaignsData = [...filteredCampaigns]
                      .map(c => {
                        const cpa = c.conversions > 0 ? Math.round(c.spend / c.conversions) : 0;
                        const ctr = c.impressions > 0 ? parseFloat(((c.clicks / c.impressions) * 100).toFixed(2)) : 0;
                        return {
                          id: c.id,
                          name: c.name,
                          spend: Number(c.spend) || 0,
                          conversions: Number(c.conversions) || Number(c.leads) || 0,
                          clicks: Number(c.clicks) || 0,
                          budget: Number(c.budget) || 0,
                          cpa,
                          ctr,
                        };
                      })
                      .sort((a, b) => {
                        const valA = Number(a[primaryMetric as keyof typeof a]) || 0;
                        const valB = Number(b[primaryMetric as keyof typeof b]) || 0;
                        return valB - valA;
                      })
                      .slice(0, 8);

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={sortedCampaignsData} 
                          layout="vertical" 
                          margin={{ top: 5, right: 10, left: 30, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#64748b" 
                            fontSize={9.5} 
                            width={110}
                            tickFormatter={(text) => text.length > 15 ? `${text.slice(0, 15)}...` : text}
                            tickLine={false} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                            formatter={(value) => [`${primaryMetric === 'spend' || primaryMetric === 'budget' ? '₹' : ''}${Number(value).toLocaleString("en-IN")}`, getMetricLabel(primaryMetric)]}
                          />
                          <Bar 
                            dataKey={primaryMetric} 
                            name={getMetricLabel(primaryMetric)} 
                            fill={getMetricColor(primaryMetric)} 
                            radius={[0, 5, 5, 0]}
                            onClick={(data) => {
                              if (data && data.id) setSelectedInspectorCampaignId(data.id);
                            }}
                            className="cursor-pointer transition-all hover:opacity-85"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })() : activeAnalysisTab === "efficiency" ? (() => {
                    // Render Tab 3: Efficiency Map (CPA Scatter Chart)
                    const scatterPlotData = filteredCampaigns.map(c => {
                      const cpaValue = c.conversions > 0 ? Math.round(c.spend / c.conversions) : 0;
                      return {
                        id: c.id,
                        name: c.name,
                        cpa: cpaValue,
                        conversions: Number(c.conversions) || Number(c.leads) || 0,
                        spend: Number(c.spend) || 0,
                        platform: c.platform,
                      };
                    }).filter(c => c.cpa > 0);

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis 
                            type="number" 
                            dataKey="cpa" 
                            name="Cost per Lead" 
                            unit="₹" 
                            stroke="#94a3b8" 
                            fontSize={10}
                            label={{ value: "CPA / Cost Per Lead (Lower is better)", position: "insideBottom", offset: -5, fontSize: 10, fill: "#64748b" }} 
                          />
                          <YAxis 
                            type="number" 
                            dataKey="conversions" 
                            name="Lead Volume" 
                            stroke="#94a3b8" 
                            fontSize={10}
                            label={{ value: "Conversions / Lead Count (Higher is better)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#64748b" }} 
                          />
                          <ZAxis type="number" dataKey="spend" range={[50, 400]} name="Campaign Spend" unit="₹" />
                          <Tooltip 
                            cursor={{ strokeDasharray: "3 3" }} 
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                            formatter={(value, name) => [name === "cpa" || name === "spend" ? `₹${Number(value).toLocaleString("en-IN")}` : value, name]}
                          />
                          <Scatter 
                            name="Campaigns" 
                            data={scatterPlotData} 
                            fill="#4f46e5" 
                            onClick={(node) => {
                              if (node && node.id) setSelectedInspectorCampaignId(node.id);
                            }}
                            className="cursor-pointer"
                          >
                            {scatterPlotData.map((entry, index) => {
                              // Color code node by platform
                              let cellColor = "#6366f1"; // Google default
                              if (entry.platform.includes("Meta")) cellColor = "#10b981";
                              else if (entry.platform.includes("LinkedIn")) cellColor = "#3b82f6";
                              else if (entry.platform.includes("YouTube")) cellColor = "#ef4444";
                              return <Cell key={`cell-${index}`} fill={cellColor} />;
                            })}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    );
                  })() : (() => {
                    // Render Tab 4: Cumulative Timeline
                    const sortedByDate = [...filteredCampaigns]
                      .filter(c => c.startDate)
                      .sort((a, b) => a.startDate.localeCompare(b.startDate));

                    let cumulativeSpend = 0;
                    let cumulativeLeads = 0;

                    const cumulativeData = sortedByDate.map((c, idx) => {
                      cumulativeSpend += Number(c.spend) || 0;
                      cumulativeLeads += Number(c.conversions) || Number(c.leads) || 0;
                      return {
                        dateLabel: new Date(c.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                        campaignName: c.name,
                        cumulativeSpend,
                        cumulativeLeads,
                      };
                    });

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                          <defs>
                            <linearGradient id="gradientSpend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gradientLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis yAxisId="left" stroke="#6366f1" fontSize={10} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff" }}
                            formatter={(value, name) => [name === "cumulativeSpend" ? `₹${Number(value).toLocaleString("en-IN")}` : value, name === "cumulativeSpend" ? "Cumulative Spend" : "Cumulative Leads"]}
                          />
                          <Area 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="cumulativeSpend" 
                            stroke="#6366f1" 
                            fillOpacity={1} 
                            fill="url(#gradientSpend)" 
                            name="cumulativeSpend" 
                            strokeWidth={2}
                          />
                          <Area 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="cumulativeLeads" 
                            stroke="#10b981" 
                            fillOpacity={1} 
                            fill="url(#gradientLeads)" 
                            name="cumulativeLeads" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>

                {/* Micro Action Helper Notice below chart */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-550">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                    <span>
                      {activeAnalysisTab === "campaigns" || activeAnalysisTab === "efficiency"
                        ? "💡 Interactive Action: Click on any campaign's visual marker or bar to populate the custom budget simulator on the right panel."
                        : `💡 Analysis Insight: Filter states on the primary and secondary metric selector dropdowns to change what Recharts plots inside this viewport.`
                      }
                    </span>
                  </div>

                  {activeAnalysisTab === "efficiency" && (
                    <div className="flex gap-2.5 shrink-0 text-[10px] font-bold font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Meta</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500" />LinkedIn</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500" />Google</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500" />YouTube</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Campaign Inspector + 7-Day Lead Trend (col-span-1) */}
              <div className="lg:col-span-1 flex flex-col gap-6">

                {/* 7-Day Lead Trend Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 flex items-center justify-center">
                        <TrendingUp size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-display shrink-0">
                          7-Day Lead Trend
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium font-sans">Last 7 reporting days</p>
                      </div>
                    </div>
                    {/* Tiny badge indicating aggregation project scope */}
                    <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono">
                      {selectedProject === "All" ? "All Projects" : selectedProject}
                    </span>
                  </div>

                  {/* Summary Metric Header */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/60 p-3 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-slate-400 block text-[9.5px] font-bold uppercase font-mono mb-0.5">Total Leads</span>
                      <span className="font-mono font-black text-slate-900 text-base">{total7DayLeadsSum} <span className="text-[10px] text-slate-400 font-bold normal-case font-sans">leads</span></span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px] font-bold uppercase font-mono mb-0.5">Daily Velocity</span>
                      <span className="font-mono font-black text-indigo-700 text-base">{(total7DayLeadsSum / 7).toFixed(1)} <span className="text-[10px] text-slate-400 font-medium normal-case font-sans">/ day</span></span>
                    </div>
                  </div>

                  {/* Lightweight line chart */}
                  <div className="h-32 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={last7DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="shortDate" 
                          stroke="#94a3b8" 
                          fontSize={9.5} 
                          tickLine={false} 
                          axisLine={false}
                          dy={5}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={9.5} 
                          tickLine={false} 
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                          formatter={(value) => [`${value} Leads`, "Volume"]}
                          labelFormatter={(label, activePayload) => {
                            if (activePayload && activePayload.length > 0) {
                              const rawDate = activePayload[0].payload.date;
                              return parseLocalDate(rawDate);
                            }
                            return label;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="leads" 
                          name="Total Leads" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ r: 3, strokeWidth: 1.5, fill: "#fff" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Campaign Inspector & Budget Simulator */}
                {(() => {
                const activeInspectorCampaign = filteredCampaigns.find(c => c.id === selectedInspectorCampaignId) || filteredCampaigns[0] || null;

                if (!activeInspectorCampaign) {
                  return (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed text-center flex flex-col items-center justify-center space-y-3 h-full">
                      <Compass className="text-slate-350 animate-bounce" size={32} />
                      <h4 className="font-bold text-slate-700 text-xs font-display uppercase tracking-wider">Campaign Explorer empty</h4>
                      <p className="text-[11px] text-slate-400">Launch or declare ad metrics under the "Campaign" page to start evaluating sandbox simulations.</p>
                    </div>
                  );
                }

                // Mathematical calculations for simulator forecasts
                const currentCPA = activeInspectorCampaign.conversions > 0 
                  ? (activeInspectorCampaign.spend / activeInspectorCampaign.conversions) 
                  : (totalSpend / (totalConversions || 1));
                
                const multiplier = 1 + (simulatedBudgetChange / 100);
                const simulatedSpend = activeInspectorCampaign.spend * multiplier;
                const simulatedConversions = Math.max(0, Math.round(simulatedSpend / (currentCPA || 1)));
                
                const currentCPC = activeInspectorCampaign.clicks > 0 ? (activeInspectorCampaign.spend / activeInspectorCampaign.clicks) : 0;
                const simulatedClicks = currentCPC > 0 ? Math.round(simulatedSpend / currentCPC) : 0;

                // CTR dynamic rating
                const ctrRating = activeInspectorCampaign.impressions > 0 
                  ? (activeInspectorCampaign.clicks / activeInspectorCampaign.impressions) * 100 
                  : 0;

                // Recommendation text engine
                let ratingColor = "bg-slate-50 text-slate-700 border-slate-200";
                let promptTip = "Balanced campaign efficiency. Allocate budget steadily to monitor outcomes.";

                if (currentCPA < 350) {
                  ratingColor = "bg-emerald-50 text-emerald-800 border-emerald-150";
                  promptTip = "🔥 High Efficiency Star: Cpl/Cpa is extremely low! Strongly suggest allocating maximum budget here.";
                } else if (currentCPA > 1200) {
                  ratingColor = "bg-rose-50 text-rose-800 border-rose-150";
                  promptTip = "⚠️ High Acquisition Cost: CPA indicates low conversion yields. Focus on tightening audience interests first.";
                } else if (ctrRating > 4) {
                  ratingColor = "bg-amber-50 text-amber-800 border-amber-150";
                  promptTip = "📈 Highly Engaging Ad Creative: Superb Click Rate. Relocate planned budget to capture higher lead volumes.";
                }

                // Platform logo mapping
                let logoText = "🔵";
                if (activeInspectorCampaign.platform.toLowerCase().includes("google")) logoText = "🔴";
                else if (activeInspectorCampaign.platform.toLowerCase().includes("meta")) logoText = "🟢";
                else if (activeInspectorCampaign.platform.toLowerCase().includes("linkedin")) logoText = "🔵";
                else if (activeInspectorCampaign.platform.toLowerCase().includes("youtube")) logoText = "🔺";

                return (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50/80 border border-indigo-150 px-2 py-0.5 rounded-full font-mono">
                          Campaign Diagnostics & Forecasts
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-2 truncate font-display tracking-tight" title={activeInspectorCampaign.name}>
                          {logoText} {activeInspectorCampaign.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">Project:</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 px-1.5 py-0.2 rounded font-bold transition-all">
                            {getProjectName(activeInspectorCampaign)}
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic metrics stack */}
                      <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-slate-450 block text-[9px] font-bold uppercase font-mono mb-1">Baseline Spend</span>
                          <span className="font-mono font-black text-slate-800 text-xs">{formatINR(activeInspectorCampaign.spend)}</span>
                        </div>
                        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-slate-450 block text-[9px] font-bold uppercase font-mono mb-1">CPL / CPA</span>
                          <span className="font-mono font-black text-slate-800 text-xs">{formatINR(currentCPA)}</span>
                        </div>
                        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-slate-450 block text-[9px] font-bold uppercase font-mono mb-1">CTR Rate</span>
                          <span className="font-mono font-black text-slate-800 text-xs">{ctrRating.toFixed(2)}%</span>
                        </div>
                        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-150">
                          <span className="text-slate-450 block text-[9px] font-bold uppercase font-mono mb-1">Lead Count</span>
                          <span className="font-mono font-black text-slate-800 text-xs">{(activeInspectorCampaign.conversions || activeInspectorCampaign.leads || 0)} Units</span>
                        </div>
                      </div>

                      {/* Interactive budget adjustment slider */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-450 font-mono">Relocate Budget Spending</span>
                          <span className={`text-[10.5px] font-mono px-2 py-0.5 rounded-md font-bold ${
                            simulatedBudgetChange > 0 
                              ? "bg-emerald-50 text-emerald-700" 
                              : simulatedBudgetChange < 0 
                                ? "bg-rose-50 text-rose-700" 
                                : "bg-slate-100 text-slate-700"
                          }`}>
                            {simulatedBudgetChange > 0 ? `+${simulatedBudgetChange}%` : `${simulatedBudgetChange}%`}
                          </span>
                        </div>

                        <input 
                          type="range" 
                          min="-50" 
                          max="200" 
                          step="25" 
                          value={simulatedBudgetChange} 
                          onChange={(e) => setSimulatedBudgetChange(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all"
                        />

                        {/* Slider tick guides */}
                        <div className="flex justify-between text-[8px] font-mono font-semibold text-slate-400 select-none px-0.5">
                          <span>-50%</span>
                          <span>Base</span>
                          <span>+50%</span>
                          <span>+100%</span>
                          <span>+150%</span>
                          <span>+200%</span>
                        </div>
                      </div>

                      {/* Simulation Forecast Matrix */}
                      <div className="bg-indigo-950 text-slate-100 p-4 rounded-xl border border-indigo-900 shadow-3xs space-y-3">
                        <div className="border-b border-indigo-800 pb-1.5">
                          <span className="text-[8.5px] uppercase font-mono tracking-wider font-extrabold text-indigo-300">
                            Live Predictive Simulation (Next 30D Window)
                          </span>
                        </div>

                        <div className="space-y-2 text-[11px] leading-relaxed">
                          <div className="flex justify-between border-b border-indigo-900/60 pb-1">
                            <span className="text-slate-350 font-medium">Estimated Spend:</span>
                            <span className="font-mono font-bold text-white">
                              {formatINR(Math.round(simulatedSpend))}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-900/60 pb-1">
                            <span className="text-slate-350 font-medium font-sans">Predicted Conversions:</span>
                            <span className="font-mono font-extrabold text-emerald-400 flex items-center gap-1">
                              <span>{simulatedConversions} Leads</span>
                              <span className="text-[9px] text-slate-350 font-medium italic">
                                ({simulatedConversions - (activeInspectorCampaign.conversions || 0) >= 0 ? "+" : ""}
                                {simulatedConversions - (activeInspectorCampaign.conversions || 0)})
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-350 font-medium">Predicted Clicks:</span>
                            <span className="font-mono font-bold text-white">
                              {simulatedClicks} (avg CPC: ₹{currentCPC.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Advisory Box */}
                      <div className={`p-3 rounded-lg border text-[10.5px] leading-relaxed font-sans ${ratingColor}`}>
                        <div className="flex gap-1.5 items-start">
                          <div className="shrink-0 mt-0.5 select-none">💡</div>
                          <p className="font-medium">{promptTip}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Panel */}
                    <div className="pt-3 border-t border-slate-100 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Simulated plan adopted!\nrelocated ${simulatedBudgetChange}% budget into campaign: ${activeInspectorCampaign.name}.\nThis simulation model has been successfully logged.`);
                        }}
                        className="w-full justify-center h-10 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 font-bold text-xs text-white rounded-lg shadow-sm font-sans flex items-center gap-1.5 cursor-pointer hover:shadow-md transition-all active:scale-98"
                      >
                        Adopt Simulated Relocation
                      </button>
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 my-6" />

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
                        categoryIcon = <IndianRupee size={15} className="text-emerald-600" />;
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
      )}
    </div>
  );
}
