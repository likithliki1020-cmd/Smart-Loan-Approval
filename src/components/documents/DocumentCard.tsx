"use client";

import { useState } from "react";
import { formatFileSize, formatDate } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Document } from "@/types";
import { FileText, Trash2, Eye, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

interface DocumentCardProps {
  document: Document;
  showDelete?: boolean;
}

function DocumentPreviewModal({
  url,
  fileName,
  onClose,
}: {
  url: string;
  fileName: string;
  onClose: () => void;
}) {
  const isImage =
    url.startsWith("data:image") ||
    /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  const isPdf =
    url.startsWith("data:application/pdf") ||
    /\.pdf$/i.test(fileName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">
            {fileName}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto max-h-[75vh] p-4">
          {isImage ? (
            <img
              src={url}
              alt={fileName}
              className="w-full h-auto rounded-lg object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-[65vh] rounded-lg border border-slate-200"
              title={fileName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileText className="h-12 w-12 mb-3" />
              <p className="text-sm">Preview not available for this file type</p>
              <p className="text-xs mt-1">{fileName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DocumentCard({ document, showDelete }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.documentType}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {document.fileName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-400">
              {formatFileSize(document.fileSize)}
            </span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">
              {formatDate(document.uploadedAt)}
            </span>
          </div>
          {document.rejectionReason && (
            <p className="mt-1 text-xs text-red-500 bg-red-50 rounded px-2 py-0.5 inline-block">
              {document.rejectionReason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={document.status} size="sm" />

          <button
            onClick={() => setShowPreview(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Preview document"
          >
            <Eye className="h-4 w-4" />
          </button>

          {showDelete && document.status === "pending" && (
            <button
              onClick={() =>
                deleteDocument({ documentId: document._id as any })
              }
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showPreview && (
        <DocumentPreviewModal
          url={document.fileUrl}
          fileName={document.fileName}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}