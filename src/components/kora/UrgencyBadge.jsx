import { cn } from "@/lib/utils";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

const urgencyConfig = {
  ignore: {
    label: "Low Urgency",
    description: "No immediate action needed",
    icon: CheckCircle,
    bgColor: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200",
    iconColor: "text-violet-500"
  },
  fix_soon: {
    label: "Medium Urgency",
    description: "Address within a few weeks",
    icon: AlertCircle,
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500"
  },
  fix_now: {
    label: "High Urgency",
    description: "Requires immediate attention",
    icon: AlertCircle,
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
    iconColor: "text-rose-500"
  }
};

export default function UrgencyBadge({ urgency, size = "default", showDescription = false }) {
  const config = urgencyConfig[urgency] || urgencyConfig.ignore;
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border",
      config.bgColor,
      config.borderColor,
      size === "small" ? "px-2.5 py-1" : "px-4 py-2"
    )}>
      <Icon className={cn(
        config.iconColor,
        size === "small" ? "w-3.5 h-3.5" : "w-4 h-4"
      )} />
      <div>
        <span className={cn(
          "font-medium",
          config.textColor,
          size === "small" ? "text-xs" : "text-sm"
        )}>
          {config.label}
        </span>
        {showDescription && (
          <p className={cn("text-xs opacity-75", config.textColor)}>
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
}