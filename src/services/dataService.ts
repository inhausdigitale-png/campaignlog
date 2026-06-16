import { db, isFirebaseEnabled, OperationType, handleFirestoreError, disableFirebaseSync } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  setDoc as firestoreSetDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";

function cleanUndefinedForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedForFirestore);
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefinedForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

const setDoc = (ref: any, data: any, options?: any) => {
  const cleanedData = cleanUndefinedForFirestore(data);
  return firestoreSetDoc(ref, cleanedData, options);
};
import { Campaign, AuditLog, Lead, CreativeAsset, CampaignReport, MetricComparison, ChangeLogEntry, PortalReportRow, TargetBudgetRow, RuleConfiguration, CampaignPerformance, Invite } from "../types";

// Key definitions for LocalStorage fallback
const KEYS = {
  CAMPAIGNS: "marketing_copilot_campaigns",
  AUDIT_LOGS: "marketing_copilot_audit_logs",
  PORTAL_LEADS: "marketing_copilot_portal_leads",
  CREATIVES: "marketing_copilot_creatives",
  REPORTS: "marketing_copilot_reports",
  COMPARISONS: "marketing_copilot_comparisons",
  CHANGE_LOGS: "marketing_copilot_change_logs",
  PORTAL_REPORTS: "marketing_copilot_portal_reports",
  TARGET_BUDGETS: "marketing_copilot_target_budgets",
  RULE_SETTINGS: "marketing_copilot_rule_settings",
  PERF_TRACKERS: "marketing_copilot_perf_trackers",
  INVITES: "marketing_copilot_invites",
};

// Seed-level root logins
export const INITIAL_INVITES: Invite[] = [
  {
    id: "inv-root-admin",
    email: "gouthamarun123@gmail.com",
    role: "Admin",
    invitedBy: "System Root",
    status: "accepted",
    password: "admin123",
    createdAt: new Date("2026-06-01T00:00:00Z").toISOString(),
  },
  {
    id: "inv-simple-admin",
    email: "admin@copilot.com",
    role: "Admin",
    invitedBy: "System Root",
    status: "accepted",
    password: "admin123",
    createdAt: new Date("2026-06-01T00:00:01Z").toISOString(),
  }
];

// Seamless visual placeholders for creative graphics
const CREATIVE_GAMES_PLACEHOLDER = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";
const CREATIVE_SOLAR_PLACEHOLDER = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80";
const CREATIVE_B2B_PLACEHOLDER = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80";

// Seeds (Initial Mock Data)
const INITIAL_CAMPAIGNS: Campaign[] = [];

const INITIAL_AUDITS: AuditLog[] = [];

const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-001",
    campaignId: "camp-g-001",
    campaignName: "Google Search - High-Intent Solar Lead Gen",
    leadName: "Marcus Henderson",
    email: "marcus.solar@gmail.com",
    phone: "+1 (555) 732-9182",
    platform: "Google Ads",
    status: "Negotiating",
    notes: "Interested in the 8.5kW premium rooftop package. Wants a customized battery storage quotation.",
    createdAt: new Date("2026-06-09T14:22:00Z").toISOString(),
  },
  {
    id: "lead-002",
    campaignId: "camp-m-002",
    campaignName: "Meta Retargeting - Lookalike Audiences Q2",
    leadName: "Sarah Jenkins",
    email: "sarah.j.creative@outlook.com",
    phone: "+1 (415) 309-5412",
    platform: "Meta (Facebook)",
    status: "Contacted",
    notes: "Applied via Facebook Instant Lead Forms. Responded with the standard 15% discount coupon.",
    createdAt: new Date("2026-06-10T18:05:00Z").toISOString(),
  },
  {
    id: "lead-003",
    campaignId: "camp-l-003",
    campaignName: "LinkedIn - Enterprise CRM Decision Makers",
    leadName: "David Vance (Director of Ops)",
    email: "dvance@enterprise-tech.io",
    phone: "+1 (800) 554-1922",
    platform: "LinkedIn",
    status: "New",
    notes: "Downloaded whitepaper. Awaiting initial account development representative outreach sequence.",
    createdAt: new Date("2026-06-11T07:11:00Z").toISOString(),
  },
  {
    id: "lead-004",
    campaignId: "camp-g-001",
    campaignName: "Google Search - High-Intent Solar Lead Gen",
    leadName: "Robert Albright",
    email: "ralbright@yahoo.com",
    phone: "+1 (312) 690-1124",
    platform: "Google Ads",
    status: "Closed Won",
    notes: "Residential contract signed! Installed scheduled for July 12th. Commission booked successfully.",
    createdAt: new Date("2026-06-05T09:44:00Z").toISOString(),
  }
];

const INITIAL_CREATIVES: CreativeAsset[] = [
  {
    id: "creative-001",
    campaignId: "camp-g-001",
    campaignName: "Google Search - High-Intent Solar Lead Gen",
    name: "A/B Text Variant - Absolute Solar Cost Savings",
    platform: "Google Ads",
    imageUrl: CREATIVE_SOLAR_PLACEHOLDER,
    headline: "Cut Your Power Bills by Up to 70% | Instant Rebates Approved",
    bodyText: "Lock in standard clean solar rates starting under $39/mo. Zero money down options are fully available. Calculate your savings in under 20 seconds.",
    clicks: 430,
    conversions: 55,
    spend: 1100,
    status: "active",
    createdAt: new Date("2026-05-01T08:15:00Z").toISOString(),
    aiScore: 92,
    aiStrengths: "Directly addresses financial pain points ('70% cut') and standard incentives.",
    aiWeaknesses: "Doesn't focus on eco-friendly aspects or energy security trends.",
    aiSuggestedHeadline: "Slash Electric Bills to Zero | Instant Federal Solar Credits",
    aiSuggestedBody: "No down payment options on premium energy systems. Claim your local tax rebate credit before Q3 closes."
  },
  {
    id: "creative-002",
    campaignId: "camp-m-002",
    campaignName: "Meta Retargeting - Lookalike Audiences Q2",
    name: "Social Ad - Lifestyle Relax Infographic",
    platform: "Meta (Facebook)",
    imageUrl: CREATIVE_B2B_PLACEHOLDER,
    headline: "Stop Wasting 10 Hours a Week on Manual Lead Reporting Reports",
    bodyText: "Connect all your ad networks directly. See a unified visual pipeline, track lead contacts, and generate report logs in one click. Try Serene free.",
    clicks: 1420,
    conversions: 112,
    spend: 1500,
    status: "active",
    createdAt: new Date("2026-04-16T10:00:00Z").toISOString(),
    aiScore: 88,
    aiStrengths: "Strong pain-point identification ('wasting 10 hours') with quantitative value proposition.",
    aiWeaknesses: "Image choice could benefit from human-centric, emotive workspace expressions.",
    aiSuggestedHeadline: "Reclaim 10 Hours of Marketing Drama is Standard",
    aiSuggestedBody: "Instantly consolidate Google, Meta, and LinkedIn spend into deep reporting boards."
  }
];

const INITIAL_PERF_TRACKERS: CampaignPerformance[] = [
  {
    id: "perf-001",
    campaignName: "Meta - Premium Apartment Launch",
    adsetName: "LAL_5%_RealEstate_Buyers",
    adAccountId: "act_40391039",
    projectName: "Grand Horizon Residence",
    leads: 64,
    impression: 85200,
    reach: 42100,
    ctr: 1.54,
    amountSpend: 48000,
    clicks: 1312,
    svc: 18,
    booked: 4,
    cplCpa: 750,
    createdAt: new Date("2026-06-11T10:00:00Z").toISOString(),
  },
  {
    id: "perf-002",
    campaignName: "Google Search - Luxury Villas",
    adsetName: "Search_Exact_Keywords",
    adAccountId: "act_20938491",
    projectName: "Oakridge Estate",
    leads: 35,
    impression: 25400,
    reach: 12800,
    ctr: 2.85,
    amountSpend: 52500,
    clicks: 724,
    svc: 12,
    booked: 2,
    cplCpa: 1500,
    createdAt: new Date("2026-06-11T11:20:00Z").toISOString(),
  }
];

const INITIAL_REPORTS: CampaignReport[] = [
  {
    id: "rep-001",
    date: "2026-06-11",
    projectName: "Solar Lead Expansion",
    campaignName: "Meta - High-Intent Solar leads",
    adAccountId: "act_102948192",
    leads: 48,
    reach: 24500,
    impression: 41200,
    amountSpend: 1150,
    targetLeads: 40,
    achievedLeads: 48,
    svcBooking: 15,
    adsets: "LAL_3%_Solar_Rooftop",
    createdAt: new Date("2026-06-11T12:00:00Z").toISOString(),
  },
  {
    id: "rep-002",
    date: "2026-06-10",
    projectName: "CRM Enterprise Pitch",
    campaignName: "LinkedIn - Decision Maker InMail",
    adAccountId: "act_883019284",
    leads: 12,
    reach: 8900,
    impression: 15400,
    amountSpend: 2400,
    targetLeads: 15,
    achievedLeads: 12,
    svcBooking: 4,
    adsets: "VPs_Sales_USA",
    createdAt: new Date("2026-06-10T11:00:00Z").toISOString(),
  }
];

const INITIAL_COMPARISONS: MetricComparison[] = [
  {
    id: "comp-1",
    metric: "Target Cost per Lead (CPL)",
    beforeValue: "$32.40",
    afterValue: "$24.08",
    improved: "Yes",
    leads: 142,
    svc: 38,
    svcPercent: 26.7,
    booked: 14,
    bookedPercent: 9.8,
    owner: "Gouthamarun",
    followUp: "Review Bid-Cap strategy next Monday",
    status: "Active",
    createdAt: new Date("2026-06-10T15:30:00Z").toISOString(),
  },
  {
    id: "comp-2",
    metric: "Daily Clicks & Lead Volume",
    beforeValue: "18 leads / day",
    afterValue: "28 leads / day",
    improved: "Yes",
    leads: 198,
    svc: 42,
    svcPercent: 21.2,
    booked: 20,
    bookedPercent: 10.1,
    owner: "Growth Team",
    followUp: "Monitor lookalike audience cost decay",
    status: "Active",
    createdAt: new Date("2026-06-08T11:20:00Z").toISOString(),
  }
];

const INITIAL_CHANGE_LOG_ENTRIES: ChangeLogEntry[] = [
  {
    id: "chg-101",
    date: "2026-06-11",
    project: "Solar Lead Expansion",
    campaignId: "act_102948192",
    campaignName: "Meta - High-Intent Solar leads",
    adSetName: "LAL_3%_Solar_Rooftop",
    campaignStatus: "active",
    type: "Budget Adjustment",
    changed: "Daily Budget: ₹8,000 -> ₹12,500",
    reason: "Leads achieved (48) exceeded target leads (40). Increased budget to high-ROI ad set.",
    createdAt: new Date("2026-06-11T12:15:00Z").toISOString(),
    lastEditedAt: new Date("2026-06-11T14:30:00Z").toISOString(),
    lastEditedBy: "authorized_operator@example.in",
    progress: "Implemented"
  },
  {
    id: "chg-102",
    date: "2026-06-10",
    project: "CRM Enterprise Pitch",
    campaignId: "act_883019284",
    campaignName: "LinkedIn - Decision Maker InMail",
    adSetName: "VPs_Sales_USA",
    campaignStatus: "paused",
    type: "Bid Adjustment",
    changed: "CPC Bid: ₹700 -> ₹510",
    reason: "CPL target exceeded standard. Adjusting maximum bid cap down.",
    createdAt: new Date("2026-06-10T11:45:00Z").toISOString(),
    lastEditedAt: undefined,
    lastEditedBy: undefined,
    progress: "In Progress"
  }
];

// Seed databases for Portal performance reports
const RAW_PORTAL_LEAL_DATA = [
  // May 01 - May 03
  { d: "2026-05-01", h: [5, 2], a: [6, 1], m: [5, 3], r: [0, 0] },
  { d: "2026-05-02", h: [1, 2], a: [6, 0], m: [7, 1], r: [1, 0] },
  { d: "2026-05-03", h: [3, 1], a: [5, 3], m: [9, 1], r: [0, 0] },
  // May 04 - May 10
  { d: "2026-05-04", h: [4, 0], a: [6, 2], m: [7, 0], r: [1, 0] },
  { d: "2026-05-05", h: [2, 1], a: [3, 0], m: [9, 1], r: [0, 0] },
  { d: "2026-05-06", h: [6, 1], a: [7, 1], m: [8, 0], r: [2, 0] },
  { d: "2026-05-07", h: [1, 0], a: [1, 1], m: [4, 0], r: [1, 0] },
  { d: "2026-05-08", h: [4, 0], a: [3, 1], m: [12, 0], r: [1, 0] },
  { d: "2026-05-09", h: [3, 1], a: [2, 1], m: [11, 3], r: [0, 0] },
  { d: "2026-05-10", h: [3, 2], a: [4, 1], m: [16, 1], r: [0, 0] },
  // May 11 - May 17
  { d: "2026-05-11", h: [2, 0], a: [1, 1], m: [8, 0], r: [3, 1] },
  { d: "2026-05-12", h: [1, 0], a: [0, 1], m: [5, 2], r: [1, 0] },
  { d: "2026-05-13", h: [1, 0], a: [4, 0], m: [5, 0], r: [3, 0] },
  { d: "2026-05-14", h: [2, 0], a: [7, 2], m: [2, 0], r: [2, 0] },
  { d: "2026-05-15", h: [0, 0], a: [5, 0], m: [6, 0], r: [2, 0] },
  { d: "2026-05-16", h: [6, 0], a: [7, 2], m: [6, 1], r: [1, 2] },
  { d: "2026-05-17", h: [7, 1], a: [8, 1], m: [6, 2], r: [1, 1] },
  // May 18 - May 24
  { d: "2026-05-18", h: [15, 1], a: [6, 0], m: [1, 0], r: [2, 0] },
  { d: "2026-05-19", h: [2, 0], a: [1, 0], m: [0, 0], r: [1, 0] },
  { d: "2026-05-20", h: [5, 0], a: [5, 0], m: [13, 0], r: [2, 0] },
  { d: "2026-05-21", h: [5, 0], a: [3, 0], m: [5, 0], r: [0, 0] },
  { d: "2026-05-22", h: [13, 0], a: [11, 0], m: [9, 0], r: [0, 0] },
  { d: "2026-05-23", h: [3, 1], a: [4, 0], m: [8, 2], r: [1, 0] },
  { d: "2026-05-24", h: [3, 0], a: [7, 0], m: [6, 0], r: [0, 0] },
  // May 25 - May 31
  { d: "2026-05-25", h: [1, 1], a: [5, 0], m: [2, 0], r: [1, 0] },
  { d: "2026-05-26", h: [8, 0], a: [6, 0], m: [10, 0], r: [0, 0] },
  { d: "2026-05-27", h: [6, 0], a: [5, 1], m: [11, 2], r: [1, 0] },
  { d: "2026-05-28", h: [11, 1], a: [4, 0], m: [9, 2], r: [4, 0] },
  { d: "2026-05-29", h: [8, 1], a: [6, 0], m: [11, 1], r: [1, 0] },
  { d: "2026-05-30", h: [5, 0], a: [3, 1], m: [12, 1], r: [0, 1] },
  { d: "2026-05-31", h: [4, 0], a: [9, 1], m: [10, 2], r: [0, 0] },
  // June 01 - June 07
  { d: "2026-06-01", h: [10, 5], a: [11, 3], m: [1, 1], r: [1, 0] },
  { d: "2026-06-02", h: [8, 3], a: [8, 3], m: [6, 2], r: [2, 1] },
  { d: "2026-06-03", h: [14, 7], a: [4, 1], m: [3, 1], r: [0, 0] },
  { d: "2026-06-04", h: [10, 5], a: [10, 4], m: [2, 3], r: [0, 1] },
  { d: "2026-06-05", h: [11, 4], a: [7, 7], m: [15, 7], r: [2, 1] },
  { d: "2026-06-06", h: [13, 6], a: [7, 8], m: [5, 10], r: [0, 0] },
  { d: "2026-06-07", h: [7, 6], a: [7, 5], m: [3, 0], r: [0, 1] },
  // June 08 - June 14
  { d: "2026-06-08", h: [16, 0], a: [2, 0], m: [5, 0], r: [0, 0] },
  { d: "2026-06-09", h: [11, 0], a: [9, 0], m: [6, 0], r: [2, 0] },
  { d: "2026-06-10", h: [23, 0], a: [8, 0], m: [5, 0], r: [0, 0] },
  { d: "2026-06-11", h: [24, 0], a: [8, 0], m: [5, 0], r: [0, 0] },
  { d: "2026-06-12", h: [25, 0], a: [3, 0], m: [1, 0], r: [0, 0] },
  { d: "2026-06-13", h: [22, 0], a: [5, 3], m: [2, 0], r: [1, 0] },
  { d: "2026-06-14", h: [12, 1], a: [13, 1], m: [5, 3], r: [0, 1] }
];

const INITIAL_PORTAL_REPORTS: PortalReportRow[] = [];
// RAW_PORTAL_LEAL_DATA seeding is completed empty to clear already existing data on clean load


const INITIAL_TARGET_BUDGETS: TargetBudgetRow[] = [
  {
    id: "tar-001",
    month: "2026-06",
    project: "Skyline Residency",
    medium: "Digital - Meta Ads",
    budget: 15000,
    spend: 6400,
    totalLeadTarget: 400,
    totalLeadAchieved: 185,
    digitalLeadTarget: 300,
    digitalLeadAchieved: 145,
    btlLeadTarget: 100,
    btlLeadAchieved: 40,
    leadAllocation: 180,
    siteVisit: 64,
    booking: 8,
    week1: { spend: 2000, totalLeadAchieved: 55, digitalLeadAchieved: 42, btlLeadAchieved: 13, leadAllocation: 50, siteVisit: 20, booking: 2 },
    week2: { spend: 2200, totalLeadAchieved: 68, digitalLeadAchieved: 52, btlLeadAchieved: 16, leadAllocation: 65, siteVisit: 22, booking: 3 },
    week3: { spend: 2200, totalLeadAchieved: 62, digitalLeadAchieved: 51, btlLeadAchieved: 11, leadAllocation: 65, siteVisit: 22, booking: 3 },
    week4: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
    week5: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
    createdAt: new Date("2026-06-01T00:00:00Z").toISOString(),
  },
  {
    id: "tar-002",
    month: "2026-06",
    project: "Green Gardens Phase 2",
    medium: "Digital - Google Ads",
    budget: 10000,
    spend: 4100,
    totalLeadTarget: 250,
    totalLeadAchieved: 110,
    digitalLeadTarget: 200,
    digitalLeadAchieved: 95,
    btlLeadTarget: 50,
    btlLeadAchieved: 15,
    leadAllocation: 100,
    siteVisit: 38,
    booking: 4,
    week1: { spend: 1300, totalLeadAchieved: 35, digitalLeadAchieved: 30, btlLeadAchieved: 5, leadAllocation: 30, siteVisit: 12, booking: 1 },
    week2: { spend: 1450, totalLeadAchieved: 42, digitalLeadAchieved: 35, btlLeadAchieved: 7, leadAllocation: 40, siteVisit: 15, booking: 2 },
    week3: { spend: 1350, totalLeadAchieved: 33, digitalLeadAchieved: 30, btlLeadAchieved: 3, leadAllocation: 30, siteVisit: 11, booking: 1 },
    week4: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
    week5: { spend: 0, totalLeadAchieved: 0, digitalLeadAchieved: 0, btlLeadAchieved: 0, leadAllocation: 0, siteVisit: 0, booking: 0 },
    createdAt: new Date("2026-06-01T00:00:00Z").toISOString(),
  }
];

const DEFAULT_RULE_CONFIGURATION: RuleConfiguration = {
  id: "global",
  targetCpa: 450,
  minRoas: 2.8,
  minCtr: 1.8,
  minCvr: 2.2,
  reviewDays: 4,
  warningSpend: 1200,
  updatedAt: new Date("2026-06-01T00:00:00Z").toISOString(),
};

let activeUserEmail: string | null = null;

// Helper to get partitioned key (Partitioning disabled to allow collaborative team workspace views)
function getPartitionedKey(key: string): string {
  return key;
}

// Helper to load LocalStorage state
function loadLocal<T>(key: string, defaultVals: T[]): T[] {
  const finalKey = getPartitionedKey(key);
  try {
    const data = localStorage.getItem(finalKey);
    if (!data) {
      localStorage.setItem(finalKey, JSON.stringify(defaultVals));
      return defaultVals;
    }
    return JSON.parse(data);
  } catch (err) {
    console.warn(`LocalStorage failed to parse key ${finalKey}, using defaults.`);
    return defaultVals;
  }
}

// Helper to save LocalStorage state
function saveLocal<T>(key: string, data: T[]) {
  const finalKey = getPartitionedKey(key);
  try {
    localStorage.setItem(finalKey, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed saving localstorage key ${finalKey}`);
  }
}

// Global path/collection wrappers for Firebase (Shared unpartitioned paths for multi-user collaboration)
function getCollectionRef(name: string) {
  return collection(db, name);
}

function getDocRef(name: string, docId: string) {
  return doc(db, name, docId);
}

const FIRESTORE_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[FIREBASE] Request timed out after ${FIRESTORE_TIMEOUT_MS}ms. Falling back to local cache to keep the session highly responsive.`);
      resolve(fallback);
    }, FIRESTORE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

const FIRESTORE_WRITE_TIMEOUT_MS = 10000;

async function withWriteTimeout(promise: Promise<any>, path: string): Promise<any> {
  let timer: any;
  const timeoutPromise = new Promise<any>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[FIREBASE] Write request to ${path} timed out after ${FIRESTORE_WRITE_TIMEOUT_MS}ms.`));
    }, FIRESTORE_WRITE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch (err) {
    if (timer) clearTimeout(timer);
    throw err;
  }
}

// Exported Data Service Coordinating both Local and Cloud Database Engines
export const dataService = {
  // Set partition email
  setUserEmail(email: string | null) {
    activeUserEmail = email ? email.toLowerCase() : null;
    console.log(`[DATA_SERVICE] Active partition updated: ${activeUserEmail || "global_sandbox"}`);
  },

  // --- Campaigns ---
  async getCampaigns(): Promise<Campaign[]> {
    const SEED_VERSION_KEY = "campaigns_seeded_v15_clean";
    if (typeof localStorage !== "undefined") {
      if (!localStorage.getItem(SEED_VERSION_KEY)) {
        localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(INITIAL_CAMPAIGNS));
        localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDITS));
        localStorage.setItem(SEED_VERSION_KEY, "true");
      }
    }

    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("campaigns"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));

          // Seed cloud DB once if empty
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS));
      } catch (err) {
        console.error("Firestore getCampaigns error, continuing with local fallback:", err);
      }
    }
    return loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  },

  async clearAllCampaigns(): Promise<boolean> {
    // 1. Local Cache - Purge everything to avoid mapped campaign regenerations
    saveLocal(KEYS.CAMPAIGNS, []);
    saveLocal(KEYS.AUDIT_LOGS, []);
    saveLocal(KEYS.PORTAL_LEADS, []);
    saveLocal(KEYS.CREATIVES, []);
    saveLocal(KEYS.REPORTS, []);
    saveLocal(KEYS.COMPARISONS, []);
    saveLocal(KEYS.CHANGE_LOGS, []);
    saveLocal(KEYS.PORTAL_REPORTS, []);
    saveLocal(KEYS.TARGET_BUDGETS, []);
    saveLocal(KEYS.PERF_TRACKERS, []);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        const collectionsToPurge = [
          "campaigns",
          "audit_logs",
          "portal_leads",
          "creative_performance",
          "campaign_reports",
          "metric_comparisons",
          "change_log_entries",
          "portal_reports",
          "target_budgets",
          "campaign_performances"
        ];

        for (const colName of collectionsToPurge) {
          const q = query(getCollectionRef(colName));
          const snapshot = await getDocs(q);
          for (const docSnap of snapshot.docs) {
            await deleteDoc(getDocRef(colName, docSnap.id));
          }
        }
      } catch (err) {
        console.error("[FIREBASE] clearAllCampaigns Firestore sync failed:", err);
      }
    }
    return true;
  },

  async saveCampaign(campaign: Campaign, loggedInUserEmail: string): Promise<Campaign> {
    const isNew = !campaign.id || campaign.id.length === 0 || campaign.id.startsWith("temp-");
    const activeId = isNew ? "camp-" + Math.random().toString(36).substring(2, 9) : campaign.id;
    const finalCampaign: Campaign = {
      ...campaign,
      id: activeId,
      updatedAt: new Date().toISOString(),
      createdAt: campaign.createdAt || new Date().toISOString(),
    };

    // Calculate logs
    let logDescription = `Created standard campaign '${finalCampaign.name}' on platform '${finalCampaign.platform}'.`;
    if (!isNew) {
      logDescription = `Updated campaign '${finalCampaign.name}' fields. Budget: ₹${finalCampaign.budget}, Status: '${finalCampaign.status}'.`;
    }

    // 1. Local Cache (Always updated first for lightning-fast UI response)
    const list = loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    const idx = list.findIndex((c) => c.id === campaign.id);
    if (idx !== -1) {
      const prev = list[idx];
      const changes: string[] = [];
      if (prev.budget !== finalCampaign.budget) changes.push(`Budget altered from ₹${prev.budget} to ₹${finalCampaign.budget}`);
      if (prev.status !== finalCampaign.status) changes.push(`Status converted from '${prev.status}' to '${finalCampaign.status}'`);
      if (prev.name !== finalCampaign.name) changes.push(`Name retitled from '${prev.name}' to '${finalCampaign.name}'`);
      if (prev.spend !== finalCampaign.spend) changes.push(`Spend changed from ₹${prev.spend} to ₹${finalCampaign.spend}`);
      if (prev.conversions !== finalCampaign.conversions) changes.push(`Conversions adjusted from ${prev.conversions} to ${finalCampaign.conversions}`);

      logDescription = changes.length > 0
        ? `Altered campaign '${finalCampaign.name}': ` + changes.join("; ")
        : `Saved updates on campaign '${finalCampaign.name}'.`;

      list[idx] = finalCampaign;
    } else {
      list.push(finalCampaign);
    }
    saveLocal(KEYS.CAMPAIGNS, list);

    // Record Audit trail log locally
    const logs = loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS);
    const logRecord: AuditLog = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      campaignId: activeId,
      campaignName: finalCampaign.name,
      changedBy: loggedInUserEmail || "anonymous_ops",
      action: isNew ? "Create Campaign" : "Update Campaign",
      details: logDescription,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(logRecord);
    saveLocal(KEYS.AUDIT_LOGS, logs);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("campaigns", activeId), finalCampaign), `campaigns/${activeId}`);
        await withWriteTimeout(setDoc(getDocRef("audit_logs", logRecord.id), logRecord), `audit_logs/${logRecord.id}`);
      } catch (err) {
        console.warn("[FIREBASE] saveCampaign Firestore sync bypassed, using local cache fallback:", err);
      }
    }

    return finalCampaign;
  },

  async deleteCampaign(id: string, name: string, loggedInUserEmail: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.CAMPAIGNS, filtered);

    const logs = loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS);
    const logRecord: AuditLog = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      campaignId: id,
      campaignName: name,
      changedBy: loggedInUserEmail || "anonymous_ops",
      action: "Delete Campaign",
      details: `Permenently deleted campaign '${name}' from database tracking system.`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(logRecord);
    saveLocal(KEYS.AUDIT_LOGS, logs);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("campaigns", id)), `campaigns/${id}`);
        await withWriteTimeout(setDoc(getDocRef("audit_logs", logRecord.id), logRecord), `audit_logs/${logRecord.id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteCampaign Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("audit_logs"), orderBy("timestamp", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));

          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS));
      } catch (err) {
        console.error("Firestore getAuditLogs error, continuing with local fallback:", err);
      }
    }
    return loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS);
  },

  async addManualAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const finalLog: AuditLog = {
      ...log,
      id: "log-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(getDocRef("audit_logs", finalLog.id), finalLog);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `audit_logs/${finalLog.id}`);
      }
    } else {
      const logs = loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS);
      logs.unshift(finalLog);
      saveLocal(KEYS.AUDIT_LOGS, logs);
    }
    return finalLog;
  },

  // --- Portal Leads ---
  async getLeads(): Promise<Lead[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("portal_leads"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));

          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS));
      } catch (err) {
        console.error("Firestore getLeads error, continuing with local fallback:", err);
      }
    }
    return loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
  },

  async saveLead(lead: Lead): Promise<Lead> {
    const isNew = !lead.id || lead.id.length === 0 || lead.id.startsWith("temp-");
    const activeId = isNew ? "lead-" + Math.random().toString(36).substring(2, 9) : lead.id;
    const finalLead: Lead = {
      ...lead,
      id: activeId,
      createdAt: lead.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
    const idx = list.findIndex((l) => l.id === lead.id);
    if (idx !== -1) {
      list[idx] = finalLead;
    } else {
      list.unshift(finalLead);
    }
    saveLocal(KEYS.PORTAL_LEADS, list);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("portal_leads", activeId), finalLead), `portal_leads/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveLead Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return finalLead;
  },

  async saveLeadsBulk(leads: Lead[]): Promise<Lead[]> {
    if (leads.length === 0) return [];
    
    const list = loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
    const finalLeads = leads.map(lead => {
      const isNew = !lead.id || lead.id.length === 0 || lead.id.startsWith("temp-");
      const activeId = isNew ? "lead-" + Math.random().toString(36).substring(2, 9) : lead.id;
      return {
        ...lead,
        id: activeId,
        createdAt: lead.createdAt || new Date().toISOString(),
      };
    });

    for (const finalLead of finalLeads) {
      const idx = list.findIndex((l) => l.id === finalLead.id);
      if (idx !== -1) {
        list[idx] = finalLead;
      } else {
        list.unshift(finalLead);
      }
    }
    saveLocal(KEYS.PORTAL_LEADS, list);

    if (isFirebaseEnabled) {
      try {
        const batchSize = 400;
        for (let i = 0; i < finalLeads.length; i += batchSize) {
          const chunk = finalLeads.slice(i, i + batchSize);
          const batch = writeBatch(db);
          chunk.forEach((finalLead) => {
            const docRef = getDocRef("portal_leads", finalLead.id);
            const cleanedData = cleanUndefinedForFirestore(finalLead);
            batch.set(docRef, cleanedData);
          });
          await withWriteTimeout(batch.commit(), `portal_leads_batch_${i}`);
        }
      } catch (err) {
        console.warn("[FIREBASE] saveLeadsBulk Cloud sync failed:", err);
      }
    }
    return finalLeads;
  },

  async deleteLead(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
    const filtered = list.filter((l) => l.id !== id);
    saveLocal(KEYS.PORTAL_LEADS, filtered);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("portal_leads", id)), `portal_leads/${id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteLead Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Creative Performance ---
  async getCreatives(): Promise<CreativeAsset[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("creative_performance"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CreativeAsset));

          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES));
      } catch (err) {
        console.error("Firestore getCreatives error, continuing with local fallback:", err);
      }
    }
    return loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES);
  },

  async saveCreative(creative: CreativeAsset): Promise<CreativeAsset> {
    const isNew = !creative.id || creative.id.length === 0 || creative.id.startsWith("temp-");
    const activeId = isNew ? "creative-" + Math.random().toString(36).substring(2, 9) : creative.id;
    const finalCreative: CreativeAsset = {
      ...creative,
      id: activeId,
      createdAt: creative.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES);
    const idx = list.findIndex((c) => c.id === creative.id);
    if (idx !== -1) {
      list[idx] = finalCreative;
    } else {
      list.unshift(finalCreative);
    }
    saveLocal(KEYS.CREATIVES, list);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("creative_performance", activeId), finalCreative), `creative_performance/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveCreative Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return finalCreative;
  },

  async deleteCreative(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.CREATIVES, filtered);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("creative_performance", id)), `creative_performance/${id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteCreative Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Campaign Reports ---
  async getCampaignReports(): Promise<CampaignReport[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("campaign_reports"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CampaignReport));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS));
      } catch (err) {
        console.error("Firestore getCampaignReports error, continuing with local fallback:", err);
      }
    }
    return loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS);
  },

  async saveCampaignReport(rep: CampaignReport): Promise<CampaignReport> {
    const isNew = !rep.id || rep.id.length === 0 || rep.id.startsWith("temp-");
    const activeId = isNew ? "rep-" + Math.random().toString(36).substring(2, 9) : rep.id;
    const finalReport: CampaignReport = {
      ...rep,
      id: activeId,
      createdAt: rep.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS);
    const idx = list.findIndex((c) => c.id === rep.id);
    if (idx !== -1) {
      list[idx] = finalReport;
    } else {
      list.unshift(finalReport);
    }
    saveLocal(KEYS.REPORTS, list);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("campaign_reports", activeId), finalReport), `campaign_reports/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveCampaignReport Firestore sync failed, using local cache fallback:", err);
      }
    }
    return finalReport;
  },

  async deleteCampaignReport(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.REPORTS, filtered);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("campaign_reports", id)), `campaign_reports/${id}`);
        return true;
      } catch (err) {
        console.warn("[FIREBASE] deleteCampaignReport Firestore sync failed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Metric Comparisons ---
  async getMetricComparisons(): Promise<MetricComparison[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("metric_comparisons"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MetricComparison));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS));
      } catch (err) {
        console.error("Firestore getMetricComparisons error, continuing with local fallback:", err);
      }
    }
    return loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS);
  },

  async saveMetricComparison(comp: MetricComparison): Promise<MetricComparison> {
    const isNew = !comp.id || comp.id.length === 0 || comp.id.startsWith("temp-");
    const activeId = isNew ? "comp-" + Math.random().toString(36).substring(2, 9) : comp.id;
    const finalComp: MetricComparison = {
      ...comp,
      id: activeId,
      createdAt: comp.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS);
    const idx = list.findIndex((c) => c.id === comp.id);
    if (idx !== -1) {
      list[idx] = finalComp;
    } else {
      list.unshift(finalComp);
    }
    saveLocal(KEYS.COMPARISONS, list);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("metric_comparisons", activeId), finalComp), `metric_comparisons/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveMetricComparison Firestore sync failed, using local cache fallback:", err);
      }
    }
    return finalComp;
  },

  async deleteMetricComparison(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.COMPARISONS, filtered);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("metric_comparisons", id)), `metric_comparisons/${id}`);
        return true;
      } catch (err) {
        console.warn("[FIREBASE] deleteMetricComparison Firestore sync failed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Change Log Entries ---
  async getChangeLogEntries(): Promise<ChangeLogEntry[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("change_log_entries"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChangeLogEntry));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES));
      } catch (err) {
        console.error("Firestore getChangeLogEntries error, continuing with local fallback:", err);
      }
    }
    return loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES);
  },

  async saveChangeLogEntry(chg: ChangeLogEntry): Promise<ChangeLogEntry> {
    const isNew = !chg.id || chg.id.length === 0 || chg.id.startsWith("temp-") || chg.id.startsWith("chg-temp-");
    const activeId = isNew ? "chg-" + Math.random().toString(36).substring(2, 9) : chg.id;
    const finalChg: ChangeLogEntry = {
      ...chg,
      id: activeId,
      createdAt: chg.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES);
    const idx = list.findIndex((c) => c.id === chg.id);
    if (idx !== -1) {
      list[idx] = finalChg;
    } else {
      list.unshift(finalChg);
    }
    saveLocal(KEYS.CHANGE_LOGS, list);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("change_log_entries", activeId), finalChg), `change_log_entries/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveChangeLogEntry Firestore sync failed, using local cache fallback:", err);
      }
    }
    return finalChg;
  },

  async deleteChangeLogEntry(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.CHANGE_LOGS, filtered);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("change_log_entries", id)), `change_log_entries/${id}`);
        return true;
      } catch (err) {
        console.warn("[FIREBASE] deleteChangeLogEntry Firestore sync failed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Portal Reports ---
  async getPortalReports(): Promise<PortalReportRow[]> {
    const SEED_VERSION_KEY = "portal_reports_seeded_v15_clean";
    if (typeof localStorage !== "undefined") {
      if (!localStorage.getItem(SEED_VERSION_KEY)) {
        localStorage.setItem(KEYS.PORTAL_REPORTS, JSON.stringify(INITIAL_PORTAL_REPORTS));
        localStorage.setItem(SEED_VERSION_KEY, "true");
      }
    }

    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("portal_reports"), orderBy("date", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PortalReportRow));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS));
      } catch (err) {
        console.error("Firestore getPortalReports error, continuing with local fallback:", err);
      }
    }
    return loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
  },

  async saveSharedReport(report: any): Promise<string> {
    const activeId = "share-" + Math.random().toString(36).substring(2, 9);
    const finalReport = {
      ...report,
      id: activeId,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      await setDoc(getDocRef("shared_reports", activeId), finalReport);
    }
    return activeId;
  },

  async getSharedReport(id: string): Promise<any> {
    if (isFirebaseEnabled) {
      try {
        const snap = await getDocs(query(getCollectionRef("shared_reports"))); // Simplified for this exercise
        const doc = snap.docs.find(d => d.id === id);
        return doc ? doc.data() : null;
      } catch (err) {
        console.error("Failed to fetch shared report:", err);
      }
    }
    return null;
  },

  async clearAllPortalReports(): Promise<boolean> {
    // 1. Local Cache
    saveLocal(KEYS.PORTAL_REPORTS, []);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        const q = query(getCollectionRef("portal_reports"));
        const snapshot = await getDocs(q);
        for (const docSnap of snapshot.docs) {
          await deleteDoc(getDocRef("portal_reports", docSnap.id));
        }
      } catch (err) {
        console.error("[FIREBASE] clearAllPortalReports Firestore sync failed:", err);
      }
    }
    return true;
  },

  async savePortalReport(row: PortalReportRow): Promise<PortalReportRow> {
    const isNew = !row.id || row.id.length === 0 || row.id.startsWith("temp-");
    const activeId = isNew ? "p-rep-" + Math.random().toString(36).substring(2, 9) : row.id;
    const finalRow: PortalReportRow = {
      ...row,
      id: activeId,
      createdAt: row.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
    const idx = list.findIndex((r) => r.id === row.id);
    if (idx !== -1) {
      list[idx] = finalRow;
    } else {
      list.unshift(finalRow);
    }
    saveLocal(KEYS.PORTAL_REPORTS, list);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("portal_reports", activeId), finalRow), `portal_reports/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] savePortalReport Firestore sync failed, using local cache fallback:", err);
      }
    }
    return finalRow;
  },

  async deletePortalReport(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
    const filtered = list.filter((r) => r.id !== id);
    saveLocal(KEYS.PORTAL_REPORTS, filtered);

    // 2. Cloud Sync
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("portal_reports", id)), `portal_reports/${id}`);
        return true;
      } catch (err) {
        console.warn("[FIREBASE] deletePortalReport Firestore sync failed, using local cache fallback:", err);
      }
    }
    return true;
  },

  async savePortalReportsBulk(rows: PortalReportRow[]): Promise<PortalReportRow[]> {
    if (rows.length === 0) return [];

    // 1. Local Cache - update all rows in a single batch synchronous operation
    const list = loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);

    const finalRows = rows.map(row => {
      const isNew = !row.id || row.id.length === 0 || row.id.startsWith("p-rep-temp-") || row.id.startsWith("temp-");
      const activeId = isNew ? "p-rep-" + Math.random().toString(36).substring(2, 9) : row.id;
      return {
        ...row,
        id: activeId,
        createdAt: row.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    for (const finalRow of finalRows) {
      const idx = list.findIndex(
        (r) => r.id === finalRow.id || (r.date === finalRow.date && r.project === finalRow.project && r.portal === finalRow.portal)
      );
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...finalRow };
      } else {
        list.unshift(finalRow);
      }
    }
    saveLocal(KEYS.PORTAL_REPORTS, list);

    // 2. Cloud Sync - run setDoc writes using batch
    if (isFirebaseEnabled) {
      try {
        const batchSize = 400; // max 500 per batch
        for (let i = 0; i < finalRows.length; i += batchSize) {
          const chunk = finalRows.slice(i, i + batchSize);
          const batch = writeBatch(db);
          chunk.forEach((finalRow) => {
            const docRef = getDocRef("portal_reports", finalRow.id);
            const cleanedData = cleanUndefinedForFirestore(finalRow);
            batch.set(docRef, cleanedData);
          });
          await withWriteTimeout(batch.commit(), `portal_reports_batch_${i}`);
        }
      } catch (err) {
        console.error("[FIREBASE] savePortalReportsBulk Cloud sync failed:", err);
      }
    }

    return finalRows;
  },

  // --- Target Budget Ledger ---
  async getTargetBudgets(): Promise<TargetBudgetRow[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("target_budgets"), orderBy("month", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TargetBudgetRow));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS));
      } catch (err) {
        console.error("Firestore getTargetBudgets error, continuing with local fallback:", err);
      }
    }
    return loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
  },

  async saveTargetBudget(row: TargetBudgetRow): Promise<TargetBudgetRow> {
    const isNew = !row.id || row.id.length === 0 || row.id.startsWith("temp-");
    const activeId = isNew ? "tar-" + Math.random().toString(36).substring(2, 9) : row.id;
    const finalRow: TargetBudgetRow = {
      ...row,
      id: activeId,
      createdAt: row.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
    const idx = list.findIndex((t) => t.id === row.id);
    if (idx !== -1) {
      list[idx] = finalRow;
    } else {
      list.unshift(finalRow);
    }
    saveLocal(KEYS.TARGET_BUDGETS, list);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("target_budgets", activeId), finalRow), `target_budgets/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveTargetBudget Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return finalRow;
  },

  async saveTargetBudgetsBulk(rows: TargetBudgetRow[]): Promise<TargetBudgetRow[]> {
    if (rows.length === 0) return [];
    
    const list = loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
    const finalRows = rows.map(row => {
      const isNew = !row.id || row.id.length === 0 || row.id.startsWith("temp-");
      const activeId = isNew ? "tar-" + Math.random().toString(36).substring(2, 9) : row.id;
      return {
        ...row,
        id: activeId,
        createdAt: row.createdAt || new Date().toISOString(),
      };
    });

    for (const finalRow of finalRows) {
      const idx = list.findIndex((t) => t.id === finalRow.id);
      if (idx !== -1) {
        list[idx] = finalRow;
      } else {
        list.unshift(finalRow);
      }
    }
    saveLocal(KEYS.TARGET_BUDGETS, list);

    if (isFirebaseEnabled) {
      try {
        const batchSize = 400;
        for (let i = 0; i < finalRows.length; i += batchSize) {
          const chunk = finalRows.slice(i, i + batchSize);
          const batch = writeBatch(db);
          chunk.forEach((finalRow) => {
            const docRef = getDocRef("target_budgets", finalRow.id);
            const cleanedData = cleanUndefinedForFirestore(finalRow);
            batch.set(docRef, cleanedData);
          });
          await withWriteTimeout(batch.commit(), `target_budgets_batch_${i}`);
        }
      } catch (err) {
        console.warn("[FIREBASE] saveTargetBudgetsBulk Cloud sync failed:", err);
      }
    }
    return finalRows;
  },

  async deleteTargetBudget(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
    const filtered = list.filter((t) => t.id !== id);
    saveLocal(KEYS.TARGET_BUDGETS, filtered);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("target_budgets", id)), `target_budgets/${id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteTargetBudget Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  },

  // --- Rule Settings ---
  async getRuleConfiguration(): Promise<RuleConfiguration> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = getCollectionRef("rule_settings");
          const snapshot = await getDocs(q);
          const docsList = snapshot.docs;
          if (docsList.length === 0) {
            console.log("[FIREBASE] Seed rule default settings...");
            await setDoc(getDocRef("rule_settings", "global"), DEFAULT_RULE_CONFIGURATION);
            return DEFAULT_RULE_CONFIGURATION;
          }
          const found = docsList.find(d => d.id === "global") || docsList[0];
          return { id: found.id, ...found.data() } as RuleConfiguration;
        })();
        return await withTimeout(fetchPromise, DEFAULT_RULE_CONFIGURATION);
      } catch (err) {
        console.error("Firestore getRuleConfiguration error, continuing with local fallback:", err);
      }
    }
    const list = loadLocal<RuleConfiguration>(KEYS.RULE_SETTINGS, [DEFAULT_RULE_CONFIGURATION]);
    return list[0] || DEFAULT_RULE_CONFIGURATION;
  },

  async saveRuleConfiguration(rule: RuleConfiguration): Promise<RuleConfiguration> {
    const finalRule: RuleConfiguration = {
      ...rule,
      id: "global",
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(getDocRef("rule_settings", "global"), finalRule);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, "rule_settings/global");
      }
    } else {
      saveLocal(KEYS.RULE_SETTINGS, [finalRule]);
    }
    return finalRule;
  },

  // --- Campaign Performance Trackers ---
  async getCampaignPerformances(): Promise<CampaignPerformance[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("campaign_performances"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CampaignPerformance));
          
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS));
      } catch (err) {
        console.error("Firestore getCampaignPerformances error, continuing with local fallback:", err);
      }
    }
    return loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
  },

  async saveCampaignPerformance(perf: CampaignPerformance): Promise<CampaignPerformance> {
    const isNew = !perf.id || perf.id.length === 0 || perf.id.startsWith("temp-");
    const activeId = isNew ? "perf-" + Math.random().toString(36).substring(2, 9) : perf.id;
    const finalPerf: CampaignPerformance = {
      ...perf,
      id: activeId,
      createdAt: perf.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
    const idx = list.findIndex((c) => c.id === perf.id);
    if (idx !== -1) {
      list[idx] = finalPerf;
    } else {
      list.unshift(finalPerf);
    }
    saveLocal(KEYS.PERF_TRACKERS, list);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(setDoc(getDocRef("campaign_performances", activeId), finalPerf), `campaign_performances/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveCampaignPerformance Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return finalPerf;
  },

  async saveCampaignPerformancesBulk(perfs: CampaignPerformance[]): Promise<CampaignPerformance[]> {
    if (perfs.length === 0) return [];
    
    const list = loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
    const finalPerfs = perfs.map(perf => {
      const isNew = !perf.id || perf.id.length === 0 || perf.id.startsWith("temp-");
      const activeId = isNew ? "perf-" + Math.random().toString(36).substring(2, 9) : perf.id;
      return {
        ...perf,
        id: activeId,
        createdAt: perf.createdAt || new Date().toISOString(),
      };
    });

    for (const finalPerf of finalPerfs) {
      const idx = list.findIndex((c) => c.id === finalPerf.id);
      if (idx !== -1) {
        list[idx] = finalPerf;
      } else {
        list.unshift(finalPerf);
      }
    }
    saveLocal(KEYS.PERF_TRACKERS, list);

    if (isFirebaseEnabled) {
      try {
        const batchSize = 400;
        for (let i = 0; i < finalPerfs.length; i += batchSize) {
          const chunk = finalPerfs.slice(i, i + batchSize);
          const batch = writeBatch(db);
          chunk.forEach((finalPerf) => {
            const docRef = getDocRef("campaign_performances", finalPerf.id);
            const cleanedData = cleanUndefinedForFirestore(finalPerf);
            batch.set(docRef, cleanedData);
          });
          await withWriteTimeout(batch.commit(), `campaign_performances_batch_${i}`);
        }
      } catch (err) {
        console.warn("[FIREBASE] saveCampaignPerformancesBulk Cloud sync failed:", err);
      }
    }
    return finalPerfs;
  },

  async deleteCampaignPerformance(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.PERF_TRACKERS, filtered);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("campaign_performances", id)), `campaign_performances/${id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteCampaignPerformance Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  },

  async getInvites(): Promise<Invite[]> {
    let list: Invite[] = [];
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(getCollectionRef("invites"));
          const snapshot = await getDocs(q);
          const results: Invite[] = [];
          snapshot.forEach((docRef) => {
            results.push({ id: docRef.id, ...docRef.data() } as Invite);
          });
          return results;
        })();
        const cloudList = await withTimeout(fetchPromise, null);
        if (cloudList !== null) {
          list = cloudList;
        } else {
          list = loadLocal<Invite>(KEYS.INVITES, INITIAL_INVITES);
        }
      } catch (err) {
        console.error("Firestore getInvites error, continuing with local fallback:", err);
        list = loadLocal<Invite>(KEYS.INVITES, INITIAL_INVITES);
      }
    } else {
      list = loadLocal<Invite>(KEYS.INVITES, INITIAL_INVITES);
    }

    // Secure sync fallback: Ensure INITIAL_INVITES are ALWAYS present in the returned list.
    // If any seed account is missing, inject it so that login is 100% bulletproof for the user under any environment state.
    let changed = false;
    for (const seed of INITIAL_INVITES) {
      if (!list.some(inv => inv.email.toLowerCase() === seed.email.toLowerCase())) {
        list.push(seed);
        changed = true;
      }
    }

    if (changed) {
      saveLocal(KEYS.INVITES, list);
      if (isFirebaseEnabled) {
        // Sync back to cloud in background if possible
        for (const seed of INITIAL_INVITES) {
          try {
            setDoc(getDocRef("invites", seed.id), seed);
          } catch (_) {}
        }
      }
    }

    return list;
  },

  async saveInvite(invite: Invite): Promise<Invite> {
    const isNew = !invite.id || invite.id.length === 0 || invite.id.startsWith("temp-");
    const activeId = isNew ? "inv-" + Math.random().toString(36).substring(2, 9) : invite.id;
    const finalInvite: Invite = {
      ...invite,
      id: activeId,
      createdAt: invite.createdAt || new Date().toISOString(),
    };

    // 1. Local Cache
    const list = loadLocal<Invite>(KEYS.INVITES, INITIAL_INVITES);
    const idx = list.findIndex((c) => c.id === invite.id);
    if (idx !== -1) {
      list[idx] = finalInvite;
    } else {
      list.unshift(finalInvite);
    }
    saveLocal(KEYS.INVITES, list);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        const cleanedData = cleanUndefinedForFirestore(finalInvite);
        await withWriteTimeout(setDoc(getDocRef("invites", activeId), cleanedData), `invites/${activeId}`);
      } catch (err) {
        console.warn("[FIREBASE] saveInvite Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return finalInvite;
  },

  async deleteInvite(id: string): Promise<boolean> {
    // 1. Local Cache
    const list = loadLocal<Invite>(KEYS.INVITES, INITIAL_INVITES);
    const filtered = list.filter((c) => c.id !== id);
    saveLocal(KEYS.INVITES, filtered);

    // 2. Cloud Sync (Safe Timeout)
    if (isFirebaseEnabled) {
      try {
        await withWriteTimeout(deleteDoc(getDocRef("invites", id)), `invites/${id}`);
      } catch (err) {
        console.warn("[FIREBASE] deleteInvite Firestore sync bypassed, using local cache fallback:", err);
      }
    }
    return true;
  }
};
