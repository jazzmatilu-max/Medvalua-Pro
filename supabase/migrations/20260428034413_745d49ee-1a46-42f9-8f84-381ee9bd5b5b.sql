REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.coupon_is_valid(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;