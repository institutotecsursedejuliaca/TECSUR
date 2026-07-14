import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { nro_recibo, monto_pagado, deuda_pendiente, fecha_pago, concepto, detalles } = body;

  if (!nro_recibo || monto_pagado === undefined) {
    return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pensiones")
    .update({
      nro_recibo,
      monto_pagado,
      deuda_pendiente: deuda_pendiente ?? 0,
      fecha_pago: fecha_pago ?? new Date().toISOString().split("T")[0],
      concepto: concepto ?? "PENSION",
      detalles: detalles || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("pensiones")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
