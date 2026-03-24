import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, X, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function IssueChatbot({ issueType, issueTitle, suggestions, mediaUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I've analysed your ${issueTitle || issueType?.category || "home"} issue. Feel free to ask me anything specific about it — diagnosis, repair steps, costs, or when to call a professional.`
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
        className="w-full flex items-center justify-between gap-2 px-4 py-4 rounded-2xl border bg-white border-slate-200 text-[#1E2D40] hover:bg-slate-50 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,83,10,0.1)' }}>
            <MessageCircle className="w-5 h-5" style={{ color: '#E8530A' }} />
          </div>
          <span className="font-semibold text-[#1E2D40]">Ask a follow-up question</span>
        </div>
        <ChevronDown className={cn("w-5 h-5 transition-transform text-slate-400", isOpen && "rotate-180")} />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden",
              isFullscreen && "fixed inset-0 z-50 w-screen h-screen p-4"
            )}
          >
            <div className={cn(
              "mt-2 rounded-2xl border flex flex-col bg-white border-slate-200 shadow-sm",
              isFullscreen && "mt-0 h-full",
            )}>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" style={{ color: '#E8530A' }} />
                  <span className="text-sm font-semibold text-[#1E2D40]">Follow-up Chat</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className={cn(
                "flex flex-col gap-3 p-4 overflow-y-auto",
                isFullscreen ? "flex-1" : "max-h-72"
              )}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-slate-100 text-[#1E2D40] rounded-bl-sm"
                      )}
                      style={msg.role === "user" ? { background: "linear-gradient(135deg, #E8530A, #D93870)" } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-slate-100">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E8530A' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t border-slate-100">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your issue..."
                  className="text-sm border-slate-200 rounded-xl text-[#1E2D40]"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="shrink-0 text-white border-0"
                  style={{ background: "linear-gradient(135deg, #E8530A, #D93870)" }}
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