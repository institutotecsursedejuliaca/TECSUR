import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("modulos")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, fecha_inicio, fecha_fin, modalidad, duracion } = body;

  if (!nombre || !fecha_inicio || !fecha_fin || !modalidad || !duracion) {
    return Response.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("modulos")
    .insert([{ nombre, fecha_inicio, fecha_fin, modalidad, duracion }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
