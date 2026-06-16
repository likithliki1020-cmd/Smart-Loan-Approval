// src/app/(dashboard)/admin/users/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { User, UserRole } from "@/types";
import { Users, Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_FILTER_OPTIONS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "customer", label: "Customers" },
  { value: "loan_officer", label: "Loan Officers" },
  { value: "verification_officer", label: "Verification Officers" },
  { value: "admin", label: "Admins" },
];

const ROLE_BADGE: Record<UserRole, string> = {
  customer: "bg-slate-100 text-slate-700",
  loan_officer: "bg-blue-100 text-blue-700",
  verification_officer: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const users = useQuery(
    api.users.listUsers,
    roleFilter === "all" ? {} : { role: roleFilter }
  );
  const updateUser = useMutation(api.users.updateUser);

  const filtered = (users ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleActive(user: User) {
    setProcessingId(user._id);
    try {
      await updateUser({ userId: user.userId as any, isActive: !user.isActive });
    } finally {
      setProcessingId(null);
    }
  }

  async function changeRole(userId: string, role: UserRole) {
    await updateUser({ userId: userId as any, role });
  }

  const columns: Column<User & object>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => changeRole(row.userId, e.target.value as UserRole)}
          className={cn(
            "rounded-lg border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer",
            ROLE_BADGE[row.role]
          )}
        >
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => <span className="text-slate-500">{row.phone ?? "—"}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          row.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", row.isActive ? "bg-green-500" : "bg-red-400")} />
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => <span className="text-xs text-slate-400">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "_id",
      label: "Action",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleActive(row); }}
          disabled={processingId === row._id}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            row.isActive
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-green-200 text-green-600 hover:bg-green-50"
          )}
        >
          {processingId === row._id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : row.isActive ? (
            <UserX className="h-3.5 w-3.5" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          {row.isActive ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their roles"
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value as any)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                roleFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered as (User & object)[]}
        keyField="_id"
        isLoading={users === undefined}
        emptyMessage="No users found"
      />
    </div>
  );
}