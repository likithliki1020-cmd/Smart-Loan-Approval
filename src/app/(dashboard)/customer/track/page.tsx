"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoanStatusTimeline } from "@/components/loan/LoanStatusTimeline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS, LOAN_TYPE_ICONS } from "@/lib/constants";
import type { LoanApplication, LoanStatus } from "@/types";
import { FileSearch, ChevronDown, ChevronUp, FilePlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function ApplicationRow({ application }: { application: LoanApplication }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {LOAN_TYPE_ICONS[application.loanType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900">{LOAN_TYPE_LABELS[application.loanType]}</p>
            <span className="font-mono text-xs text-slate-400">{application.applicationNumber}</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {formatCurrency(application.requestedAmount)} · {application.tenure} months
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={application.status} />
          <span className="text-slate-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-slate-100 p-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Application Details</h4>
              <div className="space-y-2">
                {[
                  { label: "Applied On", value: formatDate(application.createdAt) },
                  { label: "Employment", value: application.employmentType.replace(/_/g, " ") },
                  { label: "Annual Income", value: formatCurrency(application.annualIncome) },
                  { label: "Purpose", value: application.purpose },
                  ...(application.approvedAmount ? [
                    { label: "Approved Amount", value: formatCurrency(application.approvedAmount) },
                    { label: "Interest Rate", value: `${application.interestRate}% p.a.` },
                    { label: "Monthly EMI", value: formatCurrency(application.emiAmount ?? 0) },
                  ] : []),
                  ...(application.rejectionReason ? [
                    { label: "Rejection Reason", value: application.rejectionReason },
                  ] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
                    <span className="text-xs text-slate-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Progress</h4>
              <LoanStatusTimeline currentStatus={application.status as LoanStatus} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  const applications = useQuery(api.loans.myApplications);
  const isLoading = applications === undefined;

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track the status of all your loan applications"
        action={
          <Link href="/customer/apply" className="btn-primary">
            <FilePlus className="h-4 w-4" />
            New Application
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : (applications ?? []).length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-6 w-6" />}
          title="No applications found"
          description="You haven't applied for any loans yet."
          action={
            <Link href="/customer/apply" className="btn-primary">
              <FilePlus className="h-4 w-4" />
              Apply Now
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {(applications ?? []).map((app) => (
            <ApplicationRow key={app._id} application={app as any} />
          ))}
        </div>
      )}
    </div>
  );
}