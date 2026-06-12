"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Mail, Key, ShieldAlert, CheckCircle, Save, Loader2 } from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import AlertDialog from "./AlertDialog";

interface Docente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  created_at: string;
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
  const [msg, setMsg] = useState<{ open: boolean; type: "success" | "error"; text: string }>({
    open: false,
    type: "success",
    text: ""
  });

  // Form states
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    if (!nombres.trim() || !apellidos.trim() || !email.trim() || !password.trim()) {
      flash("error", "Todos los campos son obligatorios");
      return;
    }
    if (password.length < 6) {
      flash("error", "La contraseña debe tener al menos 6 caracteres");
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
          password
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

  function resetForm() {
    setNombres("");
    setApellidos("");
    setEmail("");
    setPassword("");
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
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", marginBottom: 4 }}>Cuentas de Docentes</h2>
            <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)" }}>
              Cree y gestione los accesos para los docentes del instituto
            </p>
          </div>
          <button style={btnPrimary} className="btn-hover" onClick={() => { resetForm(); setShowModal(true); }}>
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
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Fecha Registro</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docentes.map((d) => (
                  <tr key={d.id} className="ts-tbl-row">
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ fontWeight: 700, color: "#dbeafe", fontSize: 14 }}>
                        {d.apellidos}, {d.nombres}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: "rgba(180,210,240,0.85)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={12} style={{ color: "rgba(74,179,216,0.5)" }} /> {d.email}
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", color: "rgba(180,210,240,0.6)", fontSize: 12 }}>
                      {new Date(d.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
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

      {/* Modal: New Docente */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Nuevo Docente" maxWidth="450px">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <label style={lblStyle}>Contraseña de Acceso *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inpStyle, paddingLeft: 36 }}
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Key size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" style={btnSecondary} onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" style={btnPrimary} className="btn-hover" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Creando...
                </>
              ) : (
                <>
                  <Save size={14} /> Registrar
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
    </div>
  );
}
