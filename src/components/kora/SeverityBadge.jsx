import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function SeverityBadge({ severity, showLabel = false }) {
  const { theme } = useTheme();

  const getSeverityConfig = (score) => {
    if (score >= 9) return {
      label: "Critical Emergency",
      color: theme === "dark" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-red-100 border-red-500 text-red-700",
      icon: AlertTriangle,
      textColor: theme === "dark" ? "text-red-400" : "text-red-700"
    };
    if (score >= 7) return {
      label: "Urgent",
      color: theme === "dark" ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-orange-100 border-orange-500 text-orange-700",
      icon: AlertCircle,
      textColor: theme === "dark" ? "text-orange-400" : "text-orange-700"
    };
    if (score >= 5) return {
      label: "Moderate",
      color: theme === "dark" ? "bg-[#F7B600]/20 border-[#F7B600] text-[#F7B600]" : "bg-[#F7B600]/20 border-[#F7B600] text-[#F7B600]",
      icon: AlertCircle,
      textColor: "text-[#F7B600]"
    };
    return {
      label: "Minor",
      color: theme === "dark" ? "bg-[#57CFA4]/20 border-[#57CFA4] text-[#57CFA4]" : "bg-[#57CFA4]/20 border-[#57CFA4] text-[#57CFA4]",
      icon: Info,
      textColor: "text-[#57CFA4]"
    };
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border-2",
        config.color
      )}>
        <Icon className="w-4 h-4" />
        <span>Severity: {severity}/10 - {config.label}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border-2",
      config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{severity}/10</span>
    </div>
  );
}