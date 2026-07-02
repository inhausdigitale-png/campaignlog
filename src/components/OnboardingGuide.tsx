import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Target,
  Megaphone,
  Palette,
  Users,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Play,
  TrendingUp,
  Sliders,
  HardDriveDownload
} from "lucide-react";

interface OnboardingGuideProps {
  onNavigate: (tab: any) => void;
}

export default function OnboardingGuide({ onNavigate }: OnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const dismissed = localStorage.getItem("onboarding_dismissed");
    return dismissed !== "true";
  });
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setIsOpen(false);
  };

  const handleReset = () => {
    localStorage.removeItem("onboarding_dismissed");
    setCurrentStep(0);
    setIsOpen(true);
  };

  const steps = [
    {
      title: "Welcome to Campaign Master Portal",
      description: "Hi! This platform helps you run, track, and optimize your real estate marketing campaigns without needing to be an Excel or ad-tech expert. Let's walk through the core sections in 1 minute.",
      icon: Lightbulb,
      color: "bg-indigo-50 text-indigo-700 border-indigo-100",
      targetTab: "dashboard",
      visualText: "Explore real-time budgets, conversions, and get continuous AI optimization recommendations directly from Gemini.",
      bulletPoints: [
        "Interactive Charting: Visualizes and compares performance across networks.",
        "Gemini Copilot: Evaluates clicks, spends, and conversions and advises budget reallocation in 1-click.",
        "Simulated Roles Panel: Easily mock different user rights."
      ]
    },
    {
      title: "Step 1: Set Your Targets & Benchmarks",
      description: "First, laymen should declare what targets they want to hit. Setting weekly target budgets, cost benchmarks, and SLA (Service Level Agreement) counts allows the dashboard to measure your performance accurately.",
      icon: Target,
      color: "bg-amber-50 text-amber-700 border-amber-100",
      targetTab: "targets",
      visualText: "Located in the 'Weekly Targets' tab.",
      bulletPoints: [
        "Specify weekly budget limits.",
        "Declare target numbers of site visits (SVC) and cost per lead (CPL).",
        "Set alert levels for cost overflow warnings."
      ]
    },
    {
      title: "Step 2: Log Campaigns & Bulk Uploads",
      description: "Next, you can input your active campaign performance records. You can do this by manual entries or by simply uploading campaign reports (CSV) provided by your agencies.",
      icon: Megaphone,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      targetTab: "performance",
      visualText: "Check the 'Campaign' & 'Change Log' tabs.",
      bulletPoints: [
        "Ad Campaigns: View current spends, conversion rates, and CTR.",
        "Bulk Upload: Import agency performance spreadsheets directly.",
        "Change Audit Log: Track adjustments to budget, status, and operator actions."
      ]
    },
    {
      title: "Step 3: Generate Creative Copy using AI",
      description: "Need attractive copywriting concepts, headlines, and visual requirements for your ad campaigns? Use the built-in Gemini AI engine to draft high-converting assets instantly.",
      icon: Palette,
      color: "bg-violet-50 text-violet-700 border-violet-100",
      targetTab: "creatives",
      visualText: "Click on 'Creative Performance' in the sidebar.",
      bulletPoints: [
        "Generate creative titles, visual directions, and punchy body text using Gemini.",
        "Automatically grade assets using AI Relevance Scores.",
        "Maintain ad-variants and keep track of live vs archived creatives."
      ]
    },
    {
      title: "Step 4: Manage Leads & Site Visits (SVC)",
      description: "Track your incoming leads, their status (New, Contacted, Negotiating, etc.), and record daily site visits (SVC) to know exactly which platform is converting traffic into real buyers.",
      icon: Users,
      color: "bg-cyan-50 text-cyan-705 border-cyan-100",
      targetTab: "portals",
      visualText: "Navigate to 'Portal Leads' tab.",
      bulletPoints: [
        "SVC Matrix: Input portal reports to audit daily agency numbers.",
        "Lead Profiles Database: Maintain names, emails, phones, and status.",
        "Export individual entries or bulk upload new user listings."
      ]
    },
    {
      title: "Step 5: Configure Optimization Rules",
      description: "Automate policy alerts to keep your ad spend optimized overnight. You can set automated rules that will notify you if CPC goes too high, or pause unsupportive campaigns if CPL spikes.",
      icon: Sliders,
      color: "bg-rose-50 text-rose-700 border-rose-100",
      targetTab: "rules",
      visualText: "Found in 'Rule Configuration' in the sidebar.",
      bulletPoints: [
        "Configure automated thresholds for Max CPL.",
        "Apply live rules over select platforms.",
        "Enable simulated live triggers for continuous protection."
      ]
    },
    {
      title: "Step 6: Quick Document Download Center",
      description: "Finally, generate highly-compatible files of any database collection. With precise date range selection and custom search filters, laymen can download custom documents instantly.",
      icon: HardDriveDownload,
      color: "bg-teal-50 text-teal-700 border-teal-100",
      targetTab: "download_reports",
      visualText: "Explore the brand new 'Download Reports' section.",
      bulletPoints: [
        "Choose custom start and end date ranges to crop output.",
        "Export dynamically clean spreadsheets (CSV) or JSON models.",
        "See live preview list showing first 10 rows before downloading."
      ]
    }
  ];

  if (!isOpen) {
    return (
      <div className="flex justify-end pr-1 pb-1">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all cursor-pointer shadow-3xs"
        >
          <HelpCircle size={13} className="text-indigo-650" />
          <span>Interactive Layman's Guide</span>
        </button>
      </div>
    );
  }

  const activeStepObj = steps[currentStep];
  const IconComponent = activeStepObj.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in relative text-left">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="p-1 px-2 border border-slate-100 text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50/50 rounded-md">
            Layman Walking Tour
          </span>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold font-sans">
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span>Interactive Onboarding Guided Assistant</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
          title="Close Onboarding"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1.5 items-center">
        {/* Left icon display */}
        <div className="md:col-span-1 flex justify-center md:justify-start">
          <div className={`p-4 rounded-2xl border ${activeStepObj.color} flex items-center justify-center`}>
            <IconComponent size={28} className="animate-wiggle" />
          </div>
        </div>

        {/* Narrative columns */}
        <div className="md:col-span-7 space-y-2">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 text-white font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {currentStep + 1}
            </span>
            {activeStepObj.title}
          </h3>
          <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium text-slate-600">
            {activeStepObj.description}
          </p>
          <span className="inline-block text-[10px] uppercase tracking-wider text-slate-400 font-bold block pt-1">
            📌 Component Range: <span className="text-indigo-650 text-indigo-600 underline font-extrabold">{activeStepObj.visualText}</span>
          </span>
        </div>

        {/* Right checklist snippet */}
        <div className="md:col-span-4 bg-slate-50/70 border border-slate-150 p-3.5 rounded-xl space-y-2 text-left self-stretch flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Core Features Highlight</span>
            <ul className="space-y-1.5">
              {activeStepObj.bulletPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10.5px] text-slate-600">
                  <CheckCircle2 size={12} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => onNavigate(activeStepObj.targetTab)}
            className="w-full mt-2.5 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Play size={10} className="fill-indigo-700 shrink-0" />
            <span>Go to active view: {activeStepObj.targetTab.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Stepper controls */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-2">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === currentStep ? "bg-indigo-600 w-8" : "bg-slate-200 hover:bg-slate-300 w-2.5"
              }`}
              title={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <ArrowLeft size={12} />
              <span>Previous</span>
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>Next Guide</span>
              <ArrowRight size={12} />
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <span>I got it! Let's Go</span>
              <CheckCircle2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
