"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Mail, Loader2, Search, Save, CheckCircle, AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import AlertDialog from "./AlertDialog";

interface Administrador {
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
  outline: "none"
};

const fieldLabel: React.CSSProperties = {
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

interface Props {
  currentUserEmail?: string;
}

export default function GestionAdminsView({ currentUserEmail = "" }: Props) {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delTarget, setDelTarget] = useState<Administrador | null>(null);
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
  const [password, setPassword] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    try {
      const res = await fetch("/api/administradores");
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function flash(type: "success" | "error", text: string) {
    setMsg({ open: true, type, text });
  }

  function resetForm() {
    setNombres("");
    setApellidos("");
    setEmail("");
    setPassword("");
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
      const res = await fetch("/api/administradores", {
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
        throw new Error(data.error || "Error al crear la cuenta de administrador");
      }
      flash("success", `El administrador "${nombres} ${apellidos}" se ha registrado correctamente.`);
      setShowModal(false);
      resetForm();
      loadAdmins();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!delTarget) return;
    if (delTarget.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      flash("error", "No puedes eliminar tu propia cuenta de administrador en sesión.");
      setDelTarget(null);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/administradores?id=${delTarget.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al eliminar la cuenta");
      }
      flash("success", `La cuenta de "${delTarget.nombres} ${delTarget.apellidos}" se eliminó correctamente.`);
      setDelTarget(null);
      loadAdmins();
    } catch (err: any) {
      flash("error", err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .btn-hover {
          transition: all 0.2s;
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
      `}} />

      {/* Header */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#dbeafe", marginBottom: 4 }}>Administradores del Sistema</h2>
          <p style={{ fontSize: 13, color: "rgba(74,179,216,0.6)", margin: 0 }}>
            Cree y gestione los accesos para las cuentas administrativas de la intranet
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 260 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(74,179,216,0.5)" }} />
            <input
              type="text"
              placeholder="Buscar administrador..."
              style={{ ...inpStyle, paddingLeft: 34, fontSize: 12, height: 38 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button style={{ ...btnPrimary, height: 38 }} className="btn-hover" onClick={() => { resetForm(); setShowModal(true); }}>
            <UserPlus size={15} /> Registrar Admin
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

      {/* Admin List */}
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Loader2 className="animate-spin" size={20} /> Cargando administradores...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "rgba(74,179,216,0.4)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No hay administradores registrados.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(42,109,181,0.14)", background: "rgba(10,22,44,0.3)" }}>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Nombre</th>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Email</th>
                  <th style={{ padding: "12px 18px", fontSize: 10, fontWeight: 600, color: "rgba(74,179,216,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Estado</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admins
                  .filter((a) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      a.nombres.toLowerCase().includes(q) ||
                      a.apellidos.toLowerCase().includes(q) ||
                      a.email.toLowerCase().includes(q)
                    );
                  })
                  .map((a) => {
                    const isSelf = a.email.toLowerCase() === currentUserEmail.toLowerCase();
                    return (
                      <tr key={a.id} className="ts-tbl-row">
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#dbeafe", fontSize: 14 }}>
                            {a.apellidos}, {a.nombres}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px", color: "rgba(180,210,240,0.85)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Mail size={12} style={{ color: "rgba(74,179,216,0.5)" }} /> {a.email}
                          </div>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ 
                            padding: "4px 9px", 
                            borderRadius: 20, 
                            fontSize: 10, 
                            fontWeight: 700, 
                            letterSpacing: "0.03em",
                            background: "rgba(52,211,153,0.14)", 
                            color: "#34d399" 
                          }}>
                            {isSelf ? "SESIÓN ACTIVA" : "ACTIVO"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          {!isSelf && (
                            <button
                              title="Eliminar Cuenta"
                              style={{
                                background: "rgba(248,113,113,0.1)",
                                border: "1px solid rgba(248,113,113,0.25)",
                                color: "rgba(248,113,113,0.85)",
                                cursor: "pointer",
                                padding: "5px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                transition: "all 0.2s",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#f87171";
                                e.currentTarget.style.background = "rgba(248,113,113,0.18)";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.45)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "rgba(248,113,113,0.85)";
                                e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)";
                              }}
                              onClick={() => setDelTarget(a)}
                            >
                              <Trash2 size={12} />
                              <span>Eliminar</span>
                            </button>
                          )}
                          {isSelf && (
                            <span style={{ fontSize: 11, color: "rgba(74,179,216,0.4)", fontStyle: "italic" }}>No eliminable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar Administrador */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Administrador">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={fieldLabel}>Nombres *</label>
              <input
                type="text"
                className="ts-input"
                style={inpStyle}
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                placeholder="Ej. Ana María"
                required
              />
            </div>
            <div>
              <label style={fieldLabel}>Apellidos *</label>
              <input
                type="text"
                className="ts-input"
                style={inpStyle}
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                placeholder="Ej. Salas Torres"
                required
              />
            </div>
          </div>

          <div>
            <label style={fieldLabel}>Correo Electrónico *</label>
            <input
              type="email"
              className="ts-input"
              style={inpStyle}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin.nuevo@tecsur.edu.pe"
              required
            />
          </div>

          <div>
            <label style={fieldLabel}>Contraseña de Acceso *</label>
            <input
              type="password"
              className="ts-input"
              style={inpStyle}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, borderTop: "1px solid rgba(42,109,181,0.12)", paddingTop: 14 }}>
            <button type="button" style={btnSecondary} className="btn-hover" onClick={() => setShowModal(false)} disabled={submitting}>
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

      {/* Modal: Confirmar Eliminación */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        loading={submitting}
        title="Confirmar Eliminación"
        description="Esta acción eliminará de forma permanente el acceso administrativo y su registro. No se puede deshacer."
      >
        {delTarget && (
          <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, marginTop: 8 }}>
            <div style={{ fontWeight: 700, color: "#f87171", fontSize: 13 }}>
              {delTarget.apellidos}, {delTarget.nombres}
            </div>
            <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)", marginTop: 2 }}>
              {delTarget.email}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
