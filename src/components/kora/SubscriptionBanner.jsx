import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SubscriptionBanner({ scansLeft, onUpgrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#6B9080] to-[#4A6B5D] rounded-3xl p-6 text-white"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Upgrade to Premium</h3>
          <p className="text-white/80 text-sm mt-1">
            {scansLeft > 0 
              ? `${scansLeft} free scans left this month`
              : "You've used all your free scans"
            }
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {[
          "Unlimited issue scans",
          "Detailed cost estimates",
          "Step-by-step DIY guides",
          "Full repair history"
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-300" />
            <span className="text-white/90">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onUpgrade}
        className="w-full bg-white text-[#6B9080] hover:bg-white/90 rounded-xl h-12 font-semibold"
      >
        Get Premium
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}