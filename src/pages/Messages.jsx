import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Messages() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const userId = user?.id;
      if (!userId) return [];
      
      // Get conversations where user is participant 1 or 2
      const convos1 = await base44.entities.Conversation.filter({ participant_1_id: userId });
      const convos2 = await base44.entities.Conversation.filter({ participant_2_id: userId });
      
      return [...convos1, ...convos2].sort((a, b) => 
        new Date(b.last_message_date || b.created_date) - new Date(a.last_message_date || a.created_date)
      );
    },
    enabled: !!user
  });

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participant_1_id === user?.id ? conv.participant_2_name : conv.participant_1_name;
    return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getUnreadCount = (conv) => {
    return conv.participant_1_id === user?.id ? conv.unread_count_1 : conv.unread_count_2;
  };

  const getOtherParticipant = (conv) => {
    return conv.participant_1_id === user?.id ? conv.participant_2_name : conv.participant_1_name;
  };

  return (
    <div className={cn(
      "min-h-screen pb-20 relative overflow-hidden",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-200 to-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 via-rose-600/25 to-orange-700/50 animate-gradient-shift-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-800/45 via-amber-600/20 to-slate-600/45 animate-gradient-shift-slow-slower blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-slate-600/40 via-rose-500/22 to-orange-700/45 animate-gradient-shift-reverse-slower blur-3xl" />
        <div className="absolute inset-0 bg-white/10" />
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
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]" : "bg-white border-[#1E3A57]/20"
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
            "font-bold text-lg",
            theme === "dark" ? "text-white" : "text-[#1E3A57]"
          )}>Messages</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5",
            theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
          )} />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 border-2",
              theme === "dark"
                ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                : "bg-white border-slate-200"
            )}
          />
        </div>

        {/* Conversations */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#57CFA4] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className={cn(
            "text-center py-12 rounded-2xl border-2",
            theme === "dark"
              ? "bg-[#1A2F42] border-[#57CFA4]/30"
              : "bg-white border-slate-200"
          )}>
            <MessageCircle className={cn(
              "w-12 h-12 mx-auto mb-3",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-400"
            )} />
            <p className={cn(
              theme === "dark" ? "text-white" : "text-[#1E3A57]"
            )}>
              No messages yet
            </p>
            <p className={cn(
              "text-sm mt-1",
              theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
            )}>
              Start a conversation with a tradesperson
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const unreadCount = getUnreadCount(conv);
              const otherPerson = getOtherParticipant(conv);

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(createPageUrl(`Chat?id=${conv.id}`))}
                  className={cn(
                    "w-full rounded-2xl p-4 border-2 text-left transition-colors",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/30 hover:bg-[#57CFA4]/10"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-bold",
                        theme === "dark"
                          ? "bg-[#F7B600] text-[#0F1E2E]"
                          : "bg-[#1E3A57] text-white"
                      )}>
                        {otherPerson?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={cn(
                          "font-semibold",
                          theme === "dark" ? "text-white" : "text-[#1E3A57]"
                        )}>
                          {otherPerson}
                        </h3>
                        <p className={cn(
                          "text-sm line-clamp-1",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-600"
                        )}>
                          {conv.last_message || "Start a conversation"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv.last_message_date && (
                        <span className={cn(
                          "text-xs",
                          theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                        )}>
                          {format(new Date(conv.last_message_date), "MMM d")}
                        </span>
                      )}
                      {unreadCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-[#F7B600] text-[#0F1E2E] text-xs font-bold flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}