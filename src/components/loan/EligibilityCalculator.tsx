"use client";

import { useState } from "react";
import { calculateEMI, calculateEligibleAmount, formatCurrency } from "@/lib/utils";
import { LOAN_DEFAULTS, LOAN_TYPE_LABELS } from "@/lib/constants";
import type { LoanType } from "@/types";
import { Calculator, TrendingUp, IndianRupee } from "lucide-react";

interface EligibilityCalculatorProps {
  loanType: LoanType;
  annualIncome: number;
  requestedAmount: number;
  tenure: number;
}

export function EligibilityCalculator({
  loanType,
  annualIncome,
  requestedAmount,
  tenure,
}: EligibilityCalculatorProps) {
  const config = LOAN_DEFAULTS[loanType];
  const eligibleAmount = calculateEligibleAmount(annualIncome, loanType);
  const emi = calculateEMI(requestedAmount, config.rate, tenure);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - requestedAmount;
  const isEligible = requestedAmount <= eligibleAmount;
  const emiToIncomeRatio = (emi * 12) / annualIncome;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Eligibility Preview</h3>
      </div>

      <div className="space-y-3">
        {/* Eligibility */}
        <div className={`rounded-lg p-3 ${isEligible ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
          <p className={`text-xs font-medium ${isEligible ? "text-green-700" : "text-amber-700"}`}>
            {isEligible ? "✓ Within eligible range" : "⚠ Exceeds estimated eligibility"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimated eligible: <span className="font-semibold">{formatCurrency(eligibleAmount)}</span>
          </p>
        </div>

        {/* EMI breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Monthly EMI</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{formatCurrency(emi)}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Interest Rate</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{config.rate}% p.a.</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Interest</p>
            <p className="text-sm font-semibold text-red-600 mt-0.5">{formatCurrency(totalInterest)}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Total Payable</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(totalPayable)}</p>
          </div>
        </div>

        {/* EMI burden indicator */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-500">EMI burden (income)</span>
            <span className={`text-xs font-medium ${emiToIncomeRatio < 0.4 ? "text-green-600" : "text-red-600"}`}>
              {(emiToIncomeRatio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${emiToIncomeRatio < 0.4 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(emiToIncomeRatio * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {emiToIncomeRatio < 0.4 ? "Healthy debt ratio" : "High debt burden — consider reducing amount"}
          </p>
        </div>
      </div>
    </div>
  );
}