import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, Settings, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import MediaUploader from "@/components/kora/MediaUploader";
import IssueCard from "@/components/kora/IssueCard";
import SubscriptionBanner from "@/components/kora/SubscriptionBanner";
import Disclaimer from "@/components/kora/Disclaimer";

const FREE_SCAN_LIMIT = 3;

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState(null);

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
  const scansUsed = user?.scans_used_this_month || 0;
  const scansLeft = FREE_SCAN_LIMIT - scansUsed;
  const canScan = isPremium || scansLeft > 0;

  const handleMediaUpload = async (fileUrl, mediaType) => {
    setUploadedMedia({ url: fileUrl, type: mediaType });
    
    if (!canScan) {
      navigate(createPageUrl("Upgrade"));
      return;
    }

    setAnalyzing(true);

    try {
      const userType = user?.user_type || "renter";
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a home maintenance expert helping ${userType}s understand household issues.
        
Analyze this ${mediaType} of a household problem and provide:
1. A clear, simple title for the issue (2-5 words)
2. A friendly, non-technical explanation that a non-expert would understand (2-3 sentences)
3. Urgency level: "ignore" (cosmetic/minor), "fix_soon" (within weeks), or "fix_now" (immediate safety/damage risk)
4. 2-4 risks if ignored
5. Cost estimates for DIY repair (min and max in USD)
6. Cost estimates for professional repair (min and max in USD)
7. Who is typically responsible: "renter", "landlord", "homeowner", or "varies"
8. 3-5 step-by-step DIY instructions (simple, actionable)
9. If landlord's responsibility, 2-3 talking points for the tenant

Be reassuring but honest. Focus on reducing anxiety while being practical.`,
        file_urls: [fileUrl],
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            explanation: { type: "string" },
            urgency: { type: "string", enum: ["ignore", "fix_soon", "fix_now"] },
            risks: { type: "array", items: { type: "string" } },
            diy_cost_min: { type: "number" },
            diy_cost_max: { type: "number" },
            pro_cost_min: { type: "number" },
            pro_cost_max: { type: "number" },
            responsibility: { type: "string", enum: ["renter", "landlord", "homeowner", "varies"] },
            diy_steps: { type: "array", items: { type: "string" } },
            landlord_talking_points: { type: "array", items: { type: "string" } }
          },
          required: ["title", "explanation", "urgency", "risks", "responsibility"]
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
          scans_used_this_month: scansUsed + 1
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
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAFBFC]/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B9080] to-[#4A6B5D] flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-semibold text-xl text-slate-900">Kora</span>
          </div>
          <Link to={createPageUrl("Settings")}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="w-5 h-5 text-slate-500" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            What's the issue?
          </h1>
          <p className="text-slate-500">
            Take a photo, video, or audio to get help
          </p>
        </motion.div>

        {/* Scanner Section */}
        <AnimatePresence mode="wait">
          {showScanner ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100"
            >
              <MediaUploader 
                onUpload={handleMediaUpload} 
                isLoading={analyzing}
              />
              {!analyzing && (
                <Button
                  variant="ghost"
                  onClick={() => setShowScanner(false)}
                  className="w-full mt-4 text-slate-500"
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
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#6B9080] to-[#5A7D6E] hover:from-[#5A7D6E] hover:to-[#4A6B5D] text-white shadow-lg shadow-[#6B9080]/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="font-semibold">Scan New Issue</span>
              </Button>
              
              {!isPremium && (
                <p className="text-center text-sm text-slate-500 mt-3">
                  {scansLeft > 0 
                    ? `${scansLeft} free scans remaining this month`
                    : "No free scans left"
                  }
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscription Banner for Free Users */}
        {!isPremium && scansLeft <= 1 && (
          <SubscriptionBanner 
            scansLeft={scansLeft}
            onUpgrade={() => navigate(createPageUrl("Upgrade"))}
          />
        )}

        {/* Recent Issues */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Issues
            </h2>
            <Link 
              to={createPageUrl("History")}
              className="text-sm text-[#6B9080] font-medium"
            >
              View All
            </Link>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : issues.length > 0 ? (
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500">No issues scanned yet</p>
              <p className="text-sm text-slate-400 mt-1">
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