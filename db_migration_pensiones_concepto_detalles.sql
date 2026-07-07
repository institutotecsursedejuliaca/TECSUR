-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Agregar columnas 'concepto' y 'detalles' a la tabla 'pensiones'
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- 1. Agregar columna 'concepto' con valor por defecto 'PENSION' y restricción CHECK
ALTER TABLE public.pensiones
  ADD COLUMN IF NOT EXISTS concepto TEXT NOT NULL DEFAULT 'PENSION'
  CHECK (concepto IN ('PENSION', 'MATRICULA', 'OTROS'));

-- 2. Agregar columna 'detalles' de tipo TEXT (opcional, acepta NULL)
ALTER TABLE public.pensiones
  ADD COLUMN IF NOT EXISTS detalles TEXT;
