import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  useEffect(() => {
    if (user) {
      navigate(createPageUrl("Home"));
    }
  }, [user, navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Home"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-500/75 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/65 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(15%, 10%) scale(1.2) rotate(5deg); }
          50% { transform: translate(5%, 20%) scale(1.1) rotate(-3deg); }
          75% { transform: translate(-10%, 10%) scale(1.15) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-10%, 15%) scale(1.3) rotate(-6deg); }
          66% { transform: translate(10%, -10%) scale(1.1) rotate(5deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(20%, -15%) scale(1.25) rotate(7deg); }
          60% { transform: translate(-15%, 10%) scale(1.15) rotate(-4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 15s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 13s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-3xl bg-[#1E3A57] text-white mx-auto mb-8 shadow-2xl">
          F
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold text-[#0F1E2E] mb-6">
          <span className="whitespace-nowrap font-normal" style={{ fontFamily: "'Coolvetica', sans-serif" }}>What needs</span>{" "}
          <span className="bg-gradient-to-r from-green-300 to-yellow-400 bg-clip-text text-transparent font-normal" style={{ fontFamily: "'Coolvetica', sans-serif" }}>
            fixing?
          </span>
        </h1>

        <p className="text-xl text-slate-700 mb-12 max-w-xl mx-auto font-medium">
          Upload a photo or video of any issue and get an instant professional assessment with repair guidance.
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleLogin}
          className="h-16 px-8 text-lg font-semibold text-[#0F1E2E] rounded-2xl shadow-2xl hover:scale-105 transition-all"
          style={{
            background: `linear-gradient(135deg, rgba(74,222,128,0.85) 0%, rgba(74,222,128,0.65) 40%, rgba(74,222,128,0.5) 100%), 
                         radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9) 0%, transparent 40%),
                         radial-gradient(circle at 80% 80%, rgba(74,222,128,0.6) 0%, transparent 50%)`,
            backdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
            WebkitBackdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
            boxShadow: `inset -1px -1px 3px rgba(0,0,0,0.1), 
                        inset 1px 1px 4px rgba(255,255,255,0.8),
                        0 10px 60px rgba(74,222,128,0.5),
                        0 1px 3px rgba(255,255,255,0.5),
                        inset 0 -1px 0px rgba(0,0,0,0.06)`,
          }}
        >
          <Sparkles className="w-6 h-6 mr-3" />
          Create An Account or Sign In and scan your problem
        </Button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <Sparkles className="w-6 h-6 text-[#57CFA4]" />
            </div>
            <p className="text-sm font-semibold text-[#0F1E2E]">AI-Powered Analysis</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <Sparkles className="w-6 h-6 text-[#57CFA4]" />
            </div>
            <p className="text-sm font-semibold text-[#0F1E2E]">Instant Estimates</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-white/60 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <Sparkles className="w-6 h-6 text-[#57CFA4]" />
            </div>
            <p className="text-sm font-semibold text-[#0F1E2E]">Expert Guidance</p>
          </div>
        </div>
      </div>
    </div>
  );
}