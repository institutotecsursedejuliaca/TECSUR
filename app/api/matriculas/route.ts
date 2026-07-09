import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const TURNOS = ["mañana", "tarde", "noche", "sabado_domingo_am", "sabado_domingo_full"] as const;

// GET /api/matriculas?modulo_id=xxx&alumno_id=xxx&carrera_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const moduloId   = searchParams.get("modulo_id");
  const alumnoId   = searchParams.get("alumno_id");
  const carreraId  = searchParams.get("carrera_id");

  let query = supabase
    .from("matriculas")
    .select(`
      id,
      alumno_id,
      modulo_id,
      fecha_registro,
      turno,
      created_at,
      alumnos (id, dni, nombres, apellidos, celular, correo, carrera),
      modulos (id, nombre, profesor, horario, fecha_inicio, fecha_fin, modalidad, local, aula),
      carreras (id, nombre),
      notas (
        id, inspeccion, mantenimiento, sistema_hidraulico,
        seguridad, ingles, operacion, promedio, asistencia_total
      )
    `)
    .order("fecha_registro", { ascending: false });

  if (moduloId)  query = query.eq("modulo_id", moduloId);
  if (alumnoId)  query = query.eq("alumno_id", alumnoId);
  if (carreraId) query = query.eq("carrera_id", carreraId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/matriculas — matricular alumno
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { alumno_id, modulo_id, carrera_id, turno } = body;

  if (!alumno_id || !modulo_id) {
    return Response.json({ error: "alumno_id y modulo_id son requeridos" }, { status: 400 });
  }

  if (turno && !TURNOS.includes(turno as typeof TURNOS[number])) {
    return Response.json({ error: `turno debe ser uno de: ${TURNOS.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matriculas")
    .insert([{
      alumno_id,
      modulo_id,
      carrera_id: carrera_id || null,
      turno: turno || "mañana",
      fecha_registro: new Date().toISOString().split("T")[0],
    }])
    .select(`
      *,
      alumnos (id, dni, nombres, apellidos),
      modulos (id, nombre),
      carreras (id, nombre)
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "El alumno ya está matriculado en este módulo" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID de matrícula requerido" }, { status: 400 });
  }

  const { error } = await supabase.from("matriculas").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
