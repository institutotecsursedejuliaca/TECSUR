import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const alumnoId = request.nextUrl.searchParams.get("alumno_id");

  let query = supabase
    .from("pensiones")
    .select(`
      *,
      alumnos (dni, nombres, apellidos),
      modulos (nombre)
    `)
    .order("fecha_pago", { ascending: false });

  if (alumnoId) {
    query = query.eq("alumno_id", alumnoId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago, concepto, detalles } = body;

  if (!alumno_id || !modulo_id || !nro_recibo || monto_pagado === undefined) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pensiones")
    .insert([
      {
        alumno_id,
        modulo_id,
        nro_recibo,
        monto_pagado,
        deuda_pendiente: deuda_pendiente ?? 0,
        fecha_pago: fecha_pago ?? new Date().toISOString().split("T")[0],
        concepto: concepto ?? "PENSION",
        detalles: detalles || null,
      },
    ])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
