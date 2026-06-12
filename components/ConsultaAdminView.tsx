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
import AlertDialog from "./AlertDialog";
import ReporteModuloBtn from "./ReporteModuloBtn";
import ReporteMatriculaBtn from "./ReporteMatriculaBtn";
import ReporteAsistenciaBtn from "./ReporteAsistenciaBtn";

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
    notas_cursos: Array<{
      curso_id: string;
      nota: number | null;
      cursos: { nombre: string };
    }>;
    asistencia_total: number | null;
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
  return <span className={`font-bold ${scoreClass(value)}`}>{value}</span>;
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

  const totalPagado = data?.pensiones.reduce((s, p) => s + p.monto_pagado, 0) || 0;
  
  // Agrupar deuda por módulo (usar la última fecha de pago)
  let totalDeuda = 0;
  if (data?.pensiones) {
    const deudaMap = new Map<string, number>(); // modulo_id -> ultima deuda
    const pagosOrdenados = [...data.pensiones].sort((a,b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
    pagosOrdenados.forEach(p => {
      // Como pensiones en consulta no expone modulo_id fácilmente, solo sumamos todas las deudas activas o asumimos la última de cada nombre de modulo.
      if (p.modulos?.nombre && !deudaMap.has(p.modulos.nombre)) {
        deudaMap.set(p.modulos.nombre, p.deuda_pendiente);
      }
    });
    totalDeuda = Array.from(deudaMap.values()).reduce((sum, d) => sum + d, 0);
  }

  return (
    <div className="w-full pb-12" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* ── BÚSQUEDA ── */}
      <div className="glass-card" style={{ padding: "32px", border: "1px solid rgba(42,109,181,0.2)" }}>
        <h2 className="text-2xl font-bold text-white mb-2">Consulta de Alumnos</h2>
        <p className="text-sm text-blue-300 opacity-80 mb-6">Busque un alumno por Código de Alumno o DNI para ver todos sus registros académicos y financieros.</p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 16, maxWidth: 600 }}>
          <div className="relative flex-1" style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.6)" }} />
            <input
              id="consulta-dni-input"
              className="w-full text-white rounded-xl outline-none"
              style={{ height: 48, paddingLeft: 44, paddingRight: 16, background: "rgba(10,22,44,0.7)", border: "1px solid rgba(42,109,181,0.3)" }}
              placeholder="Ingrese el Código o DNI del alumno..."
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            id="consulta-submit-btn"
            type="submit"
            disabled={loading}
            className="rounded-xl font-bold text-white transition-all disabled:opacity-50"
            style={{ height: 48, padding: "0 24px", background: "#2a6db5" }}
          >
            {loading ? "Buscando..." : "Consultar"}
          </button>
        </form>

        <AlertDialog open={!!error} onClose={() => setError(null)} message={error || ""} type="error" />
      </div>

      {data && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* ── ALUMNO INFO HEADER ── */}
          <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(42,109,181,0.2)" }}>
            <div className="flex items-start gap-6 relative" style={{ padding: 32 }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shrink-0"
                   style={{ background: "#1a4a7a", border: "1px solid rgba(42,109,181,0.4)" }}>
                {data.alumno.nombres[0]}{data.alumno.apellidos[0]}
              </div>
              
              <div className="flex-1 relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {data.alumno.apellidos}, <span className="font-medium text-blue-200">{data.alumno.nombres}</span>
                </h2>
                <div className="flex flex-wrap gap-4 mt-3">
                  {(data.alumno as any).codigo && (
                    <span className="flex items-center gap-1.5 rounded-full text-xs font-bold bg-blue-900 bg-opacity-30 text-blue-300 border border-blue-800" style={{ padding: "4px 12px" }}>
                      <User size={12} /> Código: {(data.alumno as any).codigo}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 rounded-full text-xs font-bold bg-blue-900 bg-opacity-30 text-blue-300 border border-blue-800" style={{ padding: "4px 12px" }}>
                    <User size={12} /> DNI: {data.alumno.dni}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full text-xs font-bold border border-blue-800" style={{ ...carreraBadgeStyle(data.alumno.carrera), padding: "4px 12px" }}>
                    <BookOpen size={12} /> {data.alumno.carrera}
                  </span>
                </div>
              </div>
            </div>

            {/* STATS STRIP */}
            <div className="grid grid-cols-3 divide-x divide-blue-900 divide-opacity-30 border-t border-blue-900 border-opacity-30 bg-black bg-opacity-20">
              <div className="text-center" style={{ padding: 20 }}>
                <div className="text-3xl font-black text-blue-400">{data.modulos.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 opacity-60 mt-1">Módulos</div>
              </div>
              <div className="text-center" style={{ padding: 20 }}>
                <div className="text-3xl font-black text-emerald-400">S/ {totalPagado.toFixed(2)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 opacity-60 mt-1">Total Pagado</div>
              </div>
              <div className="text-center" style={{ padding: 20 }}>
                <div className={`text-3xl font-black ${totalDeuda > 0 ? 'text-red-400' : 'text-emerald-400'}`}>S/ {totalDeuda.toFixed(2)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 opacity-60 mt-1">Deuda Pendiente</div>
              </div>
            </div>
          </div>

          {/* ── MÓDULOS ACCORDION ── */}
          {data.modulos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 px-2" style={{ marginBottom: 8 }}>
                <Award className="text-blue-400" /> Rendimiento y Asistencia
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.modulos.map((item) => {
                  const isOpen = expandedModulo === item.matricula_id;
                  const notas = item.notas_cursos;
                  
                  const promediosParciales = notas.filter(n => n.nota !== null).map(n => n.nota!);
                  const promedioFinal = promediosParciales.length > 0 
                    ? promediosParciales.reduce((a,b)=>a+b, 0) / promediosParciales.length 
                    : null;

                  return (
                    <div key={item.matricula_id} className="glass-card overflow-hidden transition-all duration-300" 
                         style={{ border: `1px solid ${isOpen ? 'rgba(74,179,216,0.5)' : 'rgba(42,109,181,0.2)'}`,
                                  boxShadow: isOpen ? '0 10px 30px rgba(0,0,0,0.3)' : 'none' }}>
                      
                      {/* HEADER */}
                      <button
                        className="w-full flex items-center gap-5 text-left transition-colors hover:bg-blue-900 hover:bg-opacity-10"
                        style={{ padding: 20 }}
                        onClick={() => setExpandedModulo(isOpen ? null : item.matricula_id)}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-900 bg-opacity-20 border border-blue-800 shrink-0">
                          <Award size={20} className="text-blue-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-lg font-bold text-white">{item.modulo?.nombre ?? "Módulo sin nombre"}</div>
                          <div className="flex gap-4 mt-1.5 text-xs text-blue-300 opacity-80">
                            <span className="bg-blue-900 bg-opacity-40 rounded text-[10px] uppercase font-bold tracking-wider" style={{ padding: "2px 8px" }}>{item.modulo?.modalidad}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {item.modulo?.fecha_inicio} → {item.modulo?.fecha_fin}</span>
                          </div>
                        </div>

                        <div className="text-right mr-4">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 opacity-60 mb-0.5">Promedio</div>
                          {promedioFinal !== null ? (
                            <div className={`text-2xl font-black ${scoreClass(Math.round(promedioFinal))}`}>{promedioFinal.toFixed(1)}</div>
                          ) : (
                            <div className="text-sm font-medium text-blue-400 opacity-50">S/N</div>
                          )}
                        </div>

                        {isOpen ? <ChevronUp size={20} className="text-blue-400" /> : <ChevronDown size={20} className="text-blue-400 opacity-50" />}
                      </button>

                      {/* BODY */}
                      {isOpen && (
                        <div className="border-t border-blue-900 border-opacity-30 bg-black bg-opacity-10" style={{ padding: "8px 24px 24px 24px" }}>
                          
                          {/* GRADES TABLE */}
                          <div className="mt-4">
                            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">Notas por Curso</h4>
                            {notas && notas.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {notas.map((n, idx) => (
                                  <div key={idx} className="bg-blue-950 bg-opacity-40 border border-blue-900 border-opacity-50 rounded-lg flex justify-between items-center" style={{ padding: 12 }}>
                                    <span className="text-xs font-medium text-blue-200 line-clamp-2 pr-2">{n.cursos?.nombre}</span>
                                    <span className="text-lg"><ScoreCell value={n.nota} /></span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-sm text-blue-400 opacity-60 bg-blue-900 bg-opacity-10 rounded-lg border border-blue-900 border-opacity-30" style={{ padding: 24 }}>
                                El docente aún no ha registrado las notas de los cursos.
                              </div>
                            )}
                          </div>

                          <div className="mt-6">
                            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-3">Asistencia General</h4>
                            <div className="flex items-center gap-4">
                              <div className="text-2xl font-black" style={{ color: item.asistencia_total !== null && item.asistencia_total >= 70 ? "#34d399" : item.asistencia_total !== null ? "#f87171" : "var(--text-muted)"}}>
                                {item.asistencia_total !== null ? `${item.asistencia_total}%` : "—"}
                              </div>
                              <div className="text-xs text-blue-300 opacity-70 max-w-xs">
                                Porcentaje calculado sobre las sesiones registradas por el docente.
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="mt-8 pt-6 flex flex-wrap gap-3 border-t border-blue-900 border-opacity-30">
                            <ReporteMatriculaBtn matriculaId={item.matricula_id} />
                            <ReporteAsistenciaBtn matriculaId={item.matricula_id} />
                            <ReporteModuloBtn moduloId={item.modulo?.id} text="Reporte Consolidado (Toda el aula)" />
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PAGOS TABLE ── */}
          {data.pensiones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                <CreditCard className="text-emerald-400" /> Historial de Pagos
              </h3>
              <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(42,109,181,0.2)" }}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-blue-900 bg-opacity-20 border-b border-blue-900 border-opacity-30 text-blue-300">
                      <th className="font-semibold uppercase tracking-wider text-xs" style={{ padding: 16 }}>Fecha</th>
                      <th className="font-semibold uppercase tracking-wider text-xs" style={{ padding: 16 }}>Recibo</th>
                      <th className="font-semibold uppercase tracking-wider text-xs" style={{ padding: 16 }}>Módulo</th>
                      <th className="font-semibold uppercase tracking-wider text-xs" style={{ padding: 16 }}>Monto Pagado</th>
                      <th className="font-semibold uppercase tracking-wider text-xs" style={{ padding: 16 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900 divide-opacity-20">
                    {data.pensiones.map(p => (
                      <tr key={p.id} className="hover:bg-blue-900 hover:bg-opacity-10 transition-colors">
                        <td className="text-blue-200" style={{ padding: 16 }}>{p.fecha_pago}</td>
                        <td className="font-mono font-medium text-blue-300" style={{ padding: 16 }}>{p.nro_recibo}</td>
                        <td className="text-blue-200" style={{ padding: 16 }}>{p.modulos?.nombre || "—"}</td>
                        <td className="font-bold text-emerald-400" style={{ padding: 16 }}>S/ {p.monto_pagado.toFixed(2)}</td>
                        <td style={{ padding: 16 }}>
                          {p.deuda_pendiente > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded text-xs font-bold bg-red-900 bg-opacity-30 text-red-400 border border-red-800" style={{ padding: "4px 10px" }}>
                              <XCircle size={12} /> Debe S/ {p.deuda_pendiente.toFixed(2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded text-xs font-bold bg-emerald-900 bg-opacity-30 text-emerald-400 border border-emerald-800" style={{ padding: "4px 10px" }}>
                              <CheckCircle size={12} /> Al día
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
