import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  Upload, 
  Camera, 
  Video, 
  Mic, 
  CheckCircle2,
  Lightbulb,
  Wrench,
  ArrowRight,
  ChevronLeft,
  Image,
  Film,
  Mic2,
  Building2,
  ShoppingCart,
  ExternalLink,
  Clock,
  Search,
  AlertTriangle,
  MessageCircle,
  Eye,
  Hammer,
  Zap
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";
import { validateFile } from "@/components/utils/fileValidation";
import { aiAnalysisLimiter, fileUploadLimiter, checkRateLimit } from "@/components/utils/rateLimiter";
import { sanitizeText } from "@/components/utils/sanitize";
import IssueChatbot from "@/components/kora/IssueChatbot";
import TimedAdBreak from "@/components/kora/TimedAdBreak";

export default function GuidedIssueFlow({ onComplete, onCancel }) {
  const { theme } = useTheme();
  const [step, setStep] = useState("upload"); // upload, details, triage, questions, suggestions, analyze
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [issueType, setIssueType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [suggestions, setSuggestions] = useState(null);
  const [showStoragePrompt, setShowStoragePrompt] = useState(false);
  
  // User-provided details
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  
  // Business user property details
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCategory, setPropertyCategory] = useState("residential");
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });
  
  const isBusinessUser = user?.account_type === "business";

  // Step 1: Upload media
  const handleFileSelect = async (type, file) => {
    if (!file) return;
    
    setError(null);
    setMediaType(type);
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
  };

  // Step 2: Move to details entry
  const handleContinueToDetails = () => {
    setStep("details");
  };

  // Step 3: Upload and analyze
  const handleUpload = async () => {
    if (!mediaFile) return;

    setUploading(true);
    setError(null);
    try {
      // Rate limit check
      checkRateLimit(fileUploadLimiter, user?.id || 'anonymous');
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      setMediaUrl(file_url);
      
      // Rate limit check for AI
      checkRateLimit(aiAnalysisLimiter, user?.id || 'anonymous');
      
      // Quick AI triage to identify issue type
      setAnalyzing(true);
      const triage = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional home inspector analyzing this ${mediaType} to diagnose a maintenance issue.

CRITICAL: Perform PRECISE visual inspection and identification.

Analyze the ${mediaType} with forensic attention to:
- Specific component or system affected (be exact - e.g., "compression valve" not "tap")
- Visible damage indicators (corrosion, wear, leaks, discoloration, cracks)
- Material types and their condition
- Surrounding context (age, installation quality, environment)

Your analysis MUST:
1. Identify the EXACT problem category from: plumbing, electrical, structural, appliance, hvac, roofing, carpentry, painting, flooring, walls, doors_windows, heating, cooling, other

2. Provide a SPECIFIC one-sentence technical description using proper terminology
   - BAD: "Leaking tap"
   - GOOD: "Failed ceramic disc cartridge in kitchen mixer tap causing constant drip"
   - BAD: "Broken wall"
   - GOOD: "Vertical hairline crack in drywall above door frame indicating settling"

Be forensically precise. Use technical terminology. Differentiate between similar issues (e.g., compression valve vs ceramic disc vs ball valve failures).`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            brief_description: { type: "string" }
          },
          required: ["category", "brief_description"]
        }
      });

      setIssueType(triage);
      
      // Generate context-specific questions
      const questionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this ${triage.category} issue: "${triage.brief_description}"

Generate 3-5 relevant follow-up questions that will help diagnose the problem better.
Questions should be:
- Specific to this type of issue
- Easy to answer (yes/no, multiple choice, or short text)
- Helpful for diagnosis

For each question, provide:
- The question text
- Question type: "text", "choice", or "yesno"
- For choice type, provide options array

Examples:
- Plumbing leak: "Is the water hot or cold?", "Where exactly is the leak located?", "How long has this been happening?"
- Electrical: "Does it happen at specific times?", "Have you recently changed anything?", "Which circuit breaker is it on?"
- HVAC: "Is it making noise?", "When did you last service it?", "What temperature are you setting it to?"`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  question: { type: "string" },
                  type: { type: "string", enum: ["text", "choice", "yesno"] },
                  options: { type: "array", items: { type: "string" } }
                },
                required: ["id", "question", "type"]
              }
            }
          },
          required: ["questions"]
        }
      });

      // Ensure each question has a unique ID
      const uniqueQuestions = questionsResult.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q-${idx}-${Date.now()}`
      }));
      setQuestions(uniqueQuestions);
      // Initialize answers object with empty strings for each question
      const initialAnswers = {};
      uniqueQuestions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
      setStep("questions");
    } catch (error) {
      console.error("Upload/analysis failed:", error);
      setError(error.message || "Failed to analyze. Please try again or use a different file format.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Step 2: Answer questions and get AI suggestions
  const handleQuestionsSubmit = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const answersText = questions.map(q => 
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");

      const userCountry = user?.country || "UK";
      const amazonDomain = userCountry === "US" ? "amazon.com" : userCountry === "CA" ? "amazon.ca" : userCountry === "AU" ? "amazon.com.au" : "amazon.co.uk";

      const suggestionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this ${issueType.category} issue and customer responses:

Issue: ${issueType.brief_description}

Customer's answers:
${answersText}

Provide a COMPREHENSIVE diagnostic analysis in simple language:

1. **Likely Root Causes** (2-3 explanations in plain English)
   - Explain what likely went wrong in simple terms
   - Include what to look for to confirm each cause

2. **Diagnostic Steps** (3-5 specific steps to diagnose the exact problem)
   - Numbered steps the user can follow to identify the root cause
   - Include what they should see/hear/feel at each step
   - Safety warnings where relevant

3. **Quick DIY Fixes** (3-5 immediate actions they can try)
   - Step-by-step action with description
   - Estimated time for each fix (e.g., "5-10 minutes")
   - Difficulty level: "Easy", "Moderate", or "Advanced"

4. **Tools & Materials Needed** (4-8 bestselling, universally-available products, ranked by priority)
   - ONLY recommend products that are guaranteed bestsellers on Amazon UK
   - **CRITICAL: Order products from MOST ESSENTIAL/PRIORITY first to LEAST ESSENTIAL last**
   - Examples of SAFE, bestselling products to recommend:
     * Stanley tape measures (any size - always available)
     * Stanley adjustable wrenches (any size - always in stock)
     * DeWalt or Bosch drill sets (professional-grade bestsellers)
     * Socket wrench sets by Stanley, Dekton, or Halfords
     * Screwdriver sets (any major brand)
     * Plumbing washers/seals kits (basic, always available)
     * Caulk and sealants (DAP, Sikaflex - always available)
     * WD-40 or 3-in-1 oil (household staples)
     * Basic hand tool kits (any major brand)
   - For EACH product, provide:
     * Simple product name (e.g., "Stanley 8m tape measure")
     * Estimated mid-range cost (£15-£100 typically)
     * A simple search-friendly product name (no ASINs - search by name instead)
     * Brief reason why it's needed (e.g., "Essential for measuring and marking" or "Optional but helpful for cleanup")
   - Use generic search terms that will always find the product: "stanley tape measure", "adjustable wrench", etc.
   - Focus on household name brands and universally-available items ONLY
   - **Prioritize essential tools first, then optional nice-to-have items last**

5. **Estimated Repair Time**
   - DIY time estimate (e.g., "30-60 minutes for beginner, 15-30 for experienced")
   - Professional time estimate
   - Time to order parts if needed

6. **Manufacturer Documentation & Resources**
   - If identifiable brand/model, provide typical documentation links (manuals, warranty info)
   - Suggest manufacturer websites or support pages
   - Common troubleshooting guide topics to search for
   - Relevant YouTube search terms for video guides

7. **Warning Signs to Call Professional**
   - Specific conditions requiring immediate professional help
   - Safety hazards to watch for

Be practical, safety-conscious, and use simple language. Recommend mid-range products that offer good value and are popular among users.`,
        file_urls: [mediaUrl],
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            likely_causes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cause: { type: "string" },
                  details: { type: "string" },
                  confirmation_signs: { type: "array", items: { type: "string" } }
                },
                required: ["cause", "details"]
              }
            },
            diagnostic_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step_number: { type: "number" },
                  action: { type: "string" },
                  expected_result: { type: "string" },
                  safety_note: { type: "string" }
                },
                required: ["step_number", "action"]
              }
            },
            diy_quick_fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  description: { type: "string" },
                  estimated_time: { type: "string" },
                  difficulty: { type: "string", enum: ["Easy", "Moderate", "Advanced"] }
                },
                required: ["action", "description", "estimated_time", "difficulty"]
              }
            },
            tools_and_materials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                   product_name: { type: "string" },
                   description: { type: "string" },
                   estimated_cost: { type: "string" },
                   search_term: { type: "string" },
                   reason_needed: { type: "string" },
                   essential: { type: "boolean" }
                 },
                 required: ["product_name", "description", "search_term"]
              }
            },
            estimated_repair_time: {
              type: "object",
              properties: {
                diy_time: { type: "string" },
                professional_time: { type: "string" },
                parts_delivery: { type: "string" }
              }
            },
            manufacturer_resources: {
              type: "object",
              properties: {
                brand_identified: { type: "string" },
                manual_search_terms: { type: "array", items: { type: "string" } },
                support_website_suggestions: { type: "array", items: { type: "string" } },
                youtube_search_terms: { type: "array", items: { type: "string" } },
                common_troubleshooting_topics: { type: "array", items: { type: "string" } }
              }
            },
            call_pro_if: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["likely_causes", "diagnostic_steps", "diy_quick_fixes", "tools_and_materials", "estimated_repair_time", "call_pro_if"]
        }
      });

      setSuggestions(suggestionsResult);
      setStep("suggestions");
      } catch (error) {
      console.error("Suggestions failed:", error);
      setError(error.message || "Failed to get suggestions. Please try again.");
      } finally {
      setAnalyzing(false);
      }
      };

      // Show ad during analysis
      if (analyzing && step === "questions") {
      return (
      <div className={cn(
        "rounded-2xl p-6 border flex flex-col items-center justify-center min-h-[400px]",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <Loader2 className="w-12 h-12 animate-spin text-[#4BC896] mb-4" />
        <p className={cn(
          "text-center font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Analyzing your issue...
        </p>
        <p className={cn(
          "text-center text-sm",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Please enjoy this brief advertisement
        </p>
        <TimedAdBreak />
      </div>
      );
      }

  // Handle storing the issue
  const handleStoreIssue = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const answersText = questions.map(q => 
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");

      await onComplete(mediaUrl, mediaType, {
        description: sanitizeText(description || issueType.brief_description),
        category: sanitizeText(category || issueType.category),
        location: sanitizeText(location),
        duration: sanitizeText(duration),
        questionsAndAnswers: answersText,
        propertyName: isBusinessUser ? sanitizeText(propertyName) : undefined,
        propertyAddress: isBusinessUser ? sanitizeText(propertyAddress) : undefined,
        propertyCategory: isBusinessUser ? propertyCategory : undefined
      });
    } catch (error) {
      console.error("Failed to store issue:", error);
      setError(error.message || "Failed to store issue. Please try again.");
      setAnalyzing(false);
    }
  };

  // Handle closing without storing
  const handleCloseScan = () => {
    setShowStoragePrompt(true);
  };

  if (step === "upload") {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <h3 className={cn(
          "font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Upload Issue Media
        </h3>
        <p className={cn(
          "text-sm mb-4",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Take a photo or video of the problem
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!mediaFile ? (
          <div className="space-y-4">
            <div>
              <h4 className={cn(
                "text-sm font-medium mb-2",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Capture Media
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-colors",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect("photo", e.target.files[0])}
                  />
                  <Camera className="w-6 h-6 mb-2 text-[#4BC896]" />
                  <span className={cn(
                    "text-xs text-center",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    Take Photo
                  </span>
                </label>

                <label className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-colors",
                  theme === "dark"
                    ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                    : "border-slate-200 hover:bg-slate-50"
                )}>
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect("video", e.target.files[0])}
                  />
                  <Video className="w-6 h-6 mb-2 text-[#57CFA4]" />
                  <span className={cn(
                    "text-xs text-center",
                    theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                  )}>
                    Record Video
                  </span>
                </label>
              </div>
            </div>

            <div className={cn(
              "relative",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )}>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={cn(
                  "px-2",
                  theme === "dark" ? "bg-[#1A2F42]" : "bg-white"
                )}>
                  Or Upload File
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect("photo", e.target.files[0])}
                />
                <Image className="w-6 h-6 mb-2 text-[#4BC896]" />
                <span className={cn(
                  "text-xs text-center",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Upload Photo
                </span>
              </label>

              <label className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect("video", e.target.files[0])}
                />
                <Film className="w-6 h-6 mb-2 text-[#57CFA4]" />
                <span className={cn(
                  "text-xs text-center",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Upload Video
                </span>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border">
              {mediaType === "photo" && (
                <img src={mediaUrl} alt="Preview" className="w-full h-48 object-cover" />
              )}
              {mediaType === "video" && (
                <video src={mediaUrl} className="w-full h-48 object-cover" controls />
              )}
              {mediaType === "audio" && (
                <div className="p-8 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                  <audio src={mediaUrl} controls className="w-full" />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMediaFile(null);
                  setMediaUrl(null);
                }}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                onClick={handleContinueToDetails}
                className="flex-1 bg-[#4BC896] hover:bg-[#4BC896]/90 text-[#0F1E2E]"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full mt-4 border-white text-white bg-[#1a2f42] hover:bg-[#1a2f42]/90 hover:text-white"
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <button
          onClick={() => setStep("upload")}
          className={cn(
            "flex items-center gap-2 mb-4 text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h3 className={cn(
          "font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Describe the issue
        </h3>
        <p className={cn(
          "text-sm mb-4",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Tell us more details to help our AI provide the best solution
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              What's the problem? *
            </Label>
            <Textarea
              placeholder="Describe what's happening... (e.g., 'Water is leaking from under the sink')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                "min-h-24",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Where is it located?
            </Label>
            <Input
              placeholder="e.g., Kitchen sink, Living room, Bathroom"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={cn(
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              How long has this been happening?
            </Label>
            <Input
              placeholder="e.g., Just started, Few days, A week"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={cn(
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Issue category (optional)
            </Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              <div className="grid grid-cols-2 gap-2">
                {["plumbing", "electrical", "hvac", "structural", "appliance", "other"].map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <RadioGroupItem value={cat} id={cat} />
                    <Label htmlFor={cat} className="cursor-pointer capitalize text-white">{cat}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {isBusinessUser && (
            <>
              <div className={cn(
                "border-t pt-4 mt-4",
                theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-200"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-[#F7B600]" />
                  <Label className={cn(
                    "font-semibold",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )}>
                    Property Details
                  </Label>
                </div>
              </div>

              <div>
                <Label className={cn(
                  "mb-2 block",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Property Name/Reference *
                </Label>
                <Input
                  placeholder="e.g., 24 Oak Street, Viewing #123"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className={cn(
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>

              <div>
                <Label className={cn(
                  "mb-2 block",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Property Address
                </Label>
                <Input
                  placeholder="Full property address"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className={cn(
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              </div>

              <div>
                <Label className={cn(
                  "mb-2 block",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  Property Type
                </Label>
                <RadioGroup value={propertyCategory} onValueChange={setPropertyCategory}>
                  <div className="grid grid-cols-2 gap-2">
                    {["residential", "commercial", "rental", "sale_listing", "inspection"].map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <RadioGroupItem value={cat} id={`prop-${cat}`} />
                        <Label htmlFor={`prop-${cat}`} className="cursor-pointer capitalize">
                          {cat.replace("_", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!description.trim() || (isBusinessUser && !propertyName.trim()) || uploading || analyzing}
          className="w-full bg-[#4BC896] hover:bg-[#4BC896]/90 text-[#0F1E2E]"
        >
          {uploading || analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Issue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    );
  }

  if (step === "questions") {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <button
          onClick={() => setStep("details")}
          className={cn(
            "flex items-center gap-2 mb-4 text-sm",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h3 className={cn(
          "font-semibold mb-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Tell us more about the issue
        </h3>
        <p className={cn(
          "text-sm mb-4",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          {issueType?.brief_description}
        </p>

        <div className="space-y-4 mb-6">
          {questions.map((q) => (
            <div key={q.id}>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {q.question}
              </Label>
              
              {q.type === "text" && (
                <Input
                  placeholder="Your answer..."
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className={cn(
                    theme === "dark"
                      ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                      : "bg-white border-slate-200"
                  )}
                />
              )}

              {q.type === "yesno" && (
                    <RadioGroup
                      value={answers[q.id] || ""}
                      onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                    >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${q.id}-yes`} />
                      <Label htmlFor={`${q.id}-yes`} className={cn("cursor-pointer", theme === "dark" ? "text-white" : "text-[#1E3A57]")}>Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${q.id}-no`} />
                      <Label htmlFor={`${q.id}-no`} className={cn("cursor-pointer", theme === "dark" ? "text-white" : "text-[#1E3A57]")}>No</Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {q.type === "choice" && q.options && (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                >
                  <div className="space-y-2">
                    {q.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${i}`} />
                        <Label htmlFor={`${q.id}-${i}`} className={cn("cursor-pointer", theme === "dark" ? "text-white" : "text-[#1E3A57]")}>{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          onClick={handleQuestionsSubmit}
          disabled={analyzing}
          className="w-full bg-[#4BC896] hover:bg-[#4BC896]/90 text-[#0F1E2E]"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting suggestions...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    );
  }

  if (showStoragePrompt) {
    return (
      <div className={cn(
        "rounded-2xl p-6 border",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <h3 className={cn(
          "font-semibold mb-2 text-lg",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          Close this scan?
        </h3>

        <p className={cn(
          "text-sm mb-5",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          This scan and its full analysis will be saved to your <strong>Recent Issues</strong> for <strong>45 days</strong> so you can refer back anytime.
        </p>

        <div className={cn(
          "rounded-xl p-3 mb-5 flex items-start gap-3",
          theme === "dark" ? "bg-[#0F1E2E] border border-[#57CFA4]/20" : "bg-slate-50 border border-slate-200"
        )}>
          <CheckCircle2 className="w-5 h-5 text-[#4BC896] flex-shrink-0 mt-0.5" />
          <div>
            <p className={cn("text-sm font-medium", theme === "dark" ? "text-white" : "text-[#1E3A57]")}>
              {issueType?.brief_description || "Issue scan"}
            </p>
            <p className={cn("text-xs mt-0.5", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
              Saved for 45 days · Viewable in Recent Issues
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleStoreIssue}
            disabled={analyzing}
            className="w-full bg-[#4BC896] hover:bg-[#4BC896]/90 text-[#0F1E2E] font-semibold"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Yes, save & close"
            )}
          </Button>

          <Button
            onClick={onCancel}
            variant="outline"
            className={cn(
              "w-full",
              theme === "dark"
                ? "border-[#57CFA4]/30 text-white hover:bg-red-900/20 hover:border-red-500"
                : "border-slate-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            )}
          >
            Discard & close
          </Button>
        </div>
      </div>
    );
  }

  if (step === "suggestions") {
    return (
      <div className={cn(
        "rounded-2xl p-6 border max-h-[70vh] overflow-y-auto",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <h3 className={cn(
          "font-semibold mb-4 flex items-center gap-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          <Lightbulb className="w-5 h-5 text-[#F7B600]" />
          Analysis Results
        </h3>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {/* Estimated Repair Time */}
          {suggestions?.estimated_repair_time && (
            <AccordionItem value="time" className={cn(
              "border rounded-lg px-4",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                : "bg-slate-50 border-slate-200"
            )}>
              <AccordionTrigger className={cn(
                "flex items-center gap-3",
                theme === "dark" ? "text-white hover:text-[#57CFA4]" : "text-[#1E3A57]"
              )}>
                <Clock className="w-5 h-5 flex-shrink-0" />
                How Long Will This Take?
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn("space-y-2 text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-slate-600")}>
                  {suggestions.estimated_repair_time.diy_time && (
                    <p><strong>If you do it yourself:</strong> {suggestions.estimated_repair_time.diy_time}</p>
                  )}
                  {suggestions.estimated_repair_time.professional_time && (
                    <p><strong>If you hire someone:</strong> {suggestions.estimated_repair_time.professional_time}</p>
                  )}
                  {suggestions.estimated_repair_time.parts_delivery && (
                    <p><strong>Getting parts:</strong> {suggestions.estimated_repair_time.parts_delivery}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Likely Causes */}
          <AccordionItem value="causes" className={cn(
            "border rounded-lg px-4",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/20"
              : "bg-slate-50 border-slate-200"
          )}>
            <AccordionTrigger className={cn(
              "flex items-center gap-3",
              theme === "dark" ? "text-white hover:text-[#57CFA4]" : "text-[#1E3A57]"
            )}>
              <Search className="w-5 h-5 flex-shrink-0" />
              What Caused This?
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {suggestions?.likely_causes?.map((cause, i) => (
                  <div key={i} className={cn(
                    "p-2 rounded border-l-2",
                    theme === "dark"
                      ? "border-[#57CFA4] bg-[#0F1E2E]/50"
                      : "border-blue-300 bg-blue-50"
                  )}>
                    <p className={cn(
                      "font-medium text-sm",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {cause.cause}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {cause.details}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Diagnostic Steps */}
          {suggestions?.diagnostic_steps && suggestions.diagnostic_steps.length > 0 && (
            <AccordionItem value="steps" className={cn(
              "border rounded-lg px-4",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                : "bg-slate-50 border-slate-200"
            )}>
              <AccordionTrigger className={cn(
                "flex items-center gap-3",
                theme === "dark" ? "text-white hover:text-[#57CFA4]" : "text-[#1E3A57]"
              )}>
                <Eye className="w-5 h-5 flex-shrink-0" />
                How to Check What's Wrong
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {suggestions.diagnostic_steps.map((step, i) => (
                    <div key={i} className={cn(
                      "p-2 rounded text-sm",
                      theme === "dark"
                        ? "bg-[#0F1E2E]/50"
                        : "bg-blue-50"
                    )}>
                      <p className={cn(
                        "font-medium",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        Step {step.step_number}: {step.action}
                      </p>
                      {step.safety_note && (
                        <p className="text-xs text-amber-600 mt-1">⚠️ {step.safety_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Tools & Materials */}
          {suggestions?.tools_and_materials && suggestions.tools_and_materials.length > 0 && (
            <AccordionItem value="tools" className={cn(
              "border rounded-lg px-4",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                : "bg-slate-50 border-slate-200"
            )}>
              <AccordionTrigger className={cn(
                "flex items-center gap-3",
                theme === "dark" ? "text-white hover:text-[#57CFA4]" : "text-[#1E3A57]"
              )}>
                <Wrench className="w-5 h-5 flex-shrink-0" />
                What You'll Need
                </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {suggestions.tools_and_materials.slice(0, 5).map((item, i) => {
                    const searchTerm = encodeURIComponent(item.search_term || item.product_name);
                    const affiliateLink = `https://amazon.co.uk/s?k=${searchTerm}&tag=ufixi-21`;
                    return (
                      <div key={i} className={cn(
                        "p-2 rounded text-sm border-l-3",
                        i === 0 
                          ? "border-red-500 bg-red-50"
                          : i === 1 
                            ? "border-amber-500 bg-amber-50"
                            : "border-slate-300 bg-slate-50",
                        theme === "dark" && (
                          i === 0 
                            ? "bg-red-900/20 border-red-500"
                            : i === 1 
                              ? "bg-amber-900/20 border-amber-500"
                              : "bg-[#1A2F42]/50 border-[#57CFA4]/30"
                        )
                      )}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs font-bold px-1.5 py-0.5 rounded",
                              i === 0 
                                ? "bg-red-500 text-white"
                                : i === 1 
                                  ? "bg-amber-500 text-white"
                                  : theme === "dark" ? "bg-[#57CFA4]/20 text-[#57CFA4]" : "bg-slate-200 text-slate-700"
                            )}>
                              {i === 0 ? "Essential" : i === 1 ? "Important" : "Optional"}
                            </span>
                            <p className={cn(
                              "font-medium",
                              theme === "dark" ? "text-white" : "text-[#1E3A57]"
                            )}>
                              {item.product_name}
                            </p>
                          </div>
                          {item.estimated_cost && (
                            <span className={cn(
                              "text-xs font-semibold",
                              theme === "dark" ? "text-[#F7B600]" : "text-blue-600"
                            )}>
                              {item.estimated_cost}
                            </span>
                          )}
                        </div>
                        {item.reason_needed && (
                          <p className={cn(
                            "text-xs mb-2",
                            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                          )}>
                            {item.reason_needed}
                          </p>
                        )}
                        <a
                          href={affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] px-2 py-1 rounded transition-colors"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Buy
                        </a>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* DIY Quick Fixes */}
          <AccordionItem value="fixes" className={cn(
            "border rounded-lg px-4",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/20"
              : "bg-slate-50 border-slate-200"
          )}>
            <AccordionTrigger className={cn(
              "flex items-center gap-3",
              theme === "dark" ? "text-white hover:text-[#57CFA4]" : "text-[#1E3A57]"
            )}>
              <Zap className="w-5 h-5 flex-shrink-0" />
              Quick Fixes to Try
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {suggestions?.diy_quick_fixes?.slice(0, 3).map((fix, i) => (
                  <div key={i} className={cn(
                    "p-2 rounded text-sm border-l-2",
                    theme === "dark"
                      ? "border-[#57CFA4] bg-[#0F1E2E]/50"
                      : "border-green-300 bg-green-50"
                  )}>
                    <p className={cn(
                      "font-medium",
                      theme === "dark" ? "text-white" : "text-[#1E3A57]"
                    )}>
                      {fix.action}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      {fix.description}
                    </p>
                    <p className={cn(
                      "text-xs mt-1",
                      fix.difficulty === "Easy" ? "text-green-700" : fix.difficulty === "Moderate" ? "text-amber-700" : "text-red-700"
                    )}>
                      {fix.difficulty} • {fix.estimated_time}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Warning Signs */}
          <AccordionItem value="warnings" className={cn(
            "border rounded-lg px-4 border-red-300",
            theme === "dark"
              ? "bg-red-900/20"
              : "bg-red-50"
          )}>
            <AccordionTrigger className="text-red-700 font-semibold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              When to Call a Professional
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {suggestions?.call_pro_if?.slice(0, 4).map((warning, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Chatbot */}
        <IssueChatbot issueType={issueType} suggestions={suggestions} mediaUrl={mediaUrl} />

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
                    onClick={handleCloseScan}
                    disabled={analyzing}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : "Close Scan"}
                  </Button>
        </div>
      </div>
    );
  }

  return null;
}