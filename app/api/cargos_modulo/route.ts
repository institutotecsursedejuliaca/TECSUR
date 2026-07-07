import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const moduloId = searchParams.get("modulo_id");

  let query = supabase.from("cargos_modulo").select("*").order("created_at", { ascending: true });
  if (moduloId) {
    query = query.eq("modulo_id", moduloId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { modulo_id, concepto, monto, descripcion } = body;

  if (!modulo_id || !concepto || monto === undefined) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cargos_modulo")
    .insert([
      {
        modulo_id,
        concepto,
        monto: parseFloat(monto),
        descripcion: descripcion || null
      }
    ])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID requerido" }, { status: 400 });
  }

  const { error } = await supabase.from("cargos_modulo").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
