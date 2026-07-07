-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Crear tabla 'cargos_modulo' para estructurar los conceptos de pago de cada módulo
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cargos_modulo (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id    UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  concepto     TEXT NOT NULL CHECK (concepto IN ('MATRICULA', 'PENSION', 'OTROS')),
  monto        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
  descripcion  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Desactivar Row Level Security (RLS) para permitir operaciones directas
ALTER TABLE public.cargos_modulo DISABLE ROW LEVEL SECURITY;

