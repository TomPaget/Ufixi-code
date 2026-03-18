import { useLocation } from "react-router-dom";
import { Home, History, Settings, Wrench } from "lucide-react";
import { useNav } from "@/lib/NavigationContext";

const NAV_ITEMS = [
  { label: "Home",        icon: Home,    path: "/Home" },
  { label: "History",     icon: History, path: "/History" },
  { label: "Find Trades", icon: Wrench,  path: "/FindTradesmen" },
  { label: "Settings",    icon: Settings, path: "/Settings" },
];

export default function BottomNav() {
  const location = useLocation();
  const { switchTab } = useNav();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
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
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const isActive =
          location.pathname === path ||
          location.pathname === "/" && path === "/Home";

        return (
          <button
            key={path}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => switchTab(path)}
            className="flex flex-col items-center gap-0.5 rounded-xl transition-all active:scale-90"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              minWidth: 56,
              minHeight: 48,
              justifyContent: "center",
              background: "transparent",
              border: "none",
              padding: "4px 8px",
              cursor: "pointer",
            }}
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
          </button>
        );
      })}
    </nav>
  );
}