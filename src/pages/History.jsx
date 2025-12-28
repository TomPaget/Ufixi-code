import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  AlertTriangle,
  ArrowUpDown,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import IssueCard from "@/components/kora/IssueCard";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function History() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const { data: allIssues = [], isLoading } = useQuery({
    queryKey: ["issues", "all"],
    queryFn: () => base44.entities.Issue.list("-created_date", 1000)
  });

  const issues = allIssues;

  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  // Calculate statistics
  const stats = {
    total: issues.length,
    active: issues.filter(i => i.status === "active").length,
    inProgress: issues.filter(i => i.status === "in_progress").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    totalCost: issues.reduce((sum, i) => sum + (i.pro_cost_max || 0), 0),
    avgSeverity: issues.length > 0 ? (issues.reduce((sum, i) => sum + (i.severity_score || 0), 0) / issues.length).toFixed(1) : 0
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || issue.urgency === urgencyFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    const matchesTrade = tradeFilter === "all" || issue.trade_type === tradeFilter;
    const matchesSearch = !searchQuery || 
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.trade_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesUrgency && matchesPriority && matchesTrade && matchesSearch;
  });

  // Sort issues
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      case "newest":
        return new Date(b.created_date) - new Date(a.created_date);
      case "oldest":
        return new Date(a.created_date) - new Date(b.created_date);
      case "severity":
        return (b.severity_score || 0) - (a.severity_score || 0);
      case "cost":
        return (b.pro_cost_max || 0) - (a.pro_cost_max || 0);
      default:
        return 0;
    }
  });

  // Paginate
  const totalPages = Math.ceil(sortedIssues.length / itemsPerPage);
  const paginatedIssues = sortedIssues.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Group by month
  const groupedIssues = paginatedIssues.reduce((acc, issue) => {
    const monthKey = format(new Date(issue.created_date), "MMMM yyyy");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(issue);
    return acc;
  }, {});

  // Get unique trade types for filter
  const tradeTypes = [...new Set(issues.map(i => i.trade_type).filter(Boolean))];

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      {/* Header */}
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
          <div>
            <h1 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>Dashboard</h1>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>Track all your issues</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <TrendingUp className="w-5 h-5 text-[#F7B600] mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {stats.total}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Total Issues</p>
          </div>

          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {stats.resolved}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Resolved</p>
          </div>

          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <Clock className="w-5 h-5 text-blue-500 mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {stats.active + stats.inProgress}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Active/In Progress</p>
          </div>

          <div className={cn(
            "rounded-2xl p-4 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <BarChart3 className="w-5 h-5 text-orange-500 mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {stats.avgSeverity}
            </p>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>Avg Severity</p>
          </div>
        </div>

        {/* Cost Summary */}
        {stats.totalCost > 0 && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  theme === "dark"
                    ? "bg-[#F7B600]/20"
                    : "bg-[#F7B600]/10"
                )}>
                  <DollarSign className="w-5 h-5 text-[#F7B600]" />
                </div>
                <div>
                  <p className={cn(
                    "font-bold text-xl",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    {currencySymbol}{stats.totalCost.toLocaleString()}
                  </p>
                  <p className={cn(
                    "text-xs",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>Estimated Total Repair Costs</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )} />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-12 h-12 rounded-2xl border-2",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white placeholder:text-[#57CFA4]"
                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            )}
          />
        </div>

        {/* Filters & Sort */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className={cn(
                "flex-1 h-11 rounded-xl border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(
                "flex-1 h-11 rounded-xl border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className={cn(
                "flex-1 h-11 rounded-xl border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="fix_now">Fix Now</SelectItem>
                <SelectItem value="fix_soon">Fix Soon</SelectItem>
                <SelectItem value="ignore">Can Wait</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tradeFilter} onValueChange={setTradeFilter}>
              <SelectTrigger className={cn(
                "flex-1 h-11 rounded-xl border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Trade Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                {tradeTypes.map(trade => (
                  <SelectItem key={trade} value={trade}>
                    {trade.charAt(0).toUpperCase() + trade.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={cn(
                "flex-1 h-11 rounded-xl border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="severity">Highest Severity</SelectItem>
                <SelectItem value="cost">Highest Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, sortedIssues.length)} of {sortedIssues.length} issues
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "rounded-xl",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : ""
                )}
              >
                Previous
              </Button>
              <span className={cn(
                "text-sm px-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  "rounded-xl",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : ""
                )}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn(
                "rounded-2xl h-24 animate-pulse border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-slate-100 border-slate-200"
              )} />
            ))}
          </div>
        ) : Object.keys(groupedIssues).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedIssues).map(([month, monthIssues]) => (
              <section key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className={cn(
                    "w-4 h-4",
                    theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                  )} />
                  <h2 className={cn(
                    "text-sm font-semibold",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}>{month}</h2>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-lg",
                    theme === "dark"
                      ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {monthIssues.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {monthIssues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <IssueCard issue={issue} showCost showResolutionDate />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              theme === "dark"
                ? "bg-[#1A2F42] border border-[#57CFA4]/20"
                : "bg-slate-100 border border-slate-200"
            )}>
              <Filter className={cn(
                "w-8 h-8",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
              )} />
            </div>
            <p className={cn(
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>No issues found</p>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            )}>
              Try adjusting your filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}