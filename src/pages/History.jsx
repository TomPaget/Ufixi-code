import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ArrowLeft, Filter, Search, Calendar } from "lucide-react";
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

export default function History() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues", "all"],
    queryFn: () => base44.entities.Issue.list("-created_date")
  });

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || issue.urgency === urgencyFilter;
    const matchesSearch = !searchQuery || 
      issue.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.explanation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  // Group by month
  const groupedIssues = filteredIssues.reduce((acc, issue) => {
    const monthKey = format(new Date(issue.created_date), "MMMM yyyy");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(issue);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAFBFC]/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg text-slate-900">Repair History</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-white border-slate-200"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 h-11 rounded-xl bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="flex-1 h-11 rounded-xl bg-white">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="fix_now">Fix Now</SelectItem>
              <SelectItem value="fix_soon">Fix Soon</SelectItem>
              <SelectItem value="ignore">Can Wait</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : Object.keys(groupedIssues).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedIssues).map(([month, monthIssues]) => (
              <section key={month}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-medium text-slate-500">{month}</h2>
                </div>
                <div className="space-y-3">
                  {monthIssues.map((issue, index) => (
                    <motion.div
                      key={issue.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <IssueCard issue={issue} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">No issues found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}
      </main>
    </div>
  );
}