"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerificationQueuePage() {
  const router = useRouter();
  const queue = useQuery(api.verification.myVerificationQueue);

  return (
    <div>
      <PageHeader
        title="My Queue"
        subtitle="Applications assigned to you for verification"
      />

      {queue === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Queue is empty"
          description="No applications assigned for verification at this time."
        />
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <button
              key={item._id}
              onClick={() => router.push(`/verification/review/${item.applicationId}`)}
              className="w-full text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                    item.status === "flagged" ? "bg-red-100 text-red-600" :
                    item.status === "completed" ? "bg-green-100 text-green-600" :
                    item.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    {item.status === "flagged" ? "!" :
                     item.status === "completed" ? "✓" :
                     item.status === "in_progress" ? "~" : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {(item.application as any)?.applicationNumber}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.application ? LOAN_TYPE_LABELS[(item.application as any).loanType] : "—"} ·{" "}
                      {item.application ? formatCurrency((item.application as any).requestedAmount) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                    item.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                    item.status === "flagged" ? "bg-red-50 text-red-700 border-red-200" :
                    item.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {item.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}