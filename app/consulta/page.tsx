"use client";

import { useState } from "react";
import {
  Search,
  User,
  BookOpen,
  Award,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

interface AlumnoData {
  alumno: {
    id: string;
    dni: string;
    nombres: string;
    apellidos: string;
    carrera: string;
  };
  modulos: Array<{
    matricula_id: string;
    fecha_registro: string;
    modulo: {
      id: string;
      nombre: string;
      fecha_inicio: string;
      fecha_fin: string;
      modalidad: string;
      duracion?: string | number | null;
    };
    notas_cursos: Array<{
      curso_id: string;
      nota: number | null;
      cursos: { nombre: string };
    }>;
    asistencia_total: number | null;
  }>;
}

export default function PublicConsultaPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AlumnoData | null>(null);
  const [expandedModulo, setExpandedModulo] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      toast.error("Por favor ingrese su código de alumno");
      return;
    }
    setLoading(true);
    setData(null);

    try {
      const res = await fetch(`/api/consulta?codigo=${encodeURIComponent(codigo.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "No se encontró el alumno o error al consultar");
      } else {
        setData(json);
        if (json.modulos?.length > 0) {
          setExpandedModulo(json.modulos[0].matricula_id);
        }
        toast.success("Calificaciones cargadas correctamente");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  function promedio(notas: AlumnoData["modulos"][0]["notas_cursos"]): number | null {
    const vals = notas.filter((n) => n.nota !== null).map((n) => n.nota as number);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col items-center"
      style={{ background: "#07090f", fontFamily: "'Inter', 'DM Sans', sans-serif", paddingTop: "2px" }}
    >
      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0c1020",
            color: "#dde3ef",
            border: "1px solid rgba(80,130,240,0.2)",
            borderRadius: "10px",
            fontSize: "13px",
          },
        }}
      />

      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,60,120,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,60,120,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Header Centrado */}
      <header
        className="relative z-10 w-full max-w-2xl md:max-w-3xl px-6 flex justify-between items-center"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", marginTop: "24px", paddingTop: "24px", paddingBottom: "16px" }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: 9,
              background: "#0f1c3a",
              border: "1px solid rgba(80,120,220,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Image
              src="/img/white.png"
              alt="TECSUR"
              width={26}
              height={26}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "0.05em", margin: 0 }}>
              TECSUR
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.07em", textTransform: "uppercase", margin: 0 }}>
              Instituto Tecnológico
            </p>
          </div>
        </div>

        <Link
          href="/login"
          style={{
            fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", borderRadius: 7,
            padding: "6px 14px", letterSpacing: "0.02em",
            display: "inline-flex", alignItems: "center", gap: 6,
            textDecoration: "none", transition: "all 0.15s",
          }}
        >
          Acceso Docente
        </Link>
      </header>

      {/* Main Container Centrado */}
      <main className="relative z-10 w-full max-w-2xl md:max-w-3xl px-6 mt-0 flex flex-col justify-center">

        {/* Hero */}
        <div className="text-center" style={{ padding: "44px 0 30px" }}>
          <h1
            style={{
              fontSize: 29, fontWeight: 900, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 1.2, margin: 0,
            }}
          >
            Consulta de <span style={{ color: "#7baaf7" }}>Calificaciones</span>
          </h1>
          <p
            style={{
              fontSize: 13, color: "rgba(255,255,255,0.34)",
              marginTop: 10, maxWidth: 420, marginLeft: "auto", marginRight: "auto",
              lineHeight: 1.75,
            }}
          >
            Ingresa tu Código de Alumno para ver tus notas por módulo, asistencia y
            descargar tus constancias oficiales.
          </p>
        </div>

        {/* Search card */}
        <div
          style={{
            background: "#0c1020",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: 22, marginBottom: 28,
          }}
        >
          <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute", left: 13, top: "50%",
                  transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)",
                }}
              />
              <input
                style={{
                  width: "100%", height: 48,
                  background: "#07090f",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10, padding: "0 14px 0 40px",
                  fontSize: 14, color: "#fff", fontFamily: "inherit", outline: "none",
                }}
                placeholder="Código de Alumno..."
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 48,
                background: loading ? "rgba(26,58,143,0.35)" : "#1a3a8f",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                letterSpacing: "0.02em",
              }}
            >
              {loading ? "Buscando..." : (<>Ver mis calificaciones <ArrowRight size={14} /></>)}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 12px" }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.05em" }}>información segura</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
          </div>

          <p
            style={{
              fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <ShieldCheck size={13} style={{ color: "rgba(80,130,240,0.45)" }} />
            Solo tú puedes ver tus calificaciones
          </p>
        </div>

        {/* Results */}
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Student card */}
            <div
              style={{
                background: "#0c1020",
                border: "1px solid rgba(80,130,240,0.18)",
                borderRadius: 14, padding: "20px 22px",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 18,
              }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: "#0f1c3a",
                  border: "1px solid rgba(80,130,240,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 900, color: "#7baaf7", flexShrink: 0,
                }}
              >
                {data.alumno.nombres[0]}{data.alumno.apellidos[0]}
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                  {data.alumno.apellidos}, {data.alumno.nombres}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
                  {(data.alumno as any).codigo && (
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                        padding: "3px 10px", borderRadius: 100,
                        background: "rgba(74,179,216,0.1)", color: "#4ab3d8",
                        border: "1px solid rgba(74,179,216,0.2)",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                    >
                      <User size={9} /> Código {(data.alumno as any).codigo}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      padding: "3px 10px", borderRadius: 100,
                      background: "rgba(80,130,240,0.1)", color: "#7baaf7",
                      border: "1px solid rgba(80,130,240,0.2)",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <User size={9} /> DNI {data.alumno.dni}
                  </span>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      padding: "3px 10px", borderRadius: 100,
                      background: "rgba(34,211,238,0.1)", color: "#22d3ee",
                      border: "1px solid rgba(34,211,238,0.2)",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <BookOpen size={9} /> {data.alumno.carrera || "Sin Carrera"}
                  </span>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link
                    href={`/reportes/historial?dni=${data.alumno.dni}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: "green", textDecoration: "none", fontSize: 11.5, padding: "8px 16px", display: "inline-flex", gap: 6, height: "auto" }}
                  >
                    <Printer size={13} /> Descargar Reporte Histórico
                  </Link>
                </div>
              </div>
            </div>

            {/* Section label */}
            <div
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", gap: 10,
                margin: "0 0 13px 2px",
              }}
            >
              <TrendingUp size={12} style={{ color: "rgba(123,170,247,0.5)" }} />
              Módulos y rendimiento
              <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", display: "block" }} />
            </div>

            {/* Modules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.modulos.map((item) => {
                const isOpen = expandedModulo === item.matricula_id;
                const prom = promedio(item.notas_cursos);

                return (
                  <div
                    key={item.matricula_id}
                    style={{
                      background: "#0c1020",
                      border: `1px solid ${isOpen ? "rgba(80,130,240,0.28)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s",
                    }}
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedModulo(isOpen ? null : item.matricula_id)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "15px 17px", cursor: "pointer",
                        background: "transparent", border: "none", width: "100%", textAlign: "left",
                        color: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "rgba(80,130,240,0.08)",
                            border: "1px solid rgba(80,130,240,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#7baaf7", flexShrink: 0,
                          }}
                        >
                          <Award size={15} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0 }}>
                            {item.modulo?.nombre}
                          </p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", margin: "3px 0 0", textTransform: "capitalize" }}>
                            {item.modulo?.modalidad} · {item.modulo?.fecha_inicio} – {item.modulo?.fecha_fin}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {prom !== null ? (
                          <span
                            style={{
                              fontSize: 12, fontWeight: 800,
                              padding: "4px 11px", borderRadius: 100,
                              ...(Math.round(prom) >= 14
                                ? { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.18)" }
                                : { background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }
                              ),
                            }}
                          >
                            Prom {prom.toFixed(1)}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11, fontWeight: 800, padding: "4px 11px", borderRadius: 100,
                              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)",
                              border: "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            S/N
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          style={{
                            color: "rgba(255,255,255,0.18)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        />
                      </div>
                    </button>

                    {/* Body */}
                    {isOpen && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                          padding: "15px 17px",
                          background: "rgba(0,0,0,0.18)",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {item.notas_cursos.length > 0 ? (
                            item.notas_cursos.map((n, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "9px 12px", borderRadius: 8,
                                  background: "rgba(255,255,255,0.025)",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                }}
                              >
                                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                                  {n.cursos?.nombre}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12, fontWeight: 800,
                                    padding: "4px 11px", borderRadius: 100,
                                    ...(n.nota === null
                                      ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.07)" }
                                      : n.nota >= 14
                                        ? { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.18)" }
                                        : { background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }
                                    ),
                                  }}
                                >
                                  {n.nota !== null ? String(n.nota).padStart(2, "0") : "—"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", padding: "20px 0" }}>
                              Calificaciones pendientes de registro por el docente.
                            </p>
                          )}
                        </div>

                        {/* Asistencia */}
                        <div
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 14px", borderRadius: 8,
                            background: "rgba(80,130,240,0.04)",
                            border: "1px solid rgba(80,130,240,0.1)",
                            marginTop: 10,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11.5, color: "rgba(255,255,255,0.28)",
                              display: "flex", alignItems: "center", gap: 6,
                            }}
                          >
                            <Clock size={13} style={{ color: "#7baaf7" }} />
                            Asistencia general
                          </span>
                          <span
                            style={{ fontSize: 13, fontWeight: 800 }}
                            className={item.asistencia_total !== null && item.asistencia_total >= 70 ? "text-emerald-400" : "text-red-400"}
                          >
                            {item.asistencia_total !== null ? `${item.asistencia_total}%` : "Sin registro"}
                          </span>
                        </div>

                        {/* Report buttons */}
                        <div
                          style={{
                            display: "flex", gap: 8, marginTop: 13,
                            paddingTop: 13,
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={`/reportes/matricula?matricula=${item.matricula_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 7, padding: "6px 12px",
                              textDecoration: "none", letterSpacing: "0.02em",
                            }}
                          >
                            <Printer size={11} /> Constancia Matrícula
                          </Link>
                          <Link
                            href={`/reportes/asistencia?matricula=${item.matricula_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.38)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 7, padding: "6px 12px",
                              textDecoration: "none", letterSpacing: "0.02em",
                            }}
                          >
                            <Printer size={11} /> Reporte Asistencia
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          textAlign: "center", padding: 16,
          fontSize: 11, color: "rgba(255,255,255,0.12)",
          background: "linear-gradient(transparent, #07090f 60%)",
          letterSpacing: "0.04em",
        }}
      >
        TECSUR © {new Date().getFullYear()} · Instituto Tecnológico · Juliaca, Perú
      </footer>
    </div>
  );
}