import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/auditoria?tabla=xxx&accion=xxx&search=xxx&page=1&pageSize=50
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page     = parseInt(searchParams.get("page")     ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);
  const tabla    = searchParams.get("tabla")   ?? "";
  const accion   = searchParams.get("accion")  ?? "";
  const search   = searchParams.get("search")  ?? "";

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  let query = supabase
    .from("v_auditoria")
    .select("*", { count: "exact" })
    .order("fecha", { ascending: false })
    .range(from, to);

  if (tabla)  query = query.eq("tabla", tabla);
  if (accion) query = query.eq("accion", accion);
  if (search) query = query.or(
    `usuario_email.ilike.%${search}%,tabla.ilike.%${search}%,registro_id.ilike.%${search}%,resumen.ilike.%${search}%`
  );

  const { data, error, count } = await query;

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  });
}
