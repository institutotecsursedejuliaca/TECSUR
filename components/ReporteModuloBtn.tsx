"use client";

import { FileSpreadsheet } from "lucide-react";

interface ReporteModuloBtnProps {
  moduloId: string;
  text?: string;
}

export default function ReporteModuloBtn({ moduloId, text }: ReporteModuloBtnProps) {
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/reportes/modulo?modulo_id=${moduloId}`, "_blank");
  };

  return (
    <button
      onClick={handlePrint}
      title="Descargar Registro de Notas y Asistencia"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: text ? 6 : 0,
        width: text ? "auto" : 32,
        height: 32,
        padding: text ? "0 12px" : 0,
        borderRadius: 8,
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.2)",
        color: "#10b981",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: 12,
        fontWeight: 600
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(16,185,129,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(16,185,129,0.1)";
      }}
    >
      <FileSpreadsheet size={16} />
      {text && <span>{text}</span>}
    </button>
  );
}
