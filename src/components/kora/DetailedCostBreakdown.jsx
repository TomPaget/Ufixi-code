import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";
import { 
  DollarSign, 
  Wrench, 
  Users, 
  TrendingDown, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

export default function DetailedCostBreakdown({ issueId }) {
  const { theme } = useTheme();
  const [showDIYDetails, setShowDIYDetails] = useState(false);
  const [showProDetails, setShowProDetails] = useState(false);

  const { data: costData, isLoading, error } = useQuery({
    queryKey: ["detailed-costs", issueId],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('calculateDetailedCosts', { issueId });
      return data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl border p-6",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#F7B600]" />
          <span className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Analyzing costs with AI...
          </span>
        </div>
      </div>
    );
  }

  if (error || !costData?.success) {
    return null;
  }

  const { 
    currency_symbol, 
    location, 
    regional_multiplier,
    diy_breakdown, 
    professional_breakdown, 
    optimal_recommendation,
    cost_comparison
  } = costData;

  const RecommendationBadge = () => {
    const config = {
      diy: { color: "bg-green-500", label: "DIY Recommended", icon: Wrench },
      professional: { color: "bg-blue-500", label: "Professional Recommended", icon: Users },
      hybrid: { color: "bg-purple-500", label: "Hybrid Approach", icon: Lightbulb }
    };
    const { color, label, icon: Icon } = config[optimal_recommendation.choice] || config.diy;

    return (
      <div className={`${color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Optimal Recommendation Banner */}
      <div className={cn(
        "rounded-2xl border-2 p-5",
        theme === "dark"
          ? "bg-gradient-to-br from-[#1A2F42] to-[#0F1E2E] border-[#F7B600]"
          : "bg-gradient-to-br from-white to-slate-50 border-[#F7B600]"
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#F7B600]" />
            <h3 className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              AI Cost Recommendation
            </h3>
          </div>
          <RecommendationBadge />
        </div>
        
        <p className={cn(
          "text-sm mb-3",
          theme === "dark" ? "text-slate-300" : "text-slate-700"
        )}>
          {optimal_recommendation.reasoning}
        </p>

        {optimal_recommendation.cost_savings > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500" />
            <span className={cn(
              "font-semibold",
              theme === "dark" ? "text-green-400" : "text-green-700"
            )}>
              Potential savings: {currency_symbol}{optimal_recommendation.cost_savings.toFixed(0)}
            </span>
          </div>
        )}

        {optimal_recommendation.money_saving_tips?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F7B600]/30">
            <p className={cn(
              "text-xs font-semibold mb-2",
              theme === "dark" ? "text-[#F7B600]" : "text-[#1E3A57]"
            )}>
              💡 Money-Saving Tips:
            </p>
            <ul className="space-y-1">
              {optimal_recommendation.money_saving_tips.map((tip, i) => (
                <li key={i} className={cn(
                  "text-xs flex items-start gap-2",
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                )}>
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* DIY Card */}
        <button
          onClick={() => setShowDIYDetails(!showDIYDetails)}
          className={cn(
            "rounded-2xl border-2 p-4 text-left transition-all",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/30 hover:border-[#57CFA4]"
              : "bg-white border-slate-200 hover:border-[#57CFA4]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Wrench className="w-5 h-5 text-[#57CFA4]" />
            {showDIYDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <p className={cn(
            "text-xs mb-1",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            DIY Cost
          </p>
          <p className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            {currency_symbol}{diy_breakdown.total_min}-{currency_symbol}{diy_breakdown.total_max}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{diy_breakdown.time_hours}h
          </p>
        </button>

        {/* Professional Card */}
        <button
          onClick={() => setShowProDetails(!showProDetails)}
          className={cn(
            "rounded-2xl border-2 p-4 text-left transition-all",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#F7B600]/30 hover:border-[#F7B600]"
              : "bg-white border-slate-200 hover:border-[#F7B600]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-[#F7B600]" />
            {showProDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <p className={cn(
            "text-xs mb-1",
            theme === "dark" ? "text-[#F7B600]" : "text-slate-600"
          )}>
            Professional Cost
          </p>
          <p className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            {currency_symbol}{professional_breakdown.total_min}-{currency_symbol}{professional_breakdown.total_max}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            inc. VAT & labor
          </p>
        </button>
      </div>

      {/* DIY Detailed Breakdown */}
      {showDIYDetails && (
        <div className={cn(
          "rounded-2xl border p-4",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h4 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Wrench className="w-4 h-4 text-[#57CFA4]" />
            DIY Breakdown
          </h4>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold mb-2 text-[#57CFA4]">Materials:</p>
              {diy_breakdown.materials?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm mb-1">
                  <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                    {item.item}
                  </span>
                  <span className={cn(
                    "font-medium",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currency_symbol}{item.cost_min}-{currency_symbol}{item.cost_max}
                  </span>
                </div>
              ))}
            </div>

            {diy_breakdown.tools?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-[#57CFA4]">Tools Needed:</p>
                {diy_breakdown.tools.map((tool, i) => (
                  <div key={i} className="flex justify-between text-sm mb-1">
                    <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                      {tool.tool}
                    </span>
                    <span className={cn(
                      "font-medium",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {tool.rental_option 
                        ? `${currency_symbol}${tool.rental_cost} rent`
                        : `${currency_symbol}${tool.cost}`
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={cn(
              "pt-3 border-t",
              theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
            )}>
              <p className="text-xs text-slate-500">Difficulty: {diy_breakdown.difficulty_level}</p>
              <p className="text-xs text-slate-500">Time needed: ~{diy_breakdown.time_hours} hours</p>
            </div>
          </div>
        </div>
      )}

      {/* Professional Detailed Breakdown */}
      {showProDetails && (
        <div className={cn(
          "rounded-2xl border p-4",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#F7B600]/20"
            : "bg-white border-slate-200"
        )}>
          <h4 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Users className="w-4 h-4 text-[#F7B600]" />
            Professional Breakdown
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                Labor ({professional_breakdown.labor_hours}h)
              </span>
              <span className={cn(
                "font-medium",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {currency_symbol}{professional_breakdown.labor_cost_min}-{currency_symbol}{professional_breakdown.labor_cost_max}
              </span>
            </div>

            {professional_breakdown.callout_fee > 0 && (
              <div className="flex justify-between">
                <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                  Callout Fee
                </span>
                <span className={cn(
                  "font-medium",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {currency_symbol}{professional_breakdown.callout_fee}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                Materials (inc. markup)
              </span>
              <span className={cn(
                "font-medium",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {currency_symbol}{professional_breakdown.materials_cost_min}-{currency_symbol}{professional_breakdown.materials_cost_max}
              </span>
            </div>

            {professional_breakdown.tax_vat > 0 && (
              <div className="flex justify-between">
                <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>
                  VAT (20%)
                </span>
                <span className={cn(
                  "font-medium",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {currency_symbol}{professional_breakdown.tax_vat}
                </span>
              </div>
            )}

            <div className={cn(
              "pt-2 mt-2 border-t",
              theme === "dark" ? "border-[#F7B600]/20" : "border-slate-200"
            )}>
              <p className="text-xs text-slate-500">
                Typical completion: {professional_breakdown.typical_duration_days} day(s)
              </p>
              <p className="text-xs text-slate-500">
                Location: {location} ({regional_multiplier}x multiplier)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Savings Comparison */}
      {cost_comparison && (
        <div className={cn(
          "rounded-xl border p-3 text-sm",
          theme === "dark"
            ? "bg-green-900/20 border-green-500/30"
            : "bg-green-50 border-green-200"
        )}>
          <p className={cn(
            "font-semibold mb-1",
            theme === "dark" ? "text-green-400" : "text-green-700"
          )}>
            💰 DIY could save you {cost_comparison.diy_vs_pro_savings_percent?.toFixed(0)}%
          </p>
          {cost_comparison.hidden_costs_warning && (
            <p className="text-xs text-slate-500">
              ⚠️ {cost_comparison.hidden_costs_warning}
            </p>
          )}
        </div>
      )}

      {/* Risk Factors */}
      {optimal_recommendation.risk_factors?.length > 0 && (
        <div className={cn(
          "rounded-xl border p-3",
          theme === "dark"
            ? "bg-orange-900/20 border-orange-500/30"
            : "bg-orange-50 border-orange-200"
        )}>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className={cn(
                "font-semibold mb-1",
                theme === "dark" ? "text-orange-400" : "text-orange-700"
              )}>
                Consider These Risks:
              </p>
              <ul className="space-y-1">
                {optimal_recommendation.risk_factors.map((risk, i) => (
                  <li key={i} className="text-xs text-slate-600">• {risk}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}