"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  BookOpen,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Eye,
  Phone,
  MapPin,
  Users,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface Alumno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  carrera: string;
  fecha_nacimiento?: string | null;
  nac_distrito?: string | null;
  nac_provincia?: string | null;
  nac_departamento?: string | null;
  direccion?: string | null;
  dir_distrito?: string | null;
  dir_referencia?: string | null;
  telefono?: string | null;
  celular?: string | null;
  correo?: string | null;
  facebook?: string | null;
  colegio?: string | null;
  colegio_distrito?: string | null;
  apoderado_nombre?: string | null;
  apoderado_parentesco?: string | null;
  apoderado_celular?: string | null;
}

interface Modulo {
  id: string;
  nombre: string;
}

interface PaginatedResponse {
  data: Alumno[];
  total: number;
  page: number;
  pageSize: number;
}

import { carreraBadgeStyle, CARRERA_COLORS } from "@/lib/carreraColors";

const CARRERAS = [
  "Operación de Cargador Frontal",
  "Operación de Excavadora",
  "Operación de Motoniveladora",
  "Operación de Tractor de Orugas",
  "Mantenimiento de Maquinaria Pesada",
  "Seguridad Minera",
];

const PAGE_SIZE = 10;


// ─────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Modal (Centrado, animado desde arriba con <dialog>)
// ─────────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  // Cierra al hacer clic en el backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      style={{
        padding: 0,
        border: "none",
        borderRadius: 16,
        background: "transparent",
        maxWidth: "min(540px, 95vw)",
        width: "100%",
        outline: "none",
        position: "fixed",
        top: "10%", /* Desplazado ligeramente hacia arriba pero centrado en pantalla */
        margin: "0 auto",
      }}
    >
      <style>{`
        dialog::backdrop {
          background: rgba(4, 10, 24, 0.75);
          backdrop-filter: blur(6px);
        }
        dialog[open] {
          animation: modalIn .32s cubic-bezier(.16, 1, .3, 1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          background: "rgba(8,16,34,0.98)",
          border: "1px solid rgba(42,109,181,0.28)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,179,216,0.06) inset",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* barra superior */}
        <div style={{
          height: 3,
          background: "linear-gradient(90deg, #1a4a7a, #2a6db5, #4ab3d8, #2a6db5, #1a4a7a)",
          backgroundSize: "200% 100%",
          animation: "barShift 3s linear infinite",
        }} />

        {/* header del modal */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 14px",
          borderBottom: "1px solid rgba(42,109,181,0.14)",
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700,
            color: "#dbeafe",
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.02em",
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(42,109,181,0.1)",
              border: "1px solid rgba(42,109,181,0.2)",
              color: "rgba(74,179,216,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "background .2s",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* contenido */}
        <div style={{ padding: "22px 24px 24px" }}>
          {children}
        </div>
      </div>
    </dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENTE: ConfirmDialog (para eliminar)
// ─────────────────────────────────────────────────────────────
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  alumno,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  alumno: Alumno | null;
  loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar Eliminación">
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", margin: "0 auto 16px",
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Trash2 size={22} style={{ color: "#f87171" }} />
        </div>
        <p style={{ fontSize: 14, color: "#dbeafe", marginBottom: 6, fontWeight: 500 }}>
          ¿Eliminar a este alumno?
        </p>
        {alumno && (
          <p style={{ fontSize: 13, color: "rgba(120,160,210,0.75)", marginBottom: 20 }}>
            <strong style={{ color: "#4ab3d8" }}>{alumno.apellidos}, {alumno.nombres}</strong>
            <br />
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>DNI: {alumno.dni}</span>
          </p>
        )}
        <p style={{ fontSize: 12, color: "rgba(248,113,113,0.7)", marginBottom: 24 }}>
          Esta acción no se puede deshacer.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose} style={secondaryBtn}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...primaryBtn,
              background: "linear-gradient(135deg, #991b1b, #dc2626)",
              boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
            }}
          >
            <Trash2 size={14} />
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// ESTILOS REUTILIZABLES
// ─────────────────────────────────────────────────────────────
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11, fontWeight: 600,
  color: "rgba(74,179,216,0.75)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44,
  background: "rgba(10,22,44,0.7)",
  border: "1px solid rgba(42,109,181,0.22)",
  borderRadius: 10,
  padding: "0 14px",
  color: "#dbeafe",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  paddingRight: 36,
  cursor: "pointer",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "9px 18px",
  borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #1a4a7a 0%, #2a6db5 55%, #4ab3d8 100%)",
  color: "#fff",
  fontSize: 13, fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(42,109,181,0.35)",
  transition: "transform .15s, box-shadow .2s, opacity .2s",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "9px 16px",
  borderRadius: 10,
  background: "rgba(42,109,181,0.1)",
  border: "1px solid rgba(42,109,181,0.22)",
  color: "rgba(120,160,210,0.85)",
  fontSize: 13, fontWeight: 500,
  fontFamily: "inherit",
  cursor: "pointer",
  transition: "background .2s, border-color .2s",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(8,16,34,0.85)",
  border: "1px solid rgba(42,109,181,0.18)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};

// ─────────────────────────────────────────────────────────────
// VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function AlumnosView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Estado paginación ──
  const pageParam = Number(searchParams.get("alumnos_page") ?? "1");
  const [page, setPage] = useState(pageParam);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Datos ──
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // ── Modales ──
  const [modalAlumno,   setModalAlumno]   = useState(false);
  const [modalMatricula,setModalMatricula]= useState(false);
  const [modalEditar,   setModalEditar]   = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalVer,      setModalVer]      = useState(false);
  const [verTarget,     setVerTarget]     = useState<Alumno | null>(null);

  // ── Formularios ──
  const emptyAlumno = {
    dni: "", nombres: "", apellidos: "", carrera: "",
    fecha_nacimiento: "", nac_distrito: "", nac_provincia: "", nac_departamento: "",
    direccion: "", dir_distrito: "", dir_referencia: "",
    telefono: "", celular: "", correo: "", facebook: "",
    colegio: "", colegio_distrito: "",
    apoderado_nombre: "", apoderado_parentesco: "", apoderado_celular: "",
  };
  const [alumnoForm, setAlumnoForm] = useState(emptyAlumno);
  const [editForm, setEditForm] = useState<Alumno | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alumno | null>(null);
  const [matriculaForm, setMatriculaForm] = useState({ alumno_id: "", modulo_id: "" });
  const [formTab, setFormTab] = useState<"basico"|"nacimiento"|"domicilio"|"contacto"|"apoderado">("basico");

  // ── Feedback ──
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Helpers ──
  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }
  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  }

  // ── Sincronizar página con URL ──
  function navigatePage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("alumnos_page", String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setPage(p);
  }

  // ── Cargar alumnos paginados ──
  const loadAlumnos = useCallback(async (p: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/alumnos?${params}`);
      const json: PaginatedResponse = await res.json();
      setAlumnos(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      showError("Error al cargar alumnos");
    } finally {
      setLoading(false);
    }
  }, []);

  async function loadModulos() {
    const res = await fetch("/api/modulos");
    const data = await res.json();
    setModulos(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadModulos();
  }, []);

  useEffect(() => {
    loadAlumnos(page, searchTerm);
  }, [page, searchTerm, loadAlumnos]);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      if (page !== 1) navigatePage(1);
    }, 380);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── CRUD HANDLERS ──
  async function handleCreateAlumno(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/alumnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumnoForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccess(`Alumno ${alumnoForm.nombres} registrado exitosamente`);
      setModalAlumno(false);
      setAlumnoForm(emptyAlumno);
      loadAlumnos(page, searchTerm);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al registrar alumno");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditAlumno(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/alumnos/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccess(`Alumno ${editForm.nombres} actualizado correctamente`);
      setModalEditar(false);
      setEditForm(null);
      loadAlumnos(page, searchTerm);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al actualizar alumno");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAlumno() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/alumnos/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      showSuccess(`Alumno ${deleteTarget.nombres} eliminado`);
      setModalEliminar(false);
      setDeleteTarget(null);
      if (alumnos.length === 1 && page > 1) navigatePage(page - 1);
      else loadAlumnos(page, searchTerm);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al eliminar alumno");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMatricula(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/matriculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matriculaForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccess("Matrícula registrada exitosamente");
      setModalMatricula(false);
      setMatriculaForm({ alumno_id: "", modulo_id: "" });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al matricular");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes barShift {
          0%   { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes alertIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ts-input:focus {
          border-color: rgba(74,179,216,0.55) !important;
          box-shadow: 0 0 0 3px rgba(74,179,216,0.1) !important;
        }
        .ts-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(42,109,181,0.45) !important;
        }
        .ts-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .ts-btn-secondary:hover { background: rgba(42,109,181,0.18) !important; }

        .ts-table tr:hover td { background: rgba(42,109,181,0.06); }

        .ts-page-btn {
          width: 34px; height: 34px; border-radius: 8px;
          border: 1px solid rgba(42,109,181,0.2);
          background: rgba(42,109,181,0.08);
          color: rgba(120,160,210,0.8);
          font-size: 13px; font-weight: 500;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .2s; font-family: inherit;
        }
        .ts-page-btn:hover:not(:disabled) {
          background: rgba(42,109,181,0.2);
          border-color: rgba(74,179,216,0.4);
          color: #4ab3d8;
        }
        .ts-page-btn.active {
          background: linear-gradient(135deg, #1a4a7a, #2a6db5);
          border-color: rgba(74,179,216,0.4);
          color: #fff;
          box-shadow: 0 2px 10px rgba(42,109,181,0.35);
        }
        .ts-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .ts-row-action {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid transparent;
          background: transparent;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .18s;
        }
        .ts-row-action.edit:hover {
          background: rgba(42,109,181,0.15);
          border-color: rgba(74,179,216,0.3);
          color: #4ab3d8 !important;
        }
        .ts-row-action.delete:hover {
          background: rgba(248,113,113,0.1);
          border-color: rgba(248,113,113,0.25);
          color: #f87171 !important;
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── CABECERA ──────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: 20, fontWeight: 800,
                color: "#dbeafe",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.02em",
                marginBottom: 4,
              }}>
                Gestión de Alumnos
              </h2>
              <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)" }}>
                Registre alumnos, edite datos y gestione matrículas
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="ts-btn-secondary"
                style={secondaryBtn}
                onClick={() => setModalMatricula(true)}
              >
                <BookOpen size={14} />
                Matricular
              </button>
              <button
                className="ts-btn-primary"
                style={primaryBtn}
                onClick={() => setModalAlumno(true)}
              >
                <Plus size={14} />
                Nuevo Alumno
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div style={{ marginTop: 18, position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(74,179,216,0.5)",
                pointerEvents: "none",
              }}
            />
            <input
              className="ts-input"
              style={{ ...inputStyle, paddingLeft: 38, height: 42 }}
              placeholder="Buscar por DNI, nombre o apellido…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* ── ALERTAS ────────────────────────────────────────── */}
        {errorMsg && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(127,29,29,0.25)",
            border: "1px solid rgba(248,113,113,0.3)",
            color: "#fca5a5", fontSize: 13,
            animation: "alertIn .3s both",
          }}>
            <AlertTriangle size={15} />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(6,78,59,0.25)",
            border: "1px solid rgba(52,211,153,0.3)",
            color: "#6ee7b7", fontSize: 13,
            animation: "alertIn .3s both",
          }}>
            <CheckCircle size={15} />
            {successMsg}
          </div>
        )}

        {/* ── TABLA ──────────────────────────────────────────── */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>

          {/* título tabla */}
          <div style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(42,109,181,0.14)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#dbeafe" }}>
              Lista de Alumnos
            </span>
            <span style={{ fontSize: 12, color: "rgba(74,179,216,0.5)" }}>
              Página {page} de {totalPages}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "28px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  height: 38, borderRadius: 8,
                  background: "rgba(42,109,181,0.07)",
                  animation: `pulse 1.5s ${i * 0.1}s ease-in-out infinite alternate`,
                }} />
              ))}
            </div>
          ) : alumnos.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
              <BookOpen size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No se encontraron alumnos</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                className="ts-table"
                style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.14)" }}>
                    {["#", "DNI", "Apellidos y Nombres", "Carrera", "Celular", ""].map((h) => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left",
                        fontSize: 10, fontWeight: 600,
                        color: "rgba(74,179,216,0.55)",
                        letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom:"1px solid rgba(42,109,181,0.08)", transition:"background .15s" }}>
                      <td style={{ padding:"11px 14px", color:"rgba(74,179,216,0.4)", fontSize:11 }}>
                        {(page-1)*PAGE_SIZE+idx+1}
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ fontFamily:"monospace", fontSize:12, padding:"3px 8px", borderRadius:5, background:"rgba(42,109,181,0.12)", border:"1px solid rgba(42,109,181,0.2)", color:"#7cc8e8" }}>
                          {a.dni}
                        </span>
                      </td>
                      {/* Apellidos + Nombres en una celda */}
                      <td style={{ padding:"11px 14px", minWidth:160 }}>
                        <div style={{ fontWeight:700, color:"#dbeafe", fontSize:13 }}>{a.apellidos}</div>
                        <div style={{ color:"rgba(180,210,240,0.7)", fontSize:12 }}>{a.nombres}</div>
                      </td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={carreraBadgeStyle(a.carrera)}>
                          {a.carrera}
                        </span>
                      </td>
                      {/* Celular */}
                      <td style={{ padding:"11px 14px" }}>
                        {a.celular
                          ? <div style={{ display:"flex",alignItems:"center",gap:5 }}><Phone size={11} style={{color:"rgba(74,179,216,.5)",flexShrink:0}}/><span style={{fontSize:12,color:"rgba(180,210,240,.8)"}}>{a.celular}</span></div>
                          : <span style={{color:"rgba(74,179,216,.2)",fontSize:11}}>—</span>}
                      </td>
                      {/* Acciones */}
                      <td style={{ padding:"11px 14px" }}>
                        <div style={{ display:"flex", gap:4 }}>
                          <button className="ts-row-action" style={{color:"rgba(74,179,216,0.6)"}} title="Ver detalle" onClick={()=>{setVerTarget(a);setModalVer(true);}}>
                            <Eye size={13}/>
                          </button>
                          <button className="ts-row-action edit" style={{color:"rgba(74,179,216,0.5)"}} title="Editar" onClick={()=>{setEditForm({...a});setModalEditar(true);}}>
                            <Pencil size={13}/>
                          </button>
                          <button className="ts-row-action delete" style={{color:"rgba(248,113,113,0.4)"}} title="Eliminar" onClick={()=>{setDeleteTarget(a);setModalEliminar(true);}}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Paginación ── */}
          {!loading && totalPages > 1 && (
            <div style={{
              padding: "14px 20px",
              borderTop: "1px solid rgba(42,109,181,0.12)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 12, color: "rgba(74,179,216,0.5)" }}>
                {total} alumnos · página {page} de {totalPages}
              </span>

              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <button
                  className="ts-page-btn"
                  disabled={page <= 1}
                  onClick={() => navigatePage(page - 1)}
                  title="Anterior"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} style={{ fontSize: 13, color: "rgba(74,179,216,0.35)", padding: "0 4px" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        className={`ts-page-btn${page === p ? " active" : ""}`}
                        onClick={() => navigatePage(p as number)}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  className="ts-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => navigatePage(page + 1)}
                  title="Siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════ */}

      {/* ── Modal: Nuevo Alumno ── */}
      <Modal open={modalAlumno} onClose={() => { setModalAlumno(false); setFormTab("basico"); }} title="Registrar Nuevo Alumno">
        <style>{`
          .ftab { padding:6px 14px; border-radius:8px; border:1px solid rgba(42,109,181,.2); background:transparent; color:rgba(180,210,240,.6); font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit; }
          .ftab.act { background:rgba(42,109,181,.2); border-color:rgba(74,179,216,.35); color:#dbeafe; }
          .ftab:hover:not(.act) { background:rgba(42,109,181,.1); color:#dbeafe; }
        `}</style>
        <form onSubmit={handleCreateAlumno} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Tabs */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {(["basico","nacimiento","domicilio","contacto","apoderado"] as const).map(t => (
              <button key={t} type="button" className={`ftab${formTab===t?" act":""}`} onClick={()=>setFormTab(t)}>
                {t==="basico"?"Básico":t==="nacimiento"?"Nacimiento":t==="domicilio"?"Domicilio":t==="contacto"?"Contacto":"Apoderado"}
              </button>
            ))}
          </div>

          {/* Básico */}
          {formTab==="basico" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={fieldLabel}>DNI *</label><input className="ts-input" style={inputStyle} placeholder="Ej: 12345678" value={alumnoForm.dni} onChange={e=>setAlumnoForm(p=>({...p,dni:e.target.value}))} maxLength={12} required /></div>
            <div><label style={fieldLabel}>Carrera *</label><div style={{position:"relative"}}><select className="ts-input" style={selectStyle} value={alumnoForm.carrera} onChange={e=>setAlumnoForm(p=>({...p,carrera:e.target.value}))} required><option value="">— Seleccionar —</option>{CARRERAS.map(c=><option key={c} value={c}>{c}</option>)}</select><ChevronDown size={13} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"rgba(74,179,216,0.5)"}}/></div></div>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Nombres *</label><input className="ts-input" style={inputStyle} placeholder="Ej: Juan Carlos" value={alumnoForm.nombres} onChange={e=>setAlumnoForm(p=>({...p,nombres:e.target.value}))} required /></div>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Apellidos *</label><input className="ts-input" style={inputStyle} placeholder="Ej: García Ríos" value={alumnoForm.apellidos} onChange={e=>setAlumnoForm(p=>({...p,apellidos:e.target.value}))} required /></div>
          </div>}

          {/* Nacimiento */}
          {formTab==="nacimiento" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Fecha de Nacimiento</label><input type="date" className="ts-input" style={{...inputStyle,colorScheme:"dark"}} value={alumnoForm.fecha_nacimiento??""} onChange={e=>setAlumnoForm(p=>({...p,fecha_nacimiento:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Distrito de Nacimiento</label><input className="ts-input" style={inputStyle} placeholder="Ej: Miraflores" value={alumnoForm.nac_distrito??""} onChange={e=>setAlumnoForm(p=>({...p,nac_distrito:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Provincia</label><input className="ts-input" style={inputStyle} placeholder="Ej: Lima" value={alumnoForm.nac_provincia??""} onChange={e=>setAlumnoForm(p=>({...p,nac_provincia:e.target.value}))} /></div>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Departamento</label><input className="ts-input" style={inputStyle} placeholder="Ej: Lima" value={alumnoForm.nac_departamento??""} onChange={e=>setAlumnoForm(p=>({...p,nac_departamento:e.target.value}))} /></div>
          </div>}

          {/* Domicilio */}
          {formTab==="domicilio" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Dirección</label><input className="ts-input" style={inputStyle} placeholder="Av. Ejemplo 123" value={alumnoForm.direccion??""} onChange={e=>setAlumnoForm(p=>({...p,direccion:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Distrito</label><input className="ts-input" style={inputStyle} value={alumnoForm.dir_distrito??""} onChange={e=>setAlumnoForm(p=>({...p,dir_distrito:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Referencia</label><input className="ts-input" style={inputStyle} placeholder="Cerca de…" value={alumnoForm.dir_referencia??""} onChange={e=>setAlumnoForm(p=>({...p,dir_referencia:e.target.value}))} /></div>
          </div>}

          {/* Contacto */}
          {formTab==="contacto" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={fieldLabel}>Teléfono</label><input className="ts-input" style={inputStyle} placeholder="01-XXXXXXX" value={alumnoForm.telefono??""} onChange={e=>setAlumnoForm(p=>({...p,telefono:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Celular</label><input className="ts-input" style={inputStyle} placeholder="9XXXXXXXX" value={alumnoForm.celular??""} onChange={e=>setAlumnoForm(p=>({...p,celular:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Correo</label><input type="email" className="ts-input" style={inputStyle} value={alumnoForm.correo??""} onChange={e=>setAlumnoForm(p=>({...p,correo:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Facebook</label><input className="ts-input" style={inputStyle} value={alumnoForm.facebook??""} onChange={e=>setAlumnoForm(p=>({...p,facebook:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Colegio</label><input className="ts-input" style={inputStyle} value={alumnoForm.colegio??""} onChange={e=>setAlumnoForm(p=>({...p,colegio:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Distrito del Colegio</label><input className="ts-input" style={inputStyle} value={alumnoForm.colegio_distrito??""} onChange={e=>setAlumnoForm(p=>({...p,colegio_distrito:e.target.value}))} /></div>
          </div>}

          {/* Apoderado */}
          {formTab==="apoderado" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Nombre del Apoderado</label><input className="ts-input" style={inputStyle} value={alumnoForm.apoderado_nombre??""} onChange={e=>setAlumnoForm(p=>({...p,apoderado_nombre:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Parentesco</label><input className="ts-input" style={inputStyle} placeholder="Ej: Padre, Madre, Tutor" value={alumnoForm.apoderado_parentesco??""} onChange={e=>setAlumnoForm(p=>({...p,apoderado_parentesco:e.target.value}))} /></div>
            <div><label style={fieldLabel}>Celular del Apoderado</label><input className="ts-input" style={inputStyle} value={alumnoForm.apoderado_celular??""} onChange={e=>setAlumnoForm(p=>({...p,apoderado_celular:e.target.value}))} /></div>
          </div>}

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4, borderTop:"1px solid rgba(42,109,181,.12)", paddingTop:14 }}>
            <button type="button" className="ts-btn-secondary" style={secondaryBtn} onClick={()=>{setModalAlumno(false);setFormTab("basico");}}>Cancelar</button>
            <button type="submit" className="ts-btn-primary" style={primaryBtn} disabled={submitting}>
              <UserPlus size={14}/>{submitting?"Registrando…":"Registrar Alumno"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar Alumno ── */}
      <Modal open={modalEditar} onClose={() => { setModalEditar(false); setFormTab("basico"); }} title="Editar Alumno">
        {editForm && (
          <form onSubmit={handleEditAlumno} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {(["basico","nacimiento","domicilio","contacto","apoderado"] as const).map(t => (
                <button key={t} type="button" className={`ftab${formTab===t?" act":""}`} onClick={()=>setFormTab(t)}>
                  {t==="basico"?"Básico":t==="nacimiento"?"Nacimiento":t==="domicilio"?"Domicilio":t==="contacto"?"Contacto":"Apoderado"}
                </button>
              ))}
            </div>

            {formTab==="basico" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={fieldLabel}>DNI *</label><input className="ts-input" style={inputStyle} value={editForm.dni} onChange={e=>setEditForm(p=>p?{...p,dni:e.target.value}:p)} maxLength={12} required /></div>
              <div><label style={fieldLabel}>Carrera *</label><div style={{position:"relative"}}><select className="ts-input" style={selectStyle} value={editForm.carrera} onChange={e=>setEditForm(p=>p?{...p,carrera:e.target.value}:p)} required><option value="">— Seleccionar —</option>{CARRERAS.map(c=><option key={c} value={c}>{c}</option>)}</select><ChevronDown size={13} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"rgba(74,179,216,0.5)"}}/></div></div>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Nombres *</label><input className="ts-input" style={inputStyle} value={editForm.nombres} onChange={e=>setEditForm(p=>p?{...p,nombres:e.target.value}:p)} required /></div>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Apellidos *</label><input className="ts-input" style={inputStyle} value={editForm.apellidos} onChange={e=>setEditForm(p=>p?{...p,apellidos:e.target.value}:p)} required /></div>
            </div>}

            {formTab==="nacimiento" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Fecha de Nacimiento</label><input type="date" className="ts-input" style={{...inputStyle,colorScheme:"dark"}} value={editForm.fecha_nacimiento??""} onChange={e=>setEditForm(p=>p?{...p,fecha_nacimiento:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Distrito de Nacimiento</label><input className="ts-input" style={inputStyle} value={editForm.nac_distrito??""} onChange={e=>setEditForm(p=>p?{...p,nac_distrito:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Provincia</label><input className="ts-input" style={inputStyle} value={editForm.nac_provincia??""} onChange={e=>setEditForm(p=>p?{...p,nac_provincia:e.target.value}:p)} /></div>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Departamento</label><input className="ts-input" style={inputStyle} value={editForm.nac_departamento??""} onChange={e=>setEditForm(p=>p?{...p,nac_departamento:e.target.value}:p)} /></div>
            </div>}

            {formTab==="domicilio" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Dirección</label><input className="ts-input" style={inputStyle} value={editForm.direccion??""} onChange={e=>setEditForm(p=>p?{...p,direccion:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Distrito</label><input className="ts-input" style={inputStyle} value={editForm.dir_distrito??""} onChange={e=>setEditForm(p=>p?{...p,dir_distrito:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Referencia</label><input className="ts-input" style={inputStyle} value={editForm.dir_referencia??""} onChange={e=>setEditForm(p=>p?{...p,dir_referencia:e.target.value}:p)} /></div>
            </div>}

            {formTab==="contacto" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label style={fieldLabel}>Teléfono</label><input className="ts-input" style={inputStyle} value={editForm.telefono??""} onChange={e=>setEditForm(p=>p?{...p,telefono:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Celular</label><input className="ts-input" style={inputStyle} value={editForm.celular??""} onChange={e=>setEditForm(p=>p?{...p,celular:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Correo</label><input type="email" className="ts-input" style={inputStyle} value={editForm.correo??""} onChange={e=>setEditForm(p=>p?{...p,correo:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Facebook</label><input className="ts-input" style={inputStyle} value={editForm.facebook??""} onChange={e=>setEditForm(p=>p?{...p,facebook:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Colegio</label><input className="ts-input" style={inputStyle} value={editForm.colegio??""} onChange={e=>setEditForm(p=>p?{...p,colegio:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Distrito del Colegio</label><input className="ts-input" style={inputStyle} value={editForm.colegio_distrito??""} onChange={e=>setEditForm(p=>p?{...p,colegio_distrito:e.target.value}:p)} /></div>
            </div>}

            {formTab==="apoderado" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{gridColumn:"1/-1"}}><label style={fieldLabel}>Nombre del Apoderado</label><input className="ts-input" style={inputStyle} value={editForm.apoderado_nombre??""} onChange={e=>setEditForm(p=>p?{...p,apoderado_nombre:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Parentesco</label><input className="ts-input" style={inputStyle} value={editForm.apoderado_parentesco??""} onChange={e=>setEditForm(p=>p?{...p,apoderado_parentesco:e.target.value}:p)} /></div>
              <div><label style={fieldLabel}>Celular del Apoderado</label><input className="ts-input" style={inputStyle} value={editForm.apoderado_celular??""} onChange={e=>setEditForm(p=>p?{...p,apoderado_celular:e.target.value}:p)} /></div>
            </div>}

            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:4, borderTop:"1px solid rgba(42,109,181,.12)", paddingTop:14 }}>
              <button type="button" className="ts-btn-secondary" style={secondaryBtn} onClick={()=>{setModalEditar(false);setFormTab("basico");}}>Cancelar</button>
              <button type="submit" className="ts-btn-primary" style={primaryBtn} disabled={submitting}>
                <Pencil size={14}/>{submitting?"Guardando…":"Guardar Cambios"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Matricular ── */}
      <Modal open={modalMatricula} onClose={() => setModalMatricula(false)} title="Registrar Matrícula">
        <form onSubmit={handleMatricula} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={fieldLabel}>Alumno</label>
            <div style={{ position: "relative" }}>
              <select
                className="ts-input"
                style={selectStyle}
                value={matriculaForm.alumno_id}
                onChange={(e) => setMatriculaForm((p) => ({ ...p, alumno_id: e.target.value }))}
                required
              >
                <option value="">— Seleccionar alumno —</option>
                {alumnos.map((a) => (
                  <option key={a.id} value={a.id}>{a.apellidos}, {a.nombres} ({a.dni})</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(74,179,216,0.5)" }} />
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Módulo</label>
            <div style={{ position: "relative" }}>
              <select
                className="ts-input"
                style={selectStyle}
                value={matriculaForm.modulo_id}
                onChange={(e) => setMatriculaForm((p) => ({ ...p, modulo_id: e.target.value }))}
                required
              >
                <option value="">— Seleccionar módulo —</option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(74,179,216,0.5)" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" className="ts-btn-secondary" style={secondaryBtn} onClick={() => setModalMatricula(false)}>
              Cancelar
            </button>
            <button type="submit" className="ts-btn-primary" style={primaryBtn} disabled={submitting}>
              <BookOpen size={14} />
              {submitting ? "Matriculando…" : "Registrar Matrícula"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Ver Detalle Alumno ── */}
      <Modal open={modalVer} onClose={()=>{setModalVer(false);setVerTarget(null);}} title="Ficha del Alumno">
        {verTarget && (() => {
          const v = verTarget;
          const empty = <span style={{color:"rgba(74,179,216,.2)",fontStyle:"italic",fontSize:12}}>—</span>;
          const row = (label: string, value?: string|null) => (
            <div style={{display:"grid",gridTemplateColumns:"140px 1fr",gap:"2px 10px",padding:"7px 0",borderBottom:"1px solid rgba(42,109,181,.07)"}}>
              <span style={{fontSize:11,color:"rgba(74,179,216,.45)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",paddingTop:2}}>{label}</span>
              <span style={{fontSize:13,color: value ? "#dbeafe" : "inherit",wordBreak:"break-word"}}>{value || empty}</span>
            </div>
          );
          const sec = (title: string, icon: React.ReactNode) => (
            <div style={{display:"flex",alignItems:"center",gap:7,margin:"16px 0 4px",paddingBottom:5,borderBottom:"2px solid rgba(42,109,181,.2)"}}>
              {icon}<span style={{fontSize:10,fontWeight:800,color:"rgba(74,179,216,.7)",textTransform:"uppercase",letterSpacing:".12em"}}>{title}</span>
            </div>
          );
          return (
            <div style={{maxHeight:"65vh",overflowY:"auto",paddingRight:4,fontSize:13}}>
              {sec("Identificación", <Users size={12} style={{color:"rgba(74,179,216,.7)"}}/>)}
              {row("DNI", v.dni)}
              {row("Nombres", v.nombres)}
              {row("Apellidos", v.apellidos)}
              {row("Carrera", v.carrera)}

              {sec("Datos de Nacimiento", <MapPin size={12} style={{color:"rgba(74,179,216,.7)"}}/>)}
              {row("Fecha de Nacimiento", v.fecha_nacimiento ? new Date(v.fecha_nacimiento+"T00:00:00").toLocaleDateString("es-PE",{day:"2-digit",month:"long",year:"numeric"}) : null)}
              {row("Distrito", v.nac_distrito)}
              {row("Provincia", v.nac_provincia)}
              {row("Departamento", v.nac_departamento)}

              {sec("Domicilio", <MapPin size={12} style={{color:"rgba(74,179,216,.7)"}}/>)}
              {row("Dirección", v.direccion)}
              {row("Distrito", v.dir_distrito)}
              {row("Referencia", v.dir_referencia)}

              {sec("Contacto", <Phone size={12} style={{color:"rgba(74,179,216,.7)"}}/>)}
              {row("Teléfono", v.telefono)}
              {row("Celular", v.celular)}
              {row("Correo electrónico", v.correo)}
              {row("Facebook", v.facebook)}
              {row("Colegio", v.colegio)}
              {row("Distrito del Colegio", v.colegio_distrito)}

              {sec("Apoderado", <Users size={12} style={{color:"rgba(74,179,216,.7)"}}/>)}
              {row("Nombre", v.apoderado_nombre)}
              {row("Parentesco", v.apoderado_parentesco)}
              {row("Celular", v.apoderado_celular)}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:10,borderTop:"1px solid rgba(42,109,181,.12)"}}>
                <button className="ts-btn-secondary" style={secondaryBtn} onClick={()=>{setModalVer(false);setVerTarget(null);}}>Cerrar</button>
                <button className="ts-btn-primary" style={primaryBtn} onClick={()=>{setModalVer(false);setEditForm({...v});setModalEditar(true);setFormTab("basico");}}>
                  <Pencil size={13}/> Editar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Modal: Confirmar Eliminación ── */}
      <ConfirmDialog
        open={modalEliminar}
        onClose={() => setModalEliminar(false)}
        onConfirm={handleDeleteAlumno}
        alumno={deleteTarget}
        loading={submitting}
      />
    </>
  );
}