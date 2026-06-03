import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/carreras — lista todas las carreras con resumen
export async function GET() {
  const { data, error } = await supabase
    .from("v_carreras_resumen")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

// POST /api/carreras — crea una carrera nueva
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, descripcion, created_by } = body;

  if (!nombre?.trim()) {
    return Response.json({ error: "El nombre de la carrera es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("carreras")
    .insert([{ nombre: nombre.trim(), descripcion: descripcion || null, created_by: created_by || null }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Ya existe una carrera con ese nombre" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data, { status: 201 });
}
