import { X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function BannerAd() {
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg",
      theme === "dark" 
        ? "bg-slate-800 border-slate-700" 
        : "bg-white border-slate-200"
    )}>
      <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className={cn(
            "text-xs font-medium",
            theme === "dark" ? "text-slate-300" : "text-slate-700"
          )}>
            🔧 Need a trusted pro? <span className="text-blue-500">Find local contractors</span>
          </p>
          <p className={cn(
            "text-xs mt-0.5",
            theme === "dark" ? "text-slate-500" : "text-slate-500"
          )}>
            Advertisement • Sponsored
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={cn(
            "p-1 rounded-lg transition-colors",
            theme === "dark" 
              ? "hover:bg-slate-700 text-slate-400" 
              : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}