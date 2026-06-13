/**
 * Indian localized formatting and helper functions.
 * Adapts monetary and numerical displays for Indian Campaign Intelligence & Real Estate standards.
 */

/**
 * Format currency in Indian Rupees (₹) with the Indian numbering format (comma grouped).
 * e.g., 150000 -> ₹1,50,000
 */
export function formatINR(value: number, includeSymbol = true): string {
  if (isNaN(value) || value === null || value === undefined) {
    return includeSymbol ? "₹0" : "0";
  }
  // Standard en-IN formatting
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format currency with Lakh / Crore suffix for simplified Indian readability.
 * e.g., 150000 -> ₹1.5 Lakhs
 */
export function formatIndianShort(value: number, includeSymbol = true): string {
  if (isNaN(value) || value === null || value === undefined) {
    return includeSymbol ? "₹0" : "0";
  }
  const prefix = includeSymbol ? "₹" : "";
  if (value >= 10000000) {
    // 1 Crore = 10,000,000 (100 Lakhs)
    return `${prefix}${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    // 1 Lakh = 100,000
    return `${prefix}${(value / 100000).toFixed(2)} Lakh`;
  }
  return formatINR(value, includeSymbol);
}

/**
 * Format standard metrics (conversions/leads) with proper Indian numbering grouping.
 */
export function formatIndianNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(value);
}

import { UserRolePermission } from "../types";

export const ROLE_PERMISSIONS: Record<string, UserRolePermission> = {
  Admin: {
    role: "Admin",
    label: "Super Administrator / CIO",
    description: "Unrestricted master tenant access. Can create, edit, and purge campaigns, rules, leads, and SLA budgets.",
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
  CampaignManager: {
    role: "CampaignManager",
    label: "Campaign Manager / Media Buyer",
    description: "Can deploy new ad sets, configure creatives, and write log reasons. Cannot delete items. Cannot alter target budget master list or rules.",
    canCreateCampaigns: true,
    canEditCampaigns: true,
    canDeleteCampaigns: false,
    canCreateCreatives: true,
    canDeleteCreatives: false,
    canAnalyzeCreatives: true,
    canManageLeads: true,
    canDeleteLeads: false,
    canManageTargets: false,
    canDeleteTargets: false,
    canManageRules: false
  },
  LeadAgent: {
    role: "LeadAgent",
    label: "Sales Officer / Lead Coordinator",
    description: "Specialized direct sales role. Can manage leads, log daily portal submissions, and view dashboards. Cannot alter campaigns, creatives, or rules.",
    canCreateCampaigns: false,
    canEditCampaigns: false,
    canDeleteCampaigns: false,
    canCreateCreatives: false,
    canDeleteCreatives: false,
    canAnalyzeCreatives: false,
    canManageLeads: true,
    canDeleteLeads: false,
    canManageTargets: false,
    canDeleteTargets: false,
    canManageRules: false
  },
  Auditor: {
    role: "Auditor",
    label: "External Auditor / Corporate Guest",
    description: "Strict view-only read telemetry context. Forbidden from creating, editing, resetting, or deleting any live sandbox records.",
    canCreateCampaigns: false,
    canEditCampaigns: false,
    canDeleteCampaigns: false,
    canCreateCreatives: false,
    canDeleteCreatives: false,
    canAnalyzeCreatives: false,
    canManageLeads: false,
    canDeleteLeads: false,
    canManageTargets: false,
    canDeleteTargets: false,
    canManageRules: false
  }
};

