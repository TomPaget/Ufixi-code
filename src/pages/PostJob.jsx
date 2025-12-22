import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import JobAssistant from "@/components/kora/JobAssistant";
import RecommendedTradespeople from "@/components/kora/RecommendedTradespeople";

export default function PostJob() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [useAssistant, setUseAssistant] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData) => base44.entities.JobPosting.create(jobData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(["jobPostings"]);
      setJobDetails(data);
    }
  });

  const handleJobComplete = (jobData) => {
    const completeJobData = {
      customer_id: user?.id,
      customer_name: user?.display_name || user?.full_name,
      ...jobData,
      location: user?.approximate_location || "Not specified",
      status: "open"
    };
    createJobMutation.mutate(completeJobData);
    setJobDetails(completeJobData);
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Post a Job</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* AI Assistant Banner */}
        <div className={cn(
          "rounded-2xl p-5 border-2",
          theme === "dark"
            ? "bg-gradient-to-br from-[#F7B600]/20 to-[#F7B600]/10 border-[#F7B600]"
            : "bg-gradient-to-br from-[#F7B600]/10 to-white border-[#F7B600]"
        )}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7B600] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#0F1E2E]" />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold mb-1",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                AI Job Assistant
              </h3>
              <p className={cn(
                "text-sm mb-3",
                theme === "dark" ? "text-white/80" : "text-slate-600"
              )}>
                Let our AI help you create a detailed job posting that attracts quality quotes
              </p>
              {!useAssistant && (
                <Button
                  onClick={() => setUseAssistant(true)}
                  className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use AI Assistant
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI Assistant or Manual Form */}
        {useAssistant ? (
          <JobAssistant onComplete={handleJobComplete} />
        ) : (
          <p className={cn(
            "text-center text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Manual form coming soon - use AI Assistant for now
          </p>
        )}

        {/* Recommended Tradespeople */}
        {jobDetails && (
          <RecommendedTradespeople jobDetails={jobDetails} />
        )}
      </main>
    </div>
  );
}