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
  // { icon: Mail, label: "Messages", page: "Messages" }, // HIDDEN - Will be re-enabled later
  // { icon: MessageCircle, label: "Community Forum", page: "Forum" }, // HIDDEN - Will be re-enabled later
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
  // { icon: Mail, label: "Messages", page: "Messages" }, // HIDDEN - Will be re-enabled later
  // { icon: MessageCircle, label: "Community Forum", page: "Forum" }, // HIDDEN - Will be re-enabled later
  // { icon: MapPin, label: "Find Tradesmen", page: "FindTradesmen" }, // HIDDEN - Can be re-enabled later
  { icon: HelpCircle, label: "Support Chat", page: "Support" },
  { icon: Settings, label: "My Account", page: "Settings" }
];

const businessMenuItems = [
  { icon: HomeIcon, label: "Home", page: "Home" },
  { icon: LayoutDashboard, label: "Property Issues", page: "PropertyIssues" },
  { icon: Users, label: "Team Management", page: "TeamManagement" },
  { icon: Settings, label: "Integrations", page: "Integrations" },
  // { icon: Mail, label: "Messages", page: "Messages" }, // HIDDEN - Will be re-enabled later
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
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-72 z-50"
            style={{
              background: 'linear-gradient(160deg, rgba(26,47,66,0.97) 0%, rgba(30,58,87,0.99) 100%)',
              backdropFilter: 'blur(30px)',
              boxShadow: '4px 0 40px rgba(0,0,0,0.25)'
            }}
          >
            <div className="p-5">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-8 bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <nav className="space-y-1">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.page}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Link
                      to={createPageUrl(item.page)}
                      onClick={onClose}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95 hover:bg-white/10 text-white"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10">
                        <item.icon className="w-5 h-5 text-[#63c49f]" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                    {item.submenu && (
                      <div className="ml-12 mt-1 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.page}
                            to={createPageUrl(subitem.page)}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 rounded-xl transition-all text-sm hover:bg-white/10 text-white/70"
                          >
                            <subitem.icon className="w-4 h-4 text-[#63c49f]" />
                            <span>{subitem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </nav>

              {user?.account_type !== "trades" && (isBusinessAccount || canSwitchToBusiness) && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Button
                    onClick={handleSwitchAccount}
                    disabled={switchAccountMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20"
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