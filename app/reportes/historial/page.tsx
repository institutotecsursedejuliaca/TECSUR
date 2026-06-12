import { supabase } from "@/lib/supabase";

export default async function ReporteHistorialPage({ searchParams }: { searchParams: Promise<{ dni?: string }> }) {
  const resolvedParams = await searchParams;
  const dni = resolvedParams.dni;

  if (!dni) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Error: Se requiere el DNI del alumno.</div>;
  }

  // 1. Cargar datos del alumno
  const { data: alumno, error: errAlum } = await supabase
    .from("alumnos")
    .select("*")
    .eq("dni", dni)
    .single();

  if (errAlum || !alumno) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Error: No se encontró el alumno con el DNI proporcionado.</div>;
  }

  // 2. Cargar matrículas y módulos asociados
  const { data: matriculas, error: errMat } = await supabase
    .from("matriculas")
    .select(`
      id,
      turno,
      fecha_registro,
      modulos (*)
    `)
    .eq("alumno_id", alumno.id)
    .order("fecha_registro", { ascending: true });

  const listaMatriculas = matriculas || [];

  // 3. Cargar notas de cursos para estas matrículas
  const matriculaIds = listaMatriculas.map(m => m.id);
  const { data: notasCursos } = await supabase
    .from("notas_cursos")
    .select(`
      *,
      cursos (*)
    `)
    .in("matricula_id", matriculaIds.length > 0 ? matriculaIds : ["none"])
    .order("orden", { referencedTable: "cursos", ascending: true });

  // Agrupar las notas por matricula_id
  const notasMapByMatricula = new Map<string, any[]>();
  (notasCursos || []).forEach(n => {
    if (!notasMapByMatricula.has(n.matricula_id)) {
      notasMapByMatricula.set(n.matricula_id, []);
    }
    notasMapByMatricula.get(n.matricula_id)!.push(n);
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        body { margin: 0; padding: 0; background: #e5e7eb; font-family: 'Inter', system-ui, sans-serif; color: #111827; }
        .a4-container {
          background: #fff;
          width: 210mm;
          min-height: 297mm;
          margin: 40px auto;
          padding: 20mm;
          box-sizing: border-box;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        @media print {
          body { background: #fff; }
          .a4-container { margin: 0; box-shadow: none; width: 100%; min-height: auto; padding: 0; }
          .no-print { display: none !important; }
        }
        h1, h2, h3, h4, p { margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: 700; color: #374151; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
        .logo-box { display: flex; align-items: center; gap: 15px; }
        
        .student-info-box { background: #f9fafb; border: 1px solid #d1d5db; border-radius: 10px; padding: 15px; margin-bottom: 25px; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .info-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 4px; }
        .info-value { font-size: 13px; font-weight: 600; color: #111827; }

        .modulo-title-strip {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          background: #1e3a8a;
          padding: 6px 12px;
          border-radius: 4px;
          margin-top: 25px;
          margin-bottom: 6px;
          display: flex;
          justify-content: space-between;
          text-transform: uppercase;
        }

        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-failed { background: #fee2e2; color: #991b1b; }
        .badge-empty { background: #f3f4f6; color: #6b7280; }

        .final-avg-row { background: #f8fafc; font-weight: 800; }
      `}} />

      <div className="no-print" style={{ textAlign: "center", padding: "20px 0" }}>
        <button 
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 6px -1px rgba(37,99,235,0.2)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir Reporte Histórico
        </button>
      </div>

      <div className="a4-container">
        <div className="header">
          <div className="logo-box">
            <img src="/img/logo.png" alt="Tecsur Logo" style={{ height: 75, objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>REPORTE ACADÉMICO HISTÓRICO</h2>
            <p style={{ fontSize: 11, color: "#6b7280" }}>Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="student-info-box">
          <div className="info-grid">
            <div style={{ gridColumn: "span 2" }}>
              <div className="info-label">Apellidos y Nombres</div>
              <div className="info-value" style={{ fontSize: 15 }}>{alumno.apellidos}, {alumno.nombres}</div>
            </div>
            <div>
              <div className="info-label">Documento de Identidad (DNI)</div>
              <div className="info-value">{alumno.dni}</div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <div className="info-label">Carrera / Especialidad</div>
              <div className="info-value">{alumno.carrera || "No asignada"}</div>
            </div>
            <div>
              <div className="info-label">Institución</div>
              <div className="info-value">TECSUR</div>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", borderBottom: "1px solid #d1d5db", paddingBottom: 6 }}>HISTORIAL DE CALIFICACIONES</h3>

        {listaMatriculas.length === 0 ? (
          <p style={{ padding: 30, textAlign: "center", color: "#6b7280", background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 8, marginTop: 15 }}>
            No registra módulos académicos matriculados en la institución.
          </p>
        ) : (
          listaMatriculas.map((mat) => {
            const notas = notasMapByMatricula.get(mat.id) || [];
            
            // Calcular promedio del módulo
            const validNotas = notas.filter(n => n.nota !== null).map(n => n.nota as number);
            const promedioModulo = validNotas.length > 0
              ? Math.round(validNotas.reduce((a, b) => a + b, 0) / validNotas.length)
              : null;

            const modulo = Array.isArray(mat.modulos) ? mat.modulos[0] : mat.modulos;

            return (
              <div key={mat.id} style={{ pageBreakInside: "avoid" }}>
                <div className="modulo-title-strip">
                  <span>MÓDULO: {modulo?.nombre}</span>
                  <span>{modulo?.modalidad}</span>
                </div>
                
                <table style={{ marginTop: 4 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px", textAlign: "center" }}>N°</th>
                      <th>Curso / Asignatura</th>
                      <th style={{ width: "120px", textAlign: "center" }}>Calificación</th>
                      <th style={{ width: "120px", textAlign: "center" }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notas.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "#6b7280", fontStyle: "italic" }}>
                          No hay asignaturas registradas para este módulo.
                        </td>
                      </tr>
                    ) : (
                      notas.map((n, idx) => {
                        const isApproved = n.nota !== null && n.nota >= 13;
                        return (
                          <tr key={n.id}>
                            <td style={{ textAlign: "center", color: "#6b7280" }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600 }}>{n.cursos?.nombre}</td>
                            <td style={{ textAlign: "center", fontWeight: 700 }}>
                              {n.nota !== null ? String(n.nota).padStart(2, "0") : "—"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {n.nota === null ? (
                                <span className="badge badge-empty">Pendiente</span>
                              ) : isApproved ? (
                                <span className="badge badge-approved">Aprobado</span>
                              ) : (
                                <span className="badge badge-failed">Desaprobado</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                    {promedioModulo !== null && (
                      <tr className="final-avg-row">
                        <td colSpan={2} style={{ textAlign: "right", textTransform: "uppercase" }}>Promedio Final del Módulo:</td>
                        <td style={{ textAlign: "center", fontSize: 13 }}>{String(promedioModulo).padStart(2, "0")}</td>
                        <td style={{ textAlign: "center" }}>
                          {promedioModulo >= 13 ? (
                            <span className="badge badge-approved" style={{ fontSize: 9 }}>Aprobado</span>
                          ) : (
                            <span className="badge badge-failed" style={{ fontSize: 9 }}>Desaprobado</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        <div style={{ marginTop: 60, display: "flex", justifyContent: "space-around", pageBreakInside: "avoid" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 200, borderTop: "1px solid #9ca3af", margin: "0 auto 10px" }}></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Coordinación Académica</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Firma Autorizada</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 200, borderTop: "1px solid #9ca3af", margin: "0 auto 10px" }}></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>Dirección Académica</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>TECSUR</div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('button').addEventListener('click', function() {
          window.print();
        });
      `}} />
    </>
  );
}
