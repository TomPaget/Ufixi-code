import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Sparkles, Award, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TradesPending() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <div className="max-w-lg px-5">
        <div className={cn(
          "rounded-2xl p-8 border-2",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]"
            : "bg-white border-blue-200"
        )}>
          {user?.verification_data?.auto_approved ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-green-500" />
              </div>
              <div className="text-center mb-4">
                <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">
                  AI Auto-Approved
                </Badge>
                <h1 className={cn(
                  "text-2xl font-bold mb-2",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Verification Complete! 🎉
                </h1>
                <p className={cn(
                  "mb-6",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Your documents have been automatically verified with {user?.verification_confidence}% confidence.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    Under Review
                  </Badge>
                  {user?.verification_confidence && (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      {user.verification_confidence}% Confidence
                    </Badge>
                  )}
                </div>
                <h1 className={cn(
                  "text-2xl font-bold mb-2",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  AI Verification In Progress
                </h1>
                <p className={cn(
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Our AI has analyzed your documents. A team member will complete the review within 24-48 hours.
                </p>
              </div>
            </>
          )}

          {/* Verification Details */}
          <div className="space-y-3 mb-6">
            {user?.verification_data && (
              <div className={cn(
                "rounded-xl p-4 border",
                theme === "dark"
                  ? "bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30"
                  : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <p className={cn(
                    "font-semibold text-sm",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    AI Verification Results
                  </p>
                </div>
                <p className={cn(
                  "text-xs mb-2",
                  theme === "dark" ? "text-purple-300" : "text-purple-700"
                )}>
                  {user.verification_data.document_analysis?.reasoning}
                </p>
                {user.verification_data.companies_house?.company_exists && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    Companies House Verified
                  </Badge>
                )}
              </div>
            )}

            <div className={cn(
              "rounded-xl p-4 border flex items-center gap-3",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                : "bg-slate-50 border-slate-200"
            )}>
              <FileCheck className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className={cn(
                  "font-medium text-sm",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Documents Analyzed
                </p>
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                )}>
                  OCR & AI verification complete
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57]"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}