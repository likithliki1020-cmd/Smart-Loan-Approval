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

export const getApplicationDocuments = query({
  args: { applicationId: v.id("loanApplications") },
  handler: async (ctx, { applicationId }) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    const app = await ctx.db.get(applicationId);
    if (!app) return [];
    if (profile.role === "customer" && app.customerId !== profile.userId) return [];
    return ctx.db
      .query("documents")
      .withIndex("by_application", (q: any) => q.eq("applicationId", applicationId))
      .collect();
  },
});

export const myDocuments = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    return ctx.db
      .query("documents")
      .withIndex("by_customer", (q: any) => q.eq("customerId", profile.userId))
      .order("desc")
      .collect();
  },
});

export const uploadDocument = mutation({
  args: {
    applicationId: v.id("loanApplications"),
    documentType: v.union(
      v.literal("aadhar"), v.literal("pan"), v.literal("passport"),
      v.literal("salary_slip"), v.literal("bank_statement"), v.literal("itr"),
      v.literal("business_proof"), v.literal("property_docs"), v.literal("other")
    ),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await requireRole(ctx, "customer");
    const app = await ctx.db.get(args.applicationId);
    if (!app || app.customerId !== profile.userId)
      throw new Error("Application not found");

    const docId = await ctx.db.insert("documents", {
      ...args,
      customerId: profile.userId,
      status: "pending",
      uploadedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (app.assignedVerificationOfficerId) {
      await createNotification(ctx, {
        userId: app.assignedVerificationOfficerId,
        type: "action_required",
        title: "New Document Uploaded",
        message: `${profile.name} uploaded a document for ${app.applicationNumber}.`,
        applicationId: args.applicationId,
      });
    }
    return docId;
  },
});

export const reviewDocument = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("verified"), v.literal("rejected"), v.literal("resubmit_required")
    ),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, { documentId, status, rejectionReason }) => {
    const profile = await requireRole(ctx, "verification_officer", "loan_officer", "admin");
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    await ctx.db.patch(documentId, {
      status,
      verifiedBy: profile.userId,
      rejectionReason: status !== "verified" ? rejectionReason : undefined,
      updatedAt: Date.now(),
    });

    await createNotification(ctx, {
      userId: doc.customerId,
      type: status === "verified" ? "document_verified" : "document_rejected",
      title: status === "verified" ? "Document Verified ✓" : "Document Action Required",
      message:
        status === "verified"
          ? `Your ${doc.documentType.replace(/_/g, " ")} has been verified.`
          : `Your ${doc.documentType.replace(/_/g, " ")} was ${status === "rejected" ? "rejected" : "flagged for resubmission"}. ${rejectionReason ?? ""}`,
      applicationId: doc.applicationId,
    });

    await logActivity(ctx, {
      userId: profile.userId,
      action: `document_${status}`,
      entity: "document",
      entityId: documentId,
    });
    return documentId;
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const profile = await requireRole(ctx, "customer");
    const doc = await ctx.db.get(documentId);
    if (!doc || doc.customerId !== profile.userId)
      throw new Error("Document not found");
    if (doc.status !== "pending")
      throw new Error("Cannot delete a reviewed document");
    await ctx.db.delete(documentId);
    return documentId;
  },
});