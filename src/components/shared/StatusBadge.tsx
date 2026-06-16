import { cn, getStatusClasses } from "@/lib/utils";
import { LOAN_STATUS_LABELS } from "@/lib/constants";
import type { LoanStatus, DocumentStatus } from "@/types";

interface StatusBadgeProps {
  status: LoanStatus | DocumentStatus | string;
  className?: string;
  size?: "sm" | "md";
}

const DOC_STATUS_CLASSES: Record<DocumentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  verified: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  resubmit_required: "bg-orange-50 text-orange-700 border-orange-200",
};

const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  resubmit_required: "Resubmit Required",
};

const LOAN_STATUSES: LoanStatus[] = [
  "draft", "submitted", "under_review", "pending_verification",
  "verified", "approved", "rejected", "disbursed",
];

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const isLoanStatus = LOAN_STATUSES.includes(status as LoanStatus);

  const classes = isLoanStatus
    ? getStatusClasses(status as LoanStatus)
    : (DOC_STATUS_CLASSES[status as DocumentStatus] ?? "bg-slate-100 text-slate-700 border-slate-200");

  const label = isLoanStatus
    ? LOAN_STATUS_LABELS[status as LoanStatus]
    : (DOC_STATUS_LABELS[status as DocumentStatus] ?? status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        classes,
        className
      )}
    >
      <span className={cn(
        "mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70",
        size === "sm" && "mr-1 h-1 w-1"
      )} />
      {label}
    </span>
  );
}