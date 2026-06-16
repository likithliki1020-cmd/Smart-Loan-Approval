"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DocumentCard } from "@/components/documents/DocumentCard";
import type { Document } from "@/types";
import { CheckCircle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentReviewerProps {
  documents: Document[];
}

export function DocumentReviewer({ documents }: DocumentReviewerProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);

  const reviewDocument = useMutation(api.documents.reviewDocument);

  async function handleReview(docId: string, status: "verified" | "rejected" | "resubmit_required") {
    setProcessingId(docId);
    try {
      await reviewDocument({
        documentId: docId as any,
        status,
        rejectionReason: status !== "verified" ? rejectionReason : undefined,
      });
      setActiveRejectId(null);
      setRejectionReason("");
    } finally {
      setProcessingId(null);
    }
  }

  const pendingDocs = documents.filter((d) => d.status === "pending");
  const reviewedDocs = documents.filter((d) => d.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending review */}
      {pendingDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Pending Review ({pendingDocs.length})
          </h4>
          <div className="space-y-3">
            {pendingDocs.map((doc) => (
              <div key={doc._id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-4">
                  <DocumentCard document={doc} showDelete={false} />
                </div>

                {/* Action buttons */}
                {activeRejectId !== doc._id ? (
                  <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <button
                      onClick={() => handleReview(doc._id, "verified")}
                      disabled={!!processingId}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {processingId === doc._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                      Verify
                    </button>
                    <button
                      onClick={() => setActiveRejectId(doc._id)}
                      disabled={!!processingId}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setRejectionReason("Please resubmit a clearer copy of this document.");
                        handleReview(doc._id, "resubmit_required");
                      }}
                      disabled={!!processingId}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100 disabled:opacity-60 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Request Resubmit
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 bg-red-50 px-4 py-3 space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason..."
                      rows={2}
                      className="w-full text-xs rounded-lg border border-red-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-100 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(doc._id, "rejected")}
                        disabled={!rejectionReason.trim() || !!processingId}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => { setActiveRejectId(null); setRejectionReason(""); }}
                        className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewedDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">
            Reviewed ({reviewedDocs.length})
          </h4>
          <div className="space-y-2">
            {reviewedDocs.map((doc) => (
              <DocumentCard key={doc._id} document={doc} />
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No documents uploaded yet</p>
      )}
    </div>
  );
}