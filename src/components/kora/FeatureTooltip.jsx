import { useState } from "react";
import { X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function FeatureTooltip({ title, description, position = "bottom", children }) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: position === "bottom" ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "bottom" ? -10 : 10 }}
            className={cn(
              "absolute z-50 w-64 rounded-2xl p-4 border-2",
              position === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
            )}
            style={{
              background: `linear-gradient(135deg, rgba(219,234,254,0.4) 0%, rgba(191,219,254,0.25) 40%, rgba(147,197,253,0.1) 100%), 
                           radial-gradient(circle at 25% 25%, rgba(255,255,255,0.75) 0%, transparent 40%),
                           radial-gradient(circle at 80% 80%, rgba(147,197,253,0.2) 0%, transparent 50%)`,
              backdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
              WebkitBackdropFilter: 'blur(30px) saturate(220%) brightness(1.15) contrast(1.1)',
              boxShadow: `inset -1px -1px 3px rgba(0,0,0,0.1), 
                          inset 1px 1px 4px rgba(255,255,255,0.7),
                          0 10px 40px rgba(31,65,100,0.15),
                          0 1px 3px rgba(255,255,255,0.4),
                          inset 0 -1px 0px rgba(0,0,0,0.06)`,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F7B600]/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-[#F7B600]" />
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  "font-semibold text-sm mb-1",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {title}
                </h4>
                <p className={cn(
                  "text-xs leading-relaxed",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className={cn(
                  "flex-shrink-0",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}