import { format, differenceInDays } from "date-fns";
import { ChevronRight, Image, Video, Mic, DollarSign, Calendar, Trash2, Clock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

export default function IssueCard({ issue, showCost = false, showResolutionDate = false, onDelete }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const MediaIcon = mediaIcons[issue.media_type] || Image;
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });
  
  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  // Calculate days remaining until expiry
  const daysRemaining = issue.expires_at
    ? Math.max(0, differenceInDays(new Date(issue.expires_at), new Date()))
    : null;

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(issue.id);
  };

  return (
    <Link 
      to={createPageUrl(`IssueDetail?id=${issue.id}`)}
      className="block"
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative rounded-2xl p-4 border border-slate-100 bg-white cursor-pointer"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }} >
        <div className="flex gap-4">
          {issue.media_url && issue.media_type === "photo" ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
              <img 
                src={issue.media_url} 
                alt={issue.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#63c49f]/10">
                        <MediaIcon className="w-6 h-6 text-[#63c49f]" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate" style={{ color: '#1a2f42' }}>
                  {issue.title}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#6B7A8D' }}>
                  {format(new Date(issue.created_date), "MMM d, yyyy")}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-[#63c49f]" />
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
              {daysRemaining !== null && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  daysRemaining <= 7
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-500"
                )}>
                  <Clock className="w-3 h-3" />
                  {daysRemaining}d left
                </span>
              )}
              
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

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/EmailTradesman?id=${issue.id}`); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: '#E8530A', background: 'rgba(232,83,10,0.08)' }}
            aria-label="Email a tradesman"
            title="Email a Tradesman (Premium)"
          >
            <Mail className="w-4 h-4" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete issue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </Link>
  );
}