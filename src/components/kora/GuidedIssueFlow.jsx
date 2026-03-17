import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Camera,
  Video,
  ArrowLeft,
  Image,
  Building2,
  ShoppingCart,
  Clock,
  Search,
  AlertTriangle,
  Eye,
  Zap,
  Bot,
  Wrench,
  CheckCircle2,
  Lightbulb,
  MapPin,
  Tag,
  Droplets,
  Plug,
  HardHat,
  Wind,
  MonitorSpeaker,
  Hammer,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CircleHelp,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Timer,
  Video as VideoIcon
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { aiAnalysisLimiter, fileUploadLimiter, checkRateLimit } from "@/components/utils/rateLimiter";
import { sanitizeText } from "@/components/utils/sanitize";
import IssueChatbot from "@/components/kora/IssueChatbot";
import LavaLampBackground from "@/components/kora/LavaLampBackground";

// Brand colours
const GREEN = "#7C6FE0";
const NAVY = "#151528";

function GradientButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 rounded-2xl text-white font-semibold text-base transition-all shadow-lg",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]",
        className
      )}
      style={{
        background: disabled
          ? "#cbd5e1"
          : `linear-gradient(135deg, ${GREEN} 0%, ${NAVY} 100%)`,
      }}
    >
      {children}
    </button>
  );
}

function OptionRow({ icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all text-left",
        selected
          ? "border-transparent text-white"
          : "bg-white border-slate-200 text-[#1E2D40] hover:bg-slate-50"
      )}
      style={selected ? { background: `linear-gradient(135deg, ${GREEN} 0%, ${NAVY} 100%)` } : {}}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-slate-500")} />}
        <span className="font-medium">{label}</span>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
        selected ? "border-white" : "border-slate-300"
      )}>
        {selected && <div className="w-3 h-3 rounded-full bg-white" />}
      </div>
    </button>
  );
}

function UploadMethodRow({ icon: Icon, title, description, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl border bg-white transition-all text-left shadow-sm",
        selected ? "border-[#6ECBA6] ring-1 ring-[#6ECBA6]" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${NAVY} 100%)` }}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-[#1E2D40]">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex-shrink-0",
        selected ? "border-[#6ECBA6] bg-[#6ECBA6]" : "border-slate-300"
      )}>
        {selected && (
          <div className="w-full h-full rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        )}
      </div>
    </button>
  );
}

const CATEGORY_OPTIONS = [
  { value: "plumbing", icon: Droplets, label: "Plumbing" },
  { value: "electrical", icon: Plug, label: "Electrical" },
  { value: "structural", icon: HardHat, label: "Structural" },
  { value: "hvac", icon: Wind, label: "HVAC" },
  { value: "appliance", icon: MonitorSpeaker, label: "Appliance" },
  { value: "other", icon: Hammer, label: "Other" },
];

// Map question index to a unique icon (no repeats)
const QUESTION_ICONS = [CalendarDays, TrendingUp, CircleHelp, Timer, Eye, Tag];

export default function GuidedIssueFlow({ onComplete, onSaveIssue, onCancel }) {
  const [step, setStep] = useState("upload");
  const [uploadMethod, setUploadMethod] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [issueType, setIssueType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [suggestions, setSuggestions] = useState(null);
  const [showStoragePrompt, setShowStoragePrompt] = useState(false);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCategory, setPropertyCategory] = useState("residential");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const isBusinessUser = user?.account_type === "business";

  const pageStyle = {
    minHeight: "100vh",
  };

  const handleFileSelect = (type, file) => {
    if (!file) return;
    setError(null);
    setMediaType(type);
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setStep("details");
  };

  const triggerFileInput = (type, capture) => {
    if (type === "video") {
      if (videoInputRef.current) { videoInputRef.current.value = ""; videoInputRef.current.click(); }
    } else if (capture) {
      if (photoInputRef.current) { photoInputRef.current.value = ""; photoInputRef.current.click(); }
    } else {
      if (uploadInputRef.current) { uploadInputRef.current.value = ""; uploadInputRef.current.click(); }
    }
  };

  const handleMethodContinue = () => {
    if (!uploadMethod) return;
    if (uploadMethod === "photo") triggerFileInput("photo", true);
    else if (uploadMethod === "video") triggerFileInput("video", true);
    else if (uploadMethod === "upload") triggerFileInput("photo", false);
  };

  const handleUpload = async () => {
    if (!mediaFile) return;
    setUploading(true);
    setError(null);
    try {
      checkRateLimit(fileUploadLimiter, user?.id || "anonymous");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      setMediaUrl(file_url);
      checkRateLimit(aiAnalysisLimiter, user?.id || "anonymous");
      setAnalyzing(true);

      const triage = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional home inspector analyzing this ${mediaType} to diagnose a maintenance issue. Identify the EXACT problem category from: plumbing, electrical, structural, appliance, hvac, roofing, carpentry, painting, flooring, walls, doors_windows, heating, cooling, other. Provide a SPECIFIC one-sentence technical description.`,
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

      const questionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this ${triage.category} issue: "${triage.brief_description}", generate 3 relevant follow-up questions to help diagnose the problem. Each question should have 3-4 multiple choice options that are short and scannable. Make questions feel conversational. For each question provide an id, question text, type="choice", and options array.`,
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
                  type: { type: "string" },
                  options: { type: "array", items: { type: "string" } }
                },
                required: ["id", "question", "type"]
              }
            }
          },
          required: ["questions"]
        }
      });

      const uniqueQuestions = questionsResult.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q-${idx}-${Date.now()}`
      }));
      setQuestions(uniqueQuestions);
      const initialAnswers = {};
      uniqueQuestions.forEach(q => { initialAnswers[q.id] = ""; });
      setAnswers(initialAnswers);
      setCurrentQuestionIdx(0);
      setStep("questions");
    } catch (err) {
      setError(err.message || "Failed to analyse. Please try again.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleQuestionNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      handleQuestionsSubmit();
    }
  };

  const handleQuestionsSubmit = async () => {
    setStep("ad");
    setAnalyzing(true);
    setError(null);
    try {
      const answersText = questions.map(q =>
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");

      const suggestionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this ${issueType.category} issue and customer responses:\n\nIssue: ${issueType.brief_description}\n\nCustomer's answers:\n${answersText}\n\nProvide a COMPREHENSIVE diagnostic analysis including: likely causes, diagnostic steps, diy quick fixes, tools and materials needed (with Amazon UK search terms), estimated repair time, and when to call a professional.`,
        file_urls: [mediaUrl],
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            likely_causes: { type: "array", items: { type: "object", properties: { cause: { type: "string" }, details: { type: "string" } }, required: ["cause", "details"] } },
            diagnostic_steps: { type: "array", items: { type: "object", properties: { step_number: { type: "number" }, action: { type: "string" }, safety_note: { type: "string" } }, required: ["step_number", "action"] } },
            diy_quick_fixes: { type: "array", items: { type: "object", properties: { action: { type: "string" }, description: { type: "string" }, estimated_time: { type: "string" }, difficulty: { type: "string" } }, required: ["action", "description", "estimated_time", "difficulty"] } },
            tools_and_materials: { type: "array", items: { type: "object", properties: { product_name: { type: "string" }, description: { type: "string" }, estimated_cost: { type: "string" }, search_term: { type: "string" }, reason_needed: { type: "string" } }, required: ["product_name", "description", "search_term"] } },
            estimated_repair_time: { type: "object", properties: { diy_time: { type: "string" }, professional_time: { type: "string" }, parts_delivery: { type: "string" } } },
            call_pro_if: { type: "array", items: { type: "string" } }
          },
          required: ["likely_causes", "diagnostic_steps", "diy_quick_fixes", "tools_and_materials", "estimated_repair_time", "call_pro_if"]
        }
      });

      setSuggestions(suggestionsResult);
      setStep("suggestions");
    } catch (err) {
      setError(err.message || "Failed to get suggestions. Please try again.");
      setStep("questions");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStoreIssue = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 45);

      const friendlyTitle = issueType?.category
        ? `${issueType.category.charAt(0).toUpperCase() + issueType.category.slice(1)} issue`
        : issueType?.brief_description || description || "Issue scan";

      const issueData = {
        title: sanitizeText(friendlyTitle),
        explanation: sanitizeText(issueType?.brief_description || description || ""),
        urgency: "fix_soon",
        severity_score: 5,
        media_url: mediaUrl,
        media_type: mediaType,
        status: "active",
        expires_at: expiresAt.toISOString(),
        property_name: isBusinessUser ? sanitizeText(propertyName) : undefined,
        property_address: isBusinessUser ? sanitizeText(propertyAddress) : undefined,
        property_category: isBusinessUser ? propertyCategory : undefined,
        scanned_by_name: user?.full_name,
      };

      if (onSaveIssue) {
        await onSaveIssue(issueData);
      } else {
        await onComplete(mediaUrl, mediaType, {
          description: sanitizeText(description || issueType?.brief_description || ""),
          category: sanitizeText(category || issueType?.category || ""),
          location: sanitizeText(location),
          propertyName: isBusinessUser ? sanitizeText(propertyName) : undefined,
          propertyAddress: isBusinessUser ? sanitizeText(propertyAddress) : undefined,
          propertyCategory: isBusinessUser ? propertyCategory : undefined,
        });
      }
    } catch (err) {
      setError(err.message || "Failed to store issue. Please try again.");
      setAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────
  // STEP: Upload method selection
  // ─────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div style={pageStyle} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E2D40]" />
            </button>
            <h2 className="text-xl font-bold text-[#1E2D40]">Scan Issue</h2>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold text-[#1E2D40] mb-2">Tips for best results:</p>
            <ul className="space-y-1">
              {[
                "Ensure good lighting and focus",
                "Capture the entire affected area",
                "Include surrounding context when possible",
              ].map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6ECBA6] flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <p className="font-semibold text-[#1E2D40]">Choose a method:</p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <UploadMethodRow
              icon={Camera}
              title="Take Photo"
              description="Capture a clear image of the issue"
              selected={uploadMethod === "photo"}
              onClick={() => setUploadMethod("photo")}
            />
            <UploadMethodRow
              icon={Video}
              title="Record Video"
              description="Show the issue from multiple angles"
              selected={uploadMethod === "video"}
              onClick={() => setUploadMethod("video")}
            />
            <UploadMethodRow
              icon={Image}
              title="Upload Media"
              description="Choose existing photos or videos"
              selected={uploadMethod === "upload"}
              onClick={() => setUploadMethod("upload")}
            />
          </div>

          {/* Hidden file inputs */}
          <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => handleFileSelect("photo", e.target.files[0])} />
          <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden"
            onChange={(e) => handleFileSelect("video", e.target.files[0])} />
          <input ref={uploadInputRef} type="file" accept="image/*,video/*" className="hidden"
            onChange={(e) => { const f = e.target.files[0]; handleFileSelect(f?.type.startsWith("video") ? "video" : "photo", f); }} />

          <GradientButton onClick={handleMethodContinue} disabled={!uploadMethod}>
            Continue
          </GradientButton>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP: Describe the issue
  // ─────────────────────────────────────────────
  if (step === "details") {
    return (
      <div style={pageStyle} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-5 pb-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("upload")}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E2D40]" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[#1E2D40]">Describe the Issue</h2>
              <p className="text-sm text-slate-500">Tell us more details to help our AI provide the best solution</p>
            </div>
          </div>

          {mediaUrl && mediaType === "photo" && (
            <img src={mediaUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl shadow-sm" />
          )}
          {mediaUrl && mediaType === "video" && (
            <video src={mediaUrl} className="w-full h-40 object-cover rounded-2xl shadow-sm" controls />
          )}

          <div className="space-y-4">
            <div>
              <p className="font-semibold text-[#1E2D40] mb-2 text-sm">What's the problem?</p>
              <Textarea
                placeholder="Describe what you're seeing or experiencing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white border-slate-200 rounded-2xl min-h-[100px] text-[#1E2D40] placeholder:text-slate-400 shadow-sm focus:border-[#6ECBA6] focus-visible:ring-[#6ECBA6]"
              />
            </div>

            <div>
              <p className="font-semibold text-[#1E2D40] mb-2 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                Where is it located?
              </p>
              <Input
                placeholder="e.g., Kitchen, Bathroom, Living Room..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-white border-slate-200 rounded-2xl text-[#1E2D40] placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div>
              <p className="font-semibold text-[#1E2D40] mb-2 text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                Issue Category
              </p>
              <div className="space-y-2">
                {CATEGORY_OPTIONS.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setCategory(value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white transition-all text-left shadow-sm",
                      category === value ? "border-[#6ECBA6] ring-1 ring-[#6ECBA6]" : "border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      category === value ? "bg-[#6ECBA6]/20" : "bg-slate-100"
                    )}>
                      <Icon className={cn("w-5 h-5", category === value ? "text-[#6ECBA6]" : "text-slate-500")} />
                    </div>
                    <span className="font-medium text-[#1E2D40]">{label}</span>
                    {category === value && <CheckCircle2 className="w-4 h-4 text-[#6ECBA6] ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {isBusinessUser && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-[#6ECBA6]" />
                  <p className="font-semibold text-[#1E2D40] text-sm">Property Details</p>
                </div>
                <Input
                  placeholder="Property name / reference"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="bg-white border-slate-200 rounded-2xl shadow-sm"
                />
                <Input
                  placeholder="Property address"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="bg-white border-slate-200 rounded-2xl shadow-sm"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <GradientButton
            onClick={handleUpload}
            disabled={!description.trim() || (isBusinessUser && !propertyName.trim()) || uploading || analyzing}
          >
            {uploading || analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Analysing...
              </span>
            ) : "Continue"}
          </GradientButton>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP: Questions (one at a time, bot-style)
  // ─────────────────────────────────────────────
  if (step === "questions" && questions.length > 0) {
    const currentQ = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;
    const currentAnswer = answers[currentQ?.id] || "";

    // Assign a unique icon per option within this question
    const optionIcons = [CalendarDays, TrendingUp, TrendingDown, CircleHelp, Timer, ArrowRight, Wrench, Eye];

    return (
      <div style={pageStyle} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 flex flex-col min-h-screen">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() =>
                currentQuestionIdx > 0
                  ? setCurrentQuestionIdx(currentQuestionIdx - 1)
                  : setStep("details")
              }
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E2D40]" />
            </button>
            {/* Progress dots */}
            <div className="flex gap-2">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === currentQuestionIdx ? 32 : 16,
                    background:
                      i === currentQuestionIdx
                        ? NAVY
                        : i < currentQuestionIdx
                        ? GREEN
                        : "#cbd5e1",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bot avatar */}
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${NAVY} 100%)` }}
            >
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Question bubble */}
          <div className="bg-white rounded-2xl rounded-tl-sm p-5 shadow-sm mb-1">
            <p className="text-[#1E2D40] font-semibold text-lg leading-snug">
              {currentQ?.question}
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center mb-5">
            This helps us provide more accurate guidance
          </p>

          {/* Options */}
          <div className="flex-1 space-y-3">
            {currentQ?.type === "text" && (
              <Input
                placeholder="Your answer..."
                value={currentAnswer}
                onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                className="bg-white border-slate-200 rounded-2xl text-[#1E2D40] shadow-sm"
              />
            )}

            {(currentQ?.type === "choice" || currentQ?.type === "yesno") &&
              (currentQ.options || ["Yes", "No"]).map((option, i) => {
                const Icon = optionIcons[i % optionIcons.length];
                return (
                  <OptionRow
                    key={i}
                    icon={Icon}
                    label={option}
                    selected={currentAnswer === option}
                    onClick={() => setAnswers({ ...answers, [currentQ.id]: option })}
                  />
                );
              })}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 mt-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <GradientButton onClick={handleQuestionNext} disabled={!currentAnswer || analyzing}>
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analysing...
                </span>
              ) : isLastQuestion ? "See Results" : "Next"}
            </GradientButton>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP: Ad / loading screen
  // ─────────────────────────────────────────────
  if (step === "ad") {
    return (
      <div style={pageStyle} className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-sm text-center space-y-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${NAVY} 100%)` }}
          >
            <VideoIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1E2D40]">Your Results Are Ready</h3>
            <p className="text-sm text-slate-500 mt-2">
              Watch a quick ad to unlock your complete home maintenance diagnosis and recommendations
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Preparing your results...</span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP: Storage prompt
  // ─────────────────────────────────────────────
  if (showStoragePrompt) {
    return (
      <div style={pageStyle} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#1E2D40] mb-2">Save this scan?</h3>
            <p className="text-sm text-slate-500 mb-5">
              This scan and its full analysis will be saved to your{" "}
              <strong>Recent Issues</strong> for <strong>45 days</strong>.
            </p>
            <div className="rounded-xl p-3 mb-5 flex items-start gap-3 bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-[#6ECBA6] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1E2D40]">
                  {issueType?.brief_description || "Issue scan"}
                </p>
                <p className="text-xs mt-0.5 text-slate-500">
                  Saved for 45 days · Viewable in Recent Issues
                </p>
              </div>
            </div>
          </div>

          <GradientButton onClick={handleStoreIssue} disabled={analyzing}>
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Yes, save and close"
            )}
          </GradientButton>

          <button
            onClick={onCancel}
            className="w-full py-3 text-center text-slate-500 font-medium hover:text-red-600 transition-colors"
          >
            Discard and close
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // STEP: Suggestions / results
  // ─────────────────────────────────────────────
  // Generate a short friendly header from the issue type
  const issueShortLabel = issueType?.category
    ? `Looks like a ${issueType.category} issue`
    : issueType?.brief_description
    ? issueType.brief_description.split(" ").slice(0, 4).join(" ")
    : "Here's your diagnosis";

  if (step === "suggestions") {
    return (
      <div style={pageStyle} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6 space-y-4 pb-12">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-[#1E2D40]" />
            </button>
            <h3 className="font-bold text-lg text-[#1E2D40]">Diagnosis</h3>
          </div>

          {/* Friendly issue header card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#1E2D40] leading-tight capitalize">
              {issueShortLabel}
            </p>
            {issueType?.brief_description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{issueType.brief_description}</p>
            )}
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {suggestions?.estimated_repair_time && (
              <AccordionItem value="time" className="border rounded-2xl px-4 bg-white border-slate-200 shadow-sm">
                <AccordionTrigger className="flex items-center gap-3 text-[#1E2D40]">
                  <Clock className="w-5 h-5 flex-shrink-0 text-[#6ECBA6]" />
                  How Long Will This Take?
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-slate-600">
                    {suggestions.estimated_repair_time.diy_time && (
                      <p><strong>DIY:</strong> {suggestions.estimated_repair_time.diy_time}</p>
                    )}
                    {suggestions.estimated_repair_time.professional_time && (
                      <p><strong>Professional:</strong> {suggestions.estimated_repair_time.professional_time}</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="causes" className="border rounded-2xl px-4 bg-white border-slate-200 shadow-sm">
              <AccordionTrigger className="flex items-center gap-3 text-[#1E2D40]">
                <Search className="w-5 h-5 flex-shrink-0 text-[#6ECBA6]" />
                What Caused This?
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {suggestions?.likely_causes?.map((cause, i) => (
                    <div key={i} className="p-3 rounded-xl border-l-2 border-blue-300 bg-blue-50">
                      <p className="font-medium text-sm text-[#1E2D40]">{cause.cause}</p>
                      <p className="text-xs mt-1 text-slate-600">{cause.details}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {suggestions?.diagnostic_steps?.length > 0 && (
              <AccordionItem value="steps" className="border rounded-2xl px-4 bg-white border-slate-200 shadow-sm">
                <AccordionTrigger className="flex items-center gap-3 text-[#1E2D40]">
                  <Eye className="w-5 h-5 flex-shrink-0 text-[#6ECBA6]" />
                  How to Check What's Wrong
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {suggestions.diagnostic_steps.map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-blue-50 text-sm">
                        <p className="font-medium text-[#1E2D40]">
                          Step {s.step_number}: {s.action}
                        </p>
                        {s.safety_note && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {s.safety_note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {suggestions?.tools_and_materials?.length > 0 && (
              <AccordionItem value="tools" className="border rounded-2xl px-4 bg-white border-slate-200 shadow-sm">
                <AccordionTrigger className="flex items-center gap-3 text-[#1E2D40]">
                  <Wrench className="w-5 h-5 flex-shrink-0 text-[#6ECBA6]" />
                  What You'll Need
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {suggestions.tools_and_materials.slice(0, 5).map((item, i) => {
                      const searchTerm = encodeURIComponent(item.search_term || item.product_name);
                      const affiliateLink = `https://amazon.co.uk/s?k=${searchTerm}&tag=ufixi-21`;
                      return (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-[#1E2D40]">{item.product_name}</p>
                            {item.estimated_cost && (
                              <span className="text-xs font-semibold text-[#1E4D6B]">{item.estimated_cost}</span>
                            )}
                          </div>
                          {item.reason_needed && (
                            <p className="text-xs text-slate-500 mb-2">{item.reason_needed}</p>
                          )}
                          <a
                            href={affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs bg-[#F7B600] text-[#1E2D40] px-3 py-1 rounded-full font-medium"
                          >
                            <ShoppingCart className="w-3 h-3" /> Buy on Amazon
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="fixes" className="border rounded-2xl px-4 bg-white border-slate-200 shadow-sm">
              <AccordionTrigger className="flex items-center gap-3 text-[#1E2D40]">
                <Zap className="w-5 h-5 flex-shrink-0 text-[#6ECBA6]" />
                Quick Fixes to Try
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {suggestions?.diy_quick_fixes?.slice(0, 3).map((fix, i) => (
                    <div key={i} className="p-3 rounded-xl border-l-2 border-[#6ECBA6] bg-green-50 text-sm">
                      <p className="font-medium text-[#1E2D40]">{fix.action}</p>
                      <p className="text-xs mt-1 text-slate-600">{fix.description}</p>
                      <p className={cn(
                        "text-xs mt-1 font-medium",
                        fix.difficulty === "Easy" ? "text-green-700" : fix.difficulty === "Moderate" ? "text-amber-700" : "text-red-700"
                      )}>
                        {fix.difficulty} · {fix.estimated_time}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="warnings" className="border rounded-2xl px-4 border-red-200 bg-red-50 shadow-sm">
              <AccordionTrigger className="text-red-700 font-semibold flex items-center gap-3 [&>svg:first-child]:rotate-0">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 !rotate-0" />
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

          <IssueChatbot issueType={issueType} suggestions={suggestions} mediaUrl={mediaUrl} />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <GradientButton onClick={() => setShowStoragePrompt(true)} disabled={analyzing}>
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : "Save Full Diagnosis"}
          </GradientButton>

          <button
            onClick={onCancel}
            className="w-full py-3 text-center text-slate-500 font-medium hover:text-red-600 transition-colors"
          >
            Close without saving
          </button>
        </div>
      </div>
    );
  }

  return null;
}