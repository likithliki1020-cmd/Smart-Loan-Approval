"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CUSTOMER_NAV, OFFICER_NAV, VERIFICATION_NAV, ADMIN_NAV,
} from "@/lib/constants";
import {
  LayoutDashboard, FilePlus, FileSearch, FolderOpen,
  ClipboardList, BarChart3, ShieldCheck, Users, Settings,
  LogOut, ChevronRight,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, FilePlus, FileSearch, FolderOpen,
  ClipboardList, BarChart3, ShieldCheck, Users, Settings,
};

function NavItem({ href, label, icon: iconName }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href) && href.split("/").length > 2);
  const Icon = ICON_MAP[iconName] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
    </Link>
  );
}

export function Sidebar() {
  const { user, isCustomer, isOfficer, isVerificationOfficer, isAdmin } = useCurrentUser();
  const { signOut } = useAuthActions();

  const navItems = isAdmin
    ? ADMIN_NAV
    : isOfficer
    ? OFFICER_NAV
    : isVerificationOfficer
    ? VERIFICATION_NAV
    : CUSTOMER_NAV;

  const roleLabel = isAdmin
    ? "Administrator"
    : isOfficer
    ? "Loan Officer"
    : isVerificationOfficer
    ? "Verification Officer"
    : "Customer";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xs font-bold text-white">SL</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 leading-tight">SmartLoan</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Approval System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Menu
        </p>
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 mb-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name ?? "Loading..."}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}