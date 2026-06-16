import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedUser, requireRole, type UserProfile } from "./helpers";
import type { Id } from "./_generated/dataModel";

// Extract real userId from identity.subject (may be "userId|sessionId")
function extractUserId(subject: string): Id<"users"> {
  return subject.split("|")[0] as Id<"users">;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = extractUserId(identity.subject);
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];

    const profile =
      profiles.find((p) => p.userId === userId) ??
      profiles.find((p) => p.email === (identity.email ?? ""));

    if (!profile) {
      return {
        _id: userId as any,
        _creationTime: Date.now(),
        userId,
        name: identity.name ?? identity.email?.split("@")[0] ?? "User",
        email: identity.email ?? "",
        role: "customer" as const,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } satisfies UserProfile;
    }

    return profile;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    return profiles.find((p) => p.userId === userId) ?? null;
  },
});

export const listUsers = query({
  args: {
    role: v.optional(
      v.union(
        v.literal("customer"),
        v.literal("loan_officer"),
        v.literal("verification_officer"),
        v.literal("admin")
      )
    ),
  },
  handler: async (ctx, { role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    if (role) return profiles.filter((p) => p.role === role);
    return profiles;
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { total: 0, customers: 0, officers: 0, verificationOfficers: 0, admins: 0, active: 0 };
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    return {
      total: profiles.length,
      customers: profiles.filter((u) => u.role === "customer").length,
      officers: profiles.filter((u) => u.role === "loan_officer").length,
      verificationOfficers: profiles.filter((u) => u.role === "verification_officer").length,
      admins: profiles.filter((u) => u.role === "admin").length,
      active: profiles.filter((u) => u.isActive).length,
    };
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const ensureProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("customer"),
      v.literal("loan_officer"),
      v.literal("verification_officer"),
      v.literal("admin")
    ),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Extract real userId — subject may be "userId|sessionId"
    const userId = extractUserId(identity.subject);

    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];

    const existing =
      profiles.find((p) => p.userId === userId) ??
      profiles.find((p) => p.email === args.email);

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        role: args.role,
        ...(args.phone ? { phone: args.phone } : {}),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("userProfiles" as any, {
      userId,
      name: args.name,
      email: args.email,
      role: args.role,
      ...(args.phone ? { phone: args.phone } : {}),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getAuthenticatedUser(ctx);
    await ctx.db.patch(profile._id, { ...args, updatedAt: Date.now() });
    return profile._id;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("customer"),
        v.literal("loan_officer"),
        v.literal("verification_officer"),
        v.literal("admin")
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { userId, ...updates }) => {
    await requireRole(ctx, "admin");
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    const profile = profiles.find((p) => p.userId === userId);
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { ...updates, updatedAt: Date.now() });
    return profile._id;
  },
});

export const deactivateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireRole(ctx, "admin");
    const profiles = (await ctx.db
      .query("userProfiles")
      .collect()) as unknown as UserProfile[];
    const profile = profiles.find((p) => p.userId === userId);
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { isActive: false, updatedAt: Date.now() });
    return profile._id;
  },
});