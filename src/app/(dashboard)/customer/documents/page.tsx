"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FolderOpen, Upload } from "lucide-react";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function DocumentsPage() {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const documents = useQuery(api.documents.myDocuments);
  const applications = useQuery(api.loans.myApplications);

  const submittedApps = (applications ?? []).filter(
    (a) => a.status !== "draft" && a.status !== "rejected"
  );

  return (
    <div>
      <PageHeader
        title="My Documents"
        subtitle="Upload and manage your loan documents"
        action={
          submittedApps.length > 0 && (
            <button
              onClick={() => setShowUploader((s) => !s)}
              className="btn-primary"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
          )
        }
      />

      {/* Upload section */}
      {showUploader && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload New Document</h3>

          {/* Application selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Application
            </label>
            <select
              value={selectedAppId ?? ""}
              onChange={(e) => setSelectedAppId(e.target.value || null)}
              className="input-base"
            >
              <option value="">Select an application...</option>
              {submittedApps.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.applicationNumber} — {app.loanType} loan
                </option>
              ))}
            </select>
          </div>

          {selectedAppId && (
            <DocumentUploader
              applicationId={selectedAppId as Id<"loanApplications">}
              onSuccess={() => {
                setShowUploader(false);
                setSelectedAppId(null);
              }}
            />
          )}
        </div>
      )}

      {/* Documents list */}
      {documents === undefined ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title="No documents uploaded"
          description="Upload your identity and income proof documents for loan processing."
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} document={doc as any} showDelete={true} />
          ))}
        </div>
      )}
    </div>
  );
}