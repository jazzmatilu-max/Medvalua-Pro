CREATE OR REPLACE FUNCTION public.redeem_access_coupon(_code text)
RETURNS TABLE(success boolean, message text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  uid uuid := auth.uid();
  u_email text;
  clean_code text := upper(regexp_replace(trim(coalesce(_code, '')), '\s+', '', 'g'));
  new_expires timestamptz;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión', NULL::timestamptz;
    RETURN;
  END IF;

  IF clean_code = '' THEN
    RETURN QUERY SELECT false, 'Ingresa un cupón válido', NULL::timestamptz;
    RETURN;
  END IF;

  SELECT email INTO u_email FROM auth.users WHERE id = uid;

  SELECT * INTO c
  FROM public.coupons
  WHERE code = clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no existe', NULL::timestamptz;
    RETURN;
  END IF;

  IF c.used THEN
    IF c.redeemed_by = uid THEN
      IF c.expires_at IS NOT NULL AND c.expires_at > now() THEN
        RETURN QUERY SELECT true, 'Cupón ya activo', c.expires_at;
        RETURN;
      END IF;

      IF c.expires_at IS NULL THEN
        new_expires := now() + (COALESCE(c.duration_days, 30) || ' days')::interval;
        UPDATE public.coupons
        SET expires_at = new_expires,
            redeemed_email = COALESCE(c.redeemed_email, u_email),
            redeemed_at = COALESCE(c.redeemed_at, now())
        WHERE id = c.id;

        RETURN QUERY SELECT true, 'Acceso activado', new_expires;
        RETURN;
      END IF;
    END IF;

    RETURN QUERY SELECT false, 'Cupón ya utilizado', NULL::timestamptz;
    RETURN;
  END IF;

  new_expires := now() + (COALESCE(c.duration_days, 30) || ' days')::interval;

  UPDATE public.coupons
  SET used = true,
      redeemed_by = uid,
      redeemed_at = now(),
      redeemed_email = u_email,
      expires_at = new_expires
  WHERE id = c.id;

  RETURN QUERY SELECT true, 'Acceso activado', new_expires;
END;
$$;

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
  u_email text;
  admin_flag boolean := false;
  c public.coupons%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT public.has_role(uid, 'admin'::app_role) INTO admin_flag;
  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT email INTO u_email FROM auth.users WHERE id = uid;

  SELECT * INTO c
  FROM public.coupons
  WHERE used = true
    AND c.expires_at IS NOT NULL
    AND c.expires_at > now()
    AND (redeemed_by = uid OR (u_email IS NOT NULL AND redeemed_email = u_email))
  ORDER BY c.expires_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    false,
    c.expires_at,
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (c.expires_at - now())) / 86400.0)::int),
    c.code;
END;
$$;