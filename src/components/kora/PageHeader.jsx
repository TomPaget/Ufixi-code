import { useState, useEffect } from "react";
import { Menu, ArrowLeft } from "lucide-react";
import NotificationBell from "@/components/kora/NotificationBell";
import { motion } from "framer-motion";
import { useNav } from "@/lib/NavigationContext";

/**
 * Shared header used across all pages.
 * - If onMenuClick is provided: shows hamburger + logo + bell (Home-style)
 * - If showBack is true OR canGoBack (auto): shows back arrow + title
 * - Pass showBack={false} to forcibly hide the back button on a deep page.
 */
export default function PageHeader({
  onMenuClick,
  showBack,       // explicit override; if undefined, auto-detects via canGoBack
  title,
  subtitle,
  showBell = true,
}) {
  const { goBack, canGoBack } = useNav();
  const [isScrolled, setIsScrolled] = useState(false);

  const shouldShowBack = showBack !== undefined ? showBack : (!onMenuClick && canGoBack);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3'}`}
      style={{ background: 'transparent' }}
    >
      <div
        className="max-w-lg mx-auto flex items-center justify-between"
        style={{
          margin: '0 auto',
          padding: '10px 16px',
          maxWidth: '32rem',
        }}
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
        ) : shouldShowBack ? (
          <button
            onClick={goBack}
            aria-label="Go back"
            className="rounded-xl flex items-center justify-center gap-1 transition-all active:scale-90 font-medium text-sm"
            style={{ color: '#151528', minWidth: 44, minHeight: 44, paddingLeft: 4, paddingRight: 8 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div style={{ minWidth: 44 }} />
        )}

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