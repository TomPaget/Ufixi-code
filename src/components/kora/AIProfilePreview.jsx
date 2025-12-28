import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { Star, MapPin, Briefcase, CheckCircle2, Sparkles } from "lucide-react";

export default function AIProfilePreview({ profile, businessName, location, yearsOperated, specialties }) {
  const { theme } = useTheme();

  if (!profile) return null;

  return (
    <div className={cn(
      "rounded-2xl border p-5",
      theme === "dark"
        ? "bg-gradient-to-br from-[#1A2F42] to-[#0F1E2E] border-[#57CFA4]/30"
        : "bg-gradient-to-br from-white to-slate-50 border-slate-200"
    )}>
      <div className="flex items-start gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#F7B600]" />
        <h4 className={cn(
          "font-semibold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          AI-Generated Profile Preview
        </h4>
      </div>

      {/* Header */}
      <div className="mb-4 pb-4 border-b border-slate-700/30">
        <h3 className={cn(
          "text-xl font-bold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          {businessName}
        </h3>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#57CFA4]" />
            <span className={theme === "dark" ? "text-slate-300" : "text-slate-600"}>
              {location}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4 text-[#F7B600]" />
            <span className={theme === "dark" ? "text-slate-300" : "text-slate-600"}>
              {yearsOperated}+ years
            </span>
          </div>
        </div>
        <p className={cn(
          "text-sm mt-2 italic",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          {profile.professional_summary}
        </p>
      </div>

      {/* Bio */}
      <div className="mb-4">
        <p className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          theme === "dark" ? "text-slate-300" : "text-slate-700"
        )}>
          {profile.professional_bio}
        </p>
      </div>

      {/* Service Highlights */}
      <div className="mb-4">
        <h5 className={cn(
          "text-sm font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Services & Expertise:
        </h5>
        <div className="space-y-1">
          {profile.service_highlights?.map((highlight, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#57CFA4] flex-shrink-0 mt-0.5" />
              <span className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              )}>
                {highlight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      {profile.suggested_hourly_rate_min && (
        <div className={cn(
          "rounded-lg p-3 border text-sm",
          theme === "dark"
            ? "bg-[#0F1E2E] border-[#F7B600]/30"
            : "bg-yellow-50 border-yellow-200"
        )}>
          <span className={cn(
            "font-semibold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Suggested Rate:
          </span>
          <span className={cn(
            "ml-2",
            theme === "dark" ? "text-[#F7B600]" : "text-yellow-700"
          )}>
            £{profile.suggested_hourly_rate_min}-£{profile.suggested_hourly_rate_max}/hour
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Based on {specialties.join(', ')} in {location}
          </p>
        </div>
      )}
    </div>
  );
}