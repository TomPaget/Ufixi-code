import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ThumbsUp, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ForumPost() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  const [commentContent, setCommentContent] = useState("");
  const [moderationError, setModerationError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["forum-post", postId],
    queryFn: async () => {
      const posts = await base44.entities.ForumPost.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["forum-comments", postId],
    queryFn: () => base44.entities.ForumComment.filter({ post_id: postId, moderation_status: "approved" }, "-created_date", 100),
    enabled: !!postId
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.ForumPost.update(postId, { likes: (post?.likes || 0) + 1 }),
    onSuccess: () => queryClient.invalidateQueries(["forum-post", postId])
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      // Moderate comment
      const moderation = await base44.functions.invoke('moderateContent', {
        content,
        type: 'comment'
      });

      if (!moderation.data.approved) {
        throw new Error(moderation.data.reason || 'Content did not pass moderation');
      }

      // Create comment
      const comment = await base44.entities.ForumComment.create({
        post_id: postId,
        content,
        moderation_status: "approved",
        is_moderated: true,
        author_name: user?.full_name || "Anonymous",
        author_is_trades: user?.account_type === "trades" && user?.trades_status === "approved"
      });

      // Update comment count
      await base44.entities.ForumPost.update(postId, {
        comments_count: (post?.comments_count || 0) + 1
      });

      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["forum-comments", postId]);
      queryClient.invalidateQueries(["forum-post", postId]);
      setCommentContent("");
      setModerationError(null);
    },
    onError: (error) => {
      setModerationError(error.message);
    }
  });

  if (postLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-[#57CFA4]" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
      )}>
        <div className="text-center">
          <p className={cn(theme === "dark" ? "text-white" : "text-[#1E3A57]")}>Post not found</p>
          <Button onClick={() => navigate(createPageUrl("Forum"))} className="mt-4">
            Back to Forum
          </Button>
        </div>
      </div>
    );
  }

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
            onClick={() => navigate(createPageUrl("Forum"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Post</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Post */}
        <div className={cn(
          "rounded-2xl p-5 border-2",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-white border-[#1E3A57]/20"
        )}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className={cn(
                "text-xl font-bold mb-1",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>{post.title}</h2>
              {post.author_is_trades && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                  ✓ Verified Trades
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full capitalize border-2 whitespace-nowrap",
              theme === "dark"
                ? "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]"
                : "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]"
            )}>
              {post.category.replace(/_/g, " ")}
            </span>
          </div>

          <p className={cn(
            "mb-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
          )}>{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-xl mb-4"
            />
          )}

          <div className="flex items-center justify-between text-sm">
            <span className={cn(
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              by {post.author_name || "Anonymous"} • {format(new Date(post.created_date), "MMM d, yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              className="gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              {post.likes}
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <h3 className={cn(
            "font-bold mb-4",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>
            Comments ({post.comments_count || 0})
          </h3>

          {/* Add Comment */}
          <div className={cn(
            "rounded-2xl p-4 mb-4 border-2",
            theme === "dark"
              ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
              : "bg-white border-[#1E3A57]/20"
          )}>
            {moderationError && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-3 flex items-start gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{moderationError}</p>
              </div>
            )}
            <Textarea
              placeholder="Share your thoughts..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className={cn(
                "border-2 mb-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
            />
            <Button
              onClick={() => commentMutation.mutate(commentContent)}
              disabled={!commentContent.trim() || commentMutation.isPending}
              className="w-full bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57]"
            >
              {commentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Comment
                </>
              )}
            </Button>
          </div>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className={cn(
                  "rounded-2xl h-24 animate-pulse",
                  theme === "dark" ? "bg-[#1E3A57]/50" : "bg-slate-100"
                )} />
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "rounded-2xl p-4 border-2",
                    theme === "dark"
                      ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
                      : "bg-white border-[#1E3A57]/20"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={cn(
                        "font-semibold text-sm",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        {comment.author_name || "Anonymous"}
                      </p>
                      {comment.author_is_trades && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white mt-1">
                          ✓ Verified Trades
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs",
                      theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                    )}>
                      {format(new Date(comment.created_date), "MMM d")}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm",
                    theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                  )}>{comment.content}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className={cn(
              "text-center py-8",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}