import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, DollarSign, Clock, Loader2, Send } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function PotentialJobs() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const handleFindJobs = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('findPotentialJobs', {});
      setJobs(result.data.potential_jobs || []);
    } catch (error) {
      console.error("Job finding failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 75) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 60) return "text-purple-600 bg-purple-50 border-purple-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[user?.currency || "GBP"];

  return (
    <div className={cn(
      "rounded-2xl p-6 border",
      theme === "dark"
        ? "bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30"
        : "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h3 className={cn(
            "font-bold",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Jobs Matched For You
          </h3>
        </div>
        <Button
          onClick={handleFindJobs}
          disabled={loading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finding...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Find Jobs
            </>
          )}
        </Button>
      </div>

      <p className={cn(
        "text-sm mb-4",
        theme === "dark" ? "text-blue-300" : "text-blue-700"
      )}>
        AI finds jobs that match your specialty, location, rate, and availability
      </p>

      {jobs && jobs.length === 0 && (
        <div className="text-center py-8">
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-blue-300" : "text-blue-600"
          )}>
            No matching jobs available right now. Check back soon!
          </p>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job.job_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-xl p-4 border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-blue-500/20"
                  : "bg-white border-blue-200"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-semibold text-sm",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {job.job_title}
                    </h4>
                    <Badge className={cn(
                      "text-xs px-2 py-0.5 border",
                      getScoreColor(job.suitability_score)
                    )}>
                      {job.suitability_score}% Fit
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-xs",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}>
                    {job.customer_name}
                  </p>
                </div>
              </div>

              <p className={cn(
                "text-xs mb-3",
                theme === "dark" ? "text-white/80" : "text-slate-600"
              )}>
                {job.match_reason}
              </p>

              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {job.distance_miles && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className={cn(
                      theme === "dark" ? "text-white" : "text-slate-700"
                    )}>
                      {job.distance_miles.toFixed(1)} mi
                    </span>
                  </div>
                )}
                {(job.budget_min || job.budget_max) && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[#F7B600]" />
                    <span className={cn(
                      theme === "dark" ? "text-white" : "text-slate-700"
                    )}>
                      {currencySymbol}{job.budget_min || 0}-{currencySymbol}{job.budget_max || '?'}
                    </span>
                    <Badge className={cn(
                      "text-xs ml-1",
                      job.budget_fit === "matches_rate"
                        ? "bg-green-100 text-green-700"
                        : job.budget_fit === "above_rate"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {job.budget_fit?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
                {job.urgency && (
                  <Badge className={cn(
                    "text-xs",
                    job.urgency === "urgent" || job.urgency === "high"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  )}>
                    <Clock className="w-3 h-3 mr-1" />
                    {job.urgency}
                  </Badge>
                )}
              </div>

              {job.estimated_earnings && (
                <div className={cn(
                  "text-xs p-2 rounded-lg mb-3",
                  theme === "dark"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-700"
                )}>
                  💰 Estimated earnings: {job.estimated_earnings}
                </div>
              )}

              <Button
                size="sm"
                onClick={async () => {
                  await base44.entities.Job.create({
                    customer_id: job.customer_id || "placeholder",
                    customer_name: job.customer_name,
                    tradesperson_id: user.id,
                    tradesperson_name: user.trades_business_name || user.full_name,
                    title: job.job_title,
                    description: `Interest in: ${job.job_title}`,
                    trade_type: user.trades_specialty,
                    status: "pending"
                  });
                  setJobs(jobs.filter(j => j.job_id !== job.job_id));
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-3 h-3 mr-2" />
                Express Interest
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}