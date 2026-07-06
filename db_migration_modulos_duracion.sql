-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Modificar columna 'duracion' de la tabla 'modulos' a TEXT y permitir NULL (opcional)
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- 1. Eliminar la vista dependiente v_matriculas_detalle (con CASCADE para seguridad)
DROP VIEW IF EXISTS public.v_matriculas_detalle CASCADE;

-- 2. Alterar el tipo de la columna a TEXT (PostgreSQL convertirá implícitamente los enteros existentes a texto)
ALTER TABLE public.modulos
  ALTER COLUMN duracion TYPE TEXT;

-- 3. Permitir que la columna acepte valores nulos (opcional)
ALTER TABLE public.modulos
  ALTER COLUMN duracion DROP NOT NULL;

-- 4. Recrear la vista v_matriculas_detalle con el nuevo tipo de duracion
CREATE OR REPLACE VIEW public.v_matriculas_detalle AS
SELECT
  m.id                              AS matricula_id,
  m.fecha_registro,
  m.turno,
  m.created_at                      AS matricula_created_at,
  a.id                              AS alumno_id,
  a.dni,
  a.codigo,
  a.nombres,
  a.apellidos,
  a.celular,
  a.correo,
  c.id                              AS carrera_id,
  c.nombre                          AS carrera_nombre,
  mod.id                            AS modulo_id,
  mod.nombre                        AS modulo_nombre,
  mod.profesor,
  mod.local,
  mod.aula,
  mod.horario,
  mod.modalidad,
  mod.fecha_inicio,
  mod.fecha_fin,
  mod.duracion
FROM public.matriculas m
JOIN public.alumnos  a   ON a.id   = m.alumno_id
LEFT JOIN public.carreras c   ON c.id   = m.carrera_id
JOIN public.modulos  mod ON mod.id = m.modulo_id;

