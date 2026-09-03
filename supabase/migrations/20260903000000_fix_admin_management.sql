CREATE OR REPLACE FUNCTION public.delete_user_account(_user_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión';
    RETURN;
  END IF;

  IF caller_id = _user_id THEN
    RETURN QUERY SELECT false, 'No puedes eliminar tu propia cuenta';
    RETURN;
  END IF;

  IF NOT public.has_role(caller_id, 'admin'::public.app_role) THEN
    RETURN QUERY SELECT false, 'No tienes permisos de administrador';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id)
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id) THEN
    RETURN QUERY SELECT false, 'Usuario no encontrado';
    RETURN;
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN
    DELETE FROM public.user_roles WHERE user_id = _user_id;
    DELETE FROM public.profiles WHERE user_id = _user_id;
  END IF;
  RETURN QUERY SELECT true, 'Usuario eliminado';
END;
$$;

CREATE OR REPLACE FUNCTION public.demote_user_from_admin(_user_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RETURN QUERY SELECT false, 'Debes iniciar sesión';
    RETURN;
  END IF;

  IF NOT public.has_role(caller_id, 'admin'::public.app_role) THEN
    RETURN QUERY SELECT false, 'No tienes permisos de administrador';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN
    RETURN QUERY SELECT false, 'El usuario no es administrador';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role = 'admin' AND user_id <> _user_id
  ) THEN
    RETURN QUERY SELECT false, 'Debe existir al menos un administrador';
    RETURN;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = 'admin';

  RETURN QUERY SELECT true, 'Rol de administrador retirado';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.demote_user_from_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.demote_user_from_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(has_access boolean, is_admin boolean, expires_at timestamptz, days_left integer, code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  access_expires timestamptz;
  access_code text;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::timestamptz, NULL::integer, NULL::text;
    RETURN;
  END IF;

  IF public.has_role(uid, 'admin'::public.app_role) THEN
    RETURN QUERY SELECT true, true, NULL::timestamptz, NULL::integer, NULL::text;
    RETURN;
  END IF;

  SELECT c.expires_at, c.code
    INTO access_expires, access_code
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
    access_expires,
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (access_expires - now())) / 86400.0)::integer),
    access_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;