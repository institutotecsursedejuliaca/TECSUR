"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react";

interface Modulo {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: "presencial" | "virtual";
  duracion: number;
}

const MODULOS_SUGERIDOS = [
  "Cargador Frontal",
  "Excavadora Hidráulica",
  "Motoniveladora",
  "Tractor de Orugas",
  "Retroexcavadora",
  "Grúa Torre",
  "Compactadora",
  "Seguridad en Minas",
  "Mantenimiento Preventivo",
  "Inglés Técnico",
];

export default function ModulosView() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
    modalidad: "presencial" as "presencial" | "virtual",
    duracion: "",
  });

  async function loadModulos() {
    setLoading(true);
    const res = await fetch("/api/modulos");
    const data = await res.json();
    setModulos(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadModulos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/modulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duracion: parseInt(form.duracion) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(`Módulo "${form.nombre}" creado exitosamente`);
      setShowForm(false);
      setForm({ nombre: "", fecha_inicio: "", fecha_fin: "", modalidad: "presencial", duracion: "" });
      await loadModulos();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al crear módulo");
    } finally {
      setSubmitting(false);
    }
  }

  function getDuration(m: Modulo): string {
    const start = new Date(m.fecha_inicio);
    const end = new Date(m.fecha_fin);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} días`;
  }

  function getStatus(m: Modulo): { label: string; cls: string } {
    const now = new Date();
    const start = new Date(m.fecha_inicio);
    const end = new Date(m.fecha_fin);
    if (now < start) return { label: "Próximo", cls: "badge-amber" };
    if (now > end) return { label: "Concluido", cls: "badge-red" };
    return { label: "En curso", cls: "badge-green" };
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="section-title">Gestión de Módulos</h2>
            <p className="section-subtitle">Administre los módulos académicos del instituto</p>
          </div>
          <button
            id="modulo-nuevo-btn"
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={15} />
            Nuevo Módulo
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="alert alert-error">
          <AlertTriangle size={14} />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={14} />
          {successMsg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: "28px" }} >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              Nuevo Módulo Académico
            </h3>
            <button className="btn-secondary" style={{ padding: "6px 10px" }} onClick={() => setShowForm(false)}>
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="form-label">Nombre del Módulo</label>
              <div className="relative">
                <input
                  id="modulo-nombre-input"
                  className="input-field"
                  placeholder="Ej: Cargador Frontal"
                  list="modulos-sugeridos"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  required
                />
                <datalist id="modulos-sugeridos">
                  {MODULOS_SUGERIDOS.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
            </div>

            {/* Modalidad */}
            <div>
              <label className="form-label">Modalidad</label>
              <div className="relative">
                <select
                  id="modulo-modalidad-select"
                  className="select-field pr-8"
                  value={form.modalidad}
                  onChange={(e) => setForm((p) => ({ ...p, modalidad: e.target.value as "presencial" | "virtual" }))}
                >
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>

            {/* Duración */}
            <div>
              <label className="form-label">Duración (horas)</label>
              <input
                id="modulo-duracion-input"
                type="number"
                min={1}
                className="input-field"
                placeholder="Ej: 120"
                value={form.duracion}
                onChange={(e) => setForm((p) => ({ ...p, duracion: e.target.value }))}
                required
              />
            </div>

            {/* Fechas */}
            <div>
              <label className="form-label">Fecha de Inicio</label>
              <input
                id="modulo-inicio-input"
                type="date"
                className="input-field"
                value={form.fecha_inicio}
                onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Fecha de Fin</label>
              <input
                id="modulo-fin-input"
                type="date"
                className="input-field"
                value={form.fecha_fin}
                onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button id="modulo-submit-btn" type="submit" className="btn-primary" disabled={submitting}>
                <Cpu size={15} />
                {submitting ? "Creando…" : "Crear Módulo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Total Módulos", value: modulos.length, color: "var(--accent-primary)" },
            { label: "En Curso", value: modulos.filter((m) => getStatus(m).label === "En curso").length, color: "#34d399" },
            { label: "Concluidos", value: modulos.filter((m) => getStatus(m).label === "Concluido").length, color: "#94a3b8" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                {s.label}
              </div>
              <div className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
        </div>
      ) : modulos.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
          <Cpu size={48} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
          <p className="text-sm">No hay módulos registrados aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modulos.map((m) => {
            const status = getStatus(m);
            return (
              <div
                key={m.id}
                className="stat-card cursor-default"
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.2))",
                      border: "1px solid rgba(59,130,246,0.15)",
                    }}
                  >
                    <Cpu size={18} style={{ color: "#60a5fa" }} />
                  </div>
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>

                <div>
                  <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {m.nombre}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`badge ${m.modalidad === "presencial" ? "badge-blue" : "badge-amber"}`}
                      style={{ fontSize: 10 }}
                    >
                      {m.modalidad}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex items-center gap-1">
                    <Calendar size={11} style={{ color: "var(--text-muted)" }} />
                    {m.fecha_inicio} → {m.fecha_fin}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} style={{ color: "var(--text-muted)" }} />
                    {m.duracion}h · {getDuration(m)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
