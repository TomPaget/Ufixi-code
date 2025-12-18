import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function Support() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    const initConversation = async () => {
      const conv = await base44.agents.createConversation({
        agent_name: "support_bot",
        metadata: { name: "Support Chat" }
      });
      setConversationId(conv.id);
      setMessages([{
        role: "assistant",
        content: "👋 Hi! I'm your QuoFix support assistant. I can help you with:\n\n• Getting started with the app\n• Understanding features\n• Home maintenance advice\n• Troubleshooting issues\n\nWhat can I help you with today?"
      }]);
    };

    if (!conversationId) {
      initConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
      setMessages(data.messages);
      setSending(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || sending) return;

    setSending(true);
    setInput("");

    const conversation = await base44.agents.getConversation(conversationId);
    await base44.agents.addMessage(conversation, {
      role: "user",
      content: input
    });
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#57CFA4] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={cn(
                "font-bold text-sm",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>QuoFix Support</h1>
              <p className={cn(
                "text-xs",
                theme === "dark" ? "text-[#57CFA4]" : "text-[#1E3A57]/70"
              )}>AI Assistant</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#57CFA4] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === "user"
                  ? "bg-[#F7B600] text-[#1E3A57]"
                  : theme === "dark"
                    ? "bg-[#1E3A57]/50 border-2 border-[#57CFA4]/30 text-white"
                    : "bg-white border-2 border-[#1E3A57]/20 text-[#1E3A57]"
              )}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  theme === "dark" ? "bg-white/10" : "bg-slate-100"
                )}>
                  <User className={cn(
                    "w-5 h-5",
                    theme === "dark" ? "text-white" : "text-[#1E3A57]"
                  )} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className={cn(
        "sticky bottom-0 border-t-2",
        theme === "dark" ? "bg-[#1E3A57] border-[#57CFA4]/30" : "bg-white border-[#1E3A57]/20"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={sending}
              className={cn(
                "flex-1 border-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] rounded-xl px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}