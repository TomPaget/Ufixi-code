import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SubscriptionBanner({ scansLeft, onUpgrade }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
          <Sparkles className="w-6 h-6 text-blue-200" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-blue-100">Upgrade to Premium</h3>
          <p className="text-blue-200 text-sm mt-1">
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
            <span className="text-blue-100">{feature}</span>
          </div>
        ))}
      </div>

      <Button 
        onClick={onUpgrade}
        className="w-full bg-slate-100 text-blue-700 hover:bg-slate-200 rounded-xl h-12 font-semibold shadow-lg"
      >
        Get Premium - £0.99/week
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}