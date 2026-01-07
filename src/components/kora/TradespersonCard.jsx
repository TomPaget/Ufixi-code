import { useState } from "react";
import { Star, MapPin, MessageCircle, CheckCircle2, Award, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import TrustScoreBadge from "./TrustScoreBadge";
import VideoConsultationScheduler from "./VideoConsultationScheduler";

const specialtyColors = {
  plumbing: "bg-blue-500",
  electrical: "bg-yellow-500",
  hvac: "bg-purple-500",
  carpentry: "bg-amber-600",
  roofing: "bg-slate-600",
  painting: "bg-pink-500",
  general: "bg-green-500"
};

export default function TradespersonCard({ tradesperson, issueId }) {
  const { theme } = useTheme();
  const [showVideoScheduler, setShowVideoScheduler] = useState(false);

  const rating = tradesperson.average_rating || 4.5;
  const reviewCount = tradesperson.total_reviews || 12;
  const responseTime = tradesperson.avg_response_time || "2 hours";
  const availability = tradesperson.availability_status || "available";

  return (
    <>
      <div className={cn(
        "rounded-2xl p-5 border transition-all hover:shadow-lg",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <div className="flex gap-4">
          {/* Avatar */}
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0",
            specialtyColors[tradesperson.primary_specialty] || "bg-slate-500",
            "text-white"
          )}>
            {tradesperson.full_name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-semibold truncate",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {tradesperson.business_name || tradesperson.full_name}
                </h3>
                {tradesperson.verified && (
                  <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Professional
                  </div>
                )}
              </div>

              {/* Trust Score */}
              {tradesperson.trust_score && (
                <TrustScoreBadge score={tradesperson.trust_score} size="sm" showLabel={false} />
              )}
            </div>

            {/* Availability */}
            {availability && (
              <Badge
                variant={availability === "available" ? "default" : "secondary"}
                className={cn(
                  "text-xs mb-2",
                  availability === "available" ? "bg-green-500" : "bg-slate-400"
                )}
              >
                {availability === "available" ? "Available" : "Busy"}
              </Badge>
            )}

            {/* Specialty & Location */}
            <div className="space-y-1 mb-3">
              <p className={cn(
                "text-sm capitalize",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                {tradesperson.primary_specialty} Specialist
              </p>
              {tradesperson.service_area && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                )}>
                  <MapPin className="w-3 h-3" />
                  {tradesperson.service_area}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className={cn(
                  "text-sm font-semibold",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>
                  {rating.toFixed(1)}
                </span>
                <span className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                )}>
                  ({reviewCount})
                </span>
              </div>

              <div className={cn(
                "flex items-center gap-1 text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                <Clock className="w-3 h-3" />
                Responds in {responseTime}
              </div>
            </div>

            {/* Experience */}
            {tradesperson.years_in_business && (
              <div className={cn(
                "flex items-center gap-1 text-xs mb-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                <Award className="w-3 h-3" />
                {tradesperson.years_in_business} years experience
              </div>
            )}

            {/* Rate */}
            {tradesperson.hourly_rate && (
              <p className={cn(
                "text-sm font-semibold mb-3",
                theme === "dark" ? "text-[#F7B600]" : "text-[#1E3A57]"
              )}>
                £{tradesperson.hourly_rate}/hour
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowVideoScheduler(true)}
                className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] h-9 text-sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Button>
              <Button
                variant="outline"
                className="h-9 px-3"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <VideoConsultationScheduler
        isOpen={showVideoScheduler}
        onClose={() => setShowVideoScheduler(false)}
        tradespersonId={tradesperson.id}
        tradespersonName={tradesperson.business_name || tradesperson.full_name}
        issueId={issueId}
      />
    </>
  );
}