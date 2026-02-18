import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/kora/NotificationBell";
import { motion } from "framer-motion";

export default function Header({ onMenuClick }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`sticky top-0 z-30 border-b transition-all duration-300 bg-white ${isScrolled ? 'py-2' : 'py-4'}`}
      style={{
        borderColor: '#EAECF0',
        boxShadow: isScrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none'
      }}
    >
      <div className="max-w-lg mx-auto px-5 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/8a320ec2d_ufixi_White_RGB.png"
          alt="Ufixi Logo"
          className={`object-contain transition-all duration-300 ${isScrolled ? 'h-6' : 'h-8'}`}
        />

        <NotificationBell />
      </div>
    </motion.header>
  );
}