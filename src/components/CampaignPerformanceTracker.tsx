import React, { useState, useRef } from "react";
import { CampaignPerformance, UserRolePermission, ChangeLogEntry } from "../types";
import { formatINR } from "../utils/indiaHelpers";
import { 
  FileSpreadsheet, 
  Upload, 
  PlusSquare, 
  Trash2, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Activity, 
  Folder, 
  Layers, 
  HelpCircle,
  FileCheck,
  Sparkles,
  Info,
  Clock,
  History,
  User
} from "lucide-react";

interface CampaignPerformanceTrackerProps {
  performances: CampaignPerformance[];
  onSavePerformance: (perf: CampaignPerformance) => Promise<void>;
  onDeletePerformance: (id: string) => Promise<void>;
  rolePermission?: UserRolePermission;
  changeLogs?: ChangeLogEntry[];
  onSaveChangeLog?: (chg: ChangeLogEntry) => Promise<void>;
  onDeleteChangeLog?: (id: string) => Promise<void>;
}

export default function CampaignPerformanceTracker({
  performances,
  onSavePerformance,
  onDeletePerformance,
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
  changeLogs = [],
  onSaveChangeLog,
  onDeleteChangeLog
}: CampaignPerformanceTrackerProps) {
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [projectFilter, setProjectFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"metrics" | "changelog">("metrics");

  // New Change Log entry state
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [changesHappenedText, setChangesHappenedText] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [editedByText, setEditedByText] = useState(rolePermission?.role || "Admin");
  const [showAddLogForm, setShowAddLogForm] = useState(false);

  // Extended Change Log Form States (Audience, Budget, Creative inputs)
  const [performanceIndicator, setPerformanceIndicator] = useState("CPL Improvement");
  const [changeCategory, setChangeCategory] = useState<"Audience" | "Budget" | "Creative">("Audience");
  
  // Audience details states
  const [audienceTargetLocations, setAudienceTargetLocations] = useState("");
  const [audienceAgeGroups, setAudienceAgeGroups] = useState("");
  const [audienceInterests, setAudienceInterests] = useState("");
  
  // Budget details states
  const [budgetPreviousDaily, setBudgetPreviousDaily] = useState<number | "">("");
  const [budgetNewDaily, setBudgetNewDaily] = useState<number | "">("");
  
  // Creative details states
  const [creativeNameState, setCreativeNameState] = useState("");
  const [creativeHeadlineState, setCreativeHeadlineState] = useState("");
  const [creativeBodyTextState, setCreativeBodyTextState] = useState("");
  const [creativeImageUrl, setCreativeImageUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSavingChgLog, setIsSavingChgLog] = useState(false);

  // Dynamic lightbox zoom modal for creatives
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Row creative upload helper and base64 parsing
  const handleRowUpload = async (e: React.ChangeEvent<HTMLInputElement>, perf: CampaignPerformance) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const updated: CampaignPerformance = {
        ...perf,
        creativeImageUrl: base64,
        creativeUpdatedAt: new Date().toISOString(),
        creativeNewUpdatedFlag: true
      };
      await onSavePerformance(updated);
    };
    reader.readAsDataURL(file);
  };

  // Dismiss new creative badge
  const handleDismissNewFlag = async (perf: CampaignPerformance) => {
    const updated: CampaignPerformance = {
      ...perf,
      creativeNewUpdatedFlag: false
    };
    await onSavePerformance(updated);
  };

  // CSV parsing feedback
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry Form States
  const [campaignName, setCampaignName] = useState("");
  const [adsetName, setAdsetName] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [leads, setLeads] = useState<number>(0);
  const [impressions, setImpressions] = useState<number>(0);
  const [reach, setReach] = useState<number>(0);
  const [ctr, setCtr] = useState<number>(0);
  const [amountSpend, setAmountSpend] = useState<number>(0);
  const [clicks, setClicks] = useState<number>(0);
  const [svc, setSvc] = useState<number>(0);
  const [booked, setBooked] = useState<number>(0);

  // Load the CSV mock template in the text box
  const loadCsvTemplate = () => {
    const template = `Campaign Name,Adset Name,Ad Account ID,Project Name,Leads,Impression,Reach,CTR,Amount Spend,Clicks,SVC,Booked
Meta Apartment - Lead Gen,LAL_RealEstate_Buyers,act_40391039,Grand Horizon Residence,45,61200,32000,1.45,35000,887,14,3
Google Premium Villas,Search_Exact_Solar,act_20938491,Oakridge Estate,28,19800,9500,2.94,42000,582,10,1
Meta B2B Commercial,CEO_Founders_Target,act_88491204,Capital Tower IT,14,9400,4300,3.25,28000,305,6,0`;
    setCsvText(template);
    setBulkFeedback("Template loaded! Review edit or add custom rows, then press 'Parse & Import'.");
  };

  const downloadCsvTemplateFile = () => {
    const headers = "Campaign Name,Adset Name,Ad Account ID,Project Name,Leads,Impression,Reach,CTR,Amount Spend,Clicks,SVC,Booked\n";
    const sampleRow1 = "Meta Apartment - Lead Gen,LAL_RealEstate_Buyers,act_40391039,Grand Horizon Residence,45,61200,32000,1.45,35000,887,14,3\n";
    const sampleRow2 = "Google Premium Villas,Search_Exact_Solar,act_20938491,Oakridge Estate,28,19800,9500,2.94,42000,582,10,1\n";
    
    const blob = new Blob([headers + sampleRow1 + sampleRow2], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "campaign_performance_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parsing pasted CSV data
  const handleBulkParse = async () => {
    if (!csvText.trim()) {
      setBulkFeedback("Error: CSV input is empty. Please paste valid comma-separated text values.");
      return;
    }

    try {
      const lines = csvText.split("\n");
      if (lines.length < 2) {
        setBulkFeedback("Error: Data must contain at least a header line and one records row.");
        return;
      }

      // Check header values
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const hasCampaign = headers.includes("campaign name");
      if (!hasCampaign) {
        setBulkFeedback("Error: Columns must have 'Campaign Name', 'Adset Name', 'Ad Account ID' and metrics.");
        return;
      }

      let parsedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < 4) continue;

        // Try to map by expected columns indexes
        // Format: Campaign Name,Adset Name,Ad Account ID,Project Name,Leads,Impression,Reach,CTR,Amount Spend,Clicks,SVC,Booked
        const item: CampaignPerformance = {
          id: "perf-temp-" + Math.random().toString(36).substring(2, 9),
          campaignName: cols[0] || "Unnamed Campaign",
          adsetName: cols[1] || "Unnamed Adset",
          adAccountId: cols[2] || "act_unknown",
          projectName: cols[3] || "General Solar",
          leads: parseInt(cols[4]) || 0,
          impression: parseInt(cols[5]) || 0,
          reach: parseInt(cols[6]) || 0,
          ctr: parseFloat(cols[7]) || 0,
          amountSpend: parseFloat(cols[8]) || 0,
          clicks: parseInt(cols[9]) || 0,
          svc: parseInt(cols[10]) || 0,
          booked: parseInt(cols[11]) || 0,
          createdAt: new Date().toISOString()
        };

        // Calculate dynamic cost per lead if leads > 0
        if (item.leads > 0) {
          item.cplCpa = Math.round(item.amountSpend / item.leads);
        } else {
          item.cplCpa = 0;
        }

        await onSavePerformance(item);
        parsedCount++;
      }

      setBulkFeedback(`Successfully imported ${parsedCount} campaign performance tracking records!`);
      setCsvText("");
      setTimeout(() => setShowBulkUpload(false), 3000);
    } catch (err: any) {
      setBulkFeedback(`Error parsing CSV text: ${err.message || err}`);
    }
  };

  // Handles raw CSV file import selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvText(text);
        setBulkFeedback(`File "${file.name}" loaded successfully (${text.split("\n").length} lines detected). Review below and click Import.`);
      }
    };
    reader.readAsText(file);
  };

  // Manual performance entry submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !adsetName || !projectName) {
      alert("Please provide Campaign, Adset, and Project names.");
      return;
    }

    const calculatedCpl = leads > 0 ? Math.round(amountSpend / leads) : 0;

    const item: CampaignPerformance = {
      id: "perf-temp-" + Math.random().toString(36).substring(2, 9),
      campaignName,
      adsetName,
      adAccountId: adAccountId || "act_manual",
      projectName,
      leads,
      impression: impressions,
      reach,
      ctr,
      amountSpend,
      clicks,
      svc,
      booked,
      cplCpa: calculatedCpl,
      createdAt: new Date().toISOString()
    };

    try {
      await onSavePerformance(item);
      // Reset
      setCampaignName("");
      setAdsetName("");
      setAdAccountId("");
      setProjectName("");
      setLeads(0);
      setImpressions(0);
      setReach(0);
      setCtr(0);
      setAmountSpend(0);
      setClicks(0);
      setSvc(0);
      setBooked(0);
      setShowAddForm(false);
      alert("Manual campaign performance record submitted and synchronized!");
    } catch (err: any) {
      alert(`Failed to save record: ${err.message}`);
    }
  };

  // Filters calculations
  const uniqueProjects = Array.from(new Set(performances.map((p) => p.projectName))).filter(Boolean);

  const filteredPerformances = performances.filter((p) => {
    const matchesProject = projectFilter === "All" || p.projectName === projectFilter;
    const matchesSearch =
      p.campaignName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.adsetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.adAccountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  });

  // Performance calculations
  const totalSpend = filteredPerformances.reduce((acc, p) => acc + p.amountSpend, 0);
  const totalLeads = filteredPerformances.reduce((acc, p) => acc + p.leads, 0);
  const totalImpressions = filteredPerformances.reduce((acc, p) => acc + p.impression, 0);
  const totalClicks = filteredPerformances.reduce((acc, p) => acc + p.clicks, 0);
  const totalSvc = filteredPerformances.reduce((acc, p) => acc + p.svc, 0);
  const totalBooked = filteredPerformances.reduce((acc, p) => acc + p.booked, 0);
  const avgCplCpa = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const avgCtr = totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  return (
    <div id="campaign-performance-section" className="space-y-6">
      
      {/* Tab Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-2 border border-slate-100 text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50/50 rounded-md">
              Tracker Module
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium font-sans">Campaign Upload &amp; Change Log</span>
          </div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
            Campaign Upload &amp; Change Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV sheets or log manual metrics for campaigns, adsets, impressions, clicks, SVC, bookings, and calculated CPL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="perf-bulk-csv-btn"
            onClick={() => {
              setShowBulkUpload(!showBulkUpload);
              setShowAddForm(false);
              setBulkFeedback(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Upload size={13} />
            Bulk CSV Upload
          </button>
          
          <button
            id="perf-manual-add-btn"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowBulkUpload(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusSquare size={13} />
            Log Custom Entry
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigator */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab("metrics")}
          className={`px-5 py-2.5 font-display text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "metrics"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Performance Metrics
        </button>
        <button
          onClick={() => setActiveSubTab("changelog")}
          className={`px-5 py-2.5 font-display text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "changelog"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Change Log Chronicles
        </button>
      </div>

      {activeSubTab === "metrics" ? (
        <>
          {/* KPI Stats Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-650 rounded-lg">
            <Activity size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Spend (INR)</span>
            <span className="text-sm font-bold font-mono text-slate-800">{formatINR(totalSpend)}</span>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-lg">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Leads Generated</span>
            <span className="text-sm font-bold font-mono text-slate-800">{totalLeads.toLocaleString()}</span>
          </div>
        </div>

        {/* CPL CPA */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-650 rounded-lg">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Blended CPL / CPA</span>
            <span className="text-sm font-bold font-mono text-slate-800">{formatINR(avgCplCpa)}</span>
          </div>
        </div>

        {/* Site Visits, CTR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-lg">
            <Layers size={18} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Converts (SVC / Booked)</span>
            <span className="text-sm font-bold font-mono text-slate-800">{totalSvc} svs / {totalBooked} bk</span>
          </div>
        </div>
      </div>

      {/* CSV Bulk Uploader Panel */}
      {showBulkUpload && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Upload className="text-indigo-600" size={18} />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Campaign Performance CSV Importer</h3>
                <p className="text-[11px] text-slate-500">
                  Select a <code>.csv</code> file, or paste table records directly. Follow the schema template keys below.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadCsvTemplate}
                className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 text-[10.5px] font-semibold rounded-md border border-indigo-100 transition-all cursor-pointer"
              >
                Paste Template Row
              </button>
              <button
                type="button"
                onClick={downloadCsvTemplateFile}
                className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold rounded-md border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <Download size={11} /> Download Template (.csv)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-500">Raw Comma Separated Text (CSV Format)</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Campaign Name,Adset Name,Ad Account ID,Project Name,Leads,Impression,Reach,CTR,Amount Spend,Clicks,SVC,Booked"
                className="w-full h-36 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-350 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              ></textarea>
            </div>

            {/* Direct selector for file upload */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 bg-slate-50 relative hover:border-indigo-300 transition-colors">
              <FileSpreadsheet className="text-slate-400" size={28} />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-700">Drag &amp; Drop CSV File</p>
                <p className="text-[9.5px] text-slate-400">or click to browse local folders</p>
              </div>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {bulkFeedback && (
            <div className={`p-3 rounded-lg text-xs leading-relaxed ${bulkFeedback.includes("Error") ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-teal-50 text-teal-850 border border-teal-100"}`}>
              <div className="flex items-center gap-1.5 font-bold">
                {bulkFeedback.includes("Error") ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                <span>{bulkFeedback}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => {
                setShowBulkUpload(false);
                setBulkFeedback(null);
                setCsvText("");
              }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg transition-all cursor-pointer text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkParse}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
            >
              Parse &amp; Import
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {showAddForm && (
        <form onSubmit={handleManualSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <PlusSquare className="text-indigo-650 text-indigo-600" size={16} />
            <h4 className="text-xs font-bold text-slate-855 text-slate-800 uppercase tracking-widest">Manual Campaign Performance Log</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-600">
            <div>
              <label className="block text-slate-500 mb-1">Campaign Name*</label>
              <input 
                type="text" 
                value={campaignName} 
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Meta Luxury Apartments" 
                required 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Adset Name*</label>
              <input 
                type="text" 
                value={adsetName} 
                onChange={(e) => setAdsetName(e.target.value)}
                placeholder="e.g. LAL_High_Net_Worth" 
                required 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Ad Account ID*</label>
              <input 
                type="text" 
                value={adAccountId} 
                onChange={(e) => setAdAccountId(e.target.value)}
                placeholder="e.g. act_40391039" 
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-medium" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Project Name*</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Grand Horizon Residence" 
                required 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium" 
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Leads Count</label>
              <input 
                type="number" 
                min="0"
                value={leads} 
                onChange={(e) => setLeads(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Impressions</label>
              <input 
                type="number" 
                min="0"
                value={impressions} 
                onChange={(e) => setImpressions(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Reach Volume</label>
              <input 
                type="number" 
                min="0"
                value={reach} 
                onChange={(e) => setReach(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">CTR (%)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={ctr} 
                onChange={(e) => setCtr(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 1.45"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Amount Spent (INR - ₹)*</label>
              <input 
                type="number" 
                min="0"
                value={amountSpend} 
                onChange={(e) => setAmountSpend(parseFloat(e.target.value) || 0)}
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-amber-600" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Clicks Count</label>
              <input 
                type="number" 
                min="0"
                value={clicks} 
                onChange={(e) => setClicks(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Site Visits Conducted (SVC)</label>
              <input 
                type="number" 
                min="0"
                value={svc} 
                onChange={(e) => setSvc(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Booked Deals</label>
              <input 
                type="number" 
                min="0"
                value={booked} 
                onChange={(e) => setBooked(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg transition-all cursor-pointer text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
            >
              Keep &amp; Sync Ledger
            </button>
          </div>
        </form>
      )}

      {/* Core Reports Table List and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filters Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Project View:</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Real Estate Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-60">
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Campaign or Adset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Main Records Grid */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[1450px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] select-none">
                <th className="p-4 pl-5">Campaign Name</th>
                <th className="p-4">Adset Name</th>
                <th className="p-4">Ad Account ID</th>
                <th className="p-4">Project</th>
                <th className="p-4 text-center bg-emerald-50/30 text-emerald-800 border-x border-slate-100">Leads Generated</th>
                <th className="p-4 text-center">Impressions</th>
                <th className="p-4 text-center">Reach</th>
                <th className="p-4 text-center text-indigo-700 bg-indigo-50/40">Creative Asset</th>
                <th className="p-4 text-center">CTR %</th>
                <th className="p-4 text-right">Amount Spent</th>
                <th className="p-4 text-center">Clicks</th>
                <th className="p-4 text-center">SVC</th>
                <th className="p-4 text-center">Booked</th>
                <th className="p-4 text-right text-indigo-800 bg-indigo-50/35 border-l border-slate-200">CPL / CPA</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredPerformances.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-12 text-center text-slate-400">
                    <Info size={22} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-extrabold text-sm text-slate-700">No active campaign performance rows found.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Change search filters, select another project view, or upload a fresh CSV file above.</p>
                  </td>
                </tr>
              ) : (
                filteredPerformances.map((p, index) => {
                  const calculatedCpl = p.leads > 0 ? Math.round(p.amountSpend / p.leads) : 0;
                  const cplToDisplay = p.cplCpa || calculatedCpl;

                  // Dynamic indicator for CTR health
                  let ctrBadgeClass = "bg-rose-50 text-rose-700 border-rose-150";
                  let ctrLabel = "Underperforming";
                  if (p.ctr >= 3.0) {
                    ctrBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-150";
                    ctrLabel = "Outstanding";
                  } else if (p.ctr >= 1.5) {
                    ctrBadgeClass = "bg-amber-50 text-amber-700 border-amber-150";
                    ctrLabel = "Satisfactory";
                  }

                  // Dynamic indicator for CPL level (benchmark ₹500)
                  const isOptimalCpl = cplToDisplay > 0 && cplToDisplay <= 500;

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-indigo-50/30 transition-all ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      {/* Campaign Name with Active Status Beacon */}
                      <td className="p-4 pl-5 max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-900 text-[12.5px] block leading-snug truncate max-w-[190px]" title={p.campaignName}>
                                {p.campaignName}
                              </span>
                              {p.creativeNewUpdatedFlag && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-indigo-100 text-indigo-700 animate-pulse border border-indigo-200" title="A new creative was recently uploaded for this campaign!">
                                  ✨ NEW CREATIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-slate-450 block font-mono">ID: {p.id.substring(0, 10)}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Adset Name */}
                      <td className="p-4">
                        <div className="max-w-[140px] truncate" title={p.adsetName}>
                          <span className="font-mono text-[10.5px] text-slate-600 block leading-tight truncate">{p.adsetName}</span>
                        </div>
                      </td>
                      
                      {/* Ad Account ID */}
                      <td className="p-4">
                        <div className="max-w-[140px] truncate" title={p.adAccountId}>
                          <span className="text-slate-500 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block truncate text-center">
                            {p.adAccountId}
                          </span>
                        </div>
                      </td>
                      
                      {/* Project Name as dynamic premium pill badge */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-150">
                          🏢 {p.projectName}
                        </span>
                      </td>
                      
                      {/* Leads (Highlighted background element for critical metric) */}
                      <td className="p-4 text-center font-black text-emerald-850 font-mono text-[13.5px] bg-emerald-50/30 border-x border-slate-100">
                        {p.leads.toLocaleString()}
                      </td>
                      
                      {/* Impressions */}
                      <td className="p-4 text-center font-mono text-slate-500 font-semibold">
                        {p.impression.toLocaleString()}
                      </td>
                      
                      {/* Reach */}
                      <td className="p-4 text-center font-mono text-slate-500 font-semibold">
                        {p.reach.toLocaleString()}
                      </td>

                      {/* Creative Asset Column: Upload Option and Zoomable Preview */}
                      <td className="p-4 text-center bg-indigo-50/15">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {p.creativeImageUrl ? (
                            <div className="relative group/thumb cursor-pointer select-none">
                              <img 
                                src={p.creativeImageUrl} 
                                alt="Creative asset" 
                                className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-3xs hover:scale-110 transition-all duration-150"
                                referrerPolicy="no-referrer"
                                onClick={() => setSelectedImageModal(p.creativeImageUrl || null)}
                              />
                              {p.creativeNewUpdatedFlag && (
                                <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono italic">
                              No image
                            </span>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <label className="cursor-pointer bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600 transition-all flex items-center gap-0.5 shadow-3xs">
                              <Upload size={10} />
                              <span>{p.creativeImageUrl ? "Update" : "Upload Image"}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleRowUpload(e, p)}
                              />
                            </label>
                            
                            {p.creativeImageUrl && p.creativeNewUpdatedFlag && (
                              <button
                                type="button"
                                onClick={() => handleDismissNewFlag(p)}
                                className="bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded px-1 py-0.5 border border-slate-200 text-[9px] font-bold transition-all cursor-pointer shadow-3xs"
                                title="Acknowledge Creative Update of this Campaign"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* CTR % with Status tags */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${ctrBadgeClass}`}>
                            {(Number(p.ctr) || 0).toFixed(2)}%
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 leading-none tracking-wider">
                            {ctrLabel}
                          </span>
                        </div>
                      </td>
                      
                      {/* Amount spent */}
                      <td className="p-4 text-right font-mono font-bold text-slate-800 text-[11px]">
                        {formatINR(p.amountSpend)}
                      </td>
                      
                      {/* Clicks */}
                      <td className="p-4 text-center font-mono text-slate-650">
                        {p.clicks.toLocaleString()}
                      </td>
                      
                      {/* SVC */}
                      <td className="p-4 text-center font-black text-emerald-600 font-mono">
                        {p.svc}
                      </td>
                      
                      {/* Booked */}
                      <td className="p-4 text-center font-black text-indigo-700 font-mono">
                        {p.booked}
                      </td>
                      
                      {/* Calculated CPL / CPA column */}
                      <td className="p-4 text-right font-black font-mono bg-indigo-50/35 text-[13px] border-l border-slate-200">
                        <span className="text-slate-900 block">{formatINR(cplToDisplay)}</span>
                        
                        {cplToDisplay > 0 && (
                          <span className={`text-[8.5px] font-bold uppercase tracking-wider block mt-0.5 ${
                            isOptimalCpl ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {isOptimalCpl ? "✓ Optimal Cost" : "⚠️ High CPA"}
                          </span>
                        )}
                      </td>

                      {/* Delete actions check roles */}
                      <td className="p-4 text-center">
                        {rolePermission.canManageTargets ? (
                          <button
                            type="button"
                            onClick={() => onDeletePerformance(p.id)}
                            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="Erase Campaign Performance Entry"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic cursor-not-allowed font-medium" title="Permission Denied to Deletions">
                            Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Display Formatting Guidelines Card in the footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-150 text-[10.5px] text-slate-500/90 leading-relaxed font-medium flex items-start gap-1.5">
          <Info size={13} className="text-indigo-550 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-slate-700">CSV Template Header Schema:</span> Use exactly this header line to upload maps successfully: <br />
            <code className="text-[10px] font-bold font-mono bg-slate-200/60 px-1 py-0.5 rounded text-indigo-850">
              Campaign Name,Adset Name,Ad Account ID,Project Name,Leads,Impression,Reach,CTR,Amount Spend,Clicks,SVC,Booked
            </code>
          </div>
        </div>

      </div>
    </>
    ) : (
        <div className="space-y-6">
          {/* Change Log Actions Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Chronology Audit Logging</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select an active campaign metric feed below to append a permanent entry to the audit change trails.</p>
              </div>
              <button
                onClick={() => setShowAddLogForm(!showAddLogForm)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusSquare size={13} />
                {showAddLogForm ? "Collapse Form" : "Append New Audit Entry"}
              </button>
            </div>

            {showAddLogForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!selectedCampaignId) {
                    alert("Please pick an active tracked campaign first.");
                    return;
                  }
                  if (!changesHappenedText.trim() || !reasonText.trim()) {
                    alert("Please enter the edits that occurred and select/specify a detailed reason.");
                    return;
                  }

                  const selectedCamp = performances.find(p => p.id === selectedCampaignId);
                  const selectedName = selectedCamp ? selectedCamp.campaignName : "Unknown Campaign";

                  let budgetPercentChange: number | undefined;
                  if (changeCategory === "Budget" && typeof budgetPreviousDaily === "number" && typeof budgetNewDaily === "number" && budgetPreviousDaily > 0) {
                    budgetPercentChange = parseFloat((((budgetNewDaily - budgetPreviousDaily) / budgetPreviousDaily) * 100).toFixed(1));
                  }

                  const entry: ChangeLogEntry = {
                    id: "chg-temp-" + Math.random().toString(36).substring(2, 9),
                    campaignId: selectedCampaignId,
                    campaignName: selectedName,
                    date: new Date().toLocaleDateString(),
                    changed: changesHappenedText,
                    reason: reasonText,
                    lastEditedAt: new Date().toISOString(),
                    lastEditedBy: editedByText || rolePermission?.role || "Tester",
                    createdAt: new Date().toISOString(),
                    project: selectedCamp?.projectName || "General",
                    adSetName: selectedCamp?.adsetName || "All",
                    campaignStatus: "Active",
                    type: "Performance Operations",
                    progress: "Implemented",
                    
                    performanceIndicatorAfterChange: performanceIndicator,
                    changeCategory: changeCategory,
                    
                    // Audience
                    audienceTargetLocations: changeCategory === "Audience" ? audienceTargetLocations : undefined,
                    audienceAgeGroups: changeCategory === "Audience" ? audienceAgeGroups : undefined,
                    audienceInterests: changeCategory === "Audience" ? audienceInterests : undefined,
                    
                    // Budget
                    budgetPreviousDaily: changeCategory === "Budget" && typeof budgetPreviousDaily === "number" ? budgetPreviousDaily : undefined,
                    budgetNewDaily: changeCategory === "Budget" && typeof budgetNewDaily === "number" ? budgetNewDaily : undefined,
                    budgetPercentChange: changeCategory === "Budget" ? budgetPercentChange : undefined,
                    
                    // Creative
                    creativeName: changeCategory === "Creative" ? creativeNameState : undefined,
                    creativeHeadline: changeCategory === "Creative" ? creativeHeadlineState : undefined,
                    creativeBodyText: changeCategory === "Creative" ? creativeBodyTextState : undefined,
                    creativeImageUrl: changeCategory === "Creative" ? creativeImageUrl : undefined,
                  };

                  try {
                    setIsSavingChgLog(true);
                    if (onSaveChangeLog) {
                      await onSaveChangeLog(entry);
                      setChangesHappenedText("");
                      setReasonText("");
                      setAudienceTargetLocations("");
                      setAudienceAgeGroups("");
                      setAudienceInterests("");
                      setBudgetPreviousDaily("");
                      setBudgetNewDaily("");
                      setCreativeNameState("");
                      setCreativeHeadlineState("");
                      setCreativeBodyTextState("");
                      setCreativeImageUrl("");
                      setShowAddLogForm(false);
                      alert("Audit change trail updated and linked to current campaign views!");
                    } else {
                      alert("Error: Save handler is missing.");
                    }
                  } catch (err: any) {
                    alert(`Save Failed: ${err.message || err}`);
                  } finally {
                    setIsSavingChgLog(false);
                  }
                }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-4 animate-fade-in text-xs font-medium"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pick Tracked Campaign *</label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">-- Choose active campaign --</option>
                      {Array.from(new Set(performances.map(p => p.campaignName))).map(name => {
                        const matchedPerf = performances.find(p => p.campaignName === name);
                        return (
                          <option key={matchedPerf?.id} value={matchedPerf?.id}>
                            {name} ({matchedPerf?.projectName})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Performance Indicator After Change *</label>
                    <select
                      value={performanceIndicator}
                      onChange={(e) => setPerformanceIndicator(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="CPL Improvement">CPL Improvement (Cost Per Lead decrease)</option>
                      <option value="CTR Gain">CTR Gain (Click-Through Rate increase)</option>
                      <option value="Conversions Spike">Conversions Spike (High Volume leads)</option>
                      <option value="ROAS Optimization">ROAS Optimization (Lower direct spending)</option>
                      <option value="Budget Efficiency">Budget Efficiency (Saves non-converting slots)</option>
                      <option value="Quality Score Boost">Quality Score Boost (Better placement)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Audited By Agent / Entity</label>
                    <input
                      type="text"
                      value={editedByText}
                      onChange={(e) => setEditedByText(e.target.value)}
                      placeholder="E.g. Admin, Marketing Manager"
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-extrabold text-indigo-850 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-indigo-600" />
                      Audited Category Classifier
                    </span>
                    <select
                      value={changeCategory}
                      onChange={(e) => setChangeCategory(e.target.value as any)}
                      className="h-8 px-2 bg-slate-55 border border-slate-250 rounded-md font-bold text-indigo-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="Audience">Audience Modification Tab</option>
                      <option value="Budget">Budget Shift Tab</option>
                      <option value="Creative">Creative Variant Tab (Attachments)</option>
                    </select>
                  </div>

                  {/* Contextual form tabs */}
                  {changeCategory === "Audience" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Target Locations *</label>
                        <input
                          type="text"
                          value={audienceTargetLocations}
                          onChange={(e) => setAudienceTargetLocations(e.target.value)}
                          placeholder="E.g., Mumbai MMR, Navi Mumbai, Thane"
                          className="w-full h-9 px-2.5 bg-slate-55 border border-slate-250 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Target Age Groups *</label>
                        <input
                          type="text"
                          value={audienceAgeGroups}
                          onChange={(e) => setAudienceAgeGroups(e.target.value)}
                          placeholder="E.g., 28 - 50 Years"
                          className="w-full h-9 px-2.5 bg-slate-55 border border-slate-250 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Interests & Inclusions *</label>
                        <input
                          type="text"
                          value={audienceInterests}
                          onChange={(e) => setAudienceInterests(e.target.value)}
                          placeholder="E.g., Investors, luxury goods, frequent travelers"
                          className="w-full h-9 px-2.5 bg-slate-55 border border-slate-250 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {changeCategory === "Budget" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in items-end">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Previous Daily Budget (₹) *</label>
                        <input
                          type="number"
                          value={budgetPreviousDaily}
                          onChange={(e) => setBudgetPreviousDaily(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="E.g., 2500"
                          className="w-full h-9 px-2.5 bg-slate-55 border border-slate-250 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">New Daily Budget (₹) *</label>
                        <input
                          type="number"
                          value={budgetNewDaily}
                          onChange={(e) => setBudgetNewDaily(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="E.g., 3500"
                          className="w-full h-9 px-2.5 bg-slate-55 border border-slate-250 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="h-9 flex items-center px-3 bg-indigo-50 border border-indigo-150 rounded-lg text-[10px] text-indigo-850 font-bold uppercase tracking-wider select-none">
                        {typeof budgetPreviousDaily === "number" && typeof budgetNewDaily === "number" && budgetPreviousDaily > 0 ? (
                          (() => {
                            const pct = (((budgetNewDaily - budgetPreviousDaily) / budgetPreviousDaily) * 100).toFixed(1);
                            const positive = budgetNewDaily >= budgetPreviousDaily;
                            return (
                              <span className={positive ? "text-emerald-700" : "text-amber-700"}>
                                {positive ? "📈 Increase:" : "📉 Decrease:"} {pct}% (Prev: ₹{formatINR(budgetPreviousDaily)} ➔ New: ₹{formatINR(budgetNewDaily)})
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-slate-450 italic">Awaiting both budget inputs...</span>
                        )}
                      </div>
                    </div>
                  )}

                  {changeCategory === "Creative" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      {/* Drag & Drop Visual Asset Uploader container */}
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Upload Original Asset Visual (Drag & Drop) *</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              if (file.type.startsWith("image/")) {
                                const reader = new FileReader();
                                reader.onload = () => setCreativeImageUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              } else {
                                alert("Please drop a valid image visual asset.");
                              }
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-28 ${
                            isDragOver ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 hover:border-indigo-400 bg-slate-50/30"
                          }`}
                          onClick={() => {
                            const fileInput = document.createElement("input");
                            fileInput.type = "file";
                            fileInput.accept = "image/*";
                            fileInput.onchange = (e: any) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = () => setCreativeImageUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            };
                            fileInput.click();
                          }}
                        >
                          {creativeImageUrl ? (
                            <div className="space-y-1">
                              <img src={creativeImageUrl} alt="Preview" className="max-h-16 mx-auto rounded-lg object-contain shadow-xs border border-slate-200" referrerPolicy="no-referrer" />
                              <p className="text-[9px] text-emerald-600 font-bold flex items-center justify-center gap-0.5">
                                <CheckCircle2 size={10} /> Attached! Clear snapshot
                              </p>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setCreativeImageUrl(""); }} 
                                className="text-[9px] text-rose-500 font-bold underline hover:text-rose-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-0.5 pointer-events-none">
                              <Upload className="mx-auto text-indigo-500 animate-bounce" size={16} />
                              <p className="font-bold text-[10px] text-indigo-900 leading-tight">Drop variant banner file here</p>
                              <p className="text-[9px] text-slate-400">or click to browse local files</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Creative details text specifier */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-600 font-bold mb-0.5">Creative Variant Identifier *</label>
                          <input
                            type="text"
                            value={creativeNameState}
                            onChange={(e) => setCreativeNameState(e.target.value)}
                            placeholder="E.g., Option-A: Modern Living Room"
                            className="w-full h-8 px-2 bg-slate-55 border border-slate-250 rounded-lg text-slate-850"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-0.5">Premium Headline Overlay *</label>
                          <input
                            type="text"
                            value={creativeHeadlineState}
                            onChange={(e) => setCreativeHeadlineState(e.target.value)}
                            placeholder="E.g., Low cost real estate, luxury living reimagined"
                            className="w-full h-8 px-2 bg-slate-55 border border-slate-250 rounded-lg text-slate-850"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Summary of Modifications/Changes *</label>
                    <textarea
                      value={changesHappenedText}
                      onChange={(e) => setChangesHappenedText(e.target.value)}
                      placeholder="Describe exactly what got changed in budget, bids, creatives, keywords or targeting..."
                      rows={3}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-normal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Business Reason for Change *</label>
                    <textarea
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder="E.g., CPL was exceeding benchmark by 20%, or adset fatigued; pause underperforming assets."
                      rows={3}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-850 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-normal"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingChgLog}
                    className={`px-5 py-2 text-white font-bold rounded-lg transition-all shadow-xs flex items-center gap-2 ${
                      isSavingChgLog ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                    }`}
                  >
                    {isSavingChgLog ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving Entry...</span>
                      </>
                    ) : (
                      "Commit Audit Trail Event"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Log History Register */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Change Log History Trails</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live index registry tracking all edits, re-allocations and campaign tuning events.</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 font-semibold font-mono rounded-md">
                {changeLogs.length} Events Total
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {changeLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-medium bg-white">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <History size={20} />
                  </div>
                  <p className="text-xs">No campaign audit records registered yet.</p>
                  <p className="text-[10.5px] text-slate-400 mt-1">Append an entry above to document shifts in optimization strategies.</p>
                </div>
              ) : (
                changeLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col lg:flex-row justify-between items-start gap-6 text-xs bg-white">
                    <div className="space-y-3.5 flex-1 w-full">
                      {/* Top Header Row of Log Card */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 font-display text-base block">{log.campaignName}</span>
                        
                        {log.changeCategory ? (
                          <span className={`inline-block text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide ${
                            log.changeCategory === "Audience" 
                              ? "bg-purple-50 text-purple-700 border-purple-150"
                              : log.changeCategory === "Budget"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                              : "bg-sky-50 text-sky-700 border-sky-150"
                          }`}>
                            🏷️ Category: {log.changeCategory}
                          </span>
                        ) : (
                          <span className="inline-block text-[9.5px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-semibold uppercase">
                            {log.type || "Performance Operation"}
                          </span>
                        )}

                        {log.performanceIndicatorAfterChange && (
                          <span className="inline-block text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full font-bold">
                            🎯 Expected Target: {log.performanceIndicatorAfterChange}
                          </span>
                        )}
                      </div>

                      {/* Main Modification / Business Reason details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/50">
                          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            General Improvements
                          </p>
                          <p className="text-[12px] text-slate-700 leading-relaxed font-semibold italic">{log.changed}</p>
                        </div>
                        <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/30">
                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Strategic Reason
                          </p>
                          <p className="text-[12px] text-slate-700 leading-relaxed font-semibold italic">{log.reason}</p>
                        </div>
                      </div>

                      {/* CONDITIONAL SUB-DETAILS ACCORDING TO CATEGORIES */}
                      {log.changeCategory === "Audience" && (
                        <div className="bg-purple-50/20 p-4 rounded-xl border border-purple-150/50 space-y-2 animate-fade-in">
                          <div className="text-[10px] font-bold text-purple-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                            <span>👥 Audited Audience Targeting Particulars</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-purple-100">
                              <span className="block text-[9px] text-purple-600 font-bold uppercase">Locations Geotargeted</span>
                              <span className="font-semibold text-slate-800 text-[11.5px]">{log.audienceTargetLocations || "N/A (All In)"}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-purple-100">
                              <span className="block text-[9px] text-purple-600 font-bold uppercase">Age Demographic brackets</span>
                              <span className="font-semibold text-slate-800 text-[11.5px]">{log.audienceAgeGroups || "N/A (Broad Range)"}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-purple-100">
                              <span className="block text-[9px] text-purple-600 font-bold uppercase">Interests / Custom Behaviours</span>
                              <span className="font-semibold text-slate-800 text-[11.5px]">{log.audienceInterests || "N/A (Run Broad)"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.changeCategory === "Budget" && (
                        <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-150/50 space-y-2 animate-fade-in">
                          <div className="text-[10px] font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                            <span>💰 Audited Budget Tuning Particulars</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                              <span className="block text-[9px] text-emerald-600 font-bold uppercase">Prior Daily Cap</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">₹{log.budgetPreviousDaily ? formatINR(log.budgetPreviousDaily) : "N/A"}/day</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                              <span className="block text-[9px] text-emerald-600 font-bold uppercase">Current Daily Cap</span>
                              <span className="font-mono font-bold text-slate-800 text-sm">₹{log.budgetNewDaily ? formatINR(log.budgetNewDaily) : "N/A"}/day</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex flex-col justify-center">
                              <span className="block text-[9px] text-emerald-600 font-bold uppercase">Calculated Pivot Change</span>
                              <span className="font-bold text-[12px] flex items-center gap-1 text-slate-800">
                                {log.budgetPercentChange !== undefined ? (
                                  <>
                                    <span className={log.budgetPercentChange >= 0 ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                                      {log.budgetPercentChange >= 0 ? `📈 +${log.budgetPercentChange}%` : `📉 ${log.budgetPercentChange}%`}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-normal">Adjustment</span>
                                  </>
                                ) : (
                                  <span className="text-slate-450 italic text-[11px]">Unspecified value shift</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {log.changeCategory === "Creative" && (
                        <div className="bg-sky-50/20 p-4 rounded-xl border border-sky-150/50 animate-fade-in">
                          <div className="text-[10px] font-bold text-sky-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                            <span>🎨 Audited Creative Snapshot & Layout Variant</span>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-lg border border-sky-100">
                            {log.creativeImageUrl && (
                              <div className="w-full md:w-32 shrink-0 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                                <img 
                                  src={log.creativeImageUrl} 
                                  alt="Tracked Creative Snapshot" 
                                  className="max-h-24 max-w-full object-contain rounded-md" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="space-y-1.5 flex-1 min-w-0 text-xs text-left">
                              <p className="text-[13px] font-bold text-slate-900 border-b border-slate-100 pb-1">
                                Variant ID: <span className="text-sky-700">{log.creativeName || "Unnamed Version"}</span>
                              </p>
                              {log.creativeHeadline && (
                                <p className="text-[11.5px] text-slate-700">
                                  <strong className="text-[10px] text-slate-450 uppercase flex items-center">Headline Text:</strong>
                                  <span className="font-semibold text-indigo-900">"{log.creativeHeadline}"</span>
                                </p>
                              )}
                              {log.creativeBodyText && (
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                  <strong className="text-[10px] text-slate-450 uppercase">Body Description text:</strong> {log.creativeBodyText}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Log Timestamp and Author Registry */}
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-300" />
                          Logged: {log.lastEditedAt ? new Date(log.lastEditedAt).toLocaleString() : log.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-300" />
                          Authenticated Operator: <strong className="text-slate-600">{log.lastEditedBy || "System Admin"}</strong>
                        </span>
                      </div>
                    </div>

                    {onDeleteChangeLog && (
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this historical chronicle record?")) {
                            await onDeleteChangeLog(log.id);
                          }
                        }}
                        disabled={!rolePermission.canDeleteCampaigns}
                        className={`p-2 border rounded-lg transition-all shrink-0 self-start md:self-center ${
                          rolePermission.canDeleteCampaigns
                            ? "border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/50 cursor-pointer"
                            : "border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50"
                        }`}
                        title="Delete chronicle log"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Lightbox zoom Modal for Campaign Creatives */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setSelectedImageModal(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl p-2.5 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105"
              title="Close modal"
            >
              Close [X]
            </button>
            <img 
              src={selectedImageModal} 
              alt="Campaign Creative Extended Zoom" 
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
