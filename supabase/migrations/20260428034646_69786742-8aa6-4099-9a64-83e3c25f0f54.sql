CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(
  has_access boolean,
  is_admin boolean,
  expires_at timestamptz,
  days_left integer,
  code text
)
LANGUAGE plpgsql
STABLE SECURITY INVOKER
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

  SELECT public.has_role(uid, 'admin'::app_role) INTO admin_flag;
  IF admin_flag THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::int, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO c
  FROM public.coupons
  WHERE used = true
    AND expires_at IS NOT NULL
    AND expires_at > now()
    AND redeemed_by = uid
  ORDER BY expires_at DESC
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

GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;