import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Home as HomeIcon, History, Users, Calendar, Settings, MapPin, MessageCircle, HelpCircle, Briefcase, Mail, LayoutDashboard, Bell, FileText, Building2, ArrowLeftRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const customerMenuItems = [
  { icon: HomeIcon, label: "Home", page: "Home" },
  { icon: Mail, label: "Messages", page: "Messages" },
  { icon: MessageCircle, label: "Community Forum", page: "Forum" },
  { icon: Building2, label: "Business Membership", page: "BusinessPricing" },
  // { icon: Briefcase, label: "Trades Account", page: "TradesSignup" }, // HIDDEN - Can be re-enabled later
  // { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" }, // HIDDEN - Can be re-enabled later
  { icon: HelpCircle, label: "Support Chat", page: "Support" },
  { icon: Settings, label: "My Account", page: "Settings", submenu: [
    { icon: HomeIcon, label: "Home Profile", page: "HomeProfile" }
  ]}
];

const tradesMenuItems = [
  { icon: HomeIcon, label: "Home", page: "Home" },
  { icon: LayoutDashboard, label: "My Dashboard", page: "TradesDashboard" },
  { icon: Settings, label: "Manage Business", page: "ContractorManagement" },
  { icon: Briefcase, label: "My Profile", page: "TradesProfile" },
  { icon: Mail, label: "Messages", page: "Messages" },
  { icon: MessageCircle, label: "Community Forum", page: "Forum" },
  // { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" }, // HIDDEN - Can be re-enabled later
  { icon: HelpCircle, label: "Support Chat", page: "Support" },
  { icon: Settings, label: "My Account", page: "Settings" }
];

const businessMenuItems = [
  { icon: HomeIcon, label: "Home", page: "Home" },
  { icon: LayoutDashboard, label: "Property Issues", page: "PropertyIssues" },
  { icon: Users, label: "Team Management", page: "TeamManagement" },
  { icon: Settings, label: "Integrations", page: "Integrations" },
  { icon: Mail, label: "Messages", page: "Messages" },
  { icon: Settings, label: "My Account", page: "Settings" }
];

export default function HamburgerMenu({ isOpen, onClose }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const switchAccountMutation = useMutation({
    mutationFn: async (newAccountType) => {
      await base44.auth.updateMe({ account_type: newAccountType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
      onClose();
    }
  });

  const handleSwitchAccount = () => {
    if (user?.account_type === "business") {
      switchAccountMutation.mutate("customer");
    } else if (user?.business_subscription_active) {
      switchAccountMutation.mutate("business");
    }
  };

  const canSwitchToBusiness = user?.business_subscription_active;
  const isBusinessAccount = user?.account_type === "business";

  const menuItems = user?.account_type === "trades" 
    ? tradesMenuItems 
    : user?.account_type === "business"
      ? businessMenuItems
      : customerMenuItems;

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
                  <div key={item.page}>
                    <Link
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
                    {item.submenu && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.page}
                            to={createPageUrl(subitem.page)}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-xl transition-colors text-sm",
                              theme === "dark"
                                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                                : "hover:bg-slate-100 text-slate-700"
                            )}
                          >
                            <subitem.icon className="w-4 h-4" />
                            <span>{subitem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {user?.account_type !== "trades" && (isBusinessAccount || canSwitchToBusiness) && (
                <div className="mt-6 pt-6 border-t border-slate-200/20">
                  <Button
                    onClick={handleSwitchAccount}
                    disabled={switchAccountMutation.isPending}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 rounded-xl font-medium",
                      theme === "dark"
                        ? "bg-[#57CFA4]/20 text-[#57CFA4] hover:bg-[#57CFA4]/30"
                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    )}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    {isBusinessAccount ? "Switch to Standard Account" : "Switch to Business Account"}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}