import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, Droplets, Zap, Thermometer, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

const alertIcons = {
  water_leak: Droplets,
  high_energy_consumption: Zap,
  temperature_spike: Thermometer,
  humidity_spike: Droplets,
  smoke_detected: AlertTriangle,
  co_detected: AlertTriangle
};

const severityColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500"
};

export default function SmartHomeAlertCard({ alert }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const Icon = alertIcons[alert.alert_type] || AlertTriangle;

  const dismissMutation = useMutation({
    mutationFn: () => base44.entities.SmartHomeAlert.update(alert.id, { status: "dismissed" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["smartHomeAlerts"]);
    }
  });

  const investigateMutation = useMutation({
    mutationFn: async () => {
      // Create an Issue from the alert
      const issue = await base44.entities.Issue.create({
        title: `${alert.device_name}: ${alert.alert_type.replace(/_/g, " ")}`,
        explanation: alert.description || `Smart home device detected: ${alert.alert_type.replace(/_/g, " ")}`,
        urgency: alert.severity === "critical" ? "fix_now" : alert.severity === "high" ? "fix_soon" : "ignore",
        severity_score: alert.severity === "critical" ? 9 : alert.severity === "high" ? 7 : alert.severity === "medium" ? 5 : 3,
        status: "active",
        trade_type: alert.alert_type.includes("water") ? "plumbing" : 
                    alert.alert_type.includes("energy") ? "electrical" : "other"
      });

      // Update alert with issue link
      await base44.entities.SmartHomeAlert.update(alert.id, {
        status: "investigating",
        auto_created_issue_id: issue.id
      });

      return issue;
    },
    onSuccess: (issue) => {
      queryClient.invalidateQueries(["smartHomeAlerts"]);
      navigate(createPageUrl(`IssueDetail?id=${issue.id}`));
    }
  });

  return (
    <div className={cn(
      "rounded-2xl p-4 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-red-500/30"
        : "bg-red-50 border-red-200"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          severityColors[alert.severity],
          "text-white flex-shrink-0"
        )}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-red-900"
            )}>
              {alert.device_name}
            </h4>
            <Badge className={cn(severityColors[alert.severity], "text-white text-xs")}>
              {alert.severity}
            </Badge>
          </div>

          <p className={cn(
            "text-sm mb-3",
            theme === "dark" ? "text-red-200" : "text-red-800"
          )}>
            {alert.description || alert.alert_type.replace(/_/g, " ")}
          </p>

          {alert.reading_value && alert.threshold_value && (
            <p className={cn(
              "text-xs mb-3",
              theme === "dark" ? "text-red-300" : "text-red-700"
            )}>
              Reading: {alert.reading_value} (Threshold: {alert.threshold_value})
            </p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => investigateMutation.mutate()}
              disabled={investigateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {investigateMutation.isPending ? "Creating..." : "Investigate"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissMutation.mutate()}
              disabled={dismissMutation.isPending}
              className="h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}