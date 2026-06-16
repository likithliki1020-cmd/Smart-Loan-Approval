"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loanApplicationSchema, type LoanApplicationFormData } from "@/lib/validations";
import { LOAN_TYPE_LABELS, LOAN_TYPE_DESCRIPTIONS, LOAN_TYPE_ICONS, LOAN_DEFAULTS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { EligibilityCalculator } from "./EligibilityCalculator";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { LoanType } from "@/types";
import { ChevronRight, ChevronLeft, Send, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LOAN_TYPES: LoanType[] = ["personal", "home", "business", "education", "vehicle"];

const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried Employee" },
  { value: "self_employed", label: "Self Employed" },
  { value: "business", label: "Business Owner" },
  { value: "retired", label: "Retired" },
] as const;

const STEPS = ["Loan Type", "Amount & Tenure", "Income Details", "Review"];

export function LoanApplicationForm() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const createApplication = useMutation(api.loans.createApplication);
  const submitApplication = useMutation(api.loans.submitApplication);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loanType: "personal",
      requestedAmount: 100000,
      tenure: 12,
      annualIncome: 500000,
      employmentType: "salaried",
      purpose: "",
    },
  });

  const watchedValues = watch();
  const selectedLoanType = watchedValues.loanType;
  const loanConfig = LOAN_DEFAULTS[selectedLoanType];

  async function onSubmit(data: LoanApplicationFormData) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const appId = await createApplication({
        loanType: data.loanType,
        requestedAmount: data.requestedAmount,
        tenure: data.tenure,
        purpose: data.purpose,
        annualIncome: data.annualIncome,
        employmentType: data.employmentType,
      });
      await submitApplication({ applicationId: appId });
      router.push("/customer/track");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to submit application. Please try again.";
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  }

  function nextStep() { if (step < STEPS.length - 1) setStep((s) => s + 1); }
  function prevStep() { if (step > 0) setStep((s) => s - 1); }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
              i < step ? "bg-green-500 text-white" :
              i === step ? "bg-blue-600 text-white ring-4 ring-blue-100" :
              "bg-slate-100 text-slate-400"
            )}>
              {i < step ? "✓" : i + 1}
            </div>
            <div className={cn(
              "ml-2 text-xs font-medium hidden sm:block",
              i === step ? "text-blue-700" : i < step ? "text-green-600" : "text-slate-400"
            )}>
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-3", i < step ? "bg-green-500" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border border-slate-200 bg-white p-6">

          {/* Step 0: Loan Type */}
          {step === 0 && (
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Select Loan Type</h3>
              <p className="text-sm text-slate-500 mb-5">Choose the loan product that best fits your need</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {LOAN_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => setValue("loanType", type)}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all",
                      selectedLoanType === type ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}>
                    <span className="text-2xl">{LOAN_TYPE_ICONS[type]}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{LOAN_TYPE_LABELS[type]}</p>
                      <p className="text-xs text-slate-500">{LOAN_TYPE_DESCRIPTIONS[type]}</p>
                    </div>
                    <p className="text-xs text-slate-400">Up to {formatCurrency(LOAN_DEFAULTS[type].max)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Amount & Tenure */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Loan Amount & Tenure</h3>
                <p className="text-sm text-slate-500">Specify how much you need and for how long</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                  <input type="number" {...register("requestedAmount", { valueAsNumber: true })}
                    className="input-base pl-8" placeholder="Enter amount"
                    min={loanConfig.min} max={loanConfig.max} />
                </div>
                <p className="mt-1 text-xs text-slate-400">Range: {formatCurrency(loanConfig.min)} – {formatCurrency(loanConfig.max)}</p>
                {errors.requestedAmount && <p className="mt-1 text-xs text-red-500">{errors.requestedAmount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tenure (months)</label>
                <input type="number" {...register("tenure", { valueAsNumber: true })}
                  className="input-base" min={loanConfig.minTenure} max={loanConfig.maxTenure} />
                <p className="mt-1 text-xs text-slate-400">Range: {loanConfig.minTenure} – {loanConfig.maxTenure} months</p>
                {errors.tenure && <p className="mt-1 text-xs text-red-500">{errors.tenure.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Purpose / Reason</label>
                <textarea {...register("purpose")} rows={3}
                  placeholder="Briefly describe the purpose of this loan..."
                  className="input-base resize-none" />
                {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose.message}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Income Details */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Income Details</h3>
                <p className="text-sm text-slate-500">This helps us assess your loan eligibility</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Employment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EMPLOYMENT_TYPES.map((type) => (
                    <button key={type.value} type="button" onClick={() => setValue("employmentType", type.value)}
                      className={cn(
                        "rounded-lg border-2 px-3 py-2.5 text-sm font-medium text-left transition-all",
                        watchedValues.employmentType === type.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}>
                      {type.label}
                    </button>
                  ))}
                </div>
                {errors.employmentType && <p className="mt-1 text-xs text-red-500">{errors.employmentType.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Annual Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                  <input type="number" {...register("annualIncome", { valueAsNumber: true })}
                    className="input-base pl-8" placeholder="Enter annual income" />
                </div>
                {errors.annualIncome && <p className="mt-1 text-xs text-red-500">{errors.annualIncome.message}</p>}
              </div>
              {watchedValues.annualIncome > 0 && watchedValues.requestedAmount > 0 && (
                <EligibilityCalculator
                  loanType={watchedValues.loanType}
                  annualIncome={watchedValues.annualIncome}
                  requestedAmount={watchedValues.requestedAmount}
                  tenure={watchedValues.tenure}
                />
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Review & Submit</h3>
                <p className="text-sm text-slate-500">Confirm your application details before submitting</p>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {[
                  { label: "Loan Type", value: LOAN_TYPE_LABELS[watchedValues.loanType] },
                  { label: "Requested Amount", value: formatCurrency(watchedValues.requestedAmount) },
                  { label: "Tenure", value: `${watchedValues.tenure} months` },
                  { label: "Employment", value: EMPLOYMENT_TYPES.find((e) => e.value === watchedValues.employmentType)?.label },
                  { label: "Annual Income", value: formatCurrency(watchedValues.annualIncome) },
                  { label: "Purpose", value: watchedValues.purpose || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between px-4 py-3">
                    <span className="text-sm text-slate-500">{item.label}</span>
                    <span className="text-sm font-medium text-slate-900 text-right max-w-xs">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Show any validation errors */}
              {Object.keys(errors).length > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Please fix these errors:</p>
                  {Object.entries(errors).map(([key, err]) => (
                    <p key={key} className="text-xs text-red-600">• {key}: {(err as any)?.message}</p>
                  ))}
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                By submitting, you confirm that all information provided is accurate and authorize us to verify your details.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button type="button" onClick={prevStep} disabled={step === 0}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70 transition-colors">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
              ) : (
                <><Send className="h-4 w-4" />Submit Application</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}