-- 1. Nuevas columnas en coupons
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_email text;

-- 2. Función: redimir cupón de acceso (usuario autenticado)
CREATE OR REPLACE FUNCTION public.redeem_access_coupon(_code text)
RETURNS TABLE(success boolean, message text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  u_email text;
  new_expires timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión', NULL::timestamptz; RETURN;
  END IF;

  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no existe', NULL::timestamptz; RETURN;
  END IF;
  IF c.used THEN
    RETURN QUERY SELECT false, 'Cupón ya utilizado', NULL::timestamptz; RETURN;
  END IF;

  SELECT email INTO u_email FROM auth.users WHERE id = auth.uid();
  new_expires := now() + (COALESCE(c.duration_days, 30) || ' days')::interval;

  UPDATE public.coupons
    SET used = true,
        redeemed_by = auth.uid(),
        redeemed_at = now(),
        redeemed_email = u_email,
        expires_at = new_expires
    WHERE id = c.id;

  RETURN QUERY SELECT true, 'OK', new_expires;
END;
$$;

-- 3. Función: ¿el usuario actual tiene acceso vigente?
CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(
  has_access boolean,
  is_admin boolean,
  expires_at timestamptz,
  days_left integer,
  code text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_flag boolean := false;
  c public.coupons%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text; RETURN;
  END IF;

  SELECT public.has_role(uid, 'admin'::app_role) INTO admin_flag;
  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::int, NULL::text; RETURN;
  END IF;

  SELECT * INTO c
  FROM public.coupons
  WHERE redeemed_by = uid AND used = true AND expires_at IS NOT NULL AND expires_at > now()
  ORDER BY expires_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text; RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    false,
    c.expires_at,
    GREATEST(0, EXTRACT(DAY FROM (c.expires_at - now()))::int),
    c.code;
END;
$$;