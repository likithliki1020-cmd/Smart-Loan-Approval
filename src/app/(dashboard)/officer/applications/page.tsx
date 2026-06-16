"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import type { LoanApplication } from "@/types";
import {
  ClipboardList, CheckCircle, XCircle, Send,
  X, ChevronDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "submitted" | "under_review" | "pending_verification" | "verified";

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "New" },
  { value: "under_review", label: "Under Review" },
  { value: "pending_verification", label: "In Verification" },
  { value: "verified", label: "Verified" },
];

function ApplicationDetailPanel({
  application,
  onClose,
}: {
  application: LoanApplication;
  onClose: () => void;
}) {
  const [approveForm, setApproveForm] = useState({
    approvedAmount: application.requestedAmount,
    interestRate: 10.5,
    tenure: application.tenure,
    notes: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | "verify" | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const vOfficers = useQuery(api.users.listUsers, { role: "verification_officer" });
  const assignApp = useMutation(api.loans.assignApplication);
  const sendForVerification = useMutation(api.loans.sendForVerification);
  const approveApp = useMutation(api.loans.approveApplication);
  const rejectApp = useMutation(api.loans.rejectApplication);
  const markDisbursed = useMutation(api.loans.markDisbursed);

  async function handleAssign() {
    setIsLoading(true);
    try { await assignApp({ applicationId: application._id as any }); }
    finally { setIsLoading(false); }
  }

  async function handleSendForVerification() {
    if (!selectedOfficerId) return;
    setIsLoading(true);
    try {
      await sendForVerification({
        applicationId: application._id as any,
        verificationOfficerId: selectedOfficerId as any,
      });
      setActiveAction(null);
    } finally { setIsLoading(false); }
  }

  async function handleApprove() {
    setIsLoading(true);
    try {
      await approveApp({
        applicationId: application._id as any,
        ...approveForm,
      });
      setActiveAction(null);
    } finally { setIsLoading(false); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setIsLoading(true);
    try {
      await rejectApp({ applicationId: application._id as any, rejectionReason: rejectReason });
      setActiveAction(null);
    } finally { setIsLoading(false); }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white z-10">
        <div>
          <p className="text-sm font-semibold text-slate-900">{application.applicationNumber}</p>
          <p className="text-xs text-slate-400">{LOAN_TYPE_LABELS[application.loanType]}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} />
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Applicant Info */}
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Applicant</h4>
          <div className="divide-y divide-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {[
              { label: "Name", value: application.customerName },
              { label: "Loan Type", value: LOAN_TYPE_LABELS[application.loanType] },
              { label: "Requested", value: formatCurrency(application.requestedAmount) },
              { label: "Tenure", value: `${application.tenure} months` },
              { label: "Income (Annual)", value: formatCurrency(application.annualIncome) },
              { label: "Employment", value: application.employmentType.replace(/_/g, " ") },
              { label: "Purpose", value: application.purpose },
              { label: "Applied On", value: formatDate(application.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-xs text-slate-400 w-28 shrink-0">{label}</span>
                <span className="text-xs font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Actions</h4>
          <div className="space-y-3">

            {/* Assign to self */}
            {application.status === "submitted" && (
              <button
                onClick={handleAssign}
                disabled={isLoading}
                className="btn-secondary w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                Take Up for Review
              </button>
            )}

            {/* Send for verification */}
            {(application.status === "under_review" || application.status === "submitted") && (
              <div>
                {activeAction !== "verify" ? (
                  <button
                    onClick={() => setActiveAction("verify")}
                    className="btn-secondary w-full"
                  >
                    <Send className="h-4 w-4" />
                    Send for Verification
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Assign Verification Officer</p>
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="input-base"
                    >
                      <option value="">Select officer...</option>
                      {(vOfficers ?? []).map((o) => (
                        <option key={o._id} value={o.userId}>{o.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendForVerification}
                        disabled={!selectedOfficerId || isLoading}
                        className="btn-primary flex-1"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                      </button>
                      <button onClick={() => setActiveAction(null)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approve */}
            {(application.status === "verified" || application.status === "under_review") && (
              <div>
                {activeAction !== "approve" ? (
                  <button onClick={() => setActiveAction("approve")} className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Approve Application
                  </button>
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-green-800">Approval Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Approved Amount (₹)</label>
                        <input
                          type="number"
                          value={approveForm.approvedAmount}
                          onChange={(e) => setApproveForm((f) => ({ ...f, approvedAmount: Number(e.target.value) }))}
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={approveForm.interestRate}
                          onChange={(e) => setApproveForm((f) => ({ ...f, interestRate: Number(e.target.value) }))}
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Tenure (months)</label>
                        <input
                          type="number"
                          value={approveForm.tenure}
                          onChange={(e) => setApproveForm((f) => ({ ...f, tenure: Number(e.target.value) }))}
                          className="input-base"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleApprove} disabled={isLoading} className="btn-primary flex-1" style={{ background: "#16a34a" }}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Approval"}
                      </button>
                      <button onClick={() => setActiveAction(null)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reject */}
            {["submitted", "under_review", "verified"].includes(application.status) && (
              <div>
                {activeAction !== "reject" ? (
                  <button onClick={() => setActiveAction("reject")} className="btn-danger w-full">
                    <XCircle className="h-4 w-4" />
                    Reject Application
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Explain the reason for rejection..."
                      className="input-base resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleReject} disabled={!rejectReason.trim() || isLoading} className="btn-danger flex-1">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
                      </button>
                      <button onClick={() => setActiveAction(null)} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mark disbursed */}
            {application.status === "approved" && (
              <button
                onClick={async () => { setIsLoading(true); try { await markDisbursed({ applicationId: application._id as any }); } finally { setIsLoading(false); } }}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Mark as Disbursed
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedApp, setSelectedApp] = useState<LoanApplication | null>(null);

  const applications = useQuery(
    api.loans.allApplications,
    filter === "all" ? {} : { status: filter }
  );

  const columns: Column<LoanApplication & object>[] = [
    {
      key: "applicationNumber",
      label: "App #",
      render: (row) => <span className="font-mono text-xs">{row.applicationNumber}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => <span className="font-medium text-slate-900">{row.customerName}</span>,
    },
    {
      key: "loanType",
      label: "Type",
      render: (row) => LOAN_TYPE_LABELS[row.loanType],
    },
    {
      key: "requestedAmount",
      label: "Amount",
      render: (row) => formatCurrency(row.requestedAmount),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      label: "Applied",
      render: (row) => <span className="text-slate-400 text-xs">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Review and process all loan applications"
      />

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={(applications ?? []) as LoanApplication[]}
        keyField="_id"
        isLoading={applications === undefined}
        onRowClick={(row) => setSelectedApp(row as LoanApplication)}
        emptyMessage="No applications found for this filter"
      />

      {/* Side panel */}
      {selectedApp && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20"
            onClick={() => setSelectedApp(null)}
          />
          <ApplicationDetailPanel
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
          />
        </>
      )}
    </div>
  );
}