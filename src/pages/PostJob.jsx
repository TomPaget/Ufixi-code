import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, X, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function PostJob() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData) => base44.entities.JobPosting.create(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobPostings"]);
      navigate(createPageUrl("MyJobs"));
    }
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setPhotos([...photos, ...urls]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createJobMutation.mutate({
      customer_id: user?.id,
      customer_name: user?.display_name || user?.full_name,
      title,
      description,
      trade_type: tradeType,
      budget_min: budgetMin ? parseFloat(budgetMin) : undefined,
      budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
      urgency,
      photos,
      location: user?.approximate_location || "Not specified",
      status: "open"
    });
  };

  const isValid = title && description && tradeType;

  return (
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Post a Job</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Job Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fix leaking kitchen tap"
              className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Description *
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job in detail..."
              className={cn(
                "h-32 border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Trade Type *
            </Label>
            <Select value={tradeType} onValueChange={setTradeType}>
              <SelectTrigger className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue placeholder="Select trade type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="general">General Handyman</SelectItem>
                <SelectItem value="appliances">Appliances</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
              )}>
                Min Budget (£)
              </Label>
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="100"
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>
            <div>
              <Label className={cn(
                "mb-2 block",
                theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
              )}>
                Max Budget (£)
              </Label>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="300"
                className={cn(
                  "border-2",
                  theme === "dark"
                    ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                    : "bg-white border-slate-200"
                )}
              />
            </div>
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Urgency
            </Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className={cn(
                "border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait weeks</SelectItem>
                <SelectItem value="medium">Medium - Within a week</SelectItem>
                <SelectItem value="high">High - Within 2-3 days</SelectItem>
                <SelectItem value="urgent">Urgent - ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={cn(
              "mb-2 block",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-700"
            )}>
              Photos (Optional)
            </Label>
            <div className="space-y-3">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                uploading ? "opacity-50 cursor-not-allowed" : "",
                theme === "dark"
                  ? "border-[#57CFA4]/30 hover:border-[#57CFA4] hover:bg-[#57CFA4]/5"
                  : "border-slate-300 hover:border-[#57CFA4] hover:bg-[#57CFA4]/5"
              )}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#57CFA4]" />
                    <span className={cn(
                      "text-sm",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#57CFA4]" />
                    <span className={cn(
                      "text-sm",
                      theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                    )}>Upload photos</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isValid || createJobMutation.isPending}
            className="w-full h-12 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold rounded-xl"
          >
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 mr-2" />
                Post Job
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}