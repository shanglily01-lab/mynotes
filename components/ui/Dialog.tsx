"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type DialogKind = "alert" | "confirm" | "prompt";

interface DialogOptions {
  kind: DialogKind;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  danger?: boolean;
}

function DialogModal({
  options,
  onResolve,
}: {
  options: DialogOptions;
  onResolve: (v: boolean | string | null) => void;
}) {
  const { kind, title, message, confirmText, cancelText, placeholder, defaultValue, danger } = options;
  const [value, setValue] = useState(defaultValue ?? "");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVisible(true);
    if (kind === "prompt") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [kind]);

  function close(result: boolean | string | null) {
    setVisible(false);
    setTimeout(() => onResolve(result), 180);
  }

  function handleConfirm() {
    if (kind === "alert") close(true);
    else if (kind === "confirm") close(true);
    else close(value);
  }

  function handleCancel() {
    if (kind === "alert") close(true);
    else if (kind === "confirm") close(false);
    else close(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Enter" && kind !== "prompt") handleConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accent = danger ? "#8b1a2a" : "#003087";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        backgroundColor: visible ? "rgba(28,26,22,0.45)" : "rgba(28,26,22,0)",
        transition: "background-color 0.18s ease",
      }}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm bg-white border border-[#d8d4ca] shadow-xl"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.18s ease, opacity 0.18s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 pt-4 pb-3 border-b border-[#e4e0d8]"
          style={{ borderLeftWidth: 3, borderLeftColor: accent }}
        >
          <p
            className="text-[14px] font-bold text-[#1c1a16]"
            style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
          >
            {title ?? (kind === "alert" ? "提示" : kind === "confirm" ? "请确认" : "输入")}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-[13px] text-[#1c1a16] leading-relaxed whitespace-pre-wrap">{message}</p>
          {kind === "prompt" && (
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); }}
              placeholder={placeholder}
              className="mt-3 w-full px-3 py-2 text-[13px] border border-[#d8d4ca] focus:outline-none focus:border-[#003087] bg-white"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-1 flex justify-end gap-2">
          {kind !== "alert" && (
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 text-[12px] border border-[#d8d4ca] text-[#5a5550] hover:border-[#9a9590] active:opacity-70 transition-colors"
            >
              {cancelText ?? "取消"}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 text-[12px] font-medium text-white active:opacity-70 transition-opacity"
            style={{ backgroundColor: accent }}
          >
            {confirmText ?? (kind === "alert" ? "知道了" : "确定")}
          </button>
        </div>
      </div>
    </div>
  );
}

function show<T>(options: DialogOptions): Promise<T> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null as T);
      return;
    }
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    const handleResolve = (v: boolean | string | null) => {
      root.unmount();
      host.remove();
      resolve(v as T);
    };

    root.render(<DialogModal options={options} onResolve={handleResolve} />);
  });
}

export const dialog = {
  alert(message: string, opts?: { title?: string; confirmText?: string }) {
    return show<true>({ kind: "alert", message, ...opts });
  },
  confirm(
    message: string,
    opts?: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean }
  ) {
    return show<boolean>({ kind: "confirm", message, ...opts });
  },
  prompt(
    message: string,
    opts?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      placeholder?: string;
      defaultValue?: string;
    }
  ) {
    return show<string | null>({ kind: "prompt", message, ...opts });
  },
};
