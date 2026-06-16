import { PageHeader } from "@/components/shared/PageHeader";
import { LoanApplicationForm } from "@/components/loan/LoanApplicationForm";

export default function ApplyPage() {
  return (
    <div>
      <PageHeader
        title="Apply for a Loan"
        subtitle="Complete the form below. Your application will be reviewed within 2–3 business days."
      />
      <LoanApplicationForm />
    </div>
  );
}