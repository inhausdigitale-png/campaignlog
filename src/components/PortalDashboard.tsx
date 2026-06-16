import React, { useMemo } from "react";
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
  Cell
} from "recharts";
import { formatIndianNumber } from "../utils/indiaHelpers";
import { Database } from "lucide-react";

interface PortalDashboardProps {
  portalReports: PortalReportRow[];
}

export default function PortalDashboard({ portalReports }: PortalDashboardProps) {
  // Aggregate data
  const aggregatedByPortal = useMemo(() => {
    const acc: Record<string, { portal: string; leads: number; svc: number }> = {};
    portalReports.forEach(row => {
      const p = row.portal;
      if (!acc[p]) acc[p] = { portal: p, leads: 0, svc: 0 };
      acc[p].leads += (row.generated || 0);
      acc[p].svc += (row.svc || 0);
    });
    return Object.values(acc);
  }, [portalReports]);

  const aggregatedByDate = useMemo(() => {
    const acc: Record<string, { date: string; leads: number; svc: number }> = {};
    portalReports.forEach(row => {
      const d = row.date;
      if (!acc[d]) acc[d] = { date: d, leads: 0, svc: 0 };
      acc[d].leads += (row.generated || 0);
      acc[d].svc += (row.svc || 0);
    });
    return Object.values(acc).sort((a,b) => a.date.localeCompare(b.date));
  }, [portalReports]);

  const totalLeads = useMemo(() => portalReports.reduce((s, r) => s + (r.generated || 0), 0), [portalReports]);
  const totalSvc = useMemo(() => portalReports.reduce((s, r) => s + (r.svc || 0), 0), [portalReports]);
  
  const COLORS = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];

  if (portalReports.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 mt-4">
        <Database className="mx-auto text-slate-300 mb-3" size={40} />
        <h3 className="text-sm font-bold text-slate-700 font-display">No Portal Data Available</h3>
        <p className="text-xs text-slate-400 mt-1">Please add data in the Data Entry view to see dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">Total Portal Leads</h3>
            <div className="text-3xl font-mono font-bold text-slate-900">{formatIndianNumber(totalLeads)}</div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">Total Site Visits Conducted (SVC)</h3>
            <div className="text-3xl font-mono font-bold text-slate-900">{formatIndianNumber(totalSvc)}</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Leads by Portal</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aggregatedByPortal} dataKey="leads" nameKey="portal" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {aggregatedByPortal.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 mb-4">SVC by Portal</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={aggregatedByPortal} dataKey="svc" nameKey="portal" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {aggregatedByPortal.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-4">Leads & SVC Over Time</h3>
        <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="leads" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} name="Leads" />
                <Area type="monotone" dataKey="svc" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="SVC" />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
