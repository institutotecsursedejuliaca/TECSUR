// Paleta de colores por carrera — compartida entre todos los módulos
// [background, border, text]
export const CARRERA_COLORS: Record<string, [string, string, string]> = {
  "Operación de Cargador Frontal":     ["rgba(234,88,12,.15)",  "rgba(234,88,12,.35)",  "#fb923c"],
  "Operación de Excavadora":           ["rgba(202,138,4,.15)",  "rgba(202,138,4,.35)",  "#facc15"],
  "Operación de Motoniveladora":       ["rgba(22,163,74,.15)",  "rgba(22,163,74,.35)",  "#4ade80"],
  "Operación de Tractor de Orugas":    ["rgba(124,58,237,.15)", "rgba(124,58,237,.35)", "#a78bfa"],
  "Mantenimiento de Maquinaria Pesada":["rgba(220,38,38,.15)",  "rgba(220,38,38,.35)",  "#f87171"],
  "Seguridad Minera":                  ["rgba(6,182,212,.15)",  "rgba(6,182,212,.35)",  "#22d3ee"],
};

export function carreraBadgeStyle(carrera: string): React.CSSProperties {
  const [bg, border, color] = CARRERA_COLORS[carrera] ?? [
    "rgba(74,179,216,0.1)", "rgba(74,179,216,0.2)", "rgba(74,179,216,0.85)",
  ];
  return {
    fontSize: 11, padding: "3px 9px", borderRadius: 5,
    background: bg, border: `1px solid ${border}`, color,
    whiteSpace: "normal" as const, wordBreak: "break-word" as const,
    fontWeight: 600, display: "inline-block", maxWidth: "100%"
  };
}
