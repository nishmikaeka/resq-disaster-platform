"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What are the flood response steps?",
  "Essential first aid steps for injuries?",
  "Emergency contact numbers in Sri Lanka?",
];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "session-ssr";
  let id = localStorage.getItem("resq-chat-session");
  if (!id) {
    id = `session-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    localStorage.setItem("resq-chat-session", id);
  }
  return id;
}

function stripSources(text: string): string {
  return text
    .replace(/\n\*Source:.*$/gims, "")
    .replace(/\n+Source:.*$/gims, "")
    .replace(/\*Source:.*?\*/gims, "")
    .trim();
}

export default function ChatbotUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await api.post("/rag/ask", { question: trimmed, sessionId });
      const cleanAnswer = stripSources(res.data.answer);
      setMessages((prev) => [...prev, { role: "assistant", content: cleanAnswer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating toggle button ── */}
      <div className="fixed bottom-[330px] right-5 z-50">
        <span className="absolute inset-0 rounded-full bg-[#127eeb] opacity-20 animate-ping" />
        <motion.button
          id="chatbot-toggle-btn"
          onClick={() => setIsOpen((p) => !p)}
          className="relative w-13 h-13 rounded-full bg-[#127eeb] flex items-center justify-center cursor-pointer shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          aria-label="Toggle AI Assistant"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.18 }}>
                <X className="w-5 h-5 text-white" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.18 }}>
                <MessageCircle className="w-5 h-5 text-white fill-white" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed bottom-[300px] right-2 z-50 w-[92vw] max-w-[360px] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              height: "470px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* ─ Header ─ */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-white/10" style={{ background: "transparent" }}>
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#127eeb] fill-current" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black/80" />
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-none">ResQ Assistant</p>
                <p className="text-xs text-gray-400 mt-1">AI emergency guide</p>
              </div>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ─ Messages ─ */}
            <div
              id="chatbot-messages"
              className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1 min-h-0"
              style={{ background: "transparent", scrollbarWidth: "none" } as React.CSSProperties}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-1 text-center mt-2 mb-2">
                  <p className="text-sm font-medium text-white">How can I help?</p>
                  <p className="text-xs text-gray-400">Ask about emergency response in Sri Lanka</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <MessageCircle className="w-4 h-4 text-[#127eeb] fill-current" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "#127eeb",
                            color: "#ffffff",
                            borderBottomRightRadius: "4px",
                          }
                        : {
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#e2e8f0",
                            borderBottomLeftRadius: "4px",
                          }
                    }
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ul: ({ node, ...p }) => <ul className="list-disc pl-4 my-1.5 space-y-1" {...p} />,
                          ol: ({ node, ...p }) => <ol className="list-decimal pl-4 my-1.5 space-y-1" {...p} />,
                          li: ({ node, ...p }) => <li className="leading-relaxed" {...p} />,
                          p: ({ node, ...p }) => <p className="my-1 leading-relaxed" {...p} />,
                          strong: ({ node, ...p }) => <strong className="font-semibold text-white" {...p} />,
                          hr: () => <hr className="border-white/10 my-2" />,
                          a: ({ node, ...p }) => <a className="text-[#3b82f6] hover:underline" {...p} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <MessageCircle className="w-4 h-4 text-[#127eeb] fill-current" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl rounded-bl-[4px] flex items-center gap-2.5 bg-white/10"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-gray-300"
                          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─ Quick questions ─ */}
            {messages.length === 0 && (
              <div className="px-4 pb-4 flex flex-col gap-2 flex-shrink-0" style={{ background: "transparent" }}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    id={`quick-ask-btn-${i}`}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="text-left text-xs text-gray-300 bg-white/5 hover:bg-white/10 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span className="text-[#127eeb] flex-shrink-0">→</span>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* ─ Input ─ */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}
              className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-t border-white/10"
              style={{ background: "transparent" }}
            >
              <input
                ref={inputRef}
                id="chatbot-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about emergencies…"
                disabled={isLoading}
                className="flex-1 text-white placeholder-gray-500 text-sm px-4 py-2.5 rounded-full outline-none transition-all disabled:opacity-50 bg-white/5 focus:bg-white/10 border border-transparent focus:border-white/20"
              />
              <button
                id="chatbot-send-btn"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-full bg-[#127eeb] hover:bg-[#0f6fd4] flex items-center justify-center cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
