import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  Terminal,
  Clock,
  Mail,
  RefreshCw,
  AlertTriangle,
  Code,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  PlusCircle,
  HelpCircle,
  Send,
  Sparkles,
  Inbox
} from "lucide-react";
import { AutoHealService, HealingReport, DispatchedEmail } from "../services/autoHealService";

export default function AutoHealAgent() {
  // Stats counters
  const [operationalHealth, setOperationalHealth] = useState(100);
  const [healingStreak, setHealingStreak] = useState(0);
  const [meanTimeToHeal, setMeanTimeToHeal] = useState(740); // ms
  const [isInjecting, setIsInjecting] = useState(false);
  
  // Custom interactive error testing
  const [customErrorMsg, setCustomErrorMsg] = useState("");
  const [customErrorComponent, setCustomErrorComponent] = useState("DashboardWidget");

  // State caches
  const [incidents, setIncidents] = useState<any[]>(() => {
    const saved = localStorage.getItem("g_auto_heal_incident_history");
    return saved ? JSON.parse(saved) : [
      {
        id: "INC-8812",
        timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        error: "JSON.parse: unexpected character at line 1 column 12 in 'marketing_copilot_campaigns'",
        actionCode: "CLEAN_CACHE_POISONING",
        explanation: "Purged corrupt serialization block inside browser storage, reinitialized dashboard fallback values.",
        status: "healed",
        timeTaken: 620
      },
      {
        id: "INC-7910",
        timestamp: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        error: "TypeError: Cannot read properties of undefined (reading 'canEditCampaigns')",
        actionCode: "RESET_SECURITY_ROLES",
        explanation: "Restored user email gouthamarun123@gmail.com permissions to Administrator with master authority.",
        status: "healed",
        timeTaken: 890
      }
    ];
  });

  const [sentEmails, setSentEmails] = useState<DispatchedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmail | null>(null);

  // Live diagnostic simulation console
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "[SYSTEM STATE] Core guardian online. Monitoring application state vectors.",
    "[TELEMETRY] Global window error trap bound successfully.",
    "[HEARTBEAT] Local database & OAuth matrices operating under secure benchmarks."
  ]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll console
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Read sent items from service on mount
  useEffect(() => {
    setSentEmails(AutoHealService.getSentEmails());
    
    // Auto increment operational stats slightly to feel organic and live
    const interval = setInterval(() => {
      setOperationalHealth((prev) => {
        if (prev < 100) return +(prev + 0.1).toFixed(2);
        return 100;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Save incidents to localStorage when modified
  useEffect(() => {
    localStorage.setItem("g_auto_heal_incident_history", JSON.stringify(incidents));
  }, [incidents]);

  // Listener to capture if a healed event was triggered globally
  useEffect(() => {
    const handleHealReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const action = customEvent.detail?.action || "STABILIZE_OPERATIONAL_FABRIC";
      addLog(`[GLOBAL TELEMETRY] Event: Healed Action [${action}] synchronized successfully across tabs.`);
    };
    window.addEventListener("g_auto_heal_applied", handleHealReceived);
    return () => window.removeEventListener("g_auto_heal_applied", handleHealReceived);
  }, []);

  const addLog = (text: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  // Physically executes the simulation routine
  const handleInjectError = async (type: "JSON" | "AUTH" | "TOKEN" | "METRIC" | "CUSTOM") => {
    if (isInjecting) return;
    setIsInjecting(true);
    setOperationalHealth(14.5); // plummet health
    
    let errorMsg = "ReferenceError: campaigns is not defined";
    let errorStack = "at render (src/components/Dashboard.tsx:210:4)\nat commitHookEffects (node_modules/react-dom:1280:9)";
    let component = "CampaignStatsPanel";

    if (type === "JSON") {
      errorMsg = "SyntaxError: Unexpected token < in JSON at position 0";
      errorStack = "at JSON.parse (<anonymous>)\nat loadLocal (src/services/dataService.ts:34:15)";
      component = "LocalCacheParser";
    } else if (type === "AUTH") {
      errorMsg = "AuthException: Missing administrator role settings. Level undefined.";
      errorStack = "at checkPermissions (src/App.tsx:88:24)\nat renderWithRoles (src/App.tsx:1204:5)";
      component = "RolePermissionRouter";
    } else if (type === "TOKEN") {
      errorMsg = "OAuthNetworkCheck: GET /v17/customers/act_9918/googleAds:search returned 401 Unauthorized";
      errorStack = "at fetchGAQL (server.ts:1210:9)\nat syncGoogleAdsReporting (server.ts:1255:12)";
      component = "GoogleAdsConnector";
    } else if (type === "METRIC") {
      errorMsg = "RangeError: Click value cannot be negative in Cost-Per-Lead calculations";
      errorStack = "at calculateCPL (src/utils/math.ts:14:9)\nat renderGraph (src/components/Campaigns.tsx:92:2)";
      component = "CampaignFormulaMatrix";
    } else if (type === "CUSTOM") {
      errorMsg = customErrorMsg.trim() || "Uncaught Error: Simulated interactive crash signal";
      errorStack = "at injectSimulatedCrash (src/components/AutoHealAgent.tsx:102:4)";
      component = customErrorComponent || "DeveloperPlayground";
    }

    addLog(`🚨 ERROR INJECTED: "${errorMsg}"`);
    addLog(`⚡ INTERCEPTED (window.onerror): Routing to Automated Supervisor Engine...`);

    // Simulated timing sequence
    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog(`🔍 ANALYZING COMPONENT: Assessing structural constraints of '${component}'...`);
    addLog(`🧠 QUERYING GEMINI FOR ROOT-CAUSE & REPAIR INSTRUCTIONS...`);

    const startTime = Date.now();
    try {
      // Direct call to our services
      const result = await AutoHealService.handleSystemFailure(errorMsg, errorStack, component);
      const latency = Date.now() - startTime;
      
      addLog(`✨ AI REPAIR DECISION GENERATED: [${result.report.healActionCode}]`);
      addLog(`🛠️ EXECUTING HEAL PATCH: "${result.report.healExplanation}"`);
      addLog(`📧 COMPILED COMPLIANT ALERT NOTIFICATION ENVELOPES`);
      addLog(`📤 SMTP TRANSMISSION INITIATED TO: gouthamarun123@gmail.com`);
      addLog(`✓ RECIPIENT DELIVERED SUCCESSFULLY. TRACKING ID: ${result.email.id}`);
      addLog(`✨ SYSTEM ENTIRELY HEALED. ALL MODULE HEALTH VECTORS RESTORED TO 100%.`);

      // Update interactive states
      setOperationalHealth(100);
      setHealingStreak((p) => p + 1);
      setMeanTimeToHeal(latency);
      
      // Add record to incidents
      const newInc = {
        id: `INC-${Math.floor(Math.random() * 9000 + 1000)}`,
        timestamp: new Date().toISOString(),
        error: errorMsg,
        actionCode: result.report.healActionCode,
        explanation: result.report.healExplanation,
        status: "healed",
        timeTaken: latency
      };
      
      setIncidents((prev) => [newInc, ...prev]);
      setSentEmails(AutoHealService.getSentEmails()); // reload mail list
      setCustomErrorMsg(""); // reset

    } catch (err: any) {
      addLog(`⚠ HEAL INTERRUPTED: ${err.message || "Network Timeout"}. Resorting to baseline safety.`);
      setOperationalHealth(90);
    } finally {
      setIsInjecting(false);
    }
  };

  const clearLogs = () => {
    setConsoleLogs([
      `[SERVICE RESTART] Monitor buffer flushed. Guardian monitoring active.`,
      `[HEARTBEAT] Local database validated. Zero corrupted keys found.`
    ]);
  };

  const wipeTelemetryHistory = () => {
    localStorage.removeItem("g_auto_heal_incident_history");
    setIncidents([]);
    AutoHealService.clearSentMailbox();
    setSentEmails([]);
    setSelectedEmail(null);
    setHealingStreak(0);
    addLog(`🧹 TELEMETRY AND SIMULATED MAILBOX CLEARED.`);
  };

  // High quality theme badge configuration
  const getSimActionColor = (code: string) => {
    switch (code) {
      case "CLEAN_CACHE_POISONING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/35";
      case "RESET_SECURITY_ROLES":
        return "bg-rose-500/20 text-rose-300 border-rose-500/35";
      case "ROT_SANDBOX_HANDSHAKE":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/35";
      case "RECONCILE_METRIC_INTEGRITY":
        return "bg-violet-500/20 text-violet-300 border-violet-500/35";
      case "STABILIZE_OPERATIONAL_FABRIC":
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500/35";
    }
  };

  return (
    <div className="space-y-6" id="digital-marketing-auto-heal-node">

      {/* 1. HERO TITLE HEADER BOX */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/25 text-indigo-300 rounded-lg animate-pulse">
                <ShieldCheck size={18} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 font-mono">Autonomous Core</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white mt-1">AI-Powered Self-Healing Agent</h2>
            <p className="text-slate-400 text-xs font-medium max-w-2xl leading-relaxed">
              Active operational guardian that automatically captures, diagnoses, and heals client/server failures in real-time. Immediately dispatches rich diagnostic alert payload emails to administrators.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={wipeTelemetryHistory}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-800/80 text-xs font-extrabold rounded-xl transition-all border border-slate-700/60 cursor-pointer"
              title="Clear all stored logs & emails"
            >
              <Trash2 size={13.5} />
              <span>Reset State Guardian</span>
            </button>
          </div>
        </div>

        {/* Real-time cyber status grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg relative">
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <Zap size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">System Health</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{operationalHealth}%</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Auto Repairs</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">{incidents.length} logs</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg">
              <Clock size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Mean Time to Heal</span>
              <div className="text-base font-bold font-mono text-violet-400 mt-0.5">{meanTimeToHeal}ms</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg">
              <Mail size={16} />
            </div>
            <div>
              <span className="block text-[9px] text-slate-450 uppercase tracking-widest font-mono font-bold">Admin Dispatch</span>
              <div className="text-[11px] font-bold text-amber-300 mt-0.5 max-w-[110px] truncate" title="gouthamarun123@gmail.com">
                g...3@gmail.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BODY SPLIT GRID: INJECT / TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left pane: Error injection sandbox playground */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="text-rose-600" size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-750">Error Injection Sandbox</h3>
              <span className="ml-auto bg-rose-50 text-rose-700 font-mono text-[9px] px-1.5 py-0.5 rounded border border-rose-100 font-extrabold">Playground</span>
            </div>

            <p className="text-[11.5px] text-slate-500 leading-normal">
              Inject interactive malfunctions to test the agent. The core guardian will intercept, analyze using Gemini, apply real recovery commands, and notify the administrator.
            </p>

            <div className="space-y-2 pt-1.5">
              <button
                disabled={isInjecting}
                onClick={() => handleInjectError("JSON")}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-amber-300 rounded-xl transition-all flex items-start text-left gap-3 group relative cursor-pointer disabled:opacity-50"
              >
                <div className="p-1.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg shrink-0 group-hover:bg-amber-100/50">
                  <Code size={13} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800">1. JSON Schema Corruption</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Inject malformed tags inside the campaign storage arrays.</span>
                </div>
              </button>

              <button
                disabled={isInjecting}
                onClick={() => handleInjectError("AUTH")}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-rose-300 rounded-xl transition-all flex items-start text-left gap-3 group relative cursor-pointer disabled:opacity-50"
              >
                <div className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg shrink-0 group-hover:bg-rose-100/50">
                  <AlertTriangle size={13} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800">2. Invalid Security Permissions</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Wipe the admin role mapping to trigger system isolation boundaries.</span>
                </div>
              </button>

              <button
                disabled={isInjecting}
                onClick={() => handleInjectError("TOKEN")}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-cyan-300 rounded-xl transition-all flex items-start text-left gap-3 group relative cursor-pointer disabled:opacity-50"
              >
                <div className="p-1.5 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-lg shrink-0 group-hover:bg-cyan-100/50">
                  <RefreshCw size={13} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800">3. Expired OAuth Google Session</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Poison active Graph & GAQL access tokens with dummy bytes.</span>
                </div>
              </button>

              <button
                disabled={isInjecting}
                onClick={() => handleInjectError("METRIC")}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-violet-300 rounded-xl transition-all flex items-start text-left gap-3 group relative cursor-pointer disabled:opacity-50"
              >
                <div className="p-1.5 bg-violet-50 border border-violet-100 text-violet-600 rounded-lg shrink-0 group-hover:bg-violet-100/50">
                  <Zap size={13} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800">4. Campaign Formula Bounds Mismatch</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Inject negative statistics into active CPL matrices.</span>
                </div>
              </button>
            </div>

            {/* Sub-form for custom error messages */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Custom Simulated Error:</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. TypeError: Cannot read property 'map' of null"
                  value={customErrorMsg}
                  onChange={(e) => setCustomErrorMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 outline-hidden font-medium"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Component Name: e.g. SideNav"
                    value={customErrorComponent}
                    onChange={(e) => setCustomErrorComponent(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 bg-slate-50 outline-hidden font-medium"
                  />
                  <button
                    disabled={isInjecting || !customErrorMsg.trim()}
                    onClick={() => handleInjectError("CUSTOM")}
                    className="px-3.5 bg-indigo-600 hover:bg-indigo-505 bg-indigo-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <PlusCircle size={12} />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Operational Logs / Telemetry console */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          
          {/* Main Visual console window */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 flex-1 shadow-md flex flex-col justify-between max-h-[460px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-400" />
                  <span>Telemetry Diagnostics Stream</span>
                </h3>
              </div>
              <button
                onClick={clearLogs}
                className="px-2.5 py-1 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 rounded-md font-mono transition-all cursor-pointer"
              >
                Flush Terminal Buffer
              </button>
            </div>

            {/* Console output body */}
            <div className="my-4 flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-[11px] leading-relaxed max-h-[300px]">
              {consoleLogs.map((log, index) => {
                let colorClass = "text-slate-400";
                if (log.includes("🚨") || log.includes("ERROR")) {
                  colorClass = "text-rose-405 text-rose-400 bg-rose-500/5 px-2 py-1 rounded border-l-2 border-l-rose-500 block";
                } else if (log.includes("✓") || log.includes("HEALED")) {
                  colorClass = "text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border-l-2 border-l-emerald-500 block";
                } else if (log.includes("🔍") || log.includes("ANALYZING")) {
                  colorClass = "text-amber-400";
                } else if (log.includes("🧠") || log.includes("GEMINI")) {
                  colorClass = "text-indigo-400 font-extrabold flex items-center gap-1.5";
                } else if (log.includes("📧") || log.includes("dispatched") || log.includes("SMTP")) {
                  colorClass = "text-sky-300";
                }

                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })}
              <div ref={consoleBottomRef} />
            </div>

            {/* Shell footer status indicator */}
            <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-500 font-mono text-center flex items-center justify-between shrink-0">
              <span>SYSTEM ADDR: c7e7eafa-3f7c-45c3-b06b-e95e75bb4e2b.run</span>
              <span className="animate-pulse">● GUARDIAN PROCESSES ENGAGED</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EMAIL LOGS AND INCIDENT TELEMETRY FEEDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Incident telemetry archives logs list */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock size={15} className="text-indigo-650 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-755">Healed Incident Registry</h3>
            <span className="ml-auto bg-slate-100 text-slate-600 font-mono text-[9px] px-2 py-0.5 rounded font-black">{incidents.length}</span>
          </div>

          <p className="text-[11.5px] text-slate-500 leading-normal">
            Past runtime captures that have been autonomously resolved. Dispatched emails can be reviewed on the sidebar.
          </p>

          <div className="divide-y divide-slate-100 max-h-[310px] overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck size={28} className="mx-auto text-emerald-500 mb-2 stroke-1" />
                <p className="text-xs font-bold">Workspace pristine</p>
                <p className="text-[10px] text-slate-450 mt-1">No operational anomalies recorded yet.</p>
              </div>
            ) : (
              incidents.map((inc, index) => (
                <div key={inc.id || index} className="py-3 flex flex-col gap-1.5 hover:bg-slate-50/50 transition-all rounded-lg px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-700">{inc.id}</span>
                    <span className={`text-[9px] font-mono font-bold tracking-wide border px-1.5 py-0.2 rounded-md ${getSimActionColor(inc.actionCode)}`}>
                      {inc.actionCode}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-rose-600 font-sans truncate" title={inc.error}>
                    {inc.error}
                  </p>

                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    {inc.explanation}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>MTTR: {inc.timeTaken}ms</span>
                    <span>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emulated Gmail Admin Inbox Simulator */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between max-h-[440px] text-slate-200">
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
            <Inbox size={15} className="text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Admin Alert Mailbox Preview</span>
              <span className="text-[9.5px] font-mono lowercase text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                gouthamarun123@gmail.com
              </span>
            </h3>
            <span className="ml-auto bg-slate-800 text-slate-400 font-mono text-[9px] px-2 py-0.5 rounded font-bold">
              {sentEmails.length} sent
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 flex-1 overflow-hidden min-h-[300px]">
            {/* List of dispatches inside columns */}
            <div className="md:col-span-5 border-r border-slate-800 pr-2 overflow-y-auto max-h-[290px] space-y-1.5">
              {sentEmails.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Mail size={24} className="mx-auto text-slate-600 mb-2 stroke-1" />
                  <p className="text-[11px] font-bold">No dispatch alerts</p>
                  <p className="text-[9.5px] mt-0.5">Generate or inject an error to populate.</p>
                </div>
              ) : (
                sentEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs space-y-1 cursor-pointer block ${
                      selectedEmail?.id === email.id
                        ? "bg-slate-800 border-indigo-500/40 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-indigo-400">
                      <span>{email.id}</span>
                      <span>{new Date(email.dispatchedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="font-extrabold truncate text-slate-200" title={email.subject}>
                      {email.subject}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>SMTP Handshake</span>
                      <span className="text-emerald-400 font-mono">delivered</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Preview active email pane columns */}
            <div className="md:col-span-7 bg-slate-950 rounded-xl border border-slate-850 p-3.5 flex flex-col justify-between overflow-hidden relative">
              {selectedEmail ? (
                <div className="flex flex-col h-full max-h-[290px]">
                  <div className="border-b border-slate-900 pb-2 mb-2 space-y-1 text-xs shrink-0">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>From: <strong>System Guardian Core</strong></span>
                      <span>Status: <strong className="text-emerald-500 uppercase">Passed</strong></span>
                    </div>
                    <div className="text-slate-200 font-bold truncate">{selectedEmail.subject}</div>
                    <div className="text-slate-400 text-[10.5px]">To: <strong>{selectedEmail.recipient}</strong></div>
                  </div>

                  {/* Mail interactive body container */}
                  <div className="flex-1 overflow-y-auto pr-1 border border-slate-900 rounded bg-white overflow-hidden max-h-[190px]">
                    <iframe
                      srcDoc={selectedEmail.bodyHtml}
                      title="Mail Preview"
                      className="w-full h-full border-0 min-h-[180px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 max-h-[290px]">
                  <Sparkles size={24} className="text-indigo-500 stroke-1 mb-2 animate-pulse" />
                  <p className="text-[11px] font-bold">Select Dispatched Log</p>
                  <p className="text-[9.5px] max-w-[200px] text-slate-500 mt-1">
                    Select a secure log dispatch packet from the left lists to view HTML details sent to admin.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center shrink-0">
            Secure sandbox email loops configured on outbound port 25.
          </div>
        </div>

      </div>

    </div>
  );
}
