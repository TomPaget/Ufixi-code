import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, MapPin, Users } from "lucide-react";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function RegionalCostBenchmark({ category, tradeType, userLocation }) {
  const { theme } = useTheme();

  const { data: regionalData, isLoading } = useQuery({
    queryKey: ["regionalCosts", category, tradeType, userLocation],
    queryFn: async () => {
      // Get all resolved issues with actual costs in the same category
      const issues = await base44.entities.Issue.filter({
        status: "resolved",
        trade_type: tradeType
      });

      // Filter by issues with actual costs
      const withCosts = issues.filter(i => 
        (i.actual_diy_cost || i.actual_professional_cost) && i.user_location
      );

      if (withCosts.length === 0) return null;

      // Calculate averages
      const diyIssues = withCosts.filter(i => i.actual_diy_cost);
      const proIssues = withCosts.filter(i => i.actual_professional_cost);

      const avgDiy = diyIssues.length > 0
        ? diyIssues.reduce((sum, i) => sum + i.actual_diy_cost, 0) / diyIssues.length
        : null;

      const avgPro = proIssues.length > 0
        ? proIssues.reduce((sum, i) => sum + i.actual_professional_cost, 0) / proIssues.length
        : null;

      // Calculate regional (same location) averages
      const sameLocation = withCosts.filter(i => 
        i.user_location?.toLowerCase().includes(userLocation?.toLowerCase())
      );

      const regionalDiyIssues = sameLocation.filter(i => i.actual_diy_cost);
      const regionalProIssues = sameLocation.filter(i => i.actual_professional_cost);

      const regionalAvgDiy = regionalDiyIssues.length > 0
        ? regionalDiyIssues.reduce((sum, i) => sum + i.actual_diy_cost, 0) / regionalDiyIssues.length
        : null;

      const regionalAvgPro = regionalProIssues.length > 0
        ? regionalProIssues.reduce((sum, i) => sum + i.actual_professional_cost, 0) / regionalProIssues.length
        : null;

      return {
        avgDiy,
        avgPro,
        regionalAvgDiy,
        regionalAvgPro,
        totalDiyReports: diyIssues.length,
        totalProReports: proIssues.length,
        regionalDiyReports: regionalDiyIssues.length,
        regionalProReports: regionalProIssues.length
      };
    },
    enabled: !!category || !!tradeType
  });

  if (isLoading || !regionalData) return null;

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  return (
    <div className={cn(
      "rounded-2xl p-5 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#F7B600]" />
        <h3 className={cn(
          "font-semibold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Real-World Cost Data
        </h3>
      </div>

      <p className={cn(
        "text-sm mb-4",
        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
      )}>
        Based on actual costs submitted by QuoFix users
      </p>

      <div className="space-y-4">
        {/* Regional Averages */}
        {(regionalData.regionalAvgDiy || regionalData.regionalAvgPro) && (
          <div className={cn(
            "rounded-xl p-4 border",
            theme === "dark"
              ? "bg-[#57CFA4]/10 border-[#57CFA4]/30"
              : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#57CFA4]" />
              <h4 className={cn(
                "font-semibold text-sm",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                In Your Area
              </h4>
            </div>
            
            <div className="space-y-2">
              {regionalData.regionalAvgDiy && (
                <div className="flex justify-between">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    DIY Average:
                  </span>
                  <span className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{Math.round(regionalData.regionalAvgDiy)}
                  </span>
                </div>
              )}
              {regionalData.regionalAvgPro && (
                <div className="flex justify-between">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    Professional Average:
                  </span>
                  <span className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{Math.round(regionalData.regionalAvgPro)}
                  </span>
                </div>
              )}
              <p className={cn(
                "text-xs mt-2",
                theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
              )}>
                Based on {regionalData.regionalDiyReports + regionalData.regionalProReports} reports in your area
              </p>
            </div>
          </div>
        )}

        {/* National Averages */}
        {(regionalData.avgDiy || regionalData.avgPro) && (
          <div className={cn(
            "rounded-xl p-4",
            theme === "dark"
              ? "bg-[#0F1E2E]"
              : "bg-slate-50"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#F7B600]" />
              <h4 className={cn(
                "font-semibold text-sm",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                National Average
              </h4>
            </div>
            
            <div className="space-y-2">
              {regionalData.avgDiy && (
                <div className="flex justify-between">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    DIY:
                  </span>
                  <span className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{Math.round(regionalData.avgDiy)}
                  </span>
                </div>
              )}
              {regionalData.avgPro && (
                <div className="flex justify-between">
                  <span className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    Professional:
                  </span>
                  <span className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{Math.round(regionalData.avgPro)}
                  </span>
                </div>
              )}
              <p className={cn(
                "text-xs mt-2",
                theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
              )}>
                Based on {regionalData.totalDiyReports + regionalData.totalProReports} reports nationwide
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}