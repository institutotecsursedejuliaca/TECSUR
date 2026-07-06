import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// ── GET: listar ingresos con filtros opcionales ─────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni         = searchParams.get("dni")          ?? "";
    const nombre      = searchParams.get("nombre")       ?? "";
    const fechaInicio = searchParams.get("fecha_inicio") ?? "";
    const fechaFin    = searchParams.get("fecha_fin")    ?? "";
    const page        = parseInt(searchParams.get("page")     ?? "1",  10);
    const pageSize    = parseInt(searchParams.get("pageSize") ?? "10", 10);

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    const now  = new Date();
    const hoy  = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    // 0. Count fijo de hoy (independiente de filtros)
    const { count: countHoy } = await supabase
      .from("ingresos")
      .select("*", { count: "exact", head: true })
      .eq("fecha_ingreso", hoy);

    // 1. Si buscan por nombre/apellido → obtener DNIs coincidentes
    let dnisPorNombre: string[] | null = null;
    if (nombre.trim()) {
      const { data: alumnosMatch } = await supabase
        .from("alumnos")
        .select("dni")
        .or(`nombres.ilike.%${nombre}%,apellidos.ilike.%${nombre}%`);
      dnisPorNombre = (alumnosMatch ?? []).map(a => a.dni);
      // Si no hay coincidencias, devolver vacío directamente
      if (dnisPorNombre.length === 0) {
        return Response.json({ data: [], total: 0, page, pageSize, totalHoy: countHoy ?? 0 });
      }
    }

    // 2. Query ingresos
    let query = supabase
      .from("ingresos")
      .select("id, dni_alumno, fecha_ingreso, hora_ingreso, created_at", { count: "exact" });

    if (dni)              query = query.ilike("dni_alumno", `%${dni}%`);
    if (dnisPorNombre)    query = query.in("dni_alumno", dnisPorNombre);
    if (fechaInicio)      query = query.gte("fecha_ingreso", fechaInicio);
    if (fechaFin)         query = query.lte("fecha_ingreso", fechaFin);

    const { data: ingresos, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!ingresos?.length) return Response.json({ data: [], total: count ?? 0, page, pageSize, totalHoy: countHoy ?? 0 });

    // 3. Traer datos de alumnos para los DNIs de esta página
    const dnis = [...new Set(ingresos.map(i => i.dni_alumno))];
    const { data: alumnos } = await supabase
      .from("alumnos")
      .select("dni, nombres, apellidos, carrera")
      .in("dni", dnis);

    const alumnoMap: Record<string, { nombres: string; apellidos: string; carrera: string }> =
      Object.fromEntries((alumnos ?? []).map(a => [a.dni, a]));

    const data = ingresos.map(ing => ({ ...ing, alumnos: alumnoMap[ing.dni_alumno] ?? null }));

    return Response.json({ data, total: count ?? 0, page, pageSize, totalHoy: countHoy ?? 0 });
  } catch {
    return Response.json({ error: "Error interno." }, { status: 500 });
  }
}



// ── POST: registrar nuevo ingreso ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dni } = body;

    if (!dni || String(dni).trim() === "") {
      return Response.json({ error: "El DNI es requerido." }, { status: 400 });
    }

    const dniClean = String(dni).trim();

    // Verificar que el alumno existe
    const { data: alumno, error: alumnoErr } = await supabase
      .from("alumnos")
      .select("id, nombres, apellidos, carrera, dni")
      .eq("dni", dniClean)
      .single();

    if (alumnoErr || !alumno) {
      return Response.json(
        { error: `No se encontró ningún alumno con DNI ${dniClean}.` },
        { status: 404 }
      );
    }

    // Fecha y hora actuales (Lima, UTC-5)
    const now      = new Date();
    const fechaHoy = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now); // YYYY-MM-DD
    const horaHoy  = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Lima",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(now);  // HH:MM:SS

    // Verificar si ya registró ingreso hoy
    const { data: existing } = await supabase
      .from("ingresos")
      .select("id, hora_ingreso")
      .eq("dni_alumno", dniClean)
      .eq("fecha_ingreso", fechaHoy)
      .maybeSingle();

    if (existing) {
      return Response.json(
        {
          error: `${alumno.nombres} ${alumno.apellidos} ya registró su ingreso hoy a las ${existing.hora_ingreso}.`,
          alreadyRegistered: true,
          alumno,
        },
        { status: 409 }
      );
    }

    // Insertar el ingreso
    const { data: ingreso, error: insertErr } = await supabase
      .from("ingresos")
      .insert({
        dni_alumno:    dniClean,
        fecha_ingreso: fechaHoy,
        hora_ingreso:  horaHoy,
      })
      .select()
      .single();

    if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

    return Response.json({ ingreso, alumno }, { status: 201 });
  } catch {
    return Response.json({ error: "Error interno al procesar la solicitud." }, { status: 500 });
  }
}

// ── DELETE: eliminar un ingreso por ID ─────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "El ID del ingreso es requerido." }, { status: 400 });
    }

    const { error } = await supabase
      .from("ingresos")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, message: "Ingreso eliminado correctamente." });
  } catch {
    return Response.json({ error: "Error interno al eliminar el ingreso." }, { status: 500 });
  }
}

