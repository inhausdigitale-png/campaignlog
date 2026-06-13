import { db, isFirebaseEnabled, OperationType, handleFirestoreError, disableFirebaseSync } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { Campaign, AuditLog, Lead, CreativeAsset, CampaignReport, MetricComparison, ChangeLogEntry, PortalReportRow, TargetBudgetRow, RuleConfiguration, CampaignPerformance } from "../types";

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
};

// Seamless visual placeholders for creative graphics
const CREATIVE_GAMES_PLACEHOLDER = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";
const CREATIVE_SOLAR_PLACEHOLDER = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80";
const CREATIVE_B2B_PLACEHOLDER = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80";

// Seeds (Initial Mock Data)
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-g-001",
    name: "Google Search - High-Intent Solar Lead Gen",
    status: "active",
    platform: "Google Ads",
    budget: 5000,
    spend: 3420,
    conversions: 142,
    clicks: 1240,
    impressions: 15400,
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    objectives: "Generate phone call is and form fill leads for residential solar installations.",
    createdAt: new Date("2026-05-01T08:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-10T15:30:00Z").toISOString(),
    leads: 142,
    svcBooking: 48,
  },
  {
    id: "camp-m-002",
    name: "Meta Retargeting - Lookalike Audiences Q2",
    status: "active",
    platform: "Meta (Facebook)",
    budget: 3500,
    spend: 3100,
    conversions: 198,
    clicks: 2890,
    impressions: 48900,
    startDate: "2026-04-15",
    endDate: "2026-06-15",
    objectives: "Retarget prior web visitors and custom Lookalike audiences with discount promo code.",
    createdAt: new Date("2026-04-15T09:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-08T11:20:00Z").toISOString(),
    leads: 198,
    svcBooking: 62,
  },
  {
    id: "camp-l-003",
    name: "LinkedIn - Enterprise CRM Decision Makers",
    status: "paused",
    platform: "LinkedIn",
    budget: 8000,
    spend: 4200,
    conversions: 37,
    clicks: 650,
    impressions: 8900,
    startDate: "2026-05-10",
    endDate: "2026-07-10",
    objectives: "Download whitepaper leads targeting VPs of Sales and Sales Ops at 500+ employee companies.",
    createdAt: new Date("2026-05-10T10:30:00Z").toISOString(),
    updatedAt: new Date("2026-06-11T09:00:00Z").toISOString(),
    leads: 37,
    svcBooking: 12,
  },
  {
    id: "camp-t-004",
    name: "TikTok - Brand Amplification Launch",
    status: "active",
    platform: "TikTok",
    budget: 2500,
    spend: 1850,
    conversions: 84,
    clicks: 4120,
    impressions: 98000,
    startDate: "2026-05-20",
    endDate: "2026-06-25",
    objectives: "Drive visual clicks, user-generated-content challenges, and gen-z product landing hits.",
    createdAt: new Date("2026-05-20T14:45:00Z").toISOString(),
    updatedAt: new Date("2026-06-05T10:15:00Z").toISOString(),
    leads: 84,
    svcBooking: 16,
  },
  {
    id: "camp-y-005",
    name: "YouTube - Product Review Prerolls",
    status: "draft",
    platform: "YouTube",
    budget: 4000,
    spend: 0,
    conversions: 0,
    clicks: 0,
    impressions: 0,
    startDate: "2026-06-15",
    endDate: "2026-08-15",
    objectives: "60-second video reviews focusing on features, battery life, and overall setup guides.",
    createdAt: new Date("2026-06-01T11:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-01T11:00:00Z").toISOString(),
    leads: 0,
    svcBooking: 0,
  }
];

const INITIAL_AUDITS: AuditLog[] = [
  {
    id: "audit-1",
    campaignId: "camp-g-001",
    campaignName: "Google Search - High-Intent Solar Lead Gen",
    changedBy: "gouthamarun123@gmail.com",
    action: "Budget Adjustment",
    details: "Increased campaign budget from $4,000 to $5,000 due to high historical performance and a low Cost per Acquisition ($24.08).",
    timestamp: new Date("2026-06-10T15:30:00Z").toISOString(),
  },
  {
    id: "audit-2",
    campaignId: "camp-l-003",
    campaignName: "LinkedIn - Enterprise CRM Decision Makers",
    changedBy: "gouthamarun123@gmail.com",
    action: "Paused Campaign",
    details: "Paused the campaign temporarily because the cost per CRM lead surpassed the limits of $110 target (currently at $113.51).",
    timestamp: new Date("2026-06-11T09:00:00Z").toISOString(),
  },
  {
    id: "audit-3",
    campaignId: "camp-m-002",
    campaignName: "Meta Retargeting - Lookalike Audiences Q2",
    changedBy: "growth_analyst@example.com",
    action: "Replaced Ad Copy Graphic",
    details: "Updated primary banner creative. Replaced standard layout picture with a high-contrast customer testimonial infographic.",
    timestamp: new Date("2026-06-08T11:20:00Z").toISOString(),
  }
];

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
const INITIAL_PORTAL_REPORTS: PortalReportRow[] = [
  {
    id: "p-rep-001",
    date: "2026-06-10",
    portal: "Housing",
    project: "Skyline Residency",
    generated: 45,
    svs: 18,
    svc: 12,
    walkin: 6,
    gross: 1,
    net: 1,
    createdAt: new Date("2026-06-10T09:00:00Z").toISOString(),
  },
  {
    id: "p-rep-002",
    date: "2026-06-09",
    portal: "99 Acres",
    project: "Green Gardens Phase 2",
    generated: 32,
    svs: 14,
    svc: 8,
    walkin: 4,
    gross: 0,
    net: 0,
    createdAt: new Date("2026-06-09T10:15:00Z").toISOString(),
  },
  {
    id: "p-rep-003",
    date: "2026-06-08",
    portal: "Magicbricks",
    project: "Urban Elite Suites",
    generated: 58,
    svs: 24,
    svc: 15,
    walkin: 9,
    gross: 2,
    net: 2,
    createdAt: new Date("2026-06-08T11:30:00Z").toISOString(),
  },
  {
    id: "p-rep-004",
    date: "2026-06-07",
    portal: "Roof&floor",
    project: "Skyline Residency",
    generated: 15,
    svs: 6,
    svc: 4,
    walkin: 2,
    gross: 0,
    net: 0,
    createdAt: new Date("2026-06-07T14:45:00Z").toISOString(),
  }
];

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

// Helper to load LocalStorage state
function loadLocal<T>(key: string, defaultVals: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultVals));
      return defaultVals;
    }
    return JSON.parse(data);
  } catch (err) {
    console.warn(`LocalStorage failed to parse key ${key}, using defaults.`);
    return defaultVals;
  }
}

// Helper to save LocalStorage state
function saveLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed saving localstorage key ${key}`);
  }
}

const FIRESTORE_TIMEOUT_MS = 1500;

async function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[FIREBASE] Request timed out. Disabling Firebase sync to let the app load securely via Local Sandbox.`);
      disableFirebaseSync();
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

// Exported Data Service Coordinating both Local and Cloud Database Engines
export const dataService = {
  // --- Campaigns ---
  async getCampaigns(): Promise<Campaign[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));

          // Seed cloud DB once if empty
          if (list.length === 0) {
            console.log("[FIREBASE] Campaign collection empty. Seeding defaults...");
            for (const camp of INITIAL_CAMPAIGNS) {
              await setDoc(doc(db, "campaigns", camp.id), camp);
            }
            return INITIAL_CAMPAIGNS;
          }
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS));
      } catch (err) {
        console.error("Firestore getCampaigns error, continuing with local fallback:", err);
      }
    }
    return loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
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
      logDescription = `Updated campaign '${finalCampaign.name}' fields. Budget: $${finalCampaign.budget}, Status: '${finalCampaign.status}'.`;
    }

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "campaigns", activeId), finalCampaign);
        // Create an audit trail record
        const logId = "log-" + Math.random().toString(36).substring(2, 9);
        const logRecord: AuditLog = {
          id: logId,
          campaignId: activeId,
          campaignName: finalCampaign.name,
          changedBy: loggedInUserEmail || "anonymous_ops",
          action: isNew ? "Create Campaign" : "Update Campaign",
          details: logDescription,
          timestamp: new Date().toISOString(),
        };
        await setDoc(doc(db, "audit_logs", logId), logRecord);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `campaigns/${activeId}`);
      }
    } else {
      // LocalStorage mode
      const list = loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
      const idx = list.findIndex((c) => c.id === campaign.id);
      if (idx !== -1) {
        // Log differences specifically
        const prev = list[idx];
        const changes: string[] = [];
        if (prev.budget !== finalCampaign.budget) changes.push(`Budget altered from $${prev.budget} to $${finalCampaign.budget}`);
        if (prev.status !== finalCampaign.status) changes.push(`Status converted from '${prev.status}' to '${finalCampaign.status}'`);
        if (prev.name !== finalCampaign.name) changes.push(`Name retitled from '${prev.name}' to '${finalCampaign.name}'`);
        if (prev.spend !== finalCampaign.spend) changes.push(`Spend changed from $${prev.spend} to $${finalCampaign.spend}`);
        if (prev.conversions !== finalCampaign.conversions) changes.push(`Conversions adjusted from ${prev.conversions} to ${finalCampaign.conversions}`);

        logDescription = changes.length > 0 
          ? `Altered campaign '${finalCampaign.name}': ` + changes.join("; ")
          : `Saved updates on campaign '${finalCampaign.name}'.`;

        list[idx] = finalCampaign;
      } else {
        list.push(finalCampaign);
      }
      saveLocal(KEYS.CAMPAIGNS, list);

      // Record Audit trail log
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
    }

    return finalCampaign;
  },

  async deleteCampaign(id: string, name: string, loggedInUserEmail: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "campaigns", id));
        // Add audit trail record
        const logId = "log-" + Math.random().toString(36).substring(2, 9);
        const logRecord: AuditLog = {
          id: logId,
          campaignId: id,
          campaignName: name,
          changedBy: loggedInUserEmail || "anonymous_ops",
          action: "Delete Campaign",
          details: `Permenently deleted campaign '${name}' from database tracking system.`,
          timestamp: new Date().toISOString(),
        };
        await setDoc(doc(db, "audit_logs", logId), logRecord);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `campaigns/${id}`);
      }
    } else {
      const list = loadLocal<Campaign>(KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.CAMPAIGNS, filtered);

      const logs = loadLocal<AuditLog>(KEYS.AUDIT_LOGS, INITIAL_AUDITS);
      logs.unshift({
        id: "log-" + Math.random().toString(36).substring(2, 9),
        campaignId: id,
        campaignName: name,
        changedBy: loggedInUserEmail || "anonymous_ops",
        action: "Delete Campaign",
        details: `Permenently deleted campaign '${name}' from analytics tracking logs.`,
        timestamp: new Date().toISOString(),
      });
      saveLocal(KEYS.AUDIT_LOGS, logs);
      return true;
    }
    return false;
  },

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));

          if (list.length === 0) {
            console.log("[FIREBASE] Seed audit trail logs...");
            for (const l of INITIAL_AUDITS) {
              await setDoc(doc(db, "audit_logs", l.id), l);
            }
            return INITIAL_AUDITS;
          }
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
        await setDoc(doc(db, "audit_logs", finalLog.id), finalLog);
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
          const q = query(collection(db, "portal_leads"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));

          if (list.length === 0) {
            console.log("[FIREBASE] Seed lead portal records...");
            for (const l of INITIAL_LEADS) {
              await setDoc(doc(db, "portal_leads", l.id), l);
            }
            return INITIAL_LEADS;
          }
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

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "portal_leads", activeId), finalLead);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `portal_leads/${activeId}`);
      }
    } else {
      const list = loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
      const idx = list.findIndex((l) => l.id === lead.id);
      if (idx !== -1) {
        list[idx] = finalLead;
      } else {
        list.unshift(finalLead);
      }
      saveLocal(KEYS.PORTAL_LEADS, list);
    }
    return finalLead;
  },

  async deleteLead(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "portal_leads", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `portal_leads/${id}`);
      }
    } else {
      const list = loadLocal<Lead>(KEYS.PORTAL_LEADS, INITIAL_LEADS);
      const filtered = list.filter((l) => l.id !== id);
      saveLocal(KEYS.PORTAL_LEADS, filtered);
      return true;
    }
    return false;
  },

  // --- Creative Performance ---
  async getCreatives(): Promise<CreativeAsset[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "creative_performance"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CreativeAsset));

          if (list.length === 0) {
            console.log("[FIREBASE] Seed creative collection files...");
            for (const c of INITIAL_CREATIVES) {
              await setDoc(doc(db, "creative_performance", c.id), c);
            }
            return INITIAL_CREATIVES;
          }
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

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "creative_performance", activeId), finalCreative);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `creative_performance/${activeId}`);
      }
    } else {
      const list = loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES);
      const idx = list.findIndex((c) => c.id === creative.id);
      if (idx !== -1) {
        list[idx] = finalCreative;
      } else {
        list.unshift(finalCreative);
      }
      saveLocal(KEYS.CREATIVES, list);
    }
    return finalCreative;
  },

  async deleteCreative(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "creative_performance", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `creative_performance/${id}`);
      }
    } else {
      const list = loadLocal<CreativeAsset>(KEYS.CREATIVES, INITIAL_CREATIVES);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.CREATIVES, filtered);
      return true;
    }
    return false;
  },

  // --- Campaign Reports ---
  async getCampaignReports(): Promise<CampaignReport[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "campaign_reports"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CampaignReport));
          if (list.length === 0) {
            console.log("[FIREBASE] Seed campaign reports...");
            for (const rep of INITIAL_REPORTS) {
              await setDoc(doc(db, "campaign_reports", rep.id), rep);
            }
            return INITIAL_REPORTS;
          }
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
    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "campaign_reports", activeId), finalReport);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `campaign_reports/${activeId}`);
      }
    } else {
      const list = loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS);
      const idx = list.findIndex((c) => c.id === rep.id);
      if (idx !== -1) {
        list[idx] = finalReport;
      } else {
        list.unshift(finalReport);
      }
      saveLocal(KEYS.REPORTS, list);
    }
    return finalReport;
  },

  async deleteCampaignReport(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "campaign_reports", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `campaign_reports/${id}`);
      }
    } else {
      const list = loadLocal<CampaignReport>(KEYS.REPORTS, INITIAL_REPORTS);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.REPORTS, filtered);
      return true;
    }
    return false;
  },

  // --- Metric Comparisons ---
  async getMetricComparisons(): Promise<MetricComparison[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "metric_comparisons"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MetricComparison));
          if (list.length === 0) {
            console.log("[FIREBASE] Seed metric comparisons...");
            for (const comp of INITIAL_COMPARISONS) {
              await setDoc(doc(db, "metric_comparisons", comp.id), comp);
            }
            return INITIAL_COMPARISONS;
          }
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
    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "metric_comparisons", activeId), finalComp);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `metric_comparisons/${activeId}`);
      }
    } else {
      const list = loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS);
      const idx = list.findIndex((c) => c.id === comp.id);
      if (idx !== -1) {
        list[idx] = finalComp;
      } else {
        list.unshift(finalComp);
      }
      saveLocal(KEYS.COMPARISONS, list);
    }
    return finalComp;
  },

  async deleteMetricComparison(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "metric_comparisons", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `metric_comparisons/${id}`);
      }
    } else {
      const list = loadLocal<MetricComparison>(KEYS.COMPARISONS, INITIAL_COMPARISONS);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.COMPARISONS, filtered);
      return true;
    }
    return false;
  },

  // --- Change Log Entries ---
  async getChangeLogEntries(): Promise<ChangeLogEntry[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "change_log_entries"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChangeLogEntry));
          if (list.length === 0) {
            console.log("[FIREBASE] Seed change log entries...");
            for (const chg of INITIAL_CHANGE_LOG_ENTRIES) {
              await setDoc(doc(db, "change_log_entries", chg.id), chg);
            }
            return INITIAL_CHANGE_LOG_ENTRIES;
          }
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
    const isNew = !chg.id || chg.id.length === 0 || chg.id.startsWith("temp-");
    const activeId = isNew ? "chg-" + Math.random().toString(36).substring(2, 9) : chg.id;
    const finalChg: ChangeLogEntry = {
      ...chg,
      id: activeId,
      createdAt: chg.createdAt || new Date().toISOString(),
    };
    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "change_log_entries", activeId), finalChg);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `change_log_entries/${activeId}`);
      }
    } else {
      const list = loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES);
      const idx = list.findIndex((c) => c.id === chg.id);
      if (idx !== -1) {
        list[idx] = finalChg;
      } else {
        list.unshift(finalChg);
      }
      saveLocal(KEYS.CHANGE_LOGS, list);
    }
    return finalChg;
  },

  async deleteChangeLogEntry(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "change_log_entries", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `change_log_entries/${id}`);
      }
    } else {
      const list = loadLocal<ChangeLogEntry>(KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOG_ENTRIES);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.CHANGE_LOGS, filtered);
      return true;
    }
    return false;
  },

  // --- Portal Reports ---
  async getPortalReports(): Promise<PortalReportRow[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "portal_reports"), orderBy("date", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PortalReportRow));
          if (list.length === 0) {
            console.log("[FIREBASE] Seeding initial portal reports...");
            for (const r of INITIAL_PORTAL_REPORTS) {
              await setDoc(doc(db, "portal_reports", r.id), r);
            }
            return INITIAL_PORTAL_REPORTS;
          }
          return list;
        })();
        return await withTimeout(fetchPromise, loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS));
      } catch (err) {
        console.error("Firestore getPortalReports error, continuing with local fallback:", err);
      }
    }
    return loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
  },

  async savePortalReport(row: PortalReportRow): Promise<PortalReportRow> {
    const isNew = !row.id || row.id.length === 0 || row.id.startsWith("temp-");
    const activeId = isNew ? "p-rep-" + Math.random().toString(36).substring(2, 9) : row.id;
    const finalRow: PortalReportRow = {
      ...row,
      id: activeId,
      createdAt: row.createdAt || new Date().toISOString(),
    };

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "portal_reports", activeId), finalRow);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `portal_reports/${activeId}`);
      }
    } else {
      const list = loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
      const idx = list.findIndex((r) => r.id === row.id);
      if (idx !== -1) {
        list[idx] = finalRow;
      } else {
        list.unshift(finalRow);
      }
      saveLocal(KEYS.PORTAL_REPORTS, list);
    }
    return finalRow;
  },

  async deletePortalReport(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "portal_reports", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `portal_reports/${id}`);
      }
    } else {
      const list = loadLocal<PortalReportRow>(KEYS.PORTAL_REPORTS, INITIAL_PORTAL_REPORTS);
      const filtered = list.filter((r) => r.id !== id);
      saveLocal(KEYS.PORTAL_REPORTS, filtered);
      return true;
    }
    return false;
  },

  // --- Target Budget Ledger ---
  async getTargetBudgets(): Promise<TargetBudgetRow[]> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = query(collection(db, "target_budgets"), orderBy("month", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as TargetBudgetRow));
          if (list.length === 0) {
            console.log("[FIREBASE] Seeding initial target budgets...");
            for (const t of INITIAL_TARGET_BUDGETS) {
              await setDoc(doc(db, "target_budgets", t.id), t);
            }
            return INITIAL_TARGET_BUDGETS;
          }
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

    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "target_budgets", activeId), finalRow);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `target_budgets/${activeId}`);
      }
    } else {
      const list = loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
      const idx = list.findIndex((t) => t.id === row.id);
      if (idx !== -1) {
        list[idx] = finalRow;
      } else {
        list.unshift(finalRow);
      }
      saveLocal(KEYS.TARGET_BUDGETS, list);
    }
    return finalRow;
  },

  async deleteTargetBudget(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "target_budgets", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `target_budgets/${id}`);
      }
    } else {
      const list = loadLocal<TargetBudgetRow>(KEYS.TARGET_BUDGETS, INITIAL_TARGET_BUDGETS);
      const filtered = list.filter((t) => t.id !== id);
      saveLocal(KEYS.TARGET_BUDGETS, filtered);
      return true;
    }
    return false;
  },

  // --- Rule Settings ---
  async getRuleConfiguration(): Promise<RuleConfiguration> {
    if (isFirebaseEnabled) {
      try {
        const fetchPromise = (async () => {
          const q = collection(db, "rule_settings");
          const snapshot = await getDocs(q);
          const docsList = snapshot.docs;
          if (docsList.length === 0) {
            console.log("[FIREBASE] Seed rule default settings...");
            await setDoc(doc(db, "rule_settings", "global"), DEFAULT_RULE_CONFIGURATION);
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
        await setDoc(doc(db, "rule_settings", "global"), finalRule);
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
          const q = query(collection(db, "campaign_performances"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CampaignPerformance));
          if (list.length === 0) {
            console.log("[FIREBASE] Seed campaign performances...");
            for (const perf of INITIAL_PERF_TRACKERS) {
              await setDoc(doc(db, "campaign_performances", perf.id), perf);
            }
            return INITIAL_PERF_TRACKERS;
          }
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
    if (isFirebaseEnabled) {
      try {
        await setDoc(doc(db, "campaign_performances", activeId), finalPerf);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `campaign_performances/${activeId}`);
      }
    } else {
      const list = loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
      const idx = list.findIndex((c) => c.id === perf.id);
      if (idx !== -1) {
        list[idx] = finalPerf;
      } else {
        list.unshift(finalPerf);
      }
      saveLocal(KEYS.PERF_TRACKERS, list);
    }
    return finalPerf;
  },

  async deleteCampaignPerformance(id: string): Promise<boolean> {
    if (isFirebaseEnabled) {
      try {
        await deleteDoc(doc(db, "campaign_performances", id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `campaign_performances/${id}`);
      }
    } else {
      const list = loadLocal<CampaignPerformance>(KEYS.PERF_TRACKERS, INITIAL_PERF_TRACKERS);
      const filtered = list.filter((c) => c.id !== id);
      saveLocal(KEYS.PERF_TRACKERS, filtered);
      return true;
    }
    return false;
  }
};
