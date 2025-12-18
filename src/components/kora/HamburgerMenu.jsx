import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Home, History, Users, Calendar, Settings, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "Home", page: "Home" },
  { icon: History, label: "History", page: "History" },
  { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" },
  { icon: Users, label: "My Contractors", page: "Contractors" },
  { icon: Calendar, label: "Reminders", page: "Reminders" },
  { icon: Settings, label: "Settings", page: "Settings" }
];

export default function HamburgerMenu({ isOpen, onClose }) {
  const { theme } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25 }}
            className={cn(
              "fixed left-0 top-0 bottom-0 w-72 z-50",
              theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
            )}
          >
            <div className="p-5">
              <button
                onClick={onClose}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-8",
                  theme === "dark"
                    ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      theme === "dark"
                        ? "hover:bg-[#57CFA4]/10 text-white"
                        : "hover:bg-slate-100 text-slate-900"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5",
                      theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
                    )} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}