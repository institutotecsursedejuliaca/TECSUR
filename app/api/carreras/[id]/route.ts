import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

// GET /api/carreras/[id] — detalle de una carrera con sus módulos
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("carreras")
    .select(`
      *,
      modulos (
        id, nombre, profesor, horario, fecha_inicio, fecha_fin,
        local, aula, modalidad, duracion, created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

// PUT /api/carreras/[id] — actualiza una carrera
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { nombre, descripcion } = body;

  if (!nombre?.trim()) {
    return Response.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("carreras")
    .update({ nombre: nombre.trim(), descripcion: descripcion || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "Ya existe una carrera con ese nombre" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}

// DELETE /api/carreras/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabase
    .from("carreras")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
