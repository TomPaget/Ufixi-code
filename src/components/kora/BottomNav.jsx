import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, History, Settings, Wrench } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: Home, page: "Home" },
  { label: "History", icon: History, page: "History" },
  { label: "Find Trades", icon: Wrench, page: "FindTradesmen" },
  { label: "Settings", icon: Settings, page: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(124,111,224,0.15)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        paddingTop: "8px",
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, page }) => {
        const href = createPageUrl(page);
        const isActive =
          location.pathname === href ||
          location.pathname.endsWith(`/${page}`);

        return (
          <Link
            key={page}
            to={href}
            className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all"
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            <Icon
              className="w-5 h-5 transition-colors"
              style={{ color: isActive ? "#7C6FE0" : "#9aa5b4" }}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{ color: isActive ? "#7C6FE0" : "#9aa5b4" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}