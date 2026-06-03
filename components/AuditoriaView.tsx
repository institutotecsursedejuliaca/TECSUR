"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, RefreshCw, Filter,
  Database, User, Clock, FileText,
} from "lucide-react";

interface AuditRow {
  id: number;
  fecha: string;
  tabla: string;
  accion: "INSERT" | "UPDATE" | "DELETE";
  accion_label: string;
  registro_id: string | null;
  usuario_email: string | null;
  usuario_id: string | null;
  ip: string | null;
  resumen: string | null;
  datos_nuevos: Record<string, unknown> | null;
  datos_anteriores: Record<string, unknown> | null;
}

interface PaginatedAudit {
  data: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;

const TABLAS = [
  "alumnos", "carreras", "modulos", "cursos",
  "matriculas", "notas", "notas_cursos", "asistencias", "pensiones", "ingresos",
];

const ACCION_CONFIG = {
  INSERT: { label: "Creación",     bg: "rgba(52,211,153,0.12)",  color: "#34d399", icon: Plus    },
  UPDATE: { label: "Modificación", bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", icon: Pencil  },
  DELETE: { label: "Eliminación",  bg: "rgba(248,113,113,0.12)", color: "#f87171", icon: Trash2  },
};

const TABLA_LABELS: Record<string, string> = {
  alumnos:    "Alumnos",
  carreras:   "Carreras",
  modulos:    "Módulos",
  cursos:     "Cursos",
  matriculas: "Matrículas",
  notas:      "Notas",
  notas_cursos: "Notas por Curso",
  asistencias: "Asistencias",
  pensiones:  "Pensiones",
  ingresos:   "Ingresos",
};

const card: React.CSSProperties = {
  background: "rgba(8,16,34,0.85)",
  border: "1px solid rgba(42,109,181,0.18)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};
const inp: React.CSSProperties = {
  height: 38, boxSizing: "border-box",
  background: "rgba(10,22,44,0.7)",
  border: "1px solid rgba(42,109,181,0.22)",
  borderRadius: 9, padding: "0 12px",
  color: "#dbeafe", fontSize: 13, fontFamily: "inherit", outline: "none",
};

export default function AuditoriaView() {
  const [rows,     setRows]     = useState<AuditRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [searchIn, setSearchIn] = useState("");
  const [filterTabla,  setFilterTabla]  = useState("");
  const [filterAccion, setFilterAccion] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number, s: string, t: string, a: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p),
      pageSize: String(PAGE_SIZE),
      ...(s ? { search: s } : {}),
      ...(t ? { tabla: t } : {}),
      ...(a ? { accion: a } : {}),
    });
    const res = await fetch(`/api/auditoria?${params}`);
    const json: PaginatedAudit = await res.json();
    setRows(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(page, search, filterTabla, filterAccion); }, [page, search, filterTabla, filterAccion, load]);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchIn); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchIn]);

  function formatFecha(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  function shortId(id: string | null) {
    if (!id) return "—";
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .aud-inp:focus { border-color:rgba(74,179,216,.55)!important; box-shadow:0 0 0 3px rgba(74,179,216,.1)!important; }
        .aud-row:hover td { background: rgba(42,109,181,0.05); }
        .aud-row.expanded td { background: rgba(42,109,181,0.08); }
        .aud-pg { width:32px;height:32px;border-radius:8px;border:1px solid rgba(42,109,181,0.2);background:rgba(42,109,181,0.08);color:rgba(120,160,210,0.8);font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;font-family:inherit; }
        .aud-pg:hover:not(:disabled){background:rgba(42,109,181,0.2);border-color:rgba(74,179,216,.4);color:#4ab3d8;}
        .aud-pg.active{background:linear-gradient(135deg,#1a4a7a,#2a6db5);border-color:rgba(74,179,216,.4);color:#fff;}
        .aud-pg:disabled{opacity:.35;cursor:not-allowed;}
        .aud-sel{appearance:none;-webkit-appearance:none;cursor:pointer;}
      `}</style>

      {/* Header */}
      <div style={{ ...card, padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(74,179,216,0.2))", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} style={{ color: "#a78bfa" }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", fontFamily: "'Syne',sans-serif" }}>
                Auditoría del Sistema
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)" }}>
              Registro automático de todas las operaciones CRUD · {total.toLocaleString()} eventos totales
            </p>
          </div>
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(42,109,181,0.22)", background: "rgba(42,109,181,0.1)", color: "rgba(120,160,210,0.85)", fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
            onClick={() => load(page, search, filterTabla, filterAccion)}
          >
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Buscador */}
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)", pointerEvents: "none" }} />
            <input
              className="aud-inp"
              style={{ ...inp, paddingLeft: 30, width: "100%" }}
              placeholder="Buscar usuario, tabla, ID…"
              value={searchIn}
              onChange={e => setSearchIn(e.target.value)}
            />
          </div>
          {/* Filtro tabla */}
          <div style={{ position: "relative" }}>
            <Filter size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.4)", pointerEvents: "none" }} />
            <select className="aud-inp aud-sel" style={{ ...inp, paddingLeft: 28, paddingRight: 24, minWidth: 150 }}
              value={filterTabla} onChange={e => { setFilterTabla(e.target.value); setPage(1); }}>
              <option value="">Todas las tablas</option>
              {TABLAS.map(t => <option key={t} value={t}>{TABLA_LABELS[t] ?? t}</option>)}
            </select>
          </div>
          {/* Filtro acción */}
          <div style={{ position: "relative" }}>
            <select className="aud-inp aud-sel" style={{ ...inp, paddingRight: 24, minWidth: 130 }}
              value={filterAccion} onChange={e => { setFilterAccion(e.target.value); setPage(1); }}>
              <option value="">Todas las acciones</option>
              <option value="INSERT">Creaciones</option>
              <option value="UPDATE">Modificaciones</option>
              <option value="DELETE">Eliminaciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats rápidas */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {(["INSERT", "UPDATE", "DELETE"] as const).map(ac => {
            const cfg = ACCION_CONFIG[ac];
            const Icon = cfg.icon;
            const cnt  = rows.filter(r => r.accion === ac).length;
            return (
              <button
                key={ac}
                onClick={() => { setFilterAccion(filterAccion === ac ? "" : ac); setPage(1); }}
                style={{ ...card, padding: "16px 20px", cursor: "pointer", border: filterAccion === ac ? `1px solid ${cfg.color}` : "1px solid rgba(42,109,181,0.18)", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(120,160,210,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{cfg.label}s</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: cfg.color }}>{cnt}</div>
                <div style={{ fontSize: 10, color: "rgba(74,179,216,0.35)", marginTop: 2 }}>en esta página</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Tabla */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(42,109,181,0.14)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#dbeafe" }}>Eventos de Auditoría</span>
          <span style={{ fontSize: 11, color: "rgba(74,179,216,0.5)" }}>
            {total.toLocaleString()} total · página {page} de {totalPages}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "24px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 36, borderRadius: 8, background: "rgba(42,109,181,0.07)", animation: `pulse 1.5s ${i*0.1}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
            <Shield size={40} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No hay eventos de auditoría aún</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Los eventos aparecerán automáticamente al realizar operaciones en el sistema</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.14)" }}>
                  {["Fecha y Hora", "Acción", "Tabla", "Registro", "Usuario", "Resumen", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const cfg = ACCION_CONFIG[row.accion];
                  const Icon = cfg.icon;
                  const isExp = expanded === row.id;
                  return [
                    <tr
                      key={row.id}
                      className={`aud-row${isExp ? " expanded" : ""}`}
                      style={{ borderBottom: "1px solid rgba(42,109,181,0.07)", cursor: "pointer", transition: "background .15s" }}
                      onClick={() => setExpanded(isExp ? null : row.id)}
                    >
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Clock size={11} style={{ color: "rgba(74,179,216,0.35)", flexShrink: 0 }} />
                          <span style={{ color: "rgba(180,210,240,0.75)", fontFamily: "monospace", fontSize: 11 }}>{formatFecha(row.fecha)}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 8, background: "rgba(42,109,181,0.1)", border: "1px solid rgba(42,109,181,0.18)", color: "rgba(120,160,210,0.8)", fontSize: 11 }}>
                          <Database size={10} style={{ color: "rgba(74,179,216,0.5)" }} />
                          {TABLA_LABELS[row.tabla] ?? row.tabla}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(74,179,216,0.5)", background: "rgba(42,109,181,0.08)", padding: "2px 6px", borderRadius: 5 }}>
                          {shortId(row.registro_id)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <User size={11} style={{ color: "rgba(74,179,216,0.35)", flexShrink: 0 }} />
                          <span style={{ color: "rgba(180,210,240,0.7)", fontSize: 11, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.usuario_email ?? "sistema"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: "rgba(120,160,210,0.65)", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {row.resumen ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 10, color: "rgba(74,179,216,0.4)" }}>{isExp ? "▲" : "▼"}</span>
                      </td>
                    </tr>,
                    // Fila expandida con detalles JSON
                    isExp && (
                      <tr key={`${row.id}-detail`} style={{ background: "rgba(6,10,24,0.6)" }}>
                        <td colSpan={7} style={{ padding: "0 14px 14px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: row.datos_anteriores && row.datos_nuevos ? "1fr 1fr" : "1fr", gap: 12, marginTop: 12 }}>
                            {row.datos_anteriores && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(248,113,113,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                                  {row.accion === "UPDATE" ? "Datos anteriores" : "Datos eliminados"}
                                </div>
                                <pre style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, padding: 12, fontSize: 11, color: "rgba(248,113,113,0.7)", margin: 0, overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
                                  {JSON.stringify(row.datos_anteriores, null, 2)}
                                </pre>
                              </div>
                            )}
                            {row.datos_nuevos && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(52,211,153,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                                  {row.accion === "UPDATE" ? "Campos modificados" : "Datos creados"}
                                </div>
                                <pre style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 8, padding: 12, fontSize: 11, color: "rgba(52,211,153,0.7)", margin: 0, overflowX: "auto", maxHeight: 200, overflowY: "auto" }}>
                                  {JSON.stringify(row.datos_nuevos, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                          {row.ip && (
                            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(74,179,216,0.35)" }}>
                              IP: {row.ip}
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(42,109,181,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(74,179,216,0.5)" }}>
              {total.toLocaleString()} eventos · pág {page} de {totalPages}
            </span>
            <div style={{ display: "flex", gap: 5 }}>
              <button className="aud-pg" disabled={page <= 1} onClick={() => setPage(p => p - 1)} title="Anterior">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={p} className={`aud-pg${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="aud-pg" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} title="Siguiente">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer informativo */}
      <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.12)", fontSize: 12, color: "rgba(139,92,246,0.7)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Los registros de auditoría son <strong style={{ color: "rgba(167,139,250,0.9)" }}>inmutables</strong> — se generan automáticamente por triggers en la base de datos.
            Nadie puede modificarlos ni eliminarlos directamente. Los campos JSON de datos anteriores/nuevos permiten reconstruir cualquier cambio histórico.
          </span>
        </div>
      </div>
    </div>
  );
}
