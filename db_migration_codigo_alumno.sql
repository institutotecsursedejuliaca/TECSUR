-- ============================================================
-- TECSUR — Migración: Agregar Código de Alumno
-- Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- 1. Agregar la columna 'codigo' a la tabla 'alumnos' si no existe
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS codigo TEXT UNIQUE;

-- 2. Migrar registros existentes: usar su DNI como código por defecto
UPDATE alumnos SET codigo = dni WHERE codigo IS NULL;

-- 3. (Opcional) Hacer que la columna sea requerida para futuros registros
-- ALTER TABLE alumnos ALTER COLUMN codigo SET NOT NULL;

-- 4. Agregar columna 'dni' a la tabla 'docentes' si no existe
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS dni TEXT;
