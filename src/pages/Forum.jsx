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
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Animated gradient background */}
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
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg flex-1 text-[#1E3A57]">Community Forum</h1>
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
        <div className="rounded-2xl p-4 border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search posts by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-[#1E3A57]"
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
                   <label className="text-xs font-medium mb-1 block text-[#1E3A57]/70">
                     Author Name
                   </label>
                   <Input
                     placeholder="Filter by author..."
                     value={authorFilter}
                     onChange={(e) => setAuthorFilter(e.target.value)}
                     className="border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-[#1E3A57]"
                   />
                 </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="text-xs font-medium mb-1 block text-[#1E3A57]/70">
                       From Date
                     </label>
                     <Input
                       type="date"
                       value={dateFrom}
                       onChange={(e) => setDateFrom(e.target.value)}
                       className="border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-[#1E3A57]"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium mb-1 block text-[#1E3A57]/70">
                       To Date
                     </label>
                     <Input
                       type="date"
                       value={dateTo}
                       onChange={(e) => setDateTo(e.target.value)}
                       className="border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-[#1E3A57]"
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
                  className="w-full text-xs text-red-600 hover:bg-red-50"
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
                   ? "bg-[#57CFA4] border-[#57CFA4] text-white"
                   : "bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-[#1E3A57] hover:bg-white/80"
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
              <div key={i} className="rounded-2xl h-32 animate-pulse bg-white/60 backdrop-blur-md" />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#1E3A57]/70">
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
                  <div className="rounded-2xl p-4 border-2 transition-all hover:scale-[1.02] bg-white/60 backdrop-blur-md border-[#1E3A57]/20 hover:border-[#57CFA4]/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1E3A57]">{post.title}</h3>
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
                    <p className="text-sm mb-3 line-clamp-2 text-[#1E3A57]/70">{post.content}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#1E3A57]/70">
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
          <div className="text-center py-12 rounded-2xl border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
             <MessageSquare className="w-12 h-12 mx-auto mb-3 text-[#1E3A57]/50" />
             <p className="text-[#1E3A57]">No posts yet</p>
             <p className="text-sm mt-1 text-[#1E3A57]/70">Be the first to start a discussion!</p>
           </div>
        )}
      </main>
    </div>
  );
}