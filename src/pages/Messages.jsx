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
          <h1 className="font-bold text-lg text-[#1E3A57]">Messages</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/30 text-[#1E3A57]"
          />
        </div>

        {/* Conversations */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#57CFA4] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="text-[#1E3A57]">
              No messages yet
            </p>
            <p className="text-sm mt-1 text-slate-500">
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
                  className="w-full rounded-2xl p-4 border-2 text-left transition-colors bg-white/60 backdrop-blur-md border-[#1E3A57]/20 hover:bg-white/80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-[#1E3A57] text-white">
                        {otherPerson?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1E3A57]">
                          {otherPerson}
                        </h3>
                        <p className="text-sm line-clamp-1 text-slate-600">
                          {conv.last_message || "Start a conversation"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv.last_message_date && (
                        <span className="text-xs text-slate-500">
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