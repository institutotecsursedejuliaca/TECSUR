"use client";
import Link from "next/link";

interface Props {
  matriculaId: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function ReporteAsistenciaBtn({ matriculaId, className, style, label = "Asistencia" }: Props) {
  return (
    <Link
      href={`/reportes/asistencia?matricula=${matriculaId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "ts-btn-secondary md-action"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 8px", borderRadius: 7,
        border: "1px solid rgba(74,179,216,0.3)",
        background: "rgba(74,179,216,0.1)",
        color: "rgba(74,179,216,0.9)",
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all .2s",
        whiteSpace: "nowrap",
        ...style
      }}
      title="Ver Reporte de Asistencia"
    >
      <img src="/img/logo.png" alt="Logo" style={{ width: 14, height: 14, objectFit: "contain" }} />
      {label}
    </Link>
  );
}
