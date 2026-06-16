"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import type { LoanType } from "@/types";

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-card">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const applications = useQuery(api.loans.allApplications, {});

  const apps = applications ?? [];
  const total = apps.length;
  const approved = apps.filter((a) => ["approved", "disbursed"].includes(a.status));
  const rejected = apps.filter((a) => a.status === "rejected");
  const pending = apps.filter((a) => ["submitted", "under_review", "pending_verification"].includes(a.status));
  const totalApprovedAmount = approved.reduce((s, a) => s + (a.approvedAmount ?? 0), 0);
  const approvalRate = total > 0 ? ((approved.length / total) * 100).toFixed(1) : "0";

  // By loan type breakdown
  const loanTypes: LoanType[] = ["personal", "home", "business", "education", "vehicle"];
  const byType = loanTypes.map((type) => {
    const typeApps = apps.filter((a) => a.loanType === type);
    const typeApproved = typeApps.filter((a) => ["approved", "disbursed"].includes(a.status));
    return {
      type,
      total: typeApps.length,
      approved: typeApproved.length,
      amount: typeApproved.reduce((s, a) => s + (a.approvedAmount ?? 0), 0),
    };
  }).filter((t) => t.total > 0);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Overview of loan portfolio performance"
      />

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <MetricCard label="Total Applications" value={String(total)} />
        <MetricCard label="Approval Rate" value={`${approvalRate}%`} sub={`${approved.length} approved`} />
        <MetricCard label="Total Approved" value={formatCurrency(totalApprovedAmount)} />
        <MetricCard label="Pending" value={String(pending.length)} sub="awaiting decision" />
      </div>

      {/* By loan type */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Breakdown by Loan Type</h3>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Loan Type", "Total", "Approved", "Approval Rate", "Approved Amount"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {byType.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-slate-400">No data available</td>
                </tr>
              ) : byType.map(({ type, total, approved, amount }) => (
                <tr key={type} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{LOAN_TYPE_LABELS[type]}</td>
                  <td className="px-4 py-3 text-slate-600">{total}</td>
                  <td className="px-4 py-3 text-slate-600">{approved}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${total > 0 ? (approved / total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">
                        {total > 0 ? ((approved / total) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent approved */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recently Approved</h3>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Application #", "Customer", "Type", "Approved Amount", "EMI", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {approved.slice(0, 10).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">No approved applications yet</td>
                </tr>
              ) : approved.slice(0, 10).map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{app.applicationNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{app.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{LOAN_TYPE_LABELS[app.loanType]}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(app.approvedAmount ?? 0)}</td>
                  <td className="px-4 py-3 text-slate-600">{app.emiAmount ? formatCurrency(app.emiAmount) + "/mo" : "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(app.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}