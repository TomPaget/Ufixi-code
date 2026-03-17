import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function PremiumModal({ open, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1800));
      await base44.auth.updateMe({ is_premium: true, ads_removed: true });
      queryClient.invalidateQueries(["user"]);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setProcessing(false);
    }
  };

  const perks = [
    "Remove all ads forever",
    "Unlimited AI scans",
    "Faster scan & response times",
    "Priority issue analysis",
    "Advanced repair guides",
    "Cost tracking & history",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
          >
            <div className="rounded-t-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)' }}>
              {/* Gradient top bar */}
              <div className="h-1.5 w-full" style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }} />

              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 text-center">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
                  style={{ color: '#151528' }}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }}>
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#151528', fontFamily: "'Sora', sans-serif" }}>Go Premium</h2>
                <p className="text-sm" style={{ color: '#6B6A8E' }}>Unlock the full Ufixi experience</p>
              </div>

              {/* Price */}
              <div className="mx-6 rounded-2xl p-4 text-center mb-4" style={{ background: 'rgba(124,111,224,0.08)', border: '1px solid rgba(124,111,224,0.2)' }}>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold" style={{ color: '#151528' }}>£3.99</span>
                  <span className="mb-2" style={{ color: '#6B6A8E' }}>/month</span>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9B9ABE' }}>Cancel anytime · No commitment</p>
              </div>

              {/* Perks */}
              <div className="mx-6 space-y-2.5 mb-6">
                {perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB)' }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm" style={{ color: '#151528' }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-6 pb-8 space-y-3">
                {success ? (
                  <div className="w-full h-12 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)' }}>
                    <Check className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold">Welcome to Premium!</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleSubscribe}
                    disabled={processing}
                    className="w-full h-12 rounded-2xl font-semibold text-base border-0"
                    style={{ background: 'linear-gradient(135deg, #FF6E32, #E264AB, #7C6FE0)', color: '#fff' }}
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Subscribe for £3.99/mo</>
                    )}
                  </Button>
                )}
                <p className="text-xs text-center" style={{ color: '#9B9ABE' }}>
                  Secure payment · Auto-renews monthly · Cancel anytime in settings
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}