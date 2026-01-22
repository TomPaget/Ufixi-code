import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Bot, User, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [escalated, setEscalated] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    const initConversation = async () => {
      // Fetch common issues for proactive suggestions
      const [recentPosts, recentSearches] = await Promise.all([
        base44.entities.ForumPost.filter({ moderation_status: "approved" }, "-created_date", 5).catch(() => []),
        base44.entities.SavedSearch.list("-created_date", 3).catch(() => [])
      ]);

      const commonIssues = recentPosts.map(p => p.title).slice(0, 3);
      const popularSearches = [...new Set(recentSearches.map(s => s.trade_type).filter(Boolean))].slice(0, 2);

      let proactiveTips = "";
      if (commonIssues.length > 0) {
        proactiveTips += `\n\n**📊 Trending Issues in Community:**\n${commonIssues.map(i => `• ${i}`).join('\n')}`;
      }
      if (popularSearches.length > 0) {
        proactiveTips += `\n\n**🔍 Popular Tradesperson Searches:**\n${popularSearches.map(s => `• ${s}`).join('\n')}`;
      }

      const conv = await base44.agents.createConversation({
        agent_name: "support_bot",
        metadata: { 
          name: "Support Chat",
          attempt_count: 0,
          escalated: false
        }
      });
      setConversationId(conv.id);
      
      const accountType = user?.account_type === "trades" ? "tradesperson" : "customer";
      const greeting = accountType === "trades"
        ? "👋 Hi! I'm your Fixplain support assistant for tradespeople.\n\n**I can help you with:**\n• Profile setup and verification\n• Job management\n• Payment processing\n• Customer communication\n• Document uploads\n\n**Need to:**\n• Upload screenshots? Use the 📎 attachment button\n• Report a bug? I'll route you to technical support\n• Have billing questions? I'll connect you with our team\n\nWhat can I help you with today?"
        : `👋 Hi! I'm your Fixplain support assistant.\n\n**I can help you with:**\n• Getting started with the app\n• Scanning and understanding issues\n• Finding tradespeople\n• Managing subscriptions\n• Troubleshooting problems\n\n**Need to:**\n• Upload screenshots? Use the 📎 attachment button\n• Report a bug? I'll route you to technical support\n• Have billing questions? I'll connect you with our team${proactiveTips}\n\nWhat can I help you with today?`;
      
      setMessages([{
        role: "assistant",
        content: greeting
      }]);
    };

    if (!conversationId) {
      initConversation();
    }
  }, [conversationId, user]);

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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            name: file.name,
            url: file_url,
            type: file.type.startsWith("image/") ? "image" : "document"
          };
        })
      );
      setAttachments([...attachments, ...uploadedFiles]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !conversationId || sending) return;

    setSending(true);
    const messageText = input;
    const messageAttachments = [...attachments];
    setInput("");
    setAttachments([]);

    // Increment attempt count
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    const conversation = await base44.agents.getConversation(conversationId);
    
    if (messageAttachments.length > 0) {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageText || "Please review these files",
        file_urls: messageAttachments.map(a => a.url)
      });
    } else {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageText
      });
    }

    // Check for escalation after 2 attempts
    if (newAttemptCount >= 2 && !escalated) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "🤝 I notice you might need more specialized help. Would you like me to connect you with a human support agent?\n\nOur team will reach out to you at **" + (user?.email || "your email") + "** within 1 hour to provide personalized assistance.\n\n✅ Click the button below if you'd like human support."
        }]);
        setEscalated(true);
        
        // Notify support team
        base44.integrations.Core.SendEmail({
          to: "support@fixplain.com",
          subject: `🔔 Support Escalation - ${user?.full_name || 'User'}`,
          body: `User requires human support assistance.\n\nUser: ${user?.full_name}\nEmail: ${user?.email}\nConversation ID: ${conversationId}\nAttempts: ${newAttemptCount}\n\nPlease reach out within 1 hour.`
        }).catch(console.error);
      }, 2000);
    }

    // Show rating prompt after response
    if (!hasRated && newAttemptCount >= 1) {
      setTimeout(() => setShowRating(true), 3000);
    }
  };

  const handleRating = async (rating) => {
    setShowRating(false);
    setHasRated(true);
    
    // Send feedback
    await base44.integrations.Core.SendEmail({
      to: "feedback@fixplain.com",
      subject: `⭐ AI Support Rating: ${rating}/5`,
      body: `User ${user?.email} rated AI support: ${rating}/5 stars\nConversation ID: ${conversationId}\nAttempts: ${attemptCount}`
    }).catch(console.error);
    
    // Show thank you
    setMessages(prev => [...prev, {
      role: "assistant",
      content: rating >= 4 
        ? "✨ Thank you for the feedback! I'm glad I could help. Is there anything else I can assist you with?" 
        : "Thank you for your feedback. I'm sorry I couldn't help better. A human agent will be notified and follow up with you soon. 💙"
    }]);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
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
      `}</style>
      
      <header className="sticky top-0 z-30 border-b bg-white/10 backdrop-blur-md border-white/20">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-slate-100 text-[#1E3A57]"
            onClick={() => navigate(createPageUrl("Home"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#57CFA4] flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-[#1E3A57]">Fixplain Support</h1>
              <p className="text-xs text-[#1E3A57]/70">AI Assistant</p>
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
                  ? "bg-[#1E3A57] text-white"
                  : "bg-white/60 backdrop-blur-md border-2 border-[#1E3A57]/20 text-[#1E3A57]"
              )}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <>
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    {msg.file_urls && msg.file_urls.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.file_urls.map((url, idx) => {
                          const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                          return isImage ? (
                            <img
                              key={idx}
                              src={url}
                              alt="Attachment"
                              className="rounded-lg max-w-full h-auto max-h-48 object-cover"
                            />
                          ) : (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs underline"
                            >
                              <FileText className="w-4 h-4" />
                              Attachment {idx + 1}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
                  <User className="w-5 h-5 text-[#1E3A57]" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Rating Widget */}
        {showRating && !hasRated && messages.length > 2 && (
          <div className="mt-4 p-4 rounded-2xl border-2 mx-4 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
            <p className="text-sm font-semibold mb-3 text-[#1E3A57]">
              💬 How helpful was this interaction?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  onClick={() => handleRating(star)}
                  variant="outline"
                  className="flex-1 py-2 border-2 transition-all hover:scale-105 border-[#F7B600] text-[#F7B600] hover:bg-[#F7B600]/10"
                >
                  {"⭐".repeat(star)}
                </Button>
              ))}
            </div>
            <button
              onClick={() => setShowRating(false)}
              className="text-xs mt-2 w-full text-center text-slate-500"
            >
              Skip
            </button>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 border-t-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/20">
        <div className="max-w-lg mx-auto px-5 py-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border bg-slate-50 border-slate-200 text-[#1E3A57]"
                >
                  {file.type === "image" ? (
                    <ImageIcon className="w-4 h-4 text-[#57CFA4]" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#57CFA4]" />
                  )}
                  <span className="truncate max-w-32">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="rounded-xl border-slate-200 text-[#1E3A57] hover:bg-slate-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={sending}
              className="flex-1 border-2 bg-white/60 backdrop-blur-md border-[#1E3A57]/30 text-[#1E3A57]"
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || sending}
              className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#1E3A57] rounded-xl px-6"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}