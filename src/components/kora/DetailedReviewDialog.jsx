import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RatingInput = ({ label, value, onChange }) => {
  return (
    <div>
      <Label className="text-sm mb-2 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-6 h-6",
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function DetailedReviewDialog({ isOpen, onClose, tradesperson, jobId }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState({
    overall: 0,
    quality: 0,
    communication: 0,
    timeliness: 0,
    professionalism: 0,
    value: 0
  });
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const user = await base44.auth.me();
      
      const review = await base44.entities.DetailedReview.create({
        ...reviewData,
        customer_id: user.id,
        customer_name: user.full_name,
        moderation_status: "pending"
      });

      // Trigger trust score recalculation
      await base44.functions.invoke('calculateTrustScore', {
        tradespersonId: tradesperson.id
      });

      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews"]);
      queryClient.invalidateQueries(["trustBreakdown"]);
      setStep(3);
    }
  });

  const handleSubmit = () => {
    submitReviewMutation.mutate({
      tradesperson_id: tradesperson.id,
      tradesperson_name: tradesperson.full_name,
      job_id: jobId,
      overall_rating: ratings.overall,
      quality_rating: ratings.quality,
      communication_rating: ratings.communication,
      timeliness_rating: ratings.timeliness,
      professionalism_rating: ratings.professionalism,
      value_rating: ratings.value,
      comment: comment,
      would_recommend: wouldRecommend,
      verified_job: !!jobId
    });
  };

  const handleClose = () => {
    setStep(1);
    setRatings({ overall: 0, quality: 0, communication: 0, timeliness: 0, professionalism: 0, value: 0 });
    setComment("");
    setWouldRecommend(true);
    onClose();
  };

  if (step === 3) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Submitted! 🎉</h2>
            <p className="text-slate-600 mb-6">
              Thank you for helping improve our community
            </p>
            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review {tradesperson.full_name}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 mt-4">
            <RatingInput
              label="Overall Experience"
              value={ratings.overall}
              onChange={(val) => setRatings({ ...ratings, overall: val })}
            />
            <RatingInput
              label="Quality of Work"
              value={ratings.quality}
              onChange={(val) => setRatings({ ...ratings, quality: val })}
            />
            <RatingInput
              label="Communication"
              value={ratings.communication}
              onChange={(val) => setRatings({ ...ratings, communication: val })}
            />
            <RatingInput
              label="Timeliness"
              value={ratings.timeliness}
              onChange={(val) => setRatings({ ...ratings, timeliness: val })}
            />
            <RatingInput
              label="Professionalism"
              value={ratings.professionalism}
              onChange={(val) => setRatings({ ...ratings, professionalism: val })}
            />
            <RatingInput
              label="Value for Money"
              value={ratings.value}
              onChange={(val) => setRatings({ ...ratings, value: val })}
            />

            <Button
              onClick={() => setStep(2)}
              disabled={ratings.overall === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="mb-2 block">Tell us more about your experience</Label>
              <Textarea
                placeholder="Share details about what went well or what could be improved..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-32"
              />
            </div>

            <div>
              <Label className="mb-2 block">Would you recommend {tradesperson.full_name}?</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 font-medium transition-all",
                    wouldRecommend
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200"
                  )}
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={cn(
                    "flex-1 p-3 rounded-xl border-2 font-medium transition-all",
                    !wouldRecommend
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200"
                  )}
                >
                  👎 No
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!comment.trim() || submitReviewMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}