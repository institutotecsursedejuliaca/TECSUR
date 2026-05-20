-- ============================================================
--  TECSUR — Intranet Académica de Maquinaria Pesada
--  Script completo: Tablas + Datos de ejemplo
--  Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. LIMPIEZA (opcional: borra tablas si ya existen)
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS notas       CASCADE;
DROP TABLE IF EXISTS pensiones   CASCADE;
DROP TABLE IF EXISTS matriculas  CASCADE;
DROP TABLE IF EXISTS modulos     CASCADE;
DROP TABLE IF EXISTS alumnos     CASCADE;

-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIÓN UUID
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 2. TABLA: alumnos
-- ────────────────────────────────────────────────────────────
CREATE TABLE alumnos (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni        VARCHAR(12) UNIQUE NOT NULL,
  nombres    TEXT        NOT NULL,
  apellidos  TEXT        NOT NULL,
  carrera    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. TABLA: modulos
-- ────────────────────────────────────────────────────────────
CREATE TABLE modulos (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT    NOT NULL,
  fecha_inicio DATE    NOT NULL,
  fecha_fin    DATE    NOT NULL,
  modalidad    TEXT    NOT NULL CHECK (modalidad IN ('presencial', 'virtual')),
  duracion     INTEGER NOT NULL,   -- en horas
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. TABLA: matriculas
-- ────────────────────────────────────────────────────────────
CREATE TABLE matriculas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id      UUID NOT NULL REFERENCES alumnos(id)  ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES modulos(id)  ON DELETE CASCADE,
  fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (alumno_id, modulo_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. TABLA: notas
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- 6. TABLA: pensiones
-- ────────────────────────────────────────────────────────────
CREATE TABLE pensiones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id        UUID          NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  modulo_id        UUID          NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nro_recibo       TEXT          NOT NULL,
  monto_pagado     NUMERIC(10,2) NOT NULL DEFAULT 0,
  deuda_pendiente  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_pago       DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
--  DATOS DE EJEMPLO
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- A. ALUMNOS (10 registros)
-- ────────────────────────────────────────────────────────────
INSERT INTO alumnos (dni, nombres, apellidos, carrera) VALUES
  ('47123456', 'Carlos Enrique',  'Ríos Mamani',       'Operación de Cargador Frontal'),
  ('48234567', 'Luis Alberto',    'Quispe Flores',     'Operación de Excavadora'),
  ('49345678', 'Jorge Hernán',    'Condori Tapia',     'Operación de Motoniveladora'),
  ('50456789', 'María Elena',     'Huanca Vargas',     'Operación de Cargador Frontal'),
  ('51567890', 'Pedro Augusto',   'Mamani Cruz',       'Mantenimiento de Maquinaria Pesada'),
  ('52678901', 'Ana Lucía',       'Torres Salinas',    'Seguridad Minera'),
  ('53789012', 'Roberto Carlos',  'Apaza Ramos',       'Operación de Excavadora'),
  ('54890123', 'Sandra Milagros', 'Lipa Choque',       'Operación de Tractor de Orugas'),
  ('55901234', 'Víctor Hugo',     'Ccama Quispe',      'Mantenimiento de Maquinaria Pesada'),
  ('56012345', 'Jhon Fredy',      'Catacora Mendoza',  'Operación de Cargador Frontal');

-- ────────────────────────────────────────────────────────────
-- B. MÓDULOS (5 registros)
-- ────────────────────────────────────────────────────────────
INSERT INTO modulos (nombre, fecha_inicio, fecha_fin, modalidad, duracion) VALUES
  ('Cargador Frontal',          '2025-01-15', '2025-04-15', 'presencial', 120),
  ('Excavadora Hidráulica',     '2025-02-01', '2025-05-01', 'presencial', 120),
  ('Motoniveladora',            '2025-03-01', '2025-05-31', 'presencial', 100),
  ('Mantenimiento Preventivo',  '2025-04-01', '2025-06-30', 'virtual',     80),
  ('Seguridad en Operaciones',  '2025-05-01', '2025-07-31', 'presencial',  60);

-- ────────────────────────────────────────────────────────────
-- C. MATRÍCULAS  (uso de subconsultas para obtener los IDs)
-- ────────────────────────────────────────────────────────────
INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-01-20'
FROM alumnos a, modulos m
WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-01-20'
FROM alumnos a, modulos m
WHERE a.dni = '48234567' AND m.nombre = 'Cargador Frontal';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-02-05'
FROM alumnos a, modulos m
WHERE a.dni = '48234567' AND m.nombre = 'Excavadora Hidráulica';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-02-05'
FROM alumnos a, modulos m
WHERE a.dni = '49345678' AND m.nombre = 'Motoniveladora';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-01-22'
FROM alumnos a, modulos m
WHERE a.dni = '50456789' AND m.nombre = 'Cargador Frontal';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-04-03'
FROM alumnos a, modulos m
WHERE a.dni = '51567890' AND m.nombre = 'Mantenimiento Preventivo';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-05-02'
FROM alumnos a, modulos m
WHERE a.dni = '52678901' AND m.nombre = 'Seguridad en Operaciones';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-02-10'
FROM alumnos a, modulos m
WHERE a.dni = '53789012' AND m.nombre = 'Excavadora Hidráulica';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-04-05'
FROM alumnos a, modulos m
WHERE a.dni = '54890123' AND m.nombre = 'Mantenimiento Preventivo';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-01-25'
FROM alumnos a, modulos m
WHERE a.dni = '55901234' AND m.nombre = 'Cargador Frontal';

INSERT INTO matriculas (alumno_id, modulo_id, fecha_registro)
SELECT a.id, m.id, '2025-01-28'
FROM alumnos a, modulos m
WHERE a.dni = '56012345' AND m.nombre = 'Cargador Frontal';

-- ────────────────────────────────────────────────────────────
-- D. NOTAS  (para cada matrícula existente)
-- ────────────────────────────────────────────────────────────

-- Carlos Ríos — Cargador Frontal
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 17.0, 16.5, 18.0, 17.5, 14.0, 18.5,
       ROUND((17.0+16.5+18.0+17.5+14.0+18.5)/6, 2), 95.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal';

-- Luis Quispe — Cargador Frontal
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 14.0, 13.5, 15.0, 14.5, 12.0, 15.5,
       ROUND((14.0+13.5+15.0+14.5+12.0+15.5)/6, 2), 88.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '48234567' AND m.nombre = 'Cargador Frontal';

-- Luis Quispe — Excavadora Hidráulica
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 16.0, 15.0, 14.0, 16.5, 13.0, 17.0,
       ROUND((16.0+15.0+14.0+16.5+13.0+17.0)/6, 2), 92.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '48234567' AND m.nombre = 'Excavadora Hidráulica';

-- Jorge Condori — Motoniveladora
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 12.0, 11.5, 13.0, 12.5, 10.0, 14.0,
       ROUND((12.0+11.5+13.0+12.5+10.0+14.0)/6, 2), 78.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '49345678' AND m.nombre = 'Motoniveladora';

-- María Huanca — Cargador Frontal
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 19.0, 18.5, 19.0, 18.0, 16.0, 19.5,
       ROUND((19.0+18.5+19.0+18.0+16.0+19.5)/6, 2), 100.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '50456789' AND m.nombre = 'Cargador Frontal';

-- Pedro Mamani — Mantenimiento Preventivo
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 15.0, 16.0, 14.5, 15.5, 13.0, 16.0,
       ROUND((15.0+16.0+14.5+15.5+13.0+16.0)/6, 2), 90.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '51567890' AND m.nombre = 'Mantenimiento Preventivo';

-- Roberto Apaza — Excavadora Hidráulica
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 10.0, 11.0, 10.5, 11.5, 9.0, 12.0,
       ROUND((10.0+11.0+10.5+11.5+9.0+12.0)/6, 2), 72.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '53789012' AND m.nombre = 'Excavadora Hidráulica';

-- Sandra Lipa — Mantenimiento Preventivo
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 17.5, 18.0, 17.0, 18.5, 15.0, 18.0,
       ROUND((17.5+18.0+17.0+18.5+15.0+18.0)/6, 2), 96.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '54890123' AND m.nombre = 'Mantenimiento Preventivo';

-- Víctor Ccama — Cargador Frontal
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 13.0, 12.5, 14.0, 13.5, 11.0, 14.5,
       ROUND((13.0+12.5+14.0+13.5+11.0+14.5)/6, 2), 83.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '55901234' AND m.nombre = 'Cargador Frontal';

-- Jhon Catacora — Cargador Frontal
INSERT INTO notas (matricula_id, inspeccion, mantenimiento, sistema_hidraulico, seguridad, ingles, operacion, promedio, asistencia_total)
SELECT mat.id, 16.5, 15.5, 16.0, 17.0, 14.0, 17.5,
       ROUND((16.5+15.5+16.0+17.0+14.0+17.5)/6, 2), 91.00
FROM matriculas mat
JOIN alumnos a ON a.id = mat.alumno_id
JOIN modulos  m ON m.id = mat.modulo_id
WHERE a.dni = '56012345' AND m.nombre = 'Cargador Frontal';

-- ────────────────────────────────────────────────────────────
-- E. PENSIONES
-- ────────────────────────────────────────────────────────────

-- Carlos Ríos — Cargador Frontal (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-001', 450.00, 0.00, '2025-01-20'
FROM alumnos a, modulos m WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal';

INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-002', 450.00, 0.00, '2025-02-20'
FROM alumnos a, modulos m WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal';

INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-003', 450.00, 0.00, '2025-03-20'
FROM alumnos a, modulos m WHERE a.dni = '47123456' AND m.nombre = 'Cargador Frontal';

-- Luis Quispe — Cargador Frontal (con deuda)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-004', 300.00, 150.00, '2025-01-22'
FROM alumnos a, modulos m WHERE a.dni = '48234567' AND m.nombre = 'Cargador Frontal';

-- Luis Quispe — Excavadora (con deuda)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-005', 200.00, 250.00, '2025-02-10'
FROM alumnos a, modulos m WHERE a.dni = '48234567' AND m.nombre = 'Excavadora Hidráulica';

-- Jorge Condori — Motoniveladora (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-006', 400.00, 0.00, '2025-03-05'
FROM alumnos a, modulos m WHERE a.dni = '49345678' AND m.nombre = 'Motoniveladora';

-- María Huanca — Cargador Frontal (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-007', 450.00, 0.00, '2025-01-25'
FROM alumnos a, modulos m WHERE a.dni = '50456789' AND m.nombre = 'Cargador Frontal';

INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-008', 450.00, 0.00, '2025-02-25'
FROM alumnos a, modulos m WHERE a.dni = '50456789' AND m.nombre = 'Cargador Frontal';

-- Pedro Mamani — Mantenimiento (con deuda)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-009', 350.00, 100.00, '2025-04-10'
FROM alumnos a, modulos m WHERE a.dni = '51567890' AND m.nombre = 'Mantenimiento Preventivo';

-- Ana Torres — Seguridad (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-010', 300.00, 0.00, '2025-05-05'
FROM alumnos a, modulos m WHERE a.dni = '52678901' AND m.nombre = 'Seguridad en Operaciones';

-- Roberto Apaza — Excavadora (deuda alta)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-011', 150.00, 300.00, '2025-02-15'
FROM alumnos a, modulos m WHERE a.dni = '53789012' AND m.nombre = 'Excavadora Hidráulica';

-- Sandra Lipa — Mantenimiento (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-012', 350.00, 0.00, '2025-04-08'
FROM alumnos a, modulos m WHERE a.dni = '54890123' AND m.nombre = 'Mantenimiento Preventivo';

INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-013', 350.00, 0.00, '2025-05-08'
FROM alumnos a, modulos m WHERE a.dni = '54890123' AND m.nombre = 'Mantenimiento Preventivo';

-- Víctor Ccama — Cargador Frontal (al día)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-014', 450.00, 0.00, '2025-01-28'
FROM alumnos a, modulos m WHERE a.dni = '55901234' AND m.nombre = 'Cargador Frontal';

-- Jhon Catacora — Cargador Frontal (con pequeña deuda)
INSERT INTO pensiones (alumno_id, modulo_id, nro_recibo, monto_pagado, deuda_pendiente, fecha_pago)
SELECT a.id, m.id, 'REC-2025-015', 400.00, 50.00, '2025-02-01'
FROM alumnos a, modulos m WHERE a.dni = '56012345' AND m.nombre = 'Cargador Frontal';

-- ============================================================
--  VERIFICACIÓN FINAL
-- ============================================================
SELECT 'alumnos'    AS tabla, COUNT(*) AS registros FROM alumnos    UNION ALL
SELECT 'modulos',             COUNT(*)               FROM modulos    UNION ALL
SELECT 'matriculas',          COUNT(*)               FROM matriculas UNION ALL
SELECT 'notas',               COUNT(*)               FROM notas      UNION ALL
SELECT 'pensiones',           COUNT(*)               FROM pensiones;
