import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// POST or PUT notas for a matricula
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    matricula_id,
    inspeccion,
    mantenimiento,
    sistema_hidraulico,
    seguridad,
    ingles,
    operacion,
    asistencia_total,
  } = body;

  if (!matricula_id) {
    return Response.json({ error: "matricula_id es requerido" }, { status: 400 });
  }

  // Calculate promedio
  const scores = [inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion]
    .map(Number)
    .filter((n) => !isNaN(n) && n !== null);
  const promedio = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const payload = {
    matricula_id,
    inspeccion: inspeccion ?? null,
    mantenimiento: mantenimiento ?? null,
    sistema_hidraulico: sistema_hidraulico ?? null,
    seguridad: seguridad ?? null,
    ingles: ingles ?? null,
    operacion: operacion ?? null,
    asistencia_total: asistencia_total ?? null,
    promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
  };

  // Check if a nota already exists for this matricula
  const { data: existing } = await supabase
    .from("notas")
    .select("id")
    .eq("matricula_id", matricula_id)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("notas")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("notas")
      .insert([payload])
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return Response.json(result);
}
