-- ============================================================
--  TECSUR — Sistema de Auditoría Centralizada
--  Ejecutar en: Supabase > SQL Editor > New Query
--  
--  Registra automáticamente TODA operación CRUD en todas
--  las tablas del sistema: quién, qué, cuándo y cómo.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABLA CENTRAL DE AUDITORÍA
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id               BIGSERIAL    PRIMARY KEY,          -- secuencial para ORDER BY eficiente
  tabla            TEXT         NOT NULL,             -- nombre de la tabla afectada
  accion           TEXT         NOT NULL              -- INSERT | UPDATE | DELETE
                     CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id      TEXT,                              -- PK del registro afectado (UUID o TEXT)
  datos_anteriores JSONB,                             -- snapshot OLD (UPDATE / DELETE)
  datos_nuevos     JSONB,                             -- snapshot NEW (INSERT / UPDATE)
  usuario_id       TEXT,                              -- UUID del usuario Supabase Auth
  usuario_email    TEXT,                              -- email del usuario (desde JWT)
  ip               TEXT,                              -- IP del cliente si disponible
  fecha            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_tabla   ON auditoria (tabla);
CREATE INDEX IF NOT EXISTS idx_audit_accion  ON auditoria (accion);
CREATE INDEX IF NOT EXISTS idx_audit_fecha   ON auditoria (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON auditoria (usuario_email);
CREATE INDEX IF NOT EXISTS idx_audit_regid   ON auditoria (registro_id);

-- Comentario descriptivo
COMMENT ON TABLE auditoria IS 'Registro centralizado de auditoría: toda operación CRUD de todas las tablas del sistema.';

-- ──────────────────────────────────────────────────────────────
-- 2. FUNCIÓN GENÉRICA DE AUDITORÍA
--    SECURITY DEFINER → se ejecuta con privilegios del dueño,
--    garantizando acceso a auth.uid() y auth.email()
-- ──────────────────────────────────────────────────────────────
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
  -- ── 1. Obtener identidad del usuario ────────────────────────
  -- Primero intenta auth.uid() / auth.email() (sesión browser)
  -- Si no hay sesión, lee la variable de sesión que el backend
  -- puede inyectar: SET LOCAL app.usuario_email = '...'
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

  -- Fallback: variable inyectada desde la API Next.js
  IF v_usuario_email IS NULL OR v_usuario_email = '' THEN
    v_usuario_email := COALESCE(
      current_setting('app.usuario_email', TRUE),
      'sistema'
    );
    v_usuario_id := COALESCE(
      current_setting('app.usuario_id', TRUE),
      v_usuario_id
    );
  END IF;

  -- ── 2. IP del cliente (disponible en Supabase via headers) ──
  BEGIN
    v_ip := current_setting('request.headers', TRUE)::JSONB ->> 'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- ── 3. Datos según la operación ─────────────────────────────
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    v_datos_nue   := NULL;
    RETURN OLD;

  ELSIF TG_OP = 'INSERT' THEN
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := NULL;
    v_datos_nue   := to_jsonb(NEW);
    RETURN NEW;

  ELSE -- UPDATE
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    -- En UPDATE guardamos solo los campos que CAMBIARON
    SELECT jsonb_object_agg(key, value)
    INTO   v_datos_nue
    FROM   jsonb_each(to_jsonb(NEW))
    WHERE  to_jsonb(NEW) -> key <> to_jsonb(OLD) -> key
       OR  to_jsonb(OLD) -> key IS NULL;
    RETURN NEW;
  END IF;

  -- ── 4. Insertar en auditoría ─────────────────────────────────
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

END;
$$;

-- ──────────────────────────────────────────────────────────────
-- NOTA: el INSERT de auditoría debe hacerse ANTES del RETURN
--       en cada rama. Redefinimos la función correctamente:
-- ──────────────────────────────────────────────────────────────
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
  v_retorno       RECORD;
BEGIN
  -- ── Identidad ──────────────────────────────────────────────
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

  IF v_usuario_email IS NULL OR v_usuario_email = '' THEN
    v_usuario_email := COALESCE(current_setting('app.usuario_email', TRUE), 'sistema');
    v_usuario_id    := COALESCE(current_setting('app.usuario_id',    TRUE), v_usuario_id);
  END IF;

  -- ── IP ─────────────────────────────────────────────────────
  BEGIN
    v_ip := current_setting('request.headers', TRUE)::JSONB ->> 'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  -- ── Datos del registro ─────────────────────────────────────
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    v_datos_nue   := NULL;
    v_retorno     := OLD;

  ELSIF TG_OP = 'INSERT' THEN
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := NULL;
    v_datos_nue   := to_jsonb(NEW);
    v_retorno     := NEW;

  ELSE  -- UPDATE: guardar solo los campos que cambiaron
    v_registro_id := NEW.id::TEXT;
    v_datos_ant   := to_jsonb(OLD);
    SELECT jsonb_object_agg(n.key, n.value)
    INTO   v_datos_nue
    FROM   jsonb_each(to_jsonb(NEW)) n
    WHERE  (to_jsonb(OLD) -> n.key) IS DISTINCT FROM n.value;
    v_retorno     := NEW;
  END IF;

  -- ── Insertar en auditoría ──────────────────────────────────
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

  -- Retornar el registro correcto
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 3. HELPER: macro para crear triggers de auditoría fácilmente
-- ──────────────────────────────────────────────────────────────
-- Usamos DO blocks para adjuntar el trigger a cada tabla

-- Función auxiliar para crear el trigger si no existe
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

-- ──────────────────────────────────────────────────────────────
-- 4. ADJUNTAR TRIGGERS A TODAS LAS TABLAS DEL SISTEMA
-- ──────────────────────────────────────────────────────────────
SELECT _create_audit_trigger('alumnos');
SELECT _create_audit_trigger('carreras');
SELECT _create_audit_trigger('modulos');
SELECT _create_audit_trigger('cursos');
SELECT _create_audit_trigger('matriculas');
SELECT _create_audit_trigger('notas');
SELECT _create_audit_trigger('notas_cursos');
SELECT _create_audit_trigger('asistencias');
SELECT _create_audit_trigger('pensiones');

-- Para la tabla de ingresos (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingresos') THEN
    PERFORM _create_audit_trigger('ingresos');
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 5. VISTA: auditoría con formato legible
-- ──────────────────────────────────────────────────────────────
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
  -- Resumen del cambio para mostrar en UI
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

-- ──────────────────────────────────────────────────────────────
-- 6. LIMPIAR campos created_by de tablas individuales
--    Las vistas que dependen de esas columnas se recrean sin ellas.
-- ──────────────────────────────────────────────────────────────

-- 6a. Eliminar vistas dependientes primero
DROP VIEW IF EXISTS v_carreras_resumen;
DROP VIEW IF EXISTS v_matriculas_detalle;

-- 6b. Eliminar columnas created_by de cada tabla
ALTER TABLE carreras   DROP COLUMN IF EXISTS created_by;
ALTER TABLE modulos    DROP COLUMN IF EXISTS created_by;
ALTER TABLE cursos     DROP COLUMN IF EXISTS created_by;
ALTER TABLE matriculas DROP COLUMN IF EXISTS created_by;

-- 6c. Recrear las vistas sin created_by
CREATE OR REPLACE VIEW v_carreras_resumen AS
SELECT
  c.id,
  c.nombre,
  c.descripcion,
  c.created_at,
  COUNT(DISTINCT mod.id)           AS total_modulos,
  COUNT(DISTINCT mat.id)           AS total_matriculas,
  COUNT(DISTINCT mat.alumno_id)    AS total_alumnos
FROM carreras c
LEFT JOIN modulos    mod ON mod.carrera_id = c.id
LEFT JOIN matriculas mat ON mat.carrera_id = c.id
GROUP BY c.id, c.nombre, c.descripcion, c.created_at;

CREATE OR REPLACE VIEW v_matriculas_detalle AS
SELECT
  m.id                              AS matricula_id,
  m.fecha_registro,
  m.turno,
  m.created_at                      AS matricula_created_at,
  a.id                              AS alumno_id,
  a.dni,
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
FROM matriculas m
JOIN alumnos  a   ON a.id   = m.alumno_id
LEFT JOIN carreras c   ON c.id   = m.carrera_id
JOIN modulos  mod ON mod.id = m.modulo_id;

-- ──────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY en la tabla auditoria
--    Solo los administradores autenticados pueden leer auditoría.
--    Nadie puede modificarla (solo triggers con SECURITY DEFINER).
-- ──────────────────────────────────────────────────────────────
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados con role 'authenticated' pueden leer
CREATE POLICY "Solo admins leen auditoria"
  ON auditoria
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: nadie puede insertar/actualizar/eliminar directamente
-- (solo la función fn_audit_log con SECURITY DEFINER lo hace)
CREATE POLICY "No insercion directa"
  ON auditoria
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ──────────────────────────────────────────────────────────────
-- 8. VERIFICACIÓN
-- ──────────────────────────────────────────────────────────────
-- Mostrar todos los triggers de auditoría creados:
SELECT
  trigger_name,
  event_object_table  AS tabla,
  event_manipulation  AS evento,
  action_timing       AS momento
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_audit_%'
ORDER BY event_object_table, event_manipulation;
