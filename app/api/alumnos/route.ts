import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // 1. Extraer los parámetros de búsqueda de la URL (?page=X&pageSize=Y&search=Z)
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "10", 10);
    const search = searchParams.get("search") ?? "";

    // 2. Calcular los rangos (From / To) basados en índices cero para Supabase
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 3. Crear la consulta base pidiendo el conteo exacto de filas en la tabla
    let query = supabase
      .from("alumnos")
      .select("*", { count: "exact" });

    // 4. Si el usuario escribió algo en el buscador, aplicar el filtro dinámico
    if (search) {
      // .or() evalúa si coincide en DNI, nombres O apellidos usando ILIKE (no distingue mayúsculas)
      query = query.or(
        `dni.ilike.%${search}%,nombres.ilike.%${search}%,apellidos.ilike.%${search}%`
      );
    }

    // 5. Aplicar orden, paginado por rangos y ejecutar la consulta
    const { data, error, count } = await query
      .order("apellidos", { ascending: true })
      .range(from, to);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // 6. Retornar la respuesta con la estructura exacta que tu frontend necesita (PaginatedResponse)
    return Response.json({
      data: data ?? [],
      total: count ?? 0,
      page: page,
      pageSize: pageSize,
    });

  } catch (err) {
    return Response.json(
      { error: "Error interno al procesar la solicitud de alumnos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { dni, nombres, apellidos, carrera } = body;

  if (!dni || !nombres || !apellidos || !carrera) {
    return Response.json({ error: "DNI, nombres, apellidos y carrera son requeridos" }, { status: 400 });
  }

  const fields = {
    dni, nombres, apellidos, carrera,
    fecha_nacimiento:     body.fecha_nacimiento     || null,
    nac_distrito:         body.nac_distrito         || null,
    nac_provincia:        body.nac_provincia        || null,
    nac_departamento:     body.nac_departamento     || null,
    direccion:            body.direccion            || null,
    dir_distrito:         body.dir_distrito         || null,
    dir_referencia:       body.dir_referencia       || null,
    telefono:             body.telefono             || null,
    celular:              body.celular              || null,
    correo:               body.correo               || null,
    facebook:             body.facebook             || null,
    colegio:              body.colegio              || null,
    colegio_distrito:     body.colegio_distrito     || null,
    apoderado_nombre:     body.apoderado_nombre     || null,
    apoderado_parentesco: body.apoderado_parentesco || null,
    apoderado_celular:    body.apoderado_celular    || null,
  };

  const { data, error } = await supabase
    .from("alumnos")
    .insert([fields])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}