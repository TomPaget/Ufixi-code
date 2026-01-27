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
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-600/80 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/75 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(15%, 10%) scale(1.2) rotate(5deg); }
          50% { transform: translate(5%, 20%) scale(1.1) rotate(-3deg); }
          75% { transform: translate(-10%, 10%) scale(1.15) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-10%, 15%) scale(1.3) rotate(-6deg); }
          66% { transform: translate(10%, -10%) scale(1.1) rotate(5deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(20%, -15%) scale(1.25) rotate(7deg); }
          60% { transform: translate(-15%, 10%) scale(1.15) rotate(-4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 8s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 10s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 9s ease-in-out infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/10 backdrop-blur-md border-white/20">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-white/20 text-white"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg text-white">Dashboard</h1>
            <p className="text-xs text-white/80">Track all your issues</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 border bg-white/60 backdrop-blur-md border-slate-200">
            <TrendingUp className="w-5 h-5 text-[#63c49f] mb-2" />
            <p className="text-2xl font-bold text-[#1a2f42]">
              {stats.total}
            </p>
            <p className="text-xs text-[#1a2f42]/80">Total Issues</p>
          </div>

          <div className="rounded-2xl p-4 border bg-white/60 backdrop-blur-md border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-[#63c49f] mb-2" />
            <p className="text-2xl font-bold text-[#1a2f42]">
              {stats.resolved}
            </p>
            <p className="text-xs text-[#1a2f42]/80">Resolved</p>
          </div>

          <div className="rounded-2xl p-4 border bg-white/60 backdrop-blur-md border-slate-200">
            <Clock className="w-5 h-5 text-[#63c49f] mb-2" />
            <p className="text-2xl font-bold text-[#1a2f42]">
              {stats.active + stats.inProgress}
            </p>
            <p className="text-xs text-[#1a2f42]/80">Active/In Progress</p>
          </div>

          <div className="rounded-2xl p-4 border bg-white/60 backdrop-blur-md border-slate-200">
            <BarChart3 className="w-5 h-5 text-[#63c49f] mb-2" />
            <p className="text-2xl font-bold text-[#1a2f42]">
              {stats.avgSeverity}
            </p>
            <p className="text-xs text-[#1a2f42]/80">Avg Severity</p>
          </div>
        </div>

        {/* Cost Summary */}
        {stats.totalCost > 0 && (
          <div className="rounded-2xl p-5 border bg-white/60 backdrop-blur-md border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#63c49f]/20">
                  <DollarSign className="w-5 h-5 text-[#63c49f]" />
                </div>
                <div>
                  <p className="font-bold text-xl text-white">
                    {currencySymbol}{stats.totalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/80">Estimated Total Repair Costs</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-2 bg-white/30 backdrop-blur-md border-white/20 text-white placeholder:text-white/60"
          />
        </div>

        {/* Filters & Sort */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="flex-1 h-11 rounded-xl border-2 bg-white/60 backdrop-blur-md border-white/20 text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
...
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white font-medium">
            Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, sortedIssues.length)} of {sortedIssues.length} issues
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border-white/20 hover:bg-white/20 text-white"
              >
                Previous
              </Button>
              <span className="text-sm px-3 text-white">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border-white/20 hover:bg-white/20 text-white"
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
              <div key={i} className="rounded-2xl h-24 animate-pulse bg-white/50 backdrop-blur-md" />
            ))}
          </div>
        ) : Object.keys(groupedIssues).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedIssues).map(([month, monthIssues]) => (
              <section key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-[#63c49f]" />
                  <h2 className="text-sm font-semibold text-white">{month}</h2>
                  <span className="text-xs px-2 py-1 rounded-lg bg-white/30 backdrop-blur-md text-white">
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/30 backdrop-blur-md border border-white/20">
              <Filter className="w-8 h-8 text-white" />
            </div>
            <p className="text-white font-semibold">No issues found</p>
            <p className="text-sm mt-1 text-white/80">
              Try adjusting your filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}