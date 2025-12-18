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
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-300"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg text-slate-100">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6 pb-12">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-500/30">
              <User className="w-7 h-7 text-blue-100" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">{user?.full_name || "User"}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/50">
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${isPremium ? "text-amber-400" : "text-slate-500"}`} />
              <span className="font-medium text-slate-200">
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

        {/* User Type */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50"
        >
          <h3 className="font-semibold text-slate-200 mb-4">I am a...</h3>
          
          <RadioGroup 
            value={user?.user_type || "renter"} 
            onValueChange={handleUserTypeChange}
            className="space-y-3"
          >
            <Label
              htmlFor="renter"
              className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500/10"
              data-state={user?.user_type === "renter" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="renter" id="renter" className="sr-only" />
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <Building2 className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-200">Renter</p>
                <p className="text-sm text-slate-400">I rent my home</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${user?.user_type === "renter" ? "border-blue-500 bg-blue-500" : "border-slate-600"}`}>
                {user?.user_type === "renter" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                  </div>
                )}
              </div>
            </Label>

            <Label
              htmlFor="homeowner"
              className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-blue-500/50 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500/10"
              data-state={user?.user_type === "homeowner" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="homeowner" id="homeowner" className="sr-only" />
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                <Home className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-200">Homeowner</p>
                <p className="text-sm text-slate-400">I own my home</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${user?.user_type === "homeowner" ? "border-blue-500 bg-blue-500" : "border-slate-600"}`}>
                {user?.user_type === "homeowner" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
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
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden"
        >
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
          <div className="h-px bg-slate-700/50" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
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
            className="w-full h-12 rounded-xl border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>

        {/* App Version */}
        <p className="text-center text-xs text-slate-500">
          QuoFix v1.0.0
        </p>
      </main>
    </div>
  );
}