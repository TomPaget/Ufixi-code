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
      className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3'}`}
    >
      <div className="max-w-lg mx-auto px-4 flex items-center relative" style={{ padding: '10px 16px' }}>
        {/* Left: Menu */}
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ color: '#151528' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Centre: Logo - absolutely centred */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
          <img 
            src="https://media.base44.com/images/public/6943ddc3165afcd16ccf0414/7950a6a3d_ufixi_White_RGB.png"
            alt="Ufixi Logo"
            className="object-contain h-8"
            style={{}
          />
        </div>

        {/* Right: Go Premium */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0 pr-3">
          {!user?.is_premium && (
            <motion.button
              onClick={onGoPremium}
              animate={{ 
                boxShadow: [
                  '0 0 0 0px rgba(226,100,171,0.2)',
                  '0 0 0 6px rgba(226,100,171,0.08)',
                  '0 0 0 0px rgba(226,100,171,0.2)'
                ]
              }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB)', color: '#fff' }}
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