"use client";
import { useState, useEffect } from "react";
import { Cpu, Plus, X, ChevronDown, Calendar, Clock, GraduationCap, MapPin, User, Pencil, Trash2, Layers, Users, ChevronLeft } from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import AlertDialog from "./AlertDialog";
import ReporteAsistenciaBtn from "./ReporteAsistenciaBtn";
import ReporteMatriculaBtn from "./ReporteMatriculaBtn";
import ReporteModuloBtn from "./ReporteModuloBtn";

interface Carrera { id: string; nombre: string; }
interface Curso { id: string; nombre: string; orden: number; }
interface Modulo {
  id: string; nombre: string; fecha_inicio: string; fecha_fin: string;
  modalidad: "presencial" | "virtual" | "semipresencial"; duracion?: string | null;
  carrera_id?: string | null; profesor?: string | null;
  local?: string | null; aula?: string | null; horario?: string | null;
  carreras?: Carrera | null; cursos?: Curso[];
  docente_id?: string | null;
}

const MODULOS_POR_CARRERA: Record<string, string[]> = {
  "Construcción Civil": ["Topografía Aplicada", "Lectura de Planos", "Materiales de Construcción", "Suelos y Concreto", "Costos y Presupuestos", "Módulo I"],
  "Topografía": ["Dibujo Topográfico", "Estación Total", "Geodesia", "GPS Diferencial", "Fotogrametría", "Módulo I"],
  "Maquinaria Pesada": ["Cargador Frontal", "Excavadora Hidráulica", "Motoniveladora", "Tractor de Orugas", "Retroexcavadora", "Módulo I"],
  "Administración": ["Administración General", "Contabilidad Básica", "Recursos Humanos", "Marketing", "Logística", "Módulo I"],
  "Sistemas": ["Ofimática", "Programación Básica", "Redes y Conectividad", "Soporte Técnico", "Diseño Web", "Módulo I"],
  "default": ["Módulo I", "Módulo II", "Módulo III", "Módulo IV", "Módulo V"],
};

const card: React.CSSProperties = { background: "rgba(8,16,34,0.85)", border: "1px solid rgba(42,109,181,0.18)", borderRadius: 14, backdropFilter: "blur(12px)" };
const inp: React.CSSProperties = { width: "100%", height: 44, boxSizing: "border-box", background: "rgba(10,22,44,0.7)", border: "1px solid rgba(42,109,181,0.22)", borderRadius: 10, padding: "0 14px", color: "#dbeafe", fontSize: 13, fontFamily: "inherit", outline: "none" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.75)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 };
const btnP: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "none", background: "#a2a1a1ff", color: "#0d0d0dff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" };
const btnS: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: "rgba(178, 181, 183, 0.1)", border: "1px solid rgba(42,109,181,0.22)", color: "rgba(120,160,210,0.85)", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" };

const MODALIDAD_COLORS: Record<string, string> = {
  presencial: "rgba(52,211,153,0.15)",
  virtual: "rgba(251,191,36,0.15)",
  semipresencial: "rgba(139,92,246,0.15)",
};
const MODALIDAD_TEXT: Record<string, string> = {
  presencial: "#34d399", virtual: "#fbbf24", semipresencial: "#a78bfa",
};

const emptyForm = {
  nombre: "", fecha_inicio: "", fecha_fin: "", modalidad: "presencial" as Modulo["modalidad"],
  duracion: "", carrera_id: "", profesor: "", local: "SEDE CENTRAL", aula: "", horario: ""
};

export default function ModulosView({
  onNavigate,
  carreraId,
  carreraNombre,
  onBack
}: {
  onNavigate?: (view: string) => void;
  carreraId?: string;
  carreraNombre?: string;
  onBack?: () => void;
}) {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const currentCarreraNombre = carreraNombre || carreras.find(c => c.id === carreraId)?.nombre || "";
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Modulo | null>(null);
  const [delTarget, setDelTarget] = useState<Modulo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ open: boolean; type: "success" | "error"; text: string }>({ open: false, type: "success", text: "" });
  const [form, setForm] = useState({
    ...emptyForm,
    carrera_id: carreraId || ""
  });
  const [filterStatus, setFilterStatus] = useState("");

  const [viewingAlumnos, setViewingAlumnos] = useState<Modulo | null>(null);
  const [alumnosMatriculados, setAlumnosMatriculados] = useState<any[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);

  // Estados de Cursos y Docentes
  const [cursosModulo, setCursosModulo] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [showCursoForm, setShowCursoForm] = useState(false);
  const [editCursoTarget, setEditCursoTarget] = useState<any | null>(null);
  const [delCursoTarget, setDelCursoTarget] = useState<any | null>(null);

  // Formulario del Curso
  const [cursoNombre, setCursoNombre] = useState("");
  const [cursoCreditos, setCursoCreditos] = useState(1);
  const [cursoOrden, setCursoOrden] = useState(1);
  const [cursoDocenteId, setCursoDocenteId] = useState("");
  const [cursoDescripcion, setCursoDescripcion] = useState("");
  const [submittingCurso, setSubmittingCurso] = useState(false);

  // Asistencias específicas por curso
  const [activeAsistenciaCurso, setActiveAsistenciaCurso] = useState<any | null>(null);
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toLocaleDateString('sv-SE'));
  const [asistenciasMap, setAsistenciasMap] = useState<Record<string, boolean>>({});
  const [observacionesMap, setObservacionesMap] = useState<Record<string, string>>({});
  const [savingAsistencia, setSavingAsistencia] = useState(false);

  useEffect(() => { loadCarreras(); loadModulos(); }, [carreraId]);

  async function loadModulos() {
    setLoading(true);
    const url = carreraId ? `/api/modulos?carrera_id=${carreraId}` : "/api/modulos";
    const res = await fetch(url);
    const data = await res.json();
    setModulos(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadCarreras() {
    const res = await fetch("/api/carreras");
    const data = await res.json();
    setCarreras(Array.isArray(data) ? data : []);
  }

  function flash(type: "success" | "error", text: string) { setMsg({ open: true, type, text }); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const payload = {
      nombre: form.nombre,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      modalidad: form.modalidad,
      duracion: form.duracion || null,
      carrera_id: form.carrera_id || null,
      profesor: form.profesor || null,
      local: form.local || null,
      aula: form.aula || null,
      horario: form.horario || null,
    };
    const res = await fetch("/api/modulos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json(); setSubmitting(false);
    if (!res.ok) { flash("error", data.error); return; }
    flash("success", `Módulo "${data.nombre}" creado`);
    setForm({ ...emptyForm, carrera_id: carreraId || "" }); setShowForm(false);
    loadModulos();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editTarget) return; setSubmitting(true);
    const payload = {
      nombre: form.nombre,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      modalidad: form.modalidad,
      duracion: form.duracion || null,
      carrera_id: form.carrera_id || null,
      profesor: form.profesor || null,
      local: form.local || null,
      aula: form.aula || null,
      horario: form.horario || null,
    };
    const res = await fetch(`/api/modulos/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json(); setSubmitting(false);
    if (!res.ok) { flash("error", data.error); return; }
    flash("success", `Módulo "${data.nombre}" actualizado`);
    setEditTarget(null); loadModulos();
  }

  async function handleDelete() {
    if (!delTarget) return; setSubmitting(true);
    const res = await fetch(`/api/modulos/${delTarget.id}`, { method: "DELETE" });
    setSubmitting(false);
    if (!res.ok) { flash("error", "Error al eliminar"); return; }
    flash("success", `Módulo "${delTarget.nombre}" eliminado`);
    setDelTarget(null); loadModulos();
  }

  function openEdit(m: Modulo) {
    setEditTarget(m);
    setForm({ nombre: m.nombre, fecha_inicio: m.fecha_inicio, fecha_fin: m.fecha_fin, modalidad: m.modalidad, duracion: m.duracion ?? "", carrera_id: m.carrera_id ?? "", profesor: m.profesor ?? "", local: m.local ?? "", aula: m.aula ?? "", horario: m.horario ?? "" });
    setShowForm(false);
  }

  // Obtener sugerencias según carrera seleccionada
  const selectedCarreraName = carreras.find(c => c.id === form.carrera_id)?.nombre || "";
  const sugerencias = MODULOS_POR_CARRERA[selectedCarreraName] || MODULOS_POR_CARRERA["default"];

  async function loadCursosModulo(moduloId: string) {
    setLoadingCursos(true);
    try {
      const res = await fetch(`/api/cursos?modulo_id=${moduloId}`);
      const data = await res.json();
      setCursosModulo(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCursos(false);
    }
  }

  async function loadDocentes() {
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      setDocentes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAlumnosModulo(m: Modulo) {
    setViewingAlumnos(m);
    setLoadingAlumnos(true);
    try {
      const resMat = await fetch(`/api/matriculas?modulo_id=${m.id}`);
      const dataMat = await resMat.json();
      setAlumnosMatriculados(Array.isArray(dataMat) ? dataMat : []);
      
      await Promise.all([
        loadCursosModulo(m.id),
        loadDocentes()
      ]);
    } catch (err) {
      flash("error", "Error al cargar los datos del módulo");
    } finally {
      setLoadingAlumnos(false);
    }
  }

  async function handleCreateCurso(e: React.FormEvent) {
    e.preventDefault();
    if (!viewingAlumnos) return;
    if (!cursoNombre.trim()) {
      flash("error", "El nombre del curso es requerido");
      return;
    }
    setSubmittingCurso(true);
    try {
      const payload = {
        modulo_id: viewingAlumnos.id,
        nombre: cursoNombre.trim(),
        creditos: Number(cursoCreditos),
        orden: Number(cursoOrden),
        docente_id: cursoDocenteId || null,
        descripcion: cursoDescripcion || null
      };
      const res = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el curso");
      flash("success", `Curso "${data.nombre}" creado exitosamente`);
      setShowCursoForm(false);
      resetCursoForm();
      loadCursosModulo(viewingAlumnos.id);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmittingCurso(false);
    }
  }

  async function handleEditCurso(e: React.FormEvent) {
    e.preventDefault();
    if (!viewingAlumnos || !editCursoTarget) return;
    if (!cursoNombre.trim()) {
      flash("error", "El nombre del curso es requerido");
      return;
    }
    setSubmittingCurso(true);
    try {
      const payload = {
        nombre: cursoNombre.trim(),
        creditos: Number(cursoCreditos),
        orden: Number(cursoOrden),
        docente_id: cursoDocenteId || null,
        descripcion: cursoDescripcion || null
      };
      const res = await fetch(`/api/cursos/${editCursoTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar el curso");
      flash("success", `Curso "${data.nombre}" actualizado exitosamente`);
      setEditCursoTarget(null);
      resetCursoForm();
      loadCursosModulo(viewingAlumnos.id);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmittingCurso(false);
    }
  }

  async function handleDeleteCurso() {
    if (!viewingAlumnos || !delCursoTarget) return;
    setSubmittingCurso(true);
    try {
      const res = await fetch(`/api/cursos/${delCursoTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar el curso");
      }
      flash("success", "Curso eliminado correctamente");
      setDelCursoTarget(null);
      loadCursosModulo(viewingAlumnos.id);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmittingCurso(false);
    }
  }

  function resetCursoForm() {
    setCursoNombre("");
    setCursoCreditos(1);
    setCursoOrden(1);
    setCursoDocenteId("");
    setCursoDescripcion("");
  }

  function openEditCurso(c: any) {
    setEditCursoTarget(c);
    setCursoNombre(c.nombre);
    setCursoCreditos(c.creditos || 1);
    setCursoOrden(c.orden || 1);
    setCursoDocenteId(c.docente_id || "");
    setCursoDescripcion(c.descripcion || "");
    setShowCursoForm(true);
  }

  async function loadAsistenciaCurso(cursoId: string, moduloId: string, fechaStr: string) {
    try {
      const res = await fetch(`/api/asistencias?curso_id=${cursoId}&modulo_id=${moduloId}&fecha=${fechaStr}`);
      const data = await res.json();
      const newAsis: Record<string, boolean> = {};
      const newObs: Record<string, string> = {};
      
      alumnosMatriculados.forEach(m => {
        newAsis[m.id] = true;
        newObs[m.id] = "";
      });

      if (Array.isArray(data)) {
        data.forEach(item => {
          newAsis[item.matricula_id] = item.estado === "presente" || item.estado === "tardanza";
          newObs[item.matricula_id] = item.observacion || "";
        });
      }
      setAsistenciasMap(newAsis);
      setObservacionesMap(newObs);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (activeAsistenciaCurso && viewingAlumnos) {
      loadAsistenciaCurso(activeAsistenciaCurso.id, viewingAlumnos.id, fechaAsistencia);
    }
  }, [activeAsistenciaCurso, fechaAsistencia]);

  async function handleSaveAsistencia() {
    if (!viewingAlumnos || !activeAsistenciaCurso) return;
    setSavingAsistencia(true);
    try {
      const promises = alumnosMatriculados.map(m => {
        const isPresent = asistenciasMap[m.id];
        const payload = {
          matricula_id: m.id,
          modulo_id: viewingAlumnos.id,
          curso_id: activeAsistenciaCurso.id,
          fecha: fechaAsistencia,
          estado: isPresent ? "presente" : "falta",
          observacion: observacionesMap[m.id] || null
        };
        return fetch("/api/asistencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      });
      await Promise.all(promises);
      flash("success", "Asistencia del curso guardada correctamente");
      setActiveAsistenciaCurso(null);
    } catch (e) {
      flash("error", "Error al guardar asistencia");
    } finally {
      setSavingAsistencia(false);
    }
  }

  function getStatus(m: Modulo) {
    const now = new Date(), s = new Date(m.fecha_inicio), e = new Date(m.fecha_fin);
    if (now < s) return { label: "Próximo", color: "#fbbf24" };
    if (now > e) return { label: "Concluido", color: "#94a3b8" };
    return { label: "En curso", color: "#34d399" };
  }

  const isFormOpen = showForm || !!editTarget;

  if (viewingAlumnos) {
    return (
      <div className="ts-viewing-alumnos-container" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .ts-viewing-alumnos-layout {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 20px;
          }
          @media (max-width: 1024px) {
            .ts-viewing-alumnos-layout {
              grid-template-columns: 1fr !important;
            }
          }
          .ts-btn-back:hover { background: #f1f5f9!important; transform: translateY(-1px); }
          .ts-btn-back:active { transform: translateY(0); }
        `}} />
        {/* Header */}
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <button
                  onClick={() => setViewingAlumnos(null)}
                  className="ts-btn-back"
                  style={{ background: "#ffffff", border: "none", borderRadius: 10, padding: "8px 14px", color: "#0f172a", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "background .2s, transform .15s" }}
                >
                  <ChevronLeft size={15} style={{ strokeWidth: 2.5 }} />
                  <span>Regresar</span>
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", margin: 0 }}>Alumnos Matriculados</h2>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 16 }}>
                <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)", margin: 0 }}>Módulo: <strong style={{ color: "#4ab3d8" }}>{viewingAlumnos.nombre}</strong></p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ReporteModuloBtn moduloId={viewingAlumnos.id} text="Registro de Notas" style={{ height: 28 }} />
                  {onNavigate && (
                    <button onClick={() => onNavigate("docentes")} style={{ ...btnS, padding: "6px 12px", fontSize: 12, height: 28 }}>
                      <GraduationCap size={14} /> Ir a Registro Docente
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout de dos columnas */}
        <div className="ts-viewing-alumnos-layout">
          {/* Columna Izquierda: Listado de Alumnos */}
          <div style={{ ...card, overflow: "hidden" }}>
            {loadingAlumnos ? (
              <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.5)" }}>Cargando alumnos...</div>
            ) : alumnosMatriculados.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
                <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No hay alumnos matriculados en este módulo</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="ts-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.14)" }}>
                      {["#", "DNI", "Apellidos y Nombres", "Celular", "Turno", "Fecha Matrícula", ""].map((h, i) => (
                        <th key={i} style={{ padding: "12px 16px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", textAlign: h === "" ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosMatriculados.map((mat, idx) => (
                      <tr key={mat.id} style={{ borderBottom: "1px solid rgba(42,109,181,0.08)" }}>
                        <td style={{ padding: "12px 16px", color: "rgba(74,179,216,0.4)", fontSize: 11 }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, padding: "3px 8px", borderRadius: 5, background: "rgba(42,109,181,0.12)", border: "1px solid rgba(42,109,181,0.2)", color: "#7cc8e8" }}>
                            {mat.alumnos?.dni}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, color: "#dbeafe" }}>{mat.alumnos?.apellidos}</div>
                          <div style={{ color: "rgba(180,210,240,0.7)", fontSize: 12 }}>{mat.alumnos?.nombres}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "rgba(180,210,240,0.8)" }}>{mat.alumnos?.celular || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "rgba(180,210,240,0.8)", textTransform: "capitalize" }}>{mat.turno?.replace(/_/g, " ")}</td>
                        <td style={{ padding: "12px 16px", color: "rgba(180,210,240,0.6)", fontSize: 12 }}>{mat.fecha_registro}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <ReporteMatriculaBtn matriculaId={mat.id} label="Constancia" />
                            <ReporteAsistenciaBtn matriculaId={mat.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Columna Derecha: Cursos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ ...card, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#dbeafe", margin: 0 }}>Cursos del Módulo</h3>
                <button 
                  style={{ ...btnS, padding: "5px 10px", fontSize: 11, height: 26, gap: 4 }}
                  onClick={() => { resetCursoForm(); setShowCursoForm(true); setEditCursoTarget(null); }}
                >
                  <Plus size={12} /> Nuevo Curso
                </button>
              </div>

              {loadingAlumnos ? (
                <div style={{ textAlign: "center", padding: 20, color: "rgba(74,179,216,0.5)", fontSize: 12 }}>Cargando cursos...</div>
              ) : cursosModulo.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "rgba(74,179,216,0.4)", fontSize: 12 }}>
                  No hay cursos creados en este módulo.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cursosModulo.map(c => {
                    const doc = c.docentes;
                    return (
                      <div key={c.id} style={{ padding: 12, background: "rgba(10,22,44,0.5)", border: "1px solid rgba(42,109,181,0.15)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontWeight: 700, color: "#dbeafe", fontSize: 13, lineHeight: 1.3 }}>
                            {c.nombre} <span style={{ fontSize: 10, color: "rgba(74,179,216,0.7)", fontWeight: 500 }}>({c.creditos || 1} CR)</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button
                              title="Editar Curso / Asignar Docente"
                              style={{ background: "transparent", border: "none", color: "rgba(74,179,216,0.6)", padding: 4, cursor: "pointer", transition: "color 0.2s" }}
                              onClick={() => openEditCurso(c)}
                              onMouseEnter={e => e.currentTarget.style.color = "#4ab3d8"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(74,179,216,0.6)"}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              title="Eliminar Curso"
                              style={{ background: "transparent", border: "none", color: "rgba(248,113,113,0.5)", padding: 4, cursor: "pointer", transition: "color 0.2s" }}
                              onClick={() => setDelCursoTarget(c)}
                              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(248,113,113,0.5)"}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <div style={{ fontSize: 11, color: doc ? "#34d399" : "#fbbf24", fontWeight: doc ? 600 : 500 }}>
                            {doc ? `Prof. ${doc.nombres.split(" ")[0]} ${doc.apellidos.split(" ")[0]}` : "Sin docente asignado"}
                          </div>
                          <button
                            style={{
                              background: "rgba(52,211,153,0.12)",
                              border: "1px solid rgba(52,211,153,0.25)",
                              color: "#34d399",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4
                            }}
                            onClick={() => {
                              setActiveAsistenciaCurso(c);
                              setFechaAsistencia(new Date().toLocaleDateString('sv-SE'));
                            }}
                          >
                            <Calendar size={11} /> Asistencia
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Crear / Editar Curso */}
        <Modal
          open={showCursoForm || !!editCursoTarget}
          onClose={() => { setShowCursoForm(false); setEditCursoTarget(null); resetCursoForm(); }}
          title={editCursoTarget ? "Editar Curso" : "Nuevo Curso"}
          maxWidth="450px"
        >
          <form onSubmit={editCursoTarget ? handleEditCurso : handleCreateCurso} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={lbl}>Nombre del Curso *</label>
              <input
                type="text"
                style={inp}
                className="md-inp"
                placeholder="Ej: Mantenimiento Preventivo"
                value={cursoNombre}
                onChange={e => setCursoNombre(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={lbl}>Créditos *</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  style={inp}
                  className="md-inp"
                  value={cursoCreditos}
                  onChange={e => setCursoCreditos(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label style={lbl}>Orden de visualización</label>
                <input
                  type="number"
                  min={1}
                  style={inp}
                  className="md-inp"
                  value={cursoOrden}
                  onChange={e => setCursoOrden(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label style={lbl}>Profesor Asignado (Maestro)</label>
              <select
                style={{ ...inp, cursor: "pointer" }}
                className="md-inp"
                value={cursoDocenteId}
                onChange={e => setCursoDocenteId(e.target.value)}
              >
                <option value="">-- Sin asignar --</option>
                {docentes.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.apellidos}, {d.nombres} {d.dni ? `(DNI: ${d.dni})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Descripción (opcional)</label>
              <textarea
                style={{ ...inp, height: 60, padding: "10px 14px", resize: "none" }}
                className="md-inp"
                placeholder="Breve descripción del curso..."
                value={cursoDescripcion}
                onChange={e => setCursoDescripcion(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid rgba(42,109,181,0.12)", paddingTop: 14 }}>
              <button
                type="button"
                style={btnS}
                onClick={() => { setShowCursoForm(false); setEditCursoTarget(null); resetCursoForm(); }}
                disabled={submittingCurso}
              >
                Cancelar
              </button>
              <button type="submit" style={btnP} className="cr-btn-p" disabled={submittingCurso}>
                {submittingCurso ? "Guardando..." : editCursoTarget ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Confirmar Eliminación del Curso */}
        <ConfirmDialog
          open={!!delCursoTarget}
          onClose={() => setDelCursoTarget(null)}
          onConfirm={handleDeleteCurso}
          loading={submittingCurso}
          title="¿Eliminar curso?"
          description="Esta acción eliminará el curso y todas sus calificaciones/asistencias. No se puede deshacer."
        >
          {delCursoTarget && (
            <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, marginTop: 8 }}>
              <div style={{ fontWeight: 700, color: "#f87171", fontSize: 13 }}>
                {delCursoTarget.nombre}
              </div>
              <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)", marginTop: 2 }}>
                Módulo: {viewingAlumnos?.nombre}
              </div>
            </div>
          )}
        </ConfirmDialog>

        {/* Modal: Registro de Asistencia del Curso */}
        <Modal
          open={!!activeAsistenciaCurso}
          onClose={() => setActiveAsistenciaCurso(null)}
          title={`Asistencia del Curso: ${activeAsistenciaCurso?.nombre || ""}`}
          maxWidth="650px"
        >
          {activeAsistenciaCurso && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "rgba(10,22,44,0.4)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(42,109,181,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(74,179,216,0.8)", textTransform: "uppercase" }}>Fecha:</span>
                  <input
                    type="date"
                    style={{ ...inp, width: 150, height: 32, fontSize: 12 }}
                    value={fechaAsistencia}
                    onChange={e => setFechaAsistencia(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: 11, color: "rgba(120,160,210,0.6)" }}>
                  Profesor: {activeAsistenciaCurso.docentes ? `${activeAsistenciaCurso.docentes.nombres} ${activeAsistenciaCurso.docentes.apellidos}` : "Sin docente asignado"}
                </span>
              </div>

              <div style={{ overflowY: "auto", maxHeight: "40vh", border: "1px solid rgba(42,109,181,0.12)", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "rgba(10,22,44,0.3)", borderBottom: "1px solid rgba(42,109,181,0.14)" }}>
                      <th style={{ padding: "8px 12px", color: "rgba(74,179,216,0.6)" }}>Alumno</th>
                      <th style={{ padding: "8px 12px", color: "rgba(74,179,216,0.6)", textAlign: "center" }}>Asistencia</th>
                      <th style={{ padding: "8px 12px", color: "rgba(74,179,216,0.6)" }}>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosMatriculados.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid rgba(42,109,181,0.08)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 700, color: "#dbeafe" }}>
                            {m.alumnos?.apellidos}, {m.alumnos?.nombres}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(120,160,210,0.5)" }}>
                            DNI: {m.alumnos?.dni}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <button
                            type="button"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: asistenciasMap[m.id] ? "#34d399" : "#f87171",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "4px 8px",
                              borderRadius: 6,
                              backgroundColor: asistenciasMap[m.id] ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"
                            }}
                            onClick={() => setAsistenciasMap(p => ({ ...p, [m.id]: !p[m.id] }))}
                          >
                            {asistenciasMap[m.id] ? "PRESENTE" : "FALTA"}
                          </button>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <input
                            type="text"
                            placeholder="Ninguna..."
                            style={{ ...inp, height: 28, fontSize: 11, padding: "0 8px" }}
                            value={observacionesMap[m.id] || ""}
                            onChange={e => setObservacionesMap(p => ({ ...p, [m.id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10, borderTop: "1px solid rgba(42,109,181,0.12)", paddingTop: 14 }}>
                <button
                  type="button"
                  style={btnS}
                  onClick={() => setActiveAsistenciaCurso(null)}
                  disabled={savingAsistencia}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  style={btnP}
                  className="cr-btn-p"
                  onClick={handleSaveAsistencia}
                  disabled={savingAsistencia}
                >
                  {savingAsistencia ? "Guardando..." : "Guardar Asistencia"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  const filteredModulos = modulos.filter(m => {
    if (!filterStatus) return true;
    return getStatus(m).label === filterStatus;
  });

  return (
    <div style={{ maxWidth: carreraId ? "none" : 1100, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .md-inp:focus{border-color:rgba(74,179,216,.55)!important;box-shadow:0 0 0 3px rgba(74,179,216,.1)!important;}
        .md-card:hover{border-color:rgba(74,179,216,.3)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4);}
        .md-action:hover{background:rgba(42,109,181,.15)!important;color:#4ab3d8!important;}
        .md-del:hover{background:rgba(248,113,113,.1)!important;color:#f87171!important;}
        .ts-btn-back:hover { background: #f1f5f9!important; transform: translateY(-1px); }
        .ts-btn-back:active { transform: translateY(0); }
      `}</style>

      {/* Header */}
      <div style={{ ...card, padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              {onBack && (
                <button
                  onClick={onBack}
                  className="ts-btn-back"
                  style={{ background: "#ffffff", border: "none", borderRadius: 10, padding: "8px 14px", color: "#0f172a", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, transition: "background .2s, transform .15s" }}
                >
                  <ChevronLeft size={15} style={{ strokeWidth: 2.5 }} />
                  <span>Regresar</span>
                </button>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", margin: 0 }}>
                {currentCarreraNombre ? `— ${currentCarreraNombre}` : ""}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)", marginTop: 4 }}>
              {currentCarreraNombre
                ? `Módulos académicos de la carrera ${currentCarreraNombre} con profesor y aula`
                : "Módulos académicos del instituto con profesor y aula"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Filtro por estado del módulo */}
            <div style={{ position: "relative" }}>
              <select className="md-inp" style={{ ...inp, paddingRight: 32, cursor: "pointer", height: 40, fontSize: 12 }} value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="Próximo">Próximo</option>
                <option value="En curso">En curso</option>
                <option value="Concluido">Concluido</option>
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(74,179,216,0.5)" }} />
            </div>
            <button style={btnP} onClick={() => { setShowForm(!showForm); setEditTarget(null); setForm({ ...emptyForm, carrera_id: carreraId || "" }); }}>
              <Plus size={14} /> Nuevo Módulo
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AlertDialog
        open={msg.open}
        onClose={() => setMsg(p => ({ ...p, open: false }))}
        message={msg.text}
        type={msg.type}
      />

      {/* Form */}
      <Modal
        open={isFormOpen}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget ? "Editar Módulo" : "Nuevo Módulo"}
        maxWidth="min(600px, 95vw)"
      >
        <form onSubmit={editTarget ? handleEdit : handleCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Nombre del Módulo *</label>
              <input className="md-inp" style={inp} list="mod-sug" placeholder="Ej: Cargador Frontal" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required />
              <datalist id="mod-sug">{sugerencias.map(n => <option key={n} value={n} />)}</datalist>
            </div>
            {!carreraId && (
              <div>
                <label style={lbl}>Carrera</label>
                <div style={{ position: "relative" }}>
                  <select className="md-inp" style={{ ...inp, paddingRight: 32, cursor: "pointer" }} value={form.carrera_id} onChange={e => setForm(p => ({ ...p, carrera_id: e.target.value }))}>
                    <option value="">Sin carrera</option>
                    {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(74,179,216,0.5)" }} />
                </div>
              </div>
            )}
            <div>
              <label style={lbl}>Modalidad *</label>
              <div style={{ position: "relative" }}>
                <select className="md-inp" style={{ ...inp, paddingRight: 32, cursor: "pointer" }} value={form.modalidad} onChange={e => setForm(p => ({ ...p, modalidad: e.target.value as Modulo["modalidad"] }))}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                  <option value="semipresencial">Semipresencial</option>
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(74,179,216,0.5)" }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Duración</label>
              <input className="md-inp" style={inp} type="text" placeholder="Ej: 120 horas, 4 semanas" value={form.duracion} onChange={e => setForm(p => ({ ...p, duracion: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Fecha Inicio *</label>
              <input className="md-inp" style={inp} type="date" value={form.fecha_inicio} onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Fecha Fin *</label>
              <input className="md-inp" style={inp} type="date" value={form.fecha_fin} onChange={e => setForm(p => ({ ...p, fecha_fin: e.target.value }))} required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Horario *</label>
              <input className="md-inp" style={inp} list="horario-sug" placeholder="Ej: Lunes a Viernes 8:00 AM - 12:00 PM" value={form.horario} onChange={e => setForm(p => ({ ...p, horario: e.target.value }))} required />
              <datalist id="horario-sug">
                <option value="Lunes a Viernes 8:00 AM - 12:00 PM" />
                <option value="Lunes a Viernes 2:00 PM - 6:00 PM" />
                <option value="Lunes a Viernes 6:00 PM - 10:00 PM" />
                <option value="Sábados y Domingos 8:00 AM - 1:00 PM" />
                <option value="Sábados y Domingos 2:00 PM - 7:00 PM" />
                <option value="Sábados 8:00 AM - 1:00 PM" />
                <option value="Sábados 2:00 PM - 7:00 PM" />
                <option value="Domingos 8:00 AM - 1:00 PM" />
                <option value="Domingos 2:00 PM - 7:00 PM" />
              </datalist>
            </div>
            {/* El docente ahora se asigna por curso individual, no por módulo */}

            <div>
              <label style={lbl}>Local</label>
              <input className="md-inp" style={inp} placeholder="Sede o local" value={form.local} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Aula</label>
              <input className="md-inp" style={inp} placeholder="Ej: Aula 3B" value={form.aula} onChange={e => setForm(p => ({ ...p, aula: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" style={btnS} onClick={() => { setShowForm(false); setEditTarget(null); }}>Cancelar</button>
            <button type="submit" style={btnP} disabled={submitting}>
              <Cpu size={14} /> {submitting ? "Guardando…" : editTarget ? "Actualizar Módulo" : "Crear Módulo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={submitting}
        title="¿Eliminar módulo?"
        description="Se eliminarán también los cursos y matrículas asociadas."
      >
        <p style={{ fontSize: 13, color: "rgba(120,160,210,0.7)" }}><strong style={{ color: "#4ab3d8" }}>{delTarget?.nombre}</strong></p>
      </ConfirmDialog>

      {/* Stats */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[
            { label: "Total", value: modulos.length, color: "#4ab3d8" },
            { label: "En Curso", value: modulos.filter(m => getStatus(m).label === "En curso").length, color: "#34d399" },
            { label: "Concluidos", value: modulos.filter(m => getStatus(m).label === "Concluido").length, color: "#94a3b8" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "18px 22px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(120,160,210,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 200, borderRadius: 14, background: "rgba(42,109,181,0.07)" }} />)}
        </div>
      ) : modulos.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
          <Cpu size={48} style={{ margin: "0 auto 12px", opacity: 0.2 }} /><p style={{ fontSize: 13 }}>No hay módulos registrados</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {filteredModulos.map(m => {
            const status = getStatus(m);
            return (
              <div key={m.id} className="md-card" style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 12, transition: "all .2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(6,182,212,0.2))", border: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Cpu size={16} style={{ color: "#60a5fa" }} />
                    </div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: MODALIDAD_COLORS[m.modalidad], color: MODALIDAD_TEXT[m.modalidad], fontWeight: 600 }}>{m.modalidad}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(42,109,181,0.1)", color: status.color, fontWeight: 600 }}>{status.label}</span>
                    {onNavigate && (
                      <button className="md-action" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(42,109,181,0.2)", background: "transparent", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }} onClick={() => onNavigate("docentes")} title="Ir a Panel Docente (Notas y Asistencia)"><GraduationCap size={12} /></button>
                    )}
                    <button className="md-action" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(42,109,181,0.2)", background: "transparent", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }} onClick={() => loadAlumnosModulo(m)} title="Ver Alumnos"><Users size={12} /></button>
                    <ReporteModuloBtn moduloId={m.id} style={{ width: 26, height: 26, borderRadius: 7 }} />
                    <button className="md-action" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(42,109,181,0.2)", background: "transparent", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }} onClick={() => openEdit(m)} title="Editar"><Pencil size={12} /></button>
                    <button className="md-del" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid transparent", background: "transparent", color: "rgba(248,113,113,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }} onClick={() => setDelTarget(m)} title="Eliminar"><Trash2 size={12} /></button>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#dbeafe", lineHeight: 1.3 }}>{m.nombre}</div>
                  {m.carreras && <div style={{ fontSize: 11, color: "rgba(74,179,216,0.6)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><GraduationCap size={10} />{m.carreras.nombre}</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11, color: "rgba(120,160,210,0.7)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={10} style={{ color: "rgba(74,179,216,0.4)", flexShrink: 0 }} />{m.fecha_inicio} → {m.fecha_fin}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={10} style={{ color: "rgba(74,179,216,0.4)", flexShrink: 0 }} />{m.duracion ? `${m.duracion} · ` : ""}{Math.round((new Date(m.fecha_fin).getTime() - new Date(m.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24))} días</div>
                  {m.profesor && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><User size={10} style={{ color: "rgba(74,179,216,0.4)", flexShrink: 0 }} />Prof. {m.profesor}</div>}
                  {m.horario && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={10} style={{ color: "rgba(74,179,216,0.4)", flexShrink: 0 }} />Horario: {m.horario}</div>}
                  {m.local && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={10} style={{ color: "rgba(74,179,216,0.4)", flexShrink: 0 }} />{m.local}{m.aula ? ` · ${m.aula}` : ""}</div>}
                </div>

                {m.cursos && m.cursos.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(42,109,181,0.12)", paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: "rgba(74,179,216,0.4)", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}><Layers size={10} />{m.cursos.length} CURSOS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {m.cursos.slice(0, 4).map(c => (
                        <span key={c.id} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: "rgba(42,109,181,0.12)", border: "1px solid rgba(42,109,181,0.18)", color: "rgba(120,160,210,0.8)" }}>{c.nombre}</span>
                      ))}
                      {m.cursos.length > 4 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, color: "rgba(74,179,216,0.4)" }}>+{m.cursos.length - 4} más</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
