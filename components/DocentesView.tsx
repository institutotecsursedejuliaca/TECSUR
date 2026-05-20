"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RefreshCw, Users, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react";
import { carreraBadgeStyle } from "@/lib/carreraColors";

interface Modulo {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: string;
  duracion: number;
}

interface Nota {
  id?: string;
  inspeccion: string;
  mantenimiento: string;
  sistema_hidraulico: string;
  seguridad: string;
  ingles: string;
  operacion: string;
  asistencia_total: string;
}

interface MatriculaRow {
  id: string;
  fecha_registro: string;
  alumnos: { id: string; dni: string; nombres: string; apellidos: string; carrera: string };
  notas: Nota[] | null;
}

const SUBJECTS: { key: keyof Omit<Nota, "id" | "asistencia_total">; label: string }[] = [
  { key: "inspeccion", label: "Inspección" },
  { key: "mantenimiento", label: "Mantenimiento" },
  { key: "sistema_hidraulico", label: "Sist. Hidráulico" },
  { key: "seguridad", label: "Seguridad" },
  { key: "ingles", label: "Inglés" },
  { key: "operacion", label: "Operación" },
];

function calcPromedio(nota: Nota): string {
  const scores = SUBJECTS.map((s) => parseFloat(nota[s.key])).filter((n) => !isNaN(n));
  if (scores.length === 0) return "—";
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
}

function promedioColor(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "var(--text-muted)";
  if (n >= 17) return "#34d399";
  if (n >= 13) return "#60a5fa";
  if (n >= 11) return "#fbbf24";
  return "#f87171";
}

export default function DocentesView() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selectedModulo, setSelectedModulo] = useState<string>("");
  const [matriculas, setMatriculas] = useState<MatriculaRow[]>([]);
  const [notasMap, setNotasMap] = useState<Record<string, Nota>>({});
  const [loadingModulos, setLoadingModulos] = useState(true);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/modulos")
      .then((r) => r.json())
      .then((data) => {
        setModulos(Array.isArray(data) ? data : []);
        setLoadingModulos(false);
      })
      .catch(() => setLoadingModulos(false));
  }, []);

  const loadAlumnos = useCallback(async (moduloId: string) => {
    if (!moduloId) return;
    setLoadingAlumnos(true);
    setErrorMsg(null);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/matriculas?modulo_id=${moduloId}`);
      const data: MatriculaRow[] = await res.json();
      setMatriculas(Array.isArray(data) ? data : []);

      // Pre-fill notasMap from existing notas
      const map: Record<string, Nota> = {};
      (Array.isArray(data) ? data : []).forEach((row) => {
        const n = row.notas?.[0] ?? null;
        map[row.id] = {
          id: n?.id,
          inspeccion: n?.inspeccion?.toString() ?? "",
          mantenimiento: n?.mantenimiento?.toString() ?? "",
          sistema_hidraulico: n?.sistema_hidraulico?.toString() ?? "",
          seguridad: n?.seguridad?.toString() ?? "",
          ingles: n?.ingles?.toString() ?? "",
          operacion: n?.operacion?.toString() ?? "",
          asistencia_total: n?.asistencia_total?.toString() ?? "",
        };
      });
      setNotasMap(map);
    } catch {
      setErrorMsg("Error al cargar alumnos del módulo");
    } finally {
      setLoadingAlumnos(false);
    }
  }, []);

  function handleModuloChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedModulo(val);
    setMatriculas([]);
    setNotasMap({});
    if (val) loadAlumnos(val);
  }

  function handleNotaChange(matriculaId: string, field: keyof Nota, value: string) {
    // Validate 0-20
    if (field !== "asistencia_total" && value !== "") {
      const num = parseFloat(value);
      if (!isNaN(num) && (num < 0 || num > 20)) return;
    }
    setNotasMap((prev) => ({
      ...prev,
      [matriculaId]: { ...prev[matriculaId], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg(null);

    try {
      const promises = matriculas.map(async (row) => {
        const nota = notasMap[row.id];
        if (!nota) return;
        const payload = {
          matricula_id: row.id,
          inspeccion: nota.inspeccion !== "" ? parseFloat(nota.inspeccion) : null,
          mantenimiento: nota.mantenimiento !== "" ? parseFloat(nota.mantenimiento) : null,
          sistema_hidraulico: nota.sistema_hidraulico !== "" ? parseFloat(nota.sistema_hidraulico) : null,
          seguridad: nota.seguridad !== "" ? parseFloat(nota.seguridad) : null,
          ingles: nota.ingles !== "" ? parseFloat(nota.ingles) : null,
          operacion: nota.operacion !== "" ? parseFloat(nota.operacion) : null,
          asistencia_total: nota.asistencia_total !== "" ? parseFloat(nota.asistencia_total) : null,
        };
        const res = await fetch("/api/notas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Error guardando notas de matrícula ${row.id}`);
      });

      await Promise.all(promises);
      setSaveStatus("success");
      // reload to get fresh data
      await loadAlumnos(selectedModulo);
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const selectedModuloObj = modulos.find((m) => m.id === selectedModulo);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
        <div className="mb-4">
          <h2 className="section-title">Módulo de Docentes</h2>
          <p className="section-subtitle">Registre notas y asistencia por módulo académico</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="form-label">Seleccionar Módulo</label>
            <div className="relative">
              <select
                id="docentes-modulo-select"
                className="select-field pr-9"
                value={selectedModulo}
                onChange={handleModuloChange}
                disabled={loadingModulos}
              >
                <option value="">
                  {loadingModulos ? "Cargando módulos…" : "— Seleccione un módulo —"}
                </option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.modalidad})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          {selectedModuloObj && (
            <div
              className="rounded-lg p-3 flex items-center gap-4"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <div className="text-xs space-y-1">
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Modalidad:</span>{" "}
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>
                    {selectedModuloObj.modalidad}
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Duración:</span>{" "}
                  {selectedModuloObj.duracion}h
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Período:</span>{" "}
                  {selectedModuloObj.fecha_inicio} → {selectedModuloObj.fecha_fin}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}
      {saveStatus === "success" && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          Notas guardadas exitosamente en Supabase.
        </div>
      )}

      {/* Notas table */}
      {selectedModulo && (
        <div className="glass-card overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: "var(--accent-primary)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Alumnos matriculados
              </span>
              {!loadingAlumnos && (
                <span className="badge badge-blue">{matriculas.length}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                id="docentes-reload-btn"
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: 12 }}
                onClick={() => loadAlumnos(selectedModulo)}
                disabled={loadingAlumnos}
              >
                <RefreshCw size={13} />
                Recargar
              </button>
              <button
                id="docentes-save-btn"
                className="btn-primary"
                style={{ padding: "8px 14px", fontSize: 12 }}
                onClick={handleSave}
                disabled={saving || matriculas.length === 0}
              >
                <Save size={13} />
                {saving ? "Guardando…" : "Sincronizar Notas"}
              </button>
            </div>
          </div>

          {loadingAlumnos ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 rounded" />
              ))}
            </div>
          ) : matriculas.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
              <Users size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
              <p className="text-sm">No hay alumnos matriculados en este módulo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>DNI</th>
                    <th>Apellidos y Nombres</th>
                    {SUBJECTS.map((s) => (
                      <th key={s.key}>{s.label}</th>
                    ))}
                    <th>Asistencia %</th>
                    <th>Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((row, idx) => {
                    const nota = notasMap[row.id] ?? {};
                    const prom = calcPromedio(nota as Nota);
                    return (
                      <tr key={row.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{idx + 1}</td>
                        <td>
                          <span className="font-mono text-xs badge badge-blue">{row.alumnos?.dni}</span>
                        </td>
                        <td>
                          <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                            {row.alumnos?.apellidos}, {row.alumnos?.nombres}
                          </div>
                          <div className="text-xs mt-1">
                            <span style={carreraBadgeStyle(row.alumnos?.carrera ?? "")}>{row.alumnos?.carrera}</span>
                          </div>
                        </td>
                        {SUBJECTS.map((s) => (
                          <td key={s.key}>
                            <input
                              id={`nota-${row.id}-${s.key}`}
                              className="nota-input"
                              type="number"
                              min={0}
                              max={20}
                              step={0.5}
                              placeholder="—"
                              value={nota[s.key] ?? ""}
                              onChange={(e) => handleNotaChange(row.id, s.key, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            id={`nota-${row.id}-asistencia`}
                            className="nota-input"
                            type="number"
                            min={0}
                            max={100}
                            placeholder="—"
                            value={nota.asistencia_total ?? ""}
                            onChange={(e) =>
                              handleNotaChange(row.id, "asistencia_total", e.target.value)
                            }
                            style={{ width: 64 }}
                          />
                        </td>
                        <td>
                          <span
                            className="text-base font-bold"
                            style={{ color: promedioColor(prom) }}
                          >
                            {prom}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedModulo && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          <Users size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p className="text-sm">Seleccione un módulo para ver y editar las notas</p>
        </div>
      )}
    </div>
  );
}
