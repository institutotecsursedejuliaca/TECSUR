-- ============================================================
--  TECSUR — Script de Reset Completo
--  ⚠️  BORRA TODOS LOS DATOS Y LA ESTRUCTURA
--  Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- OPCIÓN A: Solo borrar DATOS (mantiene tablas y triggers)
--           Más rápido si ya tienes el schema correcto.
--           Descomenta este bloque si la usas.
-- ──────────────────────────────────────────────────────────────
/*
TRUNCATE TABLE
  auditoria,
  notas_cursos,
  asistencias,
  notas,
  pensiones,
  matriculas,
  cursos,
  modulos,
  carreras,
  alumnos
RESTART IDENTITY CASCADE;
*/

-- ──────────────────────────────────────────────────────────────
-- OPCIÓN B: Borrar TODO (datos + tablas + vistas + triggers)
--           Usa esta para empezar completamente de cero
--           y luego volver a ejecutar los scripts de migración.
-- ──────────────────────────────────────────────────────────────

-- 1. Eliminar vistas
DROP VIEW IF EXISTS v_auditoria          CASCADE;
DROP VIEW IF EXISTS v_carreras_resumen   CASCADE;
DROP VIEW IF EXISTS v_matriculas_detalle CASCADE;
DROP VIEW IF EXISTS v_asistencia_resumen CASCADE;
DROP VIEW IF EXISTS v_notas_matricula    CASCADE;

-- 2. Eliminar funciones auxiliares
DROP FUNCTION IF EXISTS _create_audit_trigger(TEXT) CASCADE;
DROP FUNCTION IF EXISTS fn_audit_log()              CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column()  CASCADE;

-- 3. Eliminar tablas (CASCADE resuelve dependencias automáticamente)
DROP TABLE IF EXISTS auditoria    CASCADE;
DROP TABLE IF EXISTS notas_cursos CASCADE;
DROP TABLE IF EXISTS asistencias  CASCADE;
DROP TABLE IF EXISTS notas        CASCADE;
DROP TABLE IF EXISTS pensiones    CASCADE;
DROP TABLE IF EXISTS matriculas   CASCADE;
DROP TABLE IF EXISTS cursos       CASCADE;
DROP TABLE IF EXISTS modulos      CASCADE;
DROP TABLE IF EXISTS carreras     CASCADE;
DROP TABLE IF EXISTS alumnos      CASCADE;
DROP TABLE IF EXISTS ingresos     CASCADE;

-- 4. Verificar que no quede nada
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
-- Resultado esperado: 0 filas

-- ============================================================
--  DESPUÉS DEL RESET, ejecutar en este orden:
--  1️⃣  supabase_migration_v2.sql   ← crea tablas + datos ejemplo
--  2️⃣  supabase_auditoria.sql      ← crea auditoría + triggers
-- ============================================================
