import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const COLORS = ["#E8530A", "#D93870", "#F0900A", "#1D9E75", "#6366f1", "#0ea5e9", "#f59e0b", "#10b981"];

const ChartCard = ({ title, children, description }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <h3 className="text-base font-semibold mb-1" style={{ color: "#00172F" }}>{title}</h3>
    {description && <p className="text-xs mb-4" style={{ color: "#6B7A8D" }}>{description}</p>}
    {children}
  </div>
);

export function IssueTypesChart({ data }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  return (
    <ChartCard title="Most Common Issue Types" description="Top 10 issue categories by volume">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7A8D" }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#1a2f42" }} width={110} />
          <Tooltip formatter={(v) => [v, "Issues"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
          <Bar dataKey="count" fill="#E8530A" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AvgCostByTradeChart({ data }) {
  return (
    <ChartCard title="Average Repair Cost by Trade Type" description="Professional estimate vs actual cost (£)">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7A8D" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7A8D" }} tickFormatter={(v) => `£${v}`} />
          <Tooltip formatter={(v) => [`£${Math.round(v)}`, ""]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="avgProCost" name="Avg Pro Cost" fill="#E8530A" radius={[6, 6, 0, 0]} />
          <Bar dataKey="avgActualCost" name="Avg Actual" fill="#D93870" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PropertyCategoryChart({ data }) {
  return (
    <ChartCard title="Issues by Property Category" description="Renter vs owner vs landlord breakdown">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [v, "Issues"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function UrgencyBreakdownChart({ data }) {
  const URGENCY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981", fix_now: "#ef4444", fix_soon: "#f97316", ignore: "#10b981" };
  return (
    <ChartCard title="Urgency Breakdown" description="Distribution of issue urgency levels">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((entry, i) => <Cell key={i} fill={URGENCY_COLORS[entry.name?.toLowerCase()] || COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [v, "Issues"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopRegionsChart({ data }) {
  return (
    <ChartCard title="Top 10 Regions by Issue Volume" description="Partial postcode area or region (no full postcodes)">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7A8D" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7A8D" }} />
          <Tooltip formatter={(v) => [v, "Issues"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MonthlyTrendChart({ data }) {
  return (
    <ChartCard title="Monthly Issue Volume Trend" description="Number of issues recorded per month">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7A8D" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6B7A8D" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
          <Line type="monotone" dataKey="count" stroke="#E8530A" strokeWidth={2.5} dot={{ fill: "#E8530A", r: 4 }} activeDot={{ r: 6 }} name="Issues" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}