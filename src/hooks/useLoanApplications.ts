import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useMyApplications() {
  const applications = useQuery(api.loans.myApplications);
  return {
    applications: applications ?? [],
    isLoading: applications === undefined,
  };
}

export function useAllApplications(status?: string) {
  const applications = useQuery(api.loans.allApplications, { status });
  return {
    applications: applications ?? [],
    isLoading: applications === undefined,
  };
}

export function useDashboardStats() {
  const stats = useQuery(api.loans.dashboardStats);
  return {
    stats,
    isLoading: stats === undefined,
  };
}

export function useLoanMutations() {
  const createApplication = useMutation(api.loans.createApplication);
  const submitApplication = useMutation(api.loans.submitApplication);
  const assignApplication = useMutation(api.loans.assignApplication);
  const sendForVerification = useMutation(api.loans.sendForVerification);
  const approveApplication = useMutation(api.loans.approveApplication);
  const rejectApplication = useMutation(api.loans.rejectApplication);
  const markDisbursed = useMutation(api.loans.markDisbursed);

  return {
    createApplication,
    submitApplication,
    assignApplication,
    sendForVerification,
    approveApplication,
    rejectApplication,
    markDisbursed,
  };
}