-- ============================================================
-- TECSUR — Ampliar tabla alumnos con campos adicionales
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

ALTER TABLE alumnos
  ADD COLUMN IF NOT EXISTS fecha_nacimiento       DATE,
  ADD COLUMN IF NOT EXISTS nac_distrito           TEXT,
  ADD COLUMN IF NOT EXISTS nac_provincia          TEXT,
  ADD COLUMN IF NOT EXISTS nac_departamento       TEXT,
  ADD COLUMN IF NOT EXISTS direccion              TEXT,
  ADD COLUMN IF NOT EXISTS dir_distrito           TEXT,
  ADD COLUMN IF NOT EXISTS dir_referencia         TEXT,
  ADD COLUMN IF NOT EXISTS telefono               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS celular                VARCHAR(20),
  ADD COLUMN IF NOT EXISTS correo                 TEXT,
  ADD COLUMN IF NOT EXISTS facebook               TEXT,
  ADD COLUMN IF NOT EXISTS colegio                TEXT,
  ADD COLUMN IF NOT EXISTS colegio_distrito       TEXT,
  ADD COLUMN IF NOT EXISTS apoderado_nombre       TEXT,
  ADD COLUMN IF NOT EXISTS apoderado_parentesco   TEXT,
  ADD COLUMN IF NOT EXISTS apoderado_celular      VARCHAR(20);
