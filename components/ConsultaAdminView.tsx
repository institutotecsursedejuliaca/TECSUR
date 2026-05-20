"use client";

import { useState } from "react";
import { carreraBadgeStyle } from "@/lib/carreraColors";
import {
  Search,
  User,
  BookOpen,
  CreditCard,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AlumnoData {
  alumno: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    carrera: string;
  };
  modulos: Array<{
    matricula_id: string;
    fecha_registro: string;
    modulo: {
      id: string;
      nombre: string;
      fecha_inicio: string;
      fecha_fin: string;
      modalidad: string;
      duracion: number;
    };
    notas: {
      inspeccion: number | null;
      mantenimiento: number | null;
      sistema_hidraulico: number | null;
      seguridad: number | null;
      ingles: number | null;
      operacion: number | null;
      promedio: number | null;
      asistencia_total: number | null;
    } | null;
  }>;
  pensiones: Array<{
    id: string;
    nro_recibo: string;
    monto_pagado: number;
    deuda_pendiente: number;
    fecha_pago: string;
    modulos: { nombre: string };
  }>;
}

function scoreClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 17) return "score-excellent";
  if (score >= 13) return "score-good";
  if (score >= 11) return "score-average";
  return "score-poor";
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  return <span className={scoreClass(value)}>{value}</span>;
}

export default function ConsultaAdminView() {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlumnoData | null>(null);
  const [expandedModulo, setExpandedModulo] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!dni.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/consulta?dni=${encodeURIComponent(dni.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error al consultar");
      } else {
        setData(json);
        if (json.modulos?.length > 0) setExpandedModulo(json.modulos[0].matricula_id);
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const totalDeuda = data?.pensiones.reduce((sum, p) => sum + (p.deuda_pendiente ?? 0), 0) ?? 0;
  const totalPagado = data?.pensiones.reduce((sum, p) => sum + (p.monto_pagado ?? 0), 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search bar */}
      <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
        <div className="mb-4">
          <h2 className="section-title">Consulta por DNI</h2>
          <p className="section-subtitle">Ingrese el DNI para obtener el reporte académico consolidado</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              id="search-dni-input"
              className="input-field pl-9"
              placeholder="Ej: 12345678"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              maxLength={12}
              type="text"
            />
          </div>
          <button
            id="search-dni-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ minWidth: 120 }}
          >
            {loading ? (
              <span style={{ opacity: 0.7 }}>Buscando…</span>
            ) : (
              <>
                <Search size={16} />
                Buscar
              </>
            )}
          </button>
        </form>
        {error && (
          <div className="alert alert-error mt-4">
            <XCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Alumno header card */}
          <div
            className="rounded-xl p-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #1a2d48 100%)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{
                background: "radial-gradient(circle, #3b82f6, transparent)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center rounded-xl text-xl font-bold flex-shrink-0"
                style={{
                  width: 64,
                  height: 64,
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  color: "white",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                }}
              >
                {data.alumno.nombres[0]}{data.alumno.apellidos[0]}
              </div>
              <div className="flex-1">
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {data.alumno.nombres} {data.alumno.apellidos}
                </h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="badge badge-blue">
                    <User size={10} />
                    DNI: {data.alumno.dni}
                  </span>
                  <span style={carreraBadgeStyle(data.alumno.carrera)}>
                    <BookOpen size={10} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>
                    {data.alumno.carrera}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="text-2xl font-bold" style={{ color: "#60a5fa" }}>
                  {data.modulos.length}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Módulos inscritos
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="text-2xl font-bold" style={{ color: "#34d399" }}>
                  S/ {totalPagado.toFixed(2)}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Total pagado
                </div>
              </div>
              <div
                className="rounded-lg p-3 text-center"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: totalDeuda > 0 ? "#f87171" : "#34d399" }}
                >
                  S/ {totalDeuda.toFixed(2)}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Deuda pendiente
                </div>
              </div>
            </div>
          </div>

          {/* Modules accordion */}
          {data.modulos.length > 0 && (
            <div>
              <h3 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Módulos y Calificaciones
              </h3>
              <div className="space-y-3">
                {data.modulos.map((item) => {
                  const isOpen = expandedModulo === item.matricula_id;
                  const n = item.notas;
                  return (
                    <div
                      key={item.matricula_id}
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                    >
                      {/* Accordion header */}
                      <button
                        id={`modulo-accordion-${item.matricula_id}`}
                        className="w-full flex items-center gap-4 p-4 text-left transition-colors"
                        style={{ background: isOpen ? "var(--surface-2)" : "transparent" }}
                        onClick={() => setExpandedModulo(isOpen ? null : item.matricula_id)}
                      >
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))",
                            border: "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          <Award size={18} style={{ color: "#60a5fa" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                            {item.modulo?.nombre ?? "Módulo sin nombre"}
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className="badge badge-blue" style={{ fontSize: 10 }}>
                              {item.modulo?.modalidad}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              <Calendar size={10} className="inline mr-1" />
                              {item.modulo?.fecha_inicio} → {item.modulo?.fecha_fin}
                            </span>
                          </div>
                        </div>
                        {n?.promedio !== null && n?.promedio !== undefined ? (
                          <div className={`text-2xl font-bold ${scoreClass(n.promedio)}`}>
                            {n.promedio.toFixed(1)}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sin notas</span>
                        )}
                        {isOpen ? (
                          <ChevronUp size={16} style={{ color: "var(--text-muted)" }} />
                        ) : (
                          <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
                        )}
                      </button>

                      {/* Accordion body */}
                      {isOpen && (
                        <div className="p-4 pt-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          {n ? (
                            <div className="overflow-x-auto mt-3">
                              <table className="data-table">
                                <thead>
                                  <tr>
                                    <th>Inspección</th>
                                    <th>Mantenimiento</th>
                                    <th>Sist. Hidráulico</th>
                                    <th>Seguridad</th>
                                    <th>Inglés</th>
                                    <th>Operación</th>
                                    <th>Promedio</th>
                                    <th>Asistencia</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td><ScoreCell value={n.inspeccion} /></td>
                                    <td><ScoreCell value={n.mantenimiento} /></td>
                                    <td><ScoreCell value={n.sistema_hidraulico} /></td>
                                    <td><ScoreCell value={n.seguridad} /></td>
                                    <td><ScoreCell value={n.ingles} /></td>
                                    <td><ScoreCell value={n.operacion} /></td>
                                    <td>
                                      <span className={`text-base font-bold ${scoreClass(n.promedio)}`}>
                                        {n.promedio?.toFixed(2) ?? "—"}
                                      </span>
                                    </td>
                                    <td>
                                      {n.asistencia_total !== null ? (
                                        <span style={{ color: "#34d399", fontWeight: 600 }}>
                                          {n.asistencia_total}%
                                        </span>
                                      ) : (
                                        <span style={{ color: "var(--text-muted)" }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="alert alert-warning mt-3">
                              <AlertTriangle size={14} />
                              Aún no se han registrado notas para este módulo.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pensiones table */}
          {data.pensiones.length > 0 && (
            <div>
              <h3 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Estado de Cuenta — Pensiones
              </h3>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>N° Recibo</th>
                        <th>Módulo</th>
                        <th>Monto Pagado</th>
                        <th>Deuda Pendiente</th>
                        <th>Fecha Pago</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pensiones.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs">{p.nro_recibo}</td>
                          <td>{p.modulos?.nombre ?? "—"}</td>
                          <td>
                            <span style={{ color: "#34d399", fontWeight: 600 }}>
                              S/ {p.monto_pagado.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: p.deuda_pendiente > 0 ? "#f87171" : "#34d399",
                                fontWeight: 600,
                              }}
                            >
                              S/ {p.deuda_pendiente.toFixed(2)}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>{p.fecha_pago}</td>
                          <td>
                            {p.deuda_pendiente > 0 ? (
                              <span className="badge badge-red">
                                <XCircle size={10} /> Con deuda
                              </span>
                            ) : (
                              <span className="badge badge-green">
                                <CheckCircle size={10} /> Al día
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {data.modulos.length === 0 && data.pensiones.length === 0 && (
            <div className="alert alert-info">
              <BookOpen size={14} />
              El alumno no tiene matrículas ni pagos registrados aún.
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          <Search size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p className="text-sm">Ingrese un DNI para visualizar el reporte académico</p>
        </div>
      )}
    </div>
  );
}
