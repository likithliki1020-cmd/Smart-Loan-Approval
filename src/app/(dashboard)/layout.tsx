"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, ShieldOff } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const { signOut } = useAuthActions();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-sm text-slate-400">Loading SmartLoan...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Block deactivated users
  if (user && !user.isActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Account Deactivated</h2>
            <p className="text-sm text-slate-500 mt-2">
              Your account has been deactivated by an administrator. Please contact support for assistance.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="btn-primary w-full"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}