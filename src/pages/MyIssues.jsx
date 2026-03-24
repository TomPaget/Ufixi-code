import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ClipboardList, Scan } from "lucide-react";
import PageHeader from "@/components/kora/PageHeader";
import LavaLampBackground from "@/components/kora/LavaLampBackground";

const URGENCY_CONFIG = {
  fix_now:  { label: "Fix Now",  bg: "#fee2e2", color: "#dc2626" },
  fix_soon: { label: "Fix Soon", bg: "#fef3c7", color: "#d97706" },
  ignore:   { label: "Monitor",  bg: "#dcfce7", color: "#16a34a" },
};

const STATUS_CONFIG = {
  active:      { label: "Active",      bg: "rgba(232,83,10,0.1)",  color: "#E8530A" },
  in_progress: { label: "In Progress", bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  resolved:    { label: "Resolved",    bg: "rgba(29,158,117,0.1)", color: "#1D9E75" },
};

function IssueCard({ issue, onClick }) {
  const urgency = URGENCY_CONFIG[issue.urgency] || { label: issue.urgency, bg: "#f3f4f6", color: "#6b7280" };
  const status  = STATUS_CONFIG[issue.status]   || { label: issue.status,   bg: "#f3f4f6", color: "#6b7280" };

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 flex items-start gap-4 active:scale-[0.98] transition-transform"
      style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      {/* Photo thumbnail or placeholder */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        {issue.media_url && issue.media_type === "photo" ? (
          <img src={issue.media_url} alt={issue.title} className="w-full h-full object-cover" />
        ) : (
          <ClipboardList className="w-6 h-6" style={{ color: "#c9d1d9" }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug truncate" style={{ color: "#00172F" }}>
          {issue.title || "Untitled Issue"}
        </p>
        {issue.trade_type && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7A8D" }}>
            {issue.trade_type}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "#9aa5b4" }}>
          {format(new Date(issue.created_date), "d MMM yyyy")}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: urgency.bg, color: urgency.color }}>
            {urgency.label}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function MyIssues() {
  const navigate = useNavigate();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["my-issues"],
    queryFn: () => base44.entities.Issue.list("-created_date", 100),
  });

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      <LavaLampBackground />
      <PageHeader showBack={false} title="My Issues" />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-3 relative z-10">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse bg-white/50" />
          ))
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-3xl mt-6"
            style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,23,47,0.08)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(232,83,10,0.08)", border: "1px solid rgba(232,83,10,0.2)" }}>
              <Scan className="w-7 h-7" style={{ color: "#E8530A" }} />
            </div>
            <p className="font-semibold text-base" style={{ color: "#00172F" }}>No issues saved yet</p>
            <p className="text-sm text-center max-w-xs" style={{ color: "rgba(0,23,47,0.55)" }}>
              Tap <strong>Scan</strong> on the home screen to diagnose your first issue.
            </p>
          </div>
        ) : (
          issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={() => navigate(createPageUrl(`IssueDetail?id=${issue.id}`))}
            />
          ))
        )}
      </main>
    </div>
  );
}