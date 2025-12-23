import { Shield, TrendingUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TrustScoreBadge({ score, size = "md", showLabel = true }) {
  if (!score) return null;

  const getScoreColor = (score) => {
    if (score >= 85) return { bg: "bg-green-500", text: "text-green-500", label: "Excellent" };
    if (score >= 70) return { bg: "bg-blue-500", text: "text-blue-500", label: "Very Good" };
    if (score >= 55) return { bg: "bg-yellow-500", text: "text-yellow-500", label: "Good" };
    return { bg: "bg-slate-400", text: "text-slate-400", label: "Fair" };
  };

  const colors = getScoreColor(score);
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Circular progress */}
        <svg className={sizeClasses[size]} viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            className={colors.text}
          />
        </svg>
        
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", colors.text)}>
            {score}
          </span>
        </div>
      </div>

      {showLabel && (
        <div>
          <div className="flex items-center gap-1">
            <Shield className={cn("w-3 h-3", colors.text)} />
            <span className="text-xs font-semibold text-slate-700">Trust Score</span>
          </div>
          <Badge variant="outline" className={cn("text-xs mt-0.5", colors.text)}>
            {colors.label}
          </Badge>
        </div>
      )}
    </div>
  );
}