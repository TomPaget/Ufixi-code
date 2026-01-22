import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, History, Menu, Sparkles, Users, Calendar, TrendingUp, Loader2, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import GuidedIssueFlow from "@/components/kora/GuidedIssueFlow";
import IssueCard from "@/components/kora/IssueCard";
import Disclaimer from "@/components/kora/Disclaimer";
import AdBreak from "@/components/kora/AdBreak";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import Header from "@/components/kora/Header";
import NotificationBell from "@/components/kora/NotificationBell";
import OnboardingTour from "@/components/kora/OnboardingTour";
import FeatureTooltip from "@/components/kora/FeatureTooltip";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { getGradientStyle, getBackdropFilter, getBoxShadow, getBorderColor } from "@/components/kora/gradientThemes";

const FREE_SCAN_LIMIT = 2;

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [showScanner, setShowScanner] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showAdBreak, setShowAdBreak] = useState(false);
  const [pendingIssueData, setPendingIssueData] = useState(null);

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

  const totalScansUsed = user?.total_scans_used || 0;
  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - totalScansUsed);
  const needsPayment = scansLeft === 0;
  
  const currency = user?.currency || "GBP";
  const currencySymbol = { GBP: "£", USD: "$", EUR: "€" }[currency];

  const handlePayAndScan = async () => {
    setProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Payment successful, allow scan
      setShowPaymentDialog(false);
      setProcessingPayment(false);
      setShowScanner(true);
    } catch (error) {
      console.error('Payment failed:', error);
      setProcessingPayment(false);
    }
  };

  const handleIssueComplete = async (fileUrl, mediaType, additionalInfo = {}) => {
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

      // Gather additional context
      const currentDate = new Date();
      const season = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'][currentDate.getMonth()];
      const propertyAge = user?.property_age || 'unknown';
      const propertyType = user?.property_type || 'unknown';
      const location = user?.postcode || user?.country || 'UK';

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a MASTER DIAGNOSTICIAN - a certified home maintenance professional with 20+ years conducting forensic property inspections, certified across all trades (Gas Safe, NICEIC, CIPHE), with expertise in building pathology and failure analysis.

      ═══════════════════════════════════════════════
      PROPERTY & USER CONTEXT
      ═══════════════════════════════════════════════
      • User Skill Level: ${userSkillLevel.toUpperCase()}
      • Property Type: ${propertyType}
      • Property Age: ${propertyAge} years
      • Location: ${location}
      • Current Season: ${season} ${currentDate.getFullYear()}
      • Analysis Date: ${currentDate.toLocaleDateString()}

      ═══════════════════════════════════════════════
      SKILL-ADAPTIVE COMMUNICATION
      ═══════════════════════════════════════════════
      ${userSkillLevel === 'beginner' ? `
      BEGINNER MODE:
      ✓ Use everyday language, avoid jargon
      ✓ Explain every technical term in brackets
      ✓ Include detailed prep work and tool explanations
      ✓ Assume NO tools owned - list everything needed
      ✓ Extra safety warnings at each step
      ✓ Describe what success looks/sounds/feels like
      ✓ Include time estimates per step
      ` : userSkillLevel === 'intermediate' ? `
      INTERMEDIATE MODE:
      ✓ Use technical terms with brief explanations
      ✓ Assume basic toolkit (screwdrivers, pliers, drill)
      ✓ Focus on proper technique and common mistakes
      ✓ Standard safety protocols
      ✓ Include pro tips and efficiency improvements
      ` : `
      ADVANCED MODE:
      ✓ Professional technical terminology
      ✓ Assume full professional toolkit
      ✓ Focus on efficiency, code compliance, warranty
      ✓ Advanced diagnostics and troubleshooting
      ✓ Industry best practices and standards
      `}

      ═══════════════════════════════════════════════
      DIAGNOSTIC METHODOLOGY
      ═══════════════════════════════════════════════
      CRITICAL: Perform FORENSIC-LEVEL analysis using:

      1. VISUAL FORENSICS
         - Macro inspection: Overall condition, age indicators
         - Micro inspection: Surface defects, wear patterns, corrosion
         - Material identification: Composition, grade, quality
         - Installation assessment: Workmanship, code compliance
         - Environmental factors: Moisture, temperature, stress indicators
         - Photographic evidence analysis: Lighting, angles, surrounding context

      2. TEMPORAL ANALYSIS
         - Seasonal relevance (${season}): Weather impact, temperature effects
         - Property age context (${propertyAge} years): Expected lifespan, typical failures
         - Failure progression timeline: How long has this been developing?
         - Maintenance history indicators: Visible repairs, modifications

      3. SYSTEMIC EVALUATION
         - Primary failure point identification
         - Secondary damage cascade assessment
         - Upstream/downstream system impacts
         - Load factors and stress analysis

      4. BUILDING SCIENCE
         - Building regulations compliance (${user?.country || 'UK'} standards)
         - Property type considerations (${propertyType})
         - Structural implications
         - Energy efficiency impacts

      ═══════════════════════════════════════════════
      USER-PROVIDED CONTEXT
      ═══════════════════════════════════════════════
      ${contextInfo ? contextInfo : "No additional context provided"}

      ═══════════════════════════════════════════════
      USER EMOTIONAL & URGENCY ASSESSMENT
      ═══════════════════════════════════════════════
      ${sentimentData ? `
      • Emotional State: ${sentimentData.emotional_state}
      • Stress Level: ${sentimentData.sentiment_score > 0.3 ? 'Low (Calm)' : sentimentData.sentiment_score < -0.3 ? 'High (Anxious/Stressed)' : 'Moderate'}
      • Hidden Concerns: ${sentimentData.hidden_concerns?.join(', ') || 'None detected'}
      • Urgency Indicators: ${sentimentData.urgency_indicators?.join(', ') || 'None detected'}

      ⚠️ TONE ADAPTATION REQUIRED:
      ${sentimentData.sentiment_score < -0.3 ? '→ User is stressed - provide reassurance, clear action steps, emphasize safety' : ''}
      ${sentimentData.urgency_indicators?.length > 0 ? '→ User shows urgency - acknowledge time sensitivity, prioritize quick wins' : ''}
      ` : "No emotional data available"}

      ═══════════════════════════════════════════════
      HISTORICAL DATA & PATTERN RECOGNITION
      ═══════════════════════════════════════════════
      ${historicalInsights ? `
      📊 Database Analysis: ${historicalInsights.similar_issue_ids?.length || 0} similar cases reviewed

      • Recommended Approach: ${historicalInsights.recommended_approach}
      • DIY Success Rate: ${historicalInsights.estimated_success_rate}%
      • Critical Success Factors:
        ${historicalInsights.success_factors?.map(f => `  ✓ ${f}`).join('\n  ') || '  N/A'}
      • Warning Signs from Past Cases:
        ${historicalInsights.warning_signs?.map(w => `  ⚠️ ${w}`).join('\n  ') || '  None'}
      • Common Failure Patterns:
        ${historicalInsights.common_patterns?.map(p => `  → ${p}`).join('\n  ') || '  None identified'}

      🎯 EVIDENCE-BASED RECOMMENDATION:
      Use this data to validate your diagnosis. If historical success rate is <60%, strongly recommend professional. If >85%, DIY is proven viable with proper guidance.
      ` : "⚠️ No historical comparison data available - base recommendations on industry standards only"}

      ═══════════════════════════════════════════════
      ⚠️ CRITICAL SAFETY MANDATE ⚠️
      ═══════════════════════════════════════════════
      Your PRIMARY duty is user safety. If ANY indication of:
      • Electrical hazards (exposed wires, burning smell, sparking)
      • Gas-related issues (smell, appliance malfunction, yellow flames)
      • Structural compromise (cracks in load-bearing walls, sagging)
      • Active water damage (flooding, major leaks, sewage)
      • Immediate health risks (mold, asbestos, CO)

      → You MUST set diy_safe: false
      → You MUST flag with "🔴 EMERGENCY - CALL PROFESSIONAL IMMEDIATELY"
      → You MUST provide specific emergency contact guidance

      ═══════════════════════════════════════════════
      COMPREHENSIVE ANALYSIS FRAMEWORK
      ═══════════════════════════════════════════════

      ┌─────────────────────────────────────────────┐
      │ 1. FORENSIC VISUAL DIAGNOSIS                │
      └─────────────────────────────────────────────┘

      Analyze this ${mediaType} with EXPERT precision:

      A. PRIMARY OBSERVATION
         - Main defect/failure point (be SPECIFIC with component names)
         - Damage extent and severity
         - Material type and condition
         - Age/wear indicators

      B. SECONDARY INDICATORS
         - Staining patterns → water path, leak duration
         - Discoloration → heat damage, chemical exposure, age
         - Corrosion/rust → moisture presence, material degradation
         - Wear patterns → frequency of use, mechanical stress

      C. CONTEXTUAL CLUES
         - Installation quality (professional vs DIY)
         - Surrounding materials and their condition
         - Building code compliance or violations
         - Recent modifications or repairs visible

      D. ENVIRONMENTAL FACTORS
         - Moisture presence or staining
         - Temperature indicators (warping, expansion)
         - Seasonal relevance (${season} conditions)
         - Structural stress or movement

      E. SAFETY HAZARDS IDENTIFICATION
         - Electrical risks (exposed wires, water near electrics)
         - Gas risks (appliances, pipes, connections)
         - Structural risks (load-bearing damage, instability)
         - Health risks (mold, asbestos in older properties)

      📝 DIAGNOSTIC TITLE:
      Create a PRECISE, TECHNICAL title using proper terminology:
      ✓ GOOD: "Failed Ceramic Disc Cartridge in Kitchen Mixer Tap with Limescale Buildup"
      ✗ BAD: "Leaking Tap"
      ✓ GOOD: "Vertical Stress Crack in Load-Bearing Wall Above Door Frame"
      ✗ BAD: "Cracked Wall"

      ┌─────────────────────────────────────────────┐
      │ 2. ROOT CAUSE & FAILURE ANALYSIS            │
      └─────────────────────────────────────────────┘

      Provide a COMPREHENSIVE 8-10 sentence technical explanation:

      1️⃣ COMPONENT IDENTIFICATION
         - WHAT specific component/system has failed
         - Exact materials involved (brass, copper, PVC, etc.)
         - Mechanism type and how it functions normally

      2️⃣ FAILURE CAUSATION
         - WHY it's failing (root cause, not just symptom)
         - Contributing factors: age (${propertyAge} yrs), installation quality, environmental
         - Was this preventable? Maintenance failures?

      3️⃣ NORMAL VS CURRENT OPERATION
         - HOW the system should work (technical operation)
         - WHAT is currently malfunctioning in the mechanism
         - Specific failure mode (wear, fracture, corrosion, blockage)

      4️⃣ FAILURE PROGRESSION TIMELINE
         - When did this likely start developing?
         - Current stage of failure (early, moderate, advanced)
         - Projected worsening if left unaddressed

      5️⃣ CASCADE EFFECTS
         - What OTHER systems does this impact?
         - Secondary damage occurring or likely
         - Knock-on failures possible

      6️⃣ TECHNICAL STANDARDS
         - Industry typical lifespan for this component
         - ${user?.country || 'UK'} building regulations context
         - Common failure modes for this type
         - Manufacturer specifications if applicable

      Use technical terminology BUT explain complex terms in [brackets] for clarity.

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

      **CRITICAL INSTRUCTIONS FOR PRODUCT RECOMMENDATIONS:**
      - Research ACTUAL popular products currently available on Amazon
      - Include SPECIFIC brand names and model numbers (e.g., "Bosch PSB 1800 LI-2", "Wickes Trade Series Adjustable Wrench")
      - Recommend BEST-SELLING, highly-rated products (4+ stars, hundreds of reviews)
      - Provide accurate estimated prices based on current market rates
      - Create proper Amazon search URLs using exact product names
      - Format: https://${user?.country === "US" ? "amazon.com" : user?.country === "CA" ? "amazon.ca" : user?.country === "AU" ? "amazon.com.au" : "amazon.co.uk"}/s?k=[URL-encoded exact product name]

      For each product:
      - Name: Include brand + model/product line (e.g., "Stanley FatMax Tape Measure 8m")
      - Description: Why this specific product is ideal for this repair
      - Estimated Cost: Realistic current price range
      - Amazon URL: Direct search for the specific product

      PRIORITY: Choose products that:
      1. Are consistently available and well-stocked
      2. Have excellent reviews (4+ stars)
      3. Are from reputable brands (Stanley, Bosch, DeWalt, Screwfix own-brand, etc.)
      4. Represent best value for quality
      5. Are appropriate for ${userSkillLevel} skill level

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

      // Store issue data and show ad break instead of navigating immediately
      setPendingIssueData({
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
        } : null,
        property_name: additionalInfo.propertyName,
        property_address: additionalInfo.propertyAddress,
        property_category: additionalInfo.propertyCategory,
        scanned_by_name: user?.full_name
      });
      setShowAdBreak(true);

    } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        setAnalyzing(false);
        setShowScanner(false);
      }
    };

    const handleAdComplete = async () => {
      setShowAdBreak(false);

      if (!pendingIssueData) return;

      try {
        // Create the issue with stored data
        const newIssue = await createIssueMutation.mutateAsync(pendingIssueData);

        // Update scan count
        await base44.auth.updateMe({
          total_scans_used: totalScansUsed + 1
        });

        // Calculate AI-powered priority
        try {
          await base44.functions.invoke('calculateIssuePriority', {
            issueId: newIssue.id
          });
        } catch (error) {
          console.error('Failed to calculate priority:', error);
        }

        // Trigger notification
        if (pendingIssueData.severity_score >= 8 || pendingIssueData.urgency === 'fix_now') {
          try {
            await base44.functions.invoke('createIssueNotification', {
              issueId: newIssue.id,
              userId: user.id,
              notificationType: pendingIssueData.urgency === 'fix_now' ? 'fix_now_urgency' : 'critical_issue'
            });
          } catch (error) {
            console.error('Failed to send notification:', error);
          }
        } else {
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

        navigate(createPageUrl(`IssueDetail?id=${newIssue.id}`));
        setPendingIssueData(null);
      } catch (error) {
        console.error("Failed to create issue:", error);
      }
    };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated liquid gradient background */}
      <div className="fixed inset-0 -z-10" style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #2a3f5f 0%, #3d5a7a 25%, #4a3d6f 50%, #5f4a5a 75%, #3d2f4a 100%)'
          : 'linear-gradient(to-br, #f1f5f9, #f8fafc)'
      }}>
        {theme === 'dark' ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400/85 via-sky-300/80 to-white/60 animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/55 via-orange-300/75 to-white/50 animate-gradient-shift-slow blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/80 via-white/75 to-blue-400/80 animate-gradient-shift-reverse blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tl from-orange-200/65 via-sky-200/60 to-white/55 animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-300/65 via-yellow-200/45 to-transparent animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#051a34]/50 via-transparent to-orange-700/55 animate-gradient-shift-slow blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-bl from-orange-700/60 via-transparent to-[#051a34]/45 animate-gradient-shift-reverse blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-400/85 via-sky-300/80 to-white/60 animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/55 via-orange-300/75 to-white/50 animate-gradient-shift-slow blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/80 via-white/75 to-blue-400/80 animate-gradient-shift-reverse blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tl from-orange-200/65 via-sky-200/60 to-white/55 animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-orange-300/65 via-yellow-200/45 to-transparent animate-gradient-shift blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#051a34]/50 via-transparent to-orange-700/55 animate-gradient-shift-slow blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-bl from-orange-700/60 via-transparent to-[#051a34]/45 animate-gradient-shift-reverse blur-3xl" />
          </>
        )}
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1.5) rotate(0deg); }
          20% { transform: translate(30%, 35%) scale(1.7) rotate(8deg); }
          40% { transform: translate(-25%, 40%) scale(1.6) rotate(-12deg); }
          60% { transform: translate(-35%, -20%) scale(1.8) rotate(15deg); }
          80% { transform: translate(20%, -40%) scale(1.55) rotate(-10deg); }
          100% { transform: translate(0%, 0%) scale(1.5) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1.6) rotate(0deg); }
          25% { transform: translate(-45%, 40%) scale(1.8) rotate(-15deg); }
          50% { transform: translate(35%, -30%) scale(1.5) rotate(12deg); }
          75% { transform: translate(-30%, -45%) scale(1.75) rotate(-10deg); }
          100% { transform: translate(0%, 0%) scale(1.6) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1.55) rotate(0deg); }
          33% { transform: translate(50%, -35%) scale(1.7) rotate(18deg); }
          66% { transform: translate(-40%, 30%) scale(1.65) rotate(-14deg); }
          100% { transform: translate(0%, 0%) scale(1.55) rotate(0deg); }
        }

        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 15s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 10s ease-in-out infinite;
        }
      `}</style>
      
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}

      {showAdBreak && pendingIssueData && (
        <AdBreak 
          onAdComplete={handleAdComplete}
          issueTitle={pendingIssueData.title}
        />
      )}

      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <Header onMenuClick={() => setMenuOpen(true)} />

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold mt-8 mb-6">
            <span className="whitespace-nowrap font-bold text-white" style={{ fontFamily: "'Fredoka', sans-serif" }}>What needs</span>{" "}
            <span className="bg-gradient-to-r from-green-300 to-yellow-400 bg-clip-text text-transparent font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              fixing?
            </span>
          </h1>
          <p className="text-base max-w-2xl mx-auto text-white font-medium">
            Upload a photo or video of any issue and get an instant professional assessment with repair guidance.
          </p>
        </div>

        {/* Quick Stats */}
        {issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="rounded-2xl p-4 text-center border bg-white/60 backdrop-blur-md border-slate-200">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-[#63c49f]" />
              <p className="text-xl font-bold text-[#1a2f42]">
                {issues.filter(i => i.status === "active").length}
              </p>
              <p className="text-xs text-[#1a2f42]/80 font-semibold">Active</p>
            </div>
            <div className="rounded-2xl p-4 text-center border bg-white/60 backdrop-blur-md border-slate-200">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-[#63c49f]" />
              <p className="text-xl font-bold text-[#1a2f42]">
                {issues.filter(i => i.urgency === "fix_soon").length}
              </p>
              <p className="text-xs text-[#1a2f42]/80 font-semibold">Fix Soon</p>
            </div>
            <div className="rounded-2xl p-4 text-center border bg-white/60 backdrop-blur-md border-slate-200">
              <History className="w-5 h-5 mx-auto mb-1 text-[#63c49f]" />
              <p className="text-xl font-bold text-[#1a2f42]">
                {issues.filter(i => i.status === "resolved").length}
              </p>
              <p className="text-xs text-[#1a2f42]/80 font-semibold">Resolved</p>
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
              <div
                onClick={() => needsPayment ? setShowPaymentDialog(true) : setShowScanner(true)}
                className="w-full h-16 rounded-2xl font-semibold text-[#0F1E2E] cursor-pointer flex items-center justify-center gap-2 border-2 relative overflow-hidden group transition-all hover:shadow-lg hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, rgba(40,250,140,0.95) 0%, rgba(40,250,140,0.75) 40%, rgba(40,250,140,0.6) 100%)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderColor: 'rgba(40,250,140,0.95)',
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{
                  background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(87,207,164,0.5) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
                <Plus className="w-5 h-5 relative z-10 text-white" />
                <span className="relative z-10 text-white">{needsPayment ? 'Pay £0.99 to Scan' : 'Scan New Issue'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl("FindTradesmen")}>
            <div
              className="w-full h-20 rounded-2xl flex flex-col gap-2 border-2 items-center justify-center hover:shadow-lg transition-all cursor-pointer"
              style={{
                background: getGradientStyle(theme, 'main'),
                backdropFilter: getBackdropFilter(),
                WebkitBackdropFilter: getBackdropFilter(),
                boxShadow: getBoxShadow('main'),
                borderColor: getBorderColor(theme),
              }}
            >
              <Users className="w-5 h-5 text-[#63c49f]" />
              <span className="text-sm font-semibold text-white">Contractors</span>
              </div>
              </Link>
              <Link to={createPageUrl("Forum")}>
              <div
              className="w-full h-20 rounded-2xl flex flex-col gap-2 border-2 items-center justify-center hover:shadow-lg transition-all"
              style={{
                background: getGradientStyle(theme, 'main'),
                backdropFilter: getBackdropFilter(),
                WebkitBackdropFilter: getBackdropFilter(),
                boxShadow: getBoxShadow('main'),
                borderColor: getBorderColor(theme),
              }}
              >
              <MessageCircle className="w-5 h-5 text-[#63c49f]" />
              <span className="text-sm font-semibold text-white">Forum</span>
            </div>
          </Link>
        </div>

        {/* Recent Issues */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-1 text-white">
              <History className="w-5 h-5 text-[#63c49f]" />
              Recent Issues
            </h2>
            <Link 
              to={createPageUrl("History")}
              className="text-sm font-semibold text-[#63c49f] hover:text-[#63c49f]/80"
            >
              View All
            </Link>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl h-24 animate-pulse bg-white/50 backdrop-blur-md" />
              ))}
            </div>
          ) : issues.length > 0 ? (
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div 
              className="text-center py-12 rounded-3xl border-2 overflow-hidden"
              style={{
                background: getGradientStyle(theme, 'accent'),
                backdropFilter: getBackdropFilter(),
                WebkitBackdropFilter: getBackdropFilter(),
                boxShadow: getBoxShadow('accent'),
                borderColor: getBorderColor(theme),
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-slate-100">
                <Sparkles className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-white font-semibold">No issues scanned yet</p>
              <p className="text-sm mt-1 text-white/70 font-medium">
                Tap the button above to get started
              </p>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <Disclaimer />
        </main>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Pay for Scan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="rounded-2xl p-6 text-center border-2 bg-yellow-50/60 backdrop-blur-md border-yellow-300">
              <p className="text-4xl font-bold mb-2 text-yellow-700">
                £0.99
              </p>
              <p className="text-sm text-slate-600">
                One-time payment for this scan
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                ✓ AI-powered issue analysis
              </p>
              <p className="text-sm text-slate-700">
                ✓ Cost estimates & repair guide
              </p>
              <p className="text-sm text-slate-700">
                ✓ Professional recommendations
              </p>
            </div>

            <Button
              onClick={handlePayAndScan}
              disabled={processingPayment}
              className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-[#0F1E2E] h-12 rounded-xl font-semibold"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay £0.99 & Scan'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowPaymentDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>

            <p className="text-xs text-center text-slate-500">
              Secure payment • No subscription • Cancel anytime
            </p>
          </div>
        </DialogContent>
        </Dialog>
        </div>
        );
        }