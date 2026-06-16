"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoanCard } from "@/components/loan/LoanCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDashboardStats } from "@/hooks/useLoanApplications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  FilePlus, FileSearch, TrendingUp, Clock,
  CheckCircle, XCircle, IndianRupee,
} from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
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

export default function CustomerDashboard() {
  const { user } = useCurrentUser();
  const { stats } = useDashboardStats();
  const applications = useQuery(api.loans.myApplications);

  const recentApps = (applications ?? []).slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}!`}
        subtitle="Track your loan applications and manage your documents"
        action={
          <Link href="/customer/apply" className="btn-primary">
            <FilePlus className="h-4 w-4" />
            Apply for Loan
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard label="Total Applications" value={stats?.total ?? 0} icon={FileSearch} color="blue" />
        <StatCard label="In Progress" value={stats?.pending ?? 0} icon={Clock} color="amber" />
        <StatCard label="Approved" value={stats?.approved ?? 0} icon={CheckCircle} color="green" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} color="red" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <Link
          href="/customer/apply"
          className="group flex items-center gap-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-5 hover:bg-blue-50 hover:border-blue-400 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <FilePlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Apply for New Loan</p>
            <p className="text-xs text-blue-600 mt-0.5">Personal, Home, Business & more</p>
          </div>
        </Link>

        <Link
          href="/customer/documents"
          className="group flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 hover:bg-slate-100 hover:border-slate-400 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 group-hover:bg-slate-300 transition-colors">
            <FileSearch className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Manage Documents</p>
            <p className="text-xs text-slate-500 mt-0.5">Upload and track your documents</p>
          </div>
        </Link>
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Applications</h3>
          {(applications ?? []).length > 3 && (
            <Link href="/customer/track" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          )}
        </div>

        {recentApps.length === 0 ? (
          <EmptyState
            icon={<FileSearch className="h-6 w-6" />}
            title="No applications yet"
            description="Start by applying for your first loan"
            action={
              <Link href="/customer/apply" className="btn-primary">
                <FilePlus className="h-4 w-4" />
                Apply Now
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentApps.map((app) => (
              <LoanCard
                key={app._id}
                application={app as any}
                href={`/customer/track`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}