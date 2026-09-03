-- Restore the access check used by the client after the project was recreated.
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