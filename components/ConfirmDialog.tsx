"use client";

import { Trash2 } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar",
  description = "Esta acción no se puede deshacer.",
  icon = <Trash2 size={22} style={{ color: "#f87171" }} />,
  iconBg = "rgba(248,113,113,0.1)",
  iconBorder = "rgba(248,113,113,0.25)",
  confirmText = "Sí, continuar",
  confirmBg = "linear-gradient(135deg,#991b1b,#dc2626)",
  confirmShadow = "0 4px 16px rgba(220,38,38,.3)",
  loading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconBorder?: string;
  confirmText?: string;
  confirmBg?: string;
  confirmShadow?: string;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="400px">
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}

        <p style={{ fontSize: 12, color: "rgba(248,113,113,0.7)", marginBottom: 24 }}>
          {description}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
              borderRadius: 10,
              background: "rgba(42,109,181,0.1)",
              border: "1px solid rgba(42,109,181,0.22)",
              color: "rgba(120,160,210,0.85)", fontSize: 13, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px",
              borderRadius: 10, border: "none",
              background: confirmBg,
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", 
              boxShadow: confirmShadow,
              opacity: loading ? 0.65 : 1
            }}
          >
            {loading ? "Procesando…" : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
