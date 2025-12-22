import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, Calendar, TrendingUp, Lightbulb } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function MaintenanceInsights() {
  const { theme } = useTheme();
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.functions.invoke('predictiveMaintenance', {});
      
      // Find insights for current user
      const userInsights = result.predictions?.find(p => p.user_id === user.id);
      setInsights(userInsights);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return AlertTriangle;
      case 'high': return TrendingUp;
      default: return Lightbulb;
    }
  };

  return (
    <div className={cn(
      "rounded-2xl p-5 border",
      theme === "dark"
        ? "bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30"
        : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className={cn(
            "font-semibold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            AI Maintenance Insights
          </h3>
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Scan Property"
          )}
        </Button>
      </div>

      <p className={cn(
        "text-sm mb-4",
        theme === "dark" ? "text-purple-300" : "text-purple-700"
      )}>
        AI analyzes your property history to predict maintenance needs before they become urgent
      </p>

      {insights && insights.predictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {insights.predictions.map((pred, i) => {
            const Icon = getPriorityIcon(pred.priority);
            
            return (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-xl border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-purple-500/20"
                    : "bg-white border-purple-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    getPriorityColor(pred.priority)
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={cn(
                        "font-semibold text-sm",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        {pred.title}
                      </h4>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full capitalize",
                        getPriorityColor(pred.priority)
                      )}>
                        {pred.priority}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mb-2",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {pred.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      {pred.recommended_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          <span className={cn(
                            theme === "dark" ? "text-white" : "text-slate-700"
                          )}>
                            {new Date(pred.recommended_date).toLocaleDateString('en-GB', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                      {pred.cost_estimate && (
                        <span className={cn(
                          "text-purple-600 font-medium",
                          theme === "dark" && "text-purple-400"
                        )}>
                          {pred.cost_estimate}
                        </span>
                      )}
                      {pred.trade_needed && (
                        <span className={cn(
                          "capitalize",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          {pred.trade_needed}
                        </span>
                      )}
                    </div>
                    {pred.consequence && (
                      <p className={cn(
                        "text-xs mt-2 italic",
                        theme === "dark" ? "text-red-400" : "text-red-600"
                      )}>
                        ⚠️ {pred.consequence}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {insights && insights.predictions.length === 0 && (
        <div className="text-center py-4">
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-purple-300" : "text-purple-600"
          )}>
            ✨ Great news! No urgent maintenance predicted based on your history.
          </p>
        </div>
      )}
    </div>
  );
}