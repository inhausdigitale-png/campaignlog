import React, { useState, useMemo } from "react";
import { LeadActivityLog } from "../types";
import {
  Search,
  Trash2,
  Clock,
  Filter,
  CheckCircle,
  Plus,
  FileSpreadsheet,
  User,
  History,
  AlertCircle,
  Sparkles,
  Calendar,
  X
} from "lucide-react";

interface LeadActivityTimelineLogsProps {
  activityLogs: LeadActivityLog[];
  setActivityLogs: React.Dispatch<React.SetStateAction<LeadActivityLog[]>>;
}

export default function LeadActivityTimelineLogs({
  activityLogs,
  setActivityLogs
}: LeadActivityTimelineLogsProps) {
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [actionCategoryFilter, setActionCategoryFilter] = useState<string>("All");
  const [platformCategoryFilter, setPlatformCategoryFilter] = useState<string>("All");
  const [showConfirmPurge, setShowPurgeConfirm] = useState(false);

  // Calculate stats on the fly
  const logsStats = useMemo(() => {
    let createdCount = 0;
    let progressionCount = 0;
    let bulkUploadsCount = 0;
    let deletionCount = 0;

    activityLogs.forEach((log) => {
      if (log.action === "CREATE_LEAD") createdCount++;
      else if (log.action === "UPDATE_STATUS") progressionCount++;
      else if (log.action === "BULK_UPLOAD") bulkUploadsCount++;
      else if (log.action === "DELETE_LEAD") deletionCount++;
    });

    return {
      total: activityLogs.length,
      createdCount,
      progressionCount,
      bulkUploadsCount,
      deletionCount
    };
  }, [activityLogs]);

  // Handle Purge All Logs
  const handlePurgeLogs = () => {
    // Record a purge log event inside the final cleared list or clear completely
    const purgeEvent: LeadActivityLog = {
      id: "act-purge-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      action: "PURGE_LOGS",
      actor: "gouthamarun123@gmail.com",
      entityId: "logs-db",
      entityName: "System Audit Logs",
      details: "Audit log trail cleared by administrator action. All preceding history purged.",
      platform: "System Admin"
    };
    setActivityLogs([purgeEvent]);
    setShowPurgeConfirm(false);
  };

  // Format Helper for relative/absolute time
  const getFormattedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) + " " + date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Recently";
    }
  };

  // Filter dynamic logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Search Box Filter
      const matchedSearch =
        log.entityName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        (log.platform && log.platform.toLowerCase().includes(logSearchQuery.toLowerCase()));

      // Action Filter
      const matchedAction =
        actionCategoryFilter === "All" || log.action === actionCategoryFilter;

      // Platform filter
      const matchedPlatform =
        platformCategoryFilter === "All" ||
        (log.platform && log.platform.toLowerCase() === platformCategoryFilter.toLowerCase()) ||
        (platformCategoryFilter === "Unspecified" && !log.platform);

      return matchedSearch && matchedAction && matchedPlatform;
    });
  }, [activityLogs, logSearchQuery, actionCategoryFilter, platformCategoryFilter]);

  // Render Action Icon Badge
  const renderActionBadge = (action: LeadActivityLog["action"]) => {
    switch (action) {
      case "CREATE_LEAD":
        return {
          icon: <Plus size={14} className="text-blue-600" />,
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-700",
          label: "Lead Created"
        };
      case "UPDATE_STATUS":
        return {
          icon: <History size={14} className="text-amber-600 animate-spin-slow" />,
          bgColor: "bg-amber-50 border-amber-200",
          textColor: "text-amber-700",
          label: "Stage Upgrade"
        };
      case "BULK_UPLOAD":
        return {
          icon: <FileSpreadsheet size={14} className="text-emerald-600" />,
          bgColor: "bg-emerald-50 border-emerald-200",
          textColor: "text-emerald-700",
          label: "CSV Bulk Import"
        };
      case "DELETE_LEAD":
        return {
          icon: <Trash2 size={14} className="text-rose-600" />,
          bgColor: "bg-rose-50 border-rose-200",
          textColor: "text-rose-700",
          label: "Lead Purged"
        };
      case "PURGE_LOGS":
        return {
          icon: <AlertCircle size={14} className="text-slate-600" />,
          bgColor: "bg-slate-50 border-slate-350",
          textColor: "text-slate-800",
          label: "Logs Reset"
        };
      default:
        return {
          icon: <Clock size={14} className="text-indigo-650" />,
          bgColor: "bg-indigo-50 border-indigo-200",
          textColor: "text-indigo-700",
          label: "System Event"
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="crm-activity-logs-dashboard">
      
      {/* 1. KEY LOGS ANALYTICS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Events */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-indigo-100/10 border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-display">Log Events</span>
            <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{logsStats.total}</div>
          </div>
        </div>

        {/* Manual Created */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Plus size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-display">Manual Entries</span>
            <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{logsStats.createdCount}</div>
          </div>
        </div>

        {/* Status Upgrades */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <History size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-display">Stage Swaps</span>
            <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{logsStats.progressionCount}</div>
          </div>
        </div>

        {/* Bulk Imports */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-display">CSV Bundles</span>
            <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{logsStats.bulkUploadsCount}</div>
          </div>
        </div>

        {/* Deletions Red Card */}
        <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-rose-50 text-rose-650 rounded-lg">
            <Trash2 size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider font-display">Lead Purges</span>
            <div className="text-xl font-bold font-mono text-slate-850 mt-0.5">{logsStats.deletionCount}</div>
          </div>
        </div>
      </div>

      {/* 2. LOGS SEARCH & FILTERS CONTROLS zone */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left Side Filter Clustor */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Query Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search historical log details..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden text-slate-705 focus:bg-white focus:border-indigo-400 font-medium"
            />
          </div>

          {/* Action category filter */}
          <div>
            <select
              value={actionCategoryFilter}
              onChange={(e) => setActionCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-hidden font-bold cursor-pointer hover:bg-slate-100/50"
            >
              <option value="All">All Actions</option>
              <option value="CREATE_LEAD">Lead Registrations</option>
              <option value="UPDATE_STATUS">Pipeline Stage Changes</option>
              <option value="BULK_UPLOAD">CSV Sheet Uploads</option>
              <option value="DELETE_LEAD">Deleted Prospects</option>
            </select>
          </div>

          {/* Platform filter */}
          <div>
            <select
              value={platformCategoryFilter}
              onChange={(e) => setPlatformCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-hidden font-bold cursor-pointer hover:bg-slate-100/50"
            >
              <option value="All">All Acquisition Platforms</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Organic Search">Organic Search</option>
              <option value="Housing">Housing</option>
              <option value="99 Acres">99 Acres</option>
              <option value="Magicbricks">Magicbricks</option>
              <option value="Roof&floor">Roof &amp; Floor</option>
              <option value="Unspecified">No Platform</option>
            </select>
          </div>
        </div>

        {/* Right side Purge Button */}
        <div>
          <button
            onClick={() => setShowPurgeConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200/50 transition-all cursor-pointer shadow-3xs"
            type="button"
          >
            <Trash2 size={13} />
            <span>Clear Trace Logs</span>
          </button>
        </div>
      </div>

      {/* 3. CHRONOLOGICAL TIMELINE LEDGER */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 relative overflow-hidden" id="timeline-scroll-anchor">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <History size={15} className="text-indigo-600" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Digital Lead Acquisition Audit Trail</h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
            Showing {filteredLogs.length} of {activityLogs.length} events
          </span>
        </div>

        {/* Timeline Line */}
        {filteredLogs.length > 0 && (
          <div className="absolute left-8 lg:left-24 top-20 bottom-8 border-l border-indigo-100 border-dashed" />
        )}

        <div className="space-y-6">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No matching activity log events found. Try adjusting or clearing search parameters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badgeDef = renderActionBadge(log.action);
              let platformColor = "bg-slate-100 text-slate-655 border-slate-200";
              const pLower = log.platform?.toLowerCase() || "";
              if (pLower.includes("housing")) platformColor = "bg-amber-50 text-amber-800 border-amber-250/50";
              else if (pLower.includes("99 acres")) platformColor = "bg-yellow-50 text-yellow-850 border-yellow-250/60";
              else if (pLower.includes("magicbricks")) platformColor = "bg-orange-50 text-orange-850 border-orange-250/50";
              else if (pLower.includes("roof&floor") || pLower.includes("roof & floor")) platformColor = "bg-rose-50 text-rose-800 border-rose-250/50";
              else if (pLower.includes("google")) platformColor = "bg-blue-100 text-blue-800 border-blue-200/50";

              return (
                <div key={log.id} className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8 group select-none hover:scale-[1.002] transition-all">
                  
                  {/* Left Side: Timestamp column (Desktop only) */}
                  <div className="hidden lg:block w-36 text-right pt-1 text-slate-405 font-mono text-[11px] leading-relaxed shrink-0 uppercase tracking-tighter">
                    <span className="font-extrabold block text-slate-700">{getFormattedTime(log.timestamp)}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString(undefined, {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>

                  {/* Bullet Symbol Badge */}
                  <div className={`relative z-10 p-2 border rounded-full shrink-0 ${badgeDef.bgColor} shadow-3xs group-hover:scale-110 transition-all ml-4 lg:ml-0`}>
                    {badgeDef.icon}
                  </div>

                  {/* Main Event details block */}
                  <div className="flex-1 bg-slate-50/70 border border-slate-200/80 group-hover:border-indigo-150 rounded-xl p-4 shadow-3xs group-hover:shadow-2xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
                    
                    <div className="space-y-1.5 flex-1 select-text">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mobile date tracker */}
                        <span className="lg:hidden text-[10px] bg-slate-100 text-slate-500 font-mono font-extrabold px-1.5 py-0.5 rounded-md">
                          {getFormattedTime(log.timestamp)}
                        </span>
                        
                        {/* Event action Type Badge */}
                        <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 border rounded-lg font-bold ${badgeDef.bgColor} ${badgeDef.textColor}`}>
                          {badgeDef.label}
                        </span>

                        <span className="font-extrabold text-slate-800 text-sm">
                          {log.entityName}
                        </span>
                      </div>

                      <p className="text-slate-655 font-medium leading-relaxed font-sans text-[11.5px]">
                        {log.details}
                      </p>

                      <div className="pt-2 mt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-400 shrink-0" />
                          <span>Operator: <span className="text-slate-600 font-semibold normal-case font-sans">{log.actor}</span></span>
                        </span>
                        
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock size={11} className="text-slate-400 shrink-0" />
                          <span>UUID: <span className="text-slate-500">{log.entityId}</span></span>
                        </span>
                      </div>
                    </div>

                    {/* Right side Metadata label chips */}
                    {log.platform && (
                      <div className="pt-1 select-none shrink-0 self-start">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 border rounded-lg ${platformColor}`}>
                          {log.platform}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. CONFIRM PURGE WARNING POPUP */}
      {showConfirmPurge && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-800/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-up">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                  <AlertCircle size={20} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm font-display uppercase tracking-wider">Purge Audit Trail Database</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    You are warningly executing a permanent wipeout of the pipeline timeline history registry. This command cannot be Undone. Your current identity trace logs will survive inside the logs cache.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePurgeLogs}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-all"
                >
                  Confirm Purge & Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
