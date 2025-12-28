import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, Lightbulb, Wrench, AlertCircle, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIResolutionAssistant({ issue, onSuggestionsGenerated }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert repair diagnostician analyzing this home maintenance issue to provide resolution guidance.

ISSUE DETAILS:
Title: ${issue.title}
Explanation: ${issue.explanation}
Category: ${issue.trade_type || 'general'}
Urgency: ${issue.urgency}
Severity: ${issue.severity_score}/10
Status: ${issue.status}

${issue.sentiment_analysis ? `User Emotional State: ${issue.sentiment_analysis.emotional_state}` : ''}
${issue.historical_insights ? `Similar Cases: ${issue.historical_insights.similar_cases_count} analyzed` : ''}

TASK: Provide comprehensive resolution guidance including:

1. POTENTIAL ROOT CAUSES (3-5 specific causes)
   - Most likely cause first
   - Include technical reasoning
   - Consider property age and environmental factors

2. DIY REPAIR STEPS (if safe)
   - 5-8 clear, actionable steps
   - Include safety precautions
   - Specify tools and materials needed
   - Include time estimates
   - Note skill level required

3. SPECIFIC PRODUCTS NEEDED
   - 4-6 specific products with exact specifications
   - Include Amazon search URLs
   - Estimated costs
   - Why each product is essential

4. WHEN TO CALL A PROFESSIONAL
   - Specific warning signs
   - Situations beyond DIY scope
   - Safety-critical indicators
   - Complexity thresholds

5. RESOLUTION RECOMMENDATIONS
   - Best approach given current situation
   - Step-by-step resolution plan
   - Expected outcomes and timeline

Be practical, safety-focused, and specific.`,
        file_urls: issue.media_url ? [issue.media_url] : undefined,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            potential_causes: {
              type: "array",
              items: { type: "string" }
            },
            diy_safe: {
              type: "boolean"
            },
            diy_steps: {
              type: "array",
              items: { type: "string" }
            },
            products_needed: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  amazonSearchUrl: { type: "string" },
                  estimatedCost: { type: "string" }
                },
                required: ["name", "description", "amazonSearchUrl"]
              }
            },
            call_professional_if: {
              type: "array",
              items: { type: "string" }
            },
            resolution_recommendation: {
              type: "string"
            },
            estimated_resolution_time: {
              type: "string"
            }
          },
          required: ["potential_causes", "diy_safe", "call_professional_if", "resolution_recommendation"]
        }
      });

      setSuggestions(result);
      if (onSuggestionsGenerated) {
        onSuggestionsGenerated(result);
      }
    } catch (error) {
      console.error("AI suggestions failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border p-6",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn(
          "font-semibold flex items-center gap-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          <Sparkles className="w-5 h-5 text-[#F7B600]" />
          AI Resolution Assistant
        </h3>
        {!suggestions && (
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            size="sm"
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {!suggestions && !loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}
          >
            Get AI-powered resolution suggestions including potential causes, DIY steps, product recommendations, and professional guidance.
          </motion.p>
        )}

        {suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Potential Causes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className={cn(
                  "font-semibold",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Potential Causes
                </h4>
              </div>
              <ul className="space-y-2">
                {suggestions.potential_causes?.map((cause, idx) => (
                  <li key={idx} className={cn(
                    "flex items-start gap-2 text-sm p-3 rounded-lg",
                    theme === "dark"
                      ? "bg-[#0F1E2E] text-slate-300"
                      : "bg-slate-50 text-slate-700"
                  )}>
                    <span className="font-semibold text-[#F7B600] mt-0.5">{idx + 1}.</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resolution Recommendation */}
            <div className={cn(
              "p-4 rounded-xl border",
              theme === "dark"
                ? "bg-blue-900/20 border-blue-500/30"
                : "bg-blue-50 border-blue-200"
            )}>
              <h4 className={cn(
                "font-semibold mb-2",
                theme === "dark" ? "text-blue-300" : "text-blue-700"
              )}>
                Recommended Approach
              </h4>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-blue-200" : "text-blue-600"
              )}>
                {suggestions.resolution_recommendation}
              </p>
              {suggestions.estimated_resolution_time && (
                <p className={cn(
                  "text-xs mt-2",
                  theme === "dark" ? "text-blue-300" : "text-blue-500"
                )}>
                  ⏱️ Estimated time: {suggestions.estimated_resolution_time}
                </p>
              )}
            </div>

            {/* DIY Steps */}
            {suggestions.diy_safe && suggestions.diy_steps?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4 text-[#57CFA4]" />
                  <h4 className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    DIY Repair Steps
                  </h4>
                </div>
                <div className="space-y-3">
                  {suggestions.diy_steps.map((step, idx) => (
                    <div key={idx} className={cn(
                      "flex gap-3 p-3 rounded-lg",
                      theme === "dark"
                        ? "bg-[#0F1E2E]"
                        : "bg-slate-50"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                        theme === "dark"
                          ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                          : "bg-[#57CFA4]/20 text-[#57CFA4]"
                      )}>
                        {idx + 1}
                      </div>
                      <p className={cn(
                        "text-sm pt-1",
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      )}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Needed */}
            {suggestions.products_needed?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="w-4 h-4 text-[#F7B600]" />
                  <h4 className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    Products & Tools Needed
                  </h4>
                </div>
                <div className="grid gap-3">
                  {suggestions.products_needed.map((product, idx) => (
                    <div key={idx} className={cn(
                      "p-3 rounded-lg border",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                        : "bg-slate-50 border-slate-200"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h5 className={cn(
                            "font-semibold text-sm mb-1",
                            theme === "dark" ? "text-white" : "text-[#1E3A57]"
                          )}>
                            {product.name}
                          </h5>
                          <p className={cn(
                            "text-xs mb-2",
                            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                          )}>
                            {product.description}
                          </p>
                          {product.estimatedCost && (
                            <p className="text-xs font-medium text-[#F7B600]">
                              ~{product.estimatedCost}
                            </p>
                          )}
                        </div>
                        <a
                          href={product.amazonSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-[#F7B600] text-[#0F1E2E] hover:bg-[#F7B600]/90 font-medium whitespace-nowrap"
                        >
                          View on Amazon
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Professional If */}
            {suggestions.call_professional_if?.length > 0 && (
              <div className={cn(
                "p-4 rounded-xl border-2",
                theme === "dark"
                  ? "bg-red-900/20 border-red-500/30"
                  : "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h4 className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-red-300" : "text-red-700"
                  )}>
                    Call a Professional If:
                  </h4>
                </div>
                <ul className="space-y-2">
                  {suggestions.call_professional_if.map((condition, idx) => (
                    <li key={idx} className={cn(
                      "flex items-start gap-2 text-sm",
                      theme === "dark" ? "text-red-200" : "text-red-600"
                    )}>
                      <span className="text-red-500 mt-0.5">⚠️</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!suggestions.diy_safe && (
              <div className={cn(
                "p-4 rounded-xl border-2 text-center",
                theme === "dark"
                  ? "bg-red-900/30 border-red-500"
                  : "bg-red-50 border-red-300"
              )}>
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className={cn(
                  "font-semibold",
                  theme === "dark" ? "text-red-300" : "text-red-700"
                )}>
                  ⛔ DIY Not Recommended - Professional Required
                </p>
              </div>
            )}

            <Button
              onClick={generateSuggestions}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate Suggestions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}