import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const dni = request.nextUrl.searchParams.get("dni");

  if (!dni) {
    return Response.json({ error: "DNI es requerido" }, { status: 400 });
  }

  // Get alumno by DNI
  const { data: alumno, error: alumnoError } = await supabase
    .from("alumnos")
    .select("*")
    .eq("dni", dni)
    .single();

  if (alumnoError || !alumno) {
    return Response.json({ error: "Alumno no encontrado" }, { status: 404 });
  }

  // Get matriculas with modulo details
  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select(`
      id,
      fecha_registro,
      modulo_id,
      modulos (
        id,
        nombre,
        fecha_inicio,
        fecha_fin,
        modalidad,
        duracion
      )
    `)
    .eq("alumno_id", alumno.id);

  if (matriculasError) {
    return Response.json({ error: "Error al obtener matrículas" }, { status: 500 });
  }

  // Get notas_cursos for each matricula
  const matriculaIds = (matriculas ?? []).map((m) => m.id);
  const { data: notas_cursos, error: notasError } = await supabase
    .from("notas_cursos")
    .select(`
      id,
      matricula_id,
      curso_id,
      nota,
      cursos (
        id,
        nombre,
        orden
      )
    `)
    .in("matricula_id", matriculaIds.length > 0 ? matriculaIds : ["none"]);

  if (notasError) {
    return Response.json({ error: "Error al obtener notas" }, { status: 500 });
  }

  // Get pensiones
  const { data: pensiones, error: pensionesError } = await supabase
    .from("pensiones")
    .select(`
      *,
      modulos (nombre)
    `)
    .eq("alumno_id", alumno.id);

  if (pensionesError) {
    return Response.json({ error: "Error al obtener pensiones" }, { status: 500 });
  }

  // Get asistencias
  const { data: asistencias, error: asistenciasError } = await supabase
    .from("asistencias")
    .select("*")
    .in("matricula_id", matriculaIds.length > 0 ? matriculaIds : ["none"]);

  if (asistenciasError) {
    return Response.json({ error: "Error al obtener asistencias" }, { status: 500 });
  }

  // Compose response
  const modulosConNotas = (matriculas ?? []).map((mat) => {
    const notasDelModulo = (notas_cursos ?? []).filter((n) => n.matricula_id === mat.id);
    const asistenciasDelModulo = (asistencias ?? []).filter((a) => a.matricula_id === mat.id);
    
    // Sort courses by orden
    notasDelModulo.sort((a, b) => {
      const cursoA = Array.isArray(a.cursos) ? a.cursos[0] : a.cursos;
      const cursoB = Array.isArray(b.cursos) ? b.cursos[0] : b.cursos;
      const orderA = cursoA?.orden ?? 99;
      const orderB = cursoB?.orden ?? 99;
      return orderA - orderB;
    });

    const totalAsistencias = asistenciasDelModulo.length;
    const totalPresentes = asistenciasDelModulo.filter(a => a.estado === "presente" || a.estado === "tardanza" || a.estado === "justificado").length;
    const asistencia_total = totalAsistencias > 0 ? Math.round((totalPresentes / totalAsistencias) * 100) : null;

    return {
      matricula_id: mat.id,
      fecha_registro: mat.fecha_registro,
      modulo: mat.modulos,
      notas_cursos: notasDelModulo,
      asistencia_total
    };
  });

  return Response.json({
    alumno,
    modulos: modulosConNotas,
    pensiones: pensiones ?? [],
  });
}
