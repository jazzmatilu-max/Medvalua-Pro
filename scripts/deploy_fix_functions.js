#!/usr/bin/env node
// Script para ejecutar DROP/CREATE de funciones en la base de datos
// Requiere: npm install pg
// Uso: DATABASE_URL="postgres://..." node scripts/deploy_fix_functions.js

const { Client } = require('pg');

const sql = `
-- DROP previene errores de cambio de firma
DROP FUNCTION IF EXISTS public.redeem_access_coupon(text);
DROP FUNCTION IF EXISTS public.get_my_access();

-- 1) redeem_access_coupon: valida, marca el cupón y devuelve info
CREATE OR REPLACE FUNCTION public.redeem_access_coupon(_code text)
RETURNS TABLE(success boolean, message text, expires_at timestamptz, days_left integer, code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  uid uuid := auth.uid();
  u_email text;
  clean_code text := upper(regexp_replace(coalesce(trim(_code), ''), '\\s+', '', 'g'));
  new_expires timestamptz;
  days_left_int integer;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión', NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  IF clean_code = '' THEN
    RETURN QUERY SELECT false, 'Ingresa un cupón válido', NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT email INTO u_email FROM auth.users WHERE id = uid LIMIT 1;

  SELECT * INTO c
  FROM public.coupons c
  WHERE upper(regexp_replace(coalesce(trim(c.code), ''), '\\s+', '', 'g')) = clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no existe', NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  IF c.used THEN
    IF c.redeemed_by = uid AND c.expires_at IS NOT NULL AND c.expires_at > now() THEN
      days_left_int := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (c.expires_at - now())) / 86400.0)::int);
      RETURN QUERY SELECT true, 'Cupón ya activo', c.expires_at, days_left_int, c.code;
      RETURN;
    END IF;
    RETURN QUERY SELECT false, 'Cupón ya utilizado', NULL::timestamptz, NULL::int, c.code;
    RETURN;
  END IF;

  new_expires := now() + make_interval(days => GREATEST(COALESCE(c.duration_days, 30), 1));

  UPDATE public.coupons
  SET used = true,
      redeemed_by = uid,
      redeemed_at = now(),
      redeemed_email = u_email,
      expires_at = new_expires
  WHERE id = c.id;

  days_left_int := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (new_expires - now())) / 86400.0)::int);

  RETURN QUERY SELECT true, 'Acceso activado', new_expires, days_left_int, c.code;
END;
$$;

-- 2) get_my_access: devuelve si el usuario (o admin) tiene acceso vigente
CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(has_access boolean, is_admin boolean, expires_at timestamptz, days_left integer, code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_flag boolean := false;
  c public.coupons%ROWTYPE;
  days_left_int integer;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  -- chequeo directo en user_roles para mayor fiabilidad
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = uid AND ur.role = 'admin'
  ) INTO admin_flag;

  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO c
  FROM public.coupons c
  WHERE c.used = true
    AND c.redeemed_by = uid
    AND c.expires_at IS NOT NULL
    AND c.expires_at > now()
  ORDER BY c.expires_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  days_left_int := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (c.expires_at - now())) / 86400.0)::int);

  RETURN QUERY SELECT true, false, c.expires_at, days_left_int, c.code;
END;
$$;

-- 3) permisos
REVOKE EXECUTE ON FUNCTION public.redeem_access_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_access_coupon(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;
`;

async function run() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('ERROR: define DATABASE_URL en el entorno. Ej: export DATABASE_URL="postgres://..."');
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('Conectado. Ejecutando SQL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Funciones desplegadas correctamente.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error al ejecutar SQL:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
