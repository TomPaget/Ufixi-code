import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, Menu, Sparkles, Users, Calendar, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import GuidedIssueFlow from "@/components/kora/GuidedIssueFlow";
import IssueCard from "@/components/kora/IssueCard";
import SubscriptionBanner from "@/components/kora/SubscriptionBanner";
import Disclaimer from "@/components/kora/Disclaimer";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import MaintenanceAlerts from "@/components/kora/MaintenanceAlerts";
import NotificationBell from "@/components/kora/NotificationBell";
import OnboardingTour from "@/components/kora/OnboardingTour";
import FeatureTooltip from "@/components/kora/FeatureTooltip";
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: () => base44.entities.Issue.list("-created_date", 5)
  });

  // Check if user has completed onboarding
  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [user]);

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

  const handleIssueComplete = async (fileUrl, mediaType, additionalInfo = {}) => {
    if (!canScan) {
      navigate(createPageUrl("Upgrade"));
      return;
    }

    setAnalyzing(true);

    try {
      const userType = user?.user_type || "renter";

      const contextInfo = [
        additionalInfo.description && `${additionalInfo.description}`,
        additionalInfo.category && `Category: ${additionalInfo.category}`,
        additionalInfo.location && `Location: ${additionalInfo.location}`,
        additionalInfo.duration && `Duration: ${additionalInfo.duration}`
      ].filter(Boolean).join("\n");

      // Analyze user sentiment and emotional state
      let sentimentData = null;
      if (additionalInfo.description) {
        try {
          const { data: sentiment } = await base44.functions.invoke('analyzeSentiment', {
            text: additionalInfo.description,
            context: 'User submitting home repair issue'
          });
          sentimentData = sentiment.analysis;
        } catch (error) {
          console.error('Sentiment analysis failed:', error);
        }
      }

      // Get similar historical issues for cross-reference
      let historicalInsights = null;
      try {
        const { data: similarData } = await base44.functions.invoke('getSimilarIssues', {
          issueDescription: additionalInfo.description || 'Issue from uploaded media',
          category: additionalInfo.category,
          tradeType: null
        });
        if (similarData.insights) {
          historicalInsights = similarData.insights;
        }
      } catch (error) {
        console.error('Historical analysis failed:', error);
      }

      const userSkillLevel = user?.diy_skill_level || "beginner";

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a certified home maintenance professional with 20+ years of experience conducting detailed property inspections and repairs across all trades.

USER SKILL LEVEL: ${userSkillLevel.toUpperCase()}
CRITICAL: Adapt ALL DIY instructions, terminology, and complexity to match this skill level:
- BEGINNER: Use simple language, explain every term, include prep work, assume no tools owned, detailed safety warnings, step-by-step with images described
- INTERMEDIATE: Moderate detail, assume basic tools, some technical terms OK, focus on technique refinement
- ADVANCED: Concise, technical terminology, assume full toolkit, focus on efficiency and professional standards

      IMPORTANT: Perform an EXHAUSTIVE, PROFESSIONAL-GRADE analysis using visual inspection, technical knowledge, and industry standards.

      ${contextInfo ? `User-Provided Context:\n${contextInfo}\n` : ""}

      ${sentimentData ? `
      USER EMOTIONAL ANALYSIS:
      - Emotional State: ${sentimentData.emotional_state}
      - Sentiment: ${sentimentData.sentiment_score > 0.3 ? 'Positive/Calm' : sentimentData.sentiment_score < -0.3 ? 'Stressed/Anxious' : 'Neutral'}
      - Hidden Concerns: ${sentimentData.hidden_concerns?.join(', ') || 'None detected'}
      - Urgency Indicators: ${sentimentData.urgency_indicators?.join(', ') || 'None'}

      IMPORTANT: Adjust your tone and response based on the user's emotional state. If they're anxious, provide extra reassurance. If they show urgency indicators, acknowledge the time sensitivity.
      ` : ""}

      ${historicalInsights ? `
      HISTORICAL DATA ANALYSIS (${historicalInsights.similar_issue_ids?.length || 0} similar cases):
      - Recommended Approach: ${historicalInsights.recommended_approach}
      - Success Rate: ${historicalInsights.estimated_success_rate}%
      - Key Success Factors: ${historicalInsights.success_factors?.join('; ') || 'N/A'}
      - Warning Signs: ${historicalInsights.warning_signs?.join('; ') || 'None'}
      - Common Patterns: ${historicalInsights.common_patterns?.join('; ') || 'None'}

      LEVERAGE THIS DATA: Use these historical insights to inform your recommendations. If similar cases had high success with DIY, emphasize that. If they required professionals, note why.
      ` : ""}

      CRITICAL SAFETY MANDATE: Prioritize user safety. If ANY aspect suggests electrical hazards, gas leaks, structural instability, water damage, or life-threatening conditions, you MUST explicitly flag this and recommend immediate professional intervention.

      ANALYSIS FRAMEWORK - Complete ALL sections thoroughly:

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      1. VISUAL INSPECTION & DIAGNOSIS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Examine this ${mediaType} with forensic attention to detail. Look for:
      - Primary defect/damage visible
      - Secondary indicators (staining, discoloration, wear patterns, corrosion)
      - Surrounding context clues (age of materials, installation quality)
      - Code violations or safety hazards
      - Environmental factors (moisture, temperature, structural stress)

      Create a precise, professional title (use technical terminology): e.g., "Failed Compression Valve with Mineral Buildup" not "Leaking Tap"

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      2. ROOT CAUSE ANALYSIS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Provide a COMPREHENSIVE 6-8 sentence explanation covering:
      - WHAT is broken/failing (specific component names, materials, mechanisms)
      - WHY it's happening (deterioration, manufacturing defect, installation error, age, environmental factors)
      - HOW the system is supposed to work normally (technical operation)
      - WHAT is currently malfunctioning in the mechanism
      - PROGRESSION: How this issue developed and will worsen over time
      - SECONDARY EFFECTS: What other systems/components this affects
      - TECHNICAL CONTEXT: Industry standards, typical lifespan, common failure modes

      Use proper technical terminology but explain complex terms. Reference building codes where relevant.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      3. SEVERITY ASSESSMENT (1-10 Scale)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Rate with forensic precision:
      - 1-2: Cosmetic only, no functional impact, purely aesthetic
      - 3-4: Minor deterioration, functioning but degraded, can wait months
      - 5-6: Moderate problem, increasing damage risk, fix within 2-4 weeks
      - 7-8: Serious concern, active damage occurring, requires intervention within 48-72 hours
      - 9-10: CRITICAL HAZARD - immediate safety risk, active flooding/fire/gas/electrical danger

      Consider: Safety risk, damage rate, cost escalation, building code violations

      Urgency: "ignore", "fix_soon", "fix_now" (align with severity)

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      4. RISK & CONSEQUENCE ANALYSIS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      List 4-6 specific, detailed risks if not addressed:
      - Timeline: When each risk materializes (days, weeks, months)
      - Impact: Specific damage (structural, safety, financial, health)
      - Cascading effects: What else fails as a result
      - Cost implications: Repair cost escalation percentages
      Example: "Within 2-3 weeks: Persistent moisture will rot the subfloor joists (£800-£1,500 structural repair), potentially causing floor collapse risk and invalidating home insurance claims"

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      5. SPECIALIST TRADE IDENTIFICATION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Specify exact trade: "plumber", "electrician", "gas engineer", "carpenter", "structural engineer", "HVAC technician", etc.
      Include any required certifications: "Gas Safe registered engineer required" or "Part P qualified electrician"

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      6. PROFESSIONAL COST ANALYSIS (${currency})
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Research CURRENT ${user?.country || "UK"} pricing for ${new Date().getFullYear()}:

      DIY Costs (materials only):
      - Minimum: Include basic replacement parts (be specific with actual part names and average prices)
      - Maximum: Include all tools if not owned + premium parts
      - Specify: Detailed parts breakdown with individual costs (e.g., "22mm compression valve £8-£12, PTFE tape £2, adjustable wrench £15 if needed")
      - Timeline: Typical completion time for DIY (e.g., "45 minutes to 2 hours for experienced DIYer")

      Professional Costs (labor + materials):
      - Minimum: Quick fix, standard parts, single visit, normal hours
      - Maximum: Complex repair, emergency callout, premium parts, multiple visits, weekend/evening rates
      - Typical hourly rates: ${user?.country === "UK" ? "£45-£85/hr" : "$60-$120/hr"} depending on trade and urgency
      - Callout fees: ${user?.country === "UK" ? "£50-£100" : "$75-$150"}
      - Timeline: Expected service booking wait time and completion duration (e.g., "2-5 days booking wait, 1-2 hour job")
      - Emergency service: If urgent, note 24/7 emergency rates (typically 150-200% premium)

      Include: VAT/tax considerations, emergency surcharges, weekend rates, parts markup by professionals (typically 15-30%)

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      7. SAFETY WARNINGS & PRECAUTIONS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      List 3-6 CRITICAL safety considerations:
      - Immediate hazards (electrical shock, gas exposure, structural collapse, water damage)
      - Required safety equipment (PPE, tools, protective gear)
      - Isolation requirements (turn off water/gas/electricity)
      - Environmental dangers (mold, asbestos, lead paint)
      - When to evacuate or call emergency services

      Be EXPLICIT about life-threatening risks. Use clear warnings like "⚠️ DANGER", "🔴 STOP", "⛔ DO NOT ATTEMPT"

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      8. WHEN TO CALL A PROFESSIONAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Provide clear criteria for when DIY is NOT appropriate:
      - Complexity indicators: "If you see X, call a professional"
      - Legal/code requirements: Gas Safe, Part P electrical, structural certification
      - Risk thresholds: "If problem affects multiple rooms/floors"
      - Skill level: "Requires advanced plumbing/electrical knowledge"
      - Tool requirements: "Needs specialized equipment costing £500+"
      - Time constraints: "Emergency repairs needed within 24 hours"

      Include specific tradesperson type needed and typical urgency level.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      9. STEP-BY-STEP DIY RESOLUTION GUIDE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Provide 6-10 ACTIONABLE, SKILL-APPROPRIATE steps ONLY if DIY is safe.

      ADAPT TO ${userSkillLevel.toUpperCase()} SKILL LEVEL:
      - BEGINNER: Very detailed, explain every action, include tool names and how to use them, safety reminders each step
      - INTERMEDIATE: Standard detail, assume basic knowledge, focus on technique
      - ADVANCED: Concise, professional language, efficiency-focused
      - Each step: Specific action with measurements, torque specs, techniques, and TIME estimate per step
      - Safety checkpoints: Verify safe conditions before proceeding
      - Pro tips: Techniques to avoid common mistakes
      - Visual checks: "You should see/hear/feel X"
      - Quality verification: How to test the repair worked
      - Time estimates: Per step (e.g., "5-10 mins") and total duration (e.g., "Total: 45-60 minutes")
      - Skill level: Beginner/Intermediate/Advanced with explanation
      - Difficulty rating: 1-10 scale where 1=anyone can do it, 10=requires expert skills
      - STOP points: "If you encounter X, stop immediately and call professional"

      Example: "Step 3 (5-10 mins): ⚠️ SAFETY: Ensure water is OFF and area is dry. Using a 22mm adjustable wrench, turn the compression nut counter-clockwise exactly 1.5 turns. Apply steady pressure to avoid stripping brass threads. You should feel slight resistance then smooth turning. 🔴 STOP if: Nut spins freely (damaged seal) or you see green corrosion - call plumber."

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      10. MATERIALS & TOOLS SPECIFICATION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      List 4-8 specific items for ${user?.country || "UK"} market:
      - Exact product specification (sizes, ratings, standards)
      - Purpose and critical importance
      - Amazon search URL (properly formatted for ${user?.country === "US" ? "amazon.com" : user?.country === "CA" ? "amazon.ca" : user?.country === "AU" ? "amazon.com.au" : "amazon.co.uk"})
      - Current price range in ${currency}
      - Alternatives if not available

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      11. LIABILITY & RESPONSIBILITY (${userType})
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Determine: "renter", "landlord", "homeowner", "varies"
      - Legal basis: Reference tenancy agreements, building codes
      - If landlord responsibility: Provide 3-4 professional communication talking points with specific legal references
      - If tenant responsibility: Explain maintenance obligations
      - Gray areas: Explain when responsibility is disputed

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ANALYSIS STANDARDS:
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ✓ Use precise technical terminology (explain terms)
      ✓ Reference building codes, British Standards (BS), or local codes
      ✓ Include manufacturer specifications where relevant  
      ✓ Cite real-time web research for current pricing
      ✓ Provide measurements, tolerances, specifications
      ✓ Consider ${user?.country || "UK"}-specific regulations and products
      ✓ Account for property type, age, construction methods
      ✓ Professional-grade analysis that would satisfy an insurance claim or surveyor report

      CRITICAL: This analysis may be used for insurance claims, landlord disputes, or contractor quotes. Be thorough, accurate, and professionally credible.`,
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
                  safety_warnings: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Critical safety warnings and precautions" 
                  },
                  call_professional_if: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Specific conditions when professional help is required" 
                  },
                  diy_safe: { 
                    type: "boolean",
                    description: "Whether DIY repair is safe for homeowner to attempt" 
                  },
                  diy_cost_min: { type: "number" },
                  diy_cost_max: { type: "number" },
                  pro_cost_min: { type: "number" },
                  pro_cost_max: { type: "number" },
                  responsibility: { type: "string", enum: ["renter", "landlord", "homeowner", "varies"] },
                  diy_steps: { type: "array", items: { type: "string" } },
                  products_needed: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        amazonSearchUrl: { type: "string" },
                        estimatedCost: { type: "string" }
                      },
                      required: ["name", "description", "amazonSearchUrl"]
                    }
                  },
                  landlord_talking_points: { type: "array", items: { type: "string" } }
                },
                required: ["title", "explanation", "urgency", "severity_score", "trade_type", "risks", "safety_warnings", "call_professional_if", "diy_safe", "responsibility"]
              }
              });

      // Create the issue with sentiment and historical data
      const newIssue = await createIssueMutation.mutateAsync({
        ...analysis,
        media_url: fileUrl,
        media_type: mediaType,
        status: "active",
        sentiment_analysis: sentimentData,
        historical_insights: historicalInsights ? {
          similar_cases_count: historicalInsights.similar_issue_ids?.length || 0,
          recommended_approach: historicalInsights.recommended_approach,
          success_factors: historicalInsights.success_factors,
          estimated_success_rate: historicalInsights.estimated_success_rate
        } : null
      });

      // Update scan count for free users
      if (!isPremium) {
        await base44.auth.updateMe({
          total_scans_used: totalScansUsed + 1
        });
      }

      // Trigger notification for critical issues or fix_now urgency
      if (analysis.severity_score >= 8 || analysis.urgency === 'fix_now') {
        try {
          await base44.functions.invoke('createIssueNotification', {
            issueId: newIssue.id,
            userId: user.id,
            notificationType: analysis.urgency === 'fix_now' ? 'fix_now_urgency' : 'critical_issue'
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      } else {
        // Send regular issue created notification
        try {
          await base44.functions.invoke('createIssueNotification', {
            issueId: newIssue.id,
            userId: user.id,
            notificationType: 'issue_created'
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }

    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
      setShowScanner(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
      
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

          <NotificationBell />
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
            >
              <GuidedIssueFlow 
                onComplete={handleIssueComplete}
                onCancel={() => setShowScanner(false)}
              />
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
          <FeatureTooltip
            title="Find Contractors"
            description="Save and manage your trusted contractors for quick access when you need professional help."
          >
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
          </FeatureTooltip>
          <FeatureTooltip
            title="Maintenance Reminders"
            description="Set up recurring reminders for HVAC filters, smoke detectors, and other routine maintenance tasks."
          >
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
          </FeatureTooltip>
        </div>

        {/* AI Maintenance Predictions */}
        <MaintenanceAlerts userId={user?.id} />

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