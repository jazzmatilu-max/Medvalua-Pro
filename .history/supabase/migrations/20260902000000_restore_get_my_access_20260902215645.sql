-- Restore the access check used by the client after the project was recreated.
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_email text;

CREATE OR REPLACE FUNCTION public.redeem_access_coupon(_code text)
RETURNS TABLE(success boolean, message text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_row public.coupons%ROWTYPE;
  uid uuid := auth.uid();
  user_email text;
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

  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  SELECT c.*
    INTO coupon_row
  FROM public.coupons AS c
  WHERE upper(regexp_replace(trim(c.code), '\s+', '', 'g')) = clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no existe', NULL::timestamptz;
    RETURN;
  END IF;

  IF coupon_row.used THEN
    IF coupon_row.redeemed_by = uid
       AND coupon_row.expires_at IS NOT NULL
       AND coupon_row.expires_at > now() THEN
      RETURN QUERY SELECT true, 'Cupón ya activo', coupon_row.expires_at;
      RETURN;
    END IF;
    RETURN QUERY SELECT false, 'Cupón ya utilizado', NULL::timestamptz;
    RETURN;
  END IF;

  new_expires := now() + make_interval(days => greatest(coalesce(coupon_row.duration_days, 30), 1));

  UPDATE public.coupons
  SET used = true,
      redeemed_by = uid,
      redeemed_at = now(),
      redeemed_email = user_email,
      expires_at = new_expires
  WHERE id = coupon_row.id;

  RETURN QUERY SELECT true, 'Acceso activado', new_expires;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_access_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_access_coupon(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(
  has_access boolean,
  is_admin boolean,
  expires_at timestamptz,
  days_left integer,
  code text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_flag boolean := false;
  coupon_row public.coupons%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::integer, NULL::text;
    RETURN;
  END IF;

  SELECT public.has_role(uid, 'admin'::public.app_role)
    INTO admin_flag;

  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::integer, NULL::text;
    RETURN;
  END IF;

  SELECT c.*
    INTO coupon_row
  FROM public.coupons AS c
  WHERE c.used = true
    AND c.redeemed_by = uid
    AND c.expires_at IS NOT NULL
    AND c.expires_at > now()
  ORDER BY c.expires_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::integer, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true,
    false,
    coupon_row.expires_at,
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (coupon_row.expires_at - now())) / 86400.0)::integer),
    coupon_row.code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;