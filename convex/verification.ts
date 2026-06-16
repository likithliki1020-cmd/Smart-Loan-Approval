import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireRole, createNotification, logActivity, extractUserId, type UserProfile } from "./helpers";

async function getProfile(ctx: any): Promise<UserProfile | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const userId = extractUserId(identity.subject);
  const profiles = (await ctx.db.query("userProfiles").collect()) as unknown as UserProfile[];
  return profiles.find((p) => p.userId === userId) ??
    profiles.find((p) => p.email === (identity.email ?? "")) ?? null;
}

export const getVerification = query({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    return ctx.db
      .query("verifications")
      .withIndex("by_application", (q: any) => q.eq("applicationId", applicationId))
      .first();
  },
});

export const myVerificationQueue = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile || profile.role !== "verification_officer") return [];
    const verifications = await ctx.db
      .query("verifications")
      .withIndex("by_officer", (q: any) => q.eq("officerId", profile.userId))
      .order("desc")
      .collect();
    const enriched = await Promise.all(
      verifications.map(async (v: any) => {
        const app = await ctx.db.get(v.applicationId);
        return { ...v, application: app };
      })
    );
    return enriched.filter((v: any) => v.application !== null);
  },
});

export const verificationStats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return { total: 0, pending: 0, inProgress: 0, completed: 0, flagged: 0 };
    const results = await ctx.db
      .query("verifications")
      .withIndex("by_officer", (q: any) => q.eq("officerId", profile.userId))
      .collect();
    return {
      total: results.length,
      pending: results.filter((v: any) => v.status === "not_started").length,
      inProgress: results.filter((v: any) => v.status === "in_progress").length,
      completed: results.filter((v: any) => v.status === "completed").length,
      flagged: results.filter((v: any) => v.status === "flagged").length,
    };
  },
});

export const startVerification = mutation({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    await requireRole(ctx, "verification_officer");
    const verification = await ctx.db
      .query("verifications")
      .withIndex("by_application", (q: any) => q.eq("applicationId", applicationId))
      .first();
    if (!verification) throw new Error("Verification record not found");
    await ctx.db.patch(verification._id, { status: "in_progress", updatedAt: Date.now() });
    return verification._id;
  },
});

export const submitVerification = mutation({
  args: {
    applicationId: v.id("loanApplications"),
    identityVerified: v.boolean(),
    incomeVerified: v.boolean(),
    addressVerified: v.boolean(),
    fraudRisk: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, ...verificationData }) => {
    const profile = await requireRole(ctx, "verification_officer");
    const verification = await ctx.db
      .query("verifications")
      .withIndex("by_application", (q: any) => q.eq("applicationId", applicationId))
      .first();
    if (!verification) throw new Error("Verification record not found");

    const allVerified =
      verificationData.identityVerified &&
      verificationData.incomeVerified &&
      verificationData.addressVerified;
    const isFlagged = verificationData.fraudRisk === "high" || !allVerified;

    await ctx.db.patch(verification._id, {
      ...verificationData,
      status: isFlagged ? "flagged" : "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");

    await ctx.db.patch(applicationId, {
      status: isFlagged ? "under_review" : "verified",
      updatedAt: Date.now(),
    });

    if (app.assignedOfficerId) {
      await createNotification(ctx, {
        userId: app.assignedOfficerId,
        type: "action_required",
        title: isFlagged ? "⚠️ Verification Flagged" : "✅ Verification Complete",
        message: isFlagged
          ? `Application ${app.applicationNumber} flagged. Review required.`
          : `Application ${app.applicationNumber} passed verification.`,
        applicationId,
      });
    }

    await createNotification(ctx, {
      userId: app.customerId,
      type: "status_update",
      title: "Verification Update",
      message: isFlagged
        ? `Your application needs additional review.`
        : `Your application has been successfully verified.`,
      applicationId,
    });

    await logActivity(ctx, {
      userId: profile.userId,
      action: "verification_submitted",
      entity: "loanApplication",
      entityId: applicationId,
      metadata: { fraudRisk: verificationData.fraudRisk, allVerified },
    });
    return verification._id;
  },
});