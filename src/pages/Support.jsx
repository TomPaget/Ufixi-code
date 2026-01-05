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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
      
      const accountType = user?.account_type === "trades" ? "tradesperson" : "customer";
      const greeting = accountType === "trades"
        ? "👋 Hi! I'm your Fixplain support assistant for tradespeople.\n\n**I can help you with:**\n• Profile setup and verification\n• Job management\n• Payment processing\n• Customer communication\n• Document uploads\n\n**Need to:**\n• Upload screenshots? Use the 📎 attachment button\n• Report a bug? I'll route you to technical support\n• Have billing questions? I'll connect you with our team\n\nWhat can I help you with today?"
        : "👋 Hi! I'm your Fixplain support assistant.\n\n**I can help you with:**\n• Getting started with the app\n• Scanning and understanding issues\n• Finding tradespeople\n• Managing subscriptions\n• Troubleshooting problems\n\n**Need to:**\n• Share a screenshot? Use the 📎 attachment button\n• Report a bug? I'll route you to technical support\n• Have billing questions? I'll connect you with our team\n\nWhat can I help you with today?";
      
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
              )}>Fixplain Support</h1>
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
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm border",
                    theme === "dark"
                      ? "bg-[#1E3A57]/50 border-[#57CFA4]/30 text-white"
                      : "bg-slate-50 border-slate-200"
                  )}
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
              className={cn(
                "rounded-xl",
                theme === "dark"
                  ? "border-[#57CFA4]/30 text-[#57CFA4] hover:bg-[#57CFA4]/10"
                  : "border-slate-200 hover:bg-slate-50"
              )}
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
              className={cn(
                "flex-1 border-2",
                theme === "dark"
                  ? "bg-[#1E3A57] border-[#57CFA4]/30 text-white"
                  : "bg-white border-[#1E3A57]/20"
              )}
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