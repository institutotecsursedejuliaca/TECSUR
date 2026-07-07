"use client";

import { FileText } from "lucide-react";

interface ReporteCursoBtnProps {
  cursoId: string;
  moduloId: string;
  text?: string;
  style?: React.CSSProperties;
}

export default function ReporteCursoBtn({ cursoId, moduloId, text, style }: ReporteCursoBtnProps) {
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/reportes/curso?curso_id=${cursoId}&modulo_id=${moduloId}`, "_blank");
  };

  return (
    <button
      onClick={handlePrint}
      title="Descargar Reporte del Curso"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: text ? 6 : 0,
        width: text ? "auto" : 32,
        height: 32,
        padding: text ? "0 12px" : 0,
        borderRadius: 8,
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.18)",
        color: "#fbbf24",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: 12,
        fontWeight: 600,
        ...style
      }}
      onMouseEnter={(e) => {
        const hoverBg = style?.background ? String(style.background).replace("0.08", "0.18").replace("0.1", "0.2") : "rgba(251,191,36,0.2)";
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        const leaveBg = style?.background ? String(style.background) : "rgba(251,191,36,0.08)";
        e.currentTarget.style.background = leaveBg;
      }}
    >
      <FileText size={16} />
      {text && <span>{text}</span>}
    </button>
  );
}
