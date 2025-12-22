import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  MessageCircle, 
  CheckCircle2,
  Clock,
  DollarSign,
  Camera,
  Upload,
  Loader2,
  MapPin,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import PaymentRequestDialog from "@/components/kora/PaymentRequestDialog";

export default function JobDetail() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get("id");

  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId
  });

  const updateJobMutation = useMutation({
    mutationFn: (updates) => base44.entities.Job.update(jobId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(["job", jobId]);
      queryClient.invalidateQueries(["jobs"]);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newPhotos = [...(job?.photos || []), file_url];
      await updateJobMutation.mutateAsync({ photos: newPhotos });
      setPhotos(newPhotos);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleStartJob = async () => {
    await updateJobMutation.mutateAsync({
      status: "in_progress",
      start_date: new Date().toISOString()
    });
  };

  const handleCompleteJob = async () => {
    // Open payment dialog instead of directly completing
    setShowPaymentDialog(true);
  };

  const handlePaymentRequestComplete = async (invoice) => {
    setShowPaymentDialog(false);
    queryClient.invalidateQueries(["job", jobId]);
    queryClient.invalidateQueries(["jobs"]);
  };

  const handleOpenChat = async () => {
    let convo = await base44.entities.Conversation.filter({
      participant_1_id: user.id,
      participant_2_id: job.customer_id
    });

    if (convo.length === 0) {
      convo = await base44.entities.Conversation.filter({
        participant_1_id: job.customer_id,
        participant_2_id: user.id
      });
    }

    if (convo.length > 0) {
      navigate(createPageUrl(`Chat?id=${convo[0].id}`));
    } else {
      const newConvo = await base44.entities.Conversation.create({
        participant_1_id: user.id,
        participant_1_name: user?.trades_business_name || user?.full_name,
        participant_2_id: job.customer_id,
        participant_2_name: job.customer_name,
        last_message_date: new Date().toISOString()
      });
      navigate(createPageUrl(`Chat?id=${newConvo.id}`));
    }
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
      )}>
        <div className="text-center">
          <p className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>Job not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-500",
    accepted: "bg-blue-500",
    in_progress: "bg-purple-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500"
  };

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
            onClick={() => navigate(-1)}
            className={cn(
              "rounded-xl",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/20 text-[#57CFA4]"
                : "hover:bg-slate-100 text-[#1E3A57]"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className={cn(
              "font-bold",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              {job.title}
            </h1>
            <p className={cn(
              "text-xs",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Job #{job.id.slice(0, 8)}
            </p>
          </div>
          <Badge className={statusColors[job.status]}>
            {job.status.replace("_", " ")}
          </Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleOpenChat}
            className="flex-1 bg-[#57CFA4] hover:bg-[#57CFA4]/90"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat with Customer
          </Button>
        </div>

        {/* Customer Info */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h2 className={cn(
            "font-semibold mb-3",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Customer Details
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#57CFA4]" />
              <span className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>
                {job.customer_name}
              </span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#57CFA4]" />
                <span className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>
                  {job.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h2 className={cn(
            "font-semibold mb-3",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Job Description
          </h2>
          <p className={cn(
            "text-sm leading-relaxed",
            theme === "dark" ? "text-white" : "text-slate-700"
          )}>
            {job.description}
          </p>

          {job.priority && (
            <div className="mt-4">
              <Badge className={cn(
                job.priority === "urgent" && "bg-red-500",
                job.priority === "high" && "bg-orange-500",
                job.priority === "medium" && "bg-yellow-500",
                job.priority === "low" && "bg-blue-500"
              )}>
                {job.priority} priority
              </Badge>
            </div>
          )}
        </div>

        {/* Cost & Payment */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h2 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <DollarSign className="w-5 h-5 text-[#F7B600]" />
            Cost & Payment
          </h2>

          {job.estimated_cost && (
            <div className="mb-3">
              <p className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                Estimated Cost
              </p>
              <p className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>
                £{job.estimated_cost}
              </p>
            </div>
          )}

          {job.status === "completed" && job.actual_cost && (
            <div>
              <p className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-slate-500")}>
                Final Cost
              </p>
              <p className={cn(
                "text-2xl font-bold text-[#57CFA4]"
              )}>
                £{job.actual_cost}
              </p>

              {job.payment_status === "requested" && (
                <Badge className="bg-yellow-500 w-full justify-center py-2 mt-3">
                  Payment Requested - Awaiting Customer
                </Badge>
              )}

              {job.payment_status === "paid" && (
                <Badge className="bg-green-500 w-full justify-center py-2 mt-3">
                  Payment Received ✓
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Job Timeline */}
        {(job.start_date || job.completion_date) && (
          <div className={cn(
            "rounded-2xl p-5 border",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/20"
              : "bg-white border-slate-200"
          )}>
            <h2 className={cn(
              "font-semibold mb-3",
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              Timeline
            </h2>
            <div className="space-y-2">
              {job.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[#57CFA4]" />
                  <span className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>
                    Started: {format(new Date(job.start_date), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
              {job.completion_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className={cn(theme === "dark" ? "text-white" : "text-slate-900")}>
                    Completed: {format(new Date(job.completion_date), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h2 className={cn(
            "font-semibold mb-3 flex items-center gap-2",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            <Camera className="w-5 h-5 text-[#57CFA4]" />
            Job Photos
          </h2>

          {job.photos && job.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {job.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Job photo ${i + 1}`}
                  className="w-full h-32 object-cover rounded-xl"
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
                  Upload Photo
                </span>
              </>
            )}
          </label>
        </div>

        {/* Notes */}
        <div className={cn(
          "rounded-2xl p-5 border",
          theme === "dark"
            ? "bg-[#1A2F42] border-[#57CFA4]/20"
            : "bg-white border-slate-200"
        )}>
          <h2 className={cn(
            "font-semibold mb-3",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Job Notes
          </h2>
          <Textarea
            placeholder="Add notes about the job..."
            value={notes || job.notes || ""}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes && notes !== job.notes) {
                updateJobMutation.mutate({ notes });
              }
            }}
            className={cn(
              "min-h-24",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
          />
        </div>

        {/* Action Buttons */}
        {job.status === "accepted" && (
          <Button
            onClick={handleStartJob}
            className="w-full h-12 bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-white font-semibold"
            disabled={updateJobMutation.isPending}
          >
            <Clock className="w-5 h-5 mr-2" />
            Start Job
          </Button>
        )}

        {job.status === "in_progress" && (
          <Button
            onClick={handleCompleteJob}
            className="w-full h-12 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] font-semibold"
            disabled={updateJobMutation.isPending}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Complete & Request Payment
          </Button>
        )}
      </main>

      {/* Payment Request Dialog */}
      <PaymentRequestDialog
        job={job}
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onComplete={handlePaymentRequestComplete}
      />
    </div>
  );
}