import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/asistencias?matricula_id=xxx&modulo_id=xxx&curso_id=yyy&fecha=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const matriculaId = searchParams.get("matricula_id");
  const moduloId = searchParams.get("modulo_id");
  const cursoId = searchParams.get("curso_id");
  const fecha = searchParams.get("fecha");

  let query = supabase
    .from("asistencias")
    .select(`
      *,
      matriculas (
        id, turno,
        alumnos (id, dni, nombres, apellidos)
      ),
      modulos (id, nombre)
    `)
    .order("fecha", { ascending: false });

  if (matriculaId) query = query.eq("matricula_id", matriculaId);
  if (moduloId)    query = query.eq("modulo_id", moduloId);
  if (cursoId)     query = query.eq("curso_id", cursoId);
  if (fecha)       query = query.eq("fecha", fecha);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/asistencias — registrar asistencia
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { matricula_id, modulo_id, curso_id, fecha, estado, hora_entrada, hora_salida, duracion_min, observacion } = body;

  if (!matricula_id || !modulo_id || !curso_id) {
    return Response.json({ error: "matricula_id, modulo_id y curso_id son requeridos" }, { status: 400 });
  }

  const estadoValido = ["presente", "tardanza", "falta", "justificado"];
  if (estado && !estadoValido.includes(estado)) {
    return Response.json({ error: `estado debe ser uno de: ${estadoValido.join(", ")}` }, { status: 400 });
  }

  const payload = {
    matricula_id,
    modulo_id,
    curso_id,
    fecha: fecha || new Date().toISOString().split("T")[0],
    estado: estado || "presente",
    hora_entrada: hora_entrada || null,
    hora_salida: hora_salida || null,
    duracion_min: duracion_min || null,
    observacion: observacion || null,
  };

  const { data, error } = await supabase
    .from("asistencias")
    .upsert([payload], { onConflict: "matricula_id,curso_id,fecha" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
