import { useState, useEffect } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TimedAdBreak() {
  const [showAd, setShowAd] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [muted, setMuted] = useState(false);
  const [adsShown, setAdsShown] = useState(0);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  // Check if user has removed ads or is premium/business member
  const hasRemovedAds = user?.ads_removed === true || user?.subscription_tier === 'premium' || user?.account_type === 'business';

  // Timer to show ads after 35 seconds and 130 seconds
  useEffect(() => {
    if (hasRemovedAds) return;

    const timers = [];

    // First ad at 35 seconds
    if (adsShown === 0) {
      timers.push(setTimeout(() => {
        setShowAd(true);
      }, 35000));
    }

    // Second ad at 115 seconds
    if (adsShown === 1) {
      timers.push(setTimeout(() => {
        setShowAd(true);
      }, 115000));
    }

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [hasRemovedAds, adsShown]);

  // Countdown timer when ad is showing
  useEffect(() => {
    if (!showAd) return;

    if (timeLeft > 0) {
      const countdown = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [showAd, timeLeft]);

  const handleContinue = () => {
    if (timeLeft === 0) {
      setShowAd(false);
      setAdsShown(prev => prev + 1);
      setTimeLeft(15);
    }
  };

  if (hasRemovedAds) return null;

  return (
    <AnimatePresence>
      {showAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.88, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="max-w-lg w-full mx-4"
          >
            {/* Ad Video Placeholder */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-800 mb-6">
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <div className="text-4xl">📺</div>
                  </div>
                  <p className="text-white/70 text-sm">Ad Playing</p>
                </div>
              </div>

              {/* Mute Button */}
              <button
                onClick={() => setMuted(!muted)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                {muted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Timer Overlay */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm">
                <p className="text-white text-sm font-semibold">
                  {timeLeft > 0 ? `${timeLeft}s` : "Ad complete"}
                </p>
              </div>
            </div>

            {/* Ad Info */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Quick Ad Break
                </h3>
                <p className="text-white/70 text-sm">
                  Thanks for your patience while we show this ad
                </p>
              </div>

              <Button
                onClick={handleContinue}
                disabled={timeLeft > 0}
                className="w-full h-12 rounded-2xl font-semibold bg-[#63c49f] hover:bg-[#63c49f]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timeLeft > 0 ? `Continue in ${timeLeft}s` : "Continue"}
              </Button>

              <p className="text-xs text-white/50">
                Remove ads forever for just £3.99/month
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}