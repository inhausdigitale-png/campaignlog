import React, { useMemo } from "react";
import { Campaign, ChangeLogEntry } from "../types";
import { formatINR, formatIndianNumber, formatIndianShort } from "../utils/indiaHelpers";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Megaphone,
  Briefcase,
  Layers,
  ChevronRight,
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart2 as BarIcon,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface CampaignDashboardViewProps {
  campaigns: Campaign[];
  changeLogs: ChangeLogEntry[];
  onApplyPlatformFilter: (platform: string) => void;
  onApplyProjectFilter: (project: string) => void;
  onApplyStatusFilter: (status: string) => void;
  onSearchCampaign: (term: string) => void;
  onAddNewCampaign: () => void;
}

export default function CampaignDashboardView({
  campaigns,
  changeLogs,
  onApplyPlatformFilter,
  onApplyProjectFilter,
  onApplyStatusFilter,
  onSearchCampaign,
  onAddNewCampaign,
}: CampaignDashboardViewProps) {
  
  // Helper to extract project name safely
  const getProjectName = (c: Campaign) => {
    if (c.objectives && c.objectives.includes("Project: ")) {
      const match = c.objectives.match(/Project:\s*([^|]+)/);
      if (match) return match[1].trim();
    }
    return "Vivaana";
  };

  // Basic Stats
  const stats = useMemo(() => {
    const totalCount = campaigns.length;
    const activeCount = campaigns.filter(c => c.status === "active").length;
    const pausedCount = campaigns.filter(c => c.status === "paused").length;
    const draftCount = campaigns.filter(c => c.status === "draft" || c.status === "completed").length;

    const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
    const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (Number(c.conversions) || Number(c.leads) || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
    const totalSvcBookings = campaigns.reduce((sum, c) => sum + (Number(c.svcBooking) || 0), 0);

    const blendedCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const blendedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const blendedConvRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

    const uniqueAdsets = new Set<string>();
    campaigns.forEach((c) => {
      if (c.adset && c.adset.trim() !== "") {
        uniqueAdsets.add(c.adset.trim());
      } else if (c.objectives && c.objectives.includes("Adset: ")) {
        const match = c.objectives.match(/Adset:\s*([^(|)]+)/);
        if (match) {
          uniqueAdsets.add(match[1].trim());
        } else {
          uniqueAdsets.add("Primary Ad Set");
        }
      } else {
        uniqueAdsets.add("Primary Ad Set");
      }
    });
    const totalAdsetsCount = campaigns.length > 0 ? uniqueAdsets.size : 0;

    return {
      totalCount,
      activeCount,
      pausedCount,
      draftCount,
      totalBudget,
      totalSpend,
      totalLeads,
      totalClicks,
      totalImpressions,
      totalSvcBookings,
      blendedCpl,
      blendedCtr,
      blendedConvRate,
      budgetUtilization,
      totalAdsetsCount,
    };
  }, [campaigns]);

  // Group by Platform
  const platformStats = useMemo(() => {
    const platforms: Record<string, {
      name: string;
      campaignCount: number;
      activeCount: number;
      totalBudget: number;
      totalSpend: number;
      totalLeads: number;
      totalClicks: number;
      totalImpressions: number;
      svcBookings: number;
      color: string;
      bgClass: string;
      borderClass: string;
      iconColor: string;
    }> = {
      "Google Ads": { name: "Google Ads", campaignCount: 0, activeCount: 0, totalBudget: 0, totalSpend: 0, totalLeads: 0, totalClicks: 0, totalImpressions: 0, svcBookings: 0, color: "#ea4335", bgClass: "bg-red-50/50 hover:bg-red-50", borderClass: "border-red-100", iconColor: "text-red-500" },
      "Meta (Facebook)": { name: "Meta (Facebook)", campaignCount: 0, activeCount: 0, totalBudget: 0, totalSpend: 0, totalLeads: 0, totalClicks: 0, totalImpressions: 0, svcBookings: 0, color: "#1877f2", bgClass: "bg-blue-50/50 hover:bg-blue-50", borderClass: "border-blue-100", iconColor: "text-blue-500" },
      "LinkedIn": { name: "LinkedIn", campaignCount: 0, activeCount: 0, totalBudget: 0, totalSpend: 0, totalLeads: 0, totalClicks: 0, totalImpressions: 0, svcBookings: 0, color: "#0077b5", bgClass: "bg-indigo-50/50 hover:bg-indigo-50", borderClass: "border-indigo-100", iconColor: "text-indigo-600" },
      "YouTube": { name: "YouTube", campaignCount: 0, activeCount: 0, totalBudget: 0, totalSpend: 0, totalLeads: 0, totalClicks: 0, totalImpressions: 0, svcBookings: 0, color: "#ff0000", bgClass: "bg-rose-50/50 hover:bg-rose-50", borderClass: "border-rose-100", iconColor: "text-rose-600" },
      "TikTok": { name: "TikTok", campaignCount: 0, activeCount: 0, totalBudget: 0, totalSpend: 0, totalLeads: 0, totalClicks: 0, totalImpressions: 0, svcBookings: 0, color: "#000000", bgClass: "bg-slate-50/70 hover:bg-slate-50", borderClass: "border-slate-200", iconColor: "text-slate-800" },
    };

    campaigns.forEach((c) => {
      const plat = platforms[c.platform] || {
        name: c.platform,
        campaignCount: 0,
        activeCount: 0,
        totalBudget: 0,
        totalSpend: 0,
        totalLeads: 0,
        totalClicks: 0,
        totalImpressions: 0,
        svcBookings: 0,
        color: "#6366f1",
        bgClass: "bg-slate-50",
        borderClass: "border-slate-200",
        iconColor: "text-indigo-500",
      };

      plat.campaignCount += 1;
      if (c.status === "active") {
        plat.activeCount += 1;
      }
      plat.totalBudget += Number(c.budget) || 0;
      plat.totalSpend += Number(c.spend) || 0;
      plat.totalLeads += Number(c.conversions) || Number(c.leads) || 0;
      plat.totalClicks += Number(c.clicks) || 0;
      plat.totalImpressions += Number(c.impressions) || 0;
      plat.svcBookings += Number(c.svcBooking) || 0;

      platforms[c.platform] = plat;
    });

    return Object.values(platforms).filter(p => p.campaignCount > 0 || p.totalSpend > 0);
  }, [campaigns]);

  // Formats performance (Static vs Video)
  const formatStats = useMemo(() => {
    let staticCount = 0;
    let staticSpend = 0;
    let staticLeads = 0;
    let staticClicks = 0;
    let videoCount = 0;
    let videoSpend = 0;
    let videoLeads = 0;
    let videoClicks = 0;

    campaigns.forEach((c) => {
      const type = c.creativeType || "static";
      const leadsVal = Number(c.conversions) || Number(c.leads) || 0;
      if (type === "video") {
        videoCount += 1;
        videoSpend += Number(c.spend) || 0;
        videoLeads += leadsVal;
        videoClicks += Number(c.clicks) || 0;
      } else {
        staticCount += 1;
        staticSpend += Number(c.spend) || 0;
        staticLeads += leadsVal;
        staticClicks += Number(c.clicks) || 0;
      }
    });

    const staticCpl = staticLeads > 0 ? staticSpend / staticLeads : 0;
    const videoCpl = videoLeads > 0 ? videoSpend / videoLeads : 0;
    const staticCtr = staticClicks > 0 ? (staticLeads / staticClicks) * 100 : 0;
    const videoCtr = videoClicks > 0 ? (videoLeads / videoClicks) * 100 : 0;

    return [
      { name: "Static Image Banner", value: staticLeads, count: staticCount, spend: staticSpend, cpl: staticCpl, ctr: staticCtr, fill: "#4f46e5" },
      { name: "Short Video Content", value: videoLeads, count: videoCount, spend: videoSpend, cpl: videoCpl, ctr: videoCtr, fill: "#06b6d4" },
    ];
  }, [campaigns]);

  // Smart Warnings / AI Sandbox Alerts
  const optimizationAlerts = useMemo(() => {
    const alerts: {
      type: "critical" | "warning" | "success" | "info";
      title: string;
      description: string;
      campaignId?: string;
      campaignName?: string;
      metricValue?: string;
      actionLabel?: string;
      actionValue?: string;
    }[] = [];

    campaigns.forEach((c) => {
      const leadsVal = Number(c.conversions) || Number(c.leads) || 0;
      const cpl = leadsVal > 0 ? c.spend / leadsVal : 0;
      const utilization = c.budget > 0 ? (c.spend / c.budget) * 100 : 0;

      // 1. High CPL Alert (Above ₹500)
      if (c.status === "active" && leadsVal > 4 && cpl > 550) {
        alerts.push({
          type: "critical",
          title: "High CPA/CPL Spike Identified",
          description: `Campaign "${c.name}" on ${c.platform} shows an elevated Cost Per Lead of ${formatINR(cpl)} (Budget ₹${c.budget.toLocaleString()}). Recommended: Scale down bid cap or refresh active creatives.`,
          campaignId: c.id,
          campaignName: c.name,
          metricValue: formatINR(cpl),
          actionLabel: "Filter Campaign",
          actionValue: c.name,
        });
      }

      // 2. Budget Exhaustion Alert
      if (c.status === "active" && utilization >= 90) {
        alerts.push({
          type: "warning",
          title: "Budget Exhaustion Approaching",
          description: `Campaign "${c.name}" has consumed ${utilization.toFixed(0)}% of its allocated ₹${c.budget.toLocaleString()} budget (Spent ₹${c.spend.toLocaleString()}). Delivery might pause soon.`,
          campaignId: c.id,
          campaignName: c.name,
          metricValue: `${utilization.toFixed(0)}% used`,
          actionLabel: "Scale Budget",
          actionValue: c.name,
        });
      }

      // 3. Zero conversions with significant spend
      if (c.status === "active" && c.spend > 4000 && leadsVal === 0) {
        alerts.push({
          type: "critical",
          title: "Zero Conversion Runaway Spend",
          description: `Campaign "${c.name}" has spent ${formatINR(c.spend)} on ${c.platform} but generated 0 leads. Inspect landing page sync, pixels, or stop the ad set.`,
          campaignId: c.id,
          campaignName: c.name,
          metricValue: "0 Leads",
          actionLabel: "Audit Adset",
          actionValue: c.name,
        });
      }

      // 4. Ultra efficient campaigns
      if (c.status === "active" && leadsVal > 15 && cpl < 250) {
        alerts.push({
          type: "success",
          title: "Top-Tier High Efficiency Performer",
          description: `Campaign "${c.name}" is operating at peak efficiency with a low CPL of ${formatINR(cpl)} and ${leadsVal} leads. Strong candidate for a budget scaling injection (+15%).`,
          campaignId: c.id,
          campaignName: c.name,
          metricValue: formatINR(cpl),
          actionLabel: "Scale Campaign",
          actionValue: c.name,
        });
      }
    });

    // Sort by type: critical first, then warning
    return alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2, success: 3 };
      return (order[a.type] ?? 99) - (order[b.type] ?? 99);
    });
  }, [campaigns]);

  // Campaign Leaderboard: Top 5 by conversions
  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .map(c => {
        const leadsVal = Number(c.conversions) || Number(c.leads) || 0;
        const cpl = leadsVal > 0 ? c.spend / leadsVal : 0;
        const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
        return { ...c, leadsVal, cpl, ctr };
      })
      .sort((a, b) => b.leadsVal - a.leadsVal)
      .slice(0, 4);
  }, [campaigns]);

  // Project Share Metrics
  const projectShareData = useMemo(() => {
    const summary: Record<string, { name: string; spend: number; leads: number }> = {};
    campaigns.forEach((c) => {
      const pName = getProjectName(c);
      if (!summary[pName]) {
        summary[pName] = { name: pName, spend: 0, leads: 0 };
      }
      summary[pName].spend += Number(c.spend) || 0;
      summary[pName].leads += Number(c.conversions) || Number(c.leads) || 0;
    });
    return Object.values(summary).sort((a, b) => b.spend - a.spend);
  }, [campaigns]);

  // Preparing data for Charts
  const chartPlatformData = useMemo(() => {
    return platformStats.map((p) => ({
      name: p.name.replace(" (Facebook)", ""),
      Spend: Math.round(p.totalSpend),
      Leads: p.totalLeads,
      CPL: p.totalLeads > 0 ? Math.round(p.totalSpend / p.totalLeads) : 0,
    }));
  }, [platformStats]);

  return (
    <div className="space-y-6 animate-fade-in" id="campaign-dashboard-tab-panel">
      
      {/* Upper Brand / Overview bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-indigo-820">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 px-2.5 border border-indigo-700 text-[10px] font-bold uppercase text-indigo-200 bg-indigo-900/60 rounded-md">
              Operational Intelligence
            </span>
            <span className="text-indigo-400">/</span>
            <span className="text-xs text-indigo-300 font-medium font-sans">Performance Overview Panel</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black tracking-tight flex items-center gap-2">
            <Megaphone className="text-indigo-400 shrink-0" size={24} />
            Performance Marketing Analytics
          </h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Consolidated insights and budget metrics across networks. Real-time cost efficiency logs, campaign leaderboard grids, and automated CPL optimizations.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={onAddNewCampaign}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Launch Campaign</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="campaign-quick-metrics">
        {/* Metric 1: Active Campaigns */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-3xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Megaphone size={18} />
            </div>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">LIVE FEED</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest select-none">Operational Status</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.activeCount}</span>
              <span className="text-xs font-semibold text-slate-500">/ {stats.totalCount} campaigns</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-50 mt-2">
              <span className="text-slate-500">Paused: <strong className="text-slate-700">{stats.pausedCount}</strong></span>
              <span className="text-slate-500">Draft/Other: <strong className="text-slate-700">{stats.draftCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Metric 2: Budget Allocated vs Spend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-3xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign size={18} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {stats.budgetUtilization.toFixed(0)}% Spends
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest select-none">Consolidated Spends</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-2xl font-black text-slate-900">{formatINR(stats.totalSpend)}</span>
              <span className="text-[10px] font-medium text-slate-400">of {formatIndianShort(stats.totalBudget)} allocated</span>
            </div>
            <div className="pt-2 mt-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, stats.budgetUtilization)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Leads & Blended CPL */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-3xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users size={18} />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
              CPL: {formatINR(stats.blendedCpl)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest select-none">Total Conversions (Leads)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">{formatIndianNumber(stats.totalLeads)}</span>
              <span className="text-xs font-medium text-slate-400">Prospect Intakes</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-50 mt-2">
              <span className="text-slate-500">Impressions: <strong className="text-slate-700 font-mono">{formatIndianShort(stats.totalImpressions)}</strong></span>
              <span className="text-slate-500">Clicks: <strong className="text-slate-700 font-mono">{formatIndianShort(stats.totalClicks)}</strong></span>
            </div>
          </div>
        </div>

        {/* Metric 4: Lead Generation Efficiency */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-3xs hover:shadow-xs transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
              <Target size={18} />
            </div>
            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full font-sans">
              CTR: {stats.blendedCtr.toFixed(2)}%
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest select-none">Conversion Efficiency</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.blendedConvRate.toFixed(2)}%</span>
              <span className="text-xs font-semibold text-slate-500">Leads / Clicks</span>
            </div>
            <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-50 mt-2">
              <span className="text-slate-500">Site Visits (SVC): <strong className="text-cyan-700 font-mono">{stats.totalSvcBookings}</strong></span>
              <span className="text-slate-400 font-mono">
                {stats.totalLeads > 0 ? ((stats.totalSvcBookings / stats.totalLeads) * 100).toFixed(0) : 0}% SVC conv
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Delivery & Format Breakdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="campaign-delivery-format-kpis">
        {/* Active Ads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group duration-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Active Campaigns</span>
            <h4 className="text-xl font-black text-slate-900 mt-1">{stats.activeCount}</h4>
            <span className="text-[9px] font-semibold flex items-center gap-1 mt-1 text-emerald-650 text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              In Delivery
            </span>
            <span className="text-[9.5px] text-slate-500 font-medium block mt-1.5">
              Across <strong className="text-slate-700 font-semibold">{stats.totalAdsetsCount}</strong> unique adsets
            </span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors shrink-0">
            <CheckCircle size={16} />
          </div>
        </div>

        {/* Inactive Ads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group duration-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Inactive Campaigns</span>
            <h4 className="text-xl font-black text-slate-900 mt-1">{stats.totalCount - stats.activeCount}</h4>
            <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              <Clock size={10} />
              Paused / Drafts
            </span>
          </div>
          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-slate-200 transition-colors">
            <Clock size={16} />
          </div>
        </div>

        {/* Static Formats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group duration-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Static Formats</span>
            <h4 className="text-xl font-black text-slate-900 mt-1">{formatStats[0]?.count || 0}</h4>
            <span className="text-[9px] text-indigo-650 font-semibold flex items-center gap-1 mt-1 text-indigo-650">
              Image Banners
            </span>
          </div>
          <div className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs font-mono group-hover:bg-indigo-100 transition-colors">
            IMG
          </div>
        </div>

        {/* Video Formats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between group duration-200">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Video Formats</span>
            <h4 className="text-xl font-black text-slate-900 mt-1">{formatStats[1]?.count || 0}</h4>
            <span className="text-[9px] text-cyan-650 font-semibold flex items-center gap-1 mt-1 text-cyan-600">
              Reels &amp; Short Clips
            </span>
          </div>
          <div className="p-1 px-2.5 bg-cyan-50 text-cyan-600 rounded-lg font-bold text-xs font-mono group-hover:bg-cyan-100 transition-colors">
            MP4
          </div>
        </div>
      </div>

      {/* Main Grid Content Area: Platform Grid on left, Optimization/AI on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Platform Network breakdown cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 uppercase tracking-wider">
                <Briefcase size={16} className="text-indigo-600" />
                <span>Performance Breakdown by Platform Network</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Network metrics distribution. Click a card to instantly filter the campaigns spreadsheet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {platformStats.map((p) => {
              const platformCpl = p.totalLeads > 0 ? p.totalSpend / p.totalLeads : 0;
              const platformCtr = p.totalImpressions > 0 ? (p.totalClicks / p.totalImpressions) * 100 : 0;
              const spendShare = stats.totalSpend > 0 ? (p.totalSpend / stats.totalSpend) * 100 : 0;

              return (
                <div
                  key={p.name}
                  onClick={() => onApplyPlatformFilter(p.name)}
                  className={`p-4 rounded-xl border border-slate-200 transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs flex flex-col justify-between ${p.bgClass} border-l-4`}
                  style={{ borderLeftColor: p.color }}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`font-bold text-sm text-slate-900 group-hover:text-indigo-900 transition-colors`}>
                          {p.name}
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">
                        {p.campaignCount} {p.campaignCount === 1 ? 'campaign' : 'campaigns'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/70 rounded-lg">
                        <span className="block text-[9px] font-extrabold uppercase text-slate-400 select-none">Total Spends</span>
                        <strong className="text-slate-900 font-mono text-xs">{formatINR(p.totalSpend)}</strong>
                      </div>
                      <div className="p-2 bg-white/70 rounded-lg">
                        <span className="block text-[9px] font-extrabold uppercase text-slate-400 select-none">Total Leads</span>
                        <strong className="text-emerald-600 font-mono text-xs">{formatIndianNumber(p.totalLeads)}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">Avg CPL</span>
                        <strong className="font-mono text-slate-800">{formatINR(platformCpl)}</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">Clicks</span>
                        <strong className="font-mono text-slate-800">{formatIndianNumber(p.totalClicks)}</strong>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">CTR</span>
                        <strong className="font-mono text-slate-800">{platformCtr.toFixed(2)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                      <div className="w-full bg-slate-200/60 rounded-full h-1 overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ backgroundColor: p.color, width: `${spendShare}%` }} />
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono shrink-0">{spendShare.toFixed(0)}% Share</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-0.5">
                      View List <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graphical Analytics (Recharts Bar Chart) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase">
                <BarIcon size={14} className="text-indigo-600" />
                <span>Spend vs. Lead Volume Efficiency Chart</span>
              </h4>
              <span className="text-[9px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">Visual Network Ratios</span>
            </div>
            
            <div className="h-64 w-full">
              {chartPlatformData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartPlatformData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", border: "none", color: "#fff" }}
                      formatter={(value: any, name: any) => {
                        if (name === "Spend") return [formatINR(value), "Total Spend"];
                        return [value, "Leads Generated"];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", pt: 10 }} />
                    <Bar yAxisId="left" dataKey="Spend" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {chartPlatformData.map((entry, index) => {
                        const colors = ["#4f46e5", "#3b82f6", "#06b6d4", "#f43f5e", "#0f172a"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                    <Bar yAxisId="right" dataKey="Leads" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No operational metrics logged. Launch a campaign to see chart data.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Smart Warnings & Campaign Sandbox Panel */}
        <div className="space-y-6">
          {/* Section: Actionable Optimization Feed */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wide">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span>Auditor Alert Feed &amp; Sandbox</span>
              </h3>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                {optimizationAlerts.length} Alerts
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {optimizationAlerts.length > 0 ? (
                optimizationAlerts.map((alert, idx) => {
                  const isCritical = alert.type === "critical";
                  const isWarning = alert.type === "warning";
                  const isSuccess = alert.type === "success";

                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                        isCritical 
                          ? "bg-rose-50/50 border-rose-100 text-rose-950" 
                          : isWarning
                            ? "bg-amber-50/40 border-amber-100 text-amber-950"
                            : isSuccess
                              ? "bg-emerald-50/30 border-emerald-100 text-emerald-950"
                              : "bg-slate-50/50 border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : isSuccess ? "bg-emerald-500" : "bg-indigo-500"
                          }`} />
                          <h4 className="text-xs font-extrabold tracking-tight">
                            {alert.title}
                          </h4>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          {alert.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          KPI: <strong className="font-bold text-slate-700">{alert.metricValue}</strong>
                        </span>
                        {alert.actionLabel && (
                          <button
                            onClick={() => {
                              if (alert.actionValue) {
                                onSearchCampaign(alert.actionValue);
                              }
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{alert.actionLabel}</span>
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle size={28} className="text-emerald-500" />
                  <div>
                    <strong className="block text-slate-700 font-bold">Healthy Campaign Matrix</strong>
                    All active networks operating within target efficiency thresholds.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Campaign Leaderboard Grid */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-950 flex items-center gap-1.5 uppercase">
                <Award size={15} className="text-indigo-600" />
                <span>Campaign Leaderboard</span>
              </h3>
              <span className="text-[9px] text-slate-400">Prospect Yield</span>
            </div>

            <div className="space-y-3">
              {topCampaigns.length > 0 ? (
                topCampaigns.map((c, idx) => {
                  const placementColors = ["bg-amber-100 text-amber-800 border-amber-200", "bg-slate-100 text-slate-800 border-slate-200", "bg-amber-50 text-amber-700 border-amber-150", "bg-indigo-50 text-indigo-700 border-indigo-100"];
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => onSearchCampaign(c.name)}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${placementColors[idx] || "bg-slate-50"}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {c.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.platform}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <strong className="block text-xs text-emerald-600 font-mono">
                          {c.leadsVal} leads
                        </strong>
                        <span className="text-[9px] text-slate-400 font-mono">
                          CPL: {formatINR(c.cpl)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">
                  No active conversion metrics available.
                </div>
              )}
            </div>
          </div>

          {/* Format Efficiency Breakdown (Static vs Video) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-3xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-950 flex items-center gap-1.5 uppercase">
                <PieIcon size={14} className="text-indigo-600" />
                <span>Format Optimization Ratios</span>
              </h3>
              <span className="text-[9px] text-slate-400">Image vs. Video</span>
            </div>

            <div className="space-y-3.5">
              {formatStats.map((item) => {
                const totalFormatLeads = formatStats.reduce((sum, i) => sum + i.value, 0);
                const leadPercent = totalFormatLeads > 0 ? (item.value / totalFormatLeads) * 105 : 0;
                
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.name}</span>
                      <strong className="text-slate-900 font-mono">{formatIndianNumber(item.value)} leads</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: item.fill, width: `${Math.min(100, leadPercent)}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                      <span>CPL: <strong className="text-slate-700 font-mono">{formatINR(item.cpl)}</strong></span>
                      <span>Total Spent: <strong className="text-slate-700 font-mono">{formatINR(item.spend)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
