import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/cursos?modulo_id=xxx
export async function GET(request: NextRequest) {
  const moduloId = request.nextUrl.searchParams.get("modulo_id");

  let query = supabase
    .from("cursos")
    .select("*, modulos(id, nombre)")
    .order("orden", { ascending: true });

  if (moduloId) query = query.eq("modulo_id", moduloId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/cursos
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { modulo_id, nombre, descripcion, orden, creditos } = body;

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
    }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Ya existe un curso con ese nombre en este módulo" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}

