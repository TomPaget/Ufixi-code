import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle2, Briefcase, Wrench, Users, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import TradesOnboardingWizard from "@/components/kora/TradesOnboardingWizard";

export default function TradesSignup() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const handleComplete = () => {
    navigate(createPageUrl("TradesPayment"));
  };

  if (user?.account_type === "trades" && user?.trades_onboarding_completed) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
      )}>
        <div className="text-center max-w-md px-5">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#57CFA4]" />
          <h1 className={cn(
            "text-2xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Already Registered
          </h1>
          <p className={cn(
            "mb-2",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Your trades account is {user.trades_status || "active"}
          </p>
          <Button onClick={() => navigate(createPageUrl("TradesDashboard"))} className="mt-6 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-pink-300/50 to-orange-500/90 animate-gradient-shift-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/80 via-emerald-400/40 to-blue-500/80 animate-gradient-shift-slow-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/70 via-pink-200/45 to-orange-500/75 animate-gradient-shift-reverse-slower blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(12%, 8%) scale(1.15) rotate(4deg); }
          50% { transform: translate(4%, 16%) scale(1.08) rotate(-2deg); }
          75% { transform: translate(-8%, 8%) scale(1.12) rotate(3deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-8%, 12%) scale(1.25) rotate(-5deg); }
          66% { transform: translate(8%, -8%) scale(1.08) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(16%, -12%) scale(1.2) rotate(6deg); }
          60% { transform: translate(-12%, 8%) scale(1.12) rotate(-3deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift-slower {
          animation: gradient-shift-slower 18s ease-in-out infinite;
        }
        .animate-gradient-shift-slow-slower {
          animation: gradient-shift-slow-slower 22s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse-slower {
          animation: gradient-shift-reverse-slower 20s ease-in-out infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/60 backdrop-blur-md border-slate-200">
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
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Join as a Tradesperson</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-6">
        {/* Hero Section */}
        <div className={cn(
          "rounded-2xl p-6 border-2 text-center",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
        )}>
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-[#F7B600]" />
          <h2 className={cn(
            "text-2xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Become a Verified Tradesperson
          </h2>
          <p className={cn(
            "text-sm mb-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Connect with local customers, grow your business, and manage jobs all in one place
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className={cn(
              "text-center",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              <p className="text-2xl font-bold text-[#F7B600]">£2.99</p>
              <p className="text-xs">per week</p>
            </div>
            <div className={cn(
              "h-8 w-px",
              theme === "dark" ? "bg-[#57CFA4]/30" : "bg-slate-300"
            )} />
            <div className={cn(
              "text-center",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              <p className="text-2xl font-bold text-[#57CFA4]">0%</p>
              <p className="text-xs">commission</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className={cn(
          "rounded-2xl p-6 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h3 className={cn(
            "font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            What you get:
          </h3>
          <ul className="space-y-3">
            {[
              "Direct customer connections in your area",
              "Professional profile with reviews and ratings",
              "Secure payment processing",
              "Job management dashboard",
              "AI-powered customer matching",
              "No commission on jobs - keep 100% of your earnings"
            ].map((benefit, i) => (
              <li key={i} className={cn(
                "flex items-start gap-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
              )}>
                <CheckCircle2 className="w-5 h-5 text-[#57CFA4] flex-shrink-0 mt-0.5" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Onboarding Wizard */}
        <TradesOnboardingWizard onComplete={handleComplete} />
      </main>
    </div>
  );
}