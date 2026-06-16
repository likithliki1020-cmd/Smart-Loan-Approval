"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    "/customer": "Dashboard",
    "/customer/apply": "Apply for Loan",
    "/customer/track": "My Applications",
    "/customer/documents": "Documents",
    "/officer": "Dashboard",
    "/officer/applications": "Applications",
    "/officer/reports": "Reports",
    "/verification": "Verification Queue",
    "/admin": "Dashboard",
    "/admin/users": "User Management",
    "/admin/config": "System Configuration",
  };

  // Handle dynamic routes
  if (pathname.includes("/verification/review/")) return "Review Application";

  return map[pathname] ?? "SmartLoan";
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5">
          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <span className="text-sm text-slate-700 font-medium">{user?.name?.split(" ")[0]}</span>
        </div>
      </div>
    </header>
  );
}