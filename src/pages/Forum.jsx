import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, Filter, Search, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, parseISO } from "date-fns";

const categories = [
  { value: "all", label: "All Topics" },
  { value: "general", label: "General" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "diy", label: "DIY" },
  { value: "mechanical", label: "Mechanical" },
  { value: "utilities", label: "Utilities" },
  { value: "carpentry", label: "Carpentry (Wood)" },
  { value: "landlord_advice", label: "Landlord Advice" },
  { value: "renter_advice", label: "Renter Advice" },
  { value: "other", label: "Other" }
];

export default function Forum() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
      return base44.entities.ForumPost.filter(filter, "-created_date", 100);
    }
  });

  // Apply client-side filters
  const filteredPosts = posts.filter(post => {
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = post.title?.toLowerCase().includes(query);
      const matchesContent = post.content?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesContent) return false;
    }

    // Author filter
    if (authorFilter.trim()) {
      const authorQuery = authorFilter.toLowerCase();
      const matchesAuthor = post.author_name?.toLowerCase().includes(authorQuery);
      if (!matchesAuthor) return false;
    }

    // Date range filter
    if (dateFrom) {
      const postDate = parseISO(post.created_date);
      const fromDate = parseISO(dateFrom);
      if (isBefore(postDate, fromDate)) return false;
    }

    if (dateTo) {
      const postDate = parseISO(post.created_date);
      const toDate = parseISO(dateTo);
      if (isAfter(postDate, toDate)) return false;
    }

    return true;
  });

  return (
    <div className={cn(
      "min-h-screen pb-20 relative overflow-hidden",
      theme === "dark" ? "bg-[#1E3A57]" : "bg-white"
    )}>
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/70 via-pink-400/35 to-orange-600/70 animate-gradient-shift-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/60 via-yellow-400/25 to-blue-600/60 animate-gradient-shift-slow-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/55 via-pink-300/30 to-orange-600/60 animate-gradient-shift-reverse-slower blur-3xl" />
        <div className="absolute inset-0 bg-white/5" />
      </div>
      
      <style jsx>{`
        @keyframes gradient-shift-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          25% { transform: translate(12%, 8%) scale(1.15) rotate(4deg); }
          50% { transform: translate(4%, 16%) scale(1.08) rotate(-2deg); }
          75% { transform: translate(-8%, 8%) scale(1.12) rotate(3deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-slow-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          33% { transform: translate(-8%, 12%) scale(1.25) rotate(-5deg); }
          66% { transform: translate(8%, -8%) scale(1.08) rotate(4deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        @keyframes gradient-shift-reverse-slower {
          0% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
          30% { transform: translate(16%, -12%) scale(1.2) rotate(6deg); }
          60% { transform: translate(-12%, 8%) scale(1.12) rotate(-3deg); }
          100% { transform: translate(0%, 0%) scale(1) rotate(0deg); }
        }
        .animate-gradient-shift-slower {
          animation: gradient-shift-slower 18s ease-in-out infinite;
        }
        .animate-gradient-shift-slow-slower {
          animation: gradient-shift-slow-slower 22s ease-in-out infinite;
        }
        .animate-gradient-shift-reverse-slower {
          animation: gradient-shift-reverse-slower 20s ease-in-out infinite;
        }
      `}</style>
      
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
        {/* Search Bar */}
        <div className={cn(
          "rounded-2xl p-4 border-2",
          theme === "dark"
            ? "bg-[#1E3A57]/50 border-[#57CFA4]/30"
            : "bg-white border-[#1E3A57]/20"
        )}>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57CFA4]" />
              <Input
                placeholder="Search posts by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 border-2",
                  theme === "dark"
                    ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                    : "bg-white border-[#1E3A57]/20"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-[#57CFA4]" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "border-2",
                showAdvancedFilters 
                  ? "bg-[#57CFA4] border-[#57CFA4] text-white"
                  : theme === "dark"
                    ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                    : "border-[#1E3A57]/20 text-[#1E3A57] hover:bg-slate-50"
              )}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t"
              >
                <div>
                  <label className={cn(
                    "text-xs font-medium mb-1 block",
                    theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                  )}>
                    Author Name
                  </label>
                  <Input
                    placeholder="Filter by author..."
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    className={cn(
                      "border-2",
                      theme === "dark"
                        ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                        : "bg-white border-[#1E3A57]/20"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn(
                      "text-xs font-medium mb-1 block",
                      theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                    )}>
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className={cn(
                        "border-2",
                        theme === "dark"
                          ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                          : "bg-white border-[#1E3A57]/20"
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn(
                      "text-xs font-medium mb-1 block",
                      theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
                    )}>
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className={cn(
                        "border-2",
                        theme === "dark"
                          ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white"
                          : "bg-white border-[#1E3A57]/20"
                      )}
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setAuthorFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className={cn(
                    "w-full text-xs",
                    theme === "dark"
                      ? "text-[#57CFA4] hover:bg-[#57CFA4]/10"
                      : "text-red-600 hover:bg-red-50"
                  )}
                >
                  Clear All Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-3">
            <p className={cn(
              "text-sm font-medium",
              theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
            )}>
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
            </p>
            {filteredPosts.map((post, i) => (
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
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-bold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>{post.title}</h3>
                        {post.author_is_trades && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white mt-1">
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