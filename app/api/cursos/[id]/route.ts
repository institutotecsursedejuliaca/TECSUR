import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { nombre, descripcion, orden, creditos, docente_id } = body;

  if (!nombre?.trim()) {
    return Response.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cursos")
    .update({ 
      nombre: nombre.trim(), 
      descripcion: descripcion || null, 
      orden: orden ?? 1,
      creditos: creditos !== undefined ? Number(creditos) : undefined,
      docente_id: docente_id !== undefined ? (docente_id || null) : undefined
    })
    .eq("id", id)
    .select("*, docentes(id, nombres, apellidos)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { error } = await supabase.from("cursos").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
