import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
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
import PageHeader from "@/components/kora/PageHeader";
import LavaLampBackground from "@/components/kora/LavaLampBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import IssueCard from "@/components/kora/IssueCard";
import MobileSelect from "@/components/kora/MobileSelect";
import PullToRefreshIndicator from "@/components/kora/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";


export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { pullY, pullRefreshing, PULL_THRESHOLD, handlers } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries(["issues"]);
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

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
  ];
  const urgencyOptions = [
    { value: "all", label: "All Urgency" },
    { value: "fix_now", label: "Fix Now" },
    { value: "fix_soon", label: "Fix Soon" },
    { value: "ignore", label: "Ignore" },
  ];
  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];
  const sortOptions = [
    { value: "priority", label: "Priority" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "severity", label: "Severity" },
    { value: "cost", label: "Cost" },
  ];
  const tradeOptions = [
    { value: "all", label: "All Trades" },
    ...tradeTypes.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
  ];

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden" {...handlers}>
      <PullToRefreshIndicator pullY={pullY} pullRefreshing={pullRefreshing} threshold={PULL_THRESHOLD} />
      <LavaLampBackground />
      <PageHeader showBack title="Dashboard" subtitle="Track all your issues" />

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12 relative z-10">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,110,50,0.15)' }}>
            <TrendingUp className="w-5 h-5 text-[#FF6E32] mb-2" />
            <p className="text-2xl font-bold" style={{ color: '#151528' }}>{stats.total}</p>
            <p className="text-xs" style={{ color: '#6B6A8E' }}>Total Issues</p>
          </div>
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(29,158,117,0.15)' }}>
            <CheckCircle2 className="w-5 h-5 text-[#1D9E75] mb-2" />
            <p className="text-2xl font-bold" style={{ color: '#151528' }}>{stats.resolved}</p>
            <p className="text-xs" style={{ color: '#6B6A8E' }}>Resolved</p>
          </div>
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226,100,171,0.15)' }}>
            <Clock className="w-5 h-5 text-[#E264AB] mb-2" />
            <p className="text-2xl font-bold" style={{ color: '#151528' }}>{stats.active + stats.inProgress}</p>
            <p className="text-xs" style={{ color: '#6B6A8E' }}>Active/In Progress</p>
          </div>
          <div className="rounded-2xl p-4 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}>
            <BarChart3 className="w-5 h-5 text-[#7C6FE0] mb-2" />
            <p className="text-2xl font-bold" style={{ color: '#151528' }}>{stats.avgSeverity}</p>
            <p className="text-xs" style={{ color: '#6B6A8E' }}>Avg Severity</p>
          </div>
        </div>

        {/* Cost Summary */}
        {stats.totalCost > 0 && (
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(124,111,224,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,111,224,0.1)' }}>
                <DollarSign className="w-5 h-5 text-[#7C6FE0]" />
              </div>
              <div>
                <p className="font-bold text-xl" style={{ color: '#151528' }}>{currencySymbol}{stats.totalCost.toLocaleString()}</p>
                <p className="text-xs" style={{ color: '#6B6A8E' }}>Estimated Total Repair Costs</p>
              </div>
            </div>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl border bg-white border-slate-200"
            style={{ color: '#1a2f42' }}
          />
        </div>

        {/* Filters & Sort */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <MobileSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Status" className="w-full" />
            <MobileSelect value={urgencyFilter} onChange={setUrgencyFilter} options={urgencyOptions} placeholder="Urgency" className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MobileSelect value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} placeholder="Priority" className="w-full" />
            <MobileSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder="Sort by" className="w-full" />
          </div>
          {tradeTypes.length > 0 && (
            <MobileSelect value={tradeFilter} onChange={setTradeFilter} options={tradeOptions} placeholder="Trade Type" className="w-full" />
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: '#6B7A8D' }}>
            Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, sortedIssues.length)} of {sortedIssues.length} issues
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl h-11 px-3 text-sm">Previous</Button>
              <span className="text-sm px-3" style={{ color: '#1a2f42' }}>{page} / {totalPages}</span>
              <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl h-11 px-3 text-sm">Next</Button>
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
                  <Calendar className="w-4 h-4 text-[#7C6FE0]" />
                  <h2 className="text-sm font-semibold" style={{ color: '#1a2f42' }}>{month}</h2>
                  <span className="text-xs px-2 py-1 rounded-lg bg-slate-200" style={{ color: '#1a2f42' }}>
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(124,111,224,0.1)', border: '1px solid rgba(124,111,224,0.2)' }}>
              <Filter className="w-8 h-8 text-[#7C6FE0]" />
            </div>
            <p className="font-semibold" style={{ color: '#1a2f42' }}>No issues found</p>
            <p className="text-sm mt-1" style={{ color: '#6B7A8D' }}>Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}