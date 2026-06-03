"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  ChevronRight,
  User,
  BookOpen,
  History
} from "lucide-react";
import Modal from "./Modal";
import AlertDialog from "./AlertDialog";

interface Alumno {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  carrera: string;
}

interface Pension {
  id: string;
  modulo_id: string;
  nro_recibo: string;
  monto_pagado: number;
  deuda_pendiente: number;
  fecha_pago: string;
  modulos: { nombre: string } | null;
}

interface Matricula {
  id: string;
  modulo_id: string;
  modulos: { id: string; nombre: string; horario: string };
}

export default function PensionesView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ open: boolean; message: string; type: "success" | "error" | "info" }>({ open: false, message: "", type: "info" });

  const [form, setForm] = useState({
    modulo_id: "",
    nro_recibo: "",
    monto_pagado: "",
    deuda_pendiente: "",
    fecha_pago: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      async function fetchAlumnos() {
        setLoadingAlumnos(true);
        try {
          const res = await fetch(`/api/alumnos?search=${searchQuery}&pageSize=20`);
          const json = await res.json();
          setAlumnos(json.data || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingAlumnos(false);
        }
      }
      fetchAlumnos();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedAlumno) return;
    async function fetchAlumnoData() {
      setLoadingData(true);
      try {
        const [matRes, penRes] = await Promise.all([
          fetch(`/api/matriculas?alumno_id=${selectedAlumno?.id}`),
          fetch(`/api/pensiones?alumno_id=${selectedAlumno?.id}`)
        ]);
        const matData = await matRes.json();
        const penData = await penRes.json();
        setMatriculas(Array.isArray(matData) ? matData : []);
        setPensiones(Array.isArray(penData) ? penData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    }
    fetchAlumnoData();
  }, [selectedAlumno]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function openPagoModal(modulo_id: string = "") {
    setForm({
      modulo_id,
      nro_recibo: "",
      monto_pagado: "",
      deuda_pendiente: "",
      fecha_pago: new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAlumno) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/pensiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          alumno_id: selectedAlumno.id,
          monto_pagado: parseFloat(form.monto_pagado),
          deuda_pendiente: parseFloat(form.deuda_pendiente || "0"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");
      setAlertInfo({ open: true, message: `Pago registrado: Recibo ${form.nro_recibo}`, type: "success" });
      setShowForm(false);
      
      const penRes = await fetch(`/api/pensiones?alumno_id=${selectedAlumno.id}`);
      const penData = await penRes.json();
      setPensiones(Array.isArray(penData) ? penData : []);
    } catch (err) {
      setAlertInfo({ open: true, message: err instanceof Error ? err.message : "Error desconocido", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  // Cálculos de deuda
  let deudaTotal = 0;
  const pagosPorModulo: Record<string, Pension[]> = {};
  pensiones.forEach(p => {
    if (!p.modulo_id) return;
    if (!pagosPorModulo[p.modulo_id]) pagosPorModulo[p.modulo_id] = [];
    pagosPorModulo[p.modulo_id].push(p);
  });

  const deudaPorModulo: Record<string, number> = {};
  const pagadoPorModulo: Record<string, number> = {};

  for (const modId in pagosPorModulo) {
    const pagos = pagosPorModulo[modId].sort((a,b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
    pagadoPorModulo[modId] = pagos.reduce((sum, p) => sum + p.monto_pagado, 0);
    if (pagos.length > 0) {
      deudaPorModulo[modId] = pagos[0].deuda_pendiente;
      deudaTotal += pagos[0].deuda_pendiente;
    }
  }

  const totalPagado = pensiones.reduce((sum, p) => sum + p.monto_pagado, 0);

  return (
    <div className="w-full space-y-6 flex gap-6" style={{ height: "calc(100vh - 120px)" }}>
      {/* ── ALERTS ── */}
      <AlertDialog open={alertInfo.open} onClose={() => setAlertInfo((p) => ({ ...p, open: false }))} message={alertInfo.message} type={alertInfo.type} />

      {/* ── LEFT PANEL: BÚSQUEDA ── */}
      <div className="glass-card flex flex-col w-1/3" style={{ border: "1px solid rgba(42,109,181,0.2)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(42,109,181,0.15)", background: "rgba(8,16,34,0.95)" }}>
          <h2 className="text-lg font-bold text-white mb-1">Buscar Alumno</h2>
          <p className="text-xs text-blue-300 opacity-70 mb-4">Ingrese DNI o Apellidos</p>
          <div className="relative" style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.6)" }} />
            <input
              className="w-full text-white rounded-lg outline-none"
              style={{ height: 40, paddingLeft: 36, paddingRight: 16, background: "rgba(10,22,44,0.7)", border: "1px solid rgba(42,109,181,0.3)" }}
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: "rgba(8,16,34,0.6)" }}>
          {loadingAlumnos ? (
            <div className="text-center py-10 text-xs text-blue-400 opacity-60">Buscando...</div>
          ) : alumnos.length === 0 ? (
            <div className="text-center py-10 text-xs text-blue-400 opacity-60">No se encontraron resultados</div>
          ) : (
            alumnos.map((a) => (
              <div 
                key={a.id} 
                onClick={() => setSelectedAlumno(a)}
                className="cursor-pointer rounded-xl p-3 transition-all"
                style={{
                  marginBottom: 8,
                  background: selectedAlumno?.id === a.id ? "rgba(42,109,181,0.15)" : "transparent",
                  border: `1px solid ${selectedAlumno?.id === a.id ? "rgba(74,179,216,0.4)" : "rgba(42,109,181,0.1)"}`
                }}
              >
                <div className="font-bold text-sm text-blue-100">{a.apellidos}, {a.nombres}</div>
                <div className="text-xs flex gap-3 mt-1 text-blue-400 opacity-80">
                  <span className="flex items-center gap-1"><User size={10} /> {a.dni}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: DETALLES Y PAGOS ── */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        {!selectedAlumno ? (
          <div className="glass-card flex-1 flex flex-col items-center justify-center opacity-50" style={{ border: "1px dashed rgba(42,109,181,0.3)" }}>
            <CreditCard size={48} className="text-blue-400 mb-4" />
            <p className="text-sm text-blue-200">Seleccione un alumno de la lista para ver sus pagos</p>
          </div>
        ) : (
          <>
            <div className="glass-card flex justify-between items-center" style={{ padding: 24, border: "1px solid rgba(42,109,181,0.2)" }}>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedAlumno.apellidos}, {selectedAlumno.nombres}</h2>
                <div className="flex gap-4 mt-2 text-xs text-blue-300 opacity-80">
                  <span className="flex items-center gap-1"><User size={12} /> {selectedAlumno.dni}</span>
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {selectedAlumno.carrera}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-400 opacity-60">Total Pagado</div>
                  <div className="text-lg font-bold text-emerald-400">S/ {totalPagado.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase font-bold text-blue-400 opacity-60">Deuda Total</div>
                  <div className={`text-lg font-bold ${deudaTotal > 0 ? "text-red-400" : "text-emerald-400"}`}>S/ {deudaTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 ts-scroll pr-2">
              {loadingData ? (
                <div className="text-center py-10 text-xs text-blue-400 opacity-60">Cargando datos del alumno...</div>
              ) : (
                <>
                  {/* MÓDULOS */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3">Módulos Matriculados</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {matriculas.map(m => {
                        const deuda = deudaPorModulo[m.modulo_id] || 0;
                        const pagado = pagadoPorModulo[m.modulo_id] || 0;
                        return (
                          <div key={m.id} className="glass-card flex flex-col justify-between" style={{ padding: 16, border: "1px solid rgba(42,109,181,0.15)" }}>
                            <div>
                              <div className="font-bold text-sm text-blue-100">{m.modulos?.nombre}</div>
                              <div className="text-xs text-blue-400 opacity-60 mt-1">{m.modulos?.horario || "Sin horario"}</div>
                            </div>
                            <div className="mt-4 border-t border-blue-900 border-opacity-30 flex justify-between items-end" style={{ paddingTop: 16 }}>
                              <div>
                                <div className="text-[10px] text-emerald-400 font-bold mb-1">Pagado: S/ {pagado.toFixed(2)}</div>
                                <div className={`text-[10px] font-bold ${deuda > 0 ? "text-red-400" : "text-blue-400 opacity-50"}`}>
                                  {deuda > 0 ? `Debe: S/ ${deuda.toFixed(2)}` : "Sin deuda pendiente"}
                                </div>
                              </div>
                              <button onClick={() => openPagoModal(m.modulo_id)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-md flex items-center gap-1 transition-colors" style={{ padding: "6px 12px" }}>
                                <Plus size={12} /> Registrar Pago
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {matriculas.length === 0 && (
                        <div className="col-span-2 text-xs text-blue-400 opacity-50 border border-blue-900 border-opacity-30 rounded-lg text-center" style={{ padding: 16 }}>
                          El alumno no está matriculado en ningún módulo.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HISTORIAL */}
                  <div>
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={14} /> Historial de Pagos</h3>
                    <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(42,109,181,0.15)" }}>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-blue-900 bg-opacity-20 text-blue-400">
                            <th className="font-semibold uppercase tracking-wider" style={{ padding: 12 }}>Fecha</th>
                            <th className="font-semibold uppercase tracking-wider" style={{ padding: 12 }}>Recibo</th>
                            <th className="font-semibold uppercase tracking-wider" style={{ padding: 12 }}>Módulo</th>
                            <th className="font-semibold uppercase tracking-wider" style={{ padding: 12 }}>Monto</th>
                            <th className="font-semibold uppercase tracking-wider" style={{ padding: 12 }}>Restante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pensiones.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-blue-400 opacity-50" style={{ padding: 24 }}>No hay pagos registrados.</td></tr>
                          ) : (
                            pensiones.map(p => (
                              <tr key={p.id} className="border-t border-blue-900 border-opacity-20 hover:bg-blue-900 hover:bg-opacity-10">
                                <td className="text-blue-200" style={{ padding: 12 }}>{p.fecha_pago}</td>
                                <td className="font-mono text-blue-300" style={{ padding: 12 }}>{p.nro_recibo}</td>
                                <td className="text-blue-200" style={{ padding: 12 }}>{p.modulos?.nombre || "—"}</td>
                                <td className="font-bold text-emerald-400" style={{ padding: 12 }}>S/ {p.monto_pagado.toFixed(2)}</td>
                                <td className="font-bold text-red-400" style={{ padding: 12 }}>{p.deuda_pendiente > 0 ? `S/ ${p.deuda_pendiente.toFixed(2)}` : "—"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL NUEVO PAGO ── */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Registrar Pago" maxWidth="500px">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Módulo *</label>
            <select name="modulo_id" value={form.modulo_id} onChange={handleFormChange} required className="w-full h-10 text-sm bg-blue-950 bg-opacity-50 border border-blue-800 rounded-lg text-white outline-none" style={{ padding: "0 12px" }}>
              <option value="">— Seleccionar —</option>
              {matriculas.map(m => (
                <option key={m.id} value={m.modulo_id}>{m.modulos?.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">N° de Recibo *</label>
            <input name="nro_recibo" value={form.nro_recibo} onChange={handleFormChange} required placeholder="Ej: REC-001" className="w-full h-10 text-sm bg-blue-950 bg-opacity-50 border border-blue-800 rounded-lg text-white outline-none" style={{ padding: "0 12px" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Monto Pagado (S/) *</label>
              <input name="monto_pagado" type="number" min="0" step="0.01" value={form.monto_pagado} onChange={handleFormChange} required placeholder="0.00" className="w-full h-10 text-sm bg-blue-950 bg-opacity-50 border border-emerald-800 rounded-lg text-emerald-400 font-bold outline-none" style={{ padding: "0 12px" }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Deuda Restante (S/)</label>
              <input name="deuda_pendiente" type="number" min="0" step="0.01" value={form.deuda_pendiente} onChange={handleFormChange} placeholder="0.00" className="w-full h-10 text-sm bg-blue-950 bg-opacity-50 border border-red-800 rounded-lg text-red-400 font-bold outline-none" style={{ padding: "0 12px" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Fecha de Pago *</label>
            <input name="fecha_pago" type="date" value={form.fecha_pago} onChange={handleFormChange} required className="w-full h-10 text-sm bg-blue-950 bg-opacity-50 border border-blue-800 rounded-lg text-white outline-none" style={{ padding: "0 12px", colorScheme: "dark" }} />
          </div>
          <div className="flex justify-end gap-3 border-t border-blue-900 border-opacity-30" style={{ paddingTop: 16 }}>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs font-bold text-blue-300 hover:text-white transition-colors" style={{ padding: "8px 16px" }}>Cancelar</button>
            <button type="submit" disabled={submitting} className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors" style={{ padding: "8px 20px" }}>
              <CreditCard size={14} /> {submitting ? "Guardando..." : "Confirmar Pago"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
