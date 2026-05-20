import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: "ID del alumno es requerido" }, { status: 400 });
    }

    const body = await request.json();
    const { id: _, ...fields } = body; // Removemos el id del body para no actualizarlo accidentalmente

    const { data, error } = await supabase
      .from("alumnos")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Error interno al actualizar el alumno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: "ID del alumno es requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("alumnos")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno al eliminar el alumno" }, { status: 500 });
  }
}
