"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react";

interface Pension {
  id: string;
  nro_recibo: string;
  monto_pagado: number;
  deuda_pendiente: number;
  fecha_pago: string;
  alumnos: { dni: string; nombres: string; apellidos: string } | null;
  modulos: { nombre: string } | null;
}

interface Modulo {
  id: string;
  nombre: string;
}

interface Alumno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
}

export default function PensionesView() {
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterDni, setFilterDni] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    alumno_id: "",
    modulo_id: "",
    nro_recibo: "",
    monto_pagado: "",
    deuda_pendiente: "",
    fecha_pago: new Date().toISOString().split("T")[0],
  });

  async function loadAll() {
    setLoading(true);
    const [pRes, mRes, aRes] = await Promise.all([
      fetch("/api/pensiones"),
      fetch("/api/modulos"),
      fetch("/api/alumnos"),
    ]);
    const [pData, mData, aData] = await Promise.all([pRes.json(), mRes.json(), aRes.json()]);
    setPensiones(Array.isArray(pData) ? pData : []);
    setModulos(Array.isArray(mData) ? mData : []);
    setAlumnos(Array.isArray(aData) ? aData : []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/pensiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto_pagado: parseFloat(form.monto_pagado),
          deuda_pendiente: parseFloat(form.deuda_pendiente || "0"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");
      setSuccessMsg(`Pago registrado: Recibo ${form.nro_recibo}`);
      setShowForm(false);
      setForm({
        alumno_id: "",
        modulo_id: "",
        nro_recibo: "",
        monto_pagado: "",
        deuda_pendiente: "",
        fecha_pago: new Date().toISOString().split("T")[0],
      });
      await loadAll();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = pensiones.filter((p) => {
    if (!filterDni) return true;
    return p.alumnos?.dni?.includes(filterDni);
  });

  const totalPagado = filtered.reduce((s, p) => s + p.monto_pagado, 0);
  const totalDeuda = filtered.reduce((s, p) => s + p.deuda_pendiente, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="section-title">Módulo de Pensiones</h2>
            <p className="section-subtitle">Gestione pagos y deudas de alumnos</p>
          </div>
          <button
            id="pension-nuevo-btn"
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} />
            Registrar Pago
          </button>
        </div>

        {/* Filter */}
        <div className="mt-4 relative" style={{ maxWidth: 320 }}>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            id="pension-filter-dni"
            className="input-field pl-8 text-sm"
            placeholder="Filtrar por DNI…"
            value={filterDni}
            onChange={(e) => setFilterDni(e.target.value)}
          />
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
        <div className="glass-card fade-in" style={{ padding: "28px" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
              Nuevo Registro de Pago
            </h3>
            <button
              className="btn-secondary"
              style={{ padding: "6px 10px" }}
              onClick={() => setShowForm(false)}
            >
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Alumno */}
            <div>
              <label className="form-label">Alumno</label>
              <div className="relative">
                <select
                  id="pension-alumno-select"
                  name="alumno_id"
                  className="select-field pr-8"
                  value={form.alumno_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">— Seleccionar alumno —</option>
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.apellidos}, {a.nombres} ({a.dni})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            {/* Módulo */}
            <div>
              <label className="form-label">Módulo</label>
              <div className="relative">
                <select
                  id="pension-modulo-select"
                  name="modulo_id"
                  className="select-field pr-8"
                  value={form.modulo_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">— Seleccionar módulo —</option>
                  {modulos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            {/* Recibo */}
            <div>
              <label className="form-label">N° de Recibo</label>
              <input
                id="pension-recibo-input"
                name="nro_recibo"
                className="input-field"
                placeholder="Ej: REC-2025-001"
                value={form.nro_recibo}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* Monto pagado */}
            <div>
              <label className="form-label">Monto Pagado (S/)</label>
              <input
                id="pension-monto-input"
                name="monto_pagado"
                type="number"
                min={0}
                step={0.01}
                className="input-field"
                placeholder="0.00"
                value={form.monto_pagado}
                onChange={handleFormChange}
                required
              />
            </div>

            {/* Deuda */}
            <div>
              <label className="form-label">Deuda Pendiente (S/)</label>
              <input
                id="pension-deuda-input"
                name="deuda_pendiente"
                type="number"
                min={0}
                step={0.01}
                className="input-field"
                placeholder="0.00"
                value={form.deuda_pendiente}
                onChange={handleFormChange}
              />
            </div>

            {/* Fecha */}
            <div>
              <label className="form-label">Fecha de Pago</label>
              <input
                id="pension-fecha-input"
                name="fecha_pago"
                type="date"
                className="input-field"
                value={form.fecha_pago}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                id="pension-submit-btn"
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                <CreditCard size={15} />
                {submitting ? "Registrando…" : "Registrar Pago"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-5">
          <div className="stat-card">
            <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Total Registros
            </div>
            <div className="text-3xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>
              {filtered.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Total Pagado
            </div>
            <div className="text-3xl font-bold mt-2" style={{ color: "#34d399" }}>
              S/ {totalPagado.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              Deuda Total
            </div>
            <div className="text-3xl font-bold mt-2" style={{ color: totalDeuda > 0 ? "#f87171" : "#34d399" }}>
              S/ {totalDeuda.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <CreditCard size={16} style={{ color: "var(--accent-primary)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Historial de Pagos
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <CreditCard size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
            <p className="text-sm">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Recibo</th>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Módulo</th>
                  <th>Monto Pagado</th>
                  <th>Deuda</th>
                  <th>Fecha Pago</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.nro_recibo}</td>
                    <td>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {p.alumnos?.apellidos}, {p.alumnos?.nombres}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue text-xs">{p.alumnos?.dni}</span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                      {p.modulos?.nombre ?? "—"}
                    </td>
                    <td>
                      <span style={{ color: "#34d399", fontWeight: 700 }}>
                        S/ {p.monto_pagado.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: p.deuda_pendiente > 0 ? "#f87171" : "#34d399",
                          fontWeight: 700,
                        }}
                      >
                        S/ {p.deuda_pendiente.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{p.fecha_pago}</td>
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
        )}
      </div>
    </div>
  );
}
