"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { LOAN_TYPE_LABELS, LOAN_TYPE_ICONS, LOAN_DEFAULTS } from "@/lib/constants";
import type { LoanType } from "@/types";
import { Settings, Edit2, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOAN_TYPES: LoanType[] = ["personal", "home", "business", "education", "vehicle"];

interface ConfigForm {
  minAmount: number;
  maxAmount: number;
  minTenure: number;
  maxTenure: number;
  baseInterestRate: number;
  processingFeePercent: number;
  isActive: boolean;
}

export default function ConfigPage() {
  const [editingType, setEditingType] = useState<LoanType | null>(null);
  const [form, setForm] = useState<ConfigForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const configs = useQuery(api.admin.getLoanConfigs);
  const upsertConfig = useMutation(api.admin.upsertLoanConfig);

  function startEdit(type: LoanType) {
    const existing = configs?.find((c) => c.loanType === type);
    const defaults = LOAN_DEFAULTS[type];
    setForm({
      minAmount: existing?.minAmount ?? defaults.min,
      maxAmount: existing?.maxAmount ?? defaults.max,
      minTenure: existing?.minTenure ?? defaults.minTenure,
      maxTenure: existing?.maxTenure ?? defaults.maxTenure,
      baseInterestRate: existing?.baseInterestRate ?? defaults.rate,
      processingFeePercent: existing?.processingFeePercent ?? 1.0,
      isActive: existing?.isActive ?? true,
    });
    setEditingType(type);
  }

  async function handleSave() {
    if (!editingType || !form) return;
    setIsLoading(true);
    try {
      await upsertConfig({ loanType: editingType, ...form });
      setEditingType(null);
      setForm(null);
    } finally {
      setIsLoading(false);
    }
  }

  function getConfig(type: LoanType) {
    return configs?.find((c) => c.loanType === type);
  }

  return (
    <div>
      <PageHeader
        title="Loan Configuration"
        subtitle="Configure loan products, interest rates, and eligibility rules"
      />

      <div className="space-y-4">
        {LOAN_TYPES.map((type) => {
          const config = getConfig(type);
          const defaults = LOAN_DEFAULTS[type];
          const isEditing = editingType === type;

          return (
            <div key={type} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{LOAN_TYPE_ICONS[type]}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{LOAN_TYPE_LABELS[type]}</p>
                    <p className="text-xs text-slate-400">
                      {config ? "Configured" : "Using defaults"}
                    </p>
                  </div>
                  <span className={cn(
                    "ml-2 text-xs font-medium px-2 py-0.5 rounded-full",
                    config?.isActive !== false
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  )}>
                    {config?.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => startEdit(type)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingType(null); setForm(null); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {!isEditing ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      { label: "Min Amount", value: formatCurrency(config?.minAmount ?? defaults.min) },
                      { label: "Max Amount", value: formatCurrency(config?.maxAmount ?? defaults.max) },
                      { label: "Min Tenure", value: `${config?.minTenure ?? defaults.minTenure} mo` },
                      { label: "Max Tenure", value: `${config?.maxTenure ?? defaults.maxTenure} mo` },
                      { label: "Interest Rate", value: `${config?.baseInterestRate ?? defaults.rate}% p.a.` },
                      { label: "Processing Fee", value: `${config?.processingFeePercent ?? 1.0}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : form && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {([
                      { key: "minAmount", label: "Min Amount (₹)", type: "number" },
                      { key: "maxAmount", label: "Max Amount (₹)", type: "number" },
                      { key: "minTenure", label: "Min Tenure (months)", type: "number" },
                      { key: "maxTenure", label: "Max Tenure (months)", type: "number" },
                      { key: "baseInterestRate", label: "Interest Rate (%)", type: "number", step: "0.1" },
                      { key: "processingFeePercent", label: "Processing Fee (%)", type: "number", step: "0.1" },
                    ] as any[]).map(({ key, label, type, step }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                        <input
                          type={type}
                          step={step}
                          value={(form as any)[key]}
                          onChange={(e) => setForm((f) => f ? { ...f, [key]: parseFloat(e.target.value) || 0 } : f)}
                          className="input-base"
                        />
                      </div>
                    ))}
                    <div className="flex items-center gap-3 col-span-2 sm:col-span-1 mt-2">
                      <label className="text-xs font-medium text-slate-600">Active</label>
                      <button
                        type="button"
                        onClick={() => setForm((f) => f ? { ...f, isActive: !f.isActive } : f)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                          form.isActive ? "bg-blue-600" : "bg-slate-300"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                          form.isActive ? "translate-x-4" : "translate-x-1"
                        )} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}