"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "model";
  text: string;
}

const SUGGESTIONS = [
  "巴甫洛夫条件反射和操作性条件反射有什么区别？",
  "量子纠缠是什么意思？能用类比解释吗？",
  "CRISPR 基因编辑的基本原理是什么？",
  "Transformer 架构中的注意力机制是怎么工作的？",
  "涂尔干的社会事实论说的是什么？",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;

      const userMsg: Message = { role: "user", text: text.trim() };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });

        if (!res.body) throw new Error("no stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "model", text: accumulated };
            return next;
          });
        }
      } catch (err) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "model",
            text: `请求失败：${String(err)}`,
          };
          return next;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function handleClear() {
    setMessages([]);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-5 mb-5 flex-shrink-0">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">学科问答</p>
        <div className="flex items-end justify-between">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            AI 学习助手
          </h1>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-1.5 text-[13px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors"
            >
              清空对话
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div
                className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-3"
              >
                随时提问，深入学习
              </div>
              <p
                className="text-[16px] text-[#1c1a16]"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
              >
                有什么想问的？
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  className="text-left px-4 py-3 bg-white border border-[#d8d4ca] text-[13px] text-[#5a5550] hover:border-[#003087] hover:text-[#1c1a16] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <div className="w-6 h-6 bg-[#003087] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] tracking-widest font-bold">AI</span>
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#003087] text-white"
                    : "bg-white border border-[#d8d4ca] text-[#1c1a16]"
                }`}
              >
                {msg.role === "model" ? (
                  msg.text ? (
                    <div className="prose prose-sm max-w-none
                      prose-p:my-1 prose-p:leading-relaxed prose-p:text-[#5a5550]
                      prose-headings:font-semibold prose-headings:text-[#1c1a16]
                      prose-code:bg-[#f5f2eb] prose-code:px-1 prose-code:text-xs prose-code:text-[#1c1a16]
                      prose-pre:bg-[#f5f2eb]
                      prose-strong:text-[#1c1a16]
                      prose-li:my-0.5 prose-li:text-[#5a5550]
                      prose-hr:border-[#e4e0d8]
                      prose-a:text-[#003087] prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-[#9a9590] italic text-[12px]">思考中...</span>
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 border border-[#d8d4ca] bg-[#f5f2eb] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#9a9590] text-[9px] tracking-widest font-bold">U</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-[#d8d4ca]">
        <div className="flex gap-3 items-end bg-white border border-[#d8d4ca] px-4 py-3 focus-within:border-[#003087] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题，Enter 发送，Shift+Enter 换行..."
            rows={1}
            disabled={streaming}
            className="flex-1 resize-none bg-transparent text-[13px] text-[#1c1a16] placeholder:text-[#9a9590] outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${el.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => void send(input)}
            disabled={!input.trim() || streaming}
            className="w-8 h-8 bg-[#003087] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#00256a] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-[#9a9590] mt-1.5 text-center">
          由 Gemini 2.5 Flash 驱动 · 内容仅供学习参考
        </p>
      </div>
    </div>
  );
}
