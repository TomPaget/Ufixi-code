import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const categories = [
  { value: "all", label: "All Topics" },
  { value: "general", label: "General" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "diy_tips", label: "DIY Tips" },
  { value: "landlord_advice", label: "Landlord Advice" },
  { value: "recommendations", label: "Recommendations" }
];

export default function Forum() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["forum-posts", selectedCategory],
    queryFn: async () => {
      const filter = selectedCategory === "all" 
        ? { moderation_status: "approved" }
        : { category: selectedCategory, moderation_status: "approved" };
      return base44.entities.ForumPost.filter(filter, "-created_date", 50);
    }
  });

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
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className={cn(
            "font-bold text-lg flex-1",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Community Forum</h1>
          <Button
            size="sm"
            className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] rounded-xl"
            onClick={() => navigate(createPageUrl("CreatePost"))}
          >
            <Plus className="w-4 h-4 mr-1" />
            Post
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border-2",
                selectedCategory === cat.value
                  ? theme === "dark"
                    ? "bg-[#57CFA4] border-[#57CFA4] text-[#1E3A57]"
                    : "bg-[#57CFA4] border-[#57CFA4] text-white"
                  : theme === "dark"
                    ? "bg-[#1E3A57]/50 border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                    : "bg-white border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn(
                "rounded-2xl h-32 animate-pulse",
                theme === "dark" ? "bg-[#1E3A57]/50" : "bg-slate-100"
              )} />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={createPageUrl(`ForumPost?id=${post.id}`)}>
                  <div className={cn(
                    "rounded-2xl p-4 border-2 transition-all hover:scale-[1.02]",
                    theme === "dark"
                      ? "bg-[#1E3A57]/50 border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                      : "bg-white border-[#1E3A57]/20 hover:border-[#57CFA4]/50"
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className={cn(
                        "font-bold",
                        theme === "dark" ? "text-white" : "text-[#1E3A57]"
                      )}>{post.title}</h3>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full capitalize border-2",
                        theme === "dark"
                          ? "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]"
                          : "bg-[#F7B600]/20 text-[#F7B600] border-[#F7B600]"
                      )}>
                        {post.category.replace("_", " ")}
                      </span>
                    </div>
                    <p className={cn(
                      "text-sm mb-3 line-clamp-2",
                      theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                    )}>{post.content}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(
                        theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                      )}>
                        by {post.author_name || "Anonymous"} • {format(new Date(post.created_date), "MMM d")}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "text-center py-12 rounded-2xl border-2",
            theme === "dark"
              ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
              : "bg-white border-[#1E3A57]/20"
          )}>
            <MessageSquare className={cn(
              "w-12 h-12 mx-auto mb-3",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/50"
            )} />
            <p className={cn(
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>No posts yet</p>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>Be the first to start a discussion!</p>
          </div>
        )}
      </main>
    </div>
  );
}