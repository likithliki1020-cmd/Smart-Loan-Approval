import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run this from Convex dashboard to create profiles for users that don't have one
export const fixMissingProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const profiles = (await ctx.db.query("userProfiles").collect()) as any[];
    const profileUserIds = new Set(profiles.map((p: any) => p.userId));

    let created = 0;
    for (const user of users) {
      if (!profileUserIds.has(user._id)) {
        const email = (user as any).email ?? "";
        await ctx.db.insert("userProfiles" as any, {
          userId: user._id,
          name: (user as any).name ?? email.split("@")[0] ?? "User",
          email,
          role: "customer", // default — update manually if needed
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }
    return `Created ${created} missing profiles`;
  },
});

// Run this to update a specific user's role
export const setUserRole = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("customer"),
      v.literal("loan_officer"),
      v.literal("verification_officer"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, { email, role }) => {
    const profiles = (await ctx.db.query("userProfiles").collect()) as any[];
    const profile = profiles.find((p: any) => p.email === email);
    if (!profile) throw new Error(`No profile found for ${email}`);
    await ctx.db.patch(profile._id, { role, updatedAt: Date.now() });
    return `Updated ${email} to role: ${role}`;
  },
});