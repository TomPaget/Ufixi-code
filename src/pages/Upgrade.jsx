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
    description: "Scan as many issues as you need"
  },
  {
    icon: Zap,
    title: "Detailed Cost Estimates",
    description: "Know exactly what repairs will cost"
  },
  {
    icon: Clock,
    title: "Step-by-Step DIY Guides",
    description: "Fix things yourself with confidence"
  },
  {
    icon: Shield,
    title: "Full Repair History",
    description: "Track all your home maintenance"
  }
];

export default function Upgrade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState("monthly");

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
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You're Premium!</h1>
          <p className="text-slate-500 mb-6">Enjoy all the premium features</p>
          <Button onClick={() => navigate(createPageUrl("Home"))}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6B9080]/10 to-[#FAFBFC]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-transparent">
        <div className="max-w-lg mx-auto px-5 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl bg-white/80 backdrop-blur-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6B9080] to-[#4A6B5D] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#6B9080]/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Upgrade to Premium
          </h1>
          <p className="text-slate-600 max-w-xs mx-auto">
            Get unlimited access to all features and take control of your home maintenance
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <h2 className="font-semibold text-slate-900 mb-4">What you'll get</h2>
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#6B9080]/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-[#6B9080]" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{feature.title}</p>
                  <p className="text-sm text-slate-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`w-full p-5 rounded-2xl border-2 transition-all ${
              selectedPlan === "yearly" 
                ? "border-[#6B9080] bg-[#6B9080]/5" 
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">Yearly</span>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Save 40%
                </span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${selectedPlan === "yearly" ? "border-[#6B9080] bg-[#6B9080]" : "border-slate-300"}`}>
                {selectedPlan === "yearly" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-slate-900">$4.99</span>
              <span className="text-slate-500">/month</span>
              <p className="text-sm text-slate-500 mt-1">Billed annually at $59.88</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`w-full p-5 rounded-2xl border-2 transition-all ${
              selectedPlan === "monthly" 
                ? "border-[#6B9080] bg-[#6B9080]/5" 
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900">Monthly</span>
              <div className={`w-5 h-5 rounded-full border-2 ${selectedPlan === "monthly" ? "border-[#6B9080] bg-[#6B9080]" : "border-slate-300"}`}>
                {selectedPlan === "monthly" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-slate-900">$7.99</span>
              <span className="text-slate-500">/month</span>
            </div>
          </button>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Button
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#6B9080] to-[#4A6B5D] hover:from-[#5A7D6E] hover:to-[#3A5A4D] text-white font-semibold text-lg shadow-lg shadow-[#6B9080]/20"
          >
            {upgradeMutation.isPending ? "Processing..." : "Start Premium"}
          </Button>
          
          <p className="text-center text-xs text-slate-500">
            Cancel anytime. No commitment required.
          </p>
        </motion.div>
      </main>
    </div>
  );
}