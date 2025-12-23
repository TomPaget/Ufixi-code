import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle2, Clock, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ConsultationSummary() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const urlParams = new URLSearchParams(window.location.search);
  const consultationId = urlParams.get("id");

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: async () => {
      const consultations = await base44.entities.VideoConsultation.filter({ id: consultationId });
      return consultations[0];
    },
    enabled: !!consultationId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700"
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      <header className={cn(
        "sticky top-0 z-10 border-b",
        theme === "dark" 
          ? "bg-[#0F1E2E] border-[#57CFA4]" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-slate-700"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              Consultation Summary
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              AI-generated insights
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Consultation Info */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1E3A57] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                Consultation with {consultation?.tradesperson_name}
              </h2>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )}>
                {consultation?.scheduled_date && format(new Date(consultation.scheduled_date), "PPpp")}
              </p>
            </div>
          </div>

          {consultation?.estimated_cost && (
            <div className={cn(
              "mt-3 p-3 rounded-xl",
              theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
            )}>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Estimated Cost Discussed
              </p>
              <p className={cn(
                "text-xl font-bold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                £{consultation.estimated_cost}
              </p>
            </div>
          )}
        </div>

        {/* AI Key Points */}
        {consultation?.ai_key_points?.length > 0 && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1E3A57] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#F7B600]" />
              <h3 className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                Key Points
              </h3>
            </div>
            <ul className="space-y-2">
              {consultation.ai_key_points.map((point, i) => (
                <li key={i} className={cn(
                  "flex items-start gap-2 text-sm",
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                )}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#57CFA4] mt-2 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {consultation?.ai_action_items?.length > 0 && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1E3A57] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#57CFA4]" />
              <h3 className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                Action Items
              </h3>
            </div>
            <div className="space-y-3">
              {consultation.ai_action_items.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl border",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/10"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}>
                      {item.task}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs mt-1",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}>
                    Assigned to: {item.assigned_to}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shared Documents */}
        {consultation?.shared_documents?.length > 0 && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1E3A57] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <h3 className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                Shared Documents
              </h3>
            </div>
            <div className="space-y-2">
              {consultation.shared_documents.map((doc, i) => (
                <a
                  key={i}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border hover:bg-opacity-80",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/10"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className={cn(
                    "text-sm truncate",
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  )}>
                    Document {i + 1}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Full Transcript */}
        {consultation?.ai_transcript && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1E3A57] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <h3 className={cn(
              "font-semibold mb-3",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              Full Transcript
            </h3>
            <p className={cn(
              "text-sm whitespace-pre-wrap",
              theme === "dark" ? "text-slate-300" : "text-slate-600"
            )}>
              {consultation.ai_transcript}
            </p>
          </div>
        )}

        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] rounded-xl"
        >
          Back to Home
        </Button>
      </main>
    </div>
  );
}