import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Header({ onMenuClick, onGoPremium }) {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`sticky top-0 z-30 transition-all duration-300 bg-transparent ${isScrolled ? 'py-2' : 'py-3'}`}
    >
      <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ padding: '10px 16px', border: '2px solid #1a2f42', borderRadius: '9999px' }}>
        {/* Left: Menu */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all active:scale-90 flex-shrink-0"
          style={{ color: '#1E2D40' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Centre: Logo - absolutely centred */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/c6477ab39_ufixi_primary_RGB.png"
            alt="Ufixi Logo"
            className="object-contain h-8"
          />
        </div>

        {/* Right: Go Premium + Bell */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0 pr-3">
          {!user?.is_premium && (
            <motion.button
              onClick={onGoPremium}
              animate={{ 
                boxShadow: [
                  '0 0 0 16px rgba(99,196,159,0.12)',
                              '0 0 0 20px rgba(99,196,159,0.08)',
                              '0 0 0 16px rgba(99,196,159,0.12)'
                ]
              }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #63c49f, #4faf8a)', color: '#fff' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Go Premium
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}