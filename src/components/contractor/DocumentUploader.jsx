import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";

const documentTypes = [
  { id: "insurance", label: "Public Liability Insurance", required: true },
  { id: "certification", label: "Trade Certifications", required: true },
  { id: "identification", label: "Photo ID", required: true },
  { id: "gas_safe", label: "Gas Safe Certificate", required: false },
  { id: "electrical", label: "Electrical Certificate", required: false }
];

export default function DocumentUploader({ user }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(null);
  const [documents, setDocuments] = useState(user?.trades_documents || {});

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe({ trades_documents: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const handleUpload = async (docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(docType);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const newDocs = {
        ...documents,
        [docType]: {
          url: file_url,
          uploaded_date: new Date().toISOString(),
          status: "pending_verification"
        }
      };
      
      setDocuments(newDocs);
      await updateMutation.mutateAsync(newDocs);

      // Trigger verification
      await base44.functions.invoke('verifyTradesDocuments', {
        userId: user.id,
        documentType: docType,
        documentUrl: file_url
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = (docType) => {
    const newDocs = { ...documents };
    delete newDocs[docType];
    setDocuments(newDocs);
    updateMutation.mutate(newDocs);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "pending_verification":
        return <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending_verification":
        return "Pending";
      case "rejected":
        return "Rejected";
      default:
        return "";
    }
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[#F7B600]" />
        <h2 className={cn(
          "text-xl font-bold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Verification Documents
        </h2>
      </div>

      <p className={cn(
        "text-sm mb-6",
        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
      )}>
        Upload your documents to get verified and start receiving job requests. All documents are securely stored and reviewed by our team.
      </p>

      <div className="space-y-4">
        {documentTypes.map((docType) => {
          const doc = documents[docType.id];
          const hasDoc = !!doc;

          return (
            <div
              key={docType.id}
              className={cn(
                "p-4 rounded-xl border",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className={cn(
                      "font-semibold",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}>
                      {docType.label}
                    </Label>
                    {docType.required && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  {hasDoc && (
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(doc.status)}
                      <span className={cn(
                        "text-xs",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {getStatusText(doc.status)}
                      </span>
                    </div>
                  )}
                </div>

                {hasDoc ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium",
                        theme === "dark"
                          ? "bg-[#57CFA4]/20 text-[#57CFA4] hover:bg-[#57CFA4]/30"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      )}
                    >
                      View
                    </a>
                    <button
                      onClick={() => removeDocument(docType.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleUpload(docType.id, e)}
                      disabled={uploading === docType.id}
                    />
                    <div className={cn(
                      "px-4 py-2 rounded-xl font-medium flex items-center gap-2",
                      uploading === docType.id
                        ? "bg-slate-500/20 text-slate-400"
                        : "bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                    )}>
                      {uploading === docType.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </div>
                  </label>
                )}
              </div>

              {doc?.status === "rejected" && doc?.rejection_reason && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400">
                    <strong>Rejection reason:</strong> {doc.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}