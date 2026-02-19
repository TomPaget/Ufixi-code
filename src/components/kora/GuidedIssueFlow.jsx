import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Camera, 
  Video, 
  CheckCircle2,
  Lightbulb,
  Wrench,
  ArrowRight,
  ChevronLeft,
  Image,
  Film,
  Building2,
  ShoppingCart,
  Clock,
  Search,
  AlertTriangle,
  Eye,
  Zap,
  Bot
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { aiAnalysisLimiter, fileUploadLimiter, checkRateLimit } from "@/components/utils/rateLimiter";
import { sanitizeText } from "@/components/utils/sanitize";
import IssueChatbot from "@/components/kora/IssueChatbot";
import TimedAdBreak from "@/components/kora/TimedAdBreak";

// Gradient button matching the Figma design
function GradientButton({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 rounded-2xl text-white font-semibold text-base transition-all",
        "bg-gradient-to-r from-[#6ECBA6] to-[#1E4D6B]",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]",
        className
      )}
    >
      {children}
    </button>
  );
}

// Option row used in question steps
function OptionRow({ icon: Icon, label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-all text-left",
        selected
          ? "bg-gradient-to-r from-[#6ECBA6] to-[#1E4D6B] border-transparent text-white"
          : "bg-white border-slate-200 text-[#1E2D40] hover:bg-slate-50"
      )}
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

// Upload method row
function UploadMethodRow({ icon: Icon, title, description, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl border bg-white transition-all text-left",
        selected ? "border-[#6ECBA6] ring-1 ring-[#6ECBA6]" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6ECBA6] to-[#1E4D6B] flex items-center justify-center flex-shrink-0">
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
        {selected && <div className="w-full h-full rounded-full flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>}
      </div>
    </button>
  );
}

export default function GuidedIssueFlow({ onComplete, onCancel }) {
  const [step, setStep] = useState("upload");
  const [uploadMethod, setUploadMethod] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
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

  const handleFileSelect = (type, file) => {
    if (!file) return;
    setError(null);
    setMediaType(type);
    setMediaFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setStep("details");
  };

  const triggerFileInput = (type, capture) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "video" ? "video/*" : "image/*";
    if (capture) input.capture = "environment";
    input.onchange = (e) => handleFileSelect(type, e.target.files[0]);
    input.click();
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
      checkRateLimit(fileUploadLimiter, user?.id || 'anonymous');
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      setMediaUrl(file_url);
      checkRateLimit(aiAnalysisLimiter, user?.id || 'anonymous');
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
      uniqueQuestions.forEach(q => { initialAnswers[q.id] = ''; });
      setAnswers(initialAnswers);
      setCurrentQuestionIdx(0);
      setStep("questions");
    } catch (err) {
      setError(err.message || "Failed to analyze. Please try again.");
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
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStoreIssue = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const answersText = questions.map(q =>
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");
      await onComplete(mediaUrl, mediaType, {
        description: sanitizeText(description || issueType?.brief_description || ""),
        category: sanitizeText(category || issueType?.category || ""),
        location: sanitizeText(location),
        questionsAndAnswers: answersText,
        propertyName: isBusinessUser ? sanitizeText(propertyName) : undefined,
        propertyAddress: isBusinessUser ? sanitizeText(propertyAddress) : undefined,
        propertyCategory: isBusinessUser ? propertyCategory : undefined
      });
    } catch (err) {
      setError(err.message || "Failed to store issue. Please try again.");
      setAnalyzing(false);
    }
  };

  const handleCloseScan = () => setShowStoragePrompt(true);

  // Loading state during analysis
  if (analyzing && step === "questions") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="w-12 h-12 animate-spin text-[#6ECBA6] mb-4" />
        <p className="text-center font-semibold text-[#1E2D40] mb-2">Analyzing your issue...</p>
        <p className="text-center text-sm text-slate-500">Please enjoy this brief advertisement</p>
        <TimedAdBreak />
      </div>
    );
  }

  // Step: Upload method selection
  if (step === "upload") {
    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ChevronLeft className="w-5 h-5 text-[#1E2D40]" />
          </button>
          <h2 className="text-xl font-bold text-[#1E2D40]">Scan Issue</h2>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-[#1E2D40] mb-2">Tips for best results:</p>
          <ul className="space-y-1">
            {["Ensure good lighting and focus", "Capture the entire affected area", "Include surrounding context when possible"].map((tip, i) => (
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

        <GradientButton onClick={handleMethodContinue} disabled={!uploadMethod}>
          Continue
        </GradientButton>
      </div>
    );
  }

  // Step: Describe the issue
  if (step === "details") {
    return (
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("upload")} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <ChevronLeft className="w-5 h-5 text-[#1E2D40]" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#1E2D40]">Describe the Issue</h2>
          </div>
        </div>

        <p className="text-slate-500 text-sm">Tell us more details to help our AI provide the best solution</p>

        {mediaUrl && mediaType === "photo" && (
          <img src={mediaUrl} alt="Preview" className="w-full h-40 object-cover rounded-2xl" />
        )}
        {mediaUrl && mediaType === "video" && (
          <video src={mediaUrl} className="w-full h-40 object-cover rounded-2xl" controls />
        )}

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-[#1E2D40] mb-2 text-sm">What's the problem?</p>
            <Textarea
              placeholder="Describe what you're seeing or experiencing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-slate-200 rounded-2xl min-h-[100px] text-[#1E2D40] placeholder:text-slate-400"
            />
          </div>

          <div>
            <p className="font-semibold text-[#1E2D40] mb-2 text-sm">Where is it located?</p>
            <Input
              placeholder="e.g., Kitchen, Bathroom, Living Room..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-white border-slate-200 rounded-2xl text-[#1E2D40] placeholder:text-slate-400"
            />
          </div>

          <div>
            <p className="font-semibold text-[#1E2D40] mb-2 text-sm">Issue Category</p>
            <div className="space-y-2">
              {[
                { value: "plumbing", icon: "🔧", label: "Plumbing" },
                { value: "electrical", icon: "⚡", label: "Electrical" },
                { value: "structural", icon: "🏗️", label: "Structural" },
                { value: "hvac", icon: "🌡️", label: "HVAC" },
                { value: "appliance", icon: "🔌", label: "Appliance" },
                { value: "other", icon: "🔨", label: "Other" },
              ].map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white transition-all text-left",
                    category === value ? "border-[#6ECBA6] ring-1 ring-[#6ECBA6]" : "border-slate-200"
                  )}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="font-medium text-[#1E2D40]">{label}</span>
                  {category === value && <CheckCircle2 className="w-4 h-4 text-[#6ECBA6] ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {isBusinessUser && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-[#F7B600]" />
                <p className="font-semibold text-[#1E2D40] text-sm">Property Details</p>
              </div>
              <Input
                placeholder="Property name / reference"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="bg-white border-slate-200 rounded-2xl"
              />
              <Input
                placeholder="Property address"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="bg-white border-slate-200 rounded-2xl"
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
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </span>
          ) : "Continue"}
        </GradientButton>
      </div>
    );
  }

  // Step: Questions (one at a time, bot-style)
  if (step === "questions" && questions.length > 0) {
    const currentQ = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;
    const currentAnswer = answers[currentQ?.id] || "";

    return (
      <div className="p-5 space-y-5 min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => currentQuestionIdx > 0 ? setCurrentQuestionIdx(currentQuestionIdx - 1) : setStep("details")}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-[#1E2D40]" />
          </button>
          {/* Progress dots */}
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentQuestionIdx ? "w-8 bg-[#1E4D6B]" : i < currentQuestionIdx ? "w-4 bg-[#6ECBA6]" : "w-4 bg-slate-300"
                )}
              />
            ))}
          </div>
        </div>

        {/* Bot avatar */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6ECBA6] to-[#1E4D6B] flex items-center justify-center shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Question bubble */}
        <div className="bg-white rounded-2xl rounded-tl-sm p-5 shadow-sm">
          <p className="text-[#1E2D40] font-semibold text-lg leading-snug">{currentQ?.question}</p>
        </div>
        <p className="text-xs text-slate-400 text-center -mt-3">This helps us provide more accurate guidance</p>

        {/* Options */}
        <div className="flex-1 space-y-3">
          {currentQ?.type === "text" && (
            <Input
              placeholder="Your answer..."
              value={currentAnswer}
              onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
              className="bg-white border-slate-200 rounded-2xl text-[#1E2D40]"
            />
          )}

          {(currentQ?.type === "choice" || currentQ?.type === "yesno") && (currentQ.options || ["Yes", "No"]).map((option, i) => (
            <OptionRow
              key={i}
              label={option}
              selected={currentAnswer === option}
              onClick={() => setAnswers({ ...answers, [currentQ.id]: option })}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <GradientButton
          onClick={handleQuestionNext}
          disabled={!currentAnswer || analyzing}
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
            </span>
          ) : isLastQuestion ? "See Results" : "Next"}
        </GradientButton>
      </div>
    );
  }

  // Step: Storage prompt
  if (showStoragePrompt) {
    return (
      <div className="p-5 space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-[#1E2D40] mb-2">Close this scan?</h3>
          <p className="text-sm text-slate-500 mb-5">
            This scan and its full analysis will be saved to your <strong>Recent Issues</strong> for <strong>45 days</strong>.
          </p>
          <div className="rounded-xl p-3 mb-5 flex items-start gap-3 bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-[#6ECBA6] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#1E2D40]">{issueType?.brief_description || "Issue scan"}</p>
              <p className="text-xs mt-0.5 text-slate-500">Saved for 45 days · Viewable in Recent Issues</p>
            </div>
          </div>
        </div>

        <GradientButton onClick={handleStoreIssue} disabled={analyzing}>
          {analyzing ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
          ) : "Yes, save & close"}
        </GradientButton>

        <button
          onClick={onCancel}
          className="w-full py-3 text-center text-slate-500 font-medium hover:text-red-600 transition-colors"
        >
          Discard & close
        </button>
      </div>
    );
  }

  // Step: Suggestions
  if (step === "suggestions") {
    return (
      <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-[#1E2D40] flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#F7B600]" />
            Analysis Results
          </h3>
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
                  {suggestions.estimated_repair_time.diy_time && <p><strong>DIY:</strong> {suggestions.estimated_repair_time.diy_time}</p>}
                  {suggestions.estimated_repair_time.professional_time && <p><strong>Professional:</strong> {suggestions.estimated_repair_time.professional_time}</p>}
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
                      <p className="font-medium text-[#1E2D40]">Step {s.step_number}: {s.action}</p>
                      {s.safety_note && <p className="text-xs text-amber-600 mt-1">⚠️ {s.safety_note}</p>}
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
                          {item.estimated_cost && <span className="text-xs font-semibold text-[#1E4D6B]">{item.estimated_cost}</span>}
                        </div>
                        {item.reason_needed && <p className="text-xs text-slate-500 mb-2">{item.reason_needed}</p>}
                        <a href={affiliateLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-[#F7B600] text-[#1E2D40] px-3 py-1 rounded-full font-medium">
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
                    <p className={cn("text-xs mt-1 font-medium", fix.difficulty === "Easy" ? "text-green-700" : fix.difficulty === "Moderate" ? "text-amber-700" : "text-red-700")}>
                      {fix.difficulty} • {fix.estimated_time}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warnings" className="border rounded-2xl px-4 border-red-200 bg-red-50 shadow-sm">
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

        <IssueChatbot issueType={issueType} suggestions={suggestions} mediaUrl={mediaUrl} />

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleCloseScan}
          disabled={analyzing}
          className="w-full py-3 text-center text-slate-500 font-medium border border-slate-200 rounded-2xl bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          {analyzing ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span> : "Close Scan"}
        </button>
      </div>
    );
  }

  return null;
}