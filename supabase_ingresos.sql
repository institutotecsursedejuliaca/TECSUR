-- ============================================================
-- TECSUR — Tabla de Control de Ingreso (Asistencia Diaria)
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS ingresos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni_alumno     VARCHAR(12) NOT NULL,
  fecha_ingreso  DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora_ingreso   TIME        NOT NULL DEFAULT CURRENT_TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Relación con alumnos a través del DNI (no FK estricta para
  -- permitir busqueda aunque el alumno sea eliminado)
  UNIQUE(dni_alumno, fecha_ingreso)   -- un registro por día por alumno
);

-- Índices para acelerar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ingresos_dni   ON ingresos (dni_alumno);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos (fecha_ingreso DESC);

-- RLS: desactiva si usas la anon key para esta intranet
-- ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

-- Datos de ejemplo (opcional)
-- INSERT INTO ingresos (dni_alumno, fecha_ingreso, hora_ingreso)
-- VALUES ('12345678', CURRENT_DATE, CURRENT_TIME);
