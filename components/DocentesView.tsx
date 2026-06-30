"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, Calendar, Save, Plus, CheckSquare, Square, Layers, User, Edit, Search } from "lucide-react";
import AlertDialog from "./AlertDialog";
import Modal from "./Modal";
import ReporteModuloBtn from "./ReporteModuloBtn";
import { carreraBadgeStyle } from "@/lib/carreraColors";

interface Modulo {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: string;
  duracion: number;
  profesor?: string;
  local?: string;
  aula?: string;
  carrera_id?: string | null;
  carreras?: { id: string; nombre: string } | null;
}
interface Matricula { id: string; alumnos: { id: string; dni: string; nombres: string; apellidos: string; carrera: string } }
interface Curso { id: string; nombre: string; orden: number; creditos?: number; }
interface Asistencia { id: string; matricula_id: string; estado: string }
interface NotaCurso { id: string; matricula_id: string; nota: number | null }

const cardStyle: React.CSSProperties = { background: "rgba(8,16,34,0.85)", border: "1px solid rgba(42,109,181,0.18)", borderRadius: 14, backdropFilter: "blur(12px)" };
const inpStyle: React.CSSProperties = { width: "100%", height: 40, boxSizing: "border-box", background: "rgba(10,22,44,0.7)", border: "1px solid rgba(42,109,181,0.22)", borderRadius: 10, padding: "0 14px", color: "#dbeafe", fontSize: 13, outline: "none" };
const btnPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1a4a7a 0%,#2a6db5 55%,#4ab3d8 100%)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: "rgba(42,109,181,0.1)", border: "1px solid rgba(42,109,181,0.22)", color: "rgba(120,160,210,0.85)", fontSize: 13, fontWeight: 500, cursor: "pointer" };

interface DocentesViewProps {
  docenteId?: string | null;
}

export default function DocentesView({ docenteId = null }: DocentesViewProps) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cursosDocente, setCursosDocente] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModulo, setSelectedModulo] = useState<Modulo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [tab, setTab] = useState<"asistencia" | "notas">("asistencia");
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  
  // Asistencia
  const [fechaAsistencia, setFechaAsistencia] = useState<string>(new Date().toISOString().split("T")[0]);
  const [asistenciasMap, setAsistenciasMap] = useState<Record<string, boolean>>({}); // matricula_id -> presente?
  const [observacionesMap, setObservacionesMap] = useState<Record<string, string>>({}); // matricula_id -> observacion
  
  // Notas
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>("");
  const [notasMap, setNotasMap] = useState<Record<string, string>>({}); // matricula_id -> nota
  const [showNewCurso, setShowNewCurso] = useState(false);
  const [newCursoNombre, setNewCursoNombre] = useState("");
  const [newCursoCreditos, setNewCursoCreditos] = useState(1);
  const [newCursoDocenteId, setNewCursoDocenteId] = useState("");
  const [showEditCurso, setShowEditCurso] = useState(false);
  const [editCursoId, setEditCursoId] = useState("");
  const [editCursoNombre, setEditCursoNombre] = useState("");
  const [editCursoCreditos, setEditCursoCreditos] = useState(1);
  const [editCursoDocenteId, setEditCursoDocenteId] = useState("");
  const [docentes, setDocentes] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });

  useEffect(() => {
    setLoading(true);
    if (docenteId) {
      // Cargar los cursos asignados al docente
      fetch(`/api/cursos?docente_id=${docenteId}`)
        .then(r => r.json())
        .then(data => {
          setCursosDocente(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Cargar módulos generales para el administrador
      fetch("/api/modulos")
        .then(r => r.json())
        .then(data => {
          setModulos(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [docenteId]);

  useEffect(() => {
    if (!docenteId) {
      fetch("/api/docentes")
        .then(r => r.json())
        .then(data => setDocentes(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [docenteId]);

  const loadMatriculas = async (moduloId: string) => {
    const res = await fetch(`/api/matriculas?modulo_id=${moduloId}`);
    const data = await res.json();
    setMatriculas(Array.isArray(data) ? data : []);
  };

  const loadAsistencias = async (moduloId: string, cursoId: string, fecha: string) => {
    if (!cursoId) return;
    const res = await fetch(`/api/asistencias?modulo_id=${moduloId}&curso_id=${cursoId}&fecha=${fecha}`);
    const data: Asistencia[] = await res.json();
    const asisMap: Record<string, boolean> = {};
    const obsMap: Record<string, string> = {};
    if (Array.isArray(data)) {
      data.forEach((a: any) => { 
        asisMap[a.matricula_id] = a.estado === "presente"; 
        obsMap[a.matricula_id] = a.observacion || "";
      });
    }
    setAsistenciasMap(asisMap);
    setObservacionesMap(obsMap);
  };

  const loadCursos = async (moduloId: string) => {
    const res = await fetch(`/api/cursos?modulo_id=${moduloId}`);
    const data: Curso[] = await res.json();
    const validData = Array.isArray(data) ? data : [];
    setCursos(validData);
    if (validData.length > 0 && !selectedCursoId) {
      setSelectedCursoId(validData[0].id);
    }
  };

  const loadNotas = async (cursoId: string) => {
    if (!cursoId) return;
    const res = await fetch(`/api/notas-cursos?curso_id=${cursoId}`);
    const data: NotaCurso[] = await res.json();
    const map: Record<string, string> = {};
    if (Array.isArray(data)) {
      data.forEach(n => { map[n.matricula_id] = n.nota !== null ? n.nota.toString() : ""; });
    }
    setNotasMap(map);
  };

  useEffect(() => {
    if (selectedModulo) {
      loadMatriculas(selectedModulo.id);
      loadCursos(selectedModulo.id);
    }
  }, [selectedModulo]);

  useEffect(() => {
    if (selectedModulo && tab === "asistencia" && selectedCursoId && fechaAsistencia) {
      loadAsistencias(selectedModulo.id, selectedCursoId, fechaAsistencia);
    }
  }, [selectedModulo, tab, selectedCursoId, fechaAsistencia]);

  useEffect(() => {
    if (tab === "notas" && selectedCursoId) {
      loadNotas(selectedCursoId);
    }
  }, [tab, selectedCursoId]);

  const flash = (type: "success" | "error", message: string) => setAlertInfo({ open: true, type, message });

  // Guardar Asistencia
  const saveAsistencia = async () => {
    if (!selectedModulo || !fechaAsistencia) return;
    setSaving(true);
    try {
      const promises = matriculas.map(async (m) => {
        const presente = asistenciasMap[m.id] || false;
        const obs = observacionesMap[m.id] || "";
        await fetch("/api/asistencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricula_id: m.id,
            modulo_id: selectedModulo.id,
            curso_id: selectedCursoId,
            fecha: fechaAsistencia,
            estado: presente ? "presente" : "falta",
            observacion: obs.trim() === "" ? null : obs.trim()
          })
        });
      });
      await Promise.all(promises);
      flash("success", "Asistencia guardada correctamente");
    } catch (e) {
      flash("error", "Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  };

  // Crear Curso
  const createCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModulo || !newCursoNombre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cursos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          modulo_id: selectedModulo.id, 
          nombre: newCursoNombre, 
          orden: cursos.length + 1,
          creditos: newCursoCreditos,
          docente_id: docenteId ? docenteId : (newCursoDocenteId || null)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando curso");
      flash("success", "Curso creado");
      setShowNewCurso(false);
      setNewCursoNombre("");
      setNewCursoCreditos(1);
      setNewCursoDocenteId("");
      await loadCursos(selectedModulo.id);
      setSelectedCursoId(data.id);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Editar Curso
  const updateCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCursoId || !editCursoNombre.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cursos/${editCursoId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: editCursoNombre, 
          creditos: editCursoCreditos,
          docente_id: docenteId ? docenteId : (editCursoDocenteId || null)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error editando curso");
      flash("success", "Curso actualizado");
      setShowEditCurso(false);
      await loadCursos(selectedModulo!.id);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Guardar Notas
  const saveNotas = async () => {
    if (!selectedCursoId) return;
    setSaving(true);
    try {
      const promises = matriculas.map(async (m) => {
        const strNota = notasMap[m.id];
        const numNota = strNota && strNota.trim() !== "" ? parseFloat(strNota) : null;
        if (numNota !== null && (isNaN(numNota) || numNota < 0 || numNota > 20)) return;
        await fetch("/api/notas-cursos", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matricula_id: m.id, curso_id: selectedCursoId, nota: numNota })
        });
      });
      await Promise.all(promises);
      flash("success", "Notas guardadas correctamente");
    } catch (e) {
      flash("error", "Error al guardar notas");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedModulo) {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <AlertDialog open={alertInfo.open} type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(p => ({...p, open: false}))} />
        <div style={{ ...cardStyle, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", marginBottom: 4 }}>Panel Docente</h2>
            <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)", margin: 0 }}>
              {docenteId ? "Seleccione un curso para registrar asistencia y notas." : "Seleccione un módulo para registrar asistencia y notas."}
            </p>
          </div>
          {/* Buscador */}
          <div style={{ position: "relative", width: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,.5)" }} />
            <input
              type="text"
              placeholder={docenteId ? "Buscar curso o carrera…" : "Buscar módulo o carrera…"}
              style={{ ...inpStyle, paddingLeft: 38, fontSize: 13 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#4ab3d8" }}>
            {docenteId ? "Cargando cursos..." : "Cargando módulos..."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {docenteId ? (
              cursosDocente
                .filter(c => {
                  const m = c.modulos;
                  return !m || new Date().toLocaleDateString('sv-SE') <= m.fecha_fin;
                })
                .filter(c => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  const m = c.modulos || {};
                  return c.nombre.toLowerCase().includes(q) || (m.nombre || "").toLowerCase().includes(q) || (m.carreras?.nombre || "").toLowerCase().includes(q);
                })
                .map(c => {
                  const m = c.modulos || {};
                  const isFinished = new Date().toLocaleDateString('sv-SE') > m.fecha_fin;
                  return (
                    <div key={c.id} style={{ ...cardStyle, padding: 20, cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column", gap: 10 }} 
                         onClick={() => {
                           setSelectedModulo(m);
                           setSelectedCursoId(c.id);
                         }}
                         onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(74,179,216,0.5)"}
                         onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(42,109,181,0.18)"}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(74,179,216,0.15)", color: "#4ab3d8", fontWeight: 600 }}>{m.modalidad}</span>
                          <span style={{ 
                            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.5,
                            background: isFinished ? "rgba(148,163,184,0.15)" : "rgba(52,211,153,0.15)",
                            color: isFinished ? "#94a3b8" : "#34d399"
                          }}>
                            {isFinished ? "FINALIZADO" : "EN CURSO"}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ReporteModuloBtn moduloId={m.id} />
                        </div>
                      </div>
                      
                      <div>
                        {m.carreras && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={carreraBadgeStyle(m.carreras.nombre)}>
                              {m.carreras.nombre}
                            </span>
                          </div>
                        )}
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(42,109,181,0.18)", border: "1px solid rgba(42,109,181,0.3)", color: "rgba(120,160,210,0.9)", fontWeight: 600 }}>
                            Módulo: {m.nombre}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#dbeafe", margin: 0, lineHeight: 1.3 }}>{c.nombre}</h3>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "rgba(120,160,210,0.7)", marginTop: "auto", paddingTop: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} style={{ color: "rgba(74,179,216,0.5)", flexShrink: 0 }} /> {m.fecha_inicio} al {m.fecha_fin}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={12} style={{ color: "rgba(74,179,216,0.5)", flexShrink: 0 }} /> Créditos: {c.creditos || 1} CR</div>
                      </div>
                    </div>
                  );
                })
            ) : (
              modulos
                .filter(m => !docenteId || new Date().toLocaleDateString('sv-SE') <= m.fecha_fin)
                .filter(m => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return m.nombre.toLowerCase().includes(q) || (m.carreras?.nombre || "").toLowerCase().includes(q);
                })
                .map(m => {
                  const isFinished = new Date().toLocaleDateString('sv-SE') > m.fecha_fin;
                  return (
                    <div key={m.id} style={{ ...cardStyle, padding: 20, cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column", gap: 10 }} 
                         onClick={() => setSelectedModulo(m)}
                         onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(74,179,216,0.5)"}
                         onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(42,109,181,0.18)"}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(74,179,216,0.15)", color: "#4ab3d8", fontWeight: 600 }}>{m.modalidad}</span>
                          <span style={{ 
                            fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: 0.5,
                            background: isFinished ? "rgba(148,163,184,0.15)" : "rgba(52,211,153,0.15)",
                            color: isFinished ? "#94a3b8" : "#34d399"
                          }}>
                            {isFinished ? "FINALIZADO" : "EN CURSO"}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ReporteModuloBtn moduloId={m.id} />
                        </div>
                      </div>
                      
                      <div>
                        {m.carreras && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={carreraBadgeStyle(m.carreras.nombre)}>
                              {m.carreras.nombre}
                            </span>
                          </div>
                        )}
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#dbeafe", margin: 0, lineHeight: 1.3 }}>{m.nombre}</h3>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "rgba(120,160,210,0.7)", marginTop: "auto", paddingTop: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} style={{ color: "rgba(74,179,216,0.5)", flexShrink: 0 }} /> {m.fecha_inicio} al {m.fecha_fin}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={12} style={{ color: "rgba(74,179,216,0.5)", flexShrink: 0 }} /> {m.profesor || "Docente no asignado"}</div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ts-docente-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-left: 36px;
          margin-top: 8px;
          gap: 16px;
        }
        .ts-tabs-container {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          margin-left: 38px;
          border-bottom: 1px solid rgba(42,109,181,0.2);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .ts-tabs-container::-webkit-scrollbar {
          display: none;
        }
        .ts-docente-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ts-docente-actions-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ts-docente-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        @media (max-width: 768px) {
          .ts-docente-header {
            flex-direction: column;
            align-items: flex-start;
            margin-left: 0;
          }
          .ts-docente-header button {
            width: 100%;
            justify-content: center;
          }
          .ts-tabs-container {
            margin-left: 0;
          }
          .ts-docente-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .ts-docente-actions button {
            width: 100%;
            justify-content: center;
          }
          .ts-docente-actions-left {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .ts-docente-actions-left select {
            width: 100% !important;
          }
          .ts-docente-actions-left input {
            width: 100% !important;
          }
          .ts-docente-table {
            min-width: 500px;
          }
        }
      `}} />
      <AlertDialog open={alertInfo.open} type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(p => ({...p, open: false}))} />
      
      {/* Header Módulo */}
      <div style={{ ...cardStyle, padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button onClick={() => setSelectedModulo(null)} style={{ background: "rgba(42,109,181,0.1)", border: "1px solid rgba(42,109,181,0.2)", borderRadius: 8, padding: 6, color: "rgba(120,160,210,0.8)", cursor: "pointer" }}>
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", margin: 0 }}>
            {docenteId ? (
              <>
                {cursos.find(c => c.id === selectedCursoId)?.nombre || "Cargando..."}
                <span style={{ fontSize: 13, color: "rgba(74,179,216,0.75)", marginLeft: 10, fontWeight: 600 }}>
                  (Módulo: {selectedModulo.nombre})
                </span>
              </>
            ) : (
              selectedModulo.nombre
            )}
          </h2>
        </div>
        <div className="ts-docente-header">
          <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: "wrap", fontSize: 12, color: "rgba(120,160,210,0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ 
                padding: "3px 10px", borderRadius: 12, fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
                background: new Date().toLocaleDateString('sv-SE') > selectedModulo.fecha_fin ? "rgba(148,163,184,0.15)" : "rgba(52,211,153,0.15)",
                color: new Date().toLocaleDateString('sv-SE') > selectedModulo.fecha_fin ? "#94a3b8" : "#34d399"
              }}>
                {new Date().toLocaleDateString('sv-SE') > selectedModulo.fecha_fin ? "FINALIZADO" : "EN CURSO"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={13} style={{ color: "#4ab3d8" }} /> {selectedModulo.fecha_inicio} al {selectedModulo.fecha_fin}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={13} style={{ color: "#4ab3d8" }} /> Prof. {selectedModulo.profesor || "No asignado"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>• {selectedModulo.modalidad}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>• {matriculas.length} alumnos</div>
          </div>
          <ReporteModuloBtn moduloId={selectedModulo.id} text="Descargar Reporte" />
        </div>

        {/* Tabs */}
        <div className="ts-tabs-container">
          <button 
            style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: tab === "asistencia" ? "2px solid #4ab3d8" : "2px solid transparent", color: tab === "asistencia" ? "#dbeafe" : "rgba(120,160,210,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
            onClick={() => setTab("asistencia")}
          >
            Asistencia
          </button>
          <button 
            style={{ padding: "10px 20px", background: "transparent", border: "none", borderBottom: tab === "notas" ? "2px solid #4ab3d8" : "2px solid transparent", color: tab === "notas" ? "#dbeafe" : "rgba(120,160,210,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
            onClick={() => setTab("notas")}
          >
            Notas por Curso
          </button>
        </div>
      </div>

      {tab === "asistencia" && (
        <div style={{ ...cardStyle, padding: "24px 28px" }}>
          <div className="ts-docente-actions">
            <div className="ts-docente-actions-left">
              {docenteId && (
                <span style={{ fontSize: 13, fontWeight: 700, color: "#4ab3d8", marginRight: 15 }}>
                  Curso: {cursos.find(c => c.id === selectedCursoId)?.nombre || "Cargando..."}
                </span>
              )}
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(74,179,216,0.8)", textTransform: "uppercase" }}>Fecha:</label>
              <input type="date" style={{ ...inpStyle, width: 160, height: 36 }} value={fechaAsistencia} onChange={e => setFechaAsistencia(e.target.value)} />
            </div>
            <button style={btnPrimary} onClick={saveAsistencia} disabled={saving}>
              <Save size={14} /> {saving ? "Guardando..." : "Guardar Asistencia"}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="ts-docente-table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.2)" }}>
                  <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase" }}>N°</th>
                  <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase" }}>Alumno</th>
                  <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase", textAlign: "center" }}>Asistió</th>
                  <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase" }}>Observación</th>
                </tr>
              </thead>
              <tbody>
                {matriculas.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid rgba(42,109,181,0.1)" }}>
                    <td style={{ padding: "12px", fontSize: 12, color: "rgba(120,160,210,0.7)" }}>{i + 1}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>{m.alumnos.apellidos}, {m.alumnos.nombres}</div>
                      <div style={{ fontSize: 11, color: "rgba(120,160,210,0.6)" }}>DNI: {m.alumnos.dni}</div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div 
                        style={{ display: "inline-flex", cursor: "pointer", color: asistenciasMap[m.id] ? "#34d399" : "rgba(120,160,210,0.3)" }}
                        onClick={() => setAsistenciasMap(p => ({ ...p, [m.id]: !p[m.id] }))}
                      >
                        {asistenciasMap[m.id] ? <CheckSquare size={24} /> : <Square size={24} />}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <input 
                        type="text" 
                        placeholder="Nota o motivo..." 
                        style={{ ...inpStyle, height: 32, fontSize: 12 }} 
                        value={observacionesMap[m.id] || ""}
                        onChange={(e) => setObservacionesMap(p => ({ ...p, [m.id]: e.target.value }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "notas" && (
        <div style={{ ...cardStyle, padding: "24px 28px" }}>
          <div className="ts-docente-actions">
            <div className="ts-docente-actions-left">
              <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(74,179,216,0.8)", textTransform: "uppercase" }}>Curso:</label>
              {docenteId ? (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#4ab3d8" }}>
                  {cursos.find(c => c.id === selectedCursoId)?.nombre || "Cargando..."}
                </span>
              ) : (
                cursos.length === 0 ? (
                  <span style={{ fontSize: 12, color: "rgba(248,113,113,0.8)" }}>No hay cursos creados.</span>
                ) : (
                  <select style={{ ...inpStyle, width: 260, height: 36 }} value={selectedCursoId} onChange={e => setSelectedCursoId(e.target.value)}>
                    {cursos.map(c => {
                      const docName = (c as any).docentes ? ` - ${((c as any).docentes.nombres || "").split(" ")[0]} ${((c as any).docentes.apellidos || "").split(" ")[0]}` : "";
                      return <option key={c.id} value={c.id}>{c.nombre} ({c.creditos || 1} CR){docName}</option>;
                    })}
                  </select>
                )
              )}
              {!docenteId && (
                <>
                  <button 
                    style={{ ...btnSecondary, height: 36, marginLeft: 10 }} 
                    onClick={() => {
                      setNewCursoNombre("");
                      setNewCursoCreditos(1);
                      setShowNewCurso(true);
                    }}
                  >
                    <Plus size={14} /> Nuevo Curso
                  </button>
                  {cursos.length > 0 && (
                    <button 
                      style={{ ...btnSecondary, height: 36, marginLeft: 5 }} 
                      onClick={() => {
                        const currentCurso = cursos.find(c => c.id === selectedCursoId);
                        if (currentCurso) {
                          setEditCursoId(currentCurso.id);
                          setEditCursoNombre(currentCurso.nombre);
                          setEditCursoCreditos(currentCurso.creditos || 1);
                          setEditCursoDocenteId((currentCurso as any).docente_id || "");
                          setShowEditCurso(true);
                        }
                      }}
                    >
                      <Edit size={14} /> Editar Curso
                    </button>
                  )}
                </>
              )}
            </div>
            
            {cursos.length > 0 && (
              <button style={btnPrimary} onClick={saveNotas} disabled={saving}>
                <Save size={14} /> {saving ? "Guardando..." : "Guardar Notas"}
              </button>
            )}
          </div>

          {cursos.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table className="ts-docente-table">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.2)" }}>
                    <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase" }}>N°</th>
                    <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase" }}>Alumno</th>
                    <th style={{ padding: "12px", fontSize: 11, color: "rgba(74,179,216,0.6)", textTransform: "uppercase", width: 150 }}>Nota (0-20)</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid rgba(42,109,181,0.1)" }}>
                      <td style={{ padding: "12px", fontSize: 12, color: "rgba(120,160,210,0.7)" }}>{i + 1}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>{m.alumnos.apellidos}, {m.alumnos.nombres}</div>
                        <div style={{ fontSize: 11, color: "rgba(120,160,210,0.6)" }}>DNI: {m.alumnos.dni}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input 
                          type="number" 
                          min={0} max={20} step={1}
                          placeholder="—"
                          style={{ ...inpStyle, width: 80, height: 32, textAlign: "center", fontSize: 14, fontWeight: 700, color: notasMap[m.id] && parseFloat(notasMap[m.id]) >= 13 ? "#34d399" : notasMap[m.id] && parseFloat(notasMap[m.id]) < 13 ? "#f87171" : "#dbeafe" }} 
                          value={notasMap[m.id] ?? ""}
                          onChange={(e) => setNotasMap(p => ({ ...p, [m.id]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Nuevo Curso */}
      <Modal open={showNewCurso} onClose={() => setShowNewCurso(false)} title="Crear Nuevo Curso" maxWidth="400px">
        <form onSubmit={createCurso}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Nombre del Curso *</label>
            <input 
              style={inpStyle} 
              autoFocus
              placeholder="Ej: Mantenimiento I" 
              value={newCursoNombre} 
              onChange={e => setNewCursoNombre(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Créditos *</label>
            <input 
              type="number"
              min={1}
              style={inpStyle} 
              placeholder="Ej: 3" 
              value={newCursoCreditos} 
              onChange={e => setNewCursoCreditos(Number(e.target.value))} 
              required 
            />
          </div>
          {!docenteId && (
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Docente Asignado</label>
              <div style={{ position: "relative" }}>
                <select 
                  style={inpStyle} 
                  value={newCursoDocenteId} 
                  onChange={e => setNewCursoDocenteId(e.target.value)}
                >
                  <option value="">Sin docente</option>
                  {docentes.map(d => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" style={btnSecondary} onClick={() => setShowNewCurso(false)}>Cancelar</button>
            <button type="submit" style={btnPrimary} disabled={saving}>Crear Curso</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Curso */}
      <Modal open={showEditCurso} onClose={() => setShowEditCurso(false)} title="Editar Curso" maxWidth="400px">
        <form onSubmit={updateCurso}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Nombre del Curso *</label>
            <input 
              style={inpStyle} 
              autoFocus
              placeholder="Ej: Mantenimiento I" 
              value={editCursoNombre} 
              onChange={e => setEditCursoNombre(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Créditos *</label>
            <input 
              type="number"
              min={1}
              style={inpStyle} 
              placeholder="Ej: 3" 
              value={editCursoCreditos} 
              onChange={e => setEditCursoCreditos(Number(e.target.value))} 
              required 
            />
          </div>
          {!docenteId && (
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.7)", marginBottom: 6, textTransform: "uppercase" }}>Docente Asignado</label>
              <div style={{ position: "relative" }}>
                <select 
                  style={inpStyle} 
                  value={editCursoDocenteId} 
                  onChange={e => setEditCursoDocenteId(e.target.value)}
                >
                  <option value="">Sin docente</option>
                  {docentes.map(d => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" style={btnSecondary} onClick={() => setShowEditCurso(false)}>Cancelar</button>
            <button type="submit" style={btnPrimary} disabled={saving}>Guardar Cambios</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
