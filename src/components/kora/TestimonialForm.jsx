import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function TestimonialForm({ tradespersonId, tradespersonName, onSuccess }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // AI Moderation
      const moderation = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this customer testimonial for a tradesperson and detect any issues.

Customer Name: "${customerName}"
Rating: ${rating}/5 stars
Review: "${comment}"

Check for:
1. PROFANITY - Any swear words, explicit language, or offensive content
2. FAKE REVIEWS - Generic/templated language, overly promotional tone, unrealistic praise, lack of specific details
3. IRRELEVANT CONTENT - Off-topic content, spam, promotional links, unrelated to trades services
4. RATING MANIPULATION - Rating inconsistent with review text (e.g., 5 stars but negative comments, or 1 star with positive comments)
5. SUSPICIOUS PATTERNS - Very short generic reviews, repeated phrases, bot-like language
6. PERSONAL ATTACKS - Attacks on character rather than service quality

Provide:
- Overall legitimacy score (0-100, where 100 is completely legitimate)
- List of specific flags/issues found
- Should it be auto-approved, flagged for review, or auto-rejected?
- Brief reason for the decision`,
        response_json_schema: {
          type: "object",
          properties: {
            legitimacy_score: { type: "number" },
            flags: { 
              type: "array",
              items: { type: "string" }
            },
            decision: { 
              type: "string",
              enum: ["approve", "flag", "reject"]
            },
            reason: { type: "string" }
          },
          required: ["legitimacy_score", "flags", "decision", "reason"]
        }
      });

      const moderationStatus = 
        moderation.decision === "approve" ? "approved" :
        moderation.decision === "reject" ? "rejected" : "pending";

      // Create testimonial
      return await base44.entities.Testimonial.create({
        tradesperson_id: tradespersonId,
        tradesperson_name: tradespersonName,
        customer_name: customerName,
        customer_email: customerEmail,
        rating,
        comment,
        moderation_status: moderationStatus,
        moderation_flags: moderation.flags,
        moderation_score: moderation.legitimacy_score,
        is_visible: moderation.decision === "approve"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["testimonials"]);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    }
  });

  if (submitted) {
    return (
      <div className={cn(
        "rounded-2xl p-6 text-center border-2",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/30"
          : "bg-white border-slate-200"
      )}>
        <CheckCircle2 className="w-12 h-12 text-[#57CFA4] mx-auto mb-3" />
        <h3 className={cn(
          "font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Thank you for your review!
        </h3>
        <p className={cn(
          "text-sm",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Your testimonial has been submitted and is being reviewed. It will appear on the profile once approved.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-6 border-2 space-y-4",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/30"
        : "bg-white border-slate-200"
    )}>
      <h3 className={cn(
        "font-semibold text-lg",
        theme === "dark" ? "text-white" : "text-[#1E3A57]"
      )}>
        Leave a Review for {tradespersonName}
      </h3>

      <div>
        <label className={cn(
          "text-sm font-medium mb-2 block",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Your Name *
        </label>
        <Input
          placeholder="John Smith"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={cn(
            "border-2",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
              : "bg-white border-slate-200"
          )}
        />
      </div>

      <div>
        <label className={cn(
          "text-sm font-medium mb-2 block",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Your Email *
        </label>
        <Input
          type="email"
          placeholder="john@example.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className={cn(
            "border-2",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
              : "bg-white border-slate-200"
          )}
        />
      </div>

      <div>
        <label className={cn(
          "text-sm font-medium mb-2 block",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Rating *
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={cn(
                  "w-8 h-8",
                  star <= rating
                    ? "fill-[#F7B600] text-[#F7B600]"
                    : theme === "dark"
                      ? "text-[#57CFA4]/30"
                      : "text-slate-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={cn(
          "text-sm font-medium mb-2 block",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Your Review *
        </label>
        <Textarea
          placeholder="Share your experience with this tradesperson..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={cn(
            "border-2 min-h-32",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
              : "bg-white border-slate-200"
          )}
        />
      </div>

      {submitMutation.isError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">Review flagged</p>
            <p className="text-xs text-red-500 mt-1">
              {submitMutation.error?.message || "Your review could not be submitted. Please check for inappropriate content and try again."}
            </p>
          </div>
        </div>
      )}

      <Button
        onClick={() => submitMutation.mutate()}
        disabled={!customerName || !customerEmail || !comment || submitMutation.isPending}
        className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold"
      >
        {submitMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>

      <p className={cn(
        "text-xs text-center",
        theme === "dark" ? "text-[#57CFA4]/70" : "text-slate-500"
      )}>
        All reviews are moderated before publication
      </p>
    </div>
  );
}