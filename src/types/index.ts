export type UserRole = "customer" | "loan_officer" | "verification_officer" | "admin";

export type LoanType = "personal" | "home" | "business" | "education" | "vehicle";

export type LoanStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "pending_verification"
  | "verified"
  | "approved"
  | "rejected"
  | "disbursed";

export type DocumentType =
  | "aadhar"
  | "pan"
  | "passport"
  | "salary_slip"
  | "bank_statement"
  | "itr"
  | "business_proof"
  | "property_docs"
  | "other";

export type DocumentStatus = "pending" | "verified" | "rejected" | "resubmit_required";

export type VerificationStatus = "not_started" | "in_progress" | "completed" | "flagged";

export type NotificationType =
  | "application_submitted"
  | "status_update"
  | "document_verified"
  | "document_rejected"
  | "loan_approved"
  | "loan_rejected"
  | "action_required";

// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: number;
}

// ─── Loan Application ─────────────────────────────────────────────────────────
export interface LoanApplication {
  _id: string;
  applicationNumber: string;
  customerId: string;
  customerName: string;
  loanType: LoanType;
  requestedAmount: number;
  tenure: number; // months
  purpose: string;
  annualIncome: number;
  employmentType: "salaried" | "self_employed" | "business" | "retired";
  status: LoanStatus;
  assignedOfficerId?: string;
  assignedVerificationOfficerId?: string;
  rejectionReason?: string;
  approvedAmount?: number;
  interestRate?: number;
  emiAmount?: number;
  submittedAt?: number;
  updatedAt: number;
  createdAt: number;
}

// ─── Document ─────────────────────────────────────────────────────────────────
export interface Document {
  _id: string;
  applicationId: string;
  customerId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: DocumentStatus;
  verifiedBy?: string;
  rejectionReason?: string;
  uploadedAt: number;
  updatedAt: number;
}

// ─── Verification ─────────────────────────────────────────────────────────────
export interface Verification {
  _id: string;
  applicationId: string;
  officerId: string;
  status: VerificationStatus;
  identityVerified?: boolean;
  incomeVerified?: boolean;
  addressVerified?: boolean;
  fraudRisk: "low" | "medium" | "high" | "unknown";
  notes?: string;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  applicationId?: string;
  isRead: boolean;
  createdAt: number;
}

// ─── Loan Config ──────────────────────────────────────────────────────────────
export interface LoanConfig {
  _id: string;
  loanType: LoanType;
  minAmount: number;
  maxAmount: number;
  minTenure: number;
  maxTenure: number;
  baseInterestRate: number;
  processingFeePercent: number;
  requiredDocuments: DocumentType[];
  isActive: boolean;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalDisbursed: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────
export interface LoanApplicationFormData {
  loanType: LoanType;
  requestedAmount: number;
  tenure: number;
  purpose: string;
  annualIncome: number;
  employmentType: "salaried" | "self_employed" | "business" | "retired";
}