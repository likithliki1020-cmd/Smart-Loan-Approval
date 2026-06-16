import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  role: z.enum(["customer", "loan_officer", "verification_officer", "admin"]).default("customer"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Loan Application ─────────────────────────────────────────────────────────
export const loanApplicationSchema = z.object({
  loanType: z.enum(["personal", "home", "business", "education", "vehicle"], {
    required_error: "Please select a loan type",
  }),
  requestedAmount: z
    .number({ required_error: "Amount is required" })
    .min(10000, "Minimum loan amount is ₹10,000")
    .max(50000000, "Maximum loan amount is ₹5 Crore"),
  tenure: z
    .number({ required_error: "Tenure is required" })
    .min(1, "Minimum tenure is 1 month")
    .max(360, "Maximum tenure is 360 months"),
  purpose: z
    .string()
    .max(500)
    .optional()
    .default(""),
  annualIncome: z
    .number({ required_error: "Annual income is required" })
    .min(100000, "Minimum annual income is ₹1,00,000"),
  employmentType: z.enum(["salaried", "self_employed", "business", "retired"], {
    required_error: "Please select employment type",
  }),
});

// ─── Loan Decision ────────────────────────────────────────────────────────────
export const loanApprovalSchema = z.object({
  approvedAmount: z.number().min(1, "Approved amount is required"),
  interestRate: z.number().min(0.1).max(30),
  tenure: z.number().min(1).max(360),
  notes: z.string().max(500).optional(),
});

export const loanRejectionSchema = z.object({
  rejectionReason: z.string().min(10, "Please provide a reason (min 10 characters)").max(500),
});

// ─── Verification ─────────────────────────────────────────────────────────────
export const verificationSchema = z.object({
  identityVerified: z.boolean(),
  incomeVerified: z.boolean(),
  addressVerified: z.boolean(),
  fraudRisk: z.enum(["low", "medium", "high"]),
  notes: z.string().max(1000).optional(),
});

// ─── Document Review ──────────────────────────────────────────────────────────
export const documentReviewSchema = z.object({
  status: z.enum(["verified", "rejected", "resubmit_required"]),
  rejectionReason: z.string().max(300).optional(),
});

// ─── User Management ──────────────────────────────────────────────────────────
export const userUpdateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  role: z.enum(["customer", "loan_officer", "verification_officer", "admin"]).optional(),
});

// ─── Loan Config ──────────────────────────────────────────────────────────────
export const loanConfigSchema = z.object({
  loanType: z.enum(["personal", "home", "business", "education", "vehicle"]),
  minAmount: z.number().min(1000),
  maxAmount: z.number(),
  minTenure: z.number().min(1),
  maxTenure: z.number(),
  baseInterestRate: z.number().min(0.1).max(30),
  processingFeePercent: z.number().min(0).max(10),
  isActive: z.boolean(),
}).refine((d) => d.maxAmount > d.minAmount, {
  message: "Max amount must be greater than min amount",
  path: ["maxAmount"],
}).refine((d) => d.maxTenure > d.minTenure, {
  message: "Max tenure must be greater than min tenure",
  path: ["maxTenure"],
});

// ─── Type Exports ─────────────────────────────────────────────────────────────
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;
export type LoanApprovalFormData = z.infer<typeof loanApprovalSchema>;
export type LoanRejectionFormData = z.infer<typeof loanRejectionSchema>;
export type VerificationFormData = z.infer<typeof verificationSchema>;
export type DocumentReviewFormData = z.infer<typeof documentReviewSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
export type LoanConfigFormData = z.infer<typeof loanConfigSchema>;