REVOKE ALL ON FUNCTION public.get_my_subscription_access() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.track_subscription_access_event(text, public.subscription_plan, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_active_plan(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_plan_at_least(uuid, public.subscription_plan) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.companion_daily_used(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purchase_skin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_diagnostics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_subscription_access() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_subscription_access_event(text, public.subscription_plan, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_active_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_plan_at_least(uuid, public.subscription_plan) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.companion_daily_used(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purchase_skin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_diagnostics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated, service_role;