"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";
import type { DocumentType } from "@/types";
import type { Id } from "@/../convex/_generated/dataModel";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES: DocumentType[] = [
  "aadhar", "pan", "passport",
  "salary_slip", "bank_statement", "itr",
  "business_proof", "property_docs", "other",
];

interface DocumentUploaderProps {
  applicationId: Id<"loanApplications">;
  onSuccess?: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function DocumentUploader({
  applicationId,
  onSuccess,
}: DocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>("aadhar");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = useMutation(api.documents.uploadDocument);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];

      setIsUploading(true);
      setError(null);

      try {
        // Convert file to base64 data URL
        const fileUrl = await readFileAsDataUrl(file);

        await uploadDocument({
          applicationId,
          documentType: selectedType,
          fileName: file.name,
          fileUrl,
          fileSize: file.size,
        });

        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          onSuccess?.();
        }, 2000);
      } catch (e: unknown) {
        setError(
          e instanceof Error
            ? e.message
            : "Upload failed. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [applicationId, selectedType, uploadDocument, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit for base64
    disabled: isUploading,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Document Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as DocumentType)}
          className="input-base"
          disabled={isUploading}
        >
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : uploadSuccess
            ? "border-green-400 bg-green-50"
            : "border-slate-300 hover:border-blue-300 hover:bg-slate-50",
          isUploading && "cursor-not-allowed opacity-70"
        )}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-blue-600">
              Uploading document...
            </p>
          </>
        ) : uploadSuccess ? (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
            <p className="text-sm font-medium text-green-600">
              Document uploaded successfully!
            </p>
          </>
        ) : (
          <>
            <UploadCloud
              className={cn(
                "h-8 w-8 mb-3",
                isDragActive ? "text-blue-500" : "text-slate-400"
              )}
            />
            <p className="text-sm font-semibold text-slate-700">
              {isDragActive
                ? "Drop your file here"
                : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF, JPG, PNG up to 5MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}