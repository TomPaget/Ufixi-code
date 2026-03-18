import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, Plus, MessageSquare, ThumbsUp, Filter, Search, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const likeMutation = useMutation({
    mutationFn: ({ id, likes }) => base44.entities.ForumPost.update(id, { likes }),
    onMutate: async ({ id, likes }) => {
      await queryClient.cancelQueries(["forum-posts", selectedCategory]);
      const previous = queryClient.getQueryData(["forum-posts", selectedCategory]);
      queryClient.setQueryData(["forum-posts", selectedCategory], (old = []) =>
        old.map((p) => p.id === id ? { ...p, likes } : p)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["forum-posts", selectedCategory], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries(["forum-posts", selectedCategory]),
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-pink-300/45 to-orange-500/85 animate-gradient-shift blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/75 via-yellow-300/35 to-blue-600/80 animate-gradient-shift-slow blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-600/75 via-pink-200/40 to-orange-500/70 animate-gradient-shift-reverse blur-3xl" />
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
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #F7B600;
          border-radius: 3px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #E5A400;
        }
      `}</style>
      
      <header className="sticky top-0 z-30 border-b bg-white/10 backdrop-blur-md border-white/20">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-5 rounded-xl hover:bg-slate-100 text-white"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6943ddc3165afcd16ccf0414/8a320ec2d_ufixi_White_RGB.png"
            alt="Ufixi Logo"
            className="h-8 object-contain"
          />
          <Button
            className="absolute right-5 h-11 px-4 bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] rounded-xl text-sm"
            onClick={() => navigate(createPageUrl("CreatePost"))}
          >
            <Plus className="w-4 h-4 mr-1" />
            Post
          </Button>
        </div>
      </header>

      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

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
                className="pl-10 border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-white"
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
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
               className={cn(
                 "border-2 h-11 w-11 p-0 shrink-0",
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
                   <label className="text-xs font-medium mb-1 block text-white">
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
                     <label className="text-xs font-medium mb-1 block text-white">
                       From Date
                     </label>
                     <Input
                       type="date"
                       value={dateFrom}
                       onChange={(e) => setDateFrom(e.target.value)}
                       className="border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-white"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-medium mb-1 block text-white">
                       To Date
                     </label>
                     <Input
                       type="date"
                       value={dateTo}
                       onChange={(e) => setDateTo(e.target.value)}
                       className="border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-white"
                     />
                   </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setAuthorFilter("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="w-full h-11 text-sm text-red-600 hover:bg-red-50"
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
                 "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border-2 min-h-[44px]",
                 selectedCategory === cat.value
                   ? "bg-[#57CFA4] border-[#57CFA4] text-white"
                   : "bg-white/60 backdrop-blur-md border-[#1E3A57]/20 text-white hover:bg-white/80"
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
            <p className="text-sm font-medium text-white">
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
                        <h3 className="font-bold text-white">{post.title}</h3>
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
                    <p className="text-sm mb-3 line-clamp-2 text-white">{post.content}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white">
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
             <p className="text-white">No posts yet</p>
             <p className="text-sm mt-1 text-white">Be the first to start a discussion!</p>
           </div>
        )}
      </main>
    </div>
  );
}