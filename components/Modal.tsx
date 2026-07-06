"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "min(540px, 95vw)"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => e.preventDefault()}
      style={{
        padding: 0,
        border: "none",
        borderRadius: 16,
        background: "transparent",
        maxWidth,
        width: "100%",
        outline: "none",
        position: "fixed",
        top: "10%",
        margin: "0 auto",
      }}
    >
      <style>{`
        dialog::backdrop {
          background: rgba(4, 10, 24, 0.75);
          backdrop-filter: blur(6px);
        }
        dialog[open] {
          animation: modalIn .32s cubic-bezier(.16, 1, .3, 1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          background: "rgba(8,16,34,0.98)",
          border: "1px solid rgba(42,109,181,0.28)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,179,216,0.06) inset",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* barra superior */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, #1a4a7a, #2a6db5, #4ab3d8, #2a6db5, #1a4a7a)",
          backgroundSize: "200% 100%",
          animation: "barShift 3s linear infinite",
        }} />

        {/* header del modal */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 14px",
          borderBottom: "1px solid rgba(42,109,181,0.14)",
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700,
            color: "#dbeafe",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.02em",
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(42,109,181,0.1)",
              border: "1px solid rgba(42,109,181,0.2)",
              color: "rgba(74,179,216,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "background .2s",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* contenido */}
        <div style={{ padding: "22px 24px 24px", maxHeight: "80vh", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
