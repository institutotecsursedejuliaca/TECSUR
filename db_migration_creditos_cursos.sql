-- MIGRACIÓN: AGREGAR CAMPO CRÉDITOS A LA TABLA CURSOS
-- Agrega la columna 'creditos' de tipo INTEGER con valor por defecto de 1 a la tabla 'cursos'

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS creditos INTEGER DEFAULT 1;
