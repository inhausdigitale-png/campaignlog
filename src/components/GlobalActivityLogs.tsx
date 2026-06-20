import React, { useState, useMemo } from "react";
import { AuditLog, ChangeLogEntry } from "../types";
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  Briefcase,
  Workflow,
  Sparkles,
  Download,
  Trash2,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  Eye,
  X
} from "lucide-react";

interface GlobalActivityLogsProps {
  auditLogs: AuditLog[];
  changeLogs: ChangeLogEntry[];
}

interface UnifiedLogEvent {
  id: string;
  timestamp: string; // ISO
  module: "CAMPAIGN" | "STRATEGY_TWEAK" | "LEAD_PIPELINE";
  action: string;
  actor: string; // email or operator name
  targetName: string; // e.g., Campaign name, Lead Name
  details: string;
  platformOrCategory?: string;
  originalLog: any;
}

export default function GlobalActivityLogs({
  auditLogs = [],
  changeLogs = []
}: GlobalActivityLogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedActor, setSelectedActor] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedLogDetail, setSelectedLogDetail] = useState<UnifiedLogEvent | null>(null);

  // 1. Fetch leads pipeline activity logs from localStorage
  const leadLogs = useMemo(() => {
    const saved = localStorage.getItem("g_pipeline_activity_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn("Failed to parse lead activity logs inside global center", e);
      }
    }
    return [];
  }, []);

  // 2. Map and merge all records into a single consolidated chronological feed
  const unifiedLogs = useMemo<UnifiedLogEvent[]>(() => {
    const mappedAudits: UnifiedLogEvent[] = auditLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp || new Date().toISOString(),
      module: "CAMPAIGN",
      action: log.action || "Update",
      actor: log.changedBy || "anonymous_ops",
      targetName: log.campaignName || "Campaign Record",
      details: log.details || "Modified campaign fields in ledger.",
      platformOrCategory: "System Ledger",
      originalLog: log
    }));

    const mappedChanges: UnifiedLogEvent[] = changeLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt || log.date || new Date().toISOString(),
      module: "STRATEGY_TWEAK",
      action: "Strategic Pivot",
      actor: log.lastEditedBy || "gouthamarun123@gmail.com",
      targetName: `${log.project || "General"} - ${log.campaignName || "Universal"}`,
      details: `Changed: ${log.changed}. Reason: ${log.reason}${log.progress ? ` [Status: ${log.progress}]` : ""}`,
      platformOrCategory: log.changeCategory || log.type || "Performance",
      originalLog: log
    }));

    const mappedLeads: UnifiedLogEvent[] = leadLogs.map((log: any) => ({
      id: log.id,
      timestamp: log.timestamp || new Date().toISOString(),
      module: "LEAD_PIPELINE",
      action: log.action === "CREATE_LEAD" ? "Lead Created" : log.action === "UPDATE_STATUS" ? "Stage Upgraded" : log.action === "BULK_UPLOAD" ? "CSV Import" : log.action || "Lead Update",
      actor: log.actor || "gouthamarun123@gmail.com",
      targetName: log.entityName || "Contact Prospect",
      details: log.details || "Updated prospect record parameters.",
      platformOrCategory: log.platform || "Platform Router",
      originalLog: log
    }));

    const combined = [...mappedAudits, ...mappedChanges, ...mappedLeads];

    // Filter by Search Query
    const filtered = combined.filter((log) => {
      const q = searchQuery.toLowerCase();
      const contentMatch =
        log.details.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        (log.platformOrCategory && log.platformOrCategory.toLowerCase().includes(q));

      const moduleMatch = selectedModule === "ALL" || log.module === selectedModule;

      const actorMatch = selectedActor === "ALL" || log.actor === selectedActor;

      return contentMatch && moduleMatch && actorMatch;
    });

    // Sort chronologically
    return filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

  }, [auditLogs, changeLogs, leadLogs, searchQuery, selectedModule, selectedActor, sortBy]);

  // Unique list of operators/actors for the filters drop-down
  const uniqueActors = useMemo(() => {
    const actorsSet = new Set<string>();
    auditLogs.forEach((l) => l.changedBy && actorsSet.add(l.changedBy));
    changeLogs.forEach((l) => l.lastEditedBy && actorsSet.add(l.lastEditedBy));
    leadLogs.forEach((l: any) => l.actor && actorsSet.add(l.actor));
    
    // Always guarantee current user exists in set for demonstration
    actorsSet.add("gouthamarun123@gmail.com");
    return Array.from(actorsSet);
  }, [auditLogs, changeLogs, leadLogs]);

  // Stats Counters
  const statusCounters = useMemo(() => {
    let campaignsCount = 0;
    let strategyCount = 0;
    let pipelineCount = 0;

    auditLogs.forEach(() => campaignsCount++);
    changeLogs.forEach(() => strategyCount++);
    leadLogs.forEach(() => pipelineCount++);

    return {
      campaignsCount,
      strategyCount,
      pipelineCount,
      grandTotal: campaignsCount + strategyCount + pipelineCount
    };
  }, [auditLogs, changeLogs, leadLogs]);

  // Download entire list as structured CSV
  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Timestamp", "Module", "Action", "Operator", "Target Entity", "Details", "Meta Segment"];
      const rows = unifiedLogs.map((log) => [
        log.id,
        log.timestamp,
        log.module,
        log.action,
        log.actor,
        log.targetName.replace(/"/g, '""'),
        log.details.replace(/"/g, '""'),
        log.platformOrCategory || ""
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Global_Application_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error generating spreadsheet report.");
    }
  };

  // Human readable time label helper
  const formatTimeLabel = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " " + date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  // Modular logo/badges mapping
  const getModuleBadgePrg = (mod: UnifiedLogEvent["module"]) => {
    switch (mod) {
      case "CAMPAIGN":
        return {
          icon: <Briefcase size={13} />,
          label: "Campaign Engine",
          badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
          barColor: "bg-blue-500"
        };
      case "STRATEGY_TWEAK":
        return {
          icon: <Sparkles size={13} />,
          label: "Optimization Peak",
          badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
          barColor: "bg-amber-500"
        };
      case "LEAD_PIPELINE":
        return {
          icon: <Workflow size={13} />,
          label: "Leads Acquisition",
          badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
          barColor: "bg-emerald-500"
        };
    }
  };

  return (
    <div className="space-y-6" id="global-application-audit-trail">
      
      {/* 1. HERO TITLE HEADER BOX */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-36 h-36 bg-indigo-505 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                <History size={18} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 font-mono">Centralized Hub</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black font-sans tracking-tight text-white mt-1">Application Audit Logs &amp; History</h2>
            <p className="text-slate-400 text-xs font-medium max-w-2xl leading-relaxed">
              Consolidated real-time operational feed tracking system executions, digital marketing campaign changes, target ledger modifications, and prospect intake events.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Download size={14} />
              <span>Export Audit Sheet</span>
            </button>
          </div>
        </div>

        {/* 2. LIVE TELEMETRY TILES GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl">
            <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Total Operations</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">{statusCounters.grandTotal}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl border-l-3 border-l-blue-500">
            <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Campaign Edits</span>
            <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">{statusCounters.campaignsCount}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl border-l-3 border-l-amber-500">
            <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Strategic Pivots</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{statusCounters.strategyCount}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl border-l-3 border-l-emerald-500">
            <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Leads Pipeline</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{statusCounters.pipelineCount}</div>
          </div>
        </div>
      </div>

      {/* 3. MULTI-FILTERING PANEL AND ACTION SEARCH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-3 text-slate-450" size={15} />
            <input
              type="text"
              placeholder="Search detailed audit descriptions, entities, campaigns, or UUIDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-705 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sorted by chron */}
            <button
              onClick={() => setSortBy((p) => (p === "newest" ? "oldest" : "newest"))}
              className="px-3.5 py-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowUpDown size={13} className="text-slate-500" />
              <span>Order: {sortBy === "newest" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>

        {/* Categories Chips Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-2 font-mono">Module Filter:</span>
          
          <button
            onClick={() => setSelectedModule("ALL")}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all cursor-pointer ${
              selectedModule === "ALL"
                ? "bg-slate-850 text-slate-800 bg-slate-100 border-slate-300"
                : "bg-white border-slate-150 text-slate-500 hover:text-slate-800"
            }`}
          >
            All Modules ({statusCounters.grandTotal})
          </button>

          <button
            onClick={() => setSelectedModule("CAMPAIGN")}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedModule === "CAMPAIGN"
                ? "bg-blue-50 border-blue-300 text-blue-750"
                : "bg-white border-slate-150 text-slate-500 hover:text-blue-600"
            }`}
          >
            <Briefcase size={12} />
            <span>Campaign Engine ({statusCounters.campaignsCount})</span>
          </button>

          <button
            onClick={() => setSelectedModule("STRATEGY_TWEAK")}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedModule === "STRATEGY_TWEAK"
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-slate-150 text-slate-500 hover:text-amber-600"
            }`}
          >
            <Sparkles size={12} />
            <span>Optimization ({statusCounters.strategyCount})</span>
          </button>

          <button
            onClick={() => setSelectedModule("LEAD_PIPELINE")}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedModule === "LEAD_PIPELINE"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-slate-150 text-slate-500 hover:text-emerald-600"
            }`}
          >
            <Workflow size={12} />
            <span>Leads Intake ({statusCounters.pipelineCount})</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden md:block" />

          {/* Actor Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1.5 font-mono">Actor:</span>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-600 outline-hidden cursor-pointer"
            >
              <option value="ALL">Everyone</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* 4. LOGS STREAM CHRONOLOGY TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="px-5 py-4 bg-slate-50/55 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14.5} className="text-slate-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 font-sans">Stream of Log Events</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
            Showing {unifiedLogs.length} events
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {unifiedLogs.length === 0 ? (
            <div className="p-16 text-center text-slate-450">
              <History size={36} className="mx-auto text-slate-350 stroke-1 mb-3.5 animate-pulse" />
              <p className="text-xs font-bold text-slate-600">No activity log entries match the active filter criteria.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try relaxing your search phrase or categories filters.</p>
            </div>
          ) : (
            unifiedLogs.map((log) => {
              const modDef = getModuleBadgePrg(log.module);
              
              return (
                <div
                  key={log.id}
                  className="p-4.5 hover:bg-slate-50/70 transition-all flex items-start gap-3.5 group select-none"
                >
                  {/* Left Side Module Color line indicator */}
                  <div className={`w-1 h-11 rounded-full ${modDef.barColor} shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-all`} />

                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    
                    {/* Event metadata header line */}
                    <div className="flex items-center flex-wrap gap-2.5">
                      
                      {/* Module Badge */}
                      <span className={`text-[9px] uppercase tracking-wider border font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${modDef.badgeStyle}`}>
                        {modDef.icon}
                        <span>{modDef.label}</span>
                      </span>

                      {/* Action Type Tag */}
                      <span className="text-[10px] font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                        {log.action}
                      </span>

                      {/* Target entity identifier */}
                      <span className="text-xs font-black text-slate-800 font-sans truncate max-w-xs" title={log.targetName}>
                        {log.targetName}
                      </span>

                      {/* Rightmost: Stamp and metadata platform */}
                      <div className="ml-auto flex items-center gap-x-2 text-[10px] text-slate-455 font-mono">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span>{formatTimeLabel(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Event Body Description text */}
                    <p className="text-slate-655 font-medium leading-relaxed font-sans text-xs select-text pl-1">
                      {log.details}
                    </p>

                    {/* Bottom operators status line */}
                    <div className="flex flex-wrap items-center gap-x-4 pl-1 text-[10px] font-semibold text-slate-450 uppercase tracking-widest font-mono">
                      <span className="flex items-center gap-1">
                        <User size={11} className="text-slate-400" />
                        <span>OPERATOR: <span className="text-slate-600 font-bold normal-case font-sans">{log.actor}</span></span>
                      </span>

                      {log.platformOrCategory && (
                        <span className="flex items-center gap-1">
                          <Tag size={11} className="text-slate-400" />
                          <span>SPECTRUM: <span className="text-slate-500 font-bold">{log.platformOrCategory}</span></span>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-350">UUID: {log.id}</span>
                      </span>

                      <button
                        onClick={() => setSelectedLogDetail(log)}
                        className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 lowercase tracking-normal font-sans border-b border-indigo-150 transition-all cursor-pointer"
                      >
                        <Eye size={10} />
                        <span>view payload</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. PAYLOAD EXPLORER DIALOG WINDOW */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-scale-up">
            
            {/* Header info bar */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Layers size={14} />
                </span>
                <span className="text-xs font-black uppercase text-slate-700 font-sans tracking-wide">Developer Payload Explorer</span>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="p-1 px-1.5 text-slate-450 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest font-mono">Log Entry Identifier: {selectedLogDetail.id}</span>
                <h4 className="font-extrabold text-slate-900 text-sm">{selectedLogDetail.action} - {selectedLogDetail.targetName}</h4>
                <p className="text-slate-500 text-xs">{selectedLogDetail.details}</p>
              </div>

              {/* Payload code segment */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold text-slate-450 tracking-wider font-mono block">Granular Record Object Schema:</span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72">
                  <pre>{JSON.stringify(selectedLogDetail.originalLog, null, 2)}</pre>
                </div>
              </div>

              <div className="flex justify-end pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                >
                  Close Explorer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
