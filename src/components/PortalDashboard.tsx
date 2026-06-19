import React, { useMemo, useState } from "react";
import { PortalReportRow } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { formatIndianNumber } from "../utils/indiaHelpers";
import { 
  Database, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Award, 
  Zap, 
  ChevronRight, 
  BarChart2, 
  PieChart as PieIcon, 
  Activity,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from "lucide-react";

interface PortalDashboardProps {
  portalReports: PortalReportRow[];
}

export default function PortalDashboard({ portalReports }: PortalDashboardProps) {
  // Analytical Filters State
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [selectedPortal, setSelectedPortal] = useState<string>("All");
  const [dateRange, setDateRange] = useState<"all" | "7" | "30" | "90">("all");

  // Get unique lists for filters
  const uniqueProjects = useMemo(() => {
    const list = new Set<string>();
    portalReports.forEach(row => {
      if (row.project) list.add(row.project);
    });
    return ["All", ...Array.from(list)];
  }, [portalReports]);

  const uniquePortals = useMemo(() => {
    const list = new Set<string>();
    portalReports.forEach(row => {
      if (row.portal) list.add(row.portal);
    });
    return ["All", ...Array.from(list)];
  }, [portalReports]);

  // Apply filters to data set
  const filteredReports = useMemo(() => {
    return portalReports.filter(row => {
      // Project filter
      if (selectedProject !== "All" && row.project !== selectedProject) return false;
      
      // Portal filter
      if (selectedPortal !== "All" && row.portal !== selectedPortal) return false;
      
      // Date filter
      if (dateRange !== "all") {
        const rowDate = new Date(row.date);
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - parseInt(dateRange));
        if (rowDate < limitDate) return false;
      }
      
      return true;
    });
  }, [portalReports, selectedProject, selectedPortal, dateRange]);

  // Aggregated totals of the filtered set
  const stats = useMemo(() => {
    let generated = 0;
    let svs = 0;
    let svc = 0;
    let walkin = 0;
    let gross = 0;
    let net = 0;

    filteredReports.forEach(r => {
      generated += (r.generated || 0);
      svs += (r.svs || 0);
      svc += (r.svc || 0);
      walkin += (r.walkin || 0);
      gross += (r.gross || 0);
      net += (r.net || 0);
    });

    return { generated, svs, svc, walkin, gross, net };
  }, [filteredReports]);

  // Aggregate by portal for charts
  const aggregatedByPortal = useMemo(() => {
    const acc: Record<string, { 
      portal: string; 
      leads: number; 
      svs: number; 
      svc: number; 
      walkin: number; 
      gross: number; 
      net: number;
    }> = {};

    filteredReports.forEach(row => {
      const p = row.portal;
      if (!acc[p]) {
        acc[p] = { portal: p, leads: 0, svs: 0, svc: 0, walkin: 0, gross: 0, net: 0 };
      }
      acc[p].leads += (row.generated || 0);
      acc[p].svs += (row.svs || 0);
      acc[p].svc += (row.svc || 0);
      acc[p].walkin += (row.walkin || 0);
      acc[p].gross += (row.gross || 0);
      acc[p].net += (row.net || 0);
    });

    return Object.values(acc);
  }, [filteredReports]);

  // Aggregate by date for trend lines
  const aggregatedByDate = useMemo(() => {
    const acc: Record<string, { 
      date: string; 
      leads: number; 
      svs: number; 
      svc: number; 
      netBookings: number; 
    }> = {};

    filteredReports.forEach(row => {
      const d = row.date;
      if (!acc[d]) {
        acc[d] = { date: d, leads: 0, svs: 0, svc: 0, netBookings: 0 };
      }
      acc[d].leads += (row.generated || 0);
      acc[d].svs += (row.svs || 0);
      acc[d].svc += (row.svc || 0);
      acc[d].netBookings += (row.net || 0);
    });

    return Object.values(acc).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredReports]);

  // Conversion Ratios Calculations
  const ratios = useMemo(() => {
    const { generated, svs, svc, walkin, gross, net } = stats;
    return {
      schedulingRate: generated > 0 ? (svs / generated) * 100 : 0,
      attendanceRate: svs > 0 ? (svc / svs) * 100 : 0,
      visitToWalkinRate: svc > 0 ? (walkin / svc) * 100 : 0,
      walkinToGrossRate: walkin > 0 ? (gross / walkin) * 100 : 0,
      closingRate: generated > 0 ? (net / generated) * 100 : 0
    };
  }, [stats]);

  // Colors Palette for charts
  const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#3b82f6", "#14b8a6"];

  if (portalReports.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-250/20 mt-4 shadow-sm">
        <Database className="mx-auto text-slate-300 mb-3" size={40} />
        <h3 className="text-sm font-bold text-slate-700">No Portal Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">Please add data in the Data Entry view to see dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6 animate-fade-in" id="portal-lead-analytics-root">
      
      {/* Dynamic Advanced Controls & Slicer Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg border border-indigo-100">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Configure Analytics Scope</h3>
            <p className="text-[10px] text-slate-400">Slice indicators dynamically on-the-fly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 md:flex-initial">
          {/* Project Dropdown */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 p-1.5 px-2 rounded-lg text-slate-700 focus:bg-white"
            >
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p === "All" ? "All Projects" : p}</option>
              ))}
            </select>
          </div>

          {/* Portal Source Dropdown */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Portal Source</label>
            <select
              value={selectedPortal}
              onChange={(e) => setSelectedPortal(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 p-1.5 px-2 rounded-lg text-slate-700 focus:bg-white"
            >
              {uniquePortals.map(p => (
                <option key={p} value={p}>{p === "All" ? "All Portals" : p}</option>
              ))}
            </select>
          </div>

          {/* Time Limit Tab Selector */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Time Limit</label>
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200">
              {(["all", "7", "30", "90"] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDateRange(opt)}
                  className={`flex-1 text-[10px] font-bold rounded p-0.5 transition-all text-center cursor-pointer ${
                    dateRange === opt ? "bg-white text-indigo-900 shadow-3xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt === "all" ? "All" : `${opt}d`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-3xs">
          <Database className="mx-auto text-slate-350 mb-3" size={36} />
          <h4 className="text-sm font-bold text-slate-700">No Matching Analytical Rows Found</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">
            There are no marketing performance logs matching your currently chosen project/portal criteria. Try broadening your filter selections!
          </p>
        </div>
      ) : (
        <>
          {/* Key Performance Indicators (6-Stage Funnel Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: "1. Leads Generated", val: stats.generated, color: "text-indigo-600", bg: "bg-indigo-50/50 border-indigo-100" },
              { label: "2. Visits Scheduled (SVS)", val: stats.svs, color: "text-blue-600", bg: "bg-blue-50/50 border-blue-100" },
              { label: "3. Visits Conducted (SVC)", val: stats.svc, color: "text-amber-600", bg: "bg-amber-50/50 border-amber-100" },
              { label: "4. Walk-in Inquiries", val: stats.walkin, color: "text-pink-600", bg: "bg-pink-50/50 border-pink-100" },
              { label: "5. Gross Bookings", val: stats.gross, color: "text-purple-600", bg: "bg-purple-50/50 border-purple-100" },
              { label: "6. Net Finalized", val: stats.net, color: "text-emerald-600", bg: "bg-emerald-50/50 border-emerald-100" },
            ].map((card, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-4 rounded-xl border border-slate-200/80 shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-all relative overflow-hidden`}
              >
                <div className="space-y-1 z-10">
                  <h4 className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider block">{card.label}</h4>
                  <div className={`text-2xl font-mono font-black ${card.color}`}>{formatIndianNumber(card.val)}</div>
                </div>
                <div className={`mt-3 px-2 py-0.5 text-[9px] font-bold rounded-md w-max border ${card.bg}`}>
                  Active Metrics
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Sales Pipeline Funnel & Conversion Rates Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Conversion Pipeline */}
            <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200/80 shadow-3xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                    <Activity size={14} />
                  </span>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Dynamic Lead-to-Sale Funnel Efficiency</h4>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  Absolute Retention Rates
                </span>
              </div>

              {/* Horizontal Funnel Blocks */}
              <div className="space-y-3 pt-2">
                {[
                  { stage: "Leads Generated", count: stats.generated, pct: 100, color: "bg-indigo-600" },
                  { stage: "Site Visits Scheduled (SVS)", count: stats.svs, pct: stats.generated > 0 ? Math.round((stats.svs / stats.generated) * 100) : 0, color: "bg-blue-600" },
                  { stage: "Site Visits Conducted (SVC)", count: stats.svc, pct: stats.generated > 0 ? Math.round((stats.svc / stats.generated) * 100) : 0, color: "bg-amber-500" },
                  { stage: "Walk-ins Conducted", count: stats.walkin, pct: stats.generated > 0 ? Math.round((stats.walkin / stats.generated) * 100) : 0, color: "bg-pink-500" },
                  { stage: "Gross Property Deals", count: stats.gross, pct: stats.generated > 0 ? Math.round((stats.gross / stats.generated) * 100) : 0, color: "bg-purple-600" },
                  { stage: "Net Finalized Booking", count: stats.net, pct: stats.generated > 0 ? Math.round((stats.net / stats.generated) * 100) : 0, color: "bg-emerald-500" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-350" />
                        {item.stage}
                      </span>
                      <span className="text-slate-500 font-mono">
                        <span className="text-slate-900 font-bold">{item.count.toLocaleString()}</span> ({item.pct}%)
                      </span>
                    </div>
                    <div className="h-5 w-full bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200/50">
                      <div 
                        className={`h-full ${item.color} transition-all duration-500 ease-out`}
                        style={{ width: `${Math.max(item.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ratio Insights Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-3xs space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Zap size={14} className="text-amber-500" />
                Conversion Ratios
              </h4>

              <div className="divide-y divide-slate-100 space-y-3.5">
                {[
                  { label: "Scheduling Success Rate", sub: "Leads successfully booked into a visit", pct: ratios.schedulingRate, iconBg: "text-indigo-600 bg-indigo-50", text: "SVS / Leads" },
                  { label: "Visit Show-up Ratio", sub: "Scheduled visits successfully conducted", pct: ratios.attendanceRate, iconBg: "text-blue-600 bg-blue-50", text: "SVC / SVS" },
                  { label: "Walk-in Conversion Ratio", sub: "Conducted visits leading to detailed walk-in", pct: ratios.visitToWalkinRate, iconBg: "text-pink-600 bg-pink-50", text: "Walk-in / SVC" },
                  { label: "Overall Sales Closing Rate", sub: "Unique leads turning into net customers", pct: ratios.closingRate, iconBg: "text-emerald-700 bg-emerald-50", text: "Net / Leads" },
                ].map((rat, idx) => (
                  <div key={idx} className="pt-3.5 first:pt-0 flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${rat.iconBg} border border-indigo-100/10`}>
                      <ArrowUpRight size={15} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 tracking-tight block">{rat.label}</span>
                        <span className="text-xs font-mono font-black text-slate-900 block">{rat.pct.toFixed(1)}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-normal">{rat.sub}</p>
                      <div className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-150/40 px-1 py-0.5 rounded w-max">
                        {rat.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Stacked Bar Chart & Portal Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Portals Comparison Multi-Metric Bar Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-3xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={15} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Multi-Metric Portal Volume Comparison</h4>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal mb-1">
                Evaluate volume levels for Leads, SVS, and SVC across all portals simultaneously to visually map dropoffs.
              </p>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregatedByPortal} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="portal" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 650 }} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="leads" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="svs" name="Scheduled (SVS)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="svc" name="Conducted (SVC)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads and Bookings Trends Area Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-3xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-emerald-600" />
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Campaign Velocity &amp; Booking Trends</h4>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-normal mb-1">
                Track how pipeline velocities fluctuate day-by-day. Spikes usually correspond to weekend site-visit events.
              </p>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={aggregatedByDate} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="leads" name="Leads Generated" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.06} strokeWidth={2} />
                    <Area type="monotone" dataKey="svc" name="Visits Conducted (SVC)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.06} strokeWidth={2} />
                    <Area type="monotone" dataKey="netBookings" name="Net Bookings Locked" stroke="#10b981" fill="#10b981" fillOpacity={0.06} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Portal Efficiency Leaderboard Matrix */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-3xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-amber-50 text-amber-600 p-1.5 rounded-lg border border-amber-200/50">
                  <Award size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wide">Portal Efficiency Diagnoses & Leaderboard</h4>
                  <p className="text-[10px] text-slate-400">Discover and coordinate your most productive channels</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-lg">
                Sorted by Conversion Efficiency
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/30 text-[10px] font-bold uppercase tracking-wider text-slate-400 divide-y divide-slate-150 border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3 text-slate-500">Source Portal</th>
                    <th className="px-5 py-3 text-right">Raw Leads</th>
                    <th className="px-5 py-3 text-right">SVS Visits</th>
                    <th className="px-5 py-3 text-right">SVC Conducted</th>
                    <th className="px-5 py-3 text-right">Net Bookings</th>
                    <th className="px-5 py-3 text-right">Show-up Ratio</th>
                    <th className="px-5 py-3 text-right">Conversion Effectiveness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {aggregatedByPortal
                    .map(item => {
                      const showup = item.svs > 0 ? (item.svc / item.svs) * 100 : 0;
                      const conversion = item.leads > 0 ? (item.net / item.leads) * 100 : 0;
                      return { ...item, showup, conversion };
                    })
                    .sort((a, b) => b.conversion - a.conversion)
                    .map((item, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-indigo-600 border border-slate-200/50">
                              {idx + 1}
                            </span>
                            {item.portal}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">{item.leads.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-mono text-slate-650">{item.svs.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-amber-600">{item.svc.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">{item.net.toLocaleString()}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.showup >= 60 ? "bg-emerald-50 text-emerald-700 font-black" : item.showup >= 40 ? "bg-amber-50 text-amber-700 font-black" : "bg-red-50 text-red-700 font-semibold"
                            }`}>
                              {item.showup.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-mono text-slate-900 font-extrabold text-sm">
                              {item.conversion.toFixed(1)}%
                              <span className="text-[10px]">
                                {item.conversion >= 3 ? "🔥" : item.conversion >= 1.5 ? "⚡" : "💤"}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

