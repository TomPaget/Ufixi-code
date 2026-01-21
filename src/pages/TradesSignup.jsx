import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle2, Briefcase, Wrench, Users, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { getGradientStyle, getBackdropFilter, getBoxShadow, getBorderColor } from "@/components/kora/gradientThemes";
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 via-pink-300/50 to-orange-500/90 animate-gradient-shift-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/80 via-emerald-400/40 to-blue-600/85 animate-gradient-shift-slow-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/75 via-pink-200/45 to-orange-500/75 animate-gradient-shift-reverse-slower blur-3xl" />
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
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-sm border-slate-200/50">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Home"))}
            className="rounded-xl hover:bg-slate-100 text-[#1E3A57]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-[#1E3A57]">
            Join as a Tradesperson
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-[#F7B600]/20 border-[#F7B600]/60 text-[#F7B600]">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-semibold">For Tradespeople</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E3A57]" style={{ fontFamily: "'Coolvetica', sans-serif" }}>
            Grow Your Business
            <br />
            <span className="bg-gradient-to-r from-green-300 to-yellow-400 bg-clip-text text-transparent" style={{ fontFamily: "'Coolvetica', sans-serif" }}>
              Connect with Customers
            </span>
          </h1>
          
          <p className="text-base max-w-2xl mx-auto text-slate-800 font-medium">
            Join hundreds of verified tradespeople finding local jobs. No commission fees - keep 100% of your earnings.
          </p>

          {/* Pricing */}
          <div 
            className="max-w-sm mx-auto mt-8 p-5 rounded-2xl border-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(87, 207, 164, 0.95) 0%, rgba(87, 207, 164, 0.85) 50%, rgba(74, 222, 128, 0.90) 100%)',
              backdropFilter: 'blur(20px) saturate(180%) brightness(1.1)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.1)',
              boxShadow: '0 8px 32px rgba(87, 207, 164, 0.4), inset 0 1px 2px rgba(255,255,255,0.6)',
              borderColor: '#4ade80',
            }}
          >
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">£1.99</p>
                <p className="text-xs text-white/90 font-semibold">per week</p>
              </div>
              <div className="h-10 w-px bg-white/40" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">0%</p>
                <p className="text-xs text-white/90 font-semibold">commission</p>
              </div>
            </div>
          </div>

        </div>

        {/* Benefits */}
        <div 
          className="max-w-3xl mx-auto rounded-2xl border p-8"
          style={{
            background: getGradientStyle(theme, 'main'),
            backdropFilter: getBackdropFilter(),
            WebkitBackdropFilter: getBackdropFilter(),
            boxShadow: getBoxShadow('main'),
            borderColor: getBorderColor(theme),
          }}
        >
          <h2 className="text-2xl font-bold mb-6 text-[#1E3A57]">
            What You Get
          </h2>
          <ul className="space-y-4">
            {[
              "Direct customer connections in your area",
              "Professional profile with reviews and ratings",
              "Secure payment processing",
              "Job management dashboard",
              "AI-powered customer matching",
              "No commission on jobs - keep 100% of your earnings"
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#57CFA4] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-900 font-medium">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Onboarding Wizard */}
        <div className="max-w-3xl mx-auto">
          <TradesOnboardingWizard onComplete={handleComplete} />
        </div>

        {/* Social Proof */}
        <div className="text-center p-8 rounded-2xl border bg-white/60 backdrop-blur-md border-slate-200">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-[#57CFA4]" />
            <h3 className="font-semibold text-[#1E3A57]">
              Trusted by Tradespeople Across the UK
            </h3>
          </div>
          <p className="text-sm text-slate-800 font-medium">
            Join hundreds of verified professionals growing their business with Fixplain
          </p>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          {[
            { icon: Users, text: "Direct customer connections" },
            { icon: Clock, text: "Flexible job management" },
            { icon: Wrench, text: "Keep 100% of earnings" }
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border"
              style={{
                background: getGradientStyle(theme, 'main'),
                backdropFilter: getBackdropFilter(),
                WebkitBackdropFilter: getBackdropFilter(),
                boxShadow: getBoxShadow('main'),
                borderColor: getBorderColor(theme),
              }}
            >
              <item.icon className="w-8 h-8 mx-auto mb-2 text-[#F7B600]" />
              <p className="text-sm font-semibold text-slate-900">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}