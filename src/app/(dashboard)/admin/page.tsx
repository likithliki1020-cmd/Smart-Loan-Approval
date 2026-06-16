"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Users, Settings, ShieldCheck, TrendingUp, Activity, Database } from "lucide-react";

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: string | number; icon: React.ElementType; color: string; href?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const content = (
    <div className={`stat-card flex items-center gap-4 ${href ? "hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer" : ""}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const userStats = useQuery(api.users.getUserStats);
  const applications = useQuery(api.loans.allApplications, {});

  const apps = applications ?? [];
  const approved = apps.filter((a) => ["approved", "disbursed"].includes(a.status));
  const pending = apps.filter((a) => ["submitted", "under_review", "pending_verification"].includes(a.status));

  return (
    <div>
      <PageHeader
        title="System Dashboard"
        subtitle="Overview of the entire loan management system"
      />

      {/* User stats */}
      <div className="mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Users</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          <StatCard label="Total Users" value={userStats?.total ?? 0} icon={Users} color="blue" href="/admin/users" />
          <StatCard label="Customers" value={userStats?.customers ?? 0} icon={Users} color="purple" />
          <StatCard label="Loan Officers" value={userStats?.officers ?? 0} icon={ShieldCheck} color="green" />
          <StatCard label="Active Users" value={userStats?.active ?? 0} icon={Activity} color="amber" />
        </div>
      </div>

      {/* Loan stats */}
      <div className="mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Loans</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          <StatCard label="Total Applications" value={apps.length} icon={Database} color="blue" />
          <StatCard label="Pending" value={pending.length} icon={Activity} color="amber" />
          <StatCard label="Approved" value={approved.length} icon={TrendingUp} color="green" />
          <StatCard
            label="Total Approved"
            value={formatCurrency(approved.reduce((s, a) => s + (a.approvedAmount ?? 0), 0))}
            icon={TrendingUp}
            color="green"
          />
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/users"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Manage Users</p>
              <p className="text-xs text-slate-500 mt-0.5">Add, update, or deactivate users</p>
            </div>
          </Link>

          <Link
            href="/admin/config"
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Loan Configuration</p>
              <p className="text-xs text-slate-500 mt-0.5">Configure loan types, rates & rules</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}