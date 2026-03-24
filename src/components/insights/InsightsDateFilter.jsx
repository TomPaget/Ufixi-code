import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { subDays, subMonths, startOfYear, format } from "date-fns";

const PRESETS = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last 6 months", value: "6m" },
  { label: "Last 12 months", value: "12m" },
  { label: "This year", value: "ytd" },
  { label: "All time", value: "all" },
];

function getRange(preset) {
  const now = new Date();
  switch (preset) {
    case "7d": return { from: subDays(now, 7), to: now };
    case "30d": return { from: subDays(now, 30), to: now };
    case "3m": return { from: subMonths(now, 3), to: now };
    case "6m": return { from: subMonths(now, 6), to: now };
    case "12m": return { from: subMonths(now, 12), to: now };
    case "ytd": return { from: startOfYear(now), to: now };
    default: return null;
  }
}

export default function InsightsDateFilter({ onRangeChange }) {
  const [selected, setSelected] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [open, setOpen] = useState(false);

  const handlePreset = (preset) => {
    setSelected(preset);
    setOpen(false);
    onRangeChange(getRange(preset));
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      setSelected("custom");
      setOpen(false);
      onRangeChange({ from: new Date(customFrom), to: new Date(customTo) });
    }
  };

  const label = selected === "custom"
    ? `${customFrom} → ${customTo}`
    : PRESETS.find(p => p.value === selected)?.label || "All time";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-medium min-h-[44px]"
        style={{ color: "#00172F" }}
        aria-label="Select date range filter"
      >
        <Calendar className="w-4 h-4" style={{ color: "#E8530A" }} />
        {label}
        <ChevronDown className="w-4 h-4" style={{ color: "#6B7A8D" }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 w-64 p-3">
          <div className="space-y-1 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors min-h-[44px]"
                style={{
                  background: selected === p.value ? "rgba(232,83,10,0.08)" : "transparent",
                  color: selected === p.value ? "#E8530A" : "#1a2f42",
                  fontWeight: selected === p.value ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold mb-2" style={{ color: "#6B7A8D" }}>Custom range</p>
            <div className="space-y-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                aria-label="From date"
              />
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                aria-label="To date"
              />
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 min-h-[44px]"
                style={{ background: "#E8530A" }}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}