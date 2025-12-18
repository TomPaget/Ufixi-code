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
        author_name: user?.full_name || "Anonymous"
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
    <div className={cn(
      "min-h-screen pb-20",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      <header className={cn(
        "sticky top-0 z-30 border-b-2",
        theme === "dark" ? "bg-[#1E3A57] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
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
          )}>Create Post</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {moderationError && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-500">Post Not Allowed</p>
              <p className="text-sm text-red-400 mt-1">{moderationError}</p>
            </div>
          </div>
        )}

        <div>
          <label className={cn(
            "text-sm font-medium mb-1 block",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Title
          </label>
          <Input
            placeholder="What's your question or topic?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "border-2",
              theme === "dark"
                ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                : "bg-white border-[#1E3A57]/20"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "text-sm font-medium mb-1 block",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={cn(
              "border-2",
              theme === "dark"
                ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                : "bg-white border-[#1E3A57]/20"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="diy_tips">DIY Tips</SelectItem>
              <SelectItem value="landlord_advice">Landlord Advice</SelectItem>
              <SelectItem value="recommendations">Recommendations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={cn(
            "text-sm font-medium mb-1 block",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
            Description
          </label>
          <Textarea
            placeholder="Share details, ask questions, or provide tips..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={cn(
              "border-2 min-h-[150px]",
              theme === "dark"
                ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                : "bg-white border-[#1E3A57]/20"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "text-sm font-medium mb-2 block",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>
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
            <label className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors",
              theme === "dark"
                ? "border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                : "border-[#1E3A57]/20 hover:bg-slate-50"
            )}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
              ) : (
                <>
                  <Upload className={cn("w-8 h-8 mb-2", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/50")} />
                  <span className={cn("text-sm", theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70")}>
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
          className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] font-semibold h-12 rounded-2xl"
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

        <p className={cn(
          "text-xs text-center",
          theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
        )}>
          Posts are automatically moderated to ensure community safety
        </p>
      </main>
    </div>
  );
}