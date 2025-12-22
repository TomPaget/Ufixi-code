import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, DollarSign, Award, Loader2, MessageCircle } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecommendedTradespeople({ jobDetails }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('matchTradespeople', {
        jobDetails
      });
      setMatches(result.data.matches || []);
    } catch (error) {
      console.error("Matching failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[user?.currency || "GBP"];

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30"
        : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className={cn(
            "font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            AI Recommended Tradespeople
          </h3>
        </div>
        {!matches && (
          <Button
            onClick={handleFindMatches}
            disabled={loading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        )}
      </div>

      <p className={cn(
        "text-sm mb-4",
        theme === "dark" ? "text-purple-300" : "text-purple-700"
      )}>
        AI analyzes specialty, location, budget, availability, and reviews to find your perfect tradesperson
      </p>

      {matches && matches.length === 0 && (
        <div className="text-center py-8">
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-purple-300" : "text-purple-600"
          )}>
            No matching tradespeople found. Try adjusting your job requirements.
          </p>
        </div>
      )}

      {matches && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <motion.div
              key={match.tradesperson_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "rounded-xl p-4 border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-purple-500/20"
                  : "bg-white border-purple-200"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-semibold",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {match.tradesperson_name}
                    </h4>
                    <Badge className={cn(
                      "text-xs px-2 py-0.5 border",
                      getMatchColor(match.match_score)
                    )}>
                      {match.match_score}% Match
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs mb-2">
                    {match.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#F7B600] text-[#F7B600]" />
                        <span className={cn(
                          "font-medium",
                          theme === "dark" ? "text-white" : "text-slate-700"
                        )}>
                          {match.rating.toFixed(1)}
                        </span>
                        <span className={cn(
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                        )}>
                          ({match.review_count})
                        </span>
                      </div>
                    )}
                    {match.distance_miles && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span className={cn(
                          theme === "dark" ? "text-white" : "text-slate-700"
                        )}>
                          {match.distance_miles.toFixed(1)} mi
                        </span>
                      </div>
                    )}
                    {match.years_experience && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-500" />
                        <span className={cn(
                          theme === "dark" ? "text-white" : "text-slate-700"
                        )}>
                          {match.years_experience} yrs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className={cn(
                "text-xs mb-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                {match.recommendation_reason}
              </p>

              <div className="flex items-center justify-between">
                {match.estimated_hourly_rate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-[#F7B600]" />
                    <span className={cn(
                      "text-sm font-semibold",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}>
                      {currencySymbol}{match.estimated_hourly_rate}/hr
                    </span>
                    <Badge className={cn(
                      "text-xs ml-2",
                      match.price_compatibility === "in_budget" 
                        ? "bg-green-100 text-green-700"
                        : match.price_compatibility === "under_budget"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {match.price_compatibility?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={async () => {
                    const conversation = await base44.entities.Conversation.create({
                      participant_1_id: user.id,
                      participant_1_name: user.full_name,
                      participant_2_id: match.tradesperson_id,
                      participant_2_name: match.tradesperson_name,
                      last_message_date: new Date().toISOString()
                    });
                    navigate(createPageUrl(`Chat?id=${conversation.id}`));
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Contact
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}