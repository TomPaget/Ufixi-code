import { AlertTriangle, TrendingUp, MapPin, Wrench, ShieldCheck } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color: "#00172F" }}>{value}</p>
      <p className="text-sm font-medium" style={{ color: "#00172F" }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "#6B7A8D" }}>{sub}</p>}
    </div>
  </div>
);

export default function InsightsSummaryCards({ insights }) {
  const total = insights.length;
  const critical = insights.filter(i => i.priority === "critical" || i.urgency === "fix_now").length;
  const avgCost = insights.filter(i => i.pro_cost_estimate).length > 0
    ? Math.round(insights.filter(i => i.pro_cost_estimate).reduce((s, i) => s + (i.pro_cost_estimate || 0), 0) / insights.filter(i => i.pro_cost_estimate).length)
    : 0;
  const regions = new Set(insights.map(i => i.region || i.postcode_area).filter(Boolean)).size;
  const diyRate = total > 0
    ? Math.round((insights.filter(i => i.repair_method === "diy").length / total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <StatCard icon={TrendingUp} label="Total Issues" value={total.toLocaleString()} sub="in selected period" color="#E8530A" />
      <StatCard icon={AlertTriangle} label="Critical / Urgent" value={critical.toLocaleString()} sub={`${total > 0 ? Math.round((critical/total)*100) : 0}% of total`} color="#ef4444" />
      <StatCard icon={Wrench} label="Avg Pro Cost" value={`£${avgCost}`} sub="professional estimate" color="#D93870" />
      <StatCard icon={MapPin} label="Regions" value={regions.toLocaleString()} sub="unique areas" color="#6366f1" />
      <StatCard icon={ShieldCheck} label="DIY Rate" value={`${diyRate}%`} sub="self-repaired" color="#1D9E75" />
    </div>
  );
}