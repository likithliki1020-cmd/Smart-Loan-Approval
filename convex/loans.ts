import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireRole,
  createNotification,
  logActivity,
  generateApplicationNumber,
  calculateEMI,
  extractUserId,
  type UserProfile,
} from "./helpers";
import type { Id } from "./_generated/dataModel";

async function getProfile(ctx: any): Promise<UserProfile | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const userId = extractUserId(identity.subject);
  const profiles = (await ctx.db
    .query("userProfiles")
    .collect()) as unknown as UserProfile[];
  return (
    profiles.find((p) => p.userId === userId) ??
    profiles.find((p) => p.email === (identity.email ?? "")) ??
    null
  );
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getApplication = query({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const app = await ctx.db.get(applicationId);
    if (!app) return null;
    if (profile.role === "customer" && app.customerId !== profile.userId)
      return null;
    return app;
  },
});

export const myApplications = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    return ctx.db
      .query("loanApplications")
      .withIndex("by_customer", (q: any) => q.eq("customerId", profile.userId))
      .order("desc")
      .collect();
  },
});

export const allApplications = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    if (!["loan_officer", "admin", "verification_officer"].includes(profile.role))
      return [];

    let apps;
    if (status) {
      apps = await ctx.db
        .query("loanApplications")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .order("desc")
        .collect();
    } else {
      apps = await ctx.db.query("loanApplications").order("desc").collect();
    }

    if (profile.role === "verification_officer") {
      apps = apps.filter(
        (a: any) => a.assignedVerificationOfficerId === profile.userId
      );
    }
    return limit ? apps.slice(0, limit) : apps;
  },
});

export const assignedApplications = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    return ctx.db
      .query("loanApplications")
      .withIndex("by_officer", (q: any) =>
        q.eq("assignedOfficerId", profile.userId)
      )
      .order("desc")
      .collect();
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile)
      return { total: 0, pending: 0, approved: 0, rejected: 0 };

    const apps = await ctx.db.query("loanApplications").collect();

    if (profile.role === "customer") {
      const mine = apps.filter((a: any) => a.customerId === profile.userId);
      return {
        total: mine.length,
        pending: mine.filter((a: any) =>
          ["submitted", "under_review", "pending_verification"].includes(a.status)
        ).length,
        approved: mine.filter(
          (a: any) => a.status === "approved" || a.status === "disbursed"
        ).length,
        rejected: mine.filter((a: any) => a.status === "rejected").length,
      };
    }

    const relevant =
      profile.role === "loan_officer"
        ? apps.filter((a: any) => a.assignedOfficerId === profile.userId)
        : apps;

    return {
      total: relevant.length,
      pending: relevant.filter((a: any) =>
        ["submitted", "under_review"].includes(a.status)
      ).length,
      pendingVerification: relevant.filter(
        (a: any) => a.status === "pending_verification"
      ).length,
      approved: relevant.filter((a: any) => a.status === "approved").length,
      rejected: relevant.filter((a: any) => a.status === "rejected").length,
      disbursed: relevant.filter((a: any) => a.status === "disbursed").length,
      totalApprovedAmount: relevant
        .filter((a: any) => a.approvedAmount)
        .reduce((sum: number, a: any) => sum + (a.approvedAmount ?? 0), 0),
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createApplication = mutation({
  args: {
    loanType: v.union(
      v.literal("personal"), v.literal("home"),
      v.literal("business"), v.literal("education"), v.literal("vehicle")
    ),
    requestedAmount: v.number(),
    tenure: v.number(),
    purpose: v.optional(v.string()),
    annualIncome: v.number(),
    employmentType: v.union(
      v.literal("salaried"), v.literal("self_employed"),
      v.literal("business"), v.literal("retired")
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, "customer");
    const applicationId = await ctx.db.insert("loanApplications", {
      ...args,
      applicationNumber: generateApplicationNumber(args.loanType),
      customerId: profile.userId,
      customerName: profile.name,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await logActivity(ctx, {
      userId: profile.userId,
      action: "created",
      entity: "loanApplication",
      entityId: applicationId,
    });
    return applicationId;
  },
});

export const submitApplication = mutation({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    const profile = await requireRole(ctx, "customer");
    const app = await ctx.db.get(applicationId);
    if (!app || app.customerId !== profile.userId)
      throw new Error("Application not found");
    if (app.status !== "draft")
      throw new Error("Only draft applications can be submitted");

    await ctx.db.patch(applicationId, {
      status: "submitted",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: profile.userId,
      type: "application_submitted",
      title: "Application Submitted",
      message: `Your loan application ${app.applicationNumber} has been submitted successfully.`,
      applicationId,
    });

    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    const officers = profiles.filter((p) => p.role === "loan_officer");
    for (const officer of officers) {
      await createNotification(ctx, {
        userId: officer.userId,
        type: "action_required",
        title: "New Application",
        message: `New ${app.loanType} loan application from ${profile.name}.`,
        applicationId,
      });
    }

    await logActivity(ctx, {
      userId: profile.userId,
      action: "submitted",
      entity: "loanApplication",
      entityId: applicationId,
    });
    return applicationId;
  },
});

export const assignApplication = mutation({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    const profile = await requireRole(ctx, "loan_officer");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");

    await ctx.db.patch(applicationId, {
      assignedOfficerId: profile.userId,
      status: "under_review",
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: app.customerId,
      type: "status_update",
      title: "Application Under Review",
      message: `Your application ${app.applicationNumber} is now under review.`,
      applicationId,
    });
    return applicationId;
  },
});

export const sendForVerification = mutation({
  args: {
    applicationId: v.id("loanApplications"),
    verificationOfficerId: v.id("users"),
  },
  handler: async (ctx, { applicationId, verificationOfficerId }) => {
    await requireRole(ctx, "loan_officer");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");

    await ctx.db.patch(applicationId, {
      assignedVerificationOfficerId: verificationOfficerId,
      status: "pending_verification",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("verifications", {
      applicationId,
      officerId: verificationOfficerId,
      status: "not_started",
      fraudRisk: "unknown",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: verificationOfficerId,
      type: "action_required",
      title: "Verification Required",
      message: `Application ${app.applicationNumber} assigned for verification.`,
      applicationId,
    });

    await createNotification(ctx, {
      userId: app.customerId,
      type: "status_update",
      title: "Verification In Progress",
      message: `Your application ${app.applicationNumber} is being verified.`,
      applicationId,
    });
    return applicationId;
  },
});

export const approveApplication = mutation({
  args: {
    applicationId: v.id("loanApplications"),
    approvedAmount: v.number(),
    interestRate: v.number(),
    tenure: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, approvedAmount, interestRate, tenure }) => {
    const profile = await requireRole(ctx, "loan_officer");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");

    const emiAmount = calculateEMI(approvedAmount, interestRate, tenure);
    await ctx.db.patch(applicationId, {
      status: "approved",
      approvedAmount,
      interestRate,
      tenure,
      emiAmount,
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: app.customerId,
      type: "loan_approved",
      title: "🎉 Loan Approved!",
      message: `Your loan of ₹${approvedAmount.toLocaleString("en-IN")} approved at ${interestRate}% p.a.`,
      applicationId,
    });

    await logActivity(ctx, {
      userId: profile.userId,
      action: "approved",
      entity: "loanApplication",
      entityId: applicationId,
      metadata: { approvedAmount, interestRate, tenure },
    });
    return applicationId;
  },
});

export const rejectApplication = mutation({
  args: {
    applicationId: v.id("loanApplications"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, { applicationId, rejectionReason }) => {
    const profile = await requireRole(ctx, "loan_officer");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");

    await ctx.db.patch(applicationId, {
      status: "rejected",
      rejectionReason,
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: app.customerId,
      type: "loan_rejected",
      title: "Loan Application Rejected",
      message: `Application ${app.applicationNumber} rejected. Reason: ${rejectionReason}`,
      applicationId,
    });

    await logActivity(ctx, {
      userId: profile.userId,
      action: "rejected",
      entity: "loanApplication",
      entityId: applicationId,
      metadata: { rejectionReason },
    });
    return applicationId;
  },
});

export const markDisbursed = mutation({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    await requireRole(ctx, "loan_officer", "admin");
    const app = await ctx.db.get(applicationId);
    if (!app || app.status !== "approved")
      throw new Error("Application not eligible for disbursal");

    await ctx.db.patch(applicationId, {
      status: "disbursed",
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: app.customerId,
      type: "status_update",
      title: "Loan Disbursed",
      message: `Your loan of ₹${app.approvedAmount?.toLocaleString("en-IN")} has been disbursed.`,
      applicationId,
    });
    return applicationId;
  },
});