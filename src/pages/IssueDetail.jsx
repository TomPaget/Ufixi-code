import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileSelect from "@/components/kora/MobileSelect";
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
  Phone,
  Mail,
  Crown,
  Download,
  Send,
  Loader2
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
import LavaLampBackground from "@/components/kora/LavaLampBackground";

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

  const [exportingPDF, setExportingPDF] = useState(false);
  const [emailingSending, setEmailingSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries(["issue", issueId]);
      const previousIssue = queryClient.getQueryData(["issue", issueId]);
      queryClient.setQueryData(["issue", issueId], (old) => old ? { ...old, ...variables } : old);
      return { previousIssue };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousIssue) {
        queryClient.setQueryData(["issue", issueId], context.previousIssue);
      }
    },
    onSuccess: async (_updatedIssue, variables) => {
      queryClient.invalidateQueries(["issue", issueId]);
      queryClient.invalidateQueries(["issues"]);
      setShowResolveDialog(false);

      if (variables.status && variables.status !== issue?.status) {
        try {
          await base44.functions.invoke('createIssueNotification', {
            issueId: issueId,
            userId: user?.id,
            notificationType: 'status_changed'
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }
    },
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

  const handleExportPDF = async () => {
    setExportingPDF(true);
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    let y = 0;

    // Header bar
    doc.setFillColor(232, 83, 10);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('UFixi Issue Report', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}`, pw - 14, 18, { align: 'right' });
    y = 38;

    // If there's a photo, try to embed it
    if (issue.media_url && issue.media_type === 'photo') {
      try {
        const res = await fetch(issue.media_url);
        const blob = await res.blob();
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const imgW = pw - 28;
        const imgH = 60;
        doc.addImage(dataUrl, 'JPEG', 14, y, imgW, imgH, '', 'FAST');
        y += imgH + 8;
      } catch {}
    }

    const currency = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '£';
    const urgencyLabel = { fix_now: 'Fix Now', fix_soon: 'Fix Soon', ignore: 'Monitor' }[issue.urgency] || issue.urgency;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 23, 47);
    doc.text(issue.title || '', 14, y);
    y += 8;

    // Urgency pill (text only)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(issue.urgency === 'fix_now' ? 220 : issue.urgency === 'fix_soon' ? 217 : 22, issue.urgency === 'fix_now' ? 38 : issue.urgency === 'fix_soon' ? 119 : 163, issue.urgency === 'fix_now' ? 38 : issue.urgency === 'fix_soon' ? 6 : 74);
    doc.text(`Urgency: ${urgencyLabel}`, 14, y);
    y += 10;

    const addSection = (title, body) => {
      if (!body) return;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setDrawColor(232, 83, 10);
      doc.setLineWidth(0.4);
      doc.line(14, y, pw - 14, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(232, 83, 10);
      doc.text(title, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const lines = doc.splitTextToSize(body, pw - 28);
      lines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, 14, y);
        y += 5;
      });
      y += 4;
    };

    addSection('Diagnosis', issue.explanation);
    addSection('Cost Estimates', `DIY: ${issue.diy_cost_min != null ? `${currency}${issue.diy_cost_min}–${currency}${issue.diy_cost_max}` : 'N/A'}    Professional: ${issue.pro_cost_min != null ? `${currency}${issue.pro_cost_min}–${currency}${issue.pro_cost_max}` : 'N/A'}`);

    if (issue.diy_steps?.length) {
      addSection('DIY Steps', issue.diy_steps.map((s, i) => `${i + 1}. ${s}`).join('\n'));
    }
    if (issue.products_needed?.length) {
      addSection('Products Needed', issue.products_needed.map(p => `• ${p.name}${p.estimatedCost ? ` (~${p.estimatedCost})` : ''}`).join('\n'));
    }
    if (issue.risks?.length) {
      addSection('Risks if Ignored', issue.risks.map(r => `• ${r}`).join('\n'));
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('UFixi · AI-Powered Home Repair Diagnostics · ufxi.app', pw / 2, 292, { align: 'center' });
      doc.text(`Page ${p} of ${totalPages}`, pw - 14, 292, { align: 'right' });
    }

    doc.save(`ufxi-report-${(issue.title || 'issue').replace(/\s+/g, '-').toLowerCase()}.pdf`);
    setExportingPDF(false);
  };

  const handleEmailReport = async () => {
    setEmailingSending(true);
    setEmailSent(false);
    try {
      await base44.functions.invoke('emailReport', { issueId });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (err) {
      console.error('Email report failed:', err);
    } finally {
      setEmailingSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <LavaLampBackground />
        <div className="w-8 h-8 border-2 border-[#E8530A] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <LavaLampBackground />
        <div className="text-center">
          <p className="mb-4" style={{ color: '#6B7A8D' }}>Issue not found</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader showBack title="Diagnosis" />

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12 relative z-10">
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

          <div className="flex items-center justify-end">
          {issue.status !== "resolved" && (
            <div className="flex gap-2">
              {issue.status === "active" && (
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-4 text-sm"
                  onClick={handleMarkInProgress}
                >
                  Mark In Progress
                </Button>
              )}
              <Button
                className="rounded-xl text-white h-11 px-4 text-sm" style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}
                onClick={() => setShowResolveDialog(true)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Resolve
              </Button>
            </div>
            )}
            </div>
            </div>

        {/* Tenant Rights Alert */}
        <TenantRightsAlert userType={userType} />

        {/* Diagnosis Hero Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          {/* Title row with confidence bars - exactly like screenshot */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h2 className="font-bold text-2xl leading-tight flex-1" style={{ color: '#1a2f42' }}>{issue.title}</h2>
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-xs font-medium mb-1" style={{ color: '#6B7A8D' }}>Confidence</span>
              <div className="flex items-end gap-[3px]">
                {(() => {
                  let score = 0;
                  if (issue.explanation?.length > 100) score++;
                  if (issue.risks?.length >= 2) score++;
                  if (issue.diy_steps?.length >= 3) score++;
                  if (issue.products_needed?.length >= 1) score++;
                  if (issue.pro_cost_min != null && issue.diy_cost_min != null) score++;
                  const filled = Math.max(3, score);
                  return [1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      style={{
                        width: '7px',
                        height: `${12 + bar * 5}px`,
                        borderRadius: '3px',
                        backgroundColor: bar <= filled ? '#63c49f' : '#D1D5DB'
                      }}
                    />
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Confidence description */}
          <p className="text-sm mb-4" style={{ color: '#6B7A8D' }}>
            {(() => {
              let score = 0;
              if (issue.explanation?.length > 100) score++;
              if (issue.risks?.length >= 2) score++;
              if (issue.diy_steps?.length >= 3) score++;
              if (issue.products_needed?.length >= 1) score++;
              if (issue.pro_cost_min != null && issue.diy_cost_min != null) score++;
              return score >= 4 ? "We're very confident about this diagnosis" :
                     score >= 2 ? "We're fairly confident about this diagnosis" :
                     "This is our best estimate — consider professional advice";
            })()}
          </p>

          {/* Urgency badge */}
          <UrgencyBadge urgency={issue.urgency} />

          {/* Explanation */}
          <p className="leading-relaxed mt-4" style={{ color: '#1a2f42' }}>{issue.explanation}</p>
          {issue.historical_insights?.recommended_approach && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(232,83,10,0.05)', border: '1px solid rgba(232,83,10,0.15)' }}>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8530A] mt-2 flex-shrink-0" />
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

        {/* Export & Email Report */}
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            aria-label="Export issue as PDF"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)', color: '#fff' }}
          >
            {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exportingPDF ? 'Generating…' : 'Export PDF'}
          </button>
          <button
            onClick={handleEmailReport}
            disabled={emailingSending}
            aria-label="Email report to yourself"
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-sm border-2 transition-all disabled:opacity-60"
            style={{
              borderColor: emailSent ? '#1D9E75' : '#E8530A',
              color: emailSent ? '#1D9E75' : '#E8530A',
              background: emailSent ? 'rgba(29,158,117,0.07)' : 'rgba(255,255,255,0.7)',
            }}
          >
            {emailingSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {emailingSending ? 'Sending…' : emailSent ? '✓ Sent!' : 'Email Report'}
          </button>
        </div>

        {/* Email a Tradesman - Premium Feature */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99] transition-transform"
          style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,23,47,0.08)' }}
          onClick={() => navigate(`/EmailTradesman?id=${issueId}`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm" style={{ color: '#151528' }}>Email a Tradesman</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex items-center gap-0.5"
                  style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}>
                  <Crown className="w-2.5 h-2.5" /> Premium
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#6B6A8E' }}>Send a ready-made email with your scan results</p>
            </div>
          </div>
          <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#E8530A' }} />
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
              <MobileSelect
                value={repairMethod}
                onChange={setRepairMethod}
                placeholder="Select resolution method"
                className="w-full"
                options={[
                  { value: "diy", label: "DIY - Fixed it myself" },
                  { value: "professional", label: "Hired a professional" },
                  { value: "landlord", label: "Landlord arranged repair" },
                  { value: "warranty", label: "Warranty/Insurance covered" },
                  { value: "other", label: "Other" },
                ]}
              />
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
                  className="flex-1 h-11 px-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8530A]"
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
              className="w-full rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #E8530A, #D93870)' }}
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