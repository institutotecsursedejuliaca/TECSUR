"use client";

import { useState, useEffect } from "react";
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
import ReporteFichaBtn from "./ReporteFichaBtn";
import ReporteHistorialBtn from "./ReporteHistorialBtn";

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
      duracion?: string | number | null;
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
  return score >= 13 ? "text-white" : "text-gray-400";
}

function ScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "rgba(255,255,255,0.4)" }}>—</span>;
  return <span className={`font-bold ${scoreClass(value)}`} style={{ fontSize: 13 }}>{value}</span>;
}

export default function ConsultaAdminView() {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AlumnoData | null>(null);
  const [expandedModulo, setExpandedModulo] = useState<string | null>(null);
  const [showReniecModal, setShowReniecModal] = useState(false);
  const [hoveredModulo, setHoveredModulo] = useState<string | null>(null);

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

  const [cargos, setCargos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/cargos_modulo")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCargos(data);
      })
      .catch(err => console.error("Error al cargar cargos", err));
  }, []);

  const totalPagado = data?.pensiones.reduce((s, p) => s + p.monto_pagado, 0) || 0;
  
  // Calcular deuda de forma dinámica y retrocompatible
  let totalDeuda = 0;
  if (data) {
    data.modulos.forEach(item => {
      const modId = item.modulo?.id;
      if (!modId) return;

      const cargosModulo = cargos.filter((c: any) => c.modulo_id === modId);
      
      if (cargosModulo.length > 0) {
        const costTotal = cargosModulo.reduce((s: number, c: any) => s + Number(c.monto), 0);
        const paidTotal = data.pensiones.filter((p: any) => p.modulo_id === modId).reduce((s: number, p: any) => s + p.monto_pagado, 0);
        totalDeuda += Math.max(0, costTotal - paidTotal);
      } else {
        // Fallback: usar la última deuda_pendiente registrada en pagos
        const pagosModulo = data.pensiones.filter((p: any) => p.modulo_id === modId)
          .sort((a: any, b: any) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
        if (pagosModulo.length > 0) {
          totalDeuda += pagosModulo[0].deuda_pendiente;
        }
      }
    });
  }

  return (
    <div className="w-full pb-12" style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* ── BÚSQUEDA CENTRADA Y FORMAL ── */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "20px 0" }}>
        <div className="glass-card" style={{ 
          padding: "32px", 
          border: "1px solid rgba(42,109,181,0.18)", 
          width: "100%", 
          maxWidth: 600, 
          textAlign: "center",
          background: "rgba(10, 22, 44, 0.45)",
          borderRadius: 14
        }}>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase" style={{ color: "#dbeafe", marginBottom: 14 }}>Consulta General de Alumnos</h2>
          <p className="text-xs text-blue-300 opacity-60" style={{ marginBottom: 24, lineHeight: 1.5 }}>Ingrese el Código de Alumno o DNI para verificar el historial académico y de matrícula.</p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.4)" }} />
              <input
                id="consulta-dni-input"
                className="w-full text-white rounded-lg outline-none text-xs"
                style={{ height: 42, paddingLeft: 38, paddingRight: 16, background: "rgba(10,22,44,0.6)", border: "1px solid rgba(42,109,181,0.25)" }}
                placeholder="Código o DNI del estudiante..."
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button
              id="consulta-submit-btn"
              type="submit"
              disabled={loading}
              className="rounded-lg font-bold text-white transition-all disabled:opacity-50 hover:bg-blue-600 text-xs"
              style={{ height: 42, padding: "0 20px", background: "#1a4a7a", border: "1px solid rgba(74,179,216,0.25)", cursor: "pointer" }}
            >
              {loading ? "Buscando..." : "Consultar"}
            </button>
          </form>

          <AlertDialog open={!!error} onClose={() => setError(null)} message={error || ""} type="error" />
        </div>
      </div>

      {data && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* ── ALUMNO INFO HEADER ── */}
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, background: "#090f1a", overflow: "hidden" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative" style={{ padding: 32 }}>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0"
                     style={{ background: "#172b4d", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {data.alumno.nombres[0]}{data.alumno.apellidos[0]}
                </div>
                
                <div className="flex-1 relative z-10">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {data.alumno.apellidos}, <span className="font-medium text-gray-300">{data.alumno.nombres}</span>
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {(data.alumno as any).codigo && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        Código: {(data.alumno as any).codigo}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      DNI: {data.alumno.dni}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      Especialidad: {data.alumno.carrera.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones de Reportes */}
              <div className="flex flex-wrap gap-3 shrink-0 relative z-20">
                <ReporteHistorialBtn dni={data.alumno.dni} />
              </div>
            </div>

            {/* FICHA OFICIAL DE DATOS PERSONALES */}
            <div style={{ padding: "28px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "transparent" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
                Ficha Oficial de Datos Personales
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "28px 40px" }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Código Alumno</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, fontFamily: "monospace" }}>{(data.alumno as any).codigo || data.alumno.dni}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>DNI / Identidad</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, fontFamily: "monospace" }}>{data.alumno.dni}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Apellidos</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{data.alumno.apellidos.toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Nombres</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{data.alumno.nombres.toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Celular de Contacto</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{(data.alumno as any).celular || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Correo Electrónico</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{(data.alumno as any).correo || "—"}</div>
                </div>
              </div>
            </div>

            {/* STATS STRIP */}
            <div className="grid grid-cols-3 divide-x divide-gray-800 border-t border-gray-800 bg-transparent">
              <div className="text-center" style={{ padding: 20 }}>
                <div className="text-2xl font-bold text-white">{data.modulos.length}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginTop: 6, textTransform: "uppercase" }}>Módulos</div>
              </div>
              <div className="text-center" style={{ padding: 20 }}>
                <div className="text-2xl font-bold text-white">S/ {totalPagado.toFixed(2)}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginTop: 6, textTransform: "uppercase" }}>Total Pagado</div>
              </div>
              <div className="text-center" style={{ padding: 20 }}>
                <div className="text-2xl font-bold text-white">S/ {totalDeuda.toFixed(2)}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginTop: 6, textTransform: "uppercase" }}>Deuda Pendiente</div>
              </div>
            </div>
          </div>

          {/* ── MÓDULOS ACCORDION ── */}
          {data.modulos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", margin: "0 0 10px 0", textTransform: "uppercase" }}>
                Rendimiento y Asistencia por Módulo
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
                    <div key={item.matricula_id} style={{ border: `1px solid ${isOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, background: "#090f1a", overflow: "hidden" }}>
                      
                      {/* HEADER */}
                      <button
                        className="w-full flex items-center gap-5 text-left transition-colors"
                        style={{
                          padding: 24,
                          background: hoveredModulo === item.matricula_id ? "rgba(255,255,255,0.04)" : "transparent",
                          border: "none",
                          cursor: "pointer"
                        }}
                        onMouseEnter={() => setHoveredModulo(item.matricula_id)}
                        onMouseLeave={() => setHoveredModulo(null)}
                        onClick={() => setExpandedModulo(isOpen ? null : item.matricula_id)}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-800 border border-gray-700 shrink-0">
                          <Award size={18} className="text-gray-300" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-base font-bold text-white">{item.modulo?.nombre ?? "Módulo sin nombre"}</div>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span className="border border-white border-opacity-10 rounded text-[9px] uppercase font-bold tracking-wider" style={{ padding: "1px 6px" }}>{item.modulo?.modalidad}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {item.modulo?.fecha_inicio} → {item.modulo?.fecha_fin}</span>
                          </div>
                        </div>

                        <div className="text-right mr-4">
                          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Promedio</div>
                          {promedioFinal !== null ? (
                            <div className={`text-xl font-bold ${scoreClass(Math.round(promedioFinal))}`}>{promedioFinal.toFixed(1)}</div>
                          ) : (
                            <div className="text-xs font-medium text-gray-500">S/N</div>
                          )}
                        </div>

                        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400 opacity-50" />}
                      </button>

                      {/* BODY */}
                      {isOpen && (
                        <div className="border-t border-white border-opacity-5 bg-transparent" style={{ padding: "8px 24px 24px 24px" }}>
                          
                          {/* GRADES TABLE */}
                          <div style={{ marginTop: 24 }}>
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Notas por Curso</h4>
                            {notas && notas.length > 0 ? (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                                {notas.map((n, idx) => (
                                  <div key={idx} className="border border-white border-opacity-5 rounded-lg flex justify-between items-center" style={{ padding: 12, background: "rgba(255,255,255,0.02)" }}>
                                    <span className="text-xs font-medium text-gray-300 line-clamp-2 pr-2">{n.cursos?.nombre}</span>
                                    <span className="text-base"><ScoreCell value={n.nota} /></span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-xs text-gray-500 border border-white border-opacity-5 rounded-lg" style={{ padding: 24 }}>
                                El docente aún no ha registrado las notas de los cursos.
                              </div>
                            )}
                          </div>

                          <div style={{ marginTop: 24 }}>
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Asistencia General</h4>
                            <div className="flex items-center gap-4">
                              <div className="text-2xl font-black" style={{ color: item.asistencia_total !== null && item.asistencia_total >= 70 ? "#fff" : item.asistencia_total !== null ? "#f87171" : "rgba(255,255,255,0.3)"}}>
                                {item.asistencia_total !== null ? `${item.asistencia_total}%` : "—"}
                              </div>
                              <div className="text-xs text-blue-300 opacity-70 max-w-xs">
                                Porcentaje calculado sobre las sesiones registradas por el docente.
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: 24 }}>
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Estado Financiero</h4>
                            {(() => {
                              const modId = item.modulo?.id;
                              if (!modId) return null;
                              
                              const cargosModulo = cargos.filter((c: any) => c.modulo_id === modId);
                              
                              if (cargosModulo.length > 0) {
                                const costMat = cargosModulo.filter((c: any) => c.concepto === "MATRICULA").reduce((s: number, c: any) => s + Number(c.monto), 0);
                                const costPen = cargosModulo.filter((c: any) => c.concepto === "PENSION").reduce((s: number, c: any) => s + Number(c.monto), 0);
                                const costOtr = cargosModulo.filter((c: any) => c.concepto === "OTROS").reduce((s: number, c: any) => s + Number(c.monto), 0);

                                const pagos = data.pensiones.filter((p: any) => p.modulo_id === modId);
                                const paidMat = pagos.filter((p: any) => p.concepto === "MATRICULA").reduce((s: number, p: any) => s + p.monto_pagado, 0);
                                const paidPen = pagos.filter((p: any) => p.concepto === "PENSION").reduce((s: number, p: any) => s + p.monto_pagado, 0);
                                const paidOtr = pagos.filter((p: any) => p.concepto === "OTROS").reduce((s: number, p: any) => s + p.monto_pagado, 0);

                                const remMat = Math.max(0, costMat - paidMat);
                                const remPen = Math.max(0, costPen - paidPen);
                                const remOtr = Math.max(0, costOtr - paidOtr);
                                const totalRestante = remMat + remPen + remOtr;

                                return (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,255,255,0.01)", padding: "14px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)", maxWidth: 500 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Matrícula:</span>
                                      <span style={{ fontWeight: 600, color: remMat > 0 ? "#60a5fa" : "rgba(255,255,255,0.3)" }}>
                                        {costMat > 0 ? `Pagado S/ ${paidMat.toFixed(2)} / S/ ${costMat.toFixed(2)} (${remMat > 0 ? `Debe S/ ${remMat.toFixed(2)}` : "Al día"})` : "Sin cargo"}
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Mensualidades / Pensión:</span>
                                      <span style={{ fontWeight: 600, color: remPen > 0 ? "#34d399" : "rgba(255,255,255,0.3)" }}>
                                        {costPen > 0 ? `Pagado S/ ${paidPen.toFixed(2)} / S/ ${costPen.toFixed(2)} (${remPen > 0 ? `Debe S/ ${remPen.toFixed(2)}` : "Al día"})` : "Sin cargo"}
                                      </span>
                                    </div>
                                    {costOtr > 0 && (
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                        <span style={{ color: "rgba(255,255,255,0.5)" }}>Otros conceptos:</span>
                                        <span style={{ fontWeight: 600, color: remOtr > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                                          {`Pagado S/ ${paidOtr.toFixed(2)} / S/ ${costOtr.toFixed(2)} (Debe S/ ${remOtr.toFixed(2)})`}
                                        </span>
                                      </div>
                                    )}
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", fontWeight: 700 }}>
                                      <span style={{ color: "#fff" }}>DEUDA PENDIENTE TOTAL:</span>
                                      <span style={{ color: totalRestante > 0 ? "#f87171" : "#34d399" }}>
                                        {totalRestante > 0 ? `S/ ${totalRestante.toFixed(2)}` : "AL DÍA"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else {
                                // Fallback retrocompatible
                                const pagosModulo = data.pensiones.filter((p: any) => p.modulo_id === modId)
                                  .sort((a: any, b: any) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
                                const totalRestante = pagosModulo.length > 0 ? pagosModulo[0].deuda_pendiente : 0;
                                const pagadoTotal = pagosModulo.reduce((sum, p) => sum + p.monto_pagado, 0);

                                return (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(255,255,255,0.01)", padding: "14px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.03)", maxWidth: 500 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Historial de Pagos Realizados:</span>
                                      <span style={{ fontWeight: 600, color: "#fff" }}>S/ {pagadoTotal.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", fontWeight: 700 }}>
                                      <span style={{ color: "#fff" }}>DEUDA PENDIENTE (Último Recibo):</span>
                                      <span style={{ color: totalRestante > 0 ? "#f87171" : "#34d399" }}>
                                        {totalRestante > 0 ? `S/ ${totalRestante.toFixed(2)}` : "AL DÍA"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>

                          {/* ACTION BUTTONS */}
                          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 12 }}>
                            <ReporteFichaBtn matriculaId={item.matricula_id} label="Ficha Matrícula" />
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
