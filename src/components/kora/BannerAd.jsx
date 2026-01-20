import { X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function BannerAd() {
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();

  if (!isVisible) return null;

  return (
    <div className="bg-[#faffeb] text-slate-800 fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg border-slate-700">





      <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-slate-800 text-xs font-medium">🔧 Need a trusted pro? Find local contractors




          </p>
          <p className="text-slate-700 mt-0.5 text-xs">Advertisement • Sponsored




          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className={cn(
            "p-1 rounded-lg transition-colors",
            theme === "dark" ?
            "hover:bg-slate-700 text-slate-400" :
            "hover:bg-slate-100 text-slate-500"
          )}>

          <X className="w-4 h-4" />
        </button>
      </div>
    </div>);

}