import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";

export default function CreatePost() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [moderationError, setModerationError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      // Moderate content first
      const moderation = await base44.functions.invoke('moderateContent', {
        content: `${postData.title}\n${postData.content}`,
        image_url: postData.image_url,
        type: 'post'
      });

      if (!moderation.data.approved) {
        throw new Error(moderation.data.reason || 'Content did not pass moderation');
      }

      // Create post
      const post = await base44.entities.ForumPost.create({
        ...postData,
        moderation_status: "approved",
        is_moderated: true,
        author_name: user?.full_name || "Anonymous",
        author_is_trades: user?.account_type === "trades" && user?.trades_status === "approved"
      });

      return post;
    },
    onSuccess: (post) => {
      navigate(createPageUrl(`ForumPost?id=${post.id}`));
    },
    onError: (error) => {
      setModerationError(error.message);
    }
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageFile(file_url);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    setModerationError(null);
    createPostMutation.mutate({
      title,
      content,
      category,
      image_url: imageFile
    });
  };

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated liquid gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/85 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-500/75 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/65 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(15%, 10%) scale(1.2) rotate(5deg); }
          50% { transform: translate(5%, 20%) scale(1.1) rotate(-3deg); }
          75% { transform: translate(-10%, 10%) scale(1.15) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-10%, 15%) scale(1.3) rotate(-6deg); }
          66% { transform: translate(10%, -10%) scale(1.1) rotate(5deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(20%, -15%) scale(1.25) rotate(7deg); }
          60% { transform: translate(-15%, 10%) scale(1.15) rotate(-4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease-in-out infinite;
        }
        .animate-gradient-shift-slow {
          animation: gradient-shift-slow 15s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 13s ease-in-out infinite;
        }
      `}</style>

      <header className="sticky top-0 z-30 border-b-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-slate-100 text-[#1E3A57]"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg text-[#1E3A57]">Create Post</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {moderationError && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-500">Post Not Allowed</p>
              <p className="text-sm text-red-400 mt-1">{moderationError}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block text-[#0F1E2E]/80">
            Title
          </label>
          <Input
            placeholder="What's your question or topic?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/60 backdrop-blur-md border-slate-200"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-[#0F1E2E]/80">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/60 backdrop-blur-md border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="diy">DIY</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="carpentry">Carpentry (Wood)</SelectItem>
              <SelectItem value="landlord_advice">Landlord Advice</SelectItem>
              <SelectItem value="renter_advice">Renter Advice</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-[#0F1E2E]/80">
            Description
          </label>
          <Textarea
            placeholder="Share details, ask questions, or provide tips..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-white/60 backdrop-blur-md border-slate-200 min-h-[150px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block text-[#0F1E2E]/80">
            Image (optional)
          </label>
          {imageFile ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={imageFile} alt="Upload" className="w-full h-48 object-cover" />
              <button
                onClick={() => setImageFile(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors bg-white/60 backdrop-blur-md border-slate-200 hover:bg-white/50">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2 text-[#0F1E2E]/50" />
                  <span className="text-sm text-[#0F1E2E]/70">
                    Tap to upload
                  </span>
                </>
              )}
            </label>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title || !content || createPostMutation.isPending}
          className="w-full bg-[#57CFA4] hover:bg-[#57CFA4]/90 text-[#0F1E2E] font-semibold h-12 rounded-2xl"
        >
          {createPostMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking content...
            </>
          ) : (
            "Post to Forum"
          )}
        </Button>

        <p className="text-xs text-center text-[#0F1E2E]/70">
          Posts are automatically moderated to ensure community safety
        </p>
      </main>
    </div>
  );
}