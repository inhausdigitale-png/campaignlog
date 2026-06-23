import React, { useState, useMemo } from "react";
import { TargetBudgetRow, WeeklyMetric, UserRolePermission } from "../types";
import { formatINR } from "../utils/indiaHelpers";
import { Plus, Trash2, Calendar, Coins, TrendingUp, CheckSquare, Edit, Save, ArrowLeftRight, Percent, Filter, Layers } from "lucide-react";

interface TargetBudgetLedgerProps {
  targets: TargetBudgetRow[];
  onSaveTarget: (row: TargetBudgetRow) => Promise<void>;
  onDeleteTarget: (id: string) => Promise<void>;
  rolePermission?: UserRolePermission;
}

export default function TargetBudgetLedger({
  targets,
  onSaveTarget,
  onDeleteTarget,
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
}: TargetBudgetLedgerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importCsvText, setImportCsvText] = useState("");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetBudgetRow | null>(null);

  // Form states for creating a new row
  const [month, setMonth] = useState("2026-06");
  const [project, setProject] = useState("Skyline Residency");
  const [medium, setMedium] = useState("Digital - Meta Ads");
  const [budget, setBudget] = useState(10000);
  const [totalLeadTarget, setTotalLeadTarget] = useState(300);
  const [digitalLeadTarget, setDigitalLeadTarget] = useState(250);
  const [btlLeadTarget, setBtlLeadTarget] = useState(50);
  const [targetSvc, setTargetSvc] = useState(60);
  const [targetAllocation, setTargetAllocation] = useState(80);
  const [targetBooking, setTargetBooking] = useState(8);
  const [targetSpendAmount, setTargetSpendAmount] = useState(10000);

  // Editing week values
  const [editWeekIdx, setEditWeekIdx] = useState<"week1" | "week2" | "week3" | "week4" | "week5" | null>(null);
  const [weekSpend, setWeekSpend] = useState(0);
  const [weekTotalLeads, setWeekTotalLeads] = useState(0);
  const [weekDigitalLeads, setWeekDigitalLeads] = useState(0);
  const [weekBtlLeads, setWeekBtlLeads] = useState(0);
  const [weekAllocation, setWeekAllocation] = useState(0);
  const [weekSiteVisit, setWeekSiteVisit] = useState(0);
  const [weekBooking, setWeekBooking] = useState(0);

  const loadImportTemplate = () => {
    const template = `Month,Project Name,Channel,Planned Budget ($),Total Leads Goal,Digital Target,BTL Target
2026-06,Skyline Residency,Digital - Meta Ads,10000,300,250,50
2026-06,Solar Expansion,Google Search Ads,12000,400,320,80
2026-06,Eco Villas,LinkedIn Sponsor Content,8000,150,150,0`;
    setImportCsvText(template);
    setImportFeedback("Template preloaded! Click 'Parse and Import' below.");
  };

  const handleBulkImportLedger = async () => {
    if (!importCsvText.trim()) {
      setImportFeedback("Error: Please provide CSV data or click 'Load Template'.");
      return;
    }

    try {
      const lines = importCsvText.trim().split("\n");
      if (lines.length < 2) {
        setImportFeedback("Error: CSV must contain at least a header and 1 row.");
        return;
      }

      // Read headers and match lowercased, spaces and symbols removed
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
      const idxMonth = headers.findIndex(h => h === "month" || h === "targetmonth");
      const idxProj = headers.findIndex(h => h === "projectname" || h === "project");
      const idxChannel = headers.findIndex(h => h === "channel" || h === "medium" || h === "advertisingchannel" || h === "advertisingmedium");
      const idxBudget = headers.findIndex(h => h === "plannedbudget" || h === "budget");
      const idxTotalGoal = headers.findIndex(h => h === "totalleadsgoal" || h === "totalleadgoal" || h === "leadtarget" || h === "totalleadtarget");
      const idxDigitalGoal = headers.findIndex(h => h === "digitaltarget" || h === "digitalleadtarget");
      const idxBtlGoal = headers.findIndex(h => h === "btltarget" || h === "btlleadtarget");
      const idxTargetSvc = headers.findIndex(h => h === "targetsvc" || h === "svcgoal" || h === "svctarget" || h === "sitevisittarget");
      const idxTargetAllocation = headers.findIndex(h => h === "targetallocation" || h === "allocationtarget" || h === "leadallocationtarget");
      const idxTargetBooking = headers.findIndex(h => h === "targetbooking" || h === "bookingtarget" || h === "bookingsgoal");
      const idxTargetSpendAmount = headers.findIndex(h => h === "targetspendamount" || h === "targetspend" || h === "spendtarget" || h === "spendamounttarget");

      const emptyMetric = (): WeeklyMetric => ({
        spend: 0,
        totalLeadAchieved: 0,
        digitalLeadAchieved: 0,
        btlLeadAchieved: 0,
        leadAllocation: 0,
        siteVisit: 0,
        booking: 0,
      });

      let importCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
        if (cells.length === 0) continue;

        const rowMonth = idxMonth !== -1 && cells[idxMonth] ? cells[idxMonth] : "2026-06";
        const rowProj = idxProj !== -1 && cells[idxProj] ? cells[idxProj] : "Untitled Project";
        const rowMedium = idxChannel !== -1 && cells[idxChannel] ? cells[idxChannel] : "Digital Channel";
        const rowBudget = idxBudget !== -1 && cells[idxBudget] ? (parseInt(cells[idxBudget]) || 0) : 0;
        const rowTotalGoal = idxTotalGoal !== -1 && cells[idxTotalGoal] ? (parseInt(cells[idxTotalGoal]) || 0) : 0;
        const rowDigitalGoal = idxDigitalGoal !== -1 && cells[idxDigitalGoal] ? (parseInt(cells[idxDigitalGoal]) || 0) : 0;
        const rowBtlGoal = idxBtlGoal !== -1 && cells[idxBtlGoal] ? (parseInt(cells[idxBtlGoal]) || 0) : 0;
        const rowTargetSvc = idxTargetSvc !== -1 && cells[idxTargetSvc] ? (parseInt(cells[idxTargetSvc]) || 0) : 60;
        const rowTargetAllocation = idxTargetAllocation !== -1 && cells[idxTargetAllocation] ? (parseInt(cells[idxTargetAllocation]) || 0) : 80;
        const rowTargetBooking = idxTargetBooking !== -1 && cells[idxTargetBooking] ? (parseInt(cells[idxTargetBooking]) || 0) : 8;
        const rowTargetSpendAmount = idxTargetSpendAmount !== -1 && cells[idxTargetSpendAmount] ? (parseInt(cells[idxTargetSpendAmount]) || 0) : rowBudget;

        const newTarget: TargetBudgetRow = {
          id: "rep-tg-" + Math.random().toString(36).substring(2, 9),
          month: rowMonth,
          project: rowProj,
          medium: rowMedium,
          budget: rowBudget,
          spend: 0,
          totalLeadTarget: rowTotalGoal,
          totalLeadAchieved: 0,
          digitalLeadTarget: rowDigitalGoal,
          digitalLeadAchieved: 0,
          btlLeadTarget: rowBtlGoal,
          btlLeadAchieved: 0,
          leadAllocation: 0,
          siteVisit: 0,
          booking: 0,
          week1: emptyMetric(),
          week2: emptyMetric(),
          week3: emptyMetric(),
          week4: emptyMetric(),
          week5: emptyMetric(),
          createdAt: new Date().toISOString(),
          targetSvc: rowTargetSvc,
          targetAllocation: rowTargetAllocation,
          targetBooking: rowTargetBooking,
          targetSpendAmount: rowTargetSpendAmount,
        };

        await onSaveTarget(newTarget);
        importCount++;
      }

      setImportFeedback(`Successfully imported ${importCount} target budget rows and configured Ledger plans!`);
      setImportCsvText("");
      setTimeout(() => {
        setShowBulkImport(false);
        setImportFeedback(null);
      }, 2500);

    } catch (e) {
      console.error(e);
      setImportFeedback("Error: Failed parsing CSV file format. Ensure numeric fields are typed correctly.");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emptyMetric = (): WeeklyMetric => ({
      spend: 0,
      totalLeadAchieved: 0,
      digitalLeadAchieved: 0,
      btlLeadAchieved: 0,
      leadAllocation: 0,
      siteVisit: 0,
      booking: 0,
    });

    const newTarget: TargetBudgetRow = {
      id: "temp-" + Date.now(),
      month,
      project,
      medium,
      budget: Number(budget),
      spend: 0, // initially zero, compiled from weeks
      totalLeadTarget: Number(totalLeadTarget),
      totalLeadAchieved: 0,
      digitalLeadTarget: Number(digitalLeadTarget),
      digitalLeadAchieved: 0,
      btlLeadTarget: Number(btlLeadTarget),
      btlLeadAchieved: 0,
      leadAllocation: 0,
      siteVisit: 0,
      booking: 0,
      week1: emptyMetric(),
      week2: emptyMetric(),
      week3: emptyMetric(),
      week4: emptyMetric(),
      week5: emptyMetric(),
      createdAt: new Date().toISOString(),
      targetSvc: Number(targetSvc),
      targetAllocation: Number(targetAllocation),
      targetBooking: Number(targetBooking),
      targetSpendAmount: Number(targetSpendAmount) || Number(budget),
    };

    await onSaveTarget(newTarget);
    setShowAddForm(false);
  };

  const startEditWeek = (weekName: "week1" | "week2" | "week3" | "week4" | "week5", data: WeeklyMetric) => {
    setEditWeekIdx(weekName);
    setWeekSpend(data.spend);
    setWeekTotalLeads(data.totalLeadAchieved);
    setWeekDigitalLeads(data.digitalLeadAchieved);
    setWeekBtlLeads(data.btlLeadAchieved);
    setWeekAllocation(data.leadAllocation);
    setWeekSiteVisit(data.siteVisit);
    setWeekBooking(data.booking);
  };

  const saveWeekEdit = async () => {
    if (!selectedTarget || !editWeekIdx) return;

    const updatedWeek: WeeklyMetric = {
      spend: Number(weekSpend),
      totalLeadAchieved: Number(weekTotalLeads),
      digitalLeadAchieved: Number(weekDigitalLeads),
      btlLeadAchieved: Number(weekBtlLeads),
      leadAllocation: Number(weekAllocation),
      siteVisit: Number(weekSiteVisit),
      booking: Number(weekBooking),
    };

    const targetDoc = { ...selectedTarget, [editWeekIdx]: updatedWeek };

    // Automatically recalculate top-level actuals from the 5 weeks
    const weeksList: WeeklyMetric[] = [targetDoc.week1, targetDoc.week2, targetDoc.week3, targetDoc.week4, targetDoc.week5];
    targetDoc.spend = weeksList.reduce((sum, w) => sum + w.spend, 0);
    targetDoc.totalLeadAchieved = weeksList.reduce((sum, w) => sum + w.totalLeadAchieved, 0);
    targetDoc.digitalLeadAchieved = weeksList.reduce((sum, w) => sum + w.digitalLeadAchieved, 0);
    targetDoc.btlLeadAchieved = weeksList.reduce((sum, w) => sum + w.btlLeadAchieved, 0);
    targetDoc.leadAllocation = weeksList.reduce((sum, w) => sum + w.leadAllocation, 0);
    targetDoc.siteVisit = weeksList.reduce((sum, w) => sum + w.siteVisit, 0);
    targetDoc.booking = weeksList.reduce((sum, w) => sum + w.booking, 0);

    await onSaveTarget(targetDoc);
    setSelectedTarget(targetDoc); // update active selection context
    setEditWeekIdx(null);
  };

  // Filters state
  const [filterProject, setFilterProject] = useState("all");
  const [filterMedium, setFilterMedium] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  
  // Grouping state: "all" (Default List), "project" (Project-wise Grouping), "medium" (Medium-wise Grouping)
  const [viewGrouping, setViewGrouping] = useState<"all" | "project" | "medium">("all");

  // Get list of unique options for select fields
  const uniqueProjectsList = useMemo(() => {
    return Array.from(new Set(targets.map(t => t.project).filter(Boolean))).sort();
  }, [targets]);

  const uniqueMediumsList = useMemo(() => {
    return Array.from(new Set(targets.map(t => t.medium).filter(Boolean))).sort();
  }, [targets]);

  const uniqueMonthsList = useMemo(() => {
    return Array.from(new Set(targets.map(t => t.month).filter(Boolean))).sort().reverse();
  }, [targets]);

  // Apply filters
  const filteredTargets = useMemo(() => {
    return targets.filter(t => {
      if (filterProject !== "all" && t.project !== filterProject) return false;
      if (filterMedium !== "all" && t.medium !== filterMedium) return false;
      if (filterMonth !== "all" && t.month !== filterMonth) return false;
      return true;
    });
  }, [targets, filterProject, filterMedium, filterMonth]);

  // Group by Project Name
  const projectGroupsObj = useMemo(() => {
    const groups: { [key: string]: TargetBudgetRow[] } = {};
    filteredTargets.forEach(t => {
      const proj = t.project || "Unallocated / Other Projects";
      if (!groups[proj]) groups[proj] = [];
      groups[proj].push(t);
    });
    return groups;
  }, [filteredTargets]);

  // Group by Medium Name
  const mediumGroupsObj = useMemo(() => {
    const groups: { [key: string]: TargetBudgetRow[] } = {};
    filteredTargets.forEach(t => {
      const med = t.medium || "Unallocated / Other Mediums";
      if (!groups[med]) groups[med] = [];
      groups[med].push(t);
    });
    return groups;
  }, [filteredTargets]);

  // Top list aggregations (based on filtered selection so counters respond dynamically)
  const totalBudget = filteredTargets.reduce((sum, t) => sum + t.budget, 0);
  const totalSpend = filteredTargets.reduce((sum, t) => sum + t.spend, 0);
  const totalLeadsTargeted = filteredTargets.reduce((sum, t) => sum + t.totalLeadTarget, 0);
  const totalLeadsAchieved = filteredTargets.reduce((sum, t) => sum + t.totalLeadAchieved, 0);
  const totalBookings = filteredTargets.reduce((sum, t) => sum + t.booking, 0);

  // New Custom Targets dynamic aggregations
  const totalTargetBookingGoal = filteredTargets.reduce((sum, t) => sum + (t.targetBooking ?? 8), 0);
  const totalTargetSvcGoal = filteredTargets.reduce((sum, t) => sum + (t.targetSvc ?? 60), 0);
  const actualSvcConducted = filteredTargets.reduce((sum, t) => sum + (t.siteVisit || 0), 0);
  const totalTargetAllocationGoal = filteredTargets.reduce((sum, t) => sum + (t.targetAllocation ?? 80), 0);
  const actualLeadAllocation = filteredTargets.reduce((sum, t) => sum + (t.leadAllocation || 0), 0);
  const totalTargetSpendAmountGoal = filteredTargets.reduce((sum, t) => sum + (t.targetSpendAmount || t.budget), 0);

  return (
    <div className="space-y-6" id="target-budget-ledger-panel">
      {/* Dynamic Summary counters banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="ledger-stat-budget">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Spend Goal</span>
            <span className="text-xl font-bold text-slate-800 font-mono">{formatINR(totalTargetSpendAmountGoal)}</span>
          </div>
          <span className="text-[10px] text-indigo-650 font-bold mt-2 flex items-center gap-1">
            <Coins size={11} /> Budget Goal limit: {formatINR(totalBudget)}
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="ledger-stat-spend">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Actual Spend</span>
            <span className="text-xl font-bold text-slate-800 font-mono">{formatINR(totalSpend)}</span>
          </div>
          <span className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${totalSpend > totalTargetSpendAmountGoal ? "text-rose-600" : "text-slate-500"}`}>
            <Coins size={11} /> {totalTargetSpendAmountGoal > 0 ? ((totalSpend / totalTargetSpendAmountGoal) * 100).toFixed(0) + "% limit util" : "0% limit util"}
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="ledger-stat-avg-leads">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 font-display">Target / Alloc Goals</span>
            <span className="text-xl font-bold text-slate-800 tracking-tight">{totalLeadsTargeted} / {totalTargetAllocationGoal}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-2">
            Alloc: {actualLeadAllocation} done
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="ledger-stat-leads-achieved">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Visits (SVC) / Goals</span>
            <span className={`text-xl font-bold tracking-tight ${actualSvcConducted >= totalTargetSvcGoal ? "text-emerald-700" : "text-amber-700"}`}>
              {actualSvcConducted} / {totalTargetSvcGoal}
            </span>
          </div>
          <span className="text-[10px] text-teal-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={11} /> {totalTargetSvcGoal > 0 ? ((actualSvcConducted / totalTargetSvcGoal) * 100).toFixed(0) + "% SVC achieved" : "0% SVC achieved"}
          </span>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:col-span-1 col-span-2 justify-between" id="ledger-stat-bookings">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 font-display">Bookings actual / goals</span>
            <span className="text-xl font-bold text-slate-800 font-mono">{totalBookings} / {totalTargetBookingGoal}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 font-semibold">CPL actual list index: ₹{totalLeadsAchieved > 0 ? (totalSpend / totalLeadsAchieved).toFixed(1) : "0.0"}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Monthly rows main ledger lists */}
        <div className="flex-1 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 font-display">Monthly Plans & Spent Ledger</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!rolePermission.canManageTargets) {
                    alert("Permission Denied: Your simulated security role restricts adding or importing goals.");
                    return;
                  }
                  setShowBulkImport(!showBulkImport);
                  setShowAddForm(false);
                  setSelectedTarget(null);
                }}
                className={`px-3 py-1.5 border font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all ${
                  rolePermission.canManageTargets
                    ? "border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    : "border-slate-100 text-slate-350 bg-slate-50 cursor-not-allowed"
                }`}
                id="btn-bulk-import-ledger"
                disabled={!rolePermission.canManageTargets}
              >
                <span>Bulk CSV Import</span>
              </button>
              <button
                onClick={() => {
                  if (!rolePermission.canManageTargets) {
                    alert("Permission Denied: Your simulated security role restricts campaign target settings.");
                    return;
                  }
                  setShowAddForm(!showAddForm);
                  setShowBulkImport(false);
                  setSelectedTarget(null);
                }}
                className={`px-3 py-1.5 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all font-display ${
                  rolePermission.canManageTargets
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
                id="btn-add-budget-plan"
                disabled={!rolePermission.canManageTargets}
              >
                <Plus size={12} />
                <span>Configure Target</span>
              </button>
            </div>
          </div>

          {/* Grouping Selectors & Filters */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-extrabold text-[10px] uppercase text-slate-400 font-display mr-1">Group View:</span>
              <button
                type="button"
                onClick={() => setViewGrouping("all")}
                className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                  viewGrouping === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Flat List ({filteredTargets.length})
              </button>
              <button
                type="button"
                onClick={() => setViewGrouping("project")}
                className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                  viewGrouping === "project"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Project Wise ({Object.keys(projectGroupsObj).length})
              </button>
              <button
                type="button"
                onClick={() => setViewGrouping("medium")}
                className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                  viewGrouping === "medium"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Medium Wise ({Object.keys(mediumGroupsObj).length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-[10px] uppercase text-slate-400 font-display flex items-center gap-1">
                <Filter size={11} /> Filters:
              </span>
              
              {/* Project Filter */}
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="p-1 px-1.5 border border-slate-200 bg-white rounded-md text-slate-700 font-medium outline-hidden"
              >
                <option value="all">All Projects</option>
                {uniqueProjectsList.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* Medium Filter */}
              <select
                value={filterMedium}
                onChange={(e) => setFilterMedium(e.target.value)}
                className="p-1 px-1.5 border border-slate-200 bg-white rounded-md text-slate-700 font-medium outline-hidden"
              >
                <option value="all">All Mediums</option>
                {uniqueMediumsList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="p-1 px-1.5 border border-slate-200 bg-white rounded-md text-slate-700 font-medium outline-hidden"
              >
                <option value="all">All Months</option>
                {uniqueMonthsList.map(mo => (
                  <option key={mo} value={mo}>{mo}</option>
                ))}
              </select>
            </div>
          </div>

          {showBulkImport && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5 animate-fade-in text-xs col-span-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-extrabold uppercase tracking-wider text-slate-700">Bulk CSV/TSV Ledger Importer</span>
                <button
                  type="button"
                  onClick={loadImportTemplate}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-bold transition-all text-[10px]"
                >
                  Load Sample Template
                </button>
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Paste comma-separated rows of your monthly ledger targets below. The importer dynamically matches headers: <strong>Month</strong>, <strong>Project Name</strong>, <strong>Channel</strong>, <strong>Planned Budget ($)</strong>, <strong>Total Leads Goal</strong>, <strong>Digital Target</strong>, <strong>BTL Target</strong>.
              </p>

              <textarea
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="Month,Project Name,Channel,Planned Budget ($),Total Leads Goal,Digital Target,BTL Target..."
                className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-[10px] focus:outline-indigo-600 focus:bg-white"
              />

              {importFeedback && (
                <div className={`p-2.5 rounded-lg border text-[11px] font-semibold ${importFeedback.startsWith("Error") ? "bg-rose-50 text-rose-800 border-rose-100" : "bg-emerald-50 text-emerald-800 border-emerald-100"}`}>
                  {importFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportLedger}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-all"
                >
                  Parse &amp; Import Targets
                </button>
              </div>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in" id="add-target-budget-form">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Coins className="text-indigo-600" size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">Establish Target Blueprint</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block text-slate-500 mb-1">Target Month</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Skyline Residency"
                    required
                    list="existing-projects"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                  <datalist id="existing-projects">
                    {uniqueProjectsList.map(proj => <option key={proj} value={proj} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Channel / Medium</label>
                  <input
                    type="text"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    placeholder="Digital - Meta Ads"
                    required
                    list="existing-mediums"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                  <datalist id="existing-mediums">
                    {uniqueMediumsList.map(med => <option key={med} value={med} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block text-slate-500 mb-1">Planned Budget (INR - ₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setBudget(val);
                      setTargetSpendAmount(val);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Total Leads Goal</label>
                  <input
                    type="number"
                    min="0"
                    value={totalLeadTarget}
                    onChange={(e) => setTotalLeadTarget(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Digital Target (subset)</label>
                  <input
                    type="number"
                    min="0"
                    value={digitalLeadTarget}
                    onChange={(e) => setDigitalLeadTarget(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">BTL Target (subset)</label>
                  <input
                    type="number"
                    min="0"
                    value={btlLeadTarget}
                    onChange={(e) => setBtlLeadTarget(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                  />
                </div>
              </div>

              {/* Explicit TARGET SVC, TARGET ALLOCATION, TARGET BOOKINGS, TARGET SPEND AMOUNT row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3 mt-1">
                <div>
                  <label className="block text-slate-500 mb-1">Target SVC (Site Visits)</label>
                  <input
                    type="number"
                    min="0"
                    value={targetSvc}
                    onChange={(e) => setTargetSvc(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border-slate-200 rounded-lg text-slate-800 outline-hidden bg-indigo-50/20"
                    placeholder="e.g. 60"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Allocation</label>
                  <input
                    type="number"
                    min="0"
                    value={targetAllocation}
                    onChange={(e) => setTargetAllocation(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border-slate-200 rounded-lg text-slate-800 outline-hidden bg-indigo-50/20"
                    placeholder="e.g. 80"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Bookings</label>
                  <input
                    type="number"
                    min="0"
                    value={targetBooking}
                    onChange={(e) => setTargetBooking(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border-slate-200 rounded-lg text-slate-800 outline-hidden bg-indigo-50/20"
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Spend Amount (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={targetSpendAmount}
                    onChange={(e) => setTargetSpendAmount(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border-slate-200 rounded-lg text-slate-800 outline-hidden bg-indigo-50/20"
                    placeholder="e.g. 10000"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                Establishing the blueprint creates five blank sub-ledger weeks which automatically summarize the actual spend, leads, and SVC bookings.
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold border border-slate-200 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs text-xs cursor-pointer"
                >
                  Generate Plan Record
                </button>
              </div>
            </form>
          )}

          {/* Master rows lists */}
          <div className="space-y-4" id="budget-targets-sheets-list">
            {filteredTargets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-450 text-xs font-semibold">
                No matching target models found for selected filters. (Try resetting month, project, or medium)
              </div>
            ) : viewGrouping === "all" ? (
              // 1. Flat list of filtered targets
              <div className="space-y-3">
                {filteredTargets.map((t) => {
                  const isSelected = selectedTarget?.id === t.id;
                  const spendPct = t.budget > 0 ? Math.round((t.spend / t.budget) * 100) : 0;
                  const leadPct = t.totalLeadTarget > 0 ? Math.round((t.totalLeadAchieved / t.totalLeadTarget) * 105) / 105 : 0;
                  const leadPctDisplay = t.totalLeadTarget > 0 ? Math.round((t.totalLeadAchieved / t.totalLeadTarget) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      className={`bg-white border p-4.5 rounded-xl shadow-xs transition-all flex flex-col gap-3 hover:border-slate-350 cursor-pointer ${
                        isSelected ? "ring-2 ring-indigo-600 border-indigo-200" : "border-slate-200"
                      }`}
                      onClick={() => {
                        setSelectedTarget(t);
                        setEditWeekIdx(null);
                      }}
                      id={`target-row-card-${t.id}`}
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1 text-[10px] font-bold bg-slate-100 text-slate-655 border border-slate-205 rounded font-mono">
                              {t.month}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{t.project}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <ArrowLeftRight size={10} className="text-slate-400" /> {t.medium}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Budget Spent ({spendPct}%)</span>
                              <span className="font-mono text-slate-705">{formatINR(t.spend)} / {formatINR(t.budget)}</span>
                            </div>
                            <div className="w-40 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${spendPct > 100 ? "bg-rose-500" : "bg-indigo-600"}`}
                                style={{ width: `${Math.min(spendPct, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Target Leads ({leadPctDisplay}%)</span>
                              <span className="font-mono text-slate-750">{t.totalLeadAchieved} / {t.totalLeadTarget}</span>
                            </div>
                            <div className="w-40 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${leadPctDisplay >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ width: `${Math.min(leadPctDisplay, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="hidden md:flex flex-col items-center justify-center pr-2">
                            {rolePermission.canDeleteTargets ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTarget(t.id);
                                  if (selectedTarget?.id === t.id) {
                                    setSelectedTarget(null);
                                  }
                                }}
                                className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer text-slate-400"
                                title="Erase targeted ledger row"
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-1 text-slate-200 cursor-not-allowed"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Site Visits, Allocation, Booking, Spend Goals display block */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11px] mt-1">
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Site Visits (SVC)</span>
                          <span className="font-bold text-slate-800">
                            {t.siteVisit} <span className="font-medium text-slate-400">/ Goal: {t.targetSvc ?? 60}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Lead Allocation</span>
                          <span className="font-bold text-slate-800">
                            {t.leadAllocation} <span className="font-medium text-slate-400">/ Goal: {t.targetAllocation ?? 80}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Bookings Goal</span>
                          <span className="font-bold text-slate-800">
                            {t.booking} <span className="font-medium text-slate-400">/ Goal: {t.targetBooking ?? 8}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Target Spend Amount</span>
                          <span className="font-bold text-slate-800">
                            {formatINR(t.spend)} <span className="font-medium text-slate-400">/ Goal: {formatINR(t.targetSpendAmount || t.budget)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : viewGrouping === "project" ? (
              // 2. Project Wise Grouping View
              <div className="space-y-6">
                {(Object.entries(projectGroupsObj) as [string, TargetBudgetRow[]][]).map(([projectName, groupRows]) => {
                  const projBudget = groupRows.reduce((s, r) => s + r.budget, 0);
                  const projSpend = groupRows.reduce((s, r) => s + r.spend, 0);
                  const projLeadsTarget = groupRows.reduce((s, r) => s + r.totalLeadTarget, 0);
                  const projLeadsAchieved = groupRows.reduce((s, r) => s + r.totalLeadAchieved, 0);

                  const spendPct = projBudget > 0 ? Math.round((projSpend / projBudget) * 100) : 0;
                  const leadPct = projLeadsTarget > 0 ? Math.round((projLeadsAchieved / projLeadsTarget) * 100) : 0;

                  return (
                    <div key={projectName} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                      {/* Project Consolidated Summary Head */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-indigo-600 block tracking-wider font-display">PROJECT</span>
                          <h3 className="text-xs font-extrabold text-slate-800">{projectName}</h3>
                          <span className="text-[10px] text-slate-500 font-semibold font-mono">{groupRows.length} Channel Medium Target(s)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase">Project Budget Util</span>
                            <span className="font-mono text-slate-700">{formatINR(projSpend)} / {formatINR(projBudget)} ({spendPct}%)</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase">Project Leads Goal</span>
                            <span className="font-mono text-slate-700">{projLeadsAchieved} / {projLeadsTarget} ({leadPct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Channels under this project */}
                      <div className="space-y-2">
                        {groupRows.map((t) => {
                          const isSelected = selectedTarget?.id === t.id;
                          const tSpendPct = t.budget > 0 ? Math.round((t.spend / t.budget) * 100) : 0;
                          const tLeadPct = t.totalLeadTarget > 0 ? Math.round((t.totalLeadAchieved / t.totalLeadTarget) * 100) : 0;

                          return (
                            <div
                              key={t.id}
                              className={`bg-white border p-3 rounded-lg shadow-2xs transition-all flex flex-col gap-2 hover:border-slate-350 cursor-pointer ${
                                isSelected ? "ring-2 ring-indigo-600 border-indigo-205 bg-indigo-50/10" : "border-slate-150"
                              }`}
                              onClick={() => {
                                setSelectedTarget(t);
                                setEditWeekIdx(null);
                              }}
                            >
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="p-0.5 px-1 text-[9px] font-bold bg-slate-100 text-slate-655 border border-slate-205 rounded font-mono">
                                      {t.month}
                                    </span>
                                    <span className="text-xs font-bold text-slate-805">{t.medium}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto text-[11px]">
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Spend ({tSpendPct}%)</span>
                                    </div>
                                    <span className="font-mono text-slate-700 block">{formatINR(t.spend)} / {formatINR(t.budget)}</span>
                                  </div>

                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Leads ({tLeadPct}%)</span>
                                    </div>
                                    <span className="font-mono text-slate-705 block">{t.totalLeadAchieved} / {t.totalLeadTarget}</span>
                                  </div>

                                  <div className="hidden md:flex flex-col items-center justify-center pr-1">
                                    {rolePermission.canDeleteTargets ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteTarget(t.id);
                                          if (selectedTarget?.id === t.id) {
                                            setSelectedTarget(null);
                                          }
                                        }}
                                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer text-slate-400"
                                        title="Erase targeted ledger row"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    ) : (
                                      <button
                                        disabled
                                        className="p-1 text-slate-200 cursor-not-allowed"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-[10px] w-full">
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Site Visits (SVC)</span>
                                  <span className="font-bold text-slate-750">{t.siteVisit} <span className="font-medium text-slate-400">/ Goal: {t.targetSvc ?? 60}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Allocation Target</span>
                                  <span className="font-bold text-slate-755">{t.leadAllocation} <span className="font-medium text-slate-400">/ Goal: {t.targetAllocation ?? 80}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Bookings Goal</span>
                                  <span className="font-bold text-slate-750">{t.booking} <span className="font-medium text-slate-400">/ Goal: {t.targetBooking ?? 8}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Target Spend Amount</span>
                                  <span className="font-bold text-indigo-700">{formatINR(t.spend)} <span className="font-medium text-slate-400">/ Goal: {formatINR(t.targetSpendAmount || t.budget)}</span></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // 3. Medium Wise Grouping View
              <div className="space-y-6">
                {(Object.entries(mediumGroupsObj) as [string, TargetBudgetRow[]][]).map(([mediumName, groupRows]) => {
                  const medBudget = groupRows.reduce((s, r) => s + r.budget, 0);
                  const medSpend = groupRows.reduce((s, r) => s + r.spend, 0);
                  const medLeadsTarget = groupRows.reduce((s, r) => s + r.totalLeadTarget, 0);
                  const medLeadsAchieved = groupRows.reduce((s, r) => s + r.totalLeadAchieved, 0);

                  const spendPct = medBudget > 0 ? Math.round((medSpend / medBudget) * 100) : 0;
                  const leadPct = medLeadsTarget > 0 ? Math.round((medLeadsAchieved / medLeadsTarget) * 100) : 0;

                  return (
                    <div key={mediumName} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                      {/* Medium Consolidated Summary Head */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-200">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-indigo-600 block tracking-wider font-display">MEDIUM / CHANNEL</span>
                          <h3 className="text-xs font-extrabold text-slate-800">{mediumName}</h3>
                          <span className="text-[10px] text-slate-500 font-semibold font-mono">{groupRows.length} Project Target(s)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-display">Channel Budget Util</span>
                            <span className="font-mono text-slate-700">{formatINR(medSpend)} / {formatINR(medBudget)} ({spendPct}%)</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-455 block uppercase font-display">Channel Leads Goal</span>
                            <span className="font-mono text-slate-700">{medLeadsAchieved} / {medLeadsTarget} ({leadPct}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Projects under this medium */}
                      <div className="space-y-2">
                        {groupRows.map((t) => {
                          const isSelected = selectedTarget?.id === t.id;
                          const tSpendPct = t.budget > 0 ? Math.round((t.spend / t.budget) * 100) : 0;
                          const tLeadPct = t.totalLeadTarget > 0 ? Math.round((t.totalLeadAchieved / t.totalLeadTarget) * 100) : 0;

                          return (
                            <div
                              key={t.id}
                              className={`bg-white border p-3 rounded-lg shadow-2xs transition-all flex flex-col gap-2 hover:border-slate-350 cursor-pointer ${
                                isSelected ? "ring-2 ring-indigo-600 border-indigo-205 bg-indigo-50/10" : "border-slate-150"
                              }`}
                              onClick={() => {
                                setSelectedTarget(t);
                                setEditWeekIdx(null);
                              }}
                            >
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="p-0.5 px-1 text-[9px] font-bold bg-slate-100 text-slate-655 border border-slate-205 rounded font-mono">
                                      {t.month}
                                    </span>
                                    <span className="text-xs font-bold text-slate-850">{t.project}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto text-[11px]">
                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Spend ({tSpendPct}%)</span>
                                    </div>
                                    <span className="font-mono text-slate-700 block">{formatINR(t.spend)} / {formatINR(t.budget)}</span>
                                  </div>

                                  <div className="space-y-0.5">
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-400">
                                      <span>Leads ({tLeadPct}%)</span>
                                    </div>
                                    <span className="font-mono text-slate-705 block">{t.totalLeadAchieved} / {t.totalLeadTarget}</span>
                                  </div>

                                  <div className="hidden md:flex flex-col items-center justify-center pr-1">
                                    {rolePermission.canDeleteTargets ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteTarget(t.id);
                                          if (selectedTarget?.id === t.id) {
                                            setSelectedTarget(null);
                                          }
                                        }}
                                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer text-slate-400"
                                        title="Erase targeted ledger row"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    ) : (
                                      <button
                                        disabled
                                        className="p-1 text-slate-200 cursor-not-allowed"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-[10px] w-full">
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Site Visits (SVC)</span>
                                  <span className="font-bold text-slate-750">{t.siteVisit} <span className="font-medium text-slate-400">/ Goal: {t.targetSvc ?? 60}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Allocation Target</span>
                                  <span className="font-bold text-slate-755">{t.leadAllocation} <span className="font-medium text-slate-400">/ Goal: {t.targetAllocation ?? 80}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Bookings Goal</span>
                                  <span className="font-bold text-slate-750">{t.booking} <span className="font-medium text-slate-400">/ Goal: {t.targetBooking ?? 8}</span></span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-bold text-[8px] uppercase tracking-wider">Target Spend Amount</span>
                                  <span className="font-bold text-indigo-700">{formatINR(t.spend)} <span className="font-medium text-slate-405">/ Goal: {formatINR(t.targetSpendAmount || t.budget)}</span></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Breakdown Sub-ledger Panel */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden h-full flex flex-col min-h-[480px]">
            {selectedTarget ? (
              <div className="flex-1 flex flex-col">
                {/* Header contextual info */}
                <div className="p-4 bg-slate-50 border-b border-slate-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider font-display">
                        Target Sub-ledger weeks
                      </span>
                      <h3 className="text-xs font-extrabold text-slate-800 mt-0.5 leading-tight">
                        {selectedTarget.project}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                        {selectedTarget.month} | {selectedTarget.medium}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded">
                      Active Map
                    </span>
                  </div>

                  {/* Targets Summary Bar */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-600">
                    <div className="bg-white p-1.5 rounded border border-slate-150">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Target SVC (Site Visits)</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedTarget.targetSvc ?? 60} SV</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-150">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Target Allocation</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedTarget.targetAllocation ?? 80} leads</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-150">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Target Bookings</span>
                      <span className="font-bold text-indigo-700 font-mono">{selectedTarget.targetBooking ?? 8} units</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-150">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Target Spend Amt</span>
                      <span className="font-bold text-slate-800 font-mono">{formatINR(selectedTarget.targetSpendAmount || selectedTarget.budget)}</span>
                    </div>
                  </div>
                </div>

                {/* Weeks display list */}
                <div className="p-4 flex-1 space-y-3.5 overflow-y-auto">
                  {(["week1", "week2", "week3", "week4", "week5"] as const).map((wkNum, index) => {
                    const wkData: WeeklyMetric = selectedTarget[wkNum];
                    const isEditing = editWeekIdx === wkNum;

                    return (
                      <div key={wkNum} className="border border-slate-150 rounded-xl p-3 space-y-2 hover:border-slate-300 relative bg-slate-50/20">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase pb-1 border-b border-dotted border-slate-200">
                          <span>Week {index + 1} Log</span>
                          {!isEditing ? (
                            rolePermission.canManageTargets ? (
                              <button
                                onClick={() => startEditWeek(wkNum, wkData)}
                                className="text-indigo-650 hover:bg-indigo-50 p-0.5 px-1.5 rounded flex items-center gap-0.5"
                              >
                                <Edit size={10} /> Edit Week
                              </button>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-normal italic">View Only</span>
                            )
                          ) : (
                            <span className="text-amber-550 font-bold uppercase tracking-wider">Modifying ledger</span>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-medium text-slate-655">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Spent:</span>
                              <span className="font-bold text-slate-850 font-mono">{formatINR(wkData.spend)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Leads Conv:</span>
                              <span className="font-bold text-slate-700 font-mono">
                                {wkData.totalLeadAchieved} <span className="text-[9px] font-normal text-slate-400 font-sans">(D: {wkData.digitalLeadAchieved}, B: {wkData.btlLeadAchieved})</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Lead allocated / Tours:</span>
                              <span className="font-bold text-slate-650 font-mono">{wkData.leadAllocation} alloc / {wkData.siteVisit} SV</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Conversions Booked:</span>
                              <span className="font-bold text-indigo-600 font-mono">{wkData.booking} unit(s)</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-450 font-bold mb-0.5">Spend (INR - ₹)</label>
                                <input
                                  type="number"
                                  value={weekSpend}
                                  onChange={(e) => setWeekSpend(parseFloat(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-800 font-bold font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-450 font-bold mb-0.5">Total Leads</label>
                                <input
                                  type="number"
                                  value={weekTotalLeads}
                                  onChange={(e) => setWeekTotalLeads(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-800 font-bold font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-450 font-bold mb-0.5">Digital leads</label>
                                <input
                                  type="number"
                                  value={weekDigitalLeads}
                                  onChange={(e) => setWeekDigitalLeads(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-800 font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-450 font-bold mb-0.5">BTL leads</label>
                                <input
                                  type="number"
                                  value={weekBtlLeads}
                                  onChange={(e) => setWeekBtlLeads(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-800 font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5">
                              <div>
                                <label className="block text-[9px] text-slate-450 font-bold mb-0.5">Allocated</label>
                                <input
                                  type="number"
                                  value={weekAllocation}
                                  onChange={(e) => setWeekAllocation(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-800 font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-450 font-bold mb-0.5">Site Visits</label>
                                <input
                                  type="number"
                                  value={weekSiteVisit}
                                  onChange={(e) => setWeekSiteVisit(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-slate-850 font-mono text-center outline-hidden bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-450 font-bold mb-0.5">Bookings</label>
                                <input
                                  type="number"
                                  value={weekBooking}
                                  onChange={(e) => setWeekBooking(parseInt(e.target.value) || 0)}
                                  className="w-full p-1 border border-slate-200 rounded text-indigo-600 font-mono font-bold text-center outline-hidden bg-white"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditWeekIdx(null)}
                                className="px-2.5 py-1 text-[10px] hover:bg-slate-100 text-slate-500 border border-slate-200 rounded font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveWeekEdit}
                                className="px-3 py-1 text-[10px] bg-indigo-600 text-white rounded font-bold flex items-center gap-1 shrink-0"
                              >
                                <Save size={10} /> Update Week
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <Coins size={36} className="text-slate-300" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 tracking-tight">Select Target Record</h4>
                  <p className="text-[10.5px] mt-1 text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                    Click any configured monthly budget plan Card on the left list map to inspect and update its five weekly granular ledgers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
