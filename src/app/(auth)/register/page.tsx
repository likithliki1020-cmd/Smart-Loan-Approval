"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "customer",             label: "Customer",             description: "Apply for loans" },
  { value: "loan_officer",         label: "Loan Officer",         description: "Review & approve loans" },
  { value: "verification_officer", label: "Verification Officer", description: "Verify documents" },
  { value: "admin",                label: "Administrator",        description: "Manage the system" },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setServerError(null);
    try {
      // Store pending profile data BEFORE signIn
      // This will be picked up by the dashboard on first load
      sessionStorage.setItem("pendingProfile", JSON.stringify({
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone?.trim() || undefined,
      }));

      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signUp",
      });

      // After signIn resolves, redirect to setup page that applies the role
      router.replace("/setup");
    } catch (e: unknown) {
      sessionStorage.removeItem("pendingProfile");
      const msg = e instanceof Error ? e.message : "Registration failed.";
      setServerError(msg);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SmartLoan</h1>
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in your details to create an account</p>
          </div>

          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue("role", role.value)}
                    className={`rounded-lg border-2 p-2.5 text-left transition-all ${
                      selectedRole === role.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selectedRole === role.value ? "text-blue-700" : "text-slate-700"}`}>
                      {role.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input {...register("name")} type="text" placeholder="John Doe" autoComplete="name" className="input-base" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input {...register("email")} type="email" placeholder="you@example.com" autoComplete="email" className="input-base" />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input {...register("phone")} type="tel" placeholder="9876543210" autoComplete="tel" className="input-base" />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
              ) : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}