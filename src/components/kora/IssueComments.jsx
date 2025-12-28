import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Send, MessageSquare, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IssueComments({ issueId }) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["issue-comments", issueId],
    queryFn: () => base44.entities.IssueComment.filter({ issue_id: issueId }, "-created_date")
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      const newComment = await base44.entities.IssueComment.create(data);
      
      // Extract mentions from comment (@email)
      const mentions = comment.match(/@(\S+@\S+\.\S+)/g)?.map(m => m.substring(1)) || [];
      
      // Send notifications for mentions
      if (mentions.length > 0) {
        await base44.functions.invoke('sendNotification', {
          userId: user.id,
          notificationType: 'comment_mention',
          data: {
            issueId,
            mentions,
            commentText: comment
          }
        });
      }
      
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["issue-comments", issueId]);
      setComment("");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    addCommentMutation.mutate({
      issue_id: issueId,
      author_name: user.full_name,
      author_email: user.email,
      content: comment,
      is_internal: isInternal
    });
  };

  return (
    <div className={cn(
      "rounded-2xl border p-6",
      theme === "dark"
        ? "bg-[#1A2F42] border-[#57CFA4]/20"
        : "bg-white border-slate-200"
    )}>
      <h3 className={cn(
        "font-semibold mb-4 flex items-center gap-2",
        theme === "dark" ? "text-white" : "text-[#1E3A57]"
      )}>
        <MessageSquare className="w-5 h-5 text-[#F7B600]" />
        Team Notes & Comments
      </h3>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <Textarea
          placeholder="Add a comment or note... Use @email to mention team members"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={cn(
            "min-h-24 mb-3",
            theme === "dark"
              ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
              : "bg-white border-slate-200"
          )}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            <Lock className="w-4 h-4 text-amber-500" />
            <span className={cn(
              "text-sm",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
            )}>
              Internal note (team only)
            </span>
          </label>
          <Button
            type="submit"
            disabled={!comment.trim() || addCommentMutation.isPending}
            size="sm"
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E]"
          >
            <Send className="w-4 h-4 mr-2" />
            {addCommentMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className={cn(
            "text-sm text-center py-4",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            Loading comments...
          </p>
        ) : comments.length > 0 ? (
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "rounded-xl p-4 border",
                  c.is_internal
                    ? theme === "dark"
                      ? "bg-amber-900/20 border-amber-500/30"
                      : "bg-amber-50 border-amber-200"
                    : theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                      theme === "dark"
                        ? "bg-[#57CFA4]/20 text-[#57CFA4]"
                        : "bg-slate-200 text-[#1E3A57]"
                    )}>
                      {c.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={cn(
                        "font-semibold text-sm",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>
                        {c.author_name}
                      </p>
                      <p className={cn(
                        "text-xs",
                        theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                      )}>
                        {format(new Date(c.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {c.is_internal && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Lock className="w-3 h-3" />
                      <span className="text-xs font-medium">Internal</span>
                    </div>
                  )}
                </div>
                <p className={cn(
                  "text-sm whitespace-pre-wrap",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  {c.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className={cn(
            "text-sm text-center py-8",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
          )}>
            No comments yet. Be the first to add a note!
          </p>
        )}
      </div>
    </div>
  );
}