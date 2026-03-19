import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, DollarSign, BookOpen } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
        <div className="w-8 h-8 border-2 border-[#E8530A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center pb-16 pt-10">
      <LavaLampBackground />

      <div className="max-w-md mx-auto px-6 text-center space-y-10 relative z-10">
        {/* Logo */}
        <div>
          <img
            src="https://media.base44.com/images/public/6943ddc3165afcd16ccf0414/7950a6a3d_ufixi_White_RGB.png"
            alt="Ufixi"
            className="h-9 mx-auto object-contain"
            style={{ filter: 'invert(1) sepia(1) saturate(2) hue-rotate(-20deg) brightness(0.3)' }}
          />
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1
            style={{
              fontFamily: "'Vetch', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 'clamp(2.8rem, 8vw, 4.5rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#00172F',
            }}
          >
            What needs{" "}
            <span style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              fixing?
            </span>
          </h1>
          <p style={{ color: 'rgba(0,23,47,0.55)', fontSize: '1rem', fontWeight: 500, maxWidth: '26rem', margin: '0 auto' }}>
            Clarity before cost. AI diagnoses any home issue in seconds — know what's wrong, what it costs, and what to do.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleLogin}
          className="w-full py-5 px-8 text-base font-bold rounded-2xl text-white transition-all active:scale-95 hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #E8530A 0%, #D93870 100%)',
            boxShadow: '0 8px 32px rgba(232,83,10,0.35), 0 2px 10px rgba(217,56,112,0.2)',
            fontFamily: "'Helvetica Neue', sans-serif",
            letterSpacing: '0.01em',
          }}
        >
          Get started — it's free
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { icon: Zap, label: "Instant diagnosis" },
            { icon: DollarSign, label: "Cost estimates" },
            { icon: BookOpen, label: "DIY guidance" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,23,47,0.1)',
                color: '#00172F',
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: '#E8530A' }} />
              {label}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <p style={{ color: 'rgba(0,23,47,0.38)', fontSize: '0.78rem', fontWeight: 500 }}>
          No jargon. No guesswork. No wasted call-outs.
        </p>
      </div>
    </div>
  );
}