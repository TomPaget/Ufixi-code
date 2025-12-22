import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Clock,
  DollarSign
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function MaintenanceAlerts({ userId }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["maintenanceAlerts", userId],
    queryFn: () => base44.entities.MaintenanceAlert.filter({
      user_id: userId || "{{user.id}}",
      status: "pending"
    }),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateMaintenanceAlerts', {
        userId: userId || user.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["maintenanceAlerts"]);
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ alertId, status }) => 
      base44.entities.MaintenanceAlert.update(alertId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["maintenanceAlerts"]);
    }
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateAlertsMutation.mutateAsync();
    } finally {
      setGenerating(false);
    }
  };

  const urgencyColors = {
    low: "bg-blue-100 text-blue-700 border-blue-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    high: "bg-red-100 text-red-700 border-red-200"
  };

  const typeIcons = {
    preventative: CheckCircle2,
    seasonal: Calendar,
    pattern_based: TrendingUp,
    age_based: Clock
  };

  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[user?.currency || "GBP"];

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-2xl p-6 border text-center",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#57CFA4]" />
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#F7B600]" />
          <h2 className={cn(
            "font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Predicted Maintenance
          </h2>
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
        >
          {generating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Scan
            </>
          )}
        </Button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
            theme === "dark" ? "bg-[#57CFA4]/20" : "bg-slate-100"
          )}>
            <CheckCircle2 className="w-6 h-6 text-[#57CFA4]" />
          </div>
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            No maintenance predictions yet
          </p>
          <p className={cn(
            "text-xs mt-1",
            theme === "dark" ? "text-white/60" : "text-slate-500"
          )}>
            Click "Scan" to generate AI predictions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts
            .sort((a, b) => {
              const urgencyOrder = { high: 3, medium: 2, low: 1 };
              return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
            })
            .map((alert, i) => {
              const TypeIcon = typeIcons[alert.alert_type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-xl p-4 border",
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      theme === "dark" ? "bg-[#F7B600]/20" : "bg-[#F7B600]/10"
                    )}>
                      <TypeIcon className="w-4 h-4 text-[#F7B600]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {alert.title}
                        </h3>
                        <Badge className={cn(
                          "text-xs px-2 py-0.5 border",
                          urgencyColors[alert.urgency]
                        )}>
                          {alert.urgency}
                        </Badge>
                      </div>

                      <p className={cn(
                        "text-xs mb-3",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {alert.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#57CFA4]" />
                          <span className={cn(
                            theme === "dark" ? "text-white" : "text-slate-700"
                          )}>
                            {alert.estimated_date || "Soon"}
                          </span>
                        </div>
                        {(alert.predicted_cost_min || alert.predicted_cost_max) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-[#F7B600]" />
                            <span className={cn(
                              theme === "dark" ? "text-white" : "text-slate-700"
                            )}>
                              {currencySymbol}{alert.predicted_cost_min || 0}-{currencySymbol}{alert.predicted_cost_max || 0}
                            </span>
                          </div>
                        )}
                        {alert.ai_confidence && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span className={cn(
                              "text-xs",
                              theme === "dark" ? "text-white/70" : "text-slate-600"
                            )}>
                              {alert.ai_confidence}% confidence
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        "text-xs p-2 rounded-lg mb-3",
                        theme === "dark"
                          ? "bg-[#57CFA4]/10 text-[#57CFA4]"
                          : "bg-blue-50 text-blue-700"
                      )}>
                        <span className="font-medium">Action: </span>
                        {alert.recommended_action}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAlertMutation.mutate({
                            alertId: alert.id,
                            status: "scheduled"
                          })}
                          className="flex-1 text-xs h-8"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateAlertMutation.mutate({
                            alertId: alert.id,
                            status: "dismissed"
                          })}
                          className="text-xs h-8"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      <p className={cn(
        "text-xs mt-4 text-center",
        theme === "dark" ? "text-white/50" : "text-slate-400"
      )}>
        AI predictions based on your history and seasonal patterns
      </p>
    </div>
  );
}