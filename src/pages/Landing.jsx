import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, DollarSign, BookOpen } from "lucide-react";
import LavaLampBackground from "@/components/kora/LavaLampBackground";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdf6ff 0%, #fff5f0 50%, #fef0fa 100%)' }}>
        <div className="w-8 h-8 border-2 border-[#7C6FE0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center pb-12 pt-8">
      <LavaLampBackground />

      <div className="max-w-lg mx-auto px-6 text-center space-y-8 relative z-10">
        {/* Logo */}
        <div>
          <img
            src="https://media.base44.com/images/public/6943ddc3165afcd16ccf0414/7950a6a3d_ufixi_White_RGB.png"
            alt="Ufixi Logo"
            className="h-10 mx-auto object-contain"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(124,111,224,0.3))' }}
          />
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: "'Sora', sans-serif", color: '#151528', letterSpacing: '-0.02em' }}>
            What needs{" "}
            <span style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              fixing?
            </span>
          </h1>
          <p className="text-base font-medium max-w-sm mx-auto" style={{ color: '#6B6A8E', fontFamily: "'DM Sans', sans-serif" }}>
            Upload a photo or video of any home issue and get an instant AI-powered repair assessment.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleLogin}
          className="w-full h-16 px-8 text-lg font-bold rounded-2xl text-white transition-all active:scale-95 hover:scale-[1.02] flex items-center justify-center gap-3 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FF6E32 0%, #E264AB 50%, #7C6FE0 100%)',
            boxShadow: '0 8px 40px rgba(255,110,50,0.4), 0 2px 12px rgba(226,100,171,0.3)',
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          <Sparkles className="w-5 h-5" />
          Sign in to scan your issue
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: Zap, label: "AI Analysis", color: '#FF6E32' },
            { icon: DollarSign, label: "Cost Estimates", color: '#E264AB' },
            { icon: BookOpen, label: "Repair Guides", color: '#7C6FE0' },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${color}26` }}
            >
              <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
              <p className="text-xs font-semibold" style={{ color: '#151528', fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}