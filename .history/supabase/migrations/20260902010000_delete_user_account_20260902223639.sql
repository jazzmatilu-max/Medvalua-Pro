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

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = caller_id AND role = 'admin'
  ) AND NOT COALESCE((
    SELECT p.is_admin FROM public.profiles AS p WHERE p.user_id = caller_id
  ), false) THEN
    RETURN QUERY SELECT false, 'No tienes permisos de administrador';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RETURN QUERY SELECT false, 'Usuario no encontrado';
    RETURN;
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;
  RETURN QUERY SELECT true, 'Usuario eliminado';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;
