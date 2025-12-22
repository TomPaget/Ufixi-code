import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const urgencyColors = {
  low: "bg-blue-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500"
};

export default function MyJobs() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: jobPostings = [] } = useQuery({
    queryKey: ["myJobs"],
    queryFn: () => base44.entities.JobPosting.filter({ customer_id: user?.id }, "-created_date")
  });

  const openJobs = jobPostings.filter(j => j.status === "open");
  const activeJobs = jobPostings.filter(j => j.status === "in_progress");
  const completedJobs = jobPostings.filter(j => j.status === "completed");

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            )}>My Jobs</h1>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("PostJob"))}
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Job
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <Tabs defaultValue="open" className="w-full">
          <TabsList className={cn(
            "w-full grid grid-cols-3",
            theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
          )}>
            <TabsTrigger value="open">
              Open {openJobs.length > 0 && `(${openJobs.length})`}
            </TabsTrigger>
            <TabsTrigger value="active">Active {activeJobs.length > 0 && `(${activeJobs.length})`}</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-3 mt-4">
            {openJobs.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Briefcase className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No open jobs
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("PostJob"))}
                  className="mt-4 bg-[#57CFA4] hover:bg-[#57CFA4]/90"
                >
                  Post Your First Job
                </Button>
              </div>
            ) : (
              openJobs.map((job) => (
                <div key={job.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className={cn("font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                        {job.title}
                      </h3>
                      <p className={cn("text-xs mt-1", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                        {format(new Date(job.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={urgencyColors[job.urgency]}>
                      {job.urgency}
                    </Badge>
                  </div>
                  <p className={cn("text-sm mb-3", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded",
                      theme === "dark" ? "bg-[#57CFA4]/20 text-[#57CFA4]" : "bg-blue-100 text-blue-700"
                    )}>
                      <Briefcase className="w-3 h-3" />
                      {job.trade_type}
                    </div>
                    {(job.budget_min || job.budget_max) && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded",
                        theme === "dark" ? "bg-[#F7B600]/20 text-[#F7B600]" : "bg-yellow-100 text-yellow-700"
                      )}>
                        <DollarSign className="w-3 h-3" />
                        £{job.budget_min}-£{job.budget_max}
                      </div>
                    )}
                    {job.location && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded",
                        theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                      )}>
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </div>
                    )}
                  </div>
                  {job.responses_count > 0 && (
                    <p className={cn("text-xs mt-3", theme === "dark" ? "text-[#57CFA4]" : "text-blue-600")}>
                      {job.responses_count} tradesperson{job.responses_count !== 1 ? 's' : ''} responded
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeJobs.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Clock className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
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
                  <h3 className={cn("font-semibold mb-2", theme === "dark" ? "text-white" : "text-slate-900")}>
                    {job.title}
                  </h3>
                  <Badge className="bg-blue-500 mb-2">In Progress</Badge>
                  <p className={cn("text-sm", theme === "dark" ? "text-white" : "text-slate-700")}>
                    {job.description}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3 mt-4">
            {completedJobs.length === 0 ? (
              <div className={cn(
                "text-center py-12 rounded-2xl border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <Briefcase className={cn("w-12 h-12 mx-auto mb-3", theme === "dark" ? "text-[#57CFA4]" : "text-slate-400")} />
                <p className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  No completed jobs
                </p>
              </div>
            ) : (
              completedJobs.map((job) => (
                <div key={job.id} className={cn(
                  "rounded-2xl p-4 border",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/20"
                    : "bg-white border-slate-200"
                )}>
                  <h3 className={cn("font-semibold mb-2", theme === "dark" ? "text-white" : "text-slate-900")}>
                    {job.title}
                  </h3>
                  <Badge className="bg-green-500">Completed</Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}