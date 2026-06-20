import React, { useState, useEffect } from "react";
import { Lead, Campaign, LeadActivityLog } from "../types";
import {
  Plus,
  Mail,
  Phone,
  Tag,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Search,
  Trash2,
  Calendar,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  User,
  History
} from "lucide-react";
import LeadActivityTimelineLogs from "./LeadActivityTimelineLogs";

interface LeadPortalProps {
  leads: Lead[];
  campaigns: Campaign[];
  onSaveLead: (lead: Lead) => Promise<void>;
  onDeleteLead: (id: string) => Promise<void>;
}

const INITIAL_LOGS: LeadActivityLog[] = [
  {
    id: "act-1",
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    action: "BULK_UPLOAD",
    actor: "gouthamarun123@gmail.com",
    entityId: "bulk-csv-99a",
    entityName: "99 Acres Import",
    details: "Synthesized and verified 14 digital leads from 99 Acres June CSV dashboard import.",
    platform: "99 Acres"
  },
  {
    id: "act-2",
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
    action: "CREATE_LEAD",
    actor: "gouthamarun123@gmail.com",
    entityId: "lead-manual-1",
    entityName: "Timothy Cooper",
    details: "Registered prospect lead manually from on-call inquiry. Set stage to 'Contacted'.",
    platform: "Direct Call"
  },
  {
    id: "act-3",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(), // 18 hours ago
    action: "UPDATE_STATUS",
    actor: "gouthamarun123@gmail.com",
    entityId: "lead-portal-3",
    entityName: "Simran Kaur",
    details: "Pipeline stage upgraded from 'New' to 'Negotiating' following callback confirmation.",
    platform: "99 Acres"
  },
  {
    id: "act-4",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    action: "UPDATE_STATUS",
    actor: "gouthamarun123@gmail.com",
    entityId: "lead-portal-4",
    entityName: "Albert Pinto",
    details: "Lead marked 'Closed Won' - booking token of ₹1,00,500 recorded for Regal Arch.",
    platform: "Magicbricks"
  }
];

export default function LeadPortal({
  leads,
  campaigns,
  onSaveLead,
  onDeleteLead,
}: LeadPortalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [campaignFilter, setCampaignFilter] = useState<string>("All");

  const [viewMode, setViewMode] = useState<"all" | "portal-only" | "logs-history">("all");
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const [activityLogs, setActivityLogs] = useState<LeadActivityLog[]>(() => {
    const saved = localStorage.getItem("g_pipeline_activity_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_LOGS;
  });

  useEffect(() => {
    localStorage.setItem("g_pipeline_activity_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addLogEntry = (
    action: LeadActivityLog["action"],
    entityId: string,
    entityName: string,
    details: string,
    platform?: string
  ) => {
    const newLog: LeadActivityLog = {
      id: "act-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      actor: "gouthamarun123@gmail.com",
      entityId,
      entityName,
      details,
      platform,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleFileImport = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
      alert("Please upload a valid .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  // Lead modal creation state
  const [showModal, setShowModal] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCampaignId, setLeadCampaignId] = useState("");
  const [leadStatus, setLeadStatus] = useState<Lead["status"]>("New");
  const [leadPlatform, setLeadPlatform] = useState("Google Ads");
  const [leadNotes, setLeadNotes] = useState("");
  const [isChgPortal, setIsChgPortal] = useState(false);
  const [portalSource, setPortalSource] = useState<Lead["portalSource"]>("Housing");

  const statuses: Lead["status"][] = ["New", "Contacted", "Negotiating", "Closed Won", "Closed Lost"];

  // Handle lead creation save
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim()) return;

    const matchedCampaign = campaigns.find((c) => c.id === leadCampaignId);

    const newLead: Lead = {
      id: "lead-" + Math.random().toString(36).substring(2, 9),
      leadName,
      email: leadEmail,
      phone: leadPhone,
      campaignId: leadCampaignId || undefined,
      campaignName: matchedCampaign ? matchedCampaign.name : undefined,
      status: leadStatus,
      platform: isChgPortal ? (portalSource || "Other") : leadPlatform,
      notes: leadNotes,
      createdAt: new Date().toISOString(),
      isPortalLead: isChgPortal,
      portalSource: isChgPortal ? portalSource : undefined,
    };

    await onSaveLead(newLead);
    addLogEntry(
      "CREATE_LEAD",
      newLead.id,
      newLead.leadName,
      `Prospect lead created manually${newLead.campaignName ? ` linked to campaign '${newLead.campaignName}'` : ""}. Initial status set to '${newLead.status}'.`,
      newLead.platform
    );
    setShowModal(false);

    // Reset fields
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadCampaignId("");
    setLeadStatus("New");
    setLeadPlatform("Google Ads");
    setLeadNotes("");
    setIsChgPortal(false);
    setPortalSource("Housing");
  };

  // Status transition helper
  const handleUpdateStatus = async (lead: Lead, newStatus: Lead["status"]) => {
    const updated: Lead = {
      ...lead,
      status: newStatus,
    };
    await onSaveLead(updated);
    addLogEntry(
      "UPDATE_STATUS",
      lead.id,
      lead.leadName,
      `Status stage updated from '${lead.status}' to '${newStatus}'.`,
      lead.platform || lead.portalSource || "Direct Connect"
    );
  };

  // CSV bulk template load / parse helper
  const loadCsvLeadsTemplate = () => {
    const template = `Lead Name,Email Address,Phone,Portal Source,Remarks\nSudheer Reddy,sudheer@reddy.com,+91 99112 23344,Housing,Wants a 3BHK flat on 5th floor or above\nSimran Kaur,simran.k@yahoo.com,+91 99334 45566,99 Acres,Requested callback on current pricing discounts\nAlbert Pinto,albert.p@outlook.com,+91 99556 67788,Magicbricks,Wants 1BHK rental lease option`;
    setCsvContent(template);
  };

  const handleParseCsvLeads = async () => {
    if (!csvContent.trim()) {
      alert("Please provide CSV content to parse.");
      return;
    }

    const lines = csvContent.split("\n");
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(",");
      if (columns.length >= 2) {
        const name = columns[0]?.trim() || "Portal Lead Prospect";
        const email = columns[1]?.trim() || `prospect_${Math.random().toString(36).substring(7)}@example.com`;
        const phone = columns[2]?.trim() || "";
        const source = (columns[3]?.trim() || "Housing") as Lead["portalSource"];
        const remarks = columns[4]?.trim() || "Uploaded from portal database sheet.";

        const key: Lead = {
          id: "lead-portal-" + Math.random().toString(36).substring(2, 9),
          leadName: name,
          email,
          phone,
          status: "New",
          platform: source || "Housing",
          notes: remarks,
          createdAt: new Date().toISOString(),
          isPortalLead: true,
          portalSource: source
        };

        await onSaveLead(key);
        count++;
      }
    }

    alert(`Successfully processed and uploaded ${count} portal leads!`);
    addLogEntry(
      "BULK_UPLOAD",
      "bulk-csv-" + Math.random().toString(36).substring(2, 7),
      `${count} Portal Leads`,
      `Verified and imported a bundle of ${count} prospective digital leads into pipeline using CSV spreadsheet parser.`,
      "CSV Bulk Upload"
    );
    setCsvContent("");
    setShowUploadSection(false);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesCampaign = campaignFilter === "All" || l.campaignId === campaignFilter;

    // View constraint: portal-only can view portal leads ONLY
    const matchesViewMode = viewMode === "all" || l.isPortalLead === true;

    return matchesSearch && matchesStatus && matchesCampaign && matchesViewMode;
  });

  // Export current filtered leads list view to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Lead Name",
      "Email Address",
      "Phone Number",
      "Campaign ID",
      "Campaign Name",
      "Status",
      "Platform/Source",
      "Notes/Remarks",
      "Created At",
      "Lead Origin"
    ];

    const csvRows = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",")];

    filteredLeads.forEach((l) => {
      const rowData = [
        l.id,
        `"${l.leadName.replace(/"/g, '""')}"`,
        `"${l.email.replace(/"/g, '""')}"`,
        `"${l.phone.replace(/"/g, '""')}"`,
        `"${(l.campaignId || "").replace(/"/g, '""')}"`,
        `"${(l.campaignName || "").replace(/"/g, '""')}"`,
        `"${l.status}"`,
        `"${(l.platform || "").replace(/"/g, '""')}"`,
        `"${(l.notes || "").replace(/"/g, '""')}"`,
        l.createdAt,
        l.isPortalLead ? "Portal Upload" : "Campaign Generated"
      ];
      csvRows.push(rowData.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `portal_leads_database_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Prospect & Portal Lead Core</h2>
            <span className="p-1 px-2 border border-slate-200 bg-slate-50 text-[10px] text-indigo-700 font-bold font-mono rounded-full uppercase tracking-wider">
              {viewMode === "portal-only" ? "Viewing Portal Uploads Only" : "Viewing Unified Database"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor prospects generated from campaigns or bulk-uploaded portals (Housing, Magicbricks, etc.) to record transactional pipeline updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            id="export-csv-btn"
            onClick={exportToCSV}
            className="flex items-center gap-1.5 bg-emerald-650 hover:bg-emerald-700 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer grow md:grow-0 justify-center"
            type="button"
          >
            <FileSpreadsheet size={14} />
            <span>Export Database to CSV</span>
          </button>
          <button
            onClick={() => setShowUploadSection(!showUploadSection)}
            className="flex items-center gap-1.5 border border-indigo-250 bg-indigo-50/20 hover:bg-indigo-50 font-bold text-xs text-indigo-700 px-4 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer grow md:grow-0 justify-center"
            type="button"
          >
            <Upload size={14} />
            Bulk Upload Portal Leads
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer grow md:grow-0 justify-center"
            type="button"
          >
            <Plus size={16} />
            Register Manual Lead
          </button>
        </div>
      </div>

      {/* CSV Bulk Upload Section */}
      {showUploadSection && (
        <div className="bg-white border border-indigo-150 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in" id="portal-leads-upload-zone">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="text-indigo-650" size={16} />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Bulk Upload Portal Leads CSV Worksheet</h4>
            </div>
            <button
              onClick={loadCsvLeadsTemplate}
              className="text-[10.5px] text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Load sample portal leads template
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Upload an actual <span className="font-bold text-slate-800">.csv file</span> or paste raw comma-separated records representing target leads extracted from digital portals. The parser will map row columns to contact profiles and tag them with <span className="font-bold text-indigo-600">isPortalLead: true</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drag & Drop Zone */}
            <div 
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[140px] ${
                isDragOver 
                  ? "border-indigo-500 bg-indigo-50/40 text-indigo-705 text-indigo-700" 
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/40 bg-slate-50/20 text-slate-500"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileImport(file);
              }}
              onClick={() => document.getElementById("csv-file-picker-lead")?.click()}
            >
              <input 
                id="csv-file-picker-lead"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileImport(file);
                }}
              />
              <FileSpreadsheet className={`mb-2 ${isDragOver ? "text-indigo-650 animate-bounce" : "text-slate-405 text-slate-400"}`} size={30} />
              <p className="text-xs font-black text-slate-850">
                Drag & drop your CSV file here, or <span className="text-indigo-600 underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-450 mt-1">
                Supports standard CSV datasets with proper columns
              </p>
            </div>

            {/* Paste/Preview text editor area */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider block">Raw CSV Editor / Text Box Preview</label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Lead Name,Email Address,Phone,Portal Source,Remarks&#10;Abhik Sen,abhik@housing.com,+91 99999 88888,Housing,Interested in solar-roof villas..."
                className="w-full h-28 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-705 outline-hidden focus:border-indigo-500 resize-none flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setCsvContent("");
                setShowUploadSection(false);
              }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseCsvLeads}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-all"
            >
              Upload Portal Leads
            </button>
          </div>
        </div>
      )}

      {/* View Mode Switching Tab Segment */}
      <div className="flex p-1 bg-slate-100 rounded-lg max-w-xl gap-1">
        <button
          onClick={() => setViewMode("all")}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            viewMode === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
          }`}
        >
          <span>All Leads Database</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-mono font-bold">{leads.length}</span>
        </button>
        <button
          onClick={() => setViewMode("portal-only")}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer relative flex items-center justify-center gap-1.5 ${
            viewMode === "portal-only" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
          }`}
        >
          <span>Uploaded Portal Leads</span>
          <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[10px] rounded font-mono font-bold">
            {leads.filter(l => l.isPortalLead).length}
          </span>
          {leads.some((l) => l.isPortalLead) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => setViewMode("logs-history")}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-md transition-all cursor-pointer relative flex items-center justify-center gap-1.5 ${
            viewMode === "logs-history" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-750"
          }`}
        >
          <Clock size={13} className="text-indigo-600" />
          <span>Activity Log &amp; History</span>
          <span className="px-1.5 py-0.2 bg-violet-50 text-violet-700 text-[10px] rounded font-mono font-bold">{activityLogs.length}</span>
        </button>
      </div>

      {viewMode === "logs-history" ? (
        <LeadActivityTimelineLogs activityLogs={activityLogs} setActivityLogs={setActivityLogs} />
      ) : (
        <>

      {/* Filter and Search Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search leads by name, email, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          />
        </div>

        {/* Status filters */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
          >
            <option value="All">All Pipeline Stages</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Campaign Filter connection */}
        <div>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium"
          >
            <option value="All">All Source Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pipeline Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map((s) => {
          const count = leads.filter((l) => l.status === s).length;
          let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
          if (s === "New") colorClass = "bg-blue-50 text-blue-700 border-blue-200";
          if (s === "Contacted") colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
          if (s === "Negotiating") colorClass = "bg-amber-50 text-amber-700 border-amber-200";
          if (s === "Closed Won") colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          if (s === "Closed Lost") colorClass = "bg-rose-50 text-rose-500 border-rose-200";

          return (
            <div key={s} className={`p-3 rounded-xl border ${colorClass} text-center flex flex-col justify-between`}>
              <span className="text-[10px] font-bold uppercase tracking-wider font-display">{s}</span>
              <span className="text-xl font-bold font-mono mt-1">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Pipeline Main Grid List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-205 border-slate-200 text-slate-500 font-semibold font-display">
                <th className="p-4">Contact Details</th>
                <th className="p-4">Origin Campaign & Channel</th>
                <th className="p-4">Notes & Remarks</th>
                <th className="p-4">Acquisition Date</th>
                <th className="p-4">Pipeline Status Action</th>
                <th className="p-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-sans">
                    No leads registered matching selectors. Use the form to file lead contacts.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-all">
                    {/* Name, email, phone */}
                    <td className="p-4 space-y-1.5">
                      <div className="font-bold text-slate-900 font-display text-sm">{l.leadName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Mail size={11} className="text-slate-400" />
                        <span>{l.email}</span>
                      </div>
                      {l.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          <span>{l.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Source campaign and platform logo */}
                    <td className="p-4 space-y-1">
                      <div className="text-slate-700 font-semibold">{l.campaignName || "External Portal Entry"}</div>
                      <span className="inline-block text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">
                        {l.platform}
                      </span>
                    </td>

                    {/* Notes remarks */}
                    <td className="p-4 max-w-xs">
                      <div className="flex items-start gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100/50">
                        <MessageSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-600 line-clamp-3">
                          {l.notes || "No remarks entered."}
                        </span>
                      </div>
                    </td>

                    {/* Acquisition timestamp */}
                    <td className="p-4 text-slate-500 text-[11px] white-space-nowrap font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Stage selector dropdown */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={l.status}
                          onChange={(e) => handleUpdateStatus(l, e.target.value as Lead["status"])}
                          className={`text-[11px] px-2.5 py-1.5 border rounded-lg font-bold ${
                            l.status === "Closed Won"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : l.status === "Closed Lost"
                              ? "bg-rose-50 text-rose-500 border-rose-200"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Delete action */}
                    <td className="p-4 text-center">
                      <button
                        onClick={async () => {
                          if (confirm(`Do you wish to remove lead contact "${l.leadName}"?`)) {
                            await onDeleteLead(l.id);
                            addLogEntry(
                              "DELETE_LEAD",
                              l.id,
                              l.leadName,
                              `Lead prospect '${l.leadName}' was deleted and removed from database completely.`,
                              l.platform || "Portal"
                            );
                          }
                        }}
                        className="p-1.5 border border-slate-150 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-slate-100 rounded-lg shrink-0 cursor-pointer transition-all"
                        title="Delete Lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Manual creation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-100 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold font-display text-slate-800 mb-1">
              Add Prospective Lead Contact
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Manually register prospective lead closures captured from landing page portals or other marketing pipelines.
            </p>

            <form onSubmit={handleSubmitLead} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Timothy Cooper"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                />
              </div>

              {/* Email / Phone group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tcooper@industrial.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (312) 555-0199"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>

              {/* Campaign connection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Source Campaign Link</label>
                <select
                  value={leadCampaignId}
                  onChange={(e) => setLeadCampaignId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
                >
                  <option value="">None / External Direct Entry</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.platform})
                    </option>
                  ))}
                </select>
              </div>

              {/* Portal Lead Flag */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChgPortal}
                    onChange={(e) => setIsChgPortal(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Is this lead uploaded/received from a portal?</span>
                </label>
                {isChgPortal && (
                  <div className="animate-fade-in space-y-1 pt-1 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-500">Portal Source Platform</label>
                    <select
                      value={portalSource}
                      onChange={(e) => setPortalSource(e.target.value as Lead["portalSource"])}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                    >
                      <option value="Housing">Housing</option>
                      <option value="99 Acres">99 Acres</option>
                      <option value="Magicbricks">Magicbricks</option>
                      <option value="Roof&floor">Roof&floor</option>
                      <option value="Other">Other Portal</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Status and Acquisition Platform */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isChgPortal ? "Acquisition Platform (Auto)" : "Acquisition Network"}
                  </label>
                  {isChgPortal ? (
                    <input
                      type="text"
                      readOnly
                      value={portalSource || "Other"}
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-medium"
                    />
                  ) : (
                    <select
                      value={leadPlatform}
                      onChange={(e) => setLeadPlatform(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
                    >
                      <option value="Google Ads">Google Ads</option>
                      <option value="Meta (Facebook)">Meta (Facebook)</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Status Stage</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as Lead["status"])}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lead notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Follow-up Notes / Remarks description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Requested pricing PDF catalog. Prefers afternoon communication."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 resize-none font-sans"
                />
              </div>

              {/* Control buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  Register Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
