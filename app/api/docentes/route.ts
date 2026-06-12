import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// GET /api/docentes — Listar todos los docentes
export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from("docentes")
    .select("*")
    .order("apellidos", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}

// POST /api/docentes — Crear cuenta de docente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nombres, apellidos, dni } = body;

    if (!email || !password || !nombres || !apellidos) {
      return Response.json(
        { error: "Todos los campos son obligatorios (email, password, nombres, apellidos)" },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json(
        {
          error:
            "La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada. Por favor agrégala en el panel de Vercel y en el archivo .env.local local para crear cuentas de docentes."
        },
        { status: 500 }
      );
    }

    // Inicializar cliente administrativo de Supabase usando el service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return Response.json({ error: "No se pudo recuperar el ID de usuario creado." }, { status: 500 });
    }

    // Insertar docente en la tabla pública
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("docentes")
      .insert([
        {
          id: userId,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          email: email.trim(),
          dni: dni ? dni.trim() : null
        }
      ])
      .select()
      .single();

    if (dbError) {
      // Si la inserción en la BD falla, revertimos el usuario creado en Auth para consistencia
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return Response.json({ error: `Error al insertar docente en BD: ${dbError.message}` }, { status: 500 });
    }

    return Response.json(dbData, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE /api/docentes?id=xxx — Eliminar cuenta de docente
export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "ID de docente es requerido" }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json(
      { error: "La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Al eliminar el usuario en Auth, la clave foránea CASCADE eliminará el perfil en docentes
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, message: "Docente eliminado correctamente" });
}

// PUT /api/docentes — Actualizar o restablecer contraseña
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return Response.json({ error: "El ID del docente es requerido" }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json(
        { error: "La variable de entorno SUPABASE_SERVICE_ROLE_KEY no está configurada." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (action === "reset-password") {
      // Obtener el DNI del docente para usarlo como contraseña
      const { data: doc, error: docError } = await supabaseAdmin
        .from("docentes")
        .select("dni")
        .eq("id", id)
        .single();

      if (docError || !doc?.dni) {
        return Response.json({ error: "No se encontró el DNI del docente para restablecer la contraseña." }, { status: 400 });
      }

      // Actualizar la contraseña en Supabase Auth usando el DNI
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: doc.dni
      });

      if (authError) {
        return Response.json({ error: authError.message }, { status: 400 });
      }

      return Response.json({ success: true, message: "Contraseña restablecida correctamente al DNI del docente." });
    }

    return Response.json({ error: "Acción no soportada" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e.message || "Error interno del servidor" }, { status: 500 });
  }
}
