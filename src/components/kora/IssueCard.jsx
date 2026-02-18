import { format } from "date-fns";
import { ChevronRight, Image, Video, Mic, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import UrgencyBadge from "./UrgencyBadge";
import SeverityBadge from "./SeverityBadge";
import PriorityBadge from "./PriorityBadge";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const mediaIcons = {
  photo: Image,
  video: Video,
  audio: Mic
};

const getStatusStyle = (status, theme) => {
  const styles = {
    active: theme === "dark" 
      ? "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]" 
      : "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]",
    in_progress: theme === "dark"
      ? "bg-[#57CFA4]/20 text-[#57CFA4] border-[#57CFA4]"
      : "bg-[#57CFA4]/20 text-[#57CFA4] border-[#57CFA4]",
    resolved: theme === "dark"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
      : "bg-emerald-100 text-emerald-700 border-emerald-500"
  };
  return styles[status] || styles.active;
};

export default function IssueCard({ issue, showCost = false, showResolutionDate = false }) {
  const { theme } = useTheme();
  const MediaIcon = mediaIcons[issue.media_type] || Image;
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });
  
  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  return (
    <Link 
      to={createPageUrl(`IssueDetail?id=${issue.id}`)}
      className="block"
    >
      <div className={cn(
        "rounded-2xl p-4 transition-all active:scale-[0.98] border-2",
        theme === "dark"
          ? "bg-[#1E3A57]/50 border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
          : "bg-white border-[#1E3A57]/20 hover:border-[#57CFA4]/50"
      )}>
        <div className="flex gap-4">
          {issue.media_url && issue.media_type === "photo" ? (
            <div className={cn(
              "w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2",
              theme === "dark"
                ? "bg-[#1E3A57] border-[#57CFA4]/30"
                : "bg-slate-100 border-slate-300"
            )}>
              <img 
                src={issue.media_url} 
                alt={issue.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 border-2",
              theme === "dark"
                ? "bg-[#1E3A57] border-[#57CFA4]/30"
                : "bg-slate-100 border-slate-300"
            )}>
              <MediaIcon className={cn(
                "w-6 h-6",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
              )} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={cn(
                  "font-semibold truncate",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {issue.title}
                </h3>
                <p className={cn(
                  "text-sm mt-0.5",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  {format(new Date(issue.created_date), "MMM d, yyyy")}
                </p>
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 flex-shrink-0",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/50"
              )} />
            </div>
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {issue.priority && <PriorityBadge priority={issue.priority} showLabel={false} />}
              {issue.severity_score && <SeverityBadge severity={issue.severity_score} />}
              <UrgencyBadge urgency={issue.urgency} size="small" />
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded-full capitalize border-2",
                getStatusStyle(issue.status, theme)
              )}>
                {issue.status?.replace("_", " ")}
              </span>
              
              {showCost && (issue.pro_cost_min || issue.pro_cost_max) && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  theme === "dark"
                    ? "bg-[#F7B600]/20 text-[#F7B600]"
                    : "bg-yellow-100 text-yellow-700"
                )}>
                  <DollarSign className="w-3 h-3" />
                  {currencySymbol}{issue.pro_cost_min || 0}-{currencySymbol}{issue.pro_cost_max || 0}
                </span>
              )}
              
              {showResolutionDate && issue.resolved_date && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  theme === "dark"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-green-100 text-green-700"
                )}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(issue.resolved_date), "MMM d")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}