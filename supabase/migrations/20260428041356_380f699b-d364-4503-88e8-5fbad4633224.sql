-- Harden coupon access and make access checks independent of client-side table permissions
DROP POLICY IF EXISTS "Authenticated can lookup coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins view all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users view own redeemed coupons" ON public.coupons;

CREATE POLICY "Admins view all coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users view own redeemed coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (redeemed_by = auth.uid());

CREATE OR REPLACE FUNCTION public.redeem_access_coupon(_code text)
RETURNS TABLE(success boolean, message text, expires_at timestamp with time zone)
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
  WHERE upper(regexp_replace(trim(code), '\s+', '', 'g')) = clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no existe', NULL::timestamptz;
    RETURN;
  END IF;

  IF c.used THEN
    IF c.redeemed_by = uid AND c.expires_at IS NOT NULL AND c.expires_at > now() THEN
      RETURN QUERY SELECT true, 'Cupón ya activo', c.expires_at;
      RETURN;
    END IF;

    RETURN QUERY SELECT false, 'Cupón ya utilizado', NULL::timestamptz;
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

  RETURN QUERY SELECT true, 'Acceso activado', new_expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(has_access boolean, is_admin boolean, expires_at timestamp with time zone, days_left integer, code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  admin_flag boolean := false;
  c public.coupons%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT public.has_role(uid, 'admin'::public.app_role) INTO admin_flag;
  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO c
  FROM public.coupons
  WHERE used = true
    AND redeemed_by = uid
    AND c.expires_at IS NOT NULL
    AND c.expires_at > now()
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

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(_user_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión';
    RETURN;
  END IF;

  IF NOT public.has_role(caller, 'admin'::public.app_role) THEN
    RETURN QUERY SELECT false, 'No tienes permisos de administrador';
    RETURN;
  END IF;

  IF _user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Usuario inválido';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN QUERY SELECT false, 'Usuario no encontrado';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN QUERY SELECT true, 'Usuario habilitado como administrador';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_access_coupon(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_access() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_access_coupon(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(uuid) TO authenticated;