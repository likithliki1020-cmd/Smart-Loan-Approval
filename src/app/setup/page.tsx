"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/types";

const ROLE_PATHS: Record<UserRole, string> = {
  customer: "/customer",
  loan_officer: "/officer",
  verification_officer: "/verification",
  admin: "/admin",
};

export default function SetupPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const ensureProfile = useMutation(api.users.ensureProfile);
  const hasRun = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (hasRun.current) return;
    hasRun.current = true;

    async function applyProfile() {
      try {
        const raw = sessionStorage.getItem("pendingProfile");
        if (!raw) {
          router.replace("/");
          return;
        }
        const pending = JSON.parse(raw) as {
          name: string;
          email: string;
          role: UserRole;
          phone?: string;
        };
        sessionStorage.removeItem("pendingProfile");

        await ensureProfile({
          name: pending.name,
          email: pending.email,
          role: pending.role,
          ...(pending.phone ? { phone: pending.phone } : {}),
        });

        router.replace(ROLE_PATHS[pending.role] ?? "/customer");
      } catch (err) {
        console.error("Setup failed:", err);
        router.replace("/");
      }
    }

    applyProfile();
  }, [isLoading, isAuthenticated, ensureProfile, router]);

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
          <p className="text-xs text-slate-400 mt-0.5">Setting up your account...</p>
        </div>
      </div>
    </div>
  );
}