import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/notas-cursos?matricula_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const matriculaId = searchParams.get("matricula_id");
  const cursoId = searchParams.get("curso_id");

  let query = supabase
    .from("notas_cursos")
    .select(`
      *,
      cursos (id, nombre, orden),
      matriculas (
        id,
        alumnos (id, dni, nombres, apellidos)
      )
    `)
    .order("cursos(orden)", { ascending: true });

  if (matriculaId) query = query.eq("matricula_id", matriculaId);
  if (cursoId)     query = query.eq("curso_id", cursoId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/notas-cursos — registrar/actualizar nota
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { matricula_id, curso_id, nota, observacion } = body;

  if (!matricula_id || !curso_id) {
    return Response.json({ error: "matricula_id y curso_id son requeridos" }, { status: 400 });
  }
  if (nota !== undefined && nota !== null && (nota < 0 || nota > 20)) {
    return Response.json({ error: "La nota debe estar entre 0 y 20" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notas_cursos")
    .upsert([{ matricula_id, curso_id, nota: nota ?? null, observacion: observacion || null }],
      { onConflict: "matricula_id,curso_id" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
