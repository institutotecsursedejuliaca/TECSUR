-- ============================================================
-- TECSUR Intranet Académica — Script de creación de tablas
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni        VARCHAR(12) UNIQUE NOT NULL,
  nombres    TEXT NOT NULL,
  apellidos  TEXT NOT NULL,
  carrera    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Módulos
CREATE TABLE IF NOT EXISTS modulos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,
  modalidad    TEXT NOT NULL CHECK (modalidad IN ('presencial', 'virtual')),
  duracion     INTEGER NOT NULL,    -- horas
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Matrículas
CREATE TABLE IF NOT EXISTS matriculas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id      UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, modulo_id)   -- un alumno sólo puede estar matriculado una vez por módulo
);

-- 4. Tabla de Notas
CREATE TABLE IF NOT EXISTS notas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id      UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  inspeccion        NUMERIC(4,2),
  mantenimiento     NUMERIC(4,2),
  sistema_hidraulico NUMERIC(4,2),
  seguridad         NUMERIC(4,2),
  ingles            NUMERIC(4,2),
  operacion         NUMERIC(4,2),
  promedio          NUMERIC(4,2),
  asistencia_total  NUMERIC(5,2),   -- porcentaje 0-100
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matricula_id)
);

-- 5. Tabla de Pensiones
CREATE TABLE IF NOT EXISTS pensiones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id        UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  modulo_id        UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nro_recibo       TEXT NOT NULL,
  monto_pagado     NUMERIC(10,2) NOT NULL DEFAULT 0,
  deuda_pendiente  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_pago       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Políticas de RLS (Row Level Security) — Opcional
-- Si deseas habilitar RLS, ejecuta:
-- ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE modulos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pensiones ENABLE ROW LEVEL SECURITY;
--
-- Y crea políticas para la anon key que permitan SELECT/INSERT/UPDATE.
-- Para esta intranet admin, puedes desactivar RLS en el Dashboard de
-- Supabase: Table Editor > [tabla] > Row Level Security > Disable.
-- ============================================================

-- Datos de ejemplo (opcional)
-- INSERT INTO alumnos (dni, nombres, apellidos, carrera)
-- VALUES ('12345678', 'Juan Carlos', 'Ríos Pérez', 'Operación de Cargador Frontal');

-- INSERT INTO modulos (nombre, fecha_inicio, fecha_fin, modalidad, duracion)
-- VALUES ('Cargador Frontal', '2025-01-15', '2025-04-15', 'presencial', 120);
