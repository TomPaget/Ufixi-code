import { useState, useEffect } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/kora/NotificationBell";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * Shared header used across all pages.
 * - If onMenuClick is provided: shows hamburger + logo + bell (Home-style)
 * - If showBack is true: shows back arrow + title + optional bell
 */
export default function PageHeader({ onMenuClick, showBack, title, subtitle, showBell = true }) {
  const navigate = useNavigate();
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
      style={{ background: 'transparent' }}
    >
      <div
        className="max-w-lg mx-auto rounded-2xl flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,111,224,0.12)', boxShadow: '0 2px 16px rgba(124,111,224,0.08)' }}
        style={{ margin: '0 auto', padding: '10px 16px', maxWidth: '32rem' }}
      >
        {/* Left: hamburger or back */}
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ color: '#151528', minWidth: 44, minHeight: 44 }}
          >
            <Menu className="w-5 h-5" />
          </button>
        ) : showBack ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-xl flex items-center justify-center gap-1 transition-all active:scale-90 font-medium text-sm"
            style={{ color: '#151528', minWidth: 44, minHeight: 44, paddingLeft: 4, paddingRight: 8 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : <div style={{ minWidth: 44 }} />}

        {/* Centre: logo or title */}
        {title ? (
          <div className="flex-1 text-center px-2">
            <p className="font-bold text-base truncate" style={{ fontFamily: "'Sora', sans-serif", color: '#151528' }}>{title}</p>
            {subtitle && <p className="text-xs" style={{ color: '#6B6A8E' }}>{subtitle}</p>}
          </div>
        ) : (
          <img
            src="https://media.base44.com/images/public/6943ddc3165afcd16ccf0414/bd830d923_ufixi_navy_RGBi.png"
            alt="Ufixi Logo"
            className={`object-contain transition-all duration-300 ${isScrolled ? 'h-6' : 'h-8'}`}
          />
        )}

        {/* Right: bell or spacer */}
        {showBell ? <NotificationBell /> : <div style={{ minWidth: 44 }} />}
      </div>
    </motion.header>
  );
}