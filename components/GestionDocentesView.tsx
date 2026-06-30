"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Mail, Key, ShieldAlert, CheckCircle, Save, Loader2, Pencil, Search } from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import AlertDialog from "./AlertDialog";

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  created_at: string;
  dni?: string;
  activo?: boolean;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(8,16,34,0.85)",
  border: "1px solid rgba(42,109,181,0.18)",
  borderRadius: 14,
  backdropFilter: "blur(12px)",
  padding: "24px 28px"
};

const inpStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  boxSizing: "border-box",
  background: "rgba(10,22,44,0.7)",
  border: "1px solid rgba(42,109,181,0.22)",
  borderRadius: 10,
  padding: "0 14px",
  color: "#dbeafe",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none"
};

const lblStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(74,179,216,0.75)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #1a4a7a 0%, #2a6db5 55%, #4ab3d8 100%)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(42,109,181,0.25)"
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 18px",
  borderRadius: 10,
  background: "rgba(42,109,181,0.1)",
  border: "1px solid rgba(42,109,181,0.22)",
  color: "rgba(120,160,210,0.85)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer"
};

export default function GestionDocentesView() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delTarget, setDelTarget] = useState<Docente | null>(null);
  const [resetTarget, setResetTarget] = useState<Docente | null>(null);
  const [editTarget, setEditTarget] = useState<Docente | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Docente | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [msg, setMsg] = useState<{ open: boolean; type: "success" | "error"; text: string }>({
    open: false,
    type: "success",
    text: ""
  });

  // Form states
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");

  useEffect(() => {
    loadDocentes();
  }, []);

  async function loadDocentes() {
    setLoading(true);
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      setDocentes(Array.isArray(data) ? data : []);
    } catch {
      flash("error", "Error al cargar los docentes");
    } finally {
      setLoading(false);
    }
  }

  function flash(type: "success" | "error", text: string) {
    setMsg({ open: true, type, text });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !dni.trim()) {
      flash("error", "Todos los campos son obligatorios");
      return;
    }
    if (dni.length < 6) {
      flash("error", "El DNI debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          email: email.trim().toLowerCase(),
          dni: dni.trim(),
          password: dni.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al crear docente");
      }
      flash("success", `Docente "${data.nombres} ${data.apellidos}" creado correctamente`);
      setShowModal(false);
      resetForm();
      loadDocentes();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!delTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/docentes?id=${delTarget.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar docente");
      }
      flash("success", "Docente eliminado de manera exitosa");
      setDelTarget(null);
      loadDocentes();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!resetTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/docentes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resetTarget.id,
          action: "reset-password"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al restablecer la contraseña");
      }
      flash("success", `La contraseña de "${resetTarget.nombres} ${resetTarget.apellidos}" se restableció correctamente a su DNI.`);
      setResetTarget(null);
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!toggleTarget) return;
    setSubmitting(true);
    try {
      const nextActive = toggleTarget.activo === false;
      const res = await fetch("/api/docentes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: toggleTarget.id,
          action: "toggle-active",
          active: nextActive
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar estado del docente");
      }
      flash("success", data.message || `Estado del docente actualizado correctamente`);
      setToggleTarget(null);
      loadDocentes();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !dni.trim()) {
      flash("error", "Todos los campos son obligatorios");
      return;
    }
    if (dni.length < 6) {
      flash("error", "El DNI debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/docentes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTarget.id,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          email: email.trim().toLowerCase(),
          dni: dni.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar docente");
      }
      flash("success", `Docente "${data.nombres} ${data.apellidos}" actualizado correctamente`);
      setShowModal(false);
      setEditTarget(null);
      resetForm();
      loadDocentes();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(d: Docente) {
    setEditTarget(d);
    setNombres(d.nombres);
    setApellidos(d.apellidos);
    setEmail(d.email);
    setDni(d.dni || "");
    setShowModal(true);
  }

  function resetForm() {
    setNombres("");
    setApellidos("");
    setEmail("");
    setDni("");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .doc-card-hover:hover {
          border-color: rgba(74,179,216,0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .btn-hover:hover {
          filter: brightness(1.1);
        }
        .ts-tbl-row {
          border-bottom: 1px solid rgba(42,109,181,0.08);
          transition: background 0.2s;
        }
        .ts-tbl-row:hover {
          background: rgba(42,109,181,0.04);
        }
      `}</style>

      {/* Header */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", marginBottom: 4 }}>Cuentas de Docentes</h2>
          <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)", margin: 0 }}>
            Cree y gestione los accesos para los docentes del instituto
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 260 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)" }} />
            <input
              type="text"
              placeholder="Buscar docente o DNI..."
              style={{ ...inpStyle, paddingLeft: 34, fontSize: 12, height: 38 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={{ ...btnPrimary, height: 38 }} className="btn-hover" onClick={() => { resetForm(); setShowModal(true); }}>
            <UserPlus size={15} /> Registrar Docente
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AlertDialog
        open={msg.open}
        onClose={() => setMsg(p => ({ ...p, open: false }))}
        message={msg.text}
        type={msg.type}
      />

      {/* Docentes List */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Loader2 className="animate-spin" size={20} /> Cargando docentes...
          </div>
        ) : docentes.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No hay docentes registrados en la base de datos.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.14)", background: "rgba(10,22,44,0.3)" }}>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Docente</th>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Email</th>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Estado</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentes
                  .filter((d) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      d.nombres.toLowerCase().includes(q) ||
                      d.apellidos.toLowerCase().includes(q) ||
                      d.email.toLowerCase().includes(q) ||
                      (d.dni || "").toLowerCase().includes(q)
                    );
                  })
                  .map((d) => (
                  <tr key={d.id} className="ts-tbl-row">
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#dbeafe", fontSize: 14 }}>
                        {d.apellidos}, {d.nombres}
                      </div>
                      {(d as any).dni && (
                        <div style={{ fontSize: 11, color: "rgba(74,179,216,0.6)", marginTop: 2 }}>
                          DNI: {(d as any).dni}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px", color: "rgba(180,210,240,0.85)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={12} style={{ color: "rgba(74,179,216,0.5)" }} /> {d.email}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ 
                        padding: "4px 9px", 
                        borderRadius: 20, 
                        fontSize: 10, 
                        fontWeight: 700, 
                        letterSpacing: "0.03em",
                        background: (d as any).activo !== false ? "rgba(52,211,153,0.14)" : "rgba(248,113,113,0.14)", 
                        color: (d as any).activo !== false ? "#34d399" : "#f87171" 
                      }}>
                        {(d as any).activo !== false ? "ACTIVO" : "DE BAJA"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        title={(d as any).activo !== false ? "Dar de Baja (Suspender)" : "Dar de Alta (Activar)"}
                        style={{
                          background: (d as any).activo !== false ? "rgba(234,88,12,0.1)" : "rgba(5,150,105,0.1)",
                          border: (d as any).activo !== false ? "1px solid rgba(234,88,12,0.25)" : "1px solid rgba(5,150,105,0.25)",
                          color: (d as any).activo !== false ? "rgba(234,88,12,0.85)" : "rgba(5,150,105,0.85)",
                          cursor: "pointer",
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.2s",
                          marginRight: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = (d as any).activo !== false ? "#ea580c" : "#059669";
                          e.currentTarget.style.background = (d as any).activo !== false ? "rgba(234,88,12,0.18)" : "rgba(5,150,105,0.18)";
                          e.currentTarget.style.borderColor = (d as any).activo !== false ? "rgba(234,88,12,0.45)" : "rgba(5,150,105,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = (d as any).activo !== false ? "rgba(234,88,12,0.85)" : "rgba(5,150,105,0.85)";
                          e.currentTarget.style.background = (d as any).activo !== false ? "rgba(234,88,12,0.1)" : "rgba(5,150,105,0.1)";
                          e.currentTarget.style.borderColor = (d as any).activo !== false ? "rgba(234,88,12,0.25)" : "rgba(5,150,105,0.25)";
                        }}
                        onClick={() => setToggleTarget(d)}
                      >
                        {(d as any).activo !== false ? <ShieldAlert size={12} /> : <CheckCircle size={12} />}
                        <span>{(d as any).activo !== false ? "Dar de baja" : "Activar"}</span>
                      </button>
                      <button
                        title="Restablecer Contraseña (a DNI)"
                        style={{
                          background: "rgba(74,179,216,0.1)",
                          border: "1px solid rgba(74,179,216,0.25)",
                          color: "rgba(74,179,216,0.85)",
                          cursor: "pointer",
                          padding: "5px 10px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 0.2s",
                          marginRight: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#4ab3d8";
                          e.currentTarget.style.background = "rgba(74,179,216,0.18)";
                          e.currentTarget.style.borderColor = "rgba(74,179,216,0.45)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(74,179,216,0.85)";
                          e.currentTarget.style.background = "rgba(74,179,216,0.1)";
                          e.currentTarget.style.borderColor = "rgba(74,179,216,0.25)";
                        }}
                        onClick={() => setResetTarget(d)}
                      >
                        <Key size={12} />
                        <span>Restablecer contraseña</span>
                      </button>
                      <button
                        title="Editar Datos del Docente"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(74,179,216,0.5)",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                          transition: "all 0.2s",
                          marginRight: 8
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#4ab3d8";
                          e.currentTarget.style.background = "rgba(74,179,216,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(74,179,216,0.5)";
                          e.currentTarget.style.background = "transparent";
                        }}
                        onClick={() => openEdit(d)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        title="Eliminar Docente"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(248,113,113,0.5)",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#f87171";
                          e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(248,113,113,0.5)";
                          e.currentTarget.style.background = "transparent";
                        }}
                        onClick={() => setDelTarget(d)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New/Edit Docente */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditTarget(null); resetForm(); }} title={editTarget ? "Editar Datos del Docente" : "Registrar Nuevo Docente"} maxWidth="450px">
        <form onSubmit={editTarget ? handleUpdate : handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={lblStyle}>Nombres *</label>
            <input
              style={inpStyle}
              placeholder="Nombres del docente"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label style={lblStyle}>Apellidos *</label>
            <input
              style={inpStyle}
              placeholder="Apellidos del docente"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={lblStyle}>Email Institucional *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inpStyle, paddingLeft: 36 }}
                type="email"
                placeholder="ej: profesor@tecsur.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)" }} />
            </div>
          </div>
          <div>
            <label style={lblStyle}>{editTarget ? "DNI del Docente *" : "DNI del Docente (Contraseña por defecto) *"}</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inpStyle, paddingLeft: 36 }}
                type="text"
                placeholder="DNI de 8 dígitos"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                required
              />
              <Key size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" style={btnSecondary} onClick={() => { setShowModal(false); setEditTarget(null); resetForm(); }}>
              Cancelar
            </button>
            <button type="submit" style={btnPrimary} className="btn-hover" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> {editTarget ? "Guardando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save size={14} /> {editTarget ? "Guardar" : "Registrar"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm deletion */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={submitting}
        title="¿Eliminar Docente?"
        description="Esta acción eliminará de forma permanente la cuenta de Supabase Auth del docente y sus datos en la base de datos de TECSUR. Los módulos que tenía asignados quedarán sin docente asignado."
      >
        <div style={{ margin: "10px 0", padding: "10px 14px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>
            {delTarget?.apellidos}, {delTarget?.nombres}
          </div>
          <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)", marginTop: 2 }}>{delTarget?.email}</div>
        </div>
      </ConfirmDialog>

      {/* Confirm reset password */}
      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
        loading={submitting}
        title="¿Restablecer Contraseña?"
        description="Esta acción restablecerá la contraseña de la cuenta del docente. Su nueva contraseña volverá a ser su DNI registrado."
      >
        <div style={{ margin: "10px 0", padding: "10px 14px", background: "rgba(74,179,216,0.05)", border: "1px solid rgba(74,179,216,0.15)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ab3d8" }}>
            {resetTarget?.apellidos}, {resetTarget?.nombres}
          </div>
          {resetTarget && (
            <div style={{ fontSize: 11, color: "rgba(74,179,216,0.7)", marginTop: 2 }}>
              DNI / Contraseña nueva: {(resetTarget as any).dni || "No registrado"}
            </div>
          )}
        </div>
      </ConfirmDialog>

      {/* Confirm toggle active/ban */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        loading={submitting}
        title={toggleTarget?.activo !== false ? "¿Dar de Baja al Docente?" : "¿Activar Docente?"}
        description={
          toggleTarget?.activo !== false
            ? "El docente no podrá iniciar sesión en la intranet de TECSUR. Sus datos históricos y asignaciones de cursos se conservarán."
            : "El docente recuperará su acceso y podrá volver a iniciar sesión en la intranet de TECSUR."
        }
        confirmText={toggleTarget?.activo !== false ? "Dar de baja" : "Activar"}
        confirmBg={toggleTarget?.activo !== false ? "linear-gradient(135deg,#c2410c,#ea580c)" : "linear-gradient(135deg,#047857,#059669)"}
        confirmShadow={toggleTarget?.activo !== false ? "0 4px 16px rgba(234,88,12,0.3)" : "0 4px 16px rgba(5,96,105,0.3)"}
      >
        {toggleTarget && (
          <div style={{ margin: "10px 0", padding: "10px 14px", background: "rgba(42,109,181,0.05)", border: "1px solid rgba(42,109,181,0.15)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>
              {toggleTarget.apellidos}, {toggleTarget.nombres}
            </div>
            <div style={{ fontSize: 11, color: "rgba(120,160,210,0.7)", marginTop: 2 }}>{toggleTarget.email}</div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
