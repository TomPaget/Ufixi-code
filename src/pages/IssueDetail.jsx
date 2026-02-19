import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import PageHeader from "@/components/kora/PageHeader";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Image, 
  Video, 
  Mic,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  ExternalLink,
  AlertCircle,
  Shield,
  Phone
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
import PriorityBadge from "@/components/kora/PriorityBadge";
import CostEstimate from "@/components/kora/CostEstimate";
import DetailedCostBreakdown from "@/components/kora/DetailedCostBreakdown";
import ResponsibilityTag from "@/components/kora/ResponsibilityTag";
import ActionButtons from "@/components/kora/ActionButtons";
import Disclaimer from "@/components/kora/Disclaimer";
import TradespersonMatcher from "@/components/kora/TradespersonMatcher";
import AmazonProducts from "@/components/kora/AmazonProducts";
import RegionalCostBenchmark from "@/components/kora/RegionalCostBenchmark";
import DIYProgressTracker from "@/components/kora/DIYProgressTracker";
import IssueComments from "@/components/kora/IssueComments";
import AIResolutionAssistant from "@/components/kora/AIResolutionAssistant";
import DynamicChecklist from "@/components/kora/DynamicChecklist";
import TenantRightsAlert from "@/components/kora/TenantRightsAlert";

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
  const [repairMethod, setRepairMethod] = useState("diy");
  const [actualCost, setActualCost] = useState("");

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
    onSuccess: async (updatedIssue, variables) => {
      queryClient.invalidateQueries(["issue", issueId]);
      queryClient.invalidateQueries(["issues"]);
      setShowResolveDialog(false);
      
      // Send notification if status changed
      if (variables.status && variables.status !== issue.status) {
        try {
          await base44.functions.invoke('createIssueNotification', {
            issueId: issueId,
            userId: user.id,
            notificationType: 'status_changed'
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
    }
  });

  const isPremium = false; // Removed premium features
  const userType = user?.user_type || "renter";
  const MediaIcon = mediaIcons[issue?.media_type] || Image;

  const handleResolve = async () => {
    const resolveData = {
      status: "resolved",
      resolved_date: new Date().toISOString().split("T")[0],
      resolution_notes: resolutionNotes,
      repair_method: repairMethod,
      user_location: user?.postcode || user?.country
    };

    // Add actual cost based on repair method
    if (actualCost && !isNaN(parseFloat(actualCost))) {
      if (repairMethod === "diy") {
        resolveData.actual_diy_cost = parseFloat(actualCost);
      } else if (repairMethod === "professional") {
        resolveData.actual_professional_cost = parseFloat(actualCost);
      }
    }

    updateIssueMutation.mutate(resolveData);
  };

  const handleMarkInProgress = () => {
    updateIssueMutation.mutate({ status: "in_progress" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6ECBA6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: '#6B7A8D' }}>Issue not found</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      <PageHeader showBack title={issue.title} subtitle={format(new Date(issue.created_date), "MMMM d, yyyy")} />

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

        {/* Priority, Urgency & Status */}
        <div className="space-y-3">
          {issue.priority && (
            <div className="flex items-center justify-between">
              <PriorityBadge priority={issue.priority} />
              {issue.recommended_timeframe && (
                <span className="text-sm text-slate-400">
                  {issue.recommended_timeframe}
                </span>
              )}
            </div>
          )}

          {issue.priority_reasoning && (
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-xs mb-1" style={{ color: '#6B7A8D' }}>Priority Reasoning:</p>
              <p className="text-sm" style={{ color: '#1a2f42' }}>{issue.priority_reasoning}</p>
            </div>
          )}

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
            </div>

        {/* Explanation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h2 className="font-semibold mb-3" style={{ color: '#1a2f42' }}>What's happening?</h2>
          <p className="leading-relaxed" style={{ color: '#1a2f42' }}>{issue.explanation}</p>
          {issue.historical_insights?.recommended_approach && (
            <div className="mt-4 p-4 bg-[#6ECBA6]/5 rounded-xl border border-[#6ECBA6]/20">
              <p className="text-sm font-semibold mb-2" style={{ color: '#1a2f42' }}>
                💡 Based on {issue.historical_insights.similar_cases_count} similar cases:
              </p>
              <p className="text-sm" style={{ color: '#1a2f42' }}>{issue.historical_insights.recommended_approach}</p>
              {issue.historical_insights.estimated_success_rate && (
                <p className="text-xs mt-2" style={{ color: '#6B7A8D' }}>
                  Estimated DIY success rate: {issue.historical_insights.estimated_success_rate}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Safety Warnings */}
        {issue.safety_warnings?.length > 0 && (
          <div className="bg-red-900/30 rounded-2xl border-2 border-red-500 p-5">
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2 text-lg">
              <Shield className="w-6 h-6" />
              ⚠️ SAFETY WARNINGS
            </h3>
            <ul className="space-y-3">
              {issue.safety_warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-3 bg-red-950/50 p-3 rounded-xl border border-red-800/50">
                  <span className="text-red-400 font-bold text-lg flex-shrink-0">⚠️</span>
                  <span className="text-red-200 font-medium leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* When to Call Professional */}
        {issue.call_professional_if?.length > 0 && (
          <div className="bg-orange-900/30 rounded-2xl border-2 border-orange-500 p-5">
            <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              🔴 Call a Professional If:
            </h3>
            <ul className="space-y-2">
              {issue.call_professional_if.map((condition, i) => (
                <li key={i} className="flex items-start gap-3 text-orange-200">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">►</span>
                  <span className="font-medium">{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DIY Safety Notice */}
        {issue.diy_safe === false && (
          <div className="bg-red-900/50 rounded-2xl border-2 border-red-500 p-5">
            <p className="font-bold text-center text-red-300 text-lg">
              ⛔ DIY NOT RECOMMENDED - Professional repair required for safety
            </p>
          </div>
        )}

        {/* Risks */}
        {issue.risks?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowRisks(!showRisks)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <span className="font-semibold" style={{ color: '#1a2f42' }}>Risks if ignored</span>
              </div>
              {showRisks ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            <AnimatePresence>
              {showRisks && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <ul className="space-y-2 pt-4">
                      {issue.risks.map((risk, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ color: '#1a2f42' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6ECBA6] mt-2 flex-shrink-0" />
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
          <h2 className="font-semibold mb-3" style={{ color: '#1a2f42' }}>Cost Analysis</h2>
          <CostEstimate
            diyMin={issue.diy_cost_min}
            diyMax={issue.diy_cost_max}
            proMin={issue.pro_cost_min}
            proMax={issue.pro_cost_max}
            isPremium={false}
          />
        </div>

        {/* Regional Cost Benchmark */}
        <RegionalCostBenchmark 
          category={issue.urgency}
          tradeType={issue.trade_type}
          userLocation={user?.postcode || user?.country}
        />

        {/* Products Needed */}
        <AmazonProducts products={issue?.products_needed} />

        {/* AI Resolution Assistant */}
        <AIResolutionAssistant 
          issue={issue}
          onSuggestionsGenerated={(suggestions) => {
            // Optionally auto-update issue with AI suggestions
            console.log('AI Suggestions:', suggestions);
          }}
        />

        {/* AI Tradesperson Matching */}
        {issue.trade_type && (
          <TradespersonMatcher issueId={issueId} />
        )}

        {/* Dynamic Checklist */}
        {issue.status !== "resolved" && (
          <div>
            <h2 className="font-semibold mb-3" style={{ color: '#1a2f42' }}>Step-by-Step Guidance</h2>
            <DynamicChecklist issueId={issueId} repairType="diy" />
          </div>
        )}

        {/* Action Buttons */}
        <div>
          <h2 className="font-semibold mb-3" style={{ color: '#1a2f42' }}>What do you want to do?</h2>
          <ActionButtons
            onDIY={() => setShowDIY(true)}
            onLandlord={() => setShowLandlord(true)}
            onProfessional={() => setShowProfessional(true)}
            userType={userType}
            responsibility={issue.responsibility}
            tradeType={issue.trade_type}
          />
        </div>

        {/* Team Comments */}
        {user?.account_type === "business" && (
          <IssueComments issueId={issueId} />
        )}

        {/* Disclaimer */}
        <Disclaimer />
        </main>

      {/* DIY Dialog */}
      <Dialog open={showDIY} onOpenChange={setShowDIY}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">DIY Repair Guide</DialogTitle>
          </DialogHeader>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important Disclaimer</p>
                <p>This is <strong>informational guidance only</strong>, not professional advice. FixPlain provides general information to help you understand your issue. For safety-critical repairs, electrical work, gas work, or if you're unsure, always consult a qualified professional. We are not responsible for any outcomes from following this guidance.</p>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-white rounded-2xl p-5">
            <AmazonProducts products={issue?.products_needed} />
          </div>

          {issue.diy_safe === false ? (
            <div className="bg-red-50 border-2 border-red-500 p-6 rounded-xl text-center">
              <Shield className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h3 className="font-bold text-red-900 text-lg mb-2">⛔ DIY Not Recommended</h3>
              <p className="text-red-800">
                This repair requires professional expertise for safety reasons. Please contact a qualified tradesperson.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step-by-Step Resolution Guide</h3>
                {issue.diy_steps?.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 pt-2 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-red-50 border-2 border-red-500 p-4 rounded-xl">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Safety First:</strong> If at any point you feel uncomfortable, encounter unexpected complications, or see signs mentioned in "Call a Professional If" section, STOP immediately and contact a qualified professional. Your safety is more important than saving money.
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="mt-6 border-t pt-6">
                <DIYProgressTracker issueId={issueId} />
              </div>
              </>
              )}
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
        <DialogContent className="max-w-lg mx-4 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark as Resolved</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                How did you resolve this?
              </label>
              <select
                value={repairMethod}
                onChange={(e) => setRepairMethod(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl"
              >
                <option value="diy">DIY - Fixed it myself</option>
                <option value="professional">Hired a professional</option>
                <option value="landlord">Landlord arranged repair</option>
                <option value="warranty">Warranty/Insurance covered</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Actual Cost (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">£</span>
                <input
                  type="number"
                  placeholder="e.g., 45.50"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="flex-1 p-2 border border-slate-300 rounded-xl"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                💡 Help others by sharing the actual cost - this data improves our estimates
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Additional Notes
              </label>
              <Textarea
                placeholder="Any additional details about the resolution..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-24 rounded-xl"
              />
            </div>

            <Button
              onClick={handleResolve}
              disabled={updateIssueMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {updateIssueMutation.isPending ? "Saving..." : "Mark Resolved"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}