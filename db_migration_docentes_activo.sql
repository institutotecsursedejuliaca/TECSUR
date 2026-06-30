-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Agregar columna 'activo' para dar de baja la cuenta de docentes
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

ALTER TABLE public.docentes
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
