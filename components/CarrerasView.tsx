"use client";
import { useState, useEffect } from "react";
import { GraduationCap, Plus, X, Pencil, Trash2, Layers, Users, ChevronLeft, Calendar, Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import AlertDialog from "./AlertDialog";
import ModulosView from "./ModulosView";

interface Carrera {
  id: string;
  nombre: string;
  descripcion?: string | null;
  created_at: string;
  created_by?: string | null;
  total_modulos?: number;
  total_alumnos?: number;
  total_matriculas?: number;
}

const card: React.CSSProperties = {
  background: "rgba(8,16,34,0.85)",
  border: "1px solid rgba(42,109,181,0.18)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
};
const inp: React.CSSProperties = {
  width: "100%", height: 44, boxSizing: "border-box",
  background: "rgba(10,22,44,0.7)",
  border: "1px solid rgba(42,109,181,0.22)",
  borderRadius: 10, padding: "0 14px",
  color: "#dbeafe", fontSize: 13, fontFamily: "inherit", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  color: "rgba(74,179,216,0.75)", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: 6,
};
const btnP: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px",
  borderRadius: 10, border: "none",
  background: "linear-gradient(135deg,#1a4a7a 0%,#2a6db5 55%,#4ab3d8 100%)",
  color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer", boxShadow: "0 4px 16px rgba(42,109,181,0.35)",
};
const btnS: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px",
  borderRadius: 10,
  background: "rgba(42,109,181,0.1)",
  border: "1px solid rgba(42,109,181,0.22)",
  color: "rgba(120,160,210,0.85)", fontSize: 13, fontWeight: 500,
  fontFamily: "inherit", cursor: "pointer",
};

const MODALIDAD_COLORS: Record<string, string> = {
  presencial: "rgba(52,211,153,0.15)",
  virtual: "rgba(251,191,36,0.15)",
  semipresencial: "rgba(139,92,246,0.15)",
};
const MODALIDAD_TEXT: Record<string, string> = {
  presencial: "#34d399", virtual: "#fbbf24", semipresencial: "#a78bfa",
};

export default function CarrerasView() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Carrera | null>(null);
  const [delTarget, setDelTarget] = useState<Carrera | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ open: boolean; type: "success" | "error"; text: string }>({ open: false, type: "success", text: "" });
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // States for viewing career modules
  const [viewingModulos, setViewingModulos] = useState<Carrera | null>(null);
  const [carreraModulos, setCarreraModulos] = useState<any[]>([]);
  const [loadingModulos, setLoadingModulos] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/carreras");
    const data = await res.json();
    setCarreras(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadCarreraModulos(carreraId: string) {
    setLoadingModulos(true);
    try {
      const res = await fetch(`/api/modulos?carrera_id=${carreraId}`);
      const data = await res.json();
      setCarreraModulos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      flash("error", "Error al cargar los módulos de la carrera");
    } finally {
      setLoadingModulos(false);
    }
  }

  function getStatus(m: any) {
    const now = new Date(), s = new Date(m.fecha_inicio), e = new Date(m.fecha_fin);
    if (now < s) return { label: "Próximo", color: "#fbbf24" };
    if (now > e) return { label: "Concluido", color: "#94a3b8" };
    return { label: "En curso", color: "#34d399" };
  }

  function flash(type: "success" | "error", text: string) {
    setMsg({ open: true, type, text });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/carreras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { flash("error", data.error); return; }
    flash("success", `Carrera "${data.nombre}" creada`);
    setForm({ nombre: "", descripcion: "" });
    setShowForm(false);
    load();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    const res = await fetch(`/api/carreras/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { flash("error", data.error); return; }
    flash("success", `Carrera "${data.nombre}" actualizada`);
    setEditTarget(null);
    load();
  }

  async function handleDelete() {
    if (!delTarget) return;
    setSubmitting(true);
    const res = await fetch(`/api/carreras/${delTarget.id}`, { method: "DELETE" });
    setSubmitting(false);
    if (!res.ok) { flash("error", "Error al eliminar"); return; }
    flash("success", `Carrera "${delTarget.nombre}" eliminada`);
    setDelTarget(null);
    load();
  }

  function openEdit(c: Carrera) {
    setEditTarget(c);
    setForm({ nombre: c.nombre, descripcion: c.descripcion ?? "" });
  }

  const isFormOpen = showForm || !!editTarget;

  return (
    <div style={{ width: "92%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .cr-input:focus { border-color:rgba(74,179,216,.55)!important; box-shadow:0 0 0 3px rgba(74,179,216,.1)!important; }
        .cr-btn-p:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(42,109,181,.45)!important;}
        .cr-btn-p:disabled{opacity:.65;cursor:not-allowed;}
        .cr-card-hover:hover{border-color:rgba(74,179,216,.3)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4);}
        .cr-action:hover{background:rgba(42,109,181,.15)!important;color:#4ab3d8!important;}
        .cr-del:hover{background:rgba(248,113,113,.1)!important;color:#f87171!important;}
      `}</style>

      {/* Header */}
      {!viewingModulos && (
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: 23, fontWeight: 800, color: "#dbeafe", marginBottom: 4 }}>
                Gestión de Carreras
              </h2>
              <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)" }}>
                Administre las carreras del instituto. Cada carrera agrupa módulos y alumnos.
              </p>
            </div>
            <button className="cr-btn-p" style={btnP} onClick={() => { setShowForm(!showForm); setEditTarget(null); setForm({ nombre: "", descripcion: "" }); }}>
              <Plus size={14} /> Nueva Carrera
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      <AlertDialog
        open={msg.open}
        onClose={() => setMsg(p => ({ ...p, open: false }))}
        message={msg.text}
        type={msg.type}
      />

      {/* Form crear / editar */}
      <Modal
        open={isFormOpen}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget ? "Editar Carrera" : "Nueva Carrera"}
      >
        <form onSubmit={editTarget ? handleEdit : handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lbl}>Nombre de la Carrera *</label>
            <input
              className="cr-input"
              style={inp}
              placeholder="Ej: Operación de Cargador Frontal"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={lbl}>Descripción (opcional)</label>
            <textarea
              className="cr-input"
              style={{ ...inp, height: 80, padding: "10px 14px", resize: "vertical" }}
              placeholder="Breve descripción de la carrera…"
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            />
          </div>
          {!editTarget && (
            <div style={{ fontSize: 11, color: "rgba(74,179,216,0.5)", marginTop: -6 }}>
              Se registrará con tu usuario: <strong style={{ color: "rgba(74,179,216,0.8)" }}>{userEmail ?? "—"}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <button type="button" style={btnS} onClick={() => { setShowForm(false); setEditTarget(null); }}>Cancelar</button>
            <button type="submit" className="cr-btn-p" style={btnP} disabled={submitting}>
              <GraduationCap size={14} />
              {submitting ? "Guardando…" : editTarget ? "Actualizar" : "Crear Carrera"}
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
        title="¿Eliminar carrera?"
        description="Se desvinculará de sus módulos y matrículas. Esta acción no se puede deshacer."
      >
        <p style={{ fontSize: 13, color: "rgba(120,160,210,0.7)" }}>
          <strong style={{ color: "#4ab3d8" }}>{delTarget?.nombre}</strong>
        </p>
      </ConfirmDialog>

      {/* Stats */}
      {!viewingModulos && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {[
            { label: "Total Carreras", value: carreras.length, color: "#4ab3d8" },
            { label: "Alumnos Matriculados", value: carreras.reduce((s, c) => s + (c.total_alumnos ?? 0), 0), color: "#34d399" },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(120,160,210,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grid de carreras */}
      {!viewingModulos && (
        loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 160, borderRadius: 14, background: "rgba(42,109,181,0.07)", animation: `pulse 1.5s ${i * 0.15}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        ) : carreras.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
            <GraduationCap size={48} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No hay carreras registradas aún</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {carreras.map(c => (
              <div
                key={c.id}
                className="cr-card-hover"
                style={{ ...card, padding: 22, display: "flex", flexDirection: "column", gap: 14, transition: "all .2s", cursor: "pointer" }}
                onClick={() => { setViewingModulos(c); loadCarreraModulos(c.id); }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "linear-gradient(135deg,rgba(42,109,181,0.25),rgba(74,179,216,0.15))",
                    border: "1px solid rgba(74,179,216,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <GraduationCap size={18} style={{ color: "#4ab3d8" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="cr-action"
                      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(42,109,181,0.2)", background: "transparent", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}
                      title="Editar"
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="cr-del"
                      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid transparent", background: "transparent", color: "rgba(248,113,113,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}
                      title="Eliminar"
                      onClick={(e) => { e.stopPropagation(); setDelTarget(c); }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#dbeafe", lineHeight: 1.3 }}>{c.nombre}</div>
                  {c.descripcion && (
                    <div style={{ fontSize: 12, color: "rgba(120,160,210,0.65)", marginTop: 4, lineHeight: 1.5 }}>{c.descripcion}</div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, borderTop: "1px solid rgba(42,109,181,0.12)", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(120,160,210,0.7)" }}>
                    <Layers size={12} style={{ color: "rgba(74,179,216,0.5)" }} />
                    {c.total_modulos ?? 0} módulos
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(120,160,210,0.7)" }}>
                    <Users size={12} style={{ color: "rgba(74,179,216,0.5)" }} />
                    {c.total_alumnos ?? 0} alumnos
                  </div>
                </div>

                {c.created_by && (
                  <div style={{ fontSize: 10, color: "rgba(42,109,181,0.45)", borderTop: "1px solid rgba(42,109,181,0.08)", paddingTop: 8 }}>
                    Creado por: {c.created_by}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Vista de Módulos de una Carrera ── */}
      {viewingModulos && (
        <ModulosView
          carreraId={viewingModulos.id}
          onBack={() => setViewingModulos(null)}
        />
      )}
    </div>
  );
}
