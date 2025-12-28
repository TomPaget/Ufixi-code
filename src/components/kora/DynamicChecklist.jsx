import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Shield,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlayCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DynamicChecklist({ issueId, repairType = "diy" }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [expandedPhases, setExpandedPhases] = useState({});
  const [completedSteps, setCompletedSteps] = useState({});
  const [verificationDialog, setVerificationDialog] = useState(null);
  const [started, setStarted] = useState(false);

  const { data: checklist, isLoading } = useQuery({
    queryKey: ["checklist", issueId, repairType],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('generateDynamicChecklist', {
        issueId,
        repairType
      });
      return data;
    },
    enabled: started,
    staleTime: 30 * 60 * 1000
  });

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseIndex]: !prev[phaseIndex]
    }));
  };

  const handleStepComplete = (phaseIndex, stepIndex, step) => {
    const key = `${phaseIndex}-${stepIndex}`;
    
    if (!completedSteps[key] && step.verification_question) {
      setVerificationDialog({ key, step, phaseIndex, stepIndex });
    } else {
      toggleStepCompletion(key);
    }
  };

  const toggleStepCompletion = (key) => {
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const confirmVerification = () => {
    if (verificationDialog) {
      toggleStepCompletion(verificationDialog.key);
      setVerificationDialog(null);
    }
  };

  const getSafetyIcon = (level) => {
    switch (level) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'caution':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Shield className="w-4 h-4 text-green-500" />;
    }
  };

  const getSafetyColor = (level) => {
    switch (level) {
      case 'danger':
        return theme === "dark" ? "border-red-500/50 bg-red-900/20" : "border-red-300 bg-red-50";
      case 'caution':
        return theme === "dark" ? "border-orange-500/50 bg-orange-900/20" : "border-orange-300 bg-orange-50";
      default:
        return theme === "dark" ? "border-[#57CFA4]/30" : "border-slate-200";
    }
  };

  if (!started) {
    return (
      <div className={cn(
        "rounded-2xl border p-6 text-center",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <PlayCircle className="w-12 h-12 mx-auto mb-3 text-[#F7B600]" />
        <h3 className={cn(
          "font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          {repairType === 'diy' ? 'DIY Repair Checklist' : 'Professional Repair Tracker'}
        </h3>
        <p className={cn(
          "text-sm mb-4",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Get AI-generated step-by-step guidance tailored to your skill level
        </p>
        <Button
          onClick={() => setStarted(true)}
          className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
        >
          Generate Checklist
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl border p-6",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#F7B600]" />
          <span className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Generating personalized checklist...
          </span>
        </div>
      </div>
    );
  }

  if (!checklist?.success) {
    return null;
  }

  const totalSteps = checklist.phases.reduce((sum, phase) => sum + phase.steps.length, 0);
  const completedCount = Object.keys(completedSteps).filter(k => completedSteps[k]).length;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className={cn(
          "rounded-2xl border p-5",
          theme === "dark"
            ? "bg-gradient-to-br from-[#1A2F42] to-[#0F1E2E] border-[#F7B600]"
            : "bg-gradient-to-br from-white to-slate-50 border-[#F7B600]"
        )}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={cn(
                "font-bold text-lg mb-1",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {checklist.checklist_title}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                {checklist.estimated_total_time && (
                  <span className={cn(
                    "flex items-center gap-1",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    <Clock className="w-4 h-4" />
                    {checklist.estimated_total_time}
                  </span>
                )}
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  theme === "dark"
                    ? "bg-[#F7B600]/20 text-[#F7B600]"
                    : "bg-[#F7B600]/10 text-[#F7B600]"
                )}>
                  {checklist.difficulty_rating}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                Progress
              </span>
              <span className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {completedCount}/{totalSteps} steps
              </span>
            </div>
            <div className={cn(
              "h-2 rounded-full overflow-hidden",
              theme === "dark" ? "bg-slate-800" : "bg-slate-200"
            )}>
              <div
                className="h-full bg-[#57CFA4] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Critical Safety Notes */}
          {checklist.critical_safety_notes?.length > 0 && (
            <div className={cn(
              "rounded-xl border p-3 text-sm",
              theme === "dark"
                ? "bg-red-900/20 border-red-500/30"
                : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-500 mb-1">Critical Safety:</p>
                  <ul className="space-y-1">
                    {checklist.critical_safety_notes.map((note, i) => (
                      <li key={i} className="text-xs text-slate-600">• {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phases */}
        {checklist.phases.map((phase, phaseIndex) => (
          <div
            key={phaseIndex}
            className={cn(
              "rounded-2xl border overflow-hidden",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}
          >
            <button
              onClick={() => togglePhase(phaseIndex)}
              className={cn(
                "w-full p-4 flex items-center justify-between transition-colors",
                theme === "dark"
                  ? "hover:bg-[#57CFA4]/10"
                  : "hover:bg-slate-50"
              )}
            >
              <span className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {phase.phase_name}
              </span>
              {expandedPhases[phaseIndex] ? (
                <ChevronUp className="w-5 h-5 text-[#57CFA4]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#57CFA4]" />
              )}
            </button>

            {expandedPhases[phaseIndex] && (
              <div className="p-4 pt-0 space-y-3">
                {phase.steps.map((step, stepIndex) => {
                  const key = `${phaseIndex}-${stepIndex}`;
                  const isCompleted = completedSteps[key];

                  return (
                    <div
                      key={stepIndex}
                      className={cn(
                        "rounded-xl border p-4",
                        getSafetyColor(step.safety_level),
                        isCompleted && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleStepComplete(phaseIndex, stepIndex, step)}
                          className="mt-1"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-[#57CFA4]" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "font-semibold",
                              theme === "dark" ? "text-white" : "text-[#1E3A57]"
                            )}>
                              {step.step_number}. {step.title}
                            </span>
                            {getSafetyIcon(step.safety_level)}
                            {step.estimated_time_minutes && (
                              <span className="text-xs text-slate-500">
                                ~{step.estimated_time_minutes}min
                              </span>
                            )}
                          </div>

                          <p className={cn(
                            "text-sm mb-2",
                            theme === "dark" ? "text-slate-300" : "text-slate-700"
                          )}>
                            {step.description}
                          </p>

                          {step.tips?.length > 0 && (
                            <div className="flex items-start gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-[#F7B600] flex-shrink-0 mt-0.5" />
                              <div className="text-xs text-slate-600">
                                {step.tips.map((tip, i) => (
                                  <p key={i}>• {tip}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.stop_conditions?.length > 0 && (
                            <div className={cn(
                              "rounded-lg p-2 text-xs mt-2",
                              theme === "dark"
                                ? "bg-red-900/30 border border-red-500/30"
                                : "bg-red-50 border border-red-200"
                            )}>
                              <p className="font-semibold text-red-500 mb-1">🛑 STOP if:</p>
                              {step.stop_conditions.map((condition, i) => (
                                <p key={i} className="text-slate-600">• {condition}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Completion Verification */}
        {progressPercent === 100 && checklist.completion_verification && (
          <div className={cn(
            "rounded-2xl border p-5",
            theme === "dark"
              ? "bg-green-900/20 border-green-500/30"
              : "bg-green-50 border-green-200"
          )}>
            <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Final Verification
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold mb-2">Final Checks:</p>
                <ul className="space-y-1">
                  {checklist.completion_verification.final_checks?.map((check, i) => (
                    <li key={i} className="text-sm text-slate-700">✓ {check}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Success Indicators:</p>
                <ul className="space-y-1">
                  {checklist.completion_verification.success_indicators?.map((indicator, i) => (
                    <li key={i} className="text-sm text-slate-700">✓ {indicator}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={!!verificationDialog} onOpenChange={() => setVerificationDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Step Completion</DialogTitle>
          </DialogHeader>
          {verificationDialog && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                {verificationDialog.step.verification_question}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={confirmVerification}
                  className="flex-1 bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                >
                  Yes, Complete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setVerificationDialog(null)}
                  className="flex-1"
                >
                  Not Yet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}