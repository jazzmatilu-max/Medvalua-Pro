REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.coupon_is_valid(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_access_coupon(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_access() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coupon_is_valid(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_access_coupon(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;