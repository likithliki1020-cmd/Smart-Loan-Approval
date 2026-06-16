import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LoanStatus, LoanType } from "@/types";
import { LOAN_STATUS_COLORS, LOAN_TYPE_LABELS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Date ─────────────────────────────────────────────────────────────────────
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

// ─── Application Number ───────────────────────────────────────────────────────
export function generateApplicationNumber(loanType: LoanType): string {
  const prefix = loanType.slice(0, 2).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${year}${random}`;
}

// ─── EMI Calculator ───────────────────────────────────────────────────────────
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

export function calculateTotalInterest(emi: number, tenure: number, principal: number): number {
  return emi * tenure - principal;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────
export function calculateEligibleAmount(annualIncome: number, loanType: LoanType): number {
  const multipliers: Record<LoanType, number> = {
    personal:  0.3,
    home:      5.0,
    business:  1.5,
    education: 0.8,
    vehicle:   0.6,
  };
  return Math.floor(annualIncome * multipliers[loanType]);
}

// ─── Status Badge Classes ─────────────────────────────────────────────────────
export function getStatusClasses(status: LoanStatus): string {
  const color = LOAN_STATUS_COLORS[status];
  const map: Record<string, string> = {
    slate:   "bg-slate-100 text-slate-700 border-slate-200",
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    orange:  "bg-orange-50 text-orange-700 border-orange-200",
    teal:    "bg-teal-50 text-teal-700 border-teal-200",
    green:   "bg-green-50 text-green-700 border-green-200",
    red:     "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[color] ?? map.slate;
}

// ─── File Size ────────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Loan Type Label ──────────────────────────────────────────────────────────
export function getLoanTypeLabel(type: LoanType): string {
  return LOAN_TYPE_LABELS[type] ?? type;
}

// ─── Truncate ─────────────────────────────────────────────────────────────────
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}