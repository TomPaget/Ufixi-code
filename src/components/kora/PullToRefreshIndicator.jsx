import { Loader2 } from "lucide-react";

/**
 * Visual indicator for pull-to-refresh.
 * Renders when pullY > 0 or pullRefreshing is true.
 */
export default function PullToRefreshIndicator({ pullY, pullRefreshing, threshold = 70 }) {
  if (!pullRefreshing && pullY <= 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all"
      style={{ height: pullRefreshing ? 56 : `${pullY}px`, background: "rgba(124,111,224,0.08)" }}
      role="status"
      aria-label={pullRefreshing ? "Refreshing" : "Pull to refresh"}
      aria-live="polite"
    >
      {pullRefreshing ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#7C6FE0]" />
          <span className="text-xs font-semibold text-[#7C6FE0]">Refreshing…</span>
        </div>
      ) : (
        <span className="text-xs font-semibold text-[#7C6FE0]">
          {pullY >= threshold ? "↑ Release to refresh" : "↓ Pull to refresh"}
        </span>
      )}
    </div>
  );
}