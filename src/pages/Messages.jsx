import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import PageHeader from "@/components/kora/PageHeader";

export default function Messages() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen pb-20 bg-[#F5F7FA]">
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border border-slate-200 rounded-xl"
            style={{ color: '#1a2f42' }}
          />
        </div>

        {/* Conversations */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-[#57CFA4] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border bg-white border-slate-100">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[#4BC896]" />
            <p style={{ color: '#1a2f42' }}>No messages yet</p>
            <p className="text-sm mt-1" style={{ color: '#6B7A8D' }}>Start a conversation with a tradesperson</p>
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
                  className="w-full rounded-2xl p-4 border text-left transition-colors bg-white border-slate-100 hover:shadow-md shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-[#63c49f] text-white">
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