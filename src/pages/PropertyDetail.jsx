import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  User
} from "lucide-react";
import IssueCard from "@/components/kora/IssueCard";

export default function PropertyDetail() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const urlParams = new URLSearchParams(window.location.search);
  const propertyName = urlParams.get("name");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["property-issues", propertyName],
    queryFn: () => base44.entities.Issue.filter({ property_name: propertyName }, "-created_date"),
    enabled: !!propertyName
  });

  const filteredIssues = statusFilter === "all" 
    ? issues 
    : issues.filter(i => i.status === statusFilter);

  const property = issues.length > 0 ? {
    name: issues[0].property_name,
    address: issues[0].property_address,
    category: issues[0].property_category
  } : null;

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b",
        theme === "dark" 
          ? "bg-[#0F1E2E] border-[#57CFA4]/20" 
          : "bg-white border-slate-200"
      )}>
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("PropertyIssues"))}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className={cn(
              "text-lg font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {propertyName}
            </h1>
            {property?.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#57CFA4]" />
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {property.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        {/* Property Info */}
        {property && (
          <div className={cn(
            "rounded-2xl border p-6",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-8 h-8 text-[#F7B600]" />
              <div>
                <h2 className={cn(
                  "font-bold text-lg",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {property.name}
                </h2>
                <p className={cn(
                  "text-sm capitalize",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {property.category?.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto">
          {["all", "active", "in_progress", "resolved"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "whitespace-nowrap capitalize",
                statusFilter === status
                  ? "bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
                  : theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : ""
              )}
            >
              {status.replace("_", " ")} ({issues.filter(i => status === "all" || i.status === status).length})
            </Button>
          ))}
        </div>

        {/* Issues List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl h-32 animate-pulse",
                  theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        ) : filteredIssues.length > 0 ? (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div key={issue.id}>
                <IssueCard issue={issue} />
                {issue.scanned_by_name && (
                  <div className={cn(
                    "flex items-center gap-2 mt-2 ml-4 text-xs",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                  )}>
                    <User className="w-3 h-3" />
                    <span>Scanned by {issue.scanned_by_name}</span>
                    <Calendar className="w-3 h-3 ml-2" />
                    <span>{new Date(issue.created_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "text-center py-16 rounded-2xl border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <p className={cn(
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              No issues found for this property
            </p>
          </div>
        )}
      </main>
    </div>
  );
}