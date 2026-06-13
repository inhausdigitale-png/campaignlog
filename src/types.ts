export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "draft";
  platform: "Google Ads" | "Meta (Facebook)" | "LinkedIn" | "TikTok" | "YouTube";
  budget: number;
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  objectives?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  leads?: number;
  svcBooking?: number;
}

export interface AuditLog {
  id: string;
  campaignId: string;
  campaignName: string;
  changedBy: string; // user email / identity
  action: string; // e.g. "Create", "Status Change", "Budget Adjustment"
  details: string; // granular comparison text
  timestamp: string; // YYYY-MM-DDTHH:MM:SS.SSSZ
}

export interface Lead {
  id: string;
  campaignId?: string;
  campaignName?: string;
  leadName: string;
  email: string;
  phone: string;
  platform: string; // Meta, Google, LinkedIn, etc.
  status: "New" | "Contacted" | "Negotiating" | "Closed Won" | "Closed Lost";
  notes?: string;
  createdAt: string;
  isPortalLead?: boolean;
  portalSource?: "Housing" | "99 Acres" | "Magicbricks" | "Roof&floor" | "Other";
}

export interface CreativeAsset {
  id: string;
  campaignId: string;
  campaignName: string;
  name: string; // "Creative variant name"
  platform: "Google Ads" | "Meta (Facebook)" | "LinkedIn" | "TikTok" | "YouTube";
  imageUrl: string; // base64 or URL
  headline: string;
  bodyText: string;
  clicks: number;
  conversions: number;
  spend: number;
  status: "active" | "paused";
  createdAt: string;
  // Dynamic report generated via AI
  aiScore?: number;
  aiStrengths?: string;
  aiWeaknesses?: string;
  aiSuggestedHeadline?: string;
  aiSuggestedBody?: string;
  aiAnalyzedAt?: string;
}

export interface AIRecommendationReport {
  performanceAppraisal: string;
  platformComparison: string;
  budgetShifts: {
    sourcePlatform: string;
    targetPlatform: string;
    percentage: number;
    reason: string;
  }[];
  actionableTips: string[];
}

export interface AICopySuggestion {
  headline: string;
  bodyText: string;
  creativeConcept: string;
}

export interface CampaignReport {
  id: string;
  date: string;
  projectName: string;
  campaignName: string;
  adAccountId: string;
  leads: number;
  reach: number;
  impression: number;
  amountSpend: number;
  targetLeads: number;
  achievedLeads: number;
  svcBooking: number;
  adsets: string;
  createdAt: string;
  ctr?: number;
  clicks?: number;
  leadAllocation?: number;
}

export interface MetricComparison {
  id: string;
  metric: string;
  beforeValue: string;
  afterValue: string;
  improved: "Yes" | "No" | "Neutral";
  leads: number;
  svc: number;
  svcPercent: number;
  booked: number;
  bookedPercent: number;
  owner: string;
  followUp: string;
  status: string;
  createdAt: string;
}

export interface ChangeLogEntry {
  id: string;
  date: string;
  project: string;
  campaignId: string;
  campaignName: string;
  adSetName: string;
  campaignStatus: string;
  type: string;
  changed: string;
  reason: string;
  createdAt: string;
  lastEditedAt?: string;
  lastEditedBy?: string;
  progress?: string; // e.g. "Planned" | "In Progress" | "Implemented" | "Rolled Back"
  performanceIndicatorAfterChange?: string;
  changeCategory?: "Audience" | "Budget" | "Creative" | string;
  // Audience details
  audienceTargetLocations?: string;
  audienceAgeGroups?: string;
  audienceInterests?: string;
  // Budget details
  budgetPreviousDaily?: number;
  budgetNewDaily?: number;
  budgetPercentChange?: number;
  // Creative details
  creativeName?: string;
  creativeHeadline?: string;
  creativeBodyText?: string;
  creativeImageUrl?: string;
}

export interface PortalReportRow {
  id: string;
  date: string; // YYYY-MM-DD
  portal: "Housing" | "99 Acres" | "Magicbricks" | "Roof&floor" | string;
  project: string;
  generated: number;
  svs: number; // site visits scheduled
  svc: number; // site visits conducted
  walkin: number;
  gross: number;
  net: number;
  createdAt: string;
  updatedAt?: string;
  editReason?: string;
  editedBy?: string;
}

export interface WeeklyMetric {
  spend: number;
  totalLeadAchieved: number;
  digitalLeadAchieved: number;
  btlLeadAchieved: number;
  leadAllocation: number;
  siteVisit: number;
  booking: number;
}

export interface TargetBudgetRow {
  id: string;
  month: string; // YYYY-MM
  project: string;
  medium: string;
  budget: number;
  spend: number;
  totalLeadTarget: number;
  totalLeadAchieved: number;
  digitalLeadTarget: number;
  digitalLeadAchieved: number;
  btlLeadTarget: number;
  btlLeadAchieved: number;
  leadAllocation: number;
  siteVisit: number;
  booking: number;
  week1: WeeklyMetric;
  week2: WeeklyMetric;
  week3: WeeklyMetric;
  week4: WeeklyMetric;
  week5: WeeklyMetric;
  createdAt: string;
}

export interface RuleConfiguration {
  id: string; // e.g. "default"
  targetCpa: number;
  minRoas: number;
  minCtr: number;
  minCvr: number;
  reviewDays: number;
  warningSpend: number;
  updatedAt: string;
}

export type SimulatedRoleType = "Admin" | "CampaignManager" | "LeadAgent" | "Auditor";

export interface UserRolePermission {
  role: SimulatedRoleType;
  label: string;
  description: string;
  // Campaigns
  canCreateCampaigns: boolean;
  canEditCampaigns: boolean;
  canDeleteCampaigns: boolean;
  // Creatives
  canCreateCreatives: boolean;
  canDeleteCreatives: boolean;
  canAnalyzeCreatives: boolean;
  // Portal Leads
  canManageLeads: boolean;
  canDeleteLeads: boolean;
  // Weekly Target Ledger & SLAs
  canManageTargets: boolean;
  canDeleteTargets: boolean;
  // Rule Configuration Panel
  canManageRules: boolean;
}

export interface CampaignPerformance {
  id: string;
  campaignName: string;
  adsetName: string;
  adAccountId: string;
  projectName: string;
  leads: number;
  impression: number;
  reach: number;
  ctr: number; // Click-Through Rate
  amountSpend: number; // Amount Spent in INR - ₹
  clicks: number;
  svc: number; // site visits scheduled or site visits conducted
  booked: number; // Booked count
  cplCpa?: number; // Cost Per Lead or Cost Per Acquisition (calculated if not provided)
  createdAt: string;
  creativeImageUrl?: string;
  creativeUpdatedAt?: string;
  creativeNewUpdatedFlag?: boolean;
}



