"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDashboardStats } from "@/hooks/useLoanApplications";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LOAN_TYPE_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, CheckCircle, XCircle, IndianRupee,
} from "lucide-react";
import { LoanApplication } from "@/types";

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="stat-card flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function OfficerDashboard() {
  const { stats } = useDashboardStats();
  const applications = useQuery(api.loans.allApplications, { status: "submitted", limit: 10 });
  const router = useRouter();

  const columns: Column<LoanApplication & object>[] = [
    {
      key: "applicationNumber",
      label: "Application #",
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.applicationNumber}</span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => <span className="font-medium text-slate-900">{row.customerName}</span>,
    },
    {
      key: "loanType",
      label: "Type",
      render: (row) => LOAN_TYPE_LABELS[row.loanType as keyof typeof LOAN_TYPE_LABELS],
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
      render: (row) => <span className="text-slate-400">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Loan Officer Dashboard"
        subtitle="Review and process loan applications"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-8">
        <StatCard label="Total" value={stats?.total ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Pending Review" value={stats?.pending ?? 0} icon={Clock} color="amber" />
        <StatCard label="In Verification" value={(stats as any)?.pendingVerification ?? 0} icon={ClipboardList} color="blue" />
        <StatCard label="Approved" value={stats?.approved ?? 0} icon={CheckCircle} color="green" />
        <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={XCircle} color="red" />
      </div>

      {/* New applications table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">New Applications (Awaiting Review)</h3>
          <button
            onClick={() => router.push("/officer/applications")}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View all →
          </button>
        </div>

        <DataTable
          columns={columns}
          data={(applications ?? []) as (LoanApplication & object)[]}
          keyField="_id"
          isLoading={applications === undefined}
          onRowClick={(row) =>
           router.push(
            `/officer/applications?id=${(row as LoanApplication)._id}`
           )
         }
         emptyMessage="No new applications to review"
        />
      </div>
    </div>
  );
}