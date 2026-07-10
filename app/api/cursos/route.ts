import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/cursos?modulo_id=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const moduloId = searchParams.get("modulo_id");
  const docenteId = searchParams.get("docente_id");

  let query = supabase
    .from("cursos")
    .select("*, modulos(id, nombre, fecha_inicio, fecha_fin, modalidad, aula, carreras(id, nombre)), docentes(id, nombres, apellidos)")
    .order("orden", { ascending: true });

  if (moduloId) query = query.eq("modulo_id", moduloId);
  if (docenteId) query = query.eq("docente_id", docenteId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/cursos
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { modulo_id, nombre, descripcion, orden, creditos, docente_id } = body;

  if (!modulo_id || !nombre?.trim()) {
    return Response.json({ error: "modulo_id y nombre son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cursos")
    .insert([{
      modulo_id,
      nombre: nombre.trim(),
      descripcion: descripcion || null,
      orden: orden ?? 1,
      creditos: creditos ? Number(creditos) : 1,
      docente_id: docente_id || null,
    }])
    .select("*, docentes(id, nombres, apellidos)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Ya existe un curso con ese nombre en este módulo" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}

