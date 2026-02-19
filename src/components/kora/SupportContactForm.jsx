import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SupportContactForm({ userEmail, onSubmit, onClose }) {
  const [email, setEmail] = useState(userEmail || "");
  const [issueSummary, setIssueSummary] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !issueSummary.trim()) return;

    setSending(true);
    setError(null);

    try {
      const { data } = await base44.functions.invoke('sendContactFormEmail', {
        email,
        issueSummary
      });

      onSubmit({
        email,
        issueSummary
      });
    } catch (err) {
      setError("Failed to send. Please try again.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-2xl border bg-white border-slate-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: '#1a2f42' }}>
          Get in Touch
        </p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium" style={{ color: '#1a2f42' }}>
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={sending}
            className="mt-1 border-slate-200"
          />
        </div>

        <div>
          <label className="text-xs font-medium" style={{ color: '#1a2f42' }}>
            Describe Your Issue
          </label>
          <Textarea
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            placeholder="Tell us what you need help with..."
            disabled={sending}
            className="mt-1 min-h-20 border-slate-200 resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!email.trim() || !issueSummary.trim() || sending}
          className="w-full bg-[#6ECBA6] hover:bg-[#4faf8a] text-[#1E2D40] rounded-lg"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send to Support"
          )}
        </Button>
      </form>
    </div>
  );
}