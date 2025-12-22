import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function JobAssistant({ onComplete, initialDescription = "" }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState(initialDescription);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleAnalyzeDescription = async () => {
    if (!description.trim()) return;
    
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job description and provide helpful suggestions:

"${description}"

Provide:
1. The most appropriate trade type (plumbing, electrical, hvac, carpentry, roofing, painting, general, appliances, other)
2. Specific services needed (3-5 specific tasks)
3. Recommended details the customer should add (missing information)
4. Photo suggestions (what angles/areas would help tradespeople quote accurately)
5. Estimated budget range in GBP for this type of work (realistic UK pricing)
6. Urgency level (low, medium, high, urgent)
7. Improved job title (concise, clear, professional)
8. Enhanced description (more detailed, professional, clear expectations)

Be specific and practical. Focus on helping the customer get accurate quotes.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            trade_type: { type: "string" },
            services: { 
              type: "array",
              items: { type: "string" }
            },
            missing_details: {
              type: "array",
              items: { type: "string" }
            },
            photo_suggestions: {
              type: "array",
              items: { type: "string" }
            },
            budget_min: { type: "number" },
            budget_max: { type: "number" },
            urgency: { type: "string" },
            improved_title: { type: "string" },
            enhanced_description: { type: "string" }
          },
          required: ["trade_type", "services", "budget_min", "budget_max"]
        }
      });

      setSuggestions(result);
      setSelectedTrade(result.trade_type);
      setSelectedServices(result.services || []);
      setStep(2);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      setPhotos([...photos, ...results.map(r => r.file_url)]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      title: suggestions?.improved_title || description.slice(0, 50),
      description: suggestions?.enhanced_description || description,
      trade_type: selectedTrade,
      services: selectedServices,
      budget_min: suggestions?.budget_min,
      budget_max: suggestions?.budget_max,
      photos: photos,
      urgency: suggestions?.urgency || "medium"
    });
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Describe the Job */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={cn(
              "rounded-2xl p-6 border",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#F7B600]" />
              <h3 className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                Describe Your Job
              </h3>
            </div>

            <p className={cn(
              "text-sm mb-4",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Tell us what needs to be done. Our AI will help you create a detailed job posting.
            </p>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Need to fix a leaking kitchen tap, water drips constantly even when turned off..."
              className={cn(
                "min-h-32 mb-4",
                theme === "dark"
                  ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />

            <Button
              onClick={handleAnalyzeDescription}
              disabled={!description.trim() || analyzing}
              className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Step 2: Review Suggestions */}
        {step === 2 && suggestions && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Improved Title */}
            <div className={cn(
              "rounded-2xl p-4 border",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#57CFA4]" />
                <p className={cn(
                  "text-sm font-medium",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Suggested Job Title
                </p>
              </div>
              <p className={cn(
                "font-semibold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                {suggestions.improved_title}
              </p>
            </div>

            {/* Trade Type */}
            <div className={cn(
              "rounded-2xl p-4 border",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <p className={cn(
                "text-sm font-medium mb-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Trade Type
              </p>
              <Badge className="bg-[#F7B600] text-[#0F1E2E]">
                {selectedTrade}
              </Badge>
            </div>

            {/* Services Needed */}
            {selectedServices.length > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <p className={cn(
                  "text-sm font-medium mb-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  Services Needed
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map((service, i) => (
                    <Badge key={i} variant="outline" className="border-[#57CFA4]/30">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Estimate */}
            <div className={cn(
              "rounded-2xl p-4 border-2",
              theme === "dark"
                ? "bg-[#F7B600]/10 border-[#F7B600]"
                : "bg-[#F7B600]/5 border-[#F7B600]"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#F7B600]" />
                <p className="text-sm font-medium text-[#F7B600]">
                  Estimated Budget Range
                </p>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                £{suggestions.budget_min} - £{suggestions.budget_max}
              </p>
              <p className={cn(
                "text-xs mt-1",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Based on typical UK pricing for this type of work
              </p>
            </div>

            {/* Enhanced Description */}
            <div className={cn(
              "rounded-2xl p-4 border",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <p className={cn(
                "text-sm font-medium mb-2",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Enhanced Description
              </p>
              <p className={cn(
                "text-sm leading-relaxed",
                theme === "dark" ? "text-white" : "text-slate-700"
              )}>
                {suggestions.enhanced_description}
              </p>
            </div>

            {/* Missing Details Warning */}
            {suggestions.missing_details && suggestions.missing_details.length > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border",
                theme === "dark"
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-orange-50 border-orange-200"
              )}>
                <p className="text-sm font-medium text-orange-600 mb-2">
                  ℹ️ Consider Adding These Details
                </p>
                <ul className="text-sm space-y-1">
                  {suggestions.missing_details.map((detail, i) => (
                    <li key={i} className={cn(
                      theme === "dark" ? "text-white" : "text-slate-700"
                    )}>
                      • {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Photo Suggestions */}
            {suggestions.photo_suggestions && suggestions.photo_suggestions.length > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/20"
                  : "bg-white border-slate-200"
              )}>
                <p className={cn(
                  "text-sm font-medium mb-2",
                  theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                )}>
                  📸 Recommended Photos
                </p>
                <ul className="text-sm space-y-1">
                  {suggestions.photo_suggestions.map((suggestion, i) => (
                    <li key={i} className={cn(
                      theme === "dark" ? "text-white" : "text-slate-700"
                    )}>
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Photo Upload */}
            <div className={cn(
              "rounded-2xl p-4 border",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              <p className={cn(
                "text-sm font-medium mb-3",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
              )}>
                Upload Photos (Optional)
              </p>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Job photo ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              <label className={cn(
                "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                  : "border-slate-200 hover:bg-slate-50"
              )}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#57CFA4]" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2 text-[#57CFA4]" />
                    <span className={cn(
                      "text-sm",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>
                      Add Photos
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
              >
                Post Job
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}