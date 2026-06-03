-- ============================================================
--  TECSUR — Instalación Completa desde Cero (v2)
--  Ejecutar DESPUÉS de supabase_reset.sql
--  Supabase > SQL Editor > New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función reutilizable para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────
-- 1. ALUMNOS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE alumnos (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni                  VARCHAR(12) UNIQUE NOT NULL,
  nombres              TEXT        NOT NULL,
  apellidos            TEXT        NOT NULL,
  carrera              TEXT        NOT NULL,       -- campo legacy de texto libre
  fecha_nacimiento     DATE,
  nac_distrito         TEXT,
  nac_provincia        TEXT,
  nac_departamento     TEXT,
  direccion            TEXT,
  dir_distrito         TEXT,
  dir_referencia       TEXT,
  telefono             TEXT,
  celular              TEXT,
  correo               TEXT,
  facebook             TEXT,
  colegio              TEXT,
  colegio_distrito     TEXT,
  apoderado_nombre     TEXT,
  apoderado_parentesco TEXT,
  apoderado_celular    TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 2. CARRERAS
--    El instituto puede tener n carreras.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE carreras (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT        NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER carreras_updated_at
  BEFORE UPDATE ON carreras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 3. MÓDULOS
--    Cada carrera tiene n módulos.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE modulos (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrera_id   UUID    REFERENCES carreras(id) ON DELETE SET NULL,
  nombre       TEXT    NOT NULL,
  profesor     TEXT,
  horario      TEXT,                              -- descripción libre del horario
  fecha_inicio DATE    NOT NULL,
  fecha_fin    DATE    NOT NULL,
  local        TEXT,
  aula         TEXT,
  modalidad    TEXT    NOT NULL
    CHECK (modalidad IN ('presencial', 'virtual', 'semipresencial')),
  duracion     INTEGER NOT NULL,                  -- horas totales
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER modulos_updated_at
  BEFORE UPDATE ON modulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 4. CURSOS
--    Cada módulo tiene n cursos.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE cursos (
  id          UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id   UUID     NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nombre      TEXT     NOT NULL,
  descripcion TEXT,
  orden       SMALLINT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (modulo_id, nombre)
);
CREATE TRIGGER cursos_updated_at
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 5. MATRÍCULAS
--    Un alumno puede estar en n carreras y n módulos.
--    Incluye turno (horario de asistencia).
-- ──────────────────────────────────────────────────────────────
CREATE TABLE matriculas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id      UUID NOT NULL REFERENCES alumnos(id)  ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES modulos(id)  ON DELETE CASCADE,
  carrera_id     UUID REFERENCES carreras(id)          ON DELETE SET NULL,
  turno          TEXT NOT NULL DEFAULT 'mañana'
    CHECK (turno IN (
      'mañana',       -- 08:00 – 12:00
      'tarde',        -- 13:00 – 17:00
      'noche',        -- 17:00 – 20:30
      'sabado_am',    -- sáb 08:00 – 13:00
      'sabado_full',  -- sáb 08:00 – 17:00
      'domingo_am',   -- dom 08:00 – 13:00
      'domingo_full'  -- dom 08:00 – 17:00
    )),
  fecha_registro DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (alumno_id, modulo_id)
);
CREATE TRIGGER matriculas_updated_at
  BEFORE UPDATE ON matriculas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 6. NOTAS (tabla legada — campos fijos por matrícula)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE notas (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id       UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  inspeccion         NUMERIC(4,2),
  mantenimiento      NUMERIC(4,2),
  sistema_hidraulico NUMERIC(4,2),
  seguridad          NUMERIC(4,2),
  ingles             NUMERIC(4,2),
  operacion          NUMERIC(4,2),
  promedio           NUMERIC(4,2),
  asistencia_total   NUMERIC(5,2),   -- porcentaje 0–100
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (matricula_id)
);

-- ──────────────────────────────────────────────────────────────
-- 7. NOTAS POR CURSO (nueva — nota 0-20 por alumno + curso)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE notas_cursos (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id UUID         NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  curso_id     UUID         NOT NULL REFERENCES cursos(id)     ON DELETE CASCADE,
  nota         NUMERIC(4,2) CHECK (nota >= 0 AND nota <= 20),
  observacion  TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (matricula_id, curso_id)
);
CREATE TRIGGER notas_cursos_updated_at
  BEFORE UPDATE ON notas_cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────
-- 8. ASISTENCIAS (registro diario por alumno + módulo)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE asistencias (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id UUID        NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  modulo_id    UUID        NOT NULL REFERENCES modulos(id)    ON DELETE CASCADE,
  fecha        DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado       TEXT        NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente', 'tardanza', 'falta', 'justificado')),
  hora_entrada TIME,
  hora_salida  TIME,
  duracion_min INTEGER,
  observacion  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (matricula_id, fecha)
);

-- ──────────────────────────────────────────────────────────────
-- 9. PENSIONES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE pensiones (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID          NOT NULL REFERENCES alumnos(id)  ON DELETE CASCADE,
  modulo_id       UUID          NOT NULL REFERENCES modulos(id)  ON DELETE CASCADE,
  nro_recibo      TEXT          NOT NULL,
  monto_pagado    NUMERIC(10,2) NOT NULL DEFAULT 0,
  deuda_pendiente NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_pago      DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 10. INGRESOS (control de acceso por DNI)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE ingresos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni_alumno    VARCHAR(12) NOT NULL,
  fecha_ingreso DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora_ingreso  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- 11. VISTAS
-- ──────────────────────────────────────────────────────────────

-- Carreras con totales
CREATE VIEW v_carreras_resumen AS
SELECT
  c.id,
  c.nombre,
  c.descripcion,
  c.created_at,
  COUNT(DISTINCT mod.id)        AS total_modulos,
  COUNT(DISTINCT mat.id)        AS total_matriculas,
  COUNT(DISTINCT mat.alumno_id) AS total_alumnos
FROM carreras c
LEFT JOIN modulos    mod ON mod.carrera_id = c.id
LEFT JOIN matriculas mat ON mat.carrera_id = c.id
GROUP BY c.id, c.nombre, c.descripcion, c.created_at;

-- Matrícula con detalle completo
CREATE VIEW v_matriculas_detalle AS
SELECT
  m.id             AS matricula_id,
  m.fecha_registro,
  m.turno,
  m.created_at     AS matricula_created_at,
  a.id             AS alumno_id,
  a.dni, a.nombres, a.apellidos, a.celular, a.correo,
  c.id             AS carrera_id,
  c.nombre         AS carrera_nombre,
  mod.id           AS modulo_id,
  mod.nombre       AS modulo_nombre,
  mod.profesor, mod.local, mod.aula, mod.horario,
  mod.modalidad, mod.fecha_inicio, mod.fecha_fin, mod.duracion
FROM matriculas m
JOIN  alumnos  a   ON a.id   = m.alumno_id
LEFT JOIN carreras c   ON c.id   = m.carrera_id
JOIN  modulos  mod ON mod.id = m.modulo_id;

-- Resumen de asistencia por matrícula
CREATE VIEW v_asistencia_resumen AS
SELECT
  matricula_id,
  modulo_id,
  COUNT(*) FILTER (WHERE estado = 'presente')    AS dias_presente,
  COUNT(*) FILTER (WHERE estado = 'tardanza')    AS dias_tardanza,
  COUNT(*) FILTER (WHERE estado = 'falta')       AS dias_falta,
  COUNT(*) FILTER (WHERE estado = 'justificado') AS dias_justificado,
  COUNT(*)                                        AS total_sesiones,
  SUM(duracion_min)                               AS total_minutos,
  ROUND(
    COUNT(*) FILTER (WHERE estado IN ('presente','tardanza'))::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                               AS porcentaje_asistencia
FROM asistencias
GROUP BY matricula_id, modulo_id;

-- Promedio de notas por matrícula (desde notas_cursos)
CREATE VIEW v_notas_matricula AS
SELECT
  matricula_id,
  COUNT(id)             AS total_cursos,
  ROUND(AVG(nota), 2)   AS promedio,
  MIN(nota)             AS nota_min,
  MAX(nota)             AS nota_max
FROM notas_cursos
GROUP BY matricula_id;

-- ──────────────────────────────────────────────────────────────
-- 12. DATOS DE EJEMPLO
-- ──────────────────────────────────────────────────────────────

-- Carreras
INSERT INTO carreras (nombre, descripcion) VALUES
  ('Operación de Cargador Frontal',      'Formación en manejo y operación de cargador frontal'),
  ('Operación de Excavadora',            'Formación en excavadora hidráulica y de orugas'),
  ('Operación de Motoniveladora',        'Manejo de motoniveladora para obras civiles'),
  ('Operación de Tractor de Orugas',     'Operación de tractor de orugas en minería'),
  ('Mantenimiento de Maquinaria Pesada', 'Mantenimiento preventivo y correctivo de maquinaria'),
  ('Seguridad Minera',                   'Normas y procedimientos de seguridad en minería');

-- Alumnos
INSERT INTO alumnos (dni, nombres, apellidos, carrera) VALUES
  ('47123456', 'Carlos Enrique',  'Ríos Mamani',      'Operación de Cargador Frontal'),
  ('48234567', 'Luis Alberto',    'Quispe Flores',    'Operación de Excavadora'),
  ('49345678', 'Jorge Hernán',    'Condori Tapia',    'Operación de Motoniveladora'),
  ('50456789', 'María Elena',     'Huanca Vargas',    'Operación de Cargador Frontal'),
  ('51567890', 'Pedro Augusto',   'Mamani Cruz',      'Mantenimiento de Maquinaria Pesada'),
  ('52678901', 'Ana Lucía',       'Torres Salinas',   'Seguridad Minera'),
  ('53789012', 'Roberto Carlos',  'Apaza Ramos',      'Operación de Excavadora'),
  ('54890123', 'Sandra Milagros', 'Lipa Choque',      'Operación de Tractor de Orugas'),
  ('55901234', 'Víctor Hugo',     'Ccama Quispe',     'Mantenimiento de Maquinaria Pesada'),
  ('56012345', 'Jhon Fredy',      'Catacora Mendoza', 'Operación de Cargador Frontal');

-- Módulos (vinculados a carreras)
INSERT INTO modulos (carrera_id, nombre, profesor, horario, fecha_inicio, fecha_fin, local, aula, modalidad, duracion)
SELECT c.id, 'Cargador Frontal I', 'Ing. Ramirez', 'Lun-Vie 08:00-12:00', '2026-01-15', '2026-04-15', 'Sede Central', 'Aula 1A', 'presencial', 120
FROM carreras c WHERE c.nombre = 'Operación de Cargador Frontal';

INSERT INTO modulos (carrera_id, nombre, profesor, horario, fecha_inicio, fecha_fin, local, aula, modalidad, duracion)
SELECT c.id, 'Excavadora Hidráulica I', 'Ing. Flores', 'Lun-Vie 13:00-17:00', '2026-02-01', '2026-05-01', 'Sede Central', 'Aula 2B', 'presencial', 120
FROM carreras c WHERE c.nombre = 'Operación de Excavadora';

INSERT INTO modulos (carrera_id, nombre, profesor, horario, fecha_inicio, fecha_fin, local, aula, modalidad, duracion)
SELECT c.id, 'Motoniveladora Básico', 'Ing. Condori', 'Sáb 08:00-13:00', '2026-03-01', '2026-05-31', 'Sede Norte', 'Aula 3C', 'presencial', 100
FROM carreras c WHERE c.nombre = 'Operación de Motoniveladora';

INSERT INTO modulos (carrera_id, nombre, profesor, horario, fecha_inicio, fecha_fin, local, aula, modalidad, duracion)
SELECT c.id, 'Mantenimiento Preventivo', 'Ing. Quispe', 'Lun-Vie 17:00-20:30', '2026-04-01', '2026-06-30', 'Online', NULL, 'virtual', 80
FROM carreras c WHERE c.nombre = 'Mantenimiento de Maquinaria Pesada';

INSERT INTO modulos (carrera_id, nombre, profesor, horario, fecha_inicio, fecha_fin, local, aula, modalidad, duracion)
SELECT c.id, 'Seguridad en Operaciones', 'Ing. Torres', 'Sáb-Dom 08:00-17:00', '2026-05-01', '2026-07-31', 'Sede Central', 'Aula 1B', 'semipresencial', 60
FROM carreras c WHERE c.nombre = 'Seguridad Minera';

-- Cursos del módulo Cargador Frontal I
INSERT INTO cursos (modulo_id, nombre, orden)
SELECT m.id, c.nombre, c.ord FROM modulos m,
  (VALUES ('Inspección y Checklist',1),('Mantenimiento Básico',2),('Sistema Hidráulico',3),('Seguridad Operacional',4),('Inglés Técnico',5),('Operación en Campo',6)) AS c(nombre,ord)
WHERE m.nombre = 'Cargador Frontal I';

-- Cursos del módulo Excavadora Hidráulica I
INSERT INTO cursos (modulo_id, nombre, orden)
SELECT m.id, c.nombre, c.ord FROM modulos m,
  (VALUES ('Inspección y Checklist',1),('Sistemas de la Excavadora',2),('Hidráulica Avanzada',3),('Seguridad en Excavaciones',4),('Inglés Técnico',5),('Práctica de Operación',6)) AS c(nombre,ord)
WHERE m.nombre = 'Excavadora Hidráulica I';

-- Matrículas de ejemplo
INSERT INTO matriculas (alumno_id, modulo_id, carrera_id, turno, fecha_registro)
SELECT a.id, m.id, m.carrera_id, 'mañana', '2026-01-20'
FROM alumnos a, modulos m WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal I';

INSERT INTO matriculas (alumno_id, modulo_id, carrera_id, turno, fecha_registro)
SELECT a.id, m.id, m.carrera_id, 'tarde', '2026-01-20'
FROM alumnos a, modulos m WHERE a.dni = '48234567' AND m.nombre = 'Excavadora Hidráulica I';

INSERT INTO matriculas (alumno_id, modulo_id, carrera_id, turno, fecha_registro)
SELECT a.id, m.id, m.carrera_id, 'mañana', '2026-02-05'
FROM alumnos a, modulos m WHERE a.dni = '50456789' AND m.nombre = 'Cargador Frontal I';

-- ──────────────────────────────────────────────────────────────
-- 13. DESACTIVAR RLS EN TODAS LAS TABLAS
--     La intranet usa el anon key con acceso total (sin RLS).
--     Si RLS está activo, el frontend no verá ningún dato.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE alumnos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE carreras     DISABLE ROW LEVEL SECURITY;
ALTER TABLE modulos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE cursos       DISABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas   DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas        DISABLE ROW LEVEL SECURITY;
ALTER TABLE notas_cursos DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias  DISABLE ROW LEVEL SECURITY;
ALTER TABLE pensiones    DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos     DISABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────
-- 14. VERIFICACIÓN FINAL
-- ──────────────────────────────────────────────────────────────
SELECT tabla, registros FROM (
  SELECT 'alumnos'     AS tabla, COUNT(*) AS registros FROM alumnos     UNION ALL
  SELECT 'carreras',             COUNT(*)               FROM carreras    UNION ALL
  SELECT 'modulos',              COUNT(*)               FROM modulos     UNION ALL
  SELECT 'cursos',               COUNT(*)               FROM cursos      UNION ALL
  SELECT 'matriculas',           COUNT(*)               FROM matriculas  UNION ALL
  SELECT 'notas',                COUNT(*)               FROM notas       UNION ALL
  SELECT 'notas_cursos',         COUNT(*)               FROM notas_cursos UNION ALL
  SELECT 'asistencias',          COUNT(*)               FROM asistencias UNION ALL
  SELECT 'pensiones',            COUNT(*)               FROM pensiones   UNION ALL
  SELECT 'ingresos',             COUNT(*)               FROM ingresos
) t ORDER BY tabla;

-- ──────────────────────────────────────────────────────────────
-- 15. DIAGNÓSTICO: verificar estado RLS de cada tabla
-- ──────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_activo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('alumnos','carreras','modulos','cursos','matriculas','notas','notas_cursos','asistencias','pensiones','ingresos')
ORDER BY tablename;
-- rls_activo debe ser FALSE en todas las filas

