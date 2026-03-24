import { useMemo } from "react";
import { format } from "date-fns";

export function useInsightsData(insights, dateRange) {
  return useMemo(() => {
    // Apply date filter
    const filtered = dateRange
      ? insights.filter(i => {
          const d = new Date(i.issue_date || i.created_date);
          return d >= dateRange.from && d <= dateRange.to;
        })
      : insights;

    // 1. Issue types
    const typeCounts = {};
    filtered.forEach(i => {
      const key = i.issue_type || "Unknown";
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });
    const issueTypes = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 2. Avg cost by trade
    const tradeCosts = {};
    filtered.forEach(i => {
      const t = i.trade_type || "Other";
      if (!tradeCosts[t]) tradeCosts[t] = { proSum: 0, proN: 0, actualSum: 0, actualN: 0 };
      if (i.pro_cost_estimate) { tradeCosts[t].proSum += i.pro_cost_estimate; tradeCosts[t].proN++; }
      if (i.actual_cost) { tradeCosts[t].actualSum += i.actual_cost; tradeCosts[t].actualN++; }
    });
    const avgCostByTrade = Object.entries(tradeCosts).map(([name, v]) => ({
      name,
      avgProCost: v.proN > 0 ? Math.round(v.proSum / v.proN) : 0,
      avgActualCost: v.actualN > 0 ? Math.round(v.actualSum / v.actualN) : 0,
    }));

    // 3. Property category
    const propCats = {};
    filtered.forEach(i => {
      const k = i.property_category || "other";
      propCats[k] = (propCats[k] || 0) + 1;
    });
    const propertyCategoryData = Object.entries(propCats).map(([name, count]) => ({ name, count }));

    // 4. Urgency
    const urgCounts = {};
    filtered.forEach(i => {
      const k = i.urgency || i.priority || "unknown";
      urgCounts[k] = (urgCounts[k] || 0) + 1;
    });
    const urgencyData = Object.entries(urgCounts).map(([name, count]) => ({ name, count }));

    // 5. Top regions
    const regionCounts = {};
    filtered.forEach(i => {
      const k = i.region || i.postcode_area || "Unknown";
      regionCounts[k] = (regionCounts[k] || 0) + 1;
    });
    const topRegions = Object.entries(regionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 6. Monthly trend
    const monthlyCounts = {};
    filtered.forEach(i => {
      const d = new Date(i.issue_date || i.created_date);
      const key = format(d, "MMM yy");
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });
    // Sort chronologically
    const monthlyTrend = Object.entries(monthlyCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`));

    return { filtered, issueTypes, avgCostByTrade, propertyCategoryData, urgencyData, topRegions, monthlyTrend };
  }, [insights, dateRange]);
}