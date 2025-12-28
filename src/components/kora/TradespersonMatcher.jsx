import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Star, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Loader2,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TradespersonMatcher({ issueId }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  const findMatches = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('matchTradespeople', { issueId });
      setMatches(data);
    } catch (error) {
      console.error('Matching failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMessage = async (tradespersonId, actionType) => {
    setSelectedMatch(tradespersonId);
    setSelectedAction(actionType);
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateContactMessage', {
        issueId,
        tradespersonId,
        actionType
      });
      setGeneratedMessage(data.generated_message);
    } catch (error) {
      console.error('Message generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!generatedMessage || !selectedMatch) return;
    
    // Create conversation and send initial message
    try {
      const tradesperson = matches.matches.find(m => m.tradesperson_id === selectedMatch).tradesperson;
      
      const conversation = await base44.entities.Conversation.create({
        participant_1_id: user.id,
        participant_1_name: user.full_name,
        participant_2_id: selectedMatch,
        participant_2_name: tradesperson.name,
        last_message: generatedMessage.message.substring(0, 100),
        last_message_date: new Date().toISOString()
      });

      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: user.full_name,
        content: generatedMessage.message
      });

      // Navigate to chat
      navigate(createPageUrl(`Chat?id=${conversation.id}`));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const actionLabels = {
    request_quote: "Request Quote",
    request_visit: "Request Visit",
    emergency_call: "Emergency Contact",
    general_inquiry: "Send Inquiry"
  };

  return (
    <div className={cn(
      "rounded-2xl p-5 border",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-[#F7B600]" />
        <h3 className={cn(
          "font-semibold",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          AI-Powered Tradesperson Matching
        </h3>
      </div>

      {!matches ? (
        <div className="text-center py-8">
          <p className={cn(
            "text-sm mb-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Let AI find the best tradespeople for this job based on specialty, location, ratings, and cost-effectiveness
          </p>
          <Button
            onClick={findMatches}
            disabled={loading}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding matches...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Matches
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.overall_recommendation && (
            <div className={cn(
              "p-3 rounded-xl border text-sm",
              theme === "dark"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                : "bg-blue-50 border-blue-200 text-blue-700"
            )}>
              💡 <strong>AI Recommendation:</strong> {matches.overall_recommendation}
            </div>
          )}

          {matches.urgency_note && (
            <div className={cn(
              "p-3 rounded-xl border text-sm",
              theme === "dark"
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            )}>
              ⚠️ {matches.urgency_note}
            </div>
          )}

          <div className="space-y-3">
            {matches.matches.map((match, index) => (
              <motion.div
                key={match.tradesperson_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "rounded-xl border-2 overflow-hidden",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={cn(
                          "font-semibold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {match.tradesperson.name}
                        </h4>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-[#F7B600] text-[#0F1E2E] text-xs font-bold rounded-full">
                            🏆 Best Match
                          </span>
                        )}
                        {match.tradesperson.trust_score >= 85 && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm capitalize",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {match.tradesperson.specialty} • {match.tradesperson.years_operated}+ years
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[#F7B600] mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">
                          {match.tradesperson.rating?.toFixed(1) || "N/A"}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({match.tradesperson.total_reviews})
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-semibold",
                        match.match_score >= 85
                          ? "bg-green-500/20 text-green-400"
                          : match.match_score >= 70
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {match.match_score}% match
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className={cn(
                        "w-4 h-4",
                        match.tradesperson.proximity_score >= 70 ? "text-green-500" : "text-slate-500"
                      )} />
                      <span className={cn(
                        theme === "dark" ? "text-white" : "text-slate-700"
                      )}>
                        {match.tradesperson.location}
                      </span>
                      {match.tradesperson.proximity_score >= 90 && (
                        <span className="text-xs text-green-500">• Nearby</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className={cn(
                        "w-4 h-4",
                        theme === "dark" ? "text-[#F7B600]" : "text-yellow-600"
                      )} />
                      <span className={cn(
                        theme === "dark" ? "text-white" : "text-slate-700"
                      )}>
                        {currencySymbol}{match.tradesperson.hourly_rate}/hr
                      </span>
                    </div>
                    {match.tradesperson.emergency_service && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        🚨 Emergency
                      </span>
                    )}
                  </div>

                  {index === 0 && match.why_top_choice && (
                    <div className={cn(
                      "p-2 rounded-lg mb-2 text-xs",
                      theme === "dark"
                        ? "bg-[#F7B600]/10 border border-[#F7B600]/30 text-[#F7B600]"
                        : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                    )}>
                      <strong>Why Top Choice:</strong> {match.why_top_choice}
                    </div>
                  )}

                  <p className={cn(
                    "text-sm mb-2",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    {match.suitability_reason}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    {match.estimated_job_cost && (
                      <p className={cn(
                        "text-sm font-semibold",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        Est: {currencySymbol}{match.estimated_job_cost}
                      </p>
                    )}
                    {match.estimated_response_time && (
                      <p className="text-xs text-slate-500">
                        ⏱️ {match.estimated_response_time}
                      </p>
                    )}
                  </div>

                  {/* Expandable details */}
                  <button
                    onClick={() => setExpandedMatch(expandedMatch === match.tradesperson_id ? null : match.tradesperson_id)}
                    className={cn(
                      "flex items-center gap-2 text-sm mb-3",
                      theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                    )}
                  >
                    {expandedMatch === match.tradesperson_id ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show details
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedMatch === match.tradesperson_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 mb-3"
                      >
                        {match.pros?.length > 0 && (
                          <div>
                            <p className={cn(
                              "text-xs font-semibold mb-1",
                              theme === "dark" ? "text-green-400" : "text-green-600"
                            )}>
                              ✓ Pros:
                            </p>
                            <ul className="space-y-1">
                              {match.pros.map((pro, i) => (
                                <li key={i} className={cn(
                                  "text-xs",
                                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                                )}>
                                  • {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {match.considerations?.length > 0 && (
                          <div>
                            <p className={cn(
                              "text-xs font-semibold mb-1",
                              theme === "dark" ? "text-yellow-400" : "text-yellow-600"
                            )}>
                              ⚠ Considerations:
                            </p>
                            <ul className="space-y-1">
                              {match.considerations.map((con, i) => (
                                <li key={i} className={cn(
                                  "text-xs",
                                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                                )}>
                                  • {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  {selectedMatch === match.tradesperson_id && generatedMessage ? (
                    <div className={cn(
                      "p-3 rounded-lg border mt-3",
                      theme === "dark"
                        ? "bg-[#1A2F42] border-[#57CFA4]/30"
                        : "bg-slate-50 border-slate-200"
                    )}>
                      <p className={cn(
                        "text-xs font-semibold mb-2",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        AI-Generated Message:
                      </p>
                      <p className={cn(
                        "text-sm mb-3",
                        theme === "dark" ? "text-white" : "text-slate-700"
                      )}>
                        {generatedMessage.message}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={sendMessage}
                          className="flex-1 bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedMatch(null);
                            setGeneratedMessage(null);
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => generateMessage(match.tradesperson_id, match.recommended_action || 'request_quote')}
                        disabled={loading}
                        className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                      >
                        {loading && selectedMatch === match.tradesperson_id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {actionLabels[match.recommended_action] || "Contact"}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setMatches(null)}
            className="w-full"
          >
            Find Different Matches
          </Button>
        </div>
      )}
    </div>
  );
}