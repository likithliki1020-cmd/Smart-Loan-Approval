import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("customer"),
      v.literal("loan_officer"),
      v.literal("verification_officer"),
      v.literal("admin")
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  loanApplications: defineTable({
    applicationNumber: v.string(),
    customerId: v.id("users"),
    customerName: v.string(),
    loanType: v.union(
      v.literal("personal"),
      v.literal("home"),
      v.literal("business"),
      v.literal("education"),
      v.literal("vehicle")
    ),
    requestedAmount: v.number(),
    tenure: v.number(),
    purpose: v.optional(v.string()),
    annualIncome: v.number(),
    employmentType: v.union(
      v.literal("salaried"),
      v.literal("self_employed"),
      v.literal("business"),
      v.literal("retired")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("pending_verification"),
      v.literal("verified"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("disbursed")
    ),
    assignedOfficerId: v.optional(v.id("users")),
    assignedVerificationOfficerId: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
    approvedAmount: v.optional(v.number()),
    interestRate: v.optional(v.number()),
    emiAmount: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_officer", ["assignedOfficerId"])
    .index("by_verification_officer", ["assignedVerificationOfficerId"])
    .index("by_application_number", ["applicationNumber"]),

  documents: defineTable({
    applicationId: v.id("loanApplications"),
    customerId: v.id("users"),
    documentType: v.union(
      v.literal("aadhar"),
      v.literal("pan"),
      v.literal("passport"),
      v.literal("salary_slip"),
      v.literal("bank_statement"),
      v.literal("itr"),
      v.literal("business_proof"),
      v.literal("property_docs"),
      v.literal("other")
    ),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("resubmit_required")
    ),
    verifiedBy: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
    uploadedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_application", ["applicationId"])
    .index("by_customer", ["customerId"]),

  verifications: defineTable({
    applicationId: v.id("loanApplications"),
    officerId: v.id("users"),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("flagged")
    ),
    identityVerified: v.optional(v.boolean()),
    incomeVerified: v.optional(v.boolean()),
    addressVerified: v.optional(v.boolean()),
    fraudRisk: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("unknown")
    ),
    notes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_application", ["applicationId"])
    .index("by_officer", ["officerId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("application_submitted"),
      v.literal("status_update"),
      v.literal("document_verified"),
      v.literal("document_rejected"),
      v.literal("loan_approved"),
      v.literal("loan_rejected"),
      v.literal("action_required")
    ),
    title: v.string(),
    message: v.string(),
    applicationId: v.optional(v.id("loanApplications")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),

  loanConfigs: defineTable({
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
    requiredDocuments: v.array(v.string()),
    isActive: v.boolean(),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_loan_type", ["loanType"]),

  activityLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    entity: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entity", "entityId"]),
});