"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DocumentReviewer } from "@/components/verification/DocumentReviewer";
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Id } from "@/../convex/_generated/dataModel";

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const application = useQuery(api.loans.getApplication, {
    applicationId: id as Id<"loanApplications">,
  });
  const documents = useQuery(api.documents.getApplicationDocuments, {
    applicationId: id as Id<"loanApplications">,
  });
  const verification = useQuery(api.verification.getVerification, {
    applicationId: id as Id<"loanApplications">,
  });

  if (application === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Application not found or access denied.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queue
        </button>
        <PageHeader
          title={`Review: ${application.applicationNumber}`}
          subtitle="Verify documents and complete the verification checklist"
          action={<StatusBadge status={application.status} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Application info + Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Application Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Customer", value: application.customerName },
                { label: "Loan Type", value: LOAN_TYPE_LABELS[application.loanType] },
                { label: "Amount", value: formatCurrency(application.requestedAmount) },
                { label: "Tenure", value: `${application.tenure} months` },
                { label: "Income", value: formatCurrency(application.annualIncome) },
                { label: "Employment", value: application.employmentType.replace(/_/g, " ") },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              Documents ({documents?.length ?? 0})
            </h3>
            <DocumentReviewer documents={(documents ?? []) as any} />
          </div>
        </div>

        {/* Right: Verification panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <VerificationPanel
              applicationId={id as Id<"loanApplications">}
              existingVerification={verification as any}
              onComplete={() => router.push("/verification")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}