import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Star, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  MessageCircle,
  TrendingUp,
  Zap,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import PotentialJobs from "@/components/kora/PotentialJobs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function TradesDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => base44.entities.Job.filter({ tradesperson_id: user?.id }, "-created_date"),
    enabled: !!user
  });

  const { data: availableJobs = [] } = useQuery({
    queryKey: ["availableJobs"],
    queryFn: async () => {
      const jobs = await base44.entities.JobPosting.filter({ status: "open" }, "-created_date");
      // Filter by tradesperson's specialty
      return jobs.filter(job => 
        user?.trades_specialties?.includes(job.trade_type) || 
        user?.trades_specialty === job.trade_type
      );
    },
    enabled: !!user
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => base44.entities.Testimonial.filter({ tradesperson_id: user?.id }, "-created_date")
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, updates }) => base44.entities.Job.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobs"]);
    }
  });

  const pendingRequests = jobs.filter(r => r.status === "pending");
  const activeJobs = jobs.filter(r => r.status === "in_progress");
  const completedJobs = jobs.filter(r => r.status === "completed");
  const approvedTestimonials = testimonials.filter(t => t.moderation_status === "approved");
  const pendingTestimonials = testimonials.filter(t => t.moderation_status === "pending");

  const boostActive = user?.trades_boost_active && new Date(user?.trades_boost_expires) > new Date();
  const subscriptionActive = user?.trades_subscription_active && new Date(user?.trades_subscription_expires) > new Date();

  if (user?.account_type !== "trades") {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
      )}>
        <div className="text-center">
          <p className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>
            Trades account required
          </p>
          <Button onClick={() => navigate(createPageUrl("TradesSignup"))} className="mt-4">
            Apply Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Trades Dashboard</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* AI Job Matching */}
        <PotentialJobs />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Briefcase className="w-5 h-5 text-[#F7B600] mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {user?.trades_jobs_completed || 0}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Jobs Completed</p>
          </div>

          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Star className="w-5 h-5 text-[#F7B600] mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {approvedTestimonials.length}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Reviews</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-3">
          {!subscriptionActive && (
            <div className={cn(
              "rounded-2xl p-4 border-2",
              theme === "dark"
                ? "bg-red-500/20 border-red-500"
                : "bg-red-50 border-red-300"
            )}>
              <p className="font-semibold text-red-600 mb-1">⚠️ Subscription Expired</p>
              <p className={cn("text-sm mb-3", theme === "dark" ? "text-white" : "text-slate-700")}>
                Renew to continue receiving job requests
              </p>
              <Button
                onClick={() => navigate(createPageUrl("TradesPayment"))}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Renew Now
              </Button>
            </div>
          )}

          <Button
            onClick={() => navigate(createPageUrl("TradesProfile"))}
            variant="outline"
            className={cn(
              "w-full h-12 rounded-2xl border-2",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/30 hover:bg-[#57CFA4]/10 text-white"
                : "bg-white border-slate-200 hover:bg-slate-50"
            )}
          >
            Edit Profile
          </Button>

          <Button
            onClick={() => navigate(createPageUrl("TradesBoost"))}
            className={cn(
              "w-full h-12 rounded-2xl",
              boostActive
                ? "bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                : "bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white"
            )}
          >
            <Zap className="w-4 h-4 mr-2" />
            {boostActive ? "Manage Boost" : "Boost Profile - £5/day"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className={cn(
            "w-full grid grid-cols-4",
            theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
          )}>
            <TabsTrigger value="jobs">
              Jobs {availableJobs.length > 0 && (
                <Badge className="ml-1 bg-[#F7B600] text-xs">{availableJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests {pendingRequests.length > 0 && (
                <Badge className="ml-1 bg-red-500 text-xs">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Available Jobs */}
          <TabsContent value="jobs" className="space-y-3 mt-4">
            {availableJobs.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Briefcase className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No jobs available for your specialties
                </p>
              </div>
            ) : (
              availableJobs.map((job) => (
                <div key={job.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className={cn("font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {job.title}
                      </h3>
                      <p className={cn("text-xs mt-1", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                        Posted by {job.customer_name}
                      </p>
                    </div>
                    <Badge className="bg-[#F7B600] text-[#0F1E2E]">{job.urgency}</Badge>
                  </div>
                  <p className={cn("text-sm mb-3", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {job.description}
                  </p>
                  {(job.budget_min || job.budget_max) && (
                    <p className={cn("text-sm mb-3", theme === "dark" ? "text-[#F7B600]" : "text-yellow-600")}>
                      Budget: £{job.budget_min} - £{job.budget_max}
                    </p>
                  )}
                  <Button
                    onClick={async () => {
                      await base44.entities.WorkRequest.create({
                        customer_id: job.customer_id,
                        customer_name: job.customer_name,
                        tradesperson_id: user?.id,
                        tradesperson_name: user?.trades_business_name || user?.display_name || user?.full_name,
                        description: `Response to: ${job.title}`,
                        status: "pending"
                      });
                      await base44.entities.JobPosting.update(job.id, {
                        responses_count: (job.responses_count || 0) + 1
                      });
                      queryClient.invalidateQueries(["availableJobs"]);
                      queryClient.invalidateQueries(["jobs"]);
                    }}
                    className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                  >
                    Send Quote
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-3 mt-4">
            {pendingRequests.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Users className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No pending requests
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={cn("font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {request.customer_name}
                      </p>
                      <p className={cn("text-xs", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                        {format(new Date(request.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <p className={cn("text-sm mb-4", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {request.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateJobMutation.mutate({ 
                        id: request.id, 
                        updates: { 
                          status: "accepted",
                          start_date: new Date().toISOString()
                        }
                      })}
                      className="flex-1 bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => navigate(createPageUrl(`JobDetail?id=${request.id}`))}
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Active Jobs */}
          <TabsContent value="active" className="space-y-3 mt-4">
            {activeJobs.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Calendar className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No active jobs
                </p>
              </div>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={cn("font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {job.customer_name}
                      </p>
                      <p className={cn("text-xs", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                        Accepted {format(new Date(job.updated_date), "MMM d")}
                      </p>
                    </div>
                    <Badge className="bg-blue-500">In Progress</Badge>
                  </div>
                  <p className={cn("text-sm mb-4", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {job.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(createPageUrl(`JobDetail?id=${job.id}`))}
                      className="flex-1 bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                    >
                      Manage Job
                    </Button>
                    <Button
                      onClick={async () => {
                        const convo = await base44.entities.Conversation.filter({
                          participant_1_id: user.id,
                          participant_2_id: job.customer_id
                        });
                        if (convo.length > 0) {
                          navigate(createPageUrl(`Chat?id=${convo[0].id}`));
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-3 mt-4">
            {pendingTestimonials.length > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border-2",
                theme === "dark"
                  ? "bg-[#F7B600]/20 border-[#F7B600]"
                  : "bg-[#F7B600]/10 border-[#F7B600]"
              )}>
                <p className="font-semibold text-[#F7B600] text-sm">
                  {pendingTestimonials.length} review{pendingTestimonials.length > 1 ? "s" : ""} pending moderation
                </p>
              </div>
            )}

            {approvedTestimonials.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Star className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No reviews yet
                </p>
              </div>
            ) : (
              approvedTestimonials.map((review) => (
                <div key={review.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={cn("font-semibold text-sm", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {review.customer_name}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn("w-4 h-4", i < review.rating ? "fill-[#F7B600] text-[#F7B600]" : "text-slate-300")}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={cn("text-xs", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                      {format(new Date(review.created_date), "MMM d")}
                    </p>
                  </div>
                  <p className={cn("text-sm", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}