import { AlertTriangle, AlertCircle, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";

export default function PriorityBadge({ priority, showLabel = true, showIcon = true, className }) {
  const { theme } = useTheme();

  const priorityConfig = {
    critical: {
      icon: AlertTriangle,
      label: "Critical",
      color: theme === "dark" 
        ? "bg-red-900/50 border-red-500 text-red-400"
        : "bg-red-100 border-red-500 text-red-700",
      pulseColor: "animate-pulse"
    },
    high: {
      icon: AlertCircle,
      label: "High Priority",
      color: theme === "dark"
        ? "bg-orange-900/50 border-orange-500 text-orange-400"
        : "bg-orange-100 border-orange-500 text-orange-700"
    },
    medium: {
      icon: Zap,
      label: "Medium Priority",
      color: theme === "dark"
        ? "bg-yellow-900/50 border-yellow-500 text-yellow-400"
        : "bg-yellow-100 border-yellow-600 text-yellow-700"
    },
    low: {
      icon: Info,
      label: "Low Priority",
      color: theme === "dark"
        ? "bg-blue-900/50 border-blue-500 text-blue-400"
        : "bg-blue-100 border-blue-500 text-blue-700"
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
      config.color,
      priority === "critical" && config.pulseColor,
      className
    )}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}