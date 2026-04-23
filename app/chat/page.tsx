"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { dialog } from "@/components/ui/Dialog";

interface Message {
  role: "user" | "model";
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
}

interface Session {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface PendingImage {
  base64: string;
  mimeType: string;
  preview: string;
}

const SUGGESTIONS = [
  "巴甫洛夫条件反射和操作性条件反射有什么区别？",
  "量子纠缠是什么意思？能用类比解释吗？",
  "CRISPR 基因编辑的基本原理是什么？",
  "Transformer 架构中的注意力机制是怎么工作的？",
  "涂尔干的社会事实论说的是什么？",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [listening, setListening] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/chat/sessions");
    const data = await res.json() as { sessions: Session[] };
    setSessions(data.sessions ?? []);
    return data.sessions ?? [];
  }, []);

  const loadSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/sessions/${id}`);
    const data = await res.json() as { session: { messages: { role: string; content: string }[] } };
    const msgs: Message[] = (data.session?.messages ?? []).map((m) => ({
      role: m.role as "user" | "model",
      text: m.content,
    }));
    setMessages(msgs);
    setSessionId(id);
    setShowHistory(false);
  }, []);

  useEffect(() => {
    loadSessions().then((list) => {
      if (list.length > 0 && list[0]) {
        loadSession(list[0].id);
      }
    });
  }, [loadSessions, loadSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setPendingImage({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      void dialog.alert("您的浏览器不支持语音输入，请使用 Chrome 或 Edge 浏览器");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const transcript = (event.results[0]?.[0]?.transcript as string) ?? "";
      if (transcript) {
        setInput((prev) => prev + transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    recognition.start();
  }

  function stopVoice() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    recognitionRef.current?.stop();
    setListening(false);
  }

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed && !pendingImage) return;
      if (streaming) return;

      const imageSnapshot = pendingImage;
      setPendingImage(null);

      const userMsg: Message = {
        role: "user",
        text: trimmed || "（图片）",
        ...(imageSnapshot
          ? { imageBase64: imageSnapshot.base64, imageMimeType: imageSnapshot.mimeType }
          : {}),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);
      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const res = await fetch("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: (trimmed || "图片提问").slice(0, 80) }),
        });
        const data = await res.json() as { session: { id: string } };
        currentSessionId = data.session.id;
        setSessionId(currentSessionId);
      }

      let accumulated = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });

        if (!res.body) throw new Error("no stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

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
        accumulated = `请求失败：${String(err)}`;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "model", text: accumulated };
          return next;
        });
      } finally {
        setStreaming(false);

        if (currentSessionId && accumulated) {
          await fetch("/api/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: currentSessionId,
              messages: [
                { role: "user", content: trimmed || "（图片）" },
                { role: "model", content: accumulated },
              ],
            }),
          });
          loadSessions();
        }
      }
    },
    [messages, streaming, sessionId, loadSessions, pendingImage]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    setPendingImage(null);
    textareaRef.current?.focus();
  }

  function startEditTitle(s: Session) {
    setEditingSessionId(s.id);
    setEditingTitle(s.title ?? "");
    setTimeout(() => titleInputRef.current?.select(), 0);
  }

  async function saveTitle(id: string) {
    const title = editingTitle.trim();
    setEditingSessionId(null);
    await fetch(`/api/chat/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    loadSessions();
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    const list = await loadSessions();
    if (id === sessionId) {
      if (list.length > 0 && list[0]) {
        loadSession(list[0].id);
      } else {
        setMessages([]);
        setSessionId(null);
      }
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 120px)" }}>
      {/* Header */}
      <div className="border-b border-[#d8d4ca] pb-4 mb-4 flex-shrink-0">
        <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-1">学科问答</p>
        <div className="flex items-end justify-between gap-2">
          <h1
            className="text-3xl font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            AI 学习助手
          </h1>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`px-3 py-1.5 text-[12px] border transition-colors ${
                showHistory
                  ? "border-[#003087] text-[#003087]"
                  : "border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087]"
              }`}
            >
              历史 {sessions.length > 0 && `(${sessions.length})`}
            </button>
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 text-[12px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#003087] hover:text-[#003087] transition-colors"
            >
              新对话
            </button>
          </div>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="flex-shrink-0 mb-4 border border-[#d8d4ca] bg-white max-h-48 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-[12px] text-[#9a9590] px-4 py-3 italic">暂无历史对话</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-4 py-2.5 border-b border-[#e4e0d8] last:border-0 group hover:bg-[#f5f2eb] transition-colors ${
                  s.id === sessionId ? "bg-[#f5f2eb]" : ""
                }`}
              >
                {editingSessionId === s.id ? (
                  <input
                    ref={titleInputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveTitle(s.id);
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    onBlur={() => void saveTitle(s.id)}
                    className="flex-1 min-w-0 text-[13px] text-[#1c1a16] bg-white border border-[#003087] outline-none px-1 py-0.5 mr-2"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => loadSession(s.id)}
                    onDoubleClick={() => startEditTitle(s)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="text-[13px] text-[#1c1a16] truncate">
                      {s.title ?? "无标题对话"}
                    </p>
                    <p className="text-[11px] text-[#9a9590]">
                      {formatDate(s.updatedAt)} · {s._count.messages} 条消息
                    </p>
                  </button>
                )}
                {editingSessionId !== s.id && (
                  <div className="flex gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <button
                      onClick={() => startEditTitle(s)}
                      className="text-[11px] text-[#c0bab2] hover:text-[#003087]"
                    >
                      改名
                    </button>
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="text-[11px] text-[#c0bab2] hover:text-red-500"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pb-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="text-[11px] tracking-[0.18em] uppercase text-[#9a9590] mb-3">
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
                  <div>
                    {msg.imageBase64 && msg.imageMimeType && (
                      <img
                        src={`data:${msg.imageMimeType};base64,${msg.imageBase64}`}
                        alt="attached"
                        className="max-w-full rounded mb-2 block"
                        style={{ maxHeight: "240px", objectFit: "contain" }}
                      />
                    )}
                    {msg.text && msg.text !== "（图片）" && (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}
                  </div>
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
        {/* Image preview */}
        {pendingImage && (
          <div className="relative inline-block mb-2">
            <img
              src={pendingImage.preview}
              alt="pending"
              className="h-16 w-16 object-cover border border-[#d8d4ca] rounded"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#5a5550] text-white rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-red-500 transition-colors"
            >
              x
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end bg-white border border-[#d8d4ca] px-3 py-2.5 focus-within:border-[#003087] transition-colors">
          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming}
            title="上传图片"
            className="w-7 h-7 flex items-center justify-center text-[#9a9590] hover:text-[#003087] disabled:opacity-40 transition-colors flex-shrink-0 self-end mb-0.5"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <rect x="2" y="4" width="16" height="12" rx="1" />
              <circle cx="7" cy="8.5" r="1.5" />
              <path d="M2 14l4-4 3 3 3-3 4 4" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Voice button */}
          <button
            type="button"
            onClick={listening ? stopVoice : startVoice}
            disabled={streaming}
            title={listening ? "停止录音" : "语音输入"}
            className={`w-7 h-7 flex items-center justify-center transition-colors flex-shrink-0 self-end mb-0.5 disabled:opacity-40 ${
              listening ? "text-red-500 animate-pulse" : "text-[#9a9590] hover:text-[#003087]"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "正在听..." : "输入问题，Enter 发送，Shift+Enter 换行..."}
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
            disabled={(!input.trim() && !pendingImage) || streaming}
            className="w-8 h-8 bg-[#003087] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-[#00256a] transition-colors self-end"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
            e.target.value = "";
          }}
        />

        <p className="text-[11px] text-[#9a9590] mt-1.5 text-center">
          由 Gemini 2.5 Flash 驱动 · 支持图片识别与语音输入
        </p>
      </div>
    </div>
  );
}
