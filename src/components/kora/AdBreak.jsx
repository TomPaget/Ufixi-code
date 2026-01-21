import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

export default function AdBreak({ onAdComplete, issueTitle }) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onAdComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onAdComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md mx-4 rounded-3xl overflow-hidden bg-slate-900"
      >
        {/* Video placeholder */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-2">✨</div>
            <p className="text-white text-lg font-semibold">Premium Diagnosis</p>
          </div>

          {/* Mute button */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition"
          >
            {muted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Timer */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg font-semibold">
            {timeLeft}s
          </div>
        </div>

        {/* Ad info */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Your diagnosis for:</p>
            <p className="text-lg font-semibold text-white truncate">
              {issueTitle}
            </p>
          </div>

          <p className="text-sm text-slate-300">
            Watch this brief message to unlock your detailed repair analysis, cost estimates, and professional recommendations.
          </p>

          <Button
            onClick={onAdComplete}
            disabled={timeLeft > 0}
            className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-slate-900 font-semibold h-11 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {timeLeft > 0 ? `Wait ${timeLeft}s to continue` : 'View My Diagnosis'}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Ad-free version available with Premium
          </p>
        </div>
      </motion.div>
    </div>
  );
}