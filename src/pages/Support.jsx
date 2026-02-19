import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Send, Bot, User, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import PageHeader from "@/components/kora/PageHeader";
import HamburgerMenu from "@/components/kora/HamburgerMenu";
import SupportContactForm from "@/components/kora/SupportContactForm";

export default function Support() {
  const navigate = useNavigate();
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
        ? "Hi! I'm your Ufixi support assistant for tradespeople.\n\n**I can help you with:**\n- Profile setup and verification\n- Job management\n- Payment processing\n- Customer communication\n- Document uploads\n\n**Need to:**\n- Upload screenshots? Use the attachment button\n- Report a bug? I'll route you to technical support\n- Have billing questions? I'll connect you with our team\n\nWhat can I help you with today?"
        : `Hi! I'm your Ufixi support assistant.\n\n**I can help you with:**\n- Getting started with the app\n- Scanning and understanding issues\n- Finding tradespeople\n- Managing subscriptions\n- Troubleshooting problems\n\n**Need to:**\n- Upload screenshots? Use the attachment button\n- Report a bug? I'll route you to technical support\n- Have billing questions? I'll connect you with our team${proactiveTips}\n\nWhat can I help you with today?`;
      
      setMessages([{
        role: "assistant",
        content: greeting
      }]);
    };

    if (!conversationId && user) {
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
          content: "I've tried to help, but your issue might need more specialized attention. You can reach our support team at info@ufixi.co.uk with details about what you need."
        }]);
        setShowContactForm(true);
        setEscalated(true);
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
      to: "feedback@ufixi.com",
      subject: `Support Rating: ${rating}/5`,
      body: `User ${user?.email} rated support: ${rating}/5\nConversation ID: ${conversationId}\nAttempts: ${attemptCount}`
    }).catch(console.error);
    
    // Show thank you
    setMessages(prev => [...prev, {
      role: "assistant",
      content: rating >= 4 
        ? "Thank you for the feedback! I'm glad I could help. Is there anything else I can assist you with?" 
        : "Thank you for your feedback. We appreciate your input."
    }]);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #B8D8D8 0%, #C8D8E8 40%, #D0D8E8 70%, #C8D0E0 100%)' }}>
      <PageHeader onMenuClick={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#6ECBA6] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-[#1a2f42] text-white" : "bg-white border border-slate-100 shadow-sm"}`} style={msg.role === "assistant" ? { color: '#1a2f42' } : {}}>
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

        {/* Contact Form */}
        {showContactForm && escalated && (
          <SupportContactForm
            userEmail={user?.email}
            onSubmit={(data) => {
              setMessages(prev => [...prev, {
                role: "assistant",
                content: "Thank you. Your details have been sent to info@ufixi.co.uk. You can also send additional information directly to that email address."
              }]);
              setShowContactForm(false);
            }}
            onClose={() => setShowContactForm(false)}
          />
        )}

        {/* Rating Widget */}
        {showRating && !hasRated && messages.length > 2 && (
          <div className="mt-4 p-4 rounded-2xl border mx-4 bg-white border-slate-100 shadow-sm">
            <p className="text-sm font-semibold mb-3" style={{ color: '#1a2f42' }}>
              How helpful was this interaction?
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 1, label: "Very Dissatisfied" },
                { value: 2, label: "Dissatisfied" },
                { value: 3, label: "Neutral" },
                { value: 4, label: "Satisfied" },
                { value: 5, label: "Very Satisfied" }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-all hover:scale-105 border-slate-200 hover:border-[#6ECBA6] hover:bg-[#6ECBA6]/5"
                  style={{ color: '#1a2f42' }}
                >
                  <span className="text-lg font-bold">{value}</span>
                  <span className="text-xs text-center leading-tight">{label}</span>
                </button>
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

      <div className="sticky bottom-0 border-t bg-white border-slate-100 shadow-md">
        <div className="max-w-lg mx-auto px-5 py-4">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border bg-slate-50 border-slate-200"
                  style={{ color: '#1a2f42' }}
                >
                  {file.type === "image" ? (
                    <ImageIcon className="w-4 h-4 text-[#6ECBA6]" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#6ECBA6]" />
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
              className="rounded-xl border-slate-200 hover:bg-slate-50"
              style={{ color: '#1a2f42' }}
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
              className="flex-1 border border-slate-200"
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || sending}
              className="bg-[#6ECBA6] hover:bg-[#4faf8a] text-[#1E2D40] rounded-xl px-6"
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