import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Download, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import InsightsSummaryCards from "@/components/insights/InsightsSummaryCards";
import InsightsPrivacyBanner from "@/components/insights/InsightsPrivacyBanner";
import InsightsDateFilter from "@/components/insights/InsightsDateFilter";
import { useInsightsData } from "@/components/insights/useInsightsData";
import {
  IssueTypesChart,
  AvgCostByTradeChart,
  PropertyCategoryChart,
  UrgencyBreakdownChart,
  TopRegionsChart,
  MonthlyTrendChart,
} from "@/components/insights/InsightsCharts";
import { format } from "date-fns";

export default function DataInsights() {
  const [dateRange, setDateRange] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: rawInsights = [], isLoading, refetch } = useQuery({
    queryKey: ["anonymised-insights"],
    queryFn: () => base44.entities.AnonymisedInsight.list("-created_date", 5000),
    enabled: user?.role === "admin",
  });

  const {
    filtered,
    issueTypes,
    avgCostByTrade,
    propertyCategoryData,
    urgencyData,
    topRegions,
    monthlyTrend,
  } = useInsightsData(rawInsights, dateRange);

  // Export CSV
  const handleExportCSV = () => {
    setExporting(true);
    const headers = [
      "Issue Type", "Trade Type", "Property Category", "Urgency", "Priority",
      "Severity", "Region", "Postcode Area", "Pro Cost Est", "DIY Cost Est",
      "Actual Cost", "Repair Method", "Responsibility", "Status", "Issue Date",
    ];
    const rows = filtered.map(i => [
      i.issue_type, i.trade_type, i.property_category, i.urgency, i.priority,
      i.severity_score, i.region, i.postcode_area, i.pro_cost_estimate,
      i.diy_cost_estimate, i.actual_cost, i.repair_method, i.responsibility,
      i.status, i.issue_date,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ufxi-data-insights-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  // Export PDF-ready summary via print
  const handleExportPDF = () => {
    window.print();
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FDF6EE" }}>
      <div className="w-8 h-8 border-4 border-slate-200 border-t-[#E8530A] rounded-full animate-spin" />
    </div>
  );

  if (user.role !== "admin") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "#FDF6EE" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(232,83,10,0.1)" }}>
        <Lock className="w-8 h-8" style={{ color: "#E8530A" }} />
      </div>
      <h1 className="text-xl font-bold text-center" style={{ color: "#00172F" }}>Admin Access Only</h1>
      <p className="text-sm text-center max-w-xs" style={{ color: "#6B7A8D" }}>
        The Data Insights dashboard is restricted to admin users.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen pb-16 print:pb-4" style={{ background: "#FDF6EE" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-safe-top print:static" style={{ background: "rgba(253,246,238,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#00172F" }}>Data Insights</h1>
            <p className="text-xs" style={{ color: "#6B7A8D" }}>
              {filtered.length.toLocaleString()} anonymised records
              {dateRange ? ` · filtered` : " · all time"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              aria-label="Refresh data"
              className="w-11 h-11 rounded-xl flex items-center justify-center border border-slate-200 bg-white"
            >
              <RefreshCw className="w-4 h-4" style={{ color: "#6B7A8D" }} />
            </button>
            <InsightsDateFilter onRangeChange={setDateRange} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 print:px-0">
        {/* Privacy Banner */}
        <InsightsPrivacyBanner />

        {/* Summary KPI cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <InsightsSummaryCards insights={filtered} />
        )}

        {/* Export buttons */}
        <div className="flex gap-2 mb-6 print:hidden">
          <Button
            onClick={handleExportCSV}
            disabled={exporting || filtered.length === 0}
            className="h-11 rounded-xl text-sm font-semibold gap-2"
            style={{ background: "#E8530A", color: "#fff" }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="h-11 rounded-xl text-sm font-semibold gap-2"
            style={{ color: "#00172F", borderColor: "#e2e8f0" }}
          >
            <Download className="w-4 h-4" />
            Export PDF (Print)
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-lg font-semibold" style={{ color: "#00172F" }}>No data for selected range</p>
            <p className="text-sm" style={{ color: "#6B7A8D" }}>Try expanding the date filter or adding records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <MonthlyTrendChart data={monthlyTrend} />
            </div>
            <IssueTypesChart data={issueTypes} />
            <AvgCostByTradeChart data={avgCostByTrade} />
            <PropertyCategoryChart data={propertyCategoryData} />
            <UrgencyBreakdownChart data={urgencyData} />
            <div className="md:col-span-2">
              <TopRegionsChart data={topRegions} />
            </div>
          </div>
        )}

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-xs text-center" style={{ color: "#6B7A8D" }}>
          <p>Generated {format(new Date(), "dd MMM yyyy HH:mm")} · UFixi Anonymised Insights Report</p>
          <p>All data is anonymised. No personally identifiable information is included.</p>
        </div>
      </div>
    </div>
  );
}