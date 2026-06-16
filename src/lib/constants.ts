import type { LoanType, LoanStatus, DocumentType, UserRole } from "@/types";

// ─── Role Labels ──────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  loan_officer: "Loan Officer",
  verification_officer: "Verification Officer",
  admin: "Administrator",
};

export const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  customer: "/customer",
  loan_officer: "/officer",
  verification_officer: "/verification",
  admin: "/admin",
};

// ─── Loan Types ───────────────────────────────────────────────────────────────
export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: "Personal Loan",
  home: "Home Loan",
  business: "Business Loan",
  education: "Education Loan",
  vehicle: "Vehicle Loan",
};

export const LOAN_TYPE_DESCRIPTIONS: Record<LoanType, string> = {
  personal: "Quick funds for personal needs",
  home: "Finance your dream home",
  business: "Grow your business",
  education: "Invest in your future",
  vehicle: "Drive your dream vehicle",
};

export const LOAN_TYPE_ICONS: Record<LoanType, string> = {
  personal: "💳",
  home: "🏠",
  business: "🏢",
  education: "🎓",
  vehicle: "🚗",
};

// ─── Loan Status ──────────────────────────────────────────────────────────────
export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  pending_verification: "Pending Verification",
  verified: "Verified",
  approved: "Approved",
  rejected: "Rejected",
  disbursed: "Disbursed",
};

export const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
  draft: "slate",
  submitted: "blue",
  under_review: "amber",
  pending_verification: "orange",
  verified: "teal",
  approved: "green",
  rejected: "red",
  disbursed: "emerald",
};

export const LOAN_STATUS_ORDER: LoanStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "pending_verification",
  "verified",
  "approved",
  "disbursed",
];

// ─── Document Types ───────────────────────────────────────────────────────────
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  aadhar: "Aadhaar Card",
  pan: "PAN Card",
  passport: "Passport",
  salary_slip: "Salary Slip (Last 3 months)",
  bank_statement: "Bank Statement (Last 6 months)",
  itr: "Income Tax Return",
  business_proof: "Business Proof / GST",
  property_docs: "Property Documents",
  other: "Other Document",
};

// ─── Loan Config Defaults ─────────────────────────────────────────────────────
export const LOAN_DEFAULTS: Record<LoanType, { min: number; max: number; minTenure: number; maxTenure: number; rate: number }> = {
  personal:  { min: 10000,    max: 500000,    minTenure: 6,  maxTenure: 60,  rate: 10.5 },
  home:      { min: 500000,   max: 50000000,  minTenure: 60, maxTenure: 360, rate: 8.5  },
  business:  { min: 100000,   max: 10000000,  minTenure: 12, maxTenure: 84,  rate: 12.0 },
  education: { min: 50000,    max: 2000000,   minTenure: 12, maxTenure: 120, rate: 9.0  },
  vehicle:   { min: 100000,   max: 5000000,   minTenure: 12, maxTenure: 84,  rate: 9.5  },
};

// ─── Navigation ───────────────────────────────────────────────────────────────
export const CUSTOMER_NAV = [
  { label: "Dashboard",    href: "/customer",           icon: "LayoutDashboard" },
  { label: "Apply",        href: "/customer/apply",     icon: "FilePlus" },
  { label: "My Loans",     href: "/customer/track",     icon: "FileSearch" },
  { label: "Documents",    href: "/customer/documents", icon: "FolderOpen" },
];

export const OFFICER_NAV = [
  { label: "Dashboard",    href: "/officer",                  icon: "LayoutDashboard" },
  { label: "Applications", href: "/officer/applications",     icon: "ClipboardList" },
  { label: "Reports",      href: "/officer/reports",          icon: "BarChart3" },
];

export const VERIFICATION_NAV = [
  { label: "Dashboard",    href: "/verification",             icon: "LayoutDashboard" },
  { label: "My Queue",     href: "/verification/queue",       icon: "ShieldCheck" },
];

export const ADMIN_NAV = [
  { label: "Dashboard",    href: "/admin",                    icon: "LayoutDashboard" },
  { label: "Users",        href: "/admin/users",              icon: "Users" },
  { label: "Configuration",href: "/admin/config",             icon: "Settings" },
];