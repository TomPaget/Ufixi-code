import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function EarningsTracker({ userId }) {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState("month");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["contractor-earnings", userId],
    queryFn: () => base44.entities.Job.filter({ 
      tradesperson_id: userId,
      status: "completed",
      payment_status: "paid"
    }),
    enabled: !!userId
  });

  const { data: pendingJobs = [] } = useQuery({
    queryKey: ["contractor-pending-earnings", userId],
    queryFn: () => base44.entities.Job.filter({ 
      tradesperson_id: userId,
      status: "completed",
      payment_status: "requested"
    }),
    enabled: !!userId
  });

  // Calculate earnings
  const totalEarnings = jobs.reduce((sum, job) => sum + (job.actual_cost || 0), 0);
  const pendingEarnings = pendingJobs.reduce((sum, job) => sum + (job.actual_cost || 0), 0);
  
  // This month's earnings
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyEarnings = jobs
    .filter(job => new Date(job.completion_date) >= startOfMonth)
    .reduce((sum, job) => sum + (job.actual_cost || 0), 0);

  // This week's earnings
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weeklyEarnings = jobs
    .filter(job => new Date(job.completion_date) >= startOfWeek)
    .reduce((sum, job) => sum + (job.actual_cost || 0), 0);

  const completedJobs = jobs.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className={cn(
          "rounded-2xl p-6 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Total Earnings
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                £{totalEarnings.toFixed(2)}
              </p>
            </div>
          </div>
          <p className={cn(
            "text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            {completedJobs} completed jobs
          </p>
        </div>

        <div className={cn(
          "rounded-2xl p-6 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                This Month
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                £{monthlyEarnings.toFixed(2)}
              </p>
            </div>
          </div>
          <p className={cn(
            "text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            This week: £{weeklyEarnings.toFixed(2)}
          </p>
        </div>

        <div className={cn(
          "rounded-2xl p-6 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Pending Payment
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                £{pendingEarnings.toFixed(2)}
              </p>
            </div>
          </div>
          <p className={cn(
            "text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            {pendingJobs.length} awaiting payment
          </p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className={cn(
        "rounded-2xl p-6 border",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <h3 className={cn(
          "text-lg font-bold mb-4",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Recent Completed Jobs
        </h3>

        {jobs.length === 0 ? (
          <p className={cn(
            "text-center py-8",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            No completed jobs yet
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 10).map((job) => (
              <div
                key={job.id}
                className={cn(
                  "p-4 rounded-xl border",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn(
                      "font-semibold",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {job.title}
                    </p>
                    <p className={cn(
                      "text-sm",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {job.customer_name}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                    )}>
                      {format(new Date(job.completion_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      theme === "dark" ? "text-[#57CFA4]" : "text-green-600"
                    )}>
                      £{job.actual_cost?.toFixed(2)}
                    </p>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Paid
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}