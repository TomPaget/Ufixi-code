import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Home, 
  Building2, 
  Crown, 
  LogOut,
  ChevronRight,
  User,
  Shield,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user"]);
    }
  });

  const handleUserTypeChange = (value) => {
    updateUserMutation.mutate({ user_type: value });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isPremium = user?.subscription_tier === "premium";

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark"
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-10 backdrop-blur-lg border-b",
        theme === "dark"
          ? "bg-slate-900/80 border-slate-700/50"
          : "bg-white/80 border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-slate-800 text-slate-400 hover:text-slate-300"
                : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
            )}
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-semibold text-lg",
            theme === "dark" ? "text-slate-100" : "text-slate-900"
          )}>Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-slate-800 border-slate-700/50"
              : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
              theme === "dark"
                ? "bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/30 border border-blue-500/30"
                : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20 border border-blue-400/30"
            )}>
              <User className={cn(
                "w-7 h-7",
                theme === "dark" ? "text-blue-100" : "text-white"
              )} />
            </div>
            <div>
              <h2 className={cn(
                "font-semibold",
                theme === "dark" ? "text-slate-100" : "text-slate-900"
              )}>{user?.full_name || "User"}</h2>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>{user?.email}</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center justify-between p-3 rounded-xl border",
            theme === "dark"
              ? "bg-slate-700/50 border-slate-600/50"
              : "bg-slate-50 border-slate-200"
          )}>
            <div className="flex items-center gap-3">
              <Crown className={cn(
                "w-5 h-5",
                isPremium
                  ? "text-amber-500"
                  : theme === "dark" ? "text-slate-500" : "text-slate-400"
              )} />
              <span className={cn(
                "font-medium",
                theme === "dark" ? "text-slate-200" : "text-slate-700"
              )}>
                {isPremium ? "Premium Member" : "Free Plan"}
              </span>
            </div>
            {!isPremium && (
              <Button 
                size="sm" 
                className="rounded-xl bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate(createPageUrl("Upgrade"))}
              >
                Upgrade
              </Button>
            )}
          </div>
        </motion.section>

        {/* Theme Toggle */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-slate-800 border-slate-700/50"
              : "bg-white border-slate-200"
          )}
        >
          <h3 className={cn(
            "font-semibold mb-4",
            theme === "dark" ? "text-slate-200" : "text-slate-900"
          )}>Appearance</h3>
          
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
              theme === "dark"
                ? "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                : "border-blue-500 bg-blue-50 hover:bg-blue-100"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              theme === "dark"
                ? "bg-blue-600/20 border border-blue-500/30"
                : "bg-blue-500/20 border border-blue-400/30"
            )}>
              {theme === "dark" ? (
                <Moon className="w-6 h-6 text-blue-400" />
              ) : (
                <Sun className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className={cn(
                "font-medium",
                theme === "dark" ? "text-slate-200" : "text-slate-900"
              )}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </p>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>
                Tap to switch to {theme === "dark" ? "light" : "dark"} mode
              </p>
            </div>
          </button>
        </motion.section>

        {/* User Type */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-slate-800 border-slate-700/50"
              : "bg-white border-slate-200"
          )}
        >
          <h3 className={cn(
            "font-semibold mb-4",
            theme === "dark" ? "text-slate-200" : "text-slate-900"
          )}>I am a...</h3>
          
          <RadioGroup 
            value={user?.user_type || "renter"} 
            onValueChange={handleUserTypeChange}
            className="space-y-3"
          >
            <Label
              htmlFor="renter"
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500",
                theme === "dark"
                  ? "data-[state=checked]:bg-blue-500/10"
                  : "data-[state=checked]:bg-blue-50"
              )}
              data-state={user?.user_type === "renter" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="renter" id="renter" className="sr-only" />
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                theme === "dark"
                  ? "bg-teal-500/20 border-teal-500/30"
                  : "bg-teal-100 border-teal-200"
              )}>
                <Building2 className={cn(
                  "w-6 h-6",
                  theme === "dark" ? "text-teal-400" : "text-teal-600"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  theme === "dark" ? "text-slate-200" : "text-slate-900"
                )}>Renter</p>
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                )}>I rent my home</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2",
                user?.user_type === "renter"
                  ? "border-blue-500 bg-blue-500"
                  : theme === "dark" ? "border-slate-600" : "border-slate-300"
              )}>
                {user?.user_type === "renter" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )} />
                  </div>
                )}
              </div>
            </Label>

            <Label
              htmlFor="homeowner"
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500",
                theme === "dark"
                  ? "data-[state=checked]:bg-blue-500/10"
                  : "data-[state=checked]:bg-blue-50"
              )}
              data-state={user?.user_type === "homeowner" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="homeowner" id="homeowner" className="sr-only" />
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border",
                theme === "dark"
                  ? "bg-violet-500/20 border-violet-500/30"
                  : "bg-violet-100 border-violet-200"
              )}>
                <Home className={cn(
                  "w-6 h-6",
                  theme === "dark" ? "text-violet-400" : "text-violet-600"
                )} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  theme === "dark" ? "text-slate-200" : "text-slate-900"
                )}>Homeowner</p>
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-slate-400" : "text-slate-600"
                )}>I own my home</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2",
                user?.user_type === "homeowner"
                  ? "border-blue-500 bg-blue-500"
                  : theme === "dark" ? "border-slate-600" : "border-slate-300"
              )}>
                {user?.user_type === "homeowner" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )} />
                  </div>
                )}
              </div>
            </Label>
          </RadioGroup>
        </motion.section>

        {/* About & Legal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={cn(
            "rounded-2xl border overflow-hidden",
            theme === "dark"
              ? "bg-slate-800 border-slate-700/50"
              : "bg-white border-slate-200"
          )}
        >
          <button className={cn(
            "w-full flex items-center justify-between p-4 transition-colors",
            theme === "dark"
              ? "hover:bg-slate-700/50"
              : "hover:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Shield className={cn(
                "w-5 h-5",
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              )} />
              <span className={cn(
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              )}>Privacy Policy</span>
            </div>
            <ChevronRight className={cn(
              "w-5 h-5",
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            )} />
          </button>
          <div className={cn(
            "h-px",
            theme === "dark" ? "bg-slate-700/50" : "bg-slate-200"
          )} />
          <button className={cn(
            "w-full flex items-center justify-between p-4 transition-colors",
            theme === "dark"
              ? "hover:bg-slate-700/50"
              : "hover:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Shield className={cn(
                "w-5 h-5",
                theme === "dark" ? "text-slate-400" : "text-slate-500"
              )} />
              <span className={cn(
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              )}>Terms of Service</span>
            </div>
            <ChevronRight className={cn(
              "w-5 h-5",
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            )} />
          </button>
        </motion.section>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={handleLogout}
            className={cn(
              "w-full h-12 rounded-xl transition-colors",
              theme === "dark"
                ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            )}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>

        {/* Language & Currency */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1E3A57]/50 border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}
        >
          <h3 className={cn(
            "font-semibold mb-4",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Language & Currency</h3>
          
          <div className="space-y-3">
            <div>
              <Label className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                Language
              </Label>
              <Select 
                value={user?.language || "en"} 
                onValueChange={(val) => updateUserMutation.mutate({ language: val })}
              >
                <SelectTrigger className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={cn(theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
                Currency
              </Label>
              <Select 
                value={user?.currency || "GBP"} 
                onValueChange={(val) => updateUserMutation.mutate({ currency: val })}
              >
                <SelectTrigger className={cn(
                  "mt-1",
                  theme === "dark"
                    ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.section>

        {/* App Version */}
        <p className={cn(
          "text-center text-xs",
          theme === "dark" ? "text-[#57CFA4]/50" : "text-[#1E3A57]/40"
        )}>
          QuoFix v1.0.0
        </p>
      </main>
    </div>
  );
}