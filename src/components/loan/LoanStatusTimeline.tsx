import { cn } from "@/lib/utils";
import { LOAN_STATUS_ORDER, LOAN_STATUS_LABELS } from "@/lib/constants";
import type { LoanStatus } from "@/types";
import { Check, X, Clock } from "lucide-react";

interface LoanStatusTimelineProps {
  currentStatus: LoanStatus;
  className?: string;
}

export function LoanStatusTimeline({ currentStatus, className }: LoanStatusTimelineProps) {
  const isRejected = currentStatus === "rejected";
  const currentIndex = LOAN_STATUS_ORDER.indexOf(currentStatus);

  // Don't show timeline for draft
  const steps = LOAN_STATUS_ORDER.filter((s) => s !== "draft");

  return (
    <div className={cn("w-full", className)}>
      {isRejected ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <X className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">Application Rejected</p>
            <p className="text-xs text-red-500 mt-0.5">Your application was not approved at this time.</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-0.5 bg-slate-100" />

          <div className="space-y-3">
            {steps.map((step, i) => {
              const stepIndex = LOAN_STATUS_ORDER.indexOf(step);
              const isDone = stepIndex < currentIndex;
              const isCurrent = step === currentStatus;
              const isPending = stepIndex > currentIndex;

              return (
                <div key={step} className="relative flex items-center gap-4 pl-0">
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      isDone
                        ? "border-green-500 bg-green-500"
                        : isCurrent
                        ? "border-blue-500 bg-blue-500 ring-4 ring-blue-100"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : isCurrent ? (
                      <Clock className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isDone ? "text-slate-500" : isCurrent ? "text-blue-700" : "text-slate-400"
                      )}
                    >
                      {LOAN_STATUS_LABELS[step]}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-blue-500 mt-0.5">Current stage</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}