"use client";

import { useState, useEffect } from "react";

export default function ImageViewer({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // reset rotation when image changes
  useEffect(() => { setRotation(0); }, [src]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "image"}
        className={`cursor-zoom-in ${className ?? ""}`}
        onClick={() => { setRotation(0); setOpen(true); }}
      />

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Toolbar */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setRotation((r) => r - 90)}
              className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white text-[18px] transition-colors"
              title="逆时针旋转"
            >
              &#8634;
            </button>
            <button
              onClick={() => setRotation((r) => r + 90)}
              className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white text-[18px] transition-colors"
              title="顺时针旋转"
            >
              &#8635;
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white text-[20px] transition-colors"
            >
              &#x2715;
            </button>
          </div>

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt ?? "image"}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.25s ease",
                maxHeight: "85vh",
                maxWidth: "90vw",
                objectFit: "contain",
              }}
            />
          </div>

          <p className="absolute bottom-4 text-white/50 text-[12px]">点击空白处关闭 · Esc 关闭</p>
        </div>
      )}
    </>
  );
}
