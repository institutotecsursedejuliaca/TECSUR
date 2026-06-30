-- =============================================================================
-- TECSUR Intranet Académica — Script de Migración
-- Reasignación de Relación Docentes a nivel de Cursos (en lugar de Módulos)
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- 1. Eliminar la vista que depende de modulos.docente_id para recrearla luego
DROP VIEW IF EXISTS public.v_matriculas_detalle CASCADE;

-- 2. Eliminar la columna docente_id de la tabla modulos (junto con su índice)
DROP INDEX IF EXISTS public.idx_modulos_docente_id;
ALTER TABLE public.modulos 
  DROP COLUMN IF EXISTS docente_id;

-- 3. Agregar la columna docente_id a la tabla cursos
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS docente_id UUID REFERENCES public.docentes(id) ON DELETE SET NULL;

-- 4. Crear índice para mejorar consultas de filtrado por docente en cursos
CREATE INDEX IF NOT EXISTS idx_cursos_docente_id ON public.cursos(docente_id);

-- 5. Recrear la vista v_matriculas_detalle (sin mod.docente_id)
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

-- 6. Habilitar disparador de auditoría para la nueva columna en cursos (si corresponde)
-- El disparador trg_audit_cursos ya está configurado y auditará automáticamente el nuevo campo
