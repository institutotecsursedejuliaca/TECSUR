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

  function printDocument(url: string) {
    let iframe = document.getElementById("print-iframe") as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }
    iframe.src = url;
    iframe.onload = () => {
      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      }, 300);
    };
  }

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col items-center w-full"
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
        className="relative z-10 w-full max-w-7xl px-4 md:px-8 flex justify-between items-center"
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
      <main className="relative z-10 w-full max-w-7xl px-4 md:px-8 mt-0 flex flex-col justify-center">

        {/* Hero */}
        <div className="text-center" style={{ padding: "44px 0 30px" }}>
          <h1
            style={{
              fontSize: 26, fontWeight: 900, color: "#fff",
              letterSpacing: "0.02em", lineHeight: 1.3, margin: "0 0 16px 0",
              textTransform: "uppercase"
            }}
          >
            Consulta General de Calificaciones
          </h1>
          <p
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              marginTop: 0, marginBottom: 12, maxWidth: 460, marginLeft: "auto", marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Ingrese su Código de Alumno para verificar su rendimiento académico por módulo, asistencia general y obtener constancias.
          </p>
        </div>

        {/* Search card */}
        {!data && (
          <div
            style={{
              background: "#090f1a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "32px 24px", marginBottom: 28,
              width: "100%", maxWidth: 600, marginLeft: "auto", marginRight: "auto"
            }}
          >
            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute", left: 14, top: "50%",
                    transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)",
                  }}
                />
                <input
                  style={{
                    width: "100%", height: 42,
                    background: "rgba(10,22,44,0.6)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 8, padding: "0 14px 0 38px",
                    fontSize: 13, color: "#fff", fontFamily: "inherit", outline: "none",
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
                  width: "100%", height: 42,
                  background: loading ? "rgba(26,58,143,0.35)" : "#1a4a7a",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  letterSpacing: "0.02em",
                  transition: "all 0.2s"
                }}
              >
                {loading ? "Buscando..." : (<>Consultar Calificaciones <ArrowRight size={13} /></>)}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Información Oficial</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            </div>

            <p
              style={{
                fontSize: 11, color: "rgba(255,255,255,0.24)", textAlign: "center",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                margin: 0
              }}
            >
              <ShieldCheck size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
              Acceso seguro y verificado para estudiantes de Tecsur
            </p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 28, width: "100%", alignItems: "start", marginBottom: 40 }}>
            {/* Columna Izquierda: Datos del Estudiante */}
            <div style={{ flex: "1 1 300px", minWidth: 280 }}>
              <div
                style={{
                  background: "#090f1a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "24px",
                  display: "flex", flexDirection: "column", gap: 18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: 10,
                      background: "#172b4d",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, fontWeight: 900, color: "#fff", flexShrink: 0,
                    }}
                  >
                    {data.alumno.nombres[0]}{data.alumno.apellidos[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                      {data.alumno.apellidos.toUpperCase()}, {data.alumno.nombres.toUpperCase()}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
                      Estudiante Regular
                    </p>
                  </div>
                </div>
                
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>DNI del Alumno</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 4 }}>{data.alumno.dni}</div>
                  </div>
                  {(data.alumno as any).codigo && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Código de Registro</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 4 }}>{(data.alumno as any).codigo}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Especialidad / Carrera</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 4, lineHeight: 1.4 }}>{data.alumno.carrera.toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={() => printDocument(`/reportes/historial?dni=${data.alumno.dni}`)}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "10px 16px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Printer size={13} /> DESCARGAR RECORD ACADÉMICO
                  </button>
                  
                  <button
                    onClick={() => {
                      setData(null);
                      setCodigo("");
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "8px 16px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Consultar otro alumno
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Módulos y Rendimiento */}
            <div style={{ flex: "1.5 1 450px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Section label */}
              <div
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", gap: 10,
                  margin: "0 0 4px 2px",
                }}
              >
                Módulos y rendimiento académico
                <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)", display: "block" }} />
              </div>

              {/* Modules List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.modulos.map((item) => {
                  const isOpen = expandedModulo === item.matricula_id;
                  const prom = promedio(item.notas_cursos);

                  return (
                    <div
                      key={item.matricula_id}
                      style={{
                        background: "#090f1a",
                        border: `1px solid ${isOpen ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s",
                      }}
                    >
                      {/* Header */}
                      <button
                        onClick={() => setExpandedModulo(isOpen ? null : item.matricula_id)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "18px 20px", cursor: "pointer",
                          background: "transparent", border: "none", width: "100%", textAlign: "left",
                          color: "inherit",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: 6,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#fff", flexShrink: 0,
                            }}
                          >
                            <Award size={15} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0 }}>
                              {item.modulo?.nombre.toUpperCase()}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", textTransform: "uppercase" }}>
                              {item.modulo?.modalidad} · {item.modulo?.fecha_inicio} – {item.modulo?.fecha_fin}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          {prom !== null ? (
                            <span
                              style={{
                                fontSize: 11, fontWeight: 800,
                                padding: "4px 11px", borderRadius: 4,
                                background: "rgba(255,255,255,0.03)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)"
                              }}
                            >
                              PROM {prom.toFixed(1)}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 11, fontWeight: 800, padding: "4px 11px", borderRadius: 4,
                                background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)",
                                border: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              S/N
                            </span>
                          )}
                          <ChevronDown
                            size={16}
                            style={{
                              color: "rgba(255,255,255,0.4)",
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
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            padding: "20px",
                            background: "transparent",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {item.notas_cursos.length > 0 ? (
                              item.notas_cursos.map((n, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 14px", borderRadius: 8,
                                    background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                  }}
                                >
                                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                                    {n.cursos?.nombre}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 12, fontWeight: 800,
                                      padding: "3px 10px", borderRadius: 4,
                                      background: "rgba(255,255,255,0.03)", color: "#fff",
                                      border: "1px solid rgba(255,255,255,0.08)"
                                    }}
                                  >
                                    {n.nota !== null ? String(n.nota).padStart(2, "0") : "—"}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "20px 0" }}>
                                Calificaciones pendientes de registro por el docente.
                              </p>
                            )}
                          </div>

                          {/* Asistencia */}
                          <div
                            style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "12px 16px", borderRadius: 8,
                              background: "transparent",
                              border: "1px solid rgba(255,255,255,0.05)",
                              marginTop: 12,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11.5, color: "rgba(255,255,255,0.4)",
                                display: "flex", alignItems: "center", gap: 6,
                              }}
                            >
                              <Clock size={13} style={{ color: "rgba(255,255,255,0.4)" }} />
                              Asistencia General
                            </span>
                            <span
                              style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
                            >
                              {item.asistencia_total !== null ? `${item.asistencia_total}%` : "Sin registro"}
                            </span>
                          </div>

                          {/* Report buttons */}
                          <div
                            style={{
                              display: "flex", gap: 8, marginTop: 16,
                              paddingTop: 16,
                              borderTop: "1px solid rgba(255,255,255,0.05)",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() => printDocument(`/reportes/matricula?matricula=${item.matricula_id}`)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: 6, padding: "6px 12px",
                                textDecoration: "none", letterSpacing: "0.02em",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <Printer size={11} /> DESCARGAR FICHA DE MATRÍCULA
                            </button>
                            <button
                              onClick={() => printDocument(`/reportes/asistencia?matricula=${item.matricula_id}`)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: 6, padding: "6px 12px",
                                textDecoration: "none", letterSpacing: "0.02em",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              <Printer size={11} /> DESCARGAR REPORTE DE ASISTENCIA
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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