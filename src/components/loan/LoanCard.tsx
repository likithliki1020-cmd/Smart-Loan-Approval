import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS, LOAN_TYPE_ICONS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LoanApplication } from "@/types";
import { ArrowRight, Calendar, IndianRupee } from "lucide-react";

interface LoanCardProps {
  application: LoanApplication;
  href?: string;
}

export function LoanCard({ application, href }: LoanCardProps) {
  const content = (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-50">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">
            {LOAN_TYPE_ICONS[application.loanType]}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {LOAN_TYPE_LABELS[application.loanType]}
            </p>
            <p className="text-xs text-slate-400 font-mono">{application.applicationNumber}</p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Amount row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Requested</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(application.requestedAmount)}
          </p>
        </div>
        {application.approvedAmount ? (
          <div className="rounded-lg bg-green-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-green-500 mb-0.5">Approved</p>
            <p className="text-sm font-semibold text-green-700">
              {formatCurrency(application.approvedAmount)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Tenure</p>
            <p className="text-sm font-semibold text-slate-900">{application.tenure} months</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(application.createdAt)}
        </div>
        {href && (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}