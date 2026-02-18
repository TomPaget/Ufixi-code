import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/kora/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function IssueChatbot({ issueType, suggestions, mediaUrl }) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I've analysed your **${issueType?.category || "home"}** issue. Feel free to ask me anything specific about it — diagnosis, repair steps, costs, or when to call a professional.`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const buildContext = () => {
    const causes = suggestions?.likely_causes?.map(c => `- ${c.cause}: ${c.details}`).join("\n") || "";
    const fixes = suggestions?.diy_quick_fixes?.map(f => `- ${f.action} (${f.difficulty}, ${f.estimated_time})`).join("\n") || "";
    const warnings = suggestions?.call_pro_if?.join(", ") || "";
    const tools = suggestions?.tools_and_materials?.map(t => t.product_name).join(", ") || "";

    return `You are a helpful home repair expert assistant. The user has scanned a home issue and you have the following context:

Issue Type: ${issueType?.category || "unknown"}
Issue Description: ${issueType?.brief_description || "unknown"}

Likely Root Causes:
${causes}

DIY Quick Fixes Available:
${fixes}

Tools Needed: ${tools}

Call Professional If: ${warnings}

DIY Time: ${suggestions?.estimated_repair_time?.diy_time || "unknown"}
Professional Time: ${suggestions?.estimated_repair_time?.professional_time || "unknown"}

Answer questions helpfully and concisely. Be practical and safety-conscious. If something is dangerous, say so clearly.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const history = messages
      .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${buildContext()}

Conversation so far:
${history}

User: ${userMessage}

Respond as the assistant. Be concise, helpful, and specific to this issue.`,
      file_urls: mediaUrl ? [mediaUrl] : undefined,
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-3 rounded-xl border transition-colors",
          theme === "dark"
            ? "bg-[#0F1E2E] border-[#57CFA4]/30 text-white hover:bg-[#57CFA4]/10"
            : "bg-slate-50 border-slate-200 text-[#1E3A57] hover:bg-slate-100"
        )}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#4BC896]" />
          <span className="text-sm font-medium">Ask a follow-up question</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform text-[#4BC896]", isOpen && "rotate-180")} />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "mt-2 rounded-xl border flex flex-col",
              theme === "dark"
                ? "bg-[#0F1E2E] border-[#57CFA4]/20"
                : "bg-white border-slate-200"
            )}>
              {/* Messages */}
              <div className="flex flex-col gap-3 p-4 max-h-72 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-[#4BC896] text-white rounded-br-sm"
                        : theme === "dark"
                          ? "bg-[#1A2F42] text-white rounded-bl-sm"
                          : "bg-slate-100 text-[#1E3A57] rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className={cn(
                      "rounded-2xl rounded-bl-sm px-3 py-2",
                      theme === "dark" ? "bg-[#1A2F42]" : "bg-slate-100"
                    )}>
                      <Loader2 className="w-4 h-4 animate-spin text-[#4BC896]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={cn(
                "flex gap-2 p-3 border-t",
                theme === "dark" ? "border-[#57CFA4]/20" : "border-slate-100"
              )}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your issue..."
                  className={cn(
                    "text-sm",
                    theme === "dark"
                      ? "bg-[#1A2F42] border-[#57CFA4]/30 text-white placeholder:text-white/40"
                      : "border-slate-200"
                  )}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="bg-[#4BC896] hover:bg-[#4BC896]/90 text-white shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}