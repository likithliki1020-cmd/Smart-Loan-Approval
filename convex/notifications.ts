import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { extractUserId, type UserProfile } from "./helpers";

async function getProfile(ctx: any): Promise<UserProfile | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const userId = extractUserId(identity.subject);
  const profiles = (await ctx.db.query("userProfiles").collect()) as unknown as UserProfile[];
  return profiles.find((p) => p.userId === userId) ??
    profiles.find((p) => p.email === (identity.email ?? "")) ?? null;
}

export const myNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", profile.userId))
      .order("desc")
      .collect();
    return limit ? notifications.slice(0, limit) : notifications;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("userId", profile.userId).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const profile = await getProfile(ctx);
    if (!profile) throw new Error("Not authenticated");
    const notif = await ctx.db.get(notificationId);
    if (!notif || notif.userId !== profile.userId)
      throw new Error("Notification not found");
    await ctx.db.patch(notificationId, { isRead: true });
    return notificationId;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) throw new Error("Not authenticated");
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("userId", profile.userId).eq("isRead", false)
      )
      .collect();
    await Promise.all(unread.map((n: any) => ctx.db.patch(n._id, { isRead: true })));
    return unread.length;
  },
});