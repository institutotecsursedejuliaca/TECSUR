"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, AlertTriangle, ChevronRight, X, CheckCircle, GraduationCap, MapPin, User } from "lucide-react";

interface ModuloAlarmaProps {
  onNavigateModulo?: (view: string) => void;
  docenteId?: string | null;
  userRole?: "admin" | "docente" | null;
}

interface ModuloAlertItem {
  id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  aula?: string | null;
  profesor?: string | null;
  carreras?: { id: string; nombre: string } | null;
  diffDays: number;
}

export default function ModuloAlarma({ onNavigateModulo, docenteId, userRole }: ModuloAlarmaProps) {
  const [open, setOpen] = useState(false);
  const [modulesEnding, setModulesEnding] = useState<ModuloAlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function checkModulesEnding() {
    try {
      setLoading(true);
      const now = new Date();
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const endingList: ModuloAlertItem[] = [];

      if (docenteId || userRole === "docente") {
        // Para docentes: consultar los cursos asignados al docente
        const url = docenteId ? `/api/cursos?docente_id=${docenteId}` : "/api/cursos";
        const res = await fetch(url, { cache: "no-store" });
        const cursos = await res.json();

        if (Array.isArray(cursos)) {
          const seenModulos = new Set<string>();

          cursos.forEach((c: any) => {
            const m = c.modulos;
            if (!m || !m.fecha_fin) return;

            // Evitar duplicar si el docente tiene múltiples cursos en el mismo módulo
            const dedupeKey = `${m.id}_${c.id}`;
            if (seenModulos.has(dedupeKey)) return;
            seenModulos.add(dedupeKey);

            // El módulo concluye a las 23:59:59 del día de fecha_fin
            const finDateFull = new Date(m.fecha_fin + "T23:59:59.999");
            if (now > finDateFull) return; // Ya concluido

            const finDay = new Date(m.fecha_fin + "T00:00:00");
            const diffTime = finDay.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= 7) {
              endingList.push({
                id: m.id,
                nombre: c.nombre ? `${c.nombre.toUpperCase()} (${(m.nombre || "").toUpperCase()})` : m.nombre,
                fecha_inicio: m.fecha_inicio,
                fecha_fin: m.fecha_fin,
                aula: m.aula,
                profesor: c.docentes ? `${c.docentes.apellidos}, ${c.docentes.nombres}` : m.profesor,
                carreras: m.carreras,
                diffDays
              });
            }
          });
        }
      } else {
        // Para administradores: consultar todos los módulos
        const res = await fetch("/api/modulos", { cache: "no-store" });
        const data = await res.json();

        if (Array.isArray(data)) {
          data.forEach((m: any) => {
            if (!m.fecha_fin) return;

            // El módulo termina a las 23:59:59 del día de finalización
            const finDateFull = new Date(m.fecha_fin + "T23:59:59.999");
            if (now > finDateFull) return; // Ya concluido

            const finDay = new Date(m.fecha_fin + "T00:00:00");
            const diffTime = finDay.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Módulos que terminan hoy (0) o en los próximos 7 días
            if (diffDays >= 0 && diffDays <= 7) {
              endingList.push({
                id: m.id,
                nombre: m.nombre,
                fecha_inicio: m.fecha_inicio,
                fecha_fin: m.fecha_fin,
                aula: m.aula,
                profesor: m.profesor,
                carreras: m.carreras,
                diffDays
              });
            }
          });
        }
      }

      // Ordenar: los que terminan antes primero
      endingList.sort((a, b) => a.diffDays - b.diffDays);
      setModulesEnding(endingList);
    } catch (err) {
      console.error("[ModuloAlarma] Error al consultar módulos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkModulesEnding();
    // Actualizar cada 2 minutos
    const interval = setInterval(checkModulesEnding, 120000);
    return () => clearInterval(interval);
  }, [docenteId, userRole]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const urgentCount = modulesEnding.length;
  const hasToday = modulesEnding.some(m => m.diffDays === 0);

  return (
    <div ref={dropdownRef} style={{ position: "relative", zIndex: 1000 }}>
      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes bellGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        .ts-alarm-btn:hover {
          background: rgba(74, 179, 216, 0.16) !important;
          border-color: rgba(74, 179, 216, 0.35) !important;
        }
        .ts-alarm-card:hover {
          background: rgba(14, 28, 54, 0.9) !important;
          border-color: rgba(74, 179, 216, 0.35) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Botón de Alarma */}
      <button
        type="button"
        className="ts-alarm-btn"
        onClick={() => {
          setOpen(prev => !prev);
          if (!open) checkModulesEnding();
        }}
        title={
          urgentCount > 0
            ? `¡Atención! ${urgentCount} ${urgentCount === 1 ? "módulo está" : "módulos están"} por terminar`
            : "Alarma de módulos: Todo al día"
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 12px",
          height: 32,
          borderRadius: 20,
          background: urgentCount > 0
            ? hasToday
              ? "rgba(239, 68, 68, 0.12)"
              : "rgba(245, 158, 11, 0.12)"
            : "rgba(74, 179, 216, 0.08)",
          border: urgentCount > 0
            ? hasToday
              ? "1px solid rgba(239, 68, 68, 0.35)"
              : "1px solid rgba(245, 158, 11, 0.35)"
            : "1px solid rgba(74, 179, 216, 0.18)",
          color: urgentCount > 0
            ? hasToday
              ? "#f87171"
              : "#fbbf24"
            : "rgba(74, 179, 216, 0.8)",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          transition: "all 0.2s",
          animation: hasToday ? "bellGlow 2s infinite" : undefined,
        }}
      >
        <Bell
          size={14}
          style={{
            color: urgentCount > 0 ? (hasToday ? "#f87171" : "#fbbf24") : "#4ab3d8",
            animation: urgentCount > 0 ? "bellPulse 2.5s infinite" : undefined,
          }}
        />
        <span>
          {urgentCount > 0
            ? hasToday
              ? "¡Termina hoy!"
              : `${urgentCount} por terminar`
            : "Alarma"}
        </span>
      </button>

      {/* Popover flotante */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "min(360px, 92vw)",
            background: "rgba(8, 16, 34, 0.98)",
            border: "1px solid rgba(74, 179, 216, 0.28)",
            borderRadius: 14,
            boxShadow: "0 14px 40px rgba(0,0,0,0.85)",
            backdropFilter: "blur(20px)",
            zIndex: 99999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header del Popover */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(42, 109, 181, 0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(10, 22, 44, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: urgentCount > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(52, 211, 153, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={14} style={{ color: urgentCount > 0 ? "#fbbf24" : "#34d399" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#dbeafe" }}>
                  Alarma de Módulos
                </div>
                <div style={{ fontSize: 10, color: "rgba(120, 160, 210, 0.7)" }}>
                  Módulos por finalizar en los próximos 7 días
                </div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(120, 160, 210, 0.6)",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Lista de Módulos */}
          <div
            style={{
              maxHeight: 340,
              overflowY: "auto",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#4ab3d8", fontSize: 12 }}>
                Consultando módulos...
              </div>
            ) : modulesEnding.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center" }}>
                <CheckCircle size={36} style={{ color: "#34d399", margin: "0 auto 10px", opacity: 0.8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>
                  ¡Todo al día!
                </div>
                <div style={{ fontSize: 11, color: "rgba(120, 160, 210, 0.6)", marginTop: 4 }}>
                  No hay módulos por finalizar en los próximos 7 días.
                </div>
              </div>
            ) : (
              modulesEnding.map(m => {
                const isToday = m.diffDays === 0;
                const isTomorrow = m.diffDays === 1;

                return (
                  <div
                    key={m.id}
                    className="ts-alarm-card"
                    style={{
                      background: "rgba(10, 22, 44, 0.7)",
                      border: isToday
                        ? "1px solid rgba(239, 68, 68, 0.35)"
                        : "1px solid rgba(42, 109, 181, 0.2)",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "2.5px 7px",
                          borderRadius: 12,
                          background: isToday
                            ? "rgba(239, 68, 68, 0.2)"
                            : isTomorrow
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(59, 130, 246, 0.15)",
                          color: isToday ? "#f87171" : isTomorrow ? "#fbbf24" : "#60a5fa",
                          border: isToday
                            ? "1px solid rgba(239, 68, 68, 0.3)"
                            : isTomorrow
                              ? "1px solid rgba(245, 158, 11, 0.3)"
                              : "1px solid rgba(59, 130, 246, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={10} />
                        {isToday
                          ? "TERMINA HOY (23:59)"
                          : isTomorrow
                            ? "TERMINA MAÑANA (1 DÍA)"
                            : `FALTAN ${m.diffDays} DÍAS`}
                      </span>

                      <span style={{ fontSize: 10, color: "rgba(120, 160, 210, 0.6)", fontWeight: 600 }}>
                        {m.fecha_fin}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#dbeafe", lineHeight: 1.25 }}>
                      {m.nombre}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10.5, color: "rgba(120, 160, 210, 0.75)" }}>
                      {m.carreras && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <GraduationCap size={11} style={{ color: "#4ab3d8" }} />
                          <span style={{ color: "#7cc8e8" }}>{m.carreras.nombre}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {m.aula && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <MapPin size={10} style={{ color: "#a5b4fc" }} />
                            <span>Aula: <strong>{m.aula.toUpperCase()}</strong></span>
                          </div>
                        )}
                        {m.profesor && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <User size={10} style={{ color: "rgba(74, 179, 216, 0.6)" }} />
                            <span>Prof. {m.profesor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer del Popover */}
          {urgentCount > 0 && onNavigateModulo && (
            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid rgba(42, 109, 181, 0.16)",
                background: "rgba(10, 22, 44, 0.5)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  onNavigateModulo(userRole === "docente" ? "docentes" : "carreras");
                }}
                style={{
                  background: "rgba(74, 179, 216, 0.12)",
                  border: "1px solid rgba(74, 179, 216, 0.25)",
                  color: "#4ab3d8",
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.2s",
                }}
              >
                <span>{userRole === "docente" ? "Ver mis Cursos" : "Ver Módulos / Cursos"}</span>
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

