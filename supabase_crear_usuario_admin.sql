-- ============================================================
--  TECSUR — Crear usuario Administrador en Supabase Auth
--  Ejecutar en: Supabase > SQL Editor > New Query
--
--  OPCIÓN 1 (Recomendada): Desde el Dashboard de Supabase
--  -------------------------------------------------------
--  1. Ve a tu proyecto en supabase.com
--  2. Panel izquierdo → Authentication → Users
--  3. Clic en "Add user" → "Create new user"
--  4. Ingresa:
--       Email:    admin@tecsur.edu.pe
--       Password: (tu contraseña segura)
--  5. Marca "Auto confirm user" ✓
--  6. Clic en "Create User"
--
--  OPCIÓN 2: Via SQL (si tienes acceso al esquema auth)
-- ============================================================

-- Crear usuario admin directamente por SQL
-- (Solo funciona si tienes permisos de superadmin en Supabase)
SELECT auth.create_user(
  uid        := gen_random_uuid(),
  email      := 'admin@tecsur.edu.pe',
  password   := 'TuPasswordSegura123!',
  email_confirmed_at := NOW()
);

-- ============================================================
--  IMPORTANTE: Habilitar autenticación por Email/Password
-- ============================================================
--  1. Ve a Supabase → Authentication → Providers
--  2. Asegúrate que "Email" esté HABILITADO (toggle ON)
--  3. Puedes desmarcar "Confirm email" para no necesitar
--     verificación de correo en el primer login
-- ============================================================
