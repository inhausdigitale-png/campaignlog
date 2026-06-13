import React, { useState } from "react";
import { PortalReportRow } from "../types";
import { auth } from "../firebase";
import {
  Plus,
  Trash2,
  Calendar,
  Globe,
  Building2,
  TrendingUp,
  Filter,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Clock,
  User,
  History,
  X,
  Edit2
} from "lucide-react";

interface PortalReportModuleProps {
  portalReports: PortalReportRow[];
  onSaveReport: (row: PortalReportRow) => Promise<void>;
  onDeleteReport: (id: string) => Promise<void>;
}

export default function PortalReportModule({
  portalReports,
  onSaveReport,
  onDeleteReport,
}: PortalReportModuleProps) {
  // Modal controllers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  // Expanded row details for history/reasons
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Form interactive states
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formProject, setFormProject] = useState("Skyline Residency");
  const [formReason, setFormReason] = useState("");

  // Metrics for each of the 4 defined portals
  const [housingLeads, setHousingLeads] = useState(0);
  const [housingSvc, setHousingSvc] = useState(0);

  const [acresLeads, setAcresLeads] = useState(0);
  const [acresSvc, setAcresSvc] = useState(0);

  const [mbLeads, setMbLeads] = useState(0);
  const [mbSvc, setMbSvc] = useState(0);

  const [rfLeads, setRfLeads] = useState(0);
  const [rfSvc, setRfSvc] = useState(0);

  // Top Dashboard Filters
  const [filterMonth, setFilterMonth] = useState("2026-05"); // Defaulting to May, 2026 as in screen
  const [filterProject, setFilterProject] = useState("all");
  const [filterPortal, setFilterPortal] = useState("all"); // "all", "Housing", "99 Acres", "Magicbricks", "Roof&floor"

  // Preloaded template downloader
  const downloadPortalTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,Project,Portal,Generated Leads,SVS,SVC,Walkin,Gross,Net,Edit Reason\n"
      + "2026-05-01,Skyline Residency,Housing,5,5,2,0,0,0,Regular Log\n"
      + "2026-05-01,Skyline Residency,99 Acres,6,6,1,0,0,0,Regular Log\n"
      + "2026-05-01,Skyline Residency,Magicbricks,5,5,3,0,0,0,Regular Log\n"
      + "2026-05-01,Skyline Residency,Roof&floor,0,0,0,0,0,0,Regular Log\n"
      + "2026-05-02,Skyline Residency,Housing,1,1,2,0,0,0,Corrected report\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "portal_leads_and_svc_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract list of existing projects for dropdown filters
  const uniqueProjects = Array.from(new Set(portalReports.map((r) => r.project)));

  // Open modal for editing or adding
  const handleOpenAdd = () => {
    setEditingDate(null);
    setEditingProject(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormProject("Skyline Residency");
    setFormReason("Initial regular upload");

    setHousingLeads(0);
    setHousingSvc(0);
    setAcresLeads(0);
    setAcresSvc(0);
    setMbLeads(0);
    setMbSvc(0);
    setRfLeads(0);
    setRfSvc(0);

    setShowAddModal(true);
  };

  const handleOpenEdit = (dateStr: string, projectStr: string, pivotedRow: any) => {
    setEditingDate(dateStr);
    setEditingProject(projectStr);
    setFormDate(dateStr);
    setFormProject(projectStr);
    setFormReason("");

    setHousingLeads(pivotedRow.Housing?.leads || 0);
    setHousingSvc(pivotedRow.Housing?.svc || 0);
    setAcresLeads(pivotedRow["99 Acres"]?.leads || 0);
    setAcresSvc(pivotedRow["99 Acres"]?.svc || 0);
    setMbLeads(pivotedRow.Magicbricks?.leads || 0);
    setMbSvc(pivotedRow.Magicbricks?.svc || 0);
    setRfLeads(pivotedRow["Roof&floor"]?.leads || 0);
    setRfSvc(pivotedRow["Roof&floor"]?.svc || 0);

    setShowAddModal(true);
  };

  // Submit bulk portal entries for a single date + project
  const handleSaveBulkPortals = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeEmail = auth?.currentUser?.email || "gouthamarun123@gmail.com";
    const editComment = formReason.trim() || (editingDate ? "Manual metric update" : "Regular log submission");

    const portalsToSave = [
      { name: "Housing", leads: housingLeads, svc: housingSvc },
      { name: "99 Acres", leads: acresLeads, svc: acresSvc },
      { name: "Magicbricks", leads: mbLeads, svc: mbSvc },
      { name: "Roof&floor", leads: rfLeads, svc: rfSvc },
    ];

    for (const item of portalsToSave) {
      // Find existing row to replace/edit or create new
      const existingRow = portalReports.find(
        (r) => r.date === formDate && r.project === formProject && r.portal === item.name
      );

      const rId = existingRow ? existingRow.id : "p-rep-" + Math.random().toString(36).substring(2, 9);
      const payload: PortalReportRow = {
        id: rId,
        date: formDate,
        project: formProject,
        portal: item.name,
        generated: item.leads,
        svs: item.svc, // alignment helper for scheduling
        svc: item.svc,
        walkin: existingRow?.walkin || 0,
        gross: existingRow?.gross || 0,
        net: existingRow?.net || 0,
        createdAt: existingRow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        editReason: editComment,
        editedBy: activeEmail,
      };

      await onSaveReport(payload);
    }

    setShowAddModal(false);
    setFormReason("");
  };

  // Delete all rows matching a specific date + project combination
  const handleDeleteBulkPortals = async (dateStr: string, projectStr: string) => {
    if (!window.confirm(`Are you sure you want to delete all portal entries for ${dateStr} - ${projectStr}?`)) {
      return;
    }

    const rowsToDelete = portalReports.filter((r) => r.date === dateStr && r.project === projectStr);
    for (const r of rowsToDelete) {
      await onDeleteReport(r.id);
    }

    if (expandedDate === dateStr) {
      setExpandedDate(null);
    }
  };

  // Helper date conversions
  const formatDisplayDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateStr;
  };

  const getMonthName = (monthStr: string) => {
    // format "YYYY-MM"
    const parts = monthStr.split("-");
    if (parts.length === 2) {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const index = parseInt(parts[1], 10) - 1;
      return `${months[index] || ""}, ${parts[0]}`;
    }
    return monthStr;
  };

  const formatRangeDate = (dateStr: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthName = months[monthIndex] || "";
      return `${day < 10 ? "0" + day : day} ${monthName}`;
    }
    return dateStr;
  };

  // Pivot calculations: Group daily portalReports by Date & Project
  const pivotedData: { [key: string]: any } = {};

  portalReports.forEach((r) => {
    // Check if within selected Month
    const rowMonth = r.date.substring(0, 7); // "YYYY-MM"
    if (rowMonth !== filterMonth) return;

    // Check if matches project filter
    if (filterProject !== "all" && r.project !== filterProject) return;

    const groupKey = `${r.date}__${r.project}`;
    if (!pivotedData[groupKey]) {
      pivotedData[groupKey] = {
        date: r.date,
        project: r.project,
        Housing: { leads: 0, svc: 0 },
        "99 Acres": { leads: 0, svc: 0 },
        Magicbricks: { leads: 0, svc: 0 },
        "Roof&floor": { leads: 0, svc: 0 },
        rawRows: [] as PortalReportRow[],
      };
    }

    if (pivotedData[groupKey][r.portal]) {
      pivotedData[groupKey][r.portal].leads += r.generated;
      pivotedData[groupKey][r.portal].svc += r.svc;
    } else {
      pivotedData[groupKey][r.portal] = { leads: r.generated, svc: r.svc };
    }

    pivotedData[groupKey].rawRows.push(r);
  });

  // Convert map to array and sort chronologically ascending
  const sortedPivotedRows = Object.values(pivotedData).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Compute overall summary totals
  let totalHousingLeads = 0;
  let totalHousingSvc = 0;
  let totalAcresLeads = 0;
  let totalAcresSvc = 0;
  let totalMbLeads = 0;
  let totalMbSvc = 0;
  let totalRfLeads = 0;
  let totalRfSvc = 0;

  sortedPivotedRows.forEach((row) => {
    totalHousingLeads += row.Housing?.leads || 0;
    totalHousingSvc += row.Housing?.svc || 0;
    totalAcresLeads += row["99 Acres"]?.leads || 0;
    totalAcresSvc += row["99 Acres"]?.svc || 0;
    totalMbLeads += row.Magicbricks?.leads || 0;
    totalMbSvc += row.Magicbricks?.svc || 0;
    totalRfLeads += row["Roof&floor"]?.leads || 0;
    totalRfSvc += row["Roof&floor"]?.svc || 0;
  });

  const totalOverallLeads = totalHousingLeads + totalAcresLeads + totalMbLeads + totalRfLeads;
  const totalOverallSvc = totalHousingSvc + totalAcresSvc + totalMbSvc + totalRfSvc;

  // Retrieve min and max dates of displayed records for bottom label
  const displayedDates = sortedPivotedRows.map((r) => r.date);
  const minDate = displayedDates.length > 0 ? displayedDates[0] : "";
  const maxDate = displayedDates.length > 0 ? displayedDates[displayedDates.length - 1] : "";

  let durationLabel = "No Records Selected";
  if (minDate && maxDate) {
    if (minDate === maxDate) {
      durationLabel = formatRangeDate(minDate);
    } else {
      durationLabel = `${formatRangeDate(minDate)} - ${formatRangeDate(maxDate)}`;
    }
  }

  return (
    <div className="space-y-6" id="portal-leads-and-svc-root">
      {/* HEADER SECTION EXACTLY AS ATTACHED SCREENSHOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Portal Leads and SVC</h1>
          <p className="text-xs text-slate-450 mt-1">Group and review daily leads and site visits conducted across property portals.</p>
        </div>
      </div>

      {/* FILTERS BAR EXACTLY LIKE SCREENSHOT */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-wrap gap-6 items-center">
        {/* Month Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-display">Month</label>
          <div className="relative flex items-center">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="p-2 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-705 outline-hidden font-bold cursor-pointer hover:bg-slate-100/50 min-w-[140px] appearance-none"
            >
              <option value="2026-03">March, 2026</option>
              <option value="2026-04">April, 2026</option>
              <option value="2026-05">May, 2026</option>
              <option value="2026-06">June, 2026</option>
              <option value="2026-07">July, 2026</option>
              <option value="2026-08">August, 2026</option>
              <option value="2026-09">September, 2026</option>
            </select>
            <Calendar size={13} className="absolute right-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Project Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-display">Project</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="p-2 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-705 outline-hidden font-bold cursor-pointer hover:bg-slate-100/50 min-w-[150px]"
          >
            <option value="all">All Projects</option>
            {uniqueProjects.map((proj) => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
            <option value="Skyline Residency">Skyline Residency</option>
            <option value="Solar Expansion">Solar Expansion</option>
            <option value="Eco Villas">Eco Villas</option>
          </select>
        </div>

        {/* Portal Filter (Column selection) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-display">Portal</label>
          <select
            value={filterPortal}
            onChange={(e) => setFilterPortal(e.target.value)}
            className="p-2 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-705 outline-hidden font-bold cursor-pointer hover:bg-slate-100/50 min-w-[140px]"
          >
            <option value="all">All Portals</option>
            <option value="Housing">Housing</option>
            <option value="99 Acres">99 Acres</option>
            <option value="Magicbricks">Magicbricks</option>
            <option value="Roof&floor">Roof&floor</option>
          </select>
        </div>

        {/* Template Downloader */}
        <div className="sm:ml-auto self-end pb-1">
          <button
            onClick={downloadPortalTemplate}
            className="text-xs font-bold text-slate-700 underline hover:text-indigo-650 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={13} />
            <span>Download Portal Template</span>
          </button>
        </div>
      </div>

      {/* RECENT MODIFICATION REASON TRACE CARD */}
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Clock className="text-slate-500 shrink-0 mt-0.5" size={15} />
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-display block">Modification Log &amp; Reason Tracker</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              To review who edited which parameters and what reason they recorded, click on any table date row below to expand the detailed log timeline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-medium">
          <History size={12} className="text-indigo-500 animate-pulse" />
          <span>Tracking Active</span>
        </div>
      </div>

      {/* TABLE DATA-WISE WEEKLY SUMMARY */}
      <div className="bg-white border border-slate-205 rounded-2xl shadow-xs overflow-hidden" id="portal-table-container">
        {/* Table Title Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 font-display">
            Date Wise Weekly Summary
          </span>
          <span className="text-[10px] text-slate-400 font-bold font-mono">
            Leads and SVC by portal with weekly total rows
          </span>
        </div>

        <div className="overflow-x-auto">
          {sortedPivotedRows.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs font-semibold">
              No matching portal performance chronologies found for selected filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse border-spacing-0 table-fixed min-w-[900px] text-xs">
              <thead>
                {/* Level 1 Headers */}
                <tr className="text-[11px] text-slate-800 font-extrabold uppercase select-none">
                  <th className="p-3 text-center border-r border-slate-150 w-[120px]" style={{ backgroundColor: "#e48a7d" }}>Date</th>
                  
                  {/* Housing Primary Header */}
                  {(filterPortal === "all" || filterPortal === "Housing") && (
                    <th className="p-2.5 text-center border-r border-slate-150" style={{ backgroundColor: "#ffde59" }}>Housing</th>
                  )}

                  {/* 99 Acres Primary Header */}
                  {(filterPortal === "all" || filterPortal === "99 Acres") && (
                    <th className="p-2.5 text-center border-r border-slate-150" style={{ backgroundColor: "#ffea79" }}>99 Acres</th>
                  )}

                  {/* Magicbricks Primary Header */}
                  {(filterPortal === "all" || filterPortal === "Magicbricks") && (
                    <th className="p-2.5 text-center border-r border-slate-150" style={{ backgroundColor: "#f7b447" }}>Magicbricks</th>
                  )}

                  {/* Roof&floor Primary Header */}
                  {(filterPortal === "all" || filterPortal === "Roof&floor") && (
                    <th className="p-2.5 text-center border-r border-slate-150" style={{ backgroundColor: "#ff934e" }}>Roof&floor</th>
                  )}

                  {/* Total Primary Header */}
                  <th className="p-2.5 text-center" style={{ backgroundColor: "#a29ce4" }}>Total</th>
                </tr>

                {/* Level 2 Sub-Headers */}
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-150 border-t border-slate-150">
                  <th className="p-2 text-center border-r border-slate-150">Project Trace</th>
                  
                  {/* Housing Sub Headers */}
                  {(filterPortal === "all" || filterPortal === "Housing") && (
                    <>
                      <th className="p-2 text-center bg-[#fff8db] border-r border-slate-150 text-slate-650">Leads</th>
                      <th className="p-2 text-center bg-[#fffbf0] border-r border-slate-150 text-slate-650">SVC</th>
                    </>
                  )}

                  {/* 99 Acres Sub Headers */}
                  {(filterPortal === "all" || filterPortal === "99 Acres") && (
                    <>
                      <th className="p-2 text-center bg-[#fffdf0] border-r border-slate-150 text-slate-650">Leads</th>
                      <th className="p-2 text-center bg-[#fffdf5] border-r border-slate-150 text-slate-650">SVC</th>
                    </>
                  )}

                  {/* Magicbricks Sub Headers */}
                  {(filterPortal === "all" || filterPortal === "Magicbricks") && (
                    <>
                      <th className="p-2 text-center bg-[#fff6eb] border-r border-slate-150 text-slate-650">Leads</th>
                      <th className="p-2 text-center bg-[#fffaeb] border-r border-slate-150 text-slate-650">SVC</th>
                    </>
                  )}

                  {/* Roof&floor Sub Headers */}
                  {(filterPortal === "all" || filterPortal === "Roof&floor") && (
                    <>
                      <th className="p-2 text-center bg-[#fff3ec] border-r border-slate-150 text-slate-650">Leads</th>
                      <th className="p-2 text-center bg-[#fffaf5] border-r border-slate-150 text-slate-650">SVC</th>
                    </>
                  )}

                  {/* Total Sub Headers */}
                  <th className="p-2 text-center bg-violet-50 border-r border-slate-150 text-slate-650">Leads</th>
                  <th className="p-2 text-center bg-violet-50/50 text-slate-650">SVC</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                {sortedPivotedRows.map((row) => {
                  const housingRowLeads = row.Housing?.leads || 0;
                  const housingRowSvc = row.Housing?.svc || 0;
                  const acresRowLeads = row["99 Acres"]?.leads || 0;
                  const acresRowSvc = row["99 Acres"]?.svc || 0;
                  const mbRowLeads = row.Magicbricks?.leads || 0;
                  const mbRowSvc = row.Magicbricks?.svc || 0;
                  const rfRowLeads = row["Roof&floor"]?.leads || 0;
                  const rfRowSvc = row["Roof&floor"]?.svc || 0;

                  // Date-wise cross totals
                  const rowOverallLeads = housingRowLeads + acresRowLeads + mbRowLeads + rfRowLeads;
                  const rowOverallSvc = housingRowSvc + acresRowSvc + mbRowSvc + rfRowSvc;

                  const isExpanded = expandedDate === row.date;

                  return (
                    <React.Fragment key={`${row.date}__${row.project}`}>
                      {/* MAIN CONTENT ROW */}
                      <tr
                        className={`hover:bg-slate-50/80 transition-all cursor-pointer select-none group ${isExpanded ? "bg-slate-50/70 font-semibold text-slate-900" : ""}`}
                        onClick={() => setExpandedDate(isExpanded ? null : row.date)}
                      >
                        {/* Date Cell */}
                        <td className="p-3 border-r border-slate-15 w-[140px] font-mono text-center text-slate-600 font-bold">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-800">{formatDisplayDate(row.date)}</span>
                            <Info size={11} className="text-slate-400 group-hover:text-amber-500 opacity-60 group-hover:opacity-100 transition-all" title="Click to view change log" />
                          </div>
                        </td>

                        {/* Housing Metrics Cells */}
                        {(filterPortal === "all" || filterPortal === "Housing") && (
                          <>
                            <td className="p-3 text-center border-r border-slate-150 font-mono">{housingRowLeads}</td>
                            <td className="p-3 text-center border-r border-slate-150 font-mono text-slate-500 bg-amber-50/10">{housingRowSvc}</td>
                          </>
                        )}

                        {/* 99 Acres Metrics Cells */}
                        {(filterPortal === "all" || filterPortal === "99 Acres") && (
                          <>
                            <td className="p-3 text-center border-r border-slate-150 font-mono">{acresRowLeads}</td>
                            <td className="p-3 text-center border-r border-slate-150 font-mono text-slate-500 bg-amber-50/10">{acresRowSvc}</td>
                          </>
                        )}

                        {/* Magicbricks Metrics Cells */}
                        {(filterPortal === "all" || filterPortal === "Magicbricks") && (
                          <>
                            <td className="p-3 text-center border-r border-slate-150 font-mono">{mbRowLeads}</td>
                            <td className="p-3 text-center border-r border-slate-150 font-mono text-slate-500 bg-amber-50/10">{mbRowSvc}</td>
                          </>
                        )}

                        {/* Roof&floor Metrics Cells */}
                        {(filterPortal === "all" || filterPortal === "Roof&floor") && (
                          <>
                            <td className="p-3 text-center border-r border-slate-150 font-mono">{rfRowLeads}</td>
                            <td className="p-3 text-center border-r border-slate-150 font-mono text-slate-500 bg-amber-50/10">{rfRowSvc}</td>
                          </>
                        )}

                        {/* Totals Metric Cells */}
                        <td className="p-3 text-center font-bold bg-indigo-50/35 border-r border-slate-150 font-mono text-slate-900">{rowOverallLeads}</td>
                        <td className="p-3 text-center font-bold bg-indigo-50/30 font-mono text-slate-900 relative">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{rowOverallSvc}</span>
                            
                            {/* Inline Options to quickly edit or delete */}
                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white p-1 rounded-md border border-slate-155 shadow-xs transition-opacity duration-150" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenEdit(row.date, row.project, row)}
                                className="p-1 hover:text-indigo-650 hover:bg-slate-100 rounded"
                                title="Edit Row Metrics"
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteBulkPortals(row.date, row.project)}
                                className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete Daily Row"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDABLE PORTAL REASON LOGS DETAILS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60" id={`expanded-panel-${row.date}`}>
                          <td colSpan={13} className="p-3 border-t border-b border-indigo-100/60">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-indigo-100/40 pb-1.5">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                                  <Clock size={12} className="text-slate-450" />
                                  <span>Portal Configuration Details &amp; Reason (Date: {row.date} · Project: {row.project})</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDate(null)}
                                  className="text-[10px] text-slate-400 hover:text-slate-650 flex items-center"
                                >
                                  Close logs
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {row.rawRows.map((rawItem: PortalReportRow) => (
                                  <div key={rawItem.id} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 text-[11px]">
                                    <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                                      <span className="font-bold text-slate-800 flex items-center gap-1">
                                        <Globe size={11} className="text-teal-500" />
                                        {rawItem.portal}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        {rawItem.updatedAt ? "Updated" : "Created"}
                                      </span>
                                    </div>
                                    <p className="text-slate-655 text-medium mt-1">
                                      Leads Generated: <strong className="text-slate-850 font-mono font-bold">{rawItem.generated}</strong>
                                    </p>
                                    <p className="text-slate-655 text-medium">
                                      Conducted SVC: <strong className="text-indigo-650 font-mono font-bold">{rawItem.svc}</strong>
                                    </p>
                                    <div className="pt-2 mt-1 space-y-1 border-t border-slate-50 text-[10px]">
                                      <div className="flex items-center gap-1 text-slate-400 font-medium font-mono">
                                        <User size={9} />
                                        <span>User: {rawItem.editedBy || "gouthamarun123@gmail.com"}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-slate-405 font-mono">
                                        <Plus size={8} />
                                        <span>Reason: <span className="italic text-slate-550 font-sans">"{rawItem.editReason || "Initial upload metrics"}"</span></span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* SUMMARY ROAD MAP TOTALS ROW EXACTLY LIKE SCREENSHOT */}
                <tr className="bg-[#fbdbce]/50 text-slate-900 border-t border-slate-200" style={{ fontWeight: "bold" }} id="table-summary-totals-row">
                  {/* Date range duration label (e.g. 01 May - 03 May) */}
                  <td className="p-3 border-r border-slate-150 align-middle text-slate-800 text-[11px] font-extrabold font-sans">
                    {durationLabel}
                  </td>

                  {/* Housing sum rows */}
                  {(filterPortal === "all" || filterPortal === "Housing") && (
                    <>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fff5f2]/80 font-mono font-bold">{totalHousingLeads}</td>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fff8f6]/80 font-mono font-bold">{totalHousingSvc}</td>
                    </>
                  )}

                  {/* 99 Acres sum rows */}
                  {(filterPortal === "all" || filterPortal === "99 Acres") && (
                    <>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fffbf9]/80 font-mono font-bold">{totalAcresLeads}</td>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fffdfe]/80 font-mono font-bold">{totalAcresSvc}</td>
                    </>
                  )}

                  {/* Magicbricks sum rows */}
                  {(filterPortal === "all" || filterPortal === "Magicbricks") && (
                    <>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fffbf6]/80 font-mono font-bold">{totalMbLeads}</td>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fffefa]/80 font-mono font-bold">{totalMbSvc}</td>
                    </>
                  )}

                  {/* Roof&floor sum rows */}
                  {(filterPortal === "all" || filterPortal === "Roof&floor") && (
                    <>
                      <td className="p-3 text-center border-r border-[#edd1c5] bg-[#fffaf5]/80 font-mono font-bold">{totalRfLeads}</td>
                      <td className="p-3 text-center border-r border-slate-150 bg-[#fffdfa]/80 font-mono font-bold">{totalRfSvc}</td>
                    </>
                  )}

                  {/* Aggregated Totals summaries */}
                  <td className="p-3 text-center bg-violet-100/70 border-r border-slate-150 font-mono font-extrabold text-[12px]">{totalOverallLeads}</td>
                  <td className="p-3 text-center bg-violet-100/60 font-mono font-extrabold text-[12px]">{totalOverallSvc}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* POPUP MODAL DIALOG: ADD/EDIT LEDGER ROW */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-800/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scale-up" id="portal-metric-dialog">
            
            {/* Modal Title */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-150 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase font-display tracking-wider text-slate-700 flex items-center gap-1.5">
                <Globe className="text-emerald-600" size={15} />
                <span>{editingDate ? `Edit Portal Metrics` : "Add Portal Daily Row"}</span>
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveBulkPortals} className="p-5 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Configuration Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    disabled={!!editingDate}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-bold disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Project Name</label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    disabled={!!editingDate}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden font-bold disabled:opacity-50"
                  >
                    <option value="Skyline Residency">Skyline Residency</option>
                    <option value="Solar Expansion">Solar Expansion</option>
                    <option value="Eco Villas">Eco Villas</option>
                  </select>
                </div>
              </div>

              {/* Portal metric inputs */}
              <div className="space-y-3.5 border-t border-b border-slate-100 py-3 mt-1">
                <span className="text-[10px] font-extrabold text-slate-405 uppercase tracking-wide block">Portal Metrics Allocation</span>
                
                {/* 1. Housing */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffde59]" />
                    <span className="font-bold text-slate-700">Housing</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={housingLeads}
                      onChange={(e) => setHousingLeads(parseInt(e.target.value) || 0)}
                      placeholder="Leads"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={housingSvc}
                      onChange={(e) => setHousingSvc(parseInt(e.target.value) || 0)}
                      placeholder="SVC"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono text-emerald-650 font-bold"
                    />
                  </div>
                </div>

                {/* 2. 99 Acres */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffea79]" />
                    <span className="font-bold text-slate-700">99 Acres</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={acresLeads}
                      onChange={(e) => setAcresLeads(parseInt(e.target.value) || 0)}
                      placeholder="Leads"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={acresSvc}
                      onChange={(e) => setAcresSvc(parseInt(e.target.value) || 0)}
                      placeholder="SVC"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono text-emerald-650 font-bold"
                    />
                  </div>
                </div>

                {/* 3. Magicbricks */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f7b447]" />
                    <span className="font-bold text-slate-700">Magicbricks</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={mbLeads}
                      onChange={(e) => setMbLeads(parseInt(e.target.value) || 0)}
                      placeholder="Leads"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={mbSvc}
                      onChange={(e) => setMbSvc(parseInt(e.target.value) || 0)}
                      placeholder="SVC"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono text-emerald-650 font-bold"
                    />
                  </div>
                </div>

                {/* 4. Roof&floor */}
                <div className="grid grid-cols-3 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff934e]" />
                    <span className="font-bold text-slate-700 font-sans">Roof&amp;floor</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={rfLeads}
                      onChange={(e) => setRfLeads(parseInt(e.target.value) || 0)}
                      placeholder="Leads"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      value={rfSvc}
                      onChange={(e) => setRfSvc(parseInt(e.target.value) || 0)}
                      placeholder="SVC"
                      className="w-full p-2 bg-slate-5 w border border-slate-200 rounded-lg text-right font-mono text-emerald-650 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Requirement: Traceable last edit details and WHAT REASON */}
              <div>
                <label className="block text-slate-500 mb-1 flex items-center gap-1">
                  <Clock size={11} className="text-slate-400" />
                  <span>Modification Reason (Required for Tracking)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g., "Regular log" or "Correcting incorrect lead data"'
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-indigo-600 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4.5 py-2 hover:bg-slate-50 text-slate-500 font-bold border border-slate-200 rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Publish Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
