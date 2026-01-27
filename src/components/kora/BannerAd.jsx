import { X, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function BannerAd() {
  const [isVisible, setIsVisible] = useState(true);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  // Don't show if user has paid to remove ads, is premium, or has business membership
  if (!isVisible || user?.ads_removed || user?.subscription_tier === 'premium' || user?.account_type === 'business') return null;

  return (
    <div 
      onClick={() => navigate(createPageUrl("Upgrade"))}
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg cursor-pointer transition-all hover:shadow-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(99,196,159,0.95) 0%, rgba(99,196,159,0.85) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(99,196,159,0.3)'
      }}
    >
      <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">Remove Ads Forever</p>
            <p className="text-white/90 text-xs">Just £3.99/month</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="p-1 rounded-lg transition-colors hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}