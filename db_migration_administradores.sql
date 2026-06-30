-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Crear tabla 'administradores' para control de acceso dinámico de administradores
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.administradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombres TEXT,
  apellidos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS para permitir lecturas y escrituras sin restricciones (al igual que las demás tablas)
ALTER TABLE public.administradores DISABLE ROW LEVEL SECURITY;

-- Pre-cargar los administradores existentes en base de datos
INSERT INTO public.administradores (email, nombres, apellidos) VALUES
('admin@tecsur.edu.pe', 'Administrador', 'General'),
('hhuarayachipana@gmail.com', 'Henry', 'Huaraya'),
('administrador@tecsur.com.pe', 'Soporte', 'TECSUR'),
('institutotecsursedejuliaca@gmail.com', 'Intranet', 'TECSUR')
ON CONFLICT (email) DO NOTHING;
