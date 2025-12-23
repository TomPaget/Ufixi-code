import { Shield, MessageCircle, Clock, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ReputationBreakdown({ tradespersonId }) {
  const { theme } = useTheme();

  const { data: breakdown, isLoading } = useQuery({
    queryKey: ["trustBreakdown", tradespersonId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('calculateTrustScore', { 
        tradespersonId 
      });
      return data;
    },
    enabled: !!tradespersonId
  });

  if (isLoading || !breakdown) return null;

  const metrics = [
    {
      icon: Star,
      label: "Reviews",
      score: breakdown.breakdown.reviews.score,
      weight: breakdown.breakdown.reviews.weight,
      detail: `${breakdown.breakdown.reviews.count} reviews`
    },
    {
      icon: MessageCircle,
      label: "Professionalism",
      score: breakdown.breakdown.professionalism.score,
      weight: breakdown.breakdown.professionalism.weight,
      detail: "AI-analyzed communication"
    },
    {
      icon: Clock,
      label: "Responsiveness",
      score: breakdown.breakdown.responsiveness.score,
      weight: breakdown.breakdown.responsiveness.weight,
      detail: `Avg: ${breakdown.breakdown.responsiveness.avgResponseTime}`
    },
    {
      icon: CheckCircle2,
      label: "Reliability",
      score: breakdown.breakdown.reliability.score,
      weight: breakdown.breakdown.reliability.weight,
      detail: `${breakdown.breakdown.reliability.completionRate} completion rate`
    },
    {
      icon: TrendingUp,
      label: "Communication",
      score: breakdown.breakdown.communication.score,
      weight: breakdown.breakdown.communication.weight,
      detail: "Message quality"
    }
  ];

  return (
    <div className={cn(
      "rounded-2xl p-5 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[#F7B600]" />
        <h3 className={cn(
          "font-semibold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Reputation Breakdown
        </h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const getColor = (score) => {
            if (score >= 85) return "text-green-500";
            if (score >= 70) return "text-blue-500";
            if (score >= 55) return "text-yellow-500";
            return "text-slate-400";
          };

          return (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#57CFA4]" />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {metric.label}
                  </span>
                  <span className={cn(
                    "text-xs",
                    theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
                  )}>
                    ({metric.weight})
                  </span>
                </div>
                <span className={cn("text-sm font-bold", getColor(metric.score))}>
                  {metric.score}/100
                </span>
              </div>
              
              {/* Progress bar */}
              <div className={cn(
                "w-full h-2 rounded-full overflow-hidden",
                theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-100"
              )}>
                <div
                  className={cn("h-full transition-all", getColor(metric.score).replace('text-', 'bg-'))}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
              )}>
                {metric.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "mt-4 pt-4 border-t",
        theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
      )}>
        <p className={cn(
          "text-xs",
          theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
        )}>
          Trust Score is calculated using AI analysis of reviews, communication logs, response times, and job completion rates.
        </p>
      </div>
    </div>
  );
}