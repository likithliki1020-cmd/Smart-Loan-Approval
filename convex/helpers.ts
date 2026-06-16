import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "customer" | "loan_officer" | "verification_officer" | "admin";

export interface UserProfile {
  _id: Id<"userProfiles">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Extract real userId from identity.subject (format: "userId|sessionId")
export function extractUserId(subject: string): Id<"users"> {
  return subject.split("|")[0] as Id<"users">;
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<UserProfile> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const userId = extractUserId(identity.subject);
  const email = identity.email ?? "";

  const profiles = (await ctx.db
    .query("userProfiles")
    .collect()) as unknown as UserProfile[];

  const profile =
    profiles.find((p) => p.userId === userId) ??
    profiles.find((p) => p.email === email);

  if (!profile) throw new Error("User profile not found");
  if (!profile.isActive) throw new Error("Account is deactivated");
  return profile;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  ...roles: UserRole[]
): Promise<UserProfile> {
  const profile = await getAuthenticatedUser(ctx);
  if (!roles.includes(profile.role)) {
    throw new Error(`Access denied. Required role: ${roles.join(" or ")}`);
  }
  return profile;
}

// ─── Notification Helper ──────────────────────────────────────────────────────

export async function createNotification(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    type:
      | "application_submitted"
      | "status_update"
      | "document_verified"
      | "document_rejected"
      | "loan_approved"
      | "loan_rejected"
      | "action_required";
    title: string;
    message: string;
    applicationId?: Id<"loanApplications">;
  }
) {
  return ctx.db.insert("notifications", {
    ...params,
    isRead: false,
    createdAt: Date.now(),
  });
}

// ─── Activity Log Helper ──────────────────────────────────────────────────────

export async function logActivity(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }
) {
  return ctx.db.insert("activityLogs", {
    userId: params.userId,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    createdAt: Date.now(),
  });
}

// ─── Generators ──────────────────────────────────────────────────────────────

export function generateApplicationNumber(loanType: string): string {
  const prefix = loanType.slice(0, 2).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${year}${random}`;
}

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi =
    (principal * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}