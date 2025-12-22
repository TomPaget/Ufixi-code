import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Send, Paperclip, Loader2, X, Check, CheckCheck, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/kora/ThemeProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Chat() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get("id");
  
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({ id: conversationId });
      return convos[0];
    },
    enabled: !!conversationId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, "created_date"),
    enabled: !!conversationId,
    refetchInterval: 1000 // Real-time polling every second
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Mark messages as read with read receipts
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(m => m.sender_id !== user.id && !m.read);
      unreadMessages.forEach(msg => {
        base44.entities.Message.update(msg.id, { 
          read: true,
          read_at: new Date().toISOString()
        });
      });
      
      // Update conversation unread count
      if (unreadMessages.length > 0 && conversation) {
        const isParticipant1 = conversation.participant_1_id === user.id;
        base44.entities.Conversation.update(conversationId, {
          [isParticipant1 ? "unread_count_1" : "unread_count_2"]: 0
        });
      }
    }
  }, [messages, user, conversationId]);

  // Check for typing indicator
  useEffect(() => {
    if (conversation && user) {
      const otherPersonTyping = conversation.typing_user_id && 
        conversation.typing_user_id !== user.id;
      
      if (otherPersonTyping) {
        const typingTime = new Date(conversation.typing_timestamp);
        const now = new Date();
        const secondsAgo = (now - typingTime) / 1000;
        
        setIsTyping(secondsAgo < 3); // Show typing if within last 3 seconds
      } else {
        setIsTyping(false);
      }
    }
  }, [conversation, user]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, media_urls }) => {
      // AI Moderation
      const moderation = await base44.integrations.Core.InvokeLLM({
        prompt: `Moderate this message for profanity, swearing, explicit content, or inappropriate language.
        
Message: "${content}"

Check if the message contains:
1. Profanity or swear words
2. Explicit or sexual content
3. Harassment or threats
4. Personal information that shouldn't be shared

Return whether it should be blocked.`,
        response_json_schema: {
          type: "object",
          properties: {
            blocked: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["blocked", "reason"]
        }
      });

      // Check images if any
      let imageBlocked = false;
      let imageReason = "";
      
      if (media_urls && media_urls.length > 0) {
        const imageCheck = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze these images for explicit content, nudity, violence, or inappropriate material.
          
Return whether any image should be blocked.`,
          file_urls: media_urls,
          response_json_schema: {
            type: "object",
            properties: {
              blocked: { type: "boolean" },
              reason: { type: "string" }
            },
            required: ["blocked", "reason"]
          }
        });
        
        imageBlocked = imageCheck.blocked;
        imageReason = imageCheck.reason;
      }

      if (moderation.blocked || imageBlocked) {
        throw new Error(moderation.reason || imageReason);
      }

      // Create message
      const message = await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: user.full_name,
        content,
        media_urls: media_urls || []
      });

      // Update conversation
      const isParticipant1 = conversation.participant_1_id === user.id;
      const otherId = isParticipant1 ? conversation.participant_2_id : conversation.participant_1_id;
      
      await base44.entities.Conversation.update(conversationId, {
        last_message: content || "📷 Photo",
        last_message_date: new Date().toISOString(),
        [isParticipant1 ? "unread_count_2" : "unread_count_1"]: 
          (isParticipant1 ? conversation.unread_count_2 : conversation.unread_count_1) + 1,
        typing_user_id: null,
        typing_timestamp: null
      });

      // Send notification to other user
      try {
        await base44.functions.invoke('sendNotification', {
          userId: otherId,
          title: "New Message",
          message: `${user.display_name || user.full_name}: ${content || "Sent a photo"}`,
          type: "message",
          priority: "normal",
          relatedEntityType: "Conversation",
          relatedEntityId: conversationId,
          actionUrl: `Chat?id=${conversationId}`
        });
      } catch (error) {
        console.error("Notification error:", error);
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", conversationId]);
      queryClient.invalidateQueries(["conversation", conversationId]);
      queryClient.invalidateQueries(["conversations"]);
      setMessageText("");
      setAttachments([]);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setAttachments([...attachments, ...urls]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = (value) => {
    setMessageText(value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Update typing indicator
    base44.entities.Conversation.update(conversationId, {
      typing_user_id: user?.id,
      typing_timestamp: new Date().toISOString()
    });

    // Clear typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      base44.entities.Conversation.update(conversationId, {
        typing_user_id: null,
        typing_timestamp: null
      });
    }, 2000);
  };

  const handleSend = () => {
    if (!messageText.trim() && attachments.length === 0) return;

    sendMessageMutation.mutate({
      content: messageText.trim(),
      media_urls: attachments
    });
  };

  const otherPerson = conversation?.participant_1_id === user?.id 
    ? conversation?.participant_2_name 
    : conversation?.participant_1_name;

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      theme === "dark" ? "bg-[#0F1E2E]" : "bg-white"
    )}>
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
            onClick={() => navigate(createPageUrl("Messages"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold",
              theme === "dark"
                ? "bg-[#F7B600] text-[#0F1E2E]"
                : "bg-[#1E3A57] text-white"
            )}>
              {otherPerson?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={cn(
                "font-bold text-lg",
                theme === "dark" ? "text-white" : "text-[#1E3A57]"
              )}>{otherPerson}</h1>
              {isTyping && (
                <p className={cn(
                  "text-xs",
                  theme === "dark" ? "text-[#57CFA4]" : "text-blue-600"
                )}>
                  typing...
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => {
            const isMine = message.sender_id === user?.id;

            return (
              <div key={message.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  isMine
                    ? theme === "dark"
                      ? "bg-[#F7B600] text-[#0F1E2E]"
                      : "bg-[#1E3A57] text-white"
                    : theme === "dark"
                      ? "bg-[#1A2F42] text-white"
                      : "bg-slate-100 text-[#1E3A57]"
                )}>
                  {message.content && <p className="break-words">{message.content}</p>}
                  {message.media_urls?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.media_urls.map((url, i) => (
                        <img key={i} src={url} alt="Attachment" className="rounded-xl max-w-full cursor-pointer hover:opacity-90" onClick={() => window.open(url, '_blank')} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn(
                      "text-xs",
                      isMine
                        ? "opacity-70"
                        : theme === "dark" ? "text-[#57CFA4]" : "text-slate-500"
                    )}>
                      {format(new Date(message.created_date), "h:mm a")}
                    </span>
                    {isMine && (
                      message.read ? (
                        <CheckCheck className={cn("w-3 h-3", "opacity-70")} />
                      ) : (
                        <Check className={cn("w-3 h-3", "opacity-70")} />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className={cn(
        "sticky bottom-0 border-t-2",
        theme === "dark" ? "bg-[#0F1E2E] border-[#57CFA4]/30" : "bg-white border-slate-200"
      )}>
        <div className="max-w-lg mx-auto px-5 py-4">
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2">
              {attachments.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="Attachment" className="w-16 h-16 rounded-lg object-cover" />
                  <button
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {sendMessageMutation.isError && (
            <div className="mb-2 text-sm text-red-500 bg-red-50 rounded-lg p-2">
              ⚠️ {sendMessageMutation.error.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className={cn(
              "p-2 rounded-xl cursor-pointer",
              theme === "dark"
                ? "hover:bg-[#57CFA4]/10 text-[#57CFA4]"
                : "hover:bg-slate-100 text-slate-600"
            )}>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </label>
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className={cn(
                "flex-1 border-2",
                theme === "dark"
                  ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white"
                  : "bg-white border-slate-200"
              )}
            />
            <Button
              onClick={handleSend}
              disabled={(!messageText.trim() && attachments.length === 0) || sendMessageMutation.isPending}
              className="bg-[#F7B600] hover:bg-[#F7B600]/90 text-[#0F1E2E] rounded-xl"
            >
              {sendMessageMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}