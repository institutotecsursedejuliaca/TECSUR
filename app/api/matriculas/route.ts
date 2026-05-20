import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/matriculas?modulo_id=xxx — list students enrolled in a module
export async function GET(request: NextRequest) {
  const moduloId = request.nextUrl.searchParams.get("modulo_id");

  if (!moduloId) {
    return Response.json({ error: "modulo_id es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matriculas")
    .select(`
      id,
      fecha_registro,
      alumnos (id, dni, nombres, apellidos, carrera),
      notas (
        id,
        inspeccion,
        mantenimiento,
        sistema_hidraulico,
        seguridad,
        ingles,
        operacion,
        promedio,
        asistencia_total
      )
    `)
    .eq("modulo_id", moduloId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { alumno_id, modulo_id } = body;

  if (!alumno_id || !modulo_id) {
    return Response.json({ error: "alumno_id y modulo_id son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matriculas")
    .insert([{ alumno_id, modulo_id, fecha_registro: new Date().toISOString().split("T")[0] }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
