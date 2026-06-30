-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Agregar relación de asistencia por curso en lugar de por módulo
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- 1. Eliminar la restricción única existente (que dependía solo de matricula_id y fecha)
ALTER TABLE public.asistencias DROP CONSTRAINT IF EXISTS asistencias_matricula_id_fecha_key;

-- 2. Agregar columna curso_id a la tabla asistencias
ALTER TABLE public.asistencias ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE;

-- 3. Crear índice para optimizar consultas de asistencia por curso
CREATE INDEX IF NOT EXISTS idx_asistencias_curso_id ON public.asistencias(curso_id);

-- 4. Crear la nueva restricción de unicidad para matricula, curso y fecha
ALTER TABLE public.asistencias ADD CONSTRAINT asistencias_matricula_curso_fecha_key UNIQUE (matricula_id, curso_id, fecha);
