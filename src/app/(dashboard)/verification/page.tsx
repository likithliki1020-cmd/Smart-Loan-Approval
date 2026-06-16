"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { ShieldCheck, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function VerificationDashboard() {
  const router = useRouter();
  const queue = useQuery(api.verification.myVerificationQueue);
  const stats = useQuery(api.verification.verificationStats);

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        subtitle="Review and verify loan application documents"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard label="Total Assigned" value={stats?.total ?? 0} icon={ShieldCheck} color="blue" />
        <StatCard label="Pending" value={stats?.pending ?? 0} icon={Clock} color="amber" />
        <StatCard label="Completed" value={stats?.completed ?? 0} icon={CheckCircle} color="green" />
        <StatCard label="Flagged" value={stats?.flagged ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Queue */}
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
                      {item.application?.applicationNumber}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.application ? LOAN_TYPE_LABELS[item.application.loanType] : "—"} ·{" "}
                      {item.application ? formatCurrency(item.application.requestedAmount) : "—"}
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