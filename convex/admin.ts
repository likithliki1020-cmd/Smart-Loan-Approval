

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireRole } from "./helpers";

// ─── Loan Config Queries ──────────────────────────────────────────────────────

export const getLoanConfigs = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    return ctx.db.query("loanConfigs").collect();
  },
});

export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const [profiles, apps, docs, verifications] = await Promise.all([
      ctx.db.query("userProfiles").collect(),
      ctx.db.query("loanApplications").collect(),
      ctx.db.query("documents").collect(),
      ctx.db.query("verifications").collect(),
    ]);

    return {
      totalUsers: profiles.length,
      totalApplications: apps.length,
      totalDocuments: docs.length,
      totalVerifications: verifications.length,
      approvedApplications: apps.filter(
        (a) => a.status === "approved" || a.status === "disbursed"
      ).length,
      totalApprovedAmount: apps
        .filter((a) => a.approvedAmount != null)
        .reduce((sum: number, a) => sum + (a.approvedAmount ?? 0), 0),
    };
  },
});

// ─── Loan Config Mutations ────────────────────────────────────────────────────

export const upsertLoanConfig = mutation({
  args: {
    loanType: v.union(
      v.literal("personal"),
      v.literal("home"),
      v.literal("business"),
      v.literal("education"),
      v.literal("vehicle")
    ),
    minAmount: v.number(),
    maxAmount: v.number(),
    minTenure: v.number(),
    maxTenure: v.number(),
    baseInterestRate: v.number(),
    processingFeePercent: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, { loanType, ...rest }) => {
    const profile = await requireRole(ctx, "admin");

    const existing = await ctx.db
      .query("loanConfigs")
      .withIndex("by_loan_type", (q) => q.eq("loanType", loanType))
      .first();

    const defaultDocs: Record<string, string[]> = {
      personal: ["aadhar", "pan", "salary_slip", "bank_statement"],
      home: ["aadhar", "pan", "salary_slip", "bank_statement", "itr", "property_docs"],
      business: ["aadhar", "pan", "itr", "bank_statement", "business_proof"],
      education: ["aadhar", "pan", "salary_slip", "bank_statement"],
      vehicle: ["aadhar", "pan", "salary_slip", "bank_statement"],
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...rest,
        requiredDocuments: existing.requiredDocuments,
        updatedBy: profile.userId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("loanConfigs", {
      loanType,
      ...rest,
      requiredDocuments: defaultDocs[loanType] ?? ["aadhar", "pan"],
      updatedBy: profile.userId,
      updatedAt: Date.now(),
    });
  },
});