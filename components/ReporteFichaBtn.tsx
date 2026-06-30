"use client";
import { Printer } from "lucide-react";
import Link from "next/link";

interface Props {
  matriculaId?: string;
  alumnoId?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export default function ReporteFichaBtn({ matriculaId, alumnoId, className, style, label = "Ficha" }: Props) {
  const href = alumnoId ? `/reportes/ficha?alumno=${alumnoId}` : `/reportes/ficha?matricula=${matriculaId}`;
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "ts-btn-secondary md-action"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 8px", borderRadius: 7,
        border: "1px solid rgba(59, 130, 246, 0.3)",
        background: "rgba(59, 130, 246, 0.1)",
        color: "rgba(59, 130, 246, 0.9)",
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all .2s",
        whiteSpace: "nowrap",
        ...style
      }}
      title="Ficha de Matrícula"
    >
      <Printer size={12} />
      {label}
    </Link>
  );
}
