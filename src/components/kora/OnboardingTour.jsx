import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Camera, Sparkles, Wrench, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const tourSteps = [
  {
    id: "welcome",
    title: "Welcome to QuoFix! 👋",
    description: "Your AI-powered home maintenance assistant. Let's show you around in 30 seconds.",
    icon: Sparkles,
    color: "from-blue-500 to-purple-500"
  },
  {
    id: "upload",
    title: "Scan Any Issue",
    description: "Take a photo, video, or audio recording of any home problem. Our AI analyzes it instantly.",
    icon: Camera,
    color: "from-amber-500 to-orange-500",
    highlight: "scan-button"
  },
  {
    id: "analysis",
    title: "Get Professional Analysis",
    description: "Receive detailed diagnostics, cost estimates, and safety warnings within seconds.",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "diy",
    title: "DIY or Hire a Pro",
    description: "Get step-by-step repair guides with Amazon product links, or find verified tradespeople.",
    icon: Wrench,
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "complete",
    title: "You're All Set! 🎉",
    description: "Start by scanning your first issue. We're here to help!",
    icon: Check,
    color: "from-violet-500 to-indigo-500"
  }
];

export default function OnboardingTour({ onComplete }) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await base44.auth.updateMe({ onboarding_completed: true });
    setIsVisible(false);
    onComplete?.();
  };

  const handleComplete = async () => {
    await base44.auth.updateMe({ onboarding_completed: true });
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "max-w-md w-full rounded-3xl overflow-hidden shadow-2xl",
            theme === "dark"
              ? "bg-[#1A2F42] border border-[#57CFA4]/30"
              : "bg-white border border-slate-200"
          )}
        >
          {/* Progress Bar */}
          <div className="h-1 bg-slate-700/30">
            <motion.div
              className="h-full bg-gradient-to-r from-[#57CFA4] to-[#F7B600]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-8">
            {/* Icon */}
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6",
              "bg-gradient-to-br shadow-xl",
              step.color
            )}>
              <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Content */}
            <h2 className={cn(
              "text-2xl font-bold text-center mb-3",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {step.title}
            </h2>
            <p className={cn(
              "text-center leading-relaxed mb-8",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              {step.description}
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold"
              >
                {currentStep === tourSteps.length - 1 ? (
                  "Get Started"
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {currentStep < tourSteps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className={cn(
                    "w-full text-sm py-2",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}
                >
                  Skip tour
                </button>
              )}
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === currentStep
                      ? "w-8 bg-[#F7B600]"
                      : idx < currentStep
                      ? "w-2 bg-[#57CFA4]"
                      : "w-2 bg-slate-600"
                  )}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}