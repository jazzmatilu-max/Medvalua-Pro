CREATE OR REPLACE FUNCTION public.ensure_current_user_profile(_nombre text DEFAULT NULL)
RETURNS TABLE(success boolean, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  user_email text;
  admin_flag boolean := false;
BEGIN
  IF uid IS NULL THEN
    RETURN QUERY SELECT false, false;
    RETURN;
  END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = uid;

  INSERT INTO public.profiles (user_id, email, nombre)
  VALUES (uid, user_email, COALESCE(NULLIF(trim(_nombre), ''), ''))
  ON CONFLICT (user_id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, public.profiles.email),
      nombre = COALESCE(NULLIF(public.profiles.nombre, ''), EXCLUDED.nombre),
      updated_at = now();

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  SELECT public.has_role(uid, 'admin'::public.app_role) INTO admin_flag;
  RETURN QUERY SELECT true, admin_flag;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_current_user_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_profile(text) TO authenticated;