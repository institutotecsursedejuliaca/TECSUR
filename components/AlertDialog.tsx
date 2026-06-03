"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import Modal from "./Modal";

export default function AlertDialog({
  open,
  onClose,
  title,
  message,
  type = "info",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
}) {
  const isError = type === "error";
  const isSuccess = type === "success";

  const defaultTitle = isError ? "Error" : isSuccess ? "Éxito" : "Información";
  const finalTitle = title || defaultTitle;

  const icon = isError ? (
    <AlertTriangle size={24} style={{ color: "#f87171" }} />
  ) : isSuccess ? (
    <CheckCircle size={24} style={{ color: "#34d399" }} />
  ) : (
    <Info size={24} style={{ color: "#4ab3d8" }} />
  );

  const iconBg = isError ? "rgba(248,113,113,0.1)" : isSuccess ? "rgba(52,211,153,0.1)" : "rgba(74,179,216,0.1)";
  const iconBorder = isError ? "rgba(248,113,113,0.25)" : isSuccess ? "rgba(52,211,153,0.25)" : "rgba(74,179,216,0.25)";

  return (
    <Modal open={open} onClose={onClose} title={finalTitle} maxWidth="400px">
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        
        <p style={{ fontSize: 14, color: "#dbeafe", marginBottom: 24, lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 24px",
              borderRadius: 10,
              background: "rgba(42,109,181,0.1)",
              border: "1px solid rgba(42,109,181,0.22)",
              color: "rgba(120,160,210,0.85)", fontSize: 13, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
}
