import { useState } from "react";
import { base44 } from "@/api/base44Client";
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
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";

export default function GuidedIssueFlow({ onComplete, onCancel }) {
  const { theme } = useTheme();
  const [step, setStep] = useState("upload"); // upload, details, triage, questions, suggestions, analyze
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [issueType, setIssueType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [suggestions, setSuggestions] = useState(null);
  
  // User-provided details
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");

  // Step 1: Upload media
  const handleFileSelect = async (type, file) => {
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
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      setMediaUrl(file_url);
      
      // Quick AI triage to identify issue type
      setAnalyzing(true);
      const triage = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this ${mediaType} and identify:
1. The category of problem (plumbing, electrical, structural, appliance, hvac, other)
2. A brief one-sentence description of what you see

Be concise and specific.`,
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

      setQuestions(questionsResult.questions);
      setStep("questions");
    } catch (error) {
      console.error("Upload/analysis failed:", error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Step 2: Answer questions and get AI suggestions
  const handleQuestionsSubmit = async () => {
    setAnalyzing(true);
    try {
      const answersText = questions.map(q => 
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");

      const suggestionsResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this ${issueType.category} issue and customer responses:

Issue: ${issueType.brief_description}

Customer's answers:
${answersText}

Provide:
1. 2-3 likely causes of this problem
2. 3-5 quick DIY fixes the customer can try right now (simple, safe actions)
3. Warning signs that indicate they should call a professional immediately

Be practical, safety-conscious, and helpful.`,
        file_urls: [mediaUrl],
        response_json_schema: {
          type: "object",
          properties: {
            likely_causes: {
              type: "array",
              items: { type: "string" }
            },
            diy_quick_fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  description: { type: "string" }
                },
                required: ["action", "description"]
              }
            },
            call_pro_if: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["likely_causes", "diy_quick_fixes", "call_pro_if"]
        }
      });

      setSuggestions(suggestionsResult);
      setStep("suggestions");
    } catch (error) {
      console.error("Suggestions failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 3: Full analysis
  const handleFullAnalysis = async () => {
    setAnalyzing(true);
    try {
      const answersText = questions.map(q => 
        `${q.question}: ${answers[q.id] || "Not answered"}`
      ).join("\n");

      await onComplete(mediaUrl, mediaType, {
        description: description || issueType.brief_description,
        category: category || issueType.category,
        location,
        duration,
        questionsAndAnswers: answersText
      });
    } catch (error) {
      console.error("Full analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
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
          Take a photo, video, or audio recording of the problem
        </p>

        {!mediaFile ? (
          <div className="grid grid-cols-3 gap-3">
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
              <Camera className="w-6 h-6 mb-2 text-[#F7B600]" />
              <span className={cn(
                "text-xs text-center",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Photo
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
                Video
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
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFileSelect("audio", e.target.files[0])}
              />
              <Mic className="w-6 h-6 mb-2 text-blue-500" />
              <span className={cn(
                "text-xs text-center",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Audio
              </span>
            </label>
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
                className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full mt-4"
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
                    <Label htmlFor={cat} className="cursor-pointer capitalize">{cat}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!description.trim() || uploading || analyzing}
          className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
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
                  value={answers[q.id]}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${q.id}-yes`} />
                      <Label htmlFor={`${q.id}-yes`} className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${q.id}-no`} />
                      <Label htmlFor={`${q.id}-no`} className="cursor-pointer">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {q.type === "choice" && q.options && (
                <RadioGroup
                  value={answers[q.id]}
                  onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                >
                  <div className="space-y-2">
                    {q.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${i}`} />
                        <Label htmlFor={`${q.id}-${i}`} className="cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleQuestionsSubmit}
          disabled={analyzing}
          className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
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

  if (step === "suggestions") {
    return (
      <div className={cn(
        "rounded-2xl p-6 border max-h-[70vh] overflow-y-auto",
        theme === "dark"
          ? "bg-[#1A2F42] border-[#57CFA4]/20"
          : "bg-white border-slate-200"
      )}>
        <h3 className={cn(
          "font-semibold mb-2 flex items-center gap-2",
          theme === "dark" ? "text-white" : "text-[#1E3A57]"
        )}>
          <Lightbulb className="w-5 h-5 text-[#F7B600]" />
          AI Suggestions
        </h3>
        <p className={cn(
          "text-sm mb-6",
          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
        )}>
          Here's what might be causing this and some things you can try
        </p>

        {/* Likely Causes */}
        <div className="mb-6">
          <h4 className={cn(
            "font-semibold mb-2",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
          )}>
            Likely Causes:
          </h4>
          <ul className="space-y-2">
            {suggestions?.likely_causes?.map((cause, i) => (
              <li key={i} className={cn(
                "flex items-start gap-2 text-sm",
                theme === "dark" ? "text-white" : "text-slate-700"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F7B600] mt-2 flex-shrink-0" />
                {cause}
              </li>
            ))}
          </ul>
        </div>

        {/* DIY Quick Fixes */}
        <div className="mb-6">
          <h4 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]"
          )}>
            <Wrench className="w-4 h-4" />
            Quick Fixes to Try:
          </h4>
          <div className="space-y-3">
            {suggestions?.diy_quick_fixes?.map((fix, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl border",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <p className={cn(
                  "font-medium text-sm mb-1",
                  theme === "dark" ? "text-white" : "text-[#1E3A57]"
                )}>
                  {i + 1}. {fix.action}
                </p>
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  {fix.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Signs */}
        <div className={cn(
          "p-4 rounded-xl border-2 mb-6",
          "bg-red-50 border-red-200"
        )}>
          <h4 className="font-semibold mb-2 text-red-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Call a Professional If:
          </h4>
          <ul className="space-y-1">
            {suggestions?.call_pro_if?.map((warning, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleFullAnalysis}
            disabled={analyzing}
            className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting full analysis...
              </>
            ) : (
              "Get Full Professional Analysis"
            )}
          </Button>

          <p className={cn(
            "text-center text-xs",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
          )}>
            Get detailed cost estimates, step-by-step guides, and more
          </p>
        </div>
      </div>
    );
  }

  return null;
}