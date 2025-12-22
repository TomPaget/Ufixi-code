import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, User, DollarSign, Calendar, FileText, Settings, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import ProfileManagement from "@/components/contractor/ProfileManagement";
import EarningsTracker from "@/components/contractor/EarningsTracker";
import AvailabilityManager from "@/components/contractor/AvailabilityManager";
import DocumentUploader from "@/components/contractor/DocumentUploader";
import BusinessDetails from "@/components/contractor/BusinessDetails";

export default function ContractorManagement() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  if (user?.account_type !== "trades") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-5">
        <div className="text-center">
          <p className="text-slate-400 mb-4">This section is for tradespeople only</p>
          <Button onClick={() => navigate(createPageUrl("TradesSignup"))} className="bg-blue-600 hover:bg-blue-700">
            Join as Tradesperson
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("TradesDashboard"))}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className={cn(
              "text-xl font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Contractor Management
            </h1>
            <p className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Manage your business profile and operations
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn(
            "w-full grid grid-cols-5 mb-6",
            theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
          )}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Availability</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileManagement user={user} />
          </TabsContent>

          <TabsContent value="business">
            <BusinessDetails user={user} />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTracker userId={user?.id} />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManager user={user} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentUploader user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}