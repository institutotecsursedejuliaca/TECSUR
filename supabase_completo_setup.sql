-- =============================================================================
--  TECSUR — Intranet Académica de Maquinaria Pesada
--  Script de Configuración Completo (Tablas, Triggers, RLS, Auditoría y Admin)
--  Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. LIMPIEZA / RESET (Opcional, limpia estructuras previas si existen)
-- ─────────────────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_auditoria          CASCADE;
DROP VIEW IF EXISTS v_carreras_resumen   CASCADE;
DROP VIEW IF EXISTS v_matriculas_detalle CASCADE;
DROP VIEW IF EXISTS v_asistencia_resumen CASCADE;
DROP VIEW IF EXISTS v_notas_matricula    CASCADE;

DROP FUNCTION IF EXISTS _create_audit_trigger(TEXT) CASCADE;
DROP FUNCTION IF EXISTS fn_audit_log()              CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column()  CASCADE;
DROP FUNCTION IF EXISTS set_default_codigo()        CASCADE;

DROP TABLE IF EXISTS auditoria    CASCADE;
DROP TABLE IF EXISTS notas_cursos CASCADE;
DROP TABLE IF EXISTS asistencias  CASCADE;
DROP TABLE IF EXISTS notas        CASCADE;
DROP TABLE IF EXISTS pensiones    CASCADE;
DROP TABLE IF EXISTS matriculas   CASCADE;
DROP TABLE IF EXISTS cursos       CASCADE;
DROP TABLE IF EXISTS modulos      CASCADE;
DROP TABLE IF EXISTS docentes     CASCADE;
DROP TABLE IF EXISTS carreras     CASCADE;
DROP TABLE IF EXISTS alumnos      CASCADE;
DROP TABLE IF EXISTS ingresos     CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EXTENSIONES Y FUNCIONES AUXILIARES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función para actualizar la columna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREACIÓN DE TABLAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 ALUMNOS
CREATE TABLE alumnos (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni                  VARCHAR(12) UNIQUE NOT NULL,
  codigo               TEXT        UNIQUE,
  nombres              TEXT        NOT NULL,
  apellidos            TEXT        NOT NULL,
  carrera              TEXT        NOT NULL, -- Campo legacy de texto libre
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

-- Trigger para autocompletar codigo con el DNI si es nulo o vacío
CREATE OR REPLACE FUNCTION set_default_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := NEW.dni;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_default_codigo
  BEFORE INSERT ON alumnos
  FOR EACH ROW EXECUTE FUNCTION set_default_codigo();


-- 3.2 CARRERAS
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


-- 3.3 DOCENTES (Vinculado a auth.users de Supabase)
CREATE TABLE docentes (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres     TEXT NOT NULL,
  apellidos   TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  dni         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER docentes_updated_at
  BEFORE UPDATE ON docentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3.4 MÓDULOS (Cada carrera tiene módulos y se le asigna un docente)
CREATE TABLE modulos (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrera_id   UUID    REFERENCES carreras(id) ON DELETE SET NULL,
  docente_id   UUID    REFERENCES docentes(id) ON DELETE SET NULL,
  nombre       TEXT    NOT NULL,
  profesor     TEXT,   -- Campo legacy de profesor como texto
  horario      TEXT,   -- Horarios sugeridos o libres
  fecha_inicio DATE    NOT NULL,
  fecha_fin    DATE    NOT NULL,
  local        TEXT,
  aula         TEXT,
  modalidad    TEXT    NOT NULL CHECK (modalidad IN ('presencial', 'virtual', 'semipresencial')),
  duracion     INTEGER NOT NULL, -- Horas académicas
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER modulos_updated_at
  BEFORE UPDATE ON modulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_modulos_docente_id ON modulos(docente_id);


-- 3.5 CURSOS
CREATE TABLE cursos (
  id          UUID     PRIMARY KEY DEFAULT uuid_generate_v4(),
  modulo_id   UUID     NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nombre      TEXT     NOT NULL,
  descripcion TEXT,
  orden       SMALLINT DEFAULT 1,
  creditos    INTEGER  DEFAULT 1, -- Créditos académicos para promedio ponderado
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (modulo_id, nombre)
);

CREATE TRIGGER cursos_updated_at
  BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3.6 MATRÍCULAS
CREATE TABLE matriculas (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id      UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  modulo_id      UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  carrera_id     UUID REFERENCES carreras(id) ON DELETE SET NULL,
  turno          TEXT NOT NULL DEFAULT 'mañana' CHECK (turno IN (
    'mañana', 'tarde', 'noche', 'sabado_am', 'sabado_full', 'domingo_am', 'domingo_full'
  )),
  fecha_registro DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (alumno_id, modulo_id)
);

CREATE TRIGGER matriculas_updated_at
  BEFORE UPDATE ON matriculas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3.7 NOTAS (Estructura legacy para compatibilidad con campos fijos)
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
  asistencia_total   NUMERIC(5,2), -- Porcentaje (0–100)
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (matricula_id)
);


-- 3.8 NOTAS POR CURSO (Estructura modular: nota 0-20 por curso)
CREATE TABLE notas_cursos (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id UUID         NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  curso_id     UUID         NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  nota         NUMERIC(4,2) CHECK (nota >= 0 AND nota <= 20),
  observacion  TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (matricula_id, curso_id)
);

CREATE TRIGGER notas_cursos_updated_at
  BEFORE UPDATE ON notas_cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3.9 ASISTENCIAS (Asistencias diarias en módulos)
CREATE TABLE asistencias (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricula_id UUID        NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  modulo_id    UUID        NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  fecha        DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado       TEXT        NOT NULL DEFAULT 'presente' CHECK (estado IN (
    'presente', 'tardanza', 'falta', 'justificado'
  )),
  hora_entrada TIME,
  hora_salida  TIME,
  duracion_min INTEGER,
  observacion  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (matricula_id, fecha)
);


-- 3.10 PENSIONES
CREATE TABLE pensiones (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id       UUID          NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  modulo_id       UUID          NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nro_recibo      TEXT          NOT NULL,
  monto_pagado    NUMERIC(10,2) NOT NULL DEFAULT 0,
  deuda_pendiente NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_pago      DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);


-- 3.11 INGRESOS (Acceso y asistencias por DNI)
CREATE TABLE ingresos (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  dni_alumno    VARCHAR(12) NOT NULL,
  fecha_ingreso DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora_ingreso  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- 3.12 TABLA CENTRAL DE AUDITORÍA
CREATE TABLE auditoria (
  id               BIGSERIAL    PRIMARY KEY,
  tabla            TEXT         NOT NULL,
  accion           TEXT         NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id      TEXT,
  datos_anteriores JSONB,
  datos_nuevos     JSONB,
  usuario_id       TEXT,
  usuario_email    TEXT,
  ip               TEXT,
  fecha            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tabla   ON auditoria (tabla);
CREATE INDEX IF NOT EXISTS idx_audit_accion  ON auditoria (accion);
CREATE INDEX IF NOT EXISTS idx_audit_fecha   ON auditoria (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON auditoria (usuario_email);
CREATE INDEX IF NOT EXISTS idx_audit_regid   ON auditoria (registro_id);

COMMENT ON TABLE auditoria IS 'Registro centralizado de auditoría: guarda toda operación CRUD en el sistema.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FUNCIÓN Y TRIGGERS DE AUDITORÍA CENTRALIZADA
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_usuario_id    TEXT;
  v_usuario_email TEXT;
  v_ip            TEXT;
  v_registro_id   TEXT;
  v_datos_ant     JSONB;
  v_datos_nue     JSONB;
BEGIN
  -- Intentar extraer la identidad del usuario desde Supabase Auth (jwt claims)
  BEGIN
    v_usuario_id    := auth.uid()::TEXT;
    v_usuario_email := COALESCE(
      auth.email(),
      (current_setting('request.jwt.claims', TRUE)::JSONB) ->> 'email'
    );
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id    := NULL;
    v_usuario_email := NULL;
  END;

  -- Fallback para variables configuradas manualmente desde la API de Next.js
  IF v_usuario_email IS NULL OR v_usuario_email = '' THEN
    v_usuario_email := COALESCE(current_setting('app.usuario_email', TRUE), 'sistema');
    v_usuario_id    := COALESCE(current_setting('app.usuario_id',    TRUE), v_usuario_id);
  END IF;

  -- Obtener la IP del cliente desde headers de la petición de Supabase
  BEGIN
    v_ip := current_setting('request.headers', TRUE)::JSONB ->> 'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- Estructurar datos según la acción CRUD
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    v_datos_nue   := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := NULL;
    v_datos_nue   := to_jsonb(NEW);
  ELSE  -- UPDATE: almacenar solo los cambios específicos
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    SELECT jsonb_object_agg(n.key, n.value)
    INTO   v_datos_nue
    FROM   jsonb_each(to_jsonb(NEW)) n
    WHERE  (to_jsonb(OLD) -> n.key) IS DISTINCT FROM n.value;
  END IF;

  -- Insertar registro en auditoría
  INSERT INTO auditoria (
    tabla, accion, registro_id,
    datos_anteriores, datos_nuevos,
    usuario_id, usuario_email, ip, fecha
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_registro_id,
    v_datos_ant,
    v_datos_nue,
    v_usuario_id,
    v_usuario_email,
    v_ip,
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Helper para adjuntar el trigger de auditoría a una tabla
CREATE OR REPLACE FUNCTION _create_audit_trigger(p_tabla TEXT)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format(
    'DROP TRIGGER IF EXISTS trg_audit_%1$s ON %1$I;
     CREATE TRIGGER trg_audit_%1$s
       AFTER INSERT OR UPDATE OR DELETE ON %1$I
       FOR EACH ROW EXECUTE FUNCTION fn_audit_log();',
    p_tabla
  );
END;
$$;

-- Registrar disparadores en todas las tablas operacionales
SELECT _create_audit_trigger('alumnos');
SELECT _create_audit_trigger('carreras');
SELECT _create_audit_trigger('docentes');
SELECT _create_audit_trigger('modulos');
SELECT _create_audit_trigger('cursos');
SELECT _create_audit_trigger('matriculas');
SELECT _create_audit_trigger('notas');
SELECT _create_audit_trigger('notas_cursos');
SELECT _create_audit_trigger('asistencias');
SELECT _create_audit_trigger('pensiones');
SELECT _create_audit_trigger('ingresos');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CREACIÓN DE VISTAS
-- ─────────────────────────────────────────────────────────────────────────────

-- 5.1 Vista: Carreras con resumen de totales
CREATE OR REPLACE VIEW v_carreras_resumen AS
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

-- 5.2 Vista: Detalles de matrículas
CREATE OR REPLACE VIEW v_matriculas_detalle AS
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
  mod.docente_id,
  mod.local,
  mod.aula,
  mod.horario,
  mod.modalidad,
  mod.fecha_inicio,
  mod.fecha_fin,
  mod.duracion
FROM matriculas m
JOIN alumnos  a   ON a.id   = m.alumno_id
LEFT JOIN carreras c   ON c.id   = m.carrera_id
JOIN modulos  mod ON mod.id = m.modulo_id;

-- 5.3 Vista: Resumen de asistencias
CREATE OR REPLACE VIEW v_asistencia_resumen AS
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

-- 5.4 Vista: Promedio y notas por matrícula
CREATE OR REPLACE VIEW v_notas_matricula AS
SELECT
  matricula_id,
  COUNT(id)             AS total_cursos,
  ROUND(AVG(nota), 2)   AS promedio,
  MIN(nota)             AS nota_min,
  MAX(nota)             AS nota_max
FROM notas_cursos
GROUP BY matricula_id;

-- 5.5 Vista: Auditoría formateada legible
CREATE OR REPLACE VIEW v_auditoria AS
SELECT
  a.id,
  a.fecha,
  a.tabla,
  CASE a.accion
    WHEN 'INSERT' THEN 'Creación'
    WHEN 'UPDATE' THEN 'Modificación'
    WHEN 'DELETE' THEN 'Eliminación'
  END                         AS accion_label,
  a.accion,
  a.registro_id,
  a.usuario_email,
  a.usuario_id,
  a.ip,
  a.datos_nuevos,
  a.datos_anteriores,
  CASE a.accion
    WHEN 'INSERT' THEN
      COALESCE(
        a.datos_nuevos ->> 'nombre',
        a.datos_nuevos ->> 'dni',
        a.datos_nuevos ->> 'nombres',
        a.registro_id
      )
    WHEN 'UPDATE' THEN
      'Campos: ' || COALESCE(
        (SELECT string_agg(key, ', ' ORDER BY key)
         FROM jsonb_object_keys(a.datos_nuevos) AS t(key)),
        '—'
      )
    WHEN 'DELETE' THEN
      COALESCE(
        a.datos_anteriores ->> 'nombre',
        a.datos_anteriores ->> 'dni',
        a.datos_anteriores ->> 'nombres',
        a.registro_id
      )
  END                         AS resumen
FROM auditoria a
ORDER BY a.fecha DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en las tablas principales
ALTER TABLE alumnos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE carreras     ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pensiones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria    ENABLE ROW LEVEL SECURITY;

-- 6.1 Auditoria (Acceso restringido: Solo lectura para usuarios autenticados)
CREATE POLICY "Solo admins leen auditoria" ON auditoria FOR SELECT TO authenticated USING (true);
CREATE POLICY "No insercion directa en auditoria" ON auditoria FOR INSERT TO authenticated WITH CHECK (false);

-- 6.2 Políticas operacionales (Permitir acceso a anon y authenticated)
-- Dado que el backend conecta via anon key en local/producción y la consulta por DNI es pública:
CREATE POLICY "Acceso total alumnos" ON alumnos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total carreras" ON carreras FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total docentes" ON docentes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total modulos" ON modulos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total cursos" ON cursos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total matriculas" ON matriculas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total notas" ON notas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total notas_cursos" ON notas_cursos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total asistencias" ON asistencias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total pensiones" ON pensiones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total ingresos" ON ingresos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- NOTA: Si deseas desactivar por completo RLS en las tablas operacionales (comportamiento por defecto)
-- puedes ejecutar el siguiente bloque:
-- ALTER TABLE alumnos      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE carreras     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE docentes     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE modulos      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cursos       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE matriculas   DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas        DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notas_cursos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE asistencias  DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE pensiones    DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ingresos     DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. REGISTRO DEL PRIMER USUARIO ADMINISTRADOR
-- ─────────────────────────────────────────────────────────────────────────────
-- Creamos el usuario en auth.users y su identidad si no existe previamente.
DO $$
DECLARE
  new_uid UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'administrador@tecsur.com.pe') THEN
    
    -- 7.1 Insertar usuario principal
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      is_super_admin,
      confirmed_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_uid,
      'authenticated',
      'authenticated',
      'administrador@tecsur.com.pe',
      crypt('huaraya_2018', gen_salt('bf', 10)), -- Encriptar contraseña
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      FALSE,
      NOW()
    );

    -- 7.2 Insertar identidad
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_uid,
      new_uid,
      json_build_object('sub', new_uid, 'email', 'administrador@tecsur.com.pe'),
      'email',
      NULL,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Usuario administrador@tecsur.com.pe creado exitosamente.';
  ELSE
    RAISE NOTICE 'El usuario administrador@tecsur.com.pe ya existe.';
  END IF;
END $$;
