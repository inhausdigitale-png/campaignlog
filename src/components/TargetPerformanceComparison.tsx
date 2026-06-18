import React, { useState, useMemo } from "react";
import { TargetBudgetRow, CampaignPerformance } from "../types";
import { formatINR } from "../utils/indiaHelpers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import {
  TrendingUp,
  Target,
  Coins,
  ArrowUpDown,
  Filter,
  Calendar,
  Layers,
  ArrowRightLeft,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Download,
  Flame,
  MousePointerClick,
  Users
} from "lucide-react";

interface TargetPerformanceComparisonProps {
  targets: TargetBudgetRow[];
  performances: CampaignPerformance[];
}

interface GroupSummary {
  name: string;
  targetBudget: number;
  actualSpend: number;
  budgetVariance: number;
  budgetUtil: number;
  targetLeads: number;
  achievedLeads: number;
  leadVariance: number;
  leadAchievementPct: number;
  targetCpl: number;
  achievedCpl: number;
  cplVariance: number;
  cplStatus: "Under Budget" | "Over Budget" | "Target Hit";
  // Extra campaign-level stats
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  totalSvc: number;
  totalBookings: number;
}

export default function TargetPerformanceComparison({
  targets = [],
  performances = []
}: TargetPerformanceComparisonProps) {
  
  // Date filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Project filter selection
  const [selectedProject, setSelectedProject] = useState<string>("all");
  
  // Grouping option: "project" or "medium"
  const [groupingMode, setGroupingMode] = useState<"project" | "medium">("project");
  
  // Data Source for actuals toggle: "target_ledger" (use achieved fields inside target rows) or "direct_campaigns" (use campaign upload results)
  const [actualsSource, setActualsSource] = useState<"target_ledger" | "direct_campaigns">("target_ledger");

  // Get list of unique projects across targets and performances
  const uniqueProjectsList = useMemo(() => {
    const projSet = new Set<string>();
    targets.forEach(t => { if (t.project) projSet.add(t.project); });
    performances.forEach(p => { if (p.projectName) projSet.add(p.projectName); });
    return Array.from(projSet).sort();
  }, [targets, performances]);

  // Reset filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedProject("all");
  };

  // Helper: check if a date fits range
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    const itemDate = new Date(dateStr.split("T")[0]);
    if (isNaN(itemDate.getTime())) return true;

    if (startDate) {
      const sDate = new Date(startDate);
      if (itemDate < sDate) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      if (itemDate > eDate) return false;
    }
    return true;
  };

  // Helper: check if target row (month format YYYY-MM) fits range
  const isTargetMonthInRange = (monthStr: string) => {
    if (!monthStr) return true;
    // Map YYYY-MM to middle of the month for relative comparison
    const targetDate = new Date(`${monthStr}-15`);
    if (isNaN(targetDate.getTime())) return true;

    if (startDate) {
      const sDate = new Date(startDate);
      // Compare month and year of start date
      const startCompare = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
      const targetCompare = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      if (targetCompare < startCompare) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate);
      const endCompare = new Date(eDate.getFullYear(), eDate.getMonth(), 28);
      const targetCompare = new Date(targetDate.getFullYear(), targetDate.getMonth(), 15);
      if (targetCompare > endCompare) return false;
    }
    return true;
  };

  // Process data with filtering and grouping
  const groupedData = useMemo(() => {
    const keyMap: { [key: string]: { targets: TargetBudgetRow[]; perfs: CampaignPerformance[] } } = {};

    // 1. Gather filtered target budget lines
    let filteredTargets = targets.filter(t => isTargetMonthInRange(t.month));
    if (selectedProject !== "all") {
      filteredTargets = filteredTargets.filter(t => t.project === selectedProject);
    }
    
    filteredTargets.forEach(t => {
      const groupKey = groupingMode === "project" 
        ? (t.project || "Unallocated Projects") 
        : (t.medium || "Unallocated Channels");
      
      if (!keyMap[groupKey]) {
        keyMap[groupKey] = { targets: [], perfs: [] };
      }
      keyMap[groupKey].targets.push(t);
    });

    // 2. Gather filtered campaign performances
    let filteredPerfs = performances.filter(p => isDateInRange(p.createdAt));
    if (selectedProject !== "all") {
      filteredPerfs = filteredPerfs.filter(p => p.projectName === selectedProject);
    }
    
    filteredPerfs.forEach(p => {
      // Find matching project/medium
      // Medium matching: parse channel/medium from campaigns list
      const groupKey = groupingMode === "project"
        ? (p.projectName || "Unallocated Projects")
        : (() => {
            const lowerName = p.campaignName.toLowerCase();
            if (lowerName.includes("meta") || lowerName.includes("facebook") || lowerName.includes("instagram")) return "Digital - Meta Ads";
            if (lowerName.includes("google") || lowerName.includes("search") || lowerName.includes("yt")) return "Digital - Google Ads";
            if (lowerName.includes("acres") || lowerName.includes("99acres")) return "99 Acres";
            if (lowerName.includes("magicbricks") || lowerName.includes("mb")) return "Magicbricks";
            if (lowerName.includes("housing")) return "Housing";
            return "Other Channels";
          })();

      if (!keyMap[groupKey]) {
        keyMap[groupKey] = { targets: [], perfs: [] };
      }
      keyMap[groupKey].perfs.push(p);
    });

    // 3. Aggregate each key group
    const summaries: GroupSummary[] = Object.entries(keyMap).map(([name, group]) => {
      // Targets metrics
      const targetBudget = group.targets.reduce((sum, t) => sum + t.budget, 0);
      const targetLeads = group.targets.reduce((sum, t) => sum + t.totalLeadTarget, 0);

      // Actuals metrics depend on source choice
      let actualSpend = 0;
      let achievedLeads = 0;

      if (actualsSource === "target_ledger") {
        actualSpend = group.targets.reduce((sum, t) => sum + t.spend, 0);
        achievedLeads = group.targets.reduce((sum, t) => sum + t.totalLeadAchieved, 0);
      } else {
        actualSpend = group.perfs.reduce((sum, p) => sum + p.amountSpend, 0);
        achievedLeads = group.perfs.reduce((sum, p) => sum + p.leads, 0);
      }

      // Campaign stats
      const totalClicks = group.perfs.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const totalImpressions = group.perfs.reduce((sum, p) => sum + (p.impression || 0), 0);
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const totalSvc = group.perfs.reduce((sum, p) => sum + (p.svc || 0), 0);
      const totalBookings = group.perfs.reduce((sum, p) => sum + (p.booked || 0), 0);

      // Variances & Pct
      const budgetVariance = actualSpend - targetBudget;
      const budgetUtil = targetBudget > 0 ? (actualSpend / targetBudget) * 100 : 0;
      const leadVariance = achievedLeads - targetLeads;
      const leadAchievementPct = targetLeads > 0 ? (achievedLeads / targetLeads) * 100 : 0;

      // CPL calculations
      const targetCpl = targetLeads > 0 ? (targetBudget / targetLeads) : 0;
      const achievedCpl = achievedLeads > 0 ? (actualSpend / achievedLeads) : 0;
      const cplVariance = achievedCpl - targetCpl;

      let cplStatus: GroupSummary["cplStatus"] = "Target Hit";
      if (targetCpl > 0 && achievedCpl > 0) {
        if (achievedCpl < targetCpl * 0.95) cplStatus = "Under Budget"; // Efficient
        else if (achievedCpl > targetCpl * 1.05) cplStatus = "Over Budget"; // Inefficient
      }

      return {
        name,
        targetBudget,
        actualSpend,
        budgetVariance,
        budgetUtil,
        targetLeads,
        achievedLeads,
        leadVariance,
        leadAchievementPct,
        targetCpl,
        achievedCpl,
        cplVariance,
        cplStatus,
        totalClicks,
        totalImpressions,
        avgCtr,
        totalSvc,
        totalBookings
      };
    });

    return summaries.filter(s => s.targetBudget > 0 || s.actualSpend > 0 || s.targetLeads > 0 || s.achievedLeads > 0);
  }, [targets, performances, startDate, endDate, groupingMode, actualsSource, selectedProject]);

  // Consolidate global aggregated comparison metrics
  const globalAggregates = useMemo(() => {
    const totalTargetBudget = groupedData.reduce((sum, s) => sum + s.targetBudget, 0);
    const totalActualSpend = groupedData.reduce((sum, s) => sum + s.actualSpend, 0);
    const totalTargetLeads = groupedData.reduce((sum, s) => sum + s.targetLeads, 0);
    const totalAchievedLeads = groupedData.reduce((sum, s) => sum + s.achievedLeads, 0);

    const blendedTargetCpl = totalTargetLeads > 0 ? (totalTargetBudget / totalTargetLeads) : 0;
    const blendedAchievedCpl = totalAchievedLeads > 0 ? (totalActualSpend / totalAchievedLeads) : 0;
    const cplDifferential = blendedAchievedCpl - blendedTargetCpl;
    const cplPctDiff = blendedTargetCpl > 0 ? (cplDifferential / blendedTargetCpl) * 100 : 0;

    const leadAchievementRate = totalTargetLeads > 0 ? (totalAchievedLeads / totalTargetLeads) * 100 : 0;
    const budgetUtilRate = totalTargetBudget > 0 ? (totalActualSpend / totalTargetBudget) * 100 : 0;

    const totalClicks = groupedData.reduce((sum, s) => sum + s.totalClicks, 0);
    const totalImpressions = groupedData.reduce((sum, s) => sum + s.totalImpressions, 0);
    const globalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalSvcConducted = groupedData.reduce((sum, s) => sum + s.totalSvc, 0);
    const totalBookings = groupedData.reduce((sum, s) => sum + s.totalBookings, 0);

    return {
      totalTargetBudget,
      totalActualSpend,
      totalTargetLeads,
      totalAchievedLeads,
      blendedTargetCpl,
      blendedAchievedCpl,
      cplDifferential,
      cplPctDiff,
      leadAchievementRate,
      budgetUtilRate,
      globalCtr,
      totalSvcConducted,
      totalBookings
    };
  }, [groupedData]);

  // Export as CSV
  const handleExportCSV = () => {
    const headers = [
      "Group/Name",
      "Target Budget",
      "Actual Spend",
      "Budget Variance",
      "Budget Util %",
      "Target Leads",
      "Achieved Leads",
      "Lead Variance",
      "Lead Achievement %",
      "Target CPL",
      "Achieved CPL",
      "CPL Variance",
      "CTR %",
      "Site Visits Conducted",
      "Bookings"
    ];

    const rows = groupedData.map(s => [
      s.name,
      s.targetBudget,
      s.actualSpend,
      s.budgetVariance,
      s.budgetUtil.toFixed(1),
      s.targetLeads,
      s.achievedLeads,
      s.leadVariance,
      s.leadAchievementPct.toFixed(1),
      s.targetCpl.toFixed(1),
      s.achievedCpl.toFixed(1),
      s.cplVariance.toFixed(1),
      s.avgCtr.toFixed(2),
      s.totalSvc,
      s.totalBookings
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Target_Performance_Comparison_${groupingMode}_wise.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="target-performance-comparison-panel">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 font-display flex items-center gap-2">
            <Target className="text-indigo-600" size={20} />
            Target vs Achieved Analytical Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cross-reference planned weekly target models with real campaign performance actuals
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-205 rounded-xl px-3.5 py-2.5 transition-all flex items-center gap-2 shadow-2xs cursor-pointer select-none self-start md:self-auto"
          type="button"
        >
          <Download size={13} className="text-slate-500" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Filter and settings bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Group and Source selectors */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Grouping breakdown selector */}
            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 font-display">
                Breakdown Dimension
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setGroupingMode("project")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    groupingMode === "project"
                      ? "bg-indigo-600 text-white shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={11} className="inline mr-1" />
                  Project Wise
                </button>
                <button
                  type="button"
                  onClick={() => setGroupingMode("medium")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    groupingMode === "medium"
                      ? "bg-indigo-600 text-white shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ArrowRightLeft size={11} className="inline mr-1" />
                  Medium Wise
                </button>
              </div>
            </div>

            {/* Actuals source toggle */}
            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 font-display">
                Actuals Data Origin
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActualsSource("target_ledger")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    actualsSource === "target_ledger"
                      ? "bg-white text-slate-800 border border-slate-100 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Uses actual spend & achieved numbers inputted in target week sheets"
                >
                  Target Ledger Sheet Actuals
                </button>
                <button
                  type="button"
                  onClick={() => setActualsSource("direct_campaigns")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    actualsSource === "direct_campaigns"
                      ? "bg-white text-slate-800 border border-slate-100 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Uses spend & conversions from active campaigns/media trackers"
                >
                  Active Media Tracker actuals
                </button>
              </div>
            </div>
          </div>

          {/* Date range & Project filter selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Project dropdown selector */}
            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 font-display flex items-center gap-1">
                <Target size={11} className="text-slate-400" /> Filter by Project
              </span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="p-2 pr-8 border border-slate-205 rounded-xl text-xs text-slate-700 bg-white hover:bg-slate-55 outline-hidden pl-2.5 font-bold cursor-pointer transition-all"
              >
                <option value="all">📁 All Projects (Combined)</option>
                {uniqueProjectsList.map((proj) => (
                  <option key={proj} value={proj}>
                    🏢 {proj}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 font-display flex items-center gap-1">
                <Calendar size={10} /> Start Date
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 border border-slate-205 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-55 outline-hidden pl-2.5"
              />
            </div>

            <div className="space-y-1">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400 font-display flex items-center gap-1">
                <Calendar size={10} /> End Date
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 border border-slate-205 rounded-xl text-xs text-slate-700 bg-slate-50/50 hover:bg-slate-55 outline-hidden pl-2.5"
              />
            </div>

            <div className="pt-5.5">
              {(startDate || endDate || selectedProject !== "all") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-transparent rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {groupedData.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
          <AlertTriangle className="text-amber-500 mx-auto" size={32} />
          <h3 className="font-extrabold text-slate-800 text-sm">No comparison data captured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please make sure you have initialized targets under the <strong className="text-slate-700">Weekly Target Ledger</strong> tab and uploaded real campaign data.
          </p>
        </div>
      ) : (
        <>
          {/* Aggregate KPI grid card highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5" id="target-comparison-cards">
            
            {/* KPI 1: Target Leads vs Achieved Leads */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 font-display">
                    Conversion Leads Goal
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {globalAggregates.totalAchievedLeads}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      / {globalAggregates.totalTargetLeads} Tar.
                    </span>
                  </div>
                </div>
                <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Users className="text-indigo-600" size={16} />
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-bold">
                  <span className="text-slate-450">Achievement Ratio:</span>
                  <span className={globalAggregates.leadAchievementRate >= 95 ? "text-emerald-600" : "text-amber-600"}>
                    {globalAggregates.leadAchievementRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${globalAggregates.leadAchievementRate >= 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                    style={{ width: `${Math.min(globalAggregates.leadAchievementRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 2: Target Budget vs Actual spend */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 font-display">
                    Budget Spent vs Target
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold font-mono text-slate-800">
                      {formatINR(globalAggregates.totalActualSpend)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      / {formatINR(globalAggregates.totalTargetBudget)}
                    </span>
                  </div>
                </div>
                <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Coins className="text-indigo-600" size={16} />
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-bold">
                  <span className="text-slate-450">Budget Utilization:</span>
                  <span className={globalAggregates.budgetUtilRate > 105 ? "text-rose-600" : "text-slate-700"}>
                    {globalAggregates.budgetUtilRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${globalAggregates.budgetUtilRate > 100 ? "bg-rose-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(globalAggregates.budgetUtilRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 3: Blended Target CPL vs Blended Achieved CPL */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 font-display">
                    Blended Cost Per Lead (CPL)
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-800 font-mono tracking-tight">
                      {formatINR(globalAggregates.blendedAchievedCpl)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      vs {formatINR(globalAggregates.blendedTargetCpl)}
                    </span>
                  </div>
                </div>
                <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <TrendingUp className="text-indigo-600" size={16} />
                </span>
              </div>

              <div className="space-y-1 text-[10.5px] font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-450">Variance:</span>
                  <span className={`font-mono ${globalAggregates.cplDifferential <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {globalAggregates.cplDifferential <= 0 ? "-" : "+"}{formatINR(Math.abs(globalAggregates.cplDifferential))} ({globalAggregates.cplPctDiff.toFixed(1)}%)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {globalAggregates.cplDifferential <= 0 ? "🎉 CPL is currently more efficient than target" : "⚠️ CPL is currently higher than targeted benchmark"}
                </p>
              </div>
            </div>

            {/* KPI 4: Digital Engagement CTR / Site Visits */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 font-display">
                    Engagement &amp; Site Visits
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {globalAggregates.totalSvcConducted}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      SVC ({globalAggregates.totalBookings} Booked)
                    </span>
                  </div>
                </div>
                <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <Flame className="text-indigo-600" size={16} />
                </span>
              </div>

              <div className="space-y-1 text-[10.5px] font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-450">Global Digital CTR %:</span>
                  <span className="text-indigo-600 font-mono">
                    {globalAggregates.globalCtr.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Svc-to-Booking Ratio:</span>
                  <span className="font-semibold text-slate-800">
                    {globalAggregates.totalSvcConducted > 0 ? ((globalAggregates.totalBookings / globalAggregates.totalSvcConducted) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Graphical Visuals Block */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Leads Comparison Target vs Achieved */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wide font-display block">Leads Goal Chart</span>
                <h3 className="text-xs font-extrabold text-slate-800">Target Leads vs Achieved Leads by {groupingMode === "project" ? "Project" : "Medium"}</h3>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "12px", border: "none", fontSize: "11px" }}
                      itemStyle={{ color: "#f8fafc" }}
                      labelStyle={{ fontWeight: "bold", borderBottom: "1px solid #475569", paddingBottom: "4px" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                    <Bar name="Target Leads" dataKey="targetLeads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Achieved Leads" dataKey="achievedLeads" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Budget vs Real Spend */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wide font-display block">Budget Utilization Chart</span>
                <h3 className="text-xs font-extrabold text-slate-800">Planned Target Budget vs Actual spend by {groupingMode === "project" ? "Project" : "Medium"}</h3>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupedData} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <Tooltip 
                      formatter={(v) => formatINR(Number(v))} 
                      contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "12px", border: "none", fontSize: "11px" }}
                      itemStyle={{ color: "#f8fafc" }}
                      labelStyle={{ fontWeight: "bold", borderBottom: "1px solid #475569", paddingBottom: "4px" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                    <Bar name="Target Budget" dataKey="targetBudget" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Actual Spend" dataKey="actualSpend" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: CPL Variance Comparison */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-3xs space-y-3 col-span-full">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wide font-display block">Cost Efficiency Chart</span>
                <h3 className="text-xs font-extrabold text-slate-800">Target CPL vs Real CPL Comparison</h3>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={groupedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                    <Tooltip 
                      formatter={(v) => formatINR(Number(v))} 
                      contentStyle={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: "12px", border: "none", fontSize: "11px" }}
                      itemStyle={{ color: "#f8fafc" }}
                      labelStyle={{ fontWeight: "bold", borderBottom: "1px solid #475569", paddingBottom: "4px" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                    <Line type="monotone" name="Target CPL (₹)" dataKey="targetCpl" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" name="Achieved CPL (₹)" dataKey="achievedCpl" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Master breakdown data table */}
          <div className="bg-white border border-slate-205 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-700 font-display">
                Granular Target vs Achieved Pivot Matrix ({groupingMode === "project" ? "Project-wise" : "Medium-wise"})
              </span>
              <span className="text-[10px] text-indigo-650 font-bold font-mono bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-indigo-600">
                Data View Source: {actualsSource === "target_ledger" ? "Weekly target sheets" : "Media Trackers & Campaigns"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-spacing-0 min-w-[1000px] text-xs">
                <thead>
                  <tr className="text-[10.5px] text-slate-800 font-extrabold uppercase border-b border-slate-150 bg-slate-100/70 select-none">
                    <th className="p-3 bg-slate-100/50">{groupingMode === "project" ? "Project Name" : "Channel / Medium"}</th>
                    <th className="p-3 text-right">Target Budget</th>
                    <th className="p-3 text-right">Actual Spend</th>
                    <th className="p-3 text-right">Spend Variance</th>
                    <th className="p-3 text-right">Target Leads</th>
                    <th className="p-3 text-right">Achieved Leads</th>
                    <th className="p-3 text-right">Achievement %</th>
                    <th className="p-3 text-right">Target CPL</th>
                    <th className="p-3 text-right">Achieved CPL</th>
                    <th className="p-3 text-right">CPL Gain/Loss</th>
                    <th className="p-3 text-center">CTR %</th>
                    <th className="p-3 text-center">SVC</th>
                    <th className="p-3 text-center">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {groupedData.map((s) => {
                    const achievementRatio = s.leadAchievementPct;
                    let ratioBadgeBg = "bg-rose-50 text-rose-700 border-rose-150";
                    if (achievementRatio >= 100) ratioBadgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                    else if (achievementRatio >= 85) ratioBadgeBg = "bg-amber-50 text-amber-800 border-amber-205";

                    const cplGain = s.targetCpl - s.achievedCpl;
                    let cplGainBg = "bg-slate-50 text-slate-600 border-slate-200";
                    if (s.targetCpl > 0 && s.achievedCpl > 0) {
                      if (cplGain > 0) cplGainBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      else cplGainBg = "bg-rose-50 text-rose-800 border-rose-200";
                    }

                    return (
                      <tr key={s.name} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3 font-extrabold text-slate-900 border-r border-slate-100">
                          {s.name}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {formatINR(s.targetBudget)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-800 font-bold">
                          {formatINR(s.actualSpend)}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${s.budgetVariance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {s.budgetVariance > 0 ? "+" : ""}{formatINR(s.budgetVariance)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {s.targetLeads}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-800 font-bold">
                          {s.achievedLeads}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ratioBadgeBg}`}>
                            {achievementRatio.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {formatINR(s.targetCpl)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-800 font-bold">
                          {formatINR(s.achievedCpl)}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cplGainBg}`}>
                            {cplGain >= 0 ? "+" : ""}{formatINR(cplGain)} (CPL)
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-indigo-650 font-bold">
                          {s.avgCtr > 0 ? `${s.avgCtr.toFixed(2)}%` : "-"}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800">
                          {s.totalSvc || "-"}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800">
                          {s.totalBookings || "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Totals Row */}
                  <tr className="bg-slate-50/80 font-black text-slate-900 border-t border-slate-200">
                    <td className="p-3 border-r border-slate-100">Blended Total / Avg</td>
                    <td className="p-3 text-right font-mono">
                      {formatINR(globalAggregates.totalTargetBudget)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatINR(globalAggregates.totalActualSpend)}
                    </td>
                    <td className={`p-3 text-right font-mono ${(globalAggregates.totalActualSpend - globalAggregates.totalTargetBudget) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {(globalAggregates.totalActualSpend - globalAggregates.totalTargetBudget) > 0 ? "+" : ""}{formatINR(globalAggregates.totalActualSpend - globalAggregates.totalTargetBudget)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {globalAggregates.totalTargetLeads}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {globalAggregates.totalAchievedLeads}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-3.5 py-0.5 rounded-full text-[11px] font-extrabold border ${globalAggregates.leadAchievementRate >= 95 ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"}`}>
                        {globalAggregates.leadAchievementRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {formatINR(globalAggregates.blendedTargetCpl)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatINR(globalAggregates.blendedAchievedCpl)}
                    </td>
                    <td className="p-3 text-right">
                      {globalAggregates.cplDifferential <= 0 ? (
                        <span className="px-3.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-emerald-100 text-emerald-900 border-emerald-300">
                          +{formatINR(Math.abs(globalAggregates.cplDifferential))}
                        </span>
                      ) : (
                        <span className="px-3.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-rose-100 text-rose-900 border-rose-300">
                          -{formatINR(Math.abs(globalAggregates.cplDifferential))}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-indigo-700">
                      {globalAggregates.globalCtr > 0 ? `${globalAggregates.globalCtr.toFixed(2)}%` : "-"}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {globalAggregates.totalSvcConducted || "-"}
                    </td>
                    <td className="p-3 text-center font-mono">
                      {globalAggregates.totalBookings || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
