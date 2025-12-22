import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Home, History, Users, Calendar, Settings, MapPin, MessageCircle, HelpCircle, Briefcase, Mail, LayoutDashboard, Bell, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const customerMenuItems = [
  { icon: Home, label: "Home", page: "Home" },
  { icon: Mail, label: "Messages", page: "Messages" },
  { icon: MessageCircle, label: "Community Forum", page: "Forum" },
  { icon: Briefcase, label: "Trades Account", page: "TradesSignup" },
  { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" },
  { icon: Calendar, label: "Reminders", page: "Reminders" },
  { icon: Home, label: "Home Profile", page: "HomeProfile" },
  { icon: HelpCircle, label: "Support Chat", page: "Support" },
  { icon: Settings, label: "My Account", page: "Settings" }
];

const tradesMenuItems = [
  { icon: Home, label: "Home", page: "Home" },
  { icon: LayoutDashboard, label: "My Dashboard", page: "TradesDashboard" },
  { icon: Settings, label: "Manage Business", page: "ContractorManagement" },
  { icon: Briefcase, label: "My Profile", page: "TradesProfile" },
  { icon: Mail, label: "Messages", page: "Messages" },
  { icon: MessageCircle, label: "Community Forum", page: "Forum" },
  { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" },
  { icon: HelpCircle, label: "Support Chat", page: "Support" },
  { icon: Settings, label: "My Account", page: "Settings" }
];

export default function HamburgerMenu({ isOpen, onClose }) {
  const { theme } = useTheme();
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const menuItems = user?.account_type === "trades" ? tradesMenuItems : customerMenuItems;

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