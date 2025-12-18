import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Image, 
  Video, 
  Mic,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import UrgencyBadge from "@/components/kora/UrgencyBadge";
import CostEstimate from "@/components/kora/CostEstimate";
import ResponsibilityTag from "@/components/kora/ResponsibilityTag";
import ActionButtons from "@/components/kora/ActionButtons";
import Disclaimer from "@/components/kora/Disclaimer";

const mediaIcons = {
  photo: Image,
  video: Video,
  audio: Mic
};

export default function IssueDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const issueId = urlParams.get("id");

  const [showDIY, setShowDIY] = useState(false);
  const [showLandlord, setShowLandlord] = useState(false);
  const [showProfessional, setShowProfessional] = useState(false);
  const [showRisks, setShowRisks] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const issues = await base44.entities.Issue.filter({ id: issueId });
      return issues[0];
    },
    enabled: !!issueId
  });

  const updateIssueMutation = useMutation({
    mutationFn: (data) => base44.entities.Issue.update(issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["issue", issueId]);
      queryClient.invalidateQueries(["issues"]);
      setShowResolveDialog(false);
    }
  });

  const isPremium = user?.subscription_tier === "premium";
  const userType = user?.user_type || "renter";
  const MediaIcon = mediaIcons[issue?.media_type] || Image;

  const handleResolve = () => {
    updateIssueMutation.mutate({
      status: "resolved",
      resolved_date: new Date().toISOString().split("T")[0],
      resolution_notes: resolutionNotes
    });
  };

  const handleMarkInProgress = () => {
    updateIssueMutation.mutate({ status: "in_progress" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Issue not found</p>
          <Button onClick={() => navigate(createPageUrl("Home"))} className="bg-blue-600 hover:bg-blue-700">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-300"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-slate-100 truncate">{issue.title}</h1>
            <p className="text-sm text-slate-400">
              {format(new Date(issue.created_date), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12">
        {/* Media Preview */}
        {issue.media_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden bg-slate-100"
          >
            {issue.media_type === "photo" && (
              <img 
                src={issue.media_url} 
                alt={issue.title}
                className="w-full h-64 object-cover"
              />
            )}
            {issue.media_type === "video" && (
              <video 
                src={issue.media_url}
                className="w-full h-64 object-cover"
                controls
              />
            )}
            {issue.media_type === "audio" && (
              <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100">
                <audio src={issue.media_url} controls className="w-4/5" />
              </div>
            )}
          </motion.div>
        )}

        {/* Urgency & Status */}
        <div className="flex items-center justify-between">
          <UrgencyBadge urgency={issue.urgency} showDescription />
          
          {issue.status !== "resolved" && (
            <div className="flex gap-2">
              {issue.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleMarkInProgress}
                >
                  Mark In Progress
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowResolveDialog(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Resolve
              </Button>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
          <h2 className="font-semibold text-slate-100 mb-3">What's happening?</h2>
          <p className="text-slate-300 leading-relaxed">{issue.explanation}</p>
        </div>

        {/* Risks */}
        {issue.risks?.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
            <button
              onClick={() => setShowRisks(!showRisks)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <span className="font-semibold text-slate-100">Risks if ignored</span>
              </div>
              {showRisks ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <AnimatePresence>
              {showRisks && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-slate-700/50">
                    <ul className="space-y-2 pt-4">
                      {issue.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Responsibility */}
        <ResponsibilityTag 
          responsibility={issue.responsibility} 
          userType={userType}
        />

        {/* Cost Estimates */}
        <div>
          <h2 className="font-semibold text-slate-200 mb-3">Estimated Costs</h2>
          <CostEstimate
            diyMin={issue.diy_cost_min}
            diyMax={issue.diy_cost_max}
            proMin={issue.pro_cost_min}
            proMax={issue.pro_cost_max}
            isPremium={isPremium}
          />
          {!isPremium && (
            <Button
              variant="link"
              className="w-full mt-2 text-blue-400 hover:text-blue-300"
              onClick={() => navigate(createPageUrl("Upgrade"))}
            >
              Upgrade to see detailed estimates - £0.99/week
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div>
          <h2 className="font-semibold text-slate-200 mb-3">What do you want to do?</h2>
          <ActionButtons
            onDIY={() => setShowDIY(true)}
            onLandlord={() => setShowLandlord(true)}
            onProfessional={() => setShowProfessional(true)}
            userType={userType}
            isPremium={isPremium}
            responsibility={issue.responsibility}
          />
        </div>

        {/* Disclaimer */}
        <Disclaimer />
      </main>

      {/* DIY Dialog */}
      <Dialog open={showDIY} onOpenChange={setShowDIY}>
        <DialogContent className="max-w-lg mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle>DIY Repair Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {issue.diy_steps?.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#6B9080]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-[#6B9080]">{i + 1}</span>
                </div>
                <p className="text-slate-600 pt-1">{step}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Landlord Dialog */}
      <Dialog open={showLandlord} onOpenChange={setShowLandlord}>
        <DialogContent className="max-w-lg mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Talking to Your Landlord</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              Here are some key points to mention when contacting your landlord:
            </p>
            <ul className="space-y-3">
              {issue.landlord_talking_points?.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">{point}</span>
                </li>
              ))}
            </ul>
            <div className="bg-teal-50 rounded-xl p-4 mt-4">
              <p className="text-sm text-teal-700">
                <strong>Tip:</strong> Document everything in writing (email or text) and keep photos of the issue for your records.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Professional Dialog */}
      <Dialog open={showProfessional} onOpenChange={setShowProfessional}>
        <DialogContent className="max-w-lg mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Hiring a Professional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              When contacting a professional, ask about:
            </p>
            <ul className="space-y-3">
              {[
                "Their experience with this specific issue",
                "Written estimate before starting work",
                "Timeline for completion",
                "Warranty on their work",
                "References from past clients"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
            <div className="bg-blue-50 rounded-xl p-4 mt-4">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Get at least 2-3 quotes before making a decision, and check online reviews.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-lg mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mark as Resolved</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-600">
              How did you resolve this issue?
            </p>
            <Textarea
              placeholder="e.g., Fixed it myself, landlord sent a plumber, etc."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="min-h-24 rounded-xl"
            />
            <Button
              onClick={handleResolve}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Resolved
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}