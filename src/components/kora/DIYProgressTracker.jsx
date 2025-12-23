import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Video, Upload, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function DIYProgressTracker({ issueId }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [notes, setNotes] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const { data: progressEntries = [] } = useQuery({
    queryKey: ["diyProgress", issueId],
    queryFn: () => base44.entities.DIYProgress.filter({ issue_id: issueId })
  });

  const handleFileSelect = (file) => {
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const uploadProgressMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      // Upload media
      const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
      const mediaType = mediaFile.type.includes("video") ? "video" : "photo";

      // Moderate content
      const moderation = await base44.functions.invoke('moderateContent', {
        text: notes,
        mediaUrl: file_url
      });

      if (moderation.data.status === "rejected") {
        throw new Error(`Content rejected: ${moderation.data.flags.join(", ")}`);
      }

      // Get AI feedback
      const { data: feedback } = await base44.functions.invoke('analyzeRepairProgress', {
        issueId,
        stepNumber: selectedStep,
        mediaUrl: file_url,
        mediaType,
        userNotes: notes
      });

      // Create progress entry
      return base44.entities.DIYProgress.create({
        issue_id: issueId,
        step_number: selectedStep,
        media_url: file_url,
        media_type: mediaType,
        user_notes: notes,
        ai_feedback: feedback.feedback,
        moderation_status: moderation.data.status,
        quality_score: feedback.qualityScore,
        warnings: feedback.warnings || [],
        suggestions: feedback.suggestions || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["diyProgress", issueId]);
      setMediaFile(null);
      setMediaPreview(null);
      setNotes("");
      setSelectedStep(null);
      setUploading(false);
    },
    onError: (error) => {
      alert(error.message);
      setUploading(false);
    }
  });

  return (
    <div className="space-y-4">
      <h3 className={cn(
        "font-semibold flex items-center gap-2",
        theme === "dark" ? "text-white" : "text-slate-900"
      )}>
        <Camera className="w-5 h-5 text-blue-500" />
        Track Your Progress
      </h3>

      {/* Upload Form */}
      <Card className={cn(
        "p-4",
        theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"
      )}>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Which step are you on?
            </label>
            <input
              type="number"
              min="1"
              value={selectedStep || ""}
              onChange={(e) => setSelectedStep(parseInt(e.target.value))}
              placeholder="Step number"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {!mediaPreview ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <Camera className="w-8 h-8 mb-2 text-blue-500" />
                <span className="text-sm">Take Photo</span>
              </label>

              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <Video className="w-8 h-8 mb-2 text-purple-500" />
                <span className="text-sm">Record Video</span>
              </label>
            </div>
          ) : (
            <div className="relative">
              {mediaFile?.type.includes("video") ? (
                <video src={mediaPreview} className="w-full rounded-lg" controls />
              ) : (
                <img src={mediaPreview} className="w-full rounded-lg" alt="Preview" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
                className="absolute top-2 right-2"
              >
                Remove
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Add notes or ask questions about this step..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20"
          />

          <Button
            onClick={() => uploadProgressMutation.mutate()}
            disabled={!mediaFile || !selectedStep || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting AI Feedback...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit for AI Review
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Progress History */}
      {progressEntries.length > 0 && (
        <div className="space-y-3">
          <h4 className={cn(
            "font-medium text-sm",
            theme === "dark" ? "text-slate-300" : "text-slate-700"
          )}>
            Your Progress ({progressEntries.length})
          </h4>

          {progressEntries.map((entry) => (
            <Card key={entry.id} className={cn(
              "p-4",
              theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white"
            )}>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  {entry.media_type === "video" ? (
                    <video src={entry.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={entry.media_url} className="w-full h-full object-cover" alt="Progress" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600">
                      Step {entry.step_number}
                    </span>
                    {entry.quality_score && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        entry.quality_score >= 80 ? "bg-green-100 text-green-700" :
                        entry.quality_score >= 60 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {entry.quality_score}% Quality
                      </span>
                    )}
                  </div>

                  {entry.user_notes && (
                    <p className="text-sm text-slate-600 mb-2">{entry.user_notes}</p>
                  )}

                  {entry.ai_feedback && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      <p className="text-sm text-blue-900">{entry.ai_feedback}</p>
                    </div>
                  )}

                  {entry.warnings?.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {entry.warnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-orange-700">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.suggestions?.length > 0 && (
                    <div className="space-y-1">
                      {entry.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-blue-700">
                          <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}