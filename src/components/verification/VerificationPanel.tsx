"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationPanelProps {
  applicationId: Id<"loanApplications">;
  existingVerification?: {
    status: string;
    identityVerified?: boolean;
    incomeVerified?: boolean;
    addressVerified?: boolean;
    fraudRisk?: string;
    notes?: string;
  } | null;
  onComplete?: () => void;
}

const RISK_OPTIONS = [
  { value: "low", label: "Low Risk", color: "green" },
  { value: "medium", label: "Medium Risk", color: "amber" },
  { value: "high", label: "High Risk", color: "red" },
] as const;

export function VerificationPanel({ applicationId, existingVerification, onComplete }: VerificationPanelProps) {
  const [form, setForm] = useState({
    identityVerified: existingVerification?.identityVerified ?? false,
    incomeVerified: existingVerification?.incomeVerified ?? false,
    addressVerified: existingVerification?.addressVerified ?? false,
    fraudRisk: (existingVerification?.fraudRisk as "low" | "medium" | "high") ?? "low",
    notes: existingVerification?.notes ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startVerification = useMutation(api.verification.startVerification);
  const submitVerification = useMutation(api.verification.submitVerification);

  const isCompleted = existingVerification?.status === "completed" || existingVerification?.status === "flagged";

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (existingVerification?.status === "not_started") {
        await startVerification({ applicationId });
      }
      await submitVerification({ applicationId, ...form });
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggle(key: "identityVerified" | "incomeVerified" | "addressVerified") {
    if (isCompleted) return;
    setForm((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-900">Verification Checklist</h3>
        {isCompleted && (
          <span className={cn(
            "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
            existingVerification?.status === "flagged"
              ? "bg-red-100 text-red-600"
              : "bg-green-100 text-green-600"
          )}>
            {existingVerification?.status === "flagged" ? "Flagged" : "Completed"}
          </span>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {([
          { key: "identityVerified" as const, label: "Identity documents verified" },
          { key: "incomeVerified" as const, label: "Income proof verified" },
          { key: "addressVerified" as const, label: "Address proof verified" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            disabled={isCompleted}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-all",
              form[key]
                ? "border-green-300 bg-green-50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              isCompleted && "cursor-default"
            )}
          >
            <div className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              form[key] ? "border-green-500 bg-green-500" : "border-slate-300"
            )}>
              {form[key] && <CheckCircle className="h-3 w-3 text-white" />}
            </div>
            <span className={form[key] ? "text-green-700" : "text-slate-600"}>{label}</span>
          </button>
        ))}
      </div>

      {/* Fraud risk */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Fraud Risk Assessment</label>
        <div className="grid grid-cols-3 gap-2">
          {RISK_OPTIONS.map((risk) => (
            <button
              key={risk.value}
              type="button"
              onClick={() => !isCompleted && setForm((f) => ({ ...f, fraudRisk: risk.value }))}
              disabled={isCompleted}
              className={cn(
                "rounded-lg border-2 py-2 text-xs font-semibold transition-all",
                form.fraudRisk === risk.value
                  ? risk.color === "green" ? "border-green-500 bg-green-50 text-green-700"
                    : risk.color === "amber" ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300",
                isCompleted && "cursor-default"
              )}
            >
              {risk.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Notes <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          disabled={isCompleted}
          rows={3}
          placeholder="Add any observations or notes..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>

      {/* Submit */}
      {!isCompleted && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : form.fraudRisk === "high" || (!form.identityVerified || !form.incomeVerified) ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              Flag & Submit
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Complete Verification
            </>
          )}
        </button>
      )}
    </div>
  );
}