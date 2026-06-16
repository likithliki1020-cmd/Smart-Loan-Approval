# 🏦 SmartLoan — Loan Approval & Customer Verification System

A modern, full-stack digital platform for automating loan application processing, customer verification, document management, and loan approval workflows.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **Backend** | Convex (database, real-time, functions) |
| **Authentication** | Convex Auth (Password provider) |
| **Package Manager** | Bun |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **File Upload** | Base64 (stored in Convex) |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Customer** | Apply for loans, upload documents, track applications |
| **Loan Officer** | Review applications, approve/reject, send for verification |
| **Verification Officer** | Verify documents, complete verification checklist |
| **Admin** | Manage users, configure loan products, system overview |

---

## ✨ Features

### Customer
- Multi-step loan application wizard (Personal, Home, Business, Education, Vehicle)
- Real-time EMI calculator and eligibility preview
- Document upload (Aadhaar, PAN, salary slips, bank statements, etc.)
- Inline document preview (images & PDFs)
- Application status tracking with timeline
- Real-time notifications

### Loan Officer
- Application management with status filters
- One-click assignment and review workflow
- Send applications for verification with officer assignment
- Approve with custom amount, interest rate & tenure
- Reject with reason
- Mark loans as disbursed
- Reports and analytics dashboard

### Verification Officer
- Verification queue with assigned applications
- Document review (verify / reject / request resubmission)
- Verification checklist (identity, income, address)
- Fraud risk assessment (Low / Medium / High)
- Notes and completion reports

### Admin
- User management (view, role change, activate/deactivate)
- Loan product configuration (interest rates, limits, tenure)
- System-wide dashboard with stats
- Deactivated account enforcement

---

## 📁 Project Structure

```
smart-loan-approval/
├── convex/                      # Backend (Convex)
│   ├── schema.ts                # Database schema
│   ├── auth.ts                  # Authentication setup
│   ├── users.ts                 # User management functions
│   ├── loans.ts                 # Loan application functions
│   ├── documents.ts             # Document management
│   ├── verification.ts          # Verification workflow
│   ├── notifications.ts         # Notification system
│   ├── admin.ts                 # Admin functions
│   ├── helpers.ts               # Shared utilities
│   └── http.ts                  # HTTP routes
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Shared dashboard layout
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── customer/        # Customer pages
│   │   │   ├── officer/         # Loan officer pages
│   │   │   └── verification/    # Verification officer pages
│   │   ├── setup/               # Post-registration profile setup
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Root redirect
│   │
│   ├── components/
│   │   ├── documents/           # Document upload & preview
│   │   ├── layout/              # Sidebar, Header, MobileNav
│   │   ├── loan/                # Loan form, cards, timeline
│   │   ├── notifications/       # Notification bell
│   │   ├── shared/              # DataTable, EmptyState, StatusBadge
│   │   └── verification/        # Document reviewer, verification panel
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts    # Current user hook
│   │   └── useLoanApplications.ts
│   │
│   ├── lib/
│   │   ├── constants.ts         # App-wide constants
│   │   ├── utils.ts             # Helper functions
│   │   └── validations.ts       # Zod schemas
│   │
│   └── types/
│       └── index.ts             # TypeScript types
```

---

## ⚙️ Setup & Installation

### Prerequisites
- [Bun](https://bun.sh) installed
- [Convex account](https://dashboard.convex.dev)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd smart-loan-approval
bun install
```

### 2. Configure Convex

```bash
npx convex dev
```

This will:
- Ask you to log in to Convex
- Create/link your project
- Auto-generate `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` in `.env.local`

### 3. Set Convex Environment Variables

```bash
# Generate and set JWT keys for auth
node --input-type=module --eval "
import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
const keys = await generateKeyPair('RS256', { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] });
console.log('JWT_PRIVATE_KEY:');
console.log(privateKey.trimEnd().replace(/\n/g, ' '));
console.log('\nJWKS:');
console.log(jwks);
"
```

Then set in Convex Dashboard → your project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `AUTH_SECRET` | Any random 32+ char string |
| `SITE_URL` | `http://localhost:3000` |
| `JWT_PRIVATE_KEY` | Output from above (single line with spaces) |
| `JWKS` | JSON string from above |

### 4. Create `.env.local`

```env
# Auto-filled by npx convex dev
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Auth
CONVEX_SITE_URL=http://localhost:3000

# Windows only (fixes cross-filesystem issue)
CONVEX_TMPDIR=D:\Your\Project\Path\.convex-tmp
```

### 5. Run Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js frontend
bun run dev
```

Visit `http://localhost:3000`

---

## 🔐 First Time Setup

1. Go to `http://localhost:3000/register`
2. Select **Administrator** role
3. Fill in your details and register
4. You'll be redirected to the admin dashboard
5. From there, create other user accounts (Loan Officers, Verification Officers, Customers)

---

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `users` | Managed by Convex Auth |
| `userProfiles` | Custom user data (role, name, isActive) |
| `loanApplications` | All loan applications |
| `documents` | Uploaded documents (base64) |
| `verifications` | Verification records |
| `notifications` | User notifications |
| `loanConfigs` | Loan product configuration |
| `activityLogs` | Audit trail |

---

## 🛠️ Available Scripts

```bash
bun run dev          # Start Next.js dev server
bun run build        # Build for production
bun run start        # Start production server
npx convex dev       # Start Convex backend (keep running)
npx convex deploy    # Deploy to Convex production
```

---

## 🔄 Loan Application Workflow

```
Customer applies → Draft
       ↓
Customer submits → Submitted
       ↓
Loan Officer reviews → Under Review
       ↓
Sent for verification → Pending Verification
       ↓
Verification Officer verifies → Verified (or flagged → Under Review)
       ↓
Loan Officer approves → Approved
       ↓
Loan disbursed → Disbursed
```

---

## 📝 Notes

- **Document Storage**: Documents are stored as base64 data URLs directly in Convex (suitable for development and small-scale use)
- **Real-time Updates**: All dashboards update in real-time via Convex subscriptions
- **Role-based Access**: Each role sees only relevant data and actions
- **Deactivated Accounts**: Deactivated users are blocked from accessing the dashboard even if they have a valid session

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
