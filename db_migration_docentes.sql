-- ============================================================
-- TECSUR Intranet Académica — Script de Migración para Docentes
-- Ejecutar en el editor SQL de Supabase (https://supabase.com)
-- ============================================================

-- 1. Crear tabla de docentes vinculada a auth.users de Supabase
CREATE TABLE IF NOT EXISTS public.docentes (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres     TEXT NOT NULL,
  apellidos   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar actualización automática de updated_at para la tabla docentes
CREATE OR REPLACE TRIGGER docentes_updated_at
  BEFORE UPDATE ON public.docentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Agregar columna docente_id a la tabla de módulos para asignar docentes
ALTER TABLE public.modulos 
  ADD COLUMN IF NOT EXISTS docente_id UUID REFERENCES public.docentes(id) ON DELETE SET NULL;

-- 4. Desactivar RLS en la tabla de docentes (para coherencia con el resto del proyecto)
ALTER TABLE public.docentes DISABLE ROW LEVEL SECURITY;

-- 5. Crear índice para mejorar consultas de filtrado por docente
CREATE INDEX IF NOT EXISTS idx_modulos_docente_id ON public.modulos(docente_id);
