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
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAFBFC]/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6B9080] to-[#4A6B5D] flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{user?.full_name || "User"}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Crown className={`w-5 h-5 ${isPremium ? "text-amber-500" : "text-slate-400"}`} />
              <span className="font-medium text-slate-700">
                {isPremium ? "Premium" : "Free Plan"}
              </span>
            </div>
            {!isPremium && (
              <Button 
                size="sm" 
                className="rounded-xl bg-[#6B9080]"
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
          className="bg-white rounded-2xl p-5 border border-slate-100"
        >
          <h3 className="font-semibold text-slate-900 mb-4">I am a...</h3>
          
          <RadioGroup 
            value={user?.user_type || "renter"} 
            onValueChange={handleUserTypeChange}
            className="space-y-3"
          >
            <Label
              htmlFor="renter"
              className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-[#6B9080]/50 data-[state=checked]:border-[#6B9080] data-[state=checked]:bg-[#6B9080]/5"
              data-state={user?.user_type === "renter" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="renter" id="renter" className="sr-only" />
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Renter</p>
                <p className="text-sm text-slate-500">I rent my home</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${user?.user_type === "renter" ? "border-[#6B9080] bg-[#6B9080]" : "border-slate-300"}`}>
                {user?.user_type === "renter" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </Label>

            <Label
              htmlFor="homeowner"
              className="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-[#6B9080]/50 data-[state=checked]:border-[#6B9080] data-[state=checked]:bg-[#6B9080]/5"
              data-state={user?.user_type === "homeowner" ? "checked" : "unchecked"}
            >
              <RadioGroupItem value="homeowner" id="homeowner" className="sr-only" />
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Homeowner</p>
                <p className="text-sm text-slate-500">I own my home</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${user?.user_type === "homeowner" ? "border-[#6B9080] bg-[#6B9080]" : "border-slate-300"}`}>
                {user?.user_type === "homeowner" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
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
          className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
        >
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
          <div className="h-px bg-slate-100" />
          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
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
            className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>

        {/* App Version */}
        <p className="text-center text-xs text-slate-400">
          Kora v1.0.0
        </p>
      </main>
    </div>
  );
}