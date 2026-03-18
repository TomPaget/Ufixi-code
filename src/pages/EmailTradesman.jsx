import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LavaLampBackground from "@/components/kora/LavaLampBackground";
import PageHeader from "@/components/kora/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Mail, Send, Copy, CheckCheck, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

function buildEmailBody(issue, userName) {
  const urgencyLabel = {
    fix_now: "urgent and requires immediate attention",
    fix_soon: "non-urgent but should be addressed soon",
    ignore: "minor and low priority",
  }[issue.urgency] || "in need of attention";

  const costHint =
    issue.pro_cost_min != null && issue.pro_cost_max != null
      ? `\n\nBased on AI estimates, professional repair costs are typically £${issue.pro_cost_min}–£${issue.pro_cost_max}.`
      : "";

  const steps =
    issue.diy_steps?.length > 0
      ? `\n\nSuggested next steps from the AI diagnosis:\n${issue.diy_steps
          .slice(0, 3)
          .map((s, i) => `  ${i + 1}. ${s}`)
          .join("\n")}`
      : "";

  return `Dear Tradesperson,

I am reaching out regarding a home maintenance issue I recently had assessed using UFixi, an AI-powered home diagnostic tool.

The AI scan identified the following issue: "${issue.title}"

${issue.explanation}

The issue has been flagged as ${urgencyLabel}.${costHint}${steps}

I have attached a photo of the issue for your reference. I would be grateful if you could review this and provide a quote or advise on the best course of action.

Please feel free to contact me at your earliest convenience to discuss further.

Kind regards,
${userName || "Homeowner"}`;
}

export default function EmailTradesman() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const issueId = urlParams.get("id");

  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailReady, setEmailReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const issues = await base44.entities.Issue.filter({ id: issueId });
      return issues[0];
    },
    enabled: !!issueId,
    onSuccess: (data) => {
      if (data && !emailReady) {
        setEmailBody(buildEmailBody(data, user?.full_name));
        setEmailReady(true);
      }
    },
  });

  // Generate email once both user and issue are loaded
  if (issue && user && !emailReady) {
    setEmailBody(buildEmailBody(issue, user.full_name));
    setEmailReady(true);
  }

  const isPremium = user?.is_premium;

  const handleSend = async () => {
    if (!recipientEmail) {
      toast({ title: "Please enter a recipient email address.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Home Maintenance Issue: ${issue?.title}`,
        body: `${emailBody}${issue?.media_url ? `\n\n[Attached photo: ${issue.media_url}]` : ""}`,
      });
      toast({ title: "Email sent successfully!" });
      setRecipientEmail("");
    } catch {
      toast({ title: "Failed to send email. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <LavaLampBackground />
        <div className="w-8 h-8 border-2 border-[#7C6FE0] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden">
        <LavaLampBackground />
        <PageHeader showBack title="Email a Tradesman" />
        <div className="max-w-lg mx-auto px-5 py-16 flex flex-col items-center text-center relative z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }}>
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>
            Premium Feature
          </h2>
          <p className="mb-6" style={{ color: '#6B6A8E' }}>
            Sending ready-made emails to tradesmen is a Premium feature. Upgrade to unlock this and more.
          </p>
          <Button
            className="h-12 px-8 rounded-2xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }}
            onClick={() => navigate(createPageUrl("Upgrade"))}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader showBack title="Email a Tradesman" />

      <main className="max-w-lg mx-auto px-5 py-6 space-y-5 relative z-10">

        {/* Issue preview */}
        {issue && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}
          >
            {issue.media_url && issue.media_type === "photo" && (
              <img src={issue.media_url} alt={issue.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: '#7C6FE0' }}>Issue Scanned</p>
              <p className="font-bold text-lg" style={{ color: '#151528' }}>{issue.title}</p>
              {!issue.media_url && (
                <div className="flex items-center gap-2 mt-2" style={{ color: '#6B6A8E' }}>
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">No photo attached</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recipient */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}
        >
          <label className="text-sm font-semibold block" style={{ color: '#151528' }}>
            <Mail className="inline w-4 h-4 mr-1 text-[#7C6FE0]" />
            Tradesman's Email Address
          </label>
          <input
            type="email"
            placeholder="e.g. plumber@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C6FE0]"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(124,111,224,0.25)', color: '#151528' }}
          />
        </motion.div>

        {/* Email body */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 space-y-2"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold" style={{ color: '#151528' }}>Email Content</label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#7C6FE0', background: 'rgba(124,111,224,0.08)' }}
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs mb-2" style={{ color: '#6B6A8E' }}>
            This email has been pre-written based on your scan. You can edit it before sending.
          </p>
          <Textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="min-h-[320px] rounded-xl text-sm leading-relaxed resize-none focus:ring-2 focus:ring-[#7C6FE0]"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(124,111,224,0.2)', color: '#151528' }}
          />
        </motion.div>

        {/* Photo note */}
        {issue?.media_url && (
          <p className="text-xs text-center" style={{ color: '#6B6A8E' }}>
            📎 The photo from your scan will be referenced in the email link.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSend}
            disabled={sending || !recipientEmail}
            className="flex-1 h-12 rounded-2xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }}
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Send Email</>
            )}
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="h-12 px-5 rounded-2xl font-semibold"
            style={{ border: '1.5px solid rgba(124,111,224,0.3)', color: '#7C6FE0' }}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

      </main>
    </div>
  );
}