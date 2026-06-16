"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, ShieldCheck } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hasRedirected = useRef(false);

  const user = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    if (isLoading) return;
    if (hasRedirected.current) return;

    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.replace("/login");
      return;
    }

    // user is still loading
    if (user === undefined) return;

    hasRedirected.current = true;

    // Even if user profile is null, still go to customer dashboard
    // The dashboard layout will handle missing profile gracefully
    if (user === null) {
      router.replace("/customer");
      return;
    }

    const dashboardMap: Record<string, string> = {
      customer: "/customer",
      loan_officer: "/officer",
      verification_officer: "/verification",
      admin: "/admin",
    };

    router.replace(dashboardMap[user.role] ?? "/customer");
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
          <ShieldCheck className="h-8 w-8 text-white" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          </span>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">SmartLoan</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLoading
              ? "Connecting to server..."
              : isAuthenticated
                ? "Loading your dashboard..."
                : "Redirecting to login..."}
          </p>
        </div>
      </div>
    </div>
  );
}