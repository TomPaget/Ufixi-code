import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, Menu, Sparkles, Users, Calendar, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import MediaUploader from "@/components/kora/MediaUploader";
import IssueCard from "@/components/kora/IssueCard";
import SubscriptionBanner from "@/components/kora/SubscriptionBanner";
import Disclaimer from "@/components/kora/Disclaimer";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

const FREE_SCAN_LIMIT = 3;

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [showScanner, setShowScanner] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: () => base44.entities.Issue.list("-created_date", 5)
  });

  const createIssueMutation = useMutation({
    mutationFn: (issueData) => base44.entities.Issue.create(issueData),
    onSuccess: (newIssue) => {
      queryClient.invalidateQueries(["issues"]);
      navigate(createPageUrl(`IssueDetail?id=${newIssue.id}`));
    }
  });

  const isPremium = user?.subscription_tier === "premium";
  const totalScansUsed = user?.total_scans_used || 0;
  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - totalScansUsed);
  const canScan = isPremium || scansLeft > 0;
  
  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  const handleMediaUpload = async (fileUrl, mediaType, additionalInfo = {}) => {
    setUploadedMedia({ url: fileUrl, type: mediaType });
    
    if (!canScan) {
      navigate(createPageUrl("Upgrade"));
      return;
    }

    setAnalyzing(true);

    try {
      const userType = user?.user_type || "renter";

      const contextInfo = [
        additionalInfo.description && `User description: ${additionalInfo.description}`,
        additionalInfo.location && `Location: ${additionalInfo.location}`,
        additionalInfo.duration && `Duration: ${additionalInfo.duration}`
      ].filter(Boolean).join("\n");

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a home maintenance expert helping ${userType}s understand household issues.

    ${contextInfo ? `Additional context from user:\n${contextInfo}\n` : ""}

    Analyze this ${mediaType} of a household problem and provide:
      1. A clear, simple title for the issue (2-5 words)
      2. A friendly, non-technical explanation that a non-expert would understand (2-3 sentences)
      3. Urgency level: "ignore" (cosmetic/minor), "fix_soon" (within weeks), or "fix_now" (immediate safety/damage risk)
      4. Severity score from 1-10 where:
      - 1-2: Cosmetic issues, no rush
      - 3-4: Minor issues, can wait weeks/months
      - 5-6: Moderate issues, fix within weeks
      - 7-8: Serious issues, fix within days (e.g., major leaks, electrical sparks)
      - 9-10: CRITICAL EMERGENCY, fix immediately (e.g., gas leaks, flooding, fire hazards)
      Water leaks should typically be 7-9 depending on severity.
      5. Type of tradesman needed (e.g., "plumber", "electrician", "general handyman")
      6. 2-4 risks if ignored
      7. Cost estimates for DIY repair (min and max in ${currency}) - search online for CURRENT, REALISTIC prices from UK trade websites and DIY stores
      8. Cost estimates for professional repair (min and max in ${currency}) - search Checkatrade, Google, and trade websites for CURRENT, REALISTIC hourly rates and job costs in the UK
      9. Who is typically responsible: "renter", "landlord", "homeowner", or "varies"
      10. 3-5 step-by-step DIY instructions (simple, actionable)
      11. If landlord's responsibility, 2-3 talking points for the tenant

      Be reassuring but honest. Focus on reducing anxiety while being practical. 
      IMPORTANT: Use real-time web data to provide accurate, current pricing for the UK market.`,
              file_urls: [fileUrl],
              add_context_from_internet: true,
              response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" },
            urgency: { type: "string", enum: ["ignore", "fix_soon", "fix_now"] },
            severity_score: { type: "number", minimum: 1, maximum: 10 },
            trade_type: { type: "string" },
            risks: { type: "array", items: { type: "string" } },
            diy_cost_min: { type: "number" },
            diy_cost_max: { type: "number" },
            pro_cost_min: { type: "number" },
            pro_cost_max: { type: "number" },
            responsibility: { type: "string", enum: ["renter", "landlord", "homeowner", "varies"] },
            diy_steps: { type: "array", items: { type: "string" } },
            landlord_talking_points: { type: "array", items: { type: "string" } }
          },
          required: ["title", "explanation", "urgency", "severity_score", "trade_type", "risks", "responsibility"]
        }
      });

      // Create the issue
      await createIssueMutation.mutateAsync({
        ...analysis,
        media_url: fileUrl,
        media_type: mediaType,
        status: "active"
      });

      // Update scan count for free users
      if (!isPremium) {
        await base44.auth.updateMe({
          total_scans_used: totalScansUsed + 1
        });
      }

    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
      setShowScanner(false);
      setUploadedMedia(null);
    }
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMenuOpen(true)}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
            theme === "dark"
              ? "bg-[#F7B600] text-[#0F1E2E]"
              : "bg-[#1E3A57] text-white"
          )}>
            Q
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-6 border-2",
            theme === "dark"
              ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
              : "bg-[#57CFA4]/10 border-[#57CFA4]/30"
          )}
        >
          <h1 className={cn(
            "text-2xl font-bold mb-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            What needs fixing?
          </h1>
          <p className={cn(
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Upload media to receive professional assessment
          </p>
        </motion.div>

        {/* Quick Stats */}
        {issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className={cn(
              "rounded-2xl p-4 text-center border",
              theme === "dark"
                ? "bg-[#1E3A57]/50 border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[#F7B600]" />
              <p className={cn(
                "text-xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {issues.filter(i => i.status === "active").length}
              </p>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>Active</p>
            </div>
            <div className={cn(
              "rounded-2xl p-4 text-center border",
              theme === "dark"
                ? "bg-[#1E3A57]/50 border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <Calendar className="w-5 h-5 mx-auto mb-1 text-[#F7B600]" />
              <p className={cn(
                "text-xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {issues.filter(i => i.urgency === "fix_soon").length}
              </p>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>Fix Soon</p>
            </div>
            <div className={cn(
              "rounded-2xl p-4 text-center border",
              theme === "dark"
                ? "bg-[#1E3A57]/50 border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <History className="w-5 h-5 mx-auto mb-1 text-[#57CFA4]" />
              <p className={cn(
                "text-xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {issues.filter(i => i.status === "resolved").length}
              </p>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>Resolved</p>
            </div>
          </motion.div>
        )}

        {/* Scanner Section */}
        <AnimatePresence mode="wait">
          {showScanner ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "rounded-2xl p-5 border",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}
            >
              <MediaUploader 
                onUpload={handleMediaUpload} 
                isLoading={analyzing}
              />
              {!analyzing && (
                <Button
                  variant="ghost"
                  onClick={() => setShowScanner(false)}
                  className={cn(
                    "w-full mt-4",
                    theme === "dark"
                      ? "text-[#57CFA4] hover:bg-[#57CFA4]/10"
                      : "text-[#1E3A57] hover:bg-slate-100"
                  )}
                >
                  Cancel
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                onClick={() => canScan ? setShowScanner(true) : navigate(createPageUrl("Upgrade"))}
                className="w-full h-16 rounded-2xl font-semibold bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57]"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span>Scan New Issue</span>
              </Button>
              
              {!isPremium && (
                <p className={cn(
                  "text-center text-sm mt-3",
                  theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                )}>
                  {scansLeft > 0 
                    ? `${scansLeft} of 3 free scans remaining`
                    : "All free scans used - Upgrade to continue"
                  }
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("Contractors")}>
            <Button
              variant="outline"
              className={cn(
                "w-full h-20 rounded-2xl flex-col gap-2 border",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/20 hover:bg-[#57CFA4]/10 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-[#1E3A57]"
              )}
            >
              <Users className="w-5 h-5 text-[#F7B600]" />
              <span className="text-sm font-medium">Contractors</span>
            </Button>
          </Link>
          <Link to={createPageUrl("Reminders")}>
            <Button
              variant="outline"
              className={cn(
                "w-full h-20 rounded-2xl flex-col gap-2 border",
                theme === "dark"
                  ? "bg-[#1E3A57]/50 border-[#57CFA4]/20 hover:bg-[#57CFA4]/10 text-white"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-[#1E3A57]"
              )}
            >
              <Calendar className="w-5 h-5 text-[#57CFA4]" />
              <span className="text-sm font-medium">Reminders</span>
            </Button>
          </Link>
        </div>

        {/* Subscription Banner for Free Users */}
        {!isPremium && scansLeft <= 1 && (
          <div className={cn(
            "rounded-3xl p-6 shadow-xl",
            theme === "dark"
              ? "bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/30"
              : "bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/30"
          )}>
            <SubscriptionBanner 
              scansLeft={scansLeft}
              onUpgrade={() => navigate(createPageUrl("Upgrade"))}
            />
          </div>
        )}

        {/* Recent Issues */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn(
              "font-semibold flex items-center gap-2",
              theme === "dark" ? "text-slate-200" : "text-slate-900"
            )}>
              <History className={cn(
                "w-5 h-5",
                theme === "dark" ? "text-blue-400" : "text-blue-600"
              )} />
              Recent Issues
            </h2>
            <Link 
              to={createPageUrl("History")}
              className={cn(
                "text-sm font-medium",
                theme === "dark" 
                  ? "text-blue-400 hover:text-blue-300" 
                  : "text-blue-600 hover:text-blue-700"
              )}
            >
              View All
            </Link>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn(
                  "rounded-2xl h-24 animate-pulse",
                  theme === "dark"
                    ? "bg-slate-800 border border-slate-700/50"
                    : "bg-slate-100"
                )} />
              ))}
            </div>
          ) : issues.length > 0 ? (
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className={cn(
              "text-center py-12 rounded-2xl",
              theme === "dark"
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white border border-slate-200"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
              )}>
                <Sparkles className={cn(
                  "w-8 h-8",
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                )} />
              </div>
              <p className={cn(
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>No issues scanned yet</p>
              <p className={cn(
                "text-sm mt-1",
                theme === "dark" ? "text-slate-500" : "text-slate-500"
              )}>
                Tap the button above to get started
              </p>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <Disclaimer />
      </main>
    </div>
  );
}