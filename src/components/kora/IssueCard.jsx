import { format } from "date-fns";
import { ChevronRight, Image, Video, Mic } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import UrgencyBadge from "./UrgencyBadge";
import SeverityBadge from "./SeverityBadge";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const mediaIcons = {
  photo: Image,
  video: Video,
  audio: Mic
};

const statusStyles = {
  active: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700"
};

export default function IssueCard({ issue }) {
  const MediaIcon = mediaIcons[issue.media_type] || Image;

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
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-700 border border-slate-600/50">
              <img 
                src={issue.media_url} 
                alt={issue.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-700 border border-slate-600/50 flex items-center justify-center flex-shrink-0">
              <MediaIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-100 truncate">{issue.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {format(new Date(issue.created_date), "MMM d, yyyy")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
            </div>
            
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {issue.severity_score && <SeverityBadge severity={issue.severity_score} />}
              <UrgencyBadge urgency={issue.urgency} size="small" />
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full capitalize border",
                statusStyles[issue.status]
              )}>
                {issue.status?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}