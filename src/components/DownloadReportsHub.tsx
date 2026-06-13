import React, { useState } from "react";
import { Campaign, Lead, PortalReportRow, TargetBudgetRow, CreativeAsset, MetricComparison, CampaignReport } from "../types";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Search,
  Filter,
  Layers,
  Database,
  Users,
  Megaphone,
  Briefcase,
  Coins,
  TrendingUp,
  FileCheck2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2
} from "lucide-react";

interface DownloadReportsHubProps {
  campaigns: Campaign[];
  leads: Lead[];
  portalReports: PortalReportRow[];
  targetBudgets: TargetBudgetRow[];
  creatives: CreativeAsset[];
  metricComparisons: MetricComparison[];
  campaignReports: CampaignReport[];
}

type ReportType = 'campaigns' | 'leads' | 'portal_reports' | 'target_budgets' | 'creatives' | 'comparisons' | 'campaign_reports';

export default function DownloadReportsHub({
  campaigns,
  leads,
  portalReports,
  targetBudgets,
  creatives,
  metricComparisons,
  campaignReports,
}: DownloadReportsHubProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('campaigns');
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<'csv' | 'json'>('csv');
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Helper: Escape CSV fields and convert array of objects to CSV string
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return "";
    
    // Extract keys/headers excluding metadata fields if possible, or use all
    const headers = Object.keys(data[0]);
    
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(fieldName => {
          let value = row[fieldName];
          if (value === undefined || value === null) {
            value = "";
          }
          const stringified = typeof value === "object" ? JSON.stringify(value) : String(value);
          // Escape quotes
          const escaped = stringified.replace(/"/g, '""');
          if (escaped.includes(",") || escaped.includes('"') || escaped.includes('\n')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(",")
      )
    ];
    return csvRows.join("\n");
  };

  // Helper: Trigger browser file download
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setLastDownloaded(filename);
    setTimeout(() => setLastDownloaded(null), 3000);
  };

  // Get active report data based on selection
  const getRawReportData = (type: ReportType): any[] => {
    switch (type) {
      case 'campaigns':
        return campaigns;
      case 'leads':
        return leads;
      case 'portal_reports':
        return portalReports;
      case 'target_budgets':
        return targetBudgets;
      case 'creatives':
        return creatives;
      case 'comparisons':
        return metricComparisons;
      case 'campaign_reports':
        return campaignReports;
      default:
        return [];
    }
  };

  const getReportName = (type: ReportType): string => {
    switch (type) {
      case 'campaigns':
        return "Ad_Campaigns_Performance_Report";
      case 'leads':
        return "Sales_Leads_Database";
      case 'portal_reports':
        return "Daily_SVC_Bookings_Matrix";
      case 'target_budgets':
        return "Weekly_Target_Budget_Ledger";
      case 'creatives':
        return "Creative_Variations_Performance_Analysis";
      case 'comparisons':
        return "Comparative_Metrics_Analysis";
      case 'campaign_reports':
        return "Uploaded_Performance_Sheets";
      default:
        return "Exported_Report";
    }
  };

  const getTitle = (type: ReportType): string => {
    switch (type) {
      case 'campaigns':
        return "Active Ad Campaigns";
      case 'leads':
        return "Sales Lead Profiles";
      case 'portal_reports':
        return "Daily Site Visits (SVC)";
      case 'target_budgets':
        return "Weekly Target Ledger";
      case 'creatives':
        return "Creative Copy Variations";
      case 'comparisons':
        return "Before/After Comparative Metrics";
      case 'campaign_reports':
        return "Uploaded Sheets Database";
    }
  };

  // Helper: Retrieve the logical date from a record depending on its collection type
  const getRowDateString = (row: any, type: ReportType): string | null => {
    if (type === 'portal_reports' && row.date) return row.date;
    if (type === 'campaign_reports' && row.date) return row.date;
    if (type === 'campaigns' && row.startDate) return row.startDate;
    if (row.createdAt) return row.createdAt;
    if (row.date) return row.date;
    return null;
  };

  // Helper: Check if a date string falls within the selected start and end range
  const checkDateRange = (dateStr: string | null): boolean => {
    if (!dateStr) return true;
    try {
      const itemTime = new Date(dateStr).getTime();
      if (isNaN(itemTime)) return true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (itemTime < start.getTime()) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (itemTime > end.getTime()) return false;
      }
    } catch (e) {
      // Return true if parsing fails to avoid missing data unexpectedly
    }
    return true;
  };

  // Filter raw data using search text & date constraints
  const getFilteredReportData = (type: ReportType): any[] => {
    const data = getRawReportData(type);
    
    // Apply date range filters
    let filtered = data;
    if (startDate || endDate) {
      filtered = data.filter(row => {
        const rowDateStr = getRowDateString(row, type);
        return checkDateRange(rowDateStr);
      });
    }

    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  };

  // Metrics summary
  const getReportStats = (type: ReportType) => {
    const raw = getRawReportData(type);
    switch (type) {
      case 'campaigns':
        const totalSpend = raw.reduce((sum, c) => sum + (c.spend || 0), 0);
        return { count: raw.length, mainStat: `$${totalSpend.toLocaleString()}`, label: "Total Spend" };
      case 'leads':
        const contacted = raw.filter((l: Lead) => l.status === "Contacted").length;
        return { count: raw.length, mainStat: contacted, label: "Contacted Leads" };
      case 'portal_reports':
        const totalSvc = raw.reduce((sum, r: PortalReportRow) => sum + (r.svc || 0), 0);
        return { count: raw.length, mainStat: totalSvc, label: "Total SVC Booked" };
      case 'target_budgets':
        const targetSpend = raw.reduce((sum, t: TargetBudgetRow) => sum + (t.budget || 0), 0);
        return { count: raw.length, mainStat: `$${targetSpend.toLocaleString()}`, label: "Target Budget" };
      case 'creatives':
        const hasScores = raw.filter((c: CreativeAsset) => c.aiScore !== undefined).length;
        return { count: raw.length, mainStat: hasScores, label: "A.I. Graded Assets" };
      case 'comparisons':
        const positive = raw.filter((c: MetricComparison) => c.improved === "Yes").length;
        return { count: raw.length, mainStat: positive, label: "Positive Outcomes" };
      case 'campaign_reports':
        const sheetsAvgSpend = raw.reduce((sum, r: CampaignReport) => sum + (r.amountSpend || 0), 0);
        return { count: raw.length, mainStat: `$${sheetsAvgSpend.toLocaleString()}`, label: "Total Synced Spend" };
      default:
        return { count: raw.length, mainStat: "-", label: "N/A" };
    }
  };

  // Handle export processing and download
  const handleExport = (type: ReportType) => {
    const dataToExport = getFilteredReportData(type);
    if (dataToExport.length === 0) {
      alert("No data available to download. Please customize your search or add records first.");
      return;
    }

    const filename = `${getReportName(type)}_${new Date().toISOString().split('T')[0]}`;

    if (downloadFormat === "json") {
      const content = JSON.stringify(dataToExport, null, 2);
      downloadFile(content, `${filename}.json`, 'application/json');
    } else {
      const content = convertToCSV(dataToExport);
      downloadFile(content, `${filename}.csv`, 'text/csv;charset=utf-8;');
    }
  };

  // Columns helper for beautiful preview render
  const getPreviewColumns = (type: ReportType): string[] => {
    const filtered = getFilteredReportData(type);
    if (filtered.length === 0) return [];
    
    // Filter down to interesting visible columns
    const allKeys = Object.keys(filtered[0]);
    const skipped = ["id", "createdAt", "updatedAt", "creativeImageUrl", "notes", "creativeBase64"];
    return allKeys.filter(k => !skipped.includes(k)).slice(0, 7);
  };

  const reportsList: { key: ReportType; title: string; desc: string; icon: any; color: string }[] = [
    {
      key: 'campaigns',
      title: "Active Campaigns",
      desc: "Live platforms budgets, spendings, reaches, clicks, and conversion rates.",
      icon: Megaphone,
      color: "bg-indigo-50 border-indigo-200 text-indigo-700"
    },
    {
      key: 'leads',
      title: "Lead Profiles Database",
      desc: "Detailed potential buyer profiles, contact identifiers, status trackers, and campaign sources.",
      icon: Users,
      color: "bg-emerald-50 border-emerald-200 text-emerald-700"
    },
    {
      key: 'portal_reports',
      title: "Daily site visits matrix",
      desc: "Daily reporting audit sheets, site visit (SVC) metrics, and system imports.",
      icon: Database,
      color: "bg-cyan-50 border-cyan-200 text-cyan-700"
    },
    {
      key: 'target_budgets',
      title: "Weekly Target Ledger",
      desc: "Budget allocations, cost benchmarks, expected SLA target counts, and variance thresholds.",
      icon: Coins,
      color: "bg-amber-50 border-amber-200 text-amber-700"
    },
    {
      key: 'creatives',
      title: "Creative Generations Hub",
      desc: "Generated Gemini copy concepts, visual specifications, performance grades, and testing metrics.",
      icon: Briefcase,
      color: "bg-violet-50 border-violet-200 text-violet-700"
    },
    {
      key: 'comparisons',
      title: "Comparative Performance Matrix",
      desc: "Before/After experimental tests, follow-up actions, and improvement status.",
      icon: TrendingUp,
      color: "bg-rose-50 border-rose-200 text-rose-700"
    },
    {
      key: 'campaign_reports',
      title: "Uploaded sheet records",
      desc: "Raw ingested bulk CSV data tracking dates, impressions, target vs achieved counts, and adsets.",
      icon: FileSpreadsheet,
      color: "bg-teal-50 border-teal-200 text-teal-700"
    }
  ];

  const activeFilteredData = getFilteredReportData(selectedReport);
  const activePreviewCols = getPreviewColumns(selectedReport);
  const selectedStats = getReportStats(selectedReport);

  return (
    <div className="space-y-6">
      {/* Welcome Title Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 border border-slate-100 text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50/50 rounded-md">
              Export Center
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium font-sans">Data Download Portal</span>
          </div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
            Exclusive Report Downloads &amp; Exporters
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select, customize, and export any database collection directly to a highly-compatible format.
          </p>
        </div>
        
        {lastDownloaded && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-2 px-3.5 rounded-xl animate-fade-in leading-relaxed">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>Success: {lastDownloaded} downloaded!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Report Selections and Config Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3 font-sans">
              Choose Database Report Category
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reportsList.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedReport === item.key;
                const stats = getReportStats(item.key);
                
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setSelectedReport(item.key);
                      setSearchQuery("");
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-50 border-indigo-600 ring-1 ring-indigo-600"
                        : "bg-white hover:bg-slate-50/40 border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`p-1.5 rounded-lg border ${item.color}`}>
                          <IconComponent size={14} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 font-sans tracking-tight">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-2 text-[10px] text-slate-450 font-mono">
                      <span>Total Sync: <strong>{stats.count} records</strong></span>
                      <span className="bg-slate-100 py-0.5 px-1.5 rounded text-slate-600 font-bold overflow-hidden truncate max-w-[85px]" title={`${stats.label}: ${stats.mainStat}`}>
                        {stats.mainStat}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Export Options Box */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-left h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck2 size={16} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Export Settings</h3>
              </div>

              {/* Selected report name display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Selected Category</span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">
                  {getTitle(selectedReport)}
                </span>
                <span className="text-[10px] font-mono text-indigo-600 block mt-1 font-bold">
                  {getReportName(selectedReport)}
                </span>
              </div>

              {/* Date range picker configuration */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-600" />
                    Filter Date Range
                  </label>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="text-[10px] text-rose-650 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Clear Range
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-450 block mb-0.5">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-1.5 text-[11px] bg-white border border-slate-250 hover:border-slate-350 rounded-md text-slate-755 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-450 block mb-0.5">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-1.5 text-[11px] bg-white border border-slate-250 hover:border-slate-350 rounded-md text-slate-755 outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Export Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDownloadFormat('csv')}
                    className={`flex-1 py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      downloadFormat === 'csv'
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-3xs"
                        : "bg-white hover:bg-slate-50/50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <FileSpreadsheet size={14} className={downloadFormat === 'csv' ? "text-indigo-600" : ""} />
                    CSV Spreadsheet
                  </button>
                  <button
                    onClick={() => setDownloadFormat('json')}
                    className={`flex-1 py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      downloadFormat === 'json'
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-3xs"
                        : "bg-white hover:bg-slate-50/50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <FileJson size={14} className={downloadFormat === 'json' ? "text-indigo-600" : ""} />
                    JSON Structured
                  </button>
                </div>
              </div>

              {/* Summary stat box */}
              <div className="bg-indigo-50/20 border border-indigo-100/60 p-3 rounded-lg flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="text-slate-500 block">Records to download:</span>
                  <span className="text-[10px] text-slate-400">({searchQuery ? "Filtered query" : "Whole database"})</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-indigo-700 block leading-none">
                    {activeFilteredData.length}
                  </span>
                  <span className="text-[9.5px] font-bold text-indigo-500 font-sans">rows</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleExport(selectedReport)}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Download size={14} />
              Export &amp; Download Document (.{(downloadFormat).toUpperCase()})
            </button>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Real-Time Live Preview Pane */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in text-left">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-600 animate-pulse shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-850 uppercase tracking-wider block">
                Interactive Pre-Download Preview List
              </span>
              <p className="text-[10.5px] text-slate-500 font-sans leading-none mt-0.5">
                Review actual data output and verify headers / values before exporting document.
              </p>
            </div>
          </div>

          {/* Inline search filter */}
          <div className="relative w-full sm:w-64">
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search / Filter preview..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7.5 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 outline-hidden transition-all"
            />
          </div>
        </div>

        {activeFilteredData.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Info size={32} className="mx-auto text-slate-200" />
            <p className="text-xs font-bold font-sans text-slate-500">No matching records found in this category.</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Please enter records in the main visual panels or remove the filter query to preview live snapshot.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-600 font-bold border-b border-slate-150 uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4 whitespace-nowrap"># Row</th>
                    {activePreviewCols.map((col) => (
                      <th key={col} className="p-3 capitalize whitespace-nowrap">
                        {col.replace(/([A-Z])/g, ' $1').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeFilteredData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      {activePreviewCols.map((col) => {
                        const val = row[col];
                        let renderedVal = String(val);
                        if (typeof val === "object" && val !== null) {
                          renderedVal = JSON.stringify(val);
                        }
                        
                        // Custom aesthetics rules per column type
                        let isCurrency = col.toLowerCase().includes("spend") || col.toLowerCase().includes("budget") || col.toLowerCase().includes("cost");
                        let isStatus = col.toLowerCase() === "status";
                        let isPercentage = col.toLowerCase() === "ctr" || col.toLowerCase().includes("percent");
                        
                        return (
                          <td key={col} className="p-3">
                            {isCurrency ? (
                              <span className="font-bold text-emerald-700">
                                ${Number(val) ? Number(val).toLocaleString() : renderedVal}
                              </span>
                            ) : isPercentage ? (
                              <span className="font-bold text-indigo-650 font-mono">
                                {renderedVal}%
                              </span>
                            ) : isStatus ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] uppercase font-bold border ${
                                renderedVal === "active" || renderedVal === "completed" || renderedVal === "Yes"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                  : renderedVal === "paused" || renderedVal === "No"
                                  ? "bg-amber-50 text-amber-850 border-amber-100"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}>
                                {renderedVal}
                              </span>
                            ) : (
                              <span className="text-slate-700 font-medium">
                                {renderedVal.length > 80 ? `${renderedVal.substring(0, 80)}...` : renderedVal}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeFilteredData.length > 10 && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10.5px] font-semibold text-slate-500">
                💡 Showing first 10 rows. The downloaded file will contiguously contain all{" "}
                <span className="text-indigo-700 font-bold">{activeFilteredData.length} records</span> on active selection!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
