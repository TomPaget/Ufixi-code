import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Check, 
  Sparkles,
  Zap,
  Shield,
  Clock,
  Infinity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const features = [
  {
    icon: Infinity,
    title: "Unlimited Scans",
    description: "Scan as many issues as you need",
    free: "3 per month",
    premium: "Unlimited"
  },
  {
    icon: Zap,
    title: "Detailed Cost Estimates",
    description: "Know exactly what repairs will cost",
    free: "Basic only",
    premium: "Full breakdown"
  },
  {
    icon: Clock,
    title: "Step-by-Step DIY Guides",
    description: "Fix things yourself with confidence",
    free: "Not included",
    premium: "Included"
  },
  {
    icon: Shield,
    title: "Full Repair History",
    description: "Track all your home maintenance",
    free: "Recent only",
    premium: "Complete history"
  }
];

export default function Upgrade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const upgradeMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ subscription_tier: "premium" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      navigate(createPageUrl("Home"));
    }
  });

  const isPremium = user?.subscription_tier === "premium";

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">You're Premium!</h1>
          <p className="text-slate-400 mb-6">Enjoy all the premium features</p>
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
      <header className="sticky top-0 z-10 bg-transparent">
        <div className="max-w-lg mx-auto px-5 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl bg-slate-800/80 backdrop-blur-sm text-slate-300 hover:bg-slate-700"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-8 pb-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 border border-blue-500/30">
            <Sparkles className="w-10 h-10 text-blue-100" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            QuoFix Premium
          </h1>
          <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
            Professional home maintenance insights for less than a coffee
          </p>
        </motion.div>

        {/* Pricing Card */}
        <div className="space-y-4">
          {/* Weekly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-800/95 rounded-3xl p-6 shadow-2xl border border-slate-700/50"
          >
            <div className="text-center mb-6">
              <div className="flex items-end justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-100">£0.99</span>
              </div>
              <p className="text-slate-400 font-medium">per week</p>
              <p className="text-sm text-slate-500 mt-1">Billed weekly • Cancel anytime</p>
            </div>

          <Button
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending}
            className="w-full h-12 rounded-2xl bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white font-semibold"
          >
            {upgradeMutation.isPending ? "Processing..." : "Choose Weekly"}
          </Button>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 rounded-3xl p-6 shadow-2xl border-2 border-emerald-500/50 relative overflow-hidden"
          >
          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            SAVE 17%
          </div>
          <div className="text-center mb-6">
            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-slate-100">£300</span>
            </div>
            <p className="text-slate-300 font-medium">per year</p>
            <p className="text-sm text-emerald-400 mt-1">Save £52 compared to weekly</p>
          </div>
          <Button
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending}
            className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            {upgradeMutation.isPending ? "Processing..." : "Choose Yearly"}
          </Button>
          </motion.div>
          </div>

          {/* Features */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800 to-slate-800/95 rounded-3xl p-6 shadow-2xl border border-slate-700/50"
          >
          <h3 className="text-lg font-bold text-slate-100 mb-4">Premium Features</h3>
          <div className="space-y-4">
          {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <feature.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">{feature.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{feature.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500 line-through">Free: {feature.free}</span>
                    <span className="text-xs text-blue-400 font-medium">Premium: {feature.premium}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50"
            >
            <p className={cn("text-xs font-medium mb-3 text-center text-slate-400")}>
            Secure payment via
            </p>
            <div className="flex items-center justify-center gap-4">
            <div className="px-4 py-2 bg-white rounded-lg">
              <span className="font-semibold text-slate-900">Apple Pay</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-lg">
              <span className="font-semibold text-blue-600">PayPal</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-lg">
              <span className="font-semibold text-slate-900">Card</span>
            </div>
            </div>
            </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
            <Shield className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Secure</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Cancel Anytime</p>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-center">
            <Check className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Instant Access</p>
          </div>
        </motion.div>



        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center"
        >
          <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200 mb-1">7-Day Money Back Guarantee</p>
          <p className="text-xs text-slate-400">Not satisfied? Get a full refund within 7 days</p>
        </motion.div>
      </main>
    </div>
  );
}