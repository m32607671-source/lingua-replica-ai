REVOKE ALL ON FUNCTION public.sync_profile_plan() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_plan() TO service_role;

DROP TRIGGER IF EXISTS sync_profile_plan_after_subscription_insert ON public.subscriptions;
DROP TRIGGER IF EXISTS sync_profile_plan_after_subscription_update ON public.subscriptions;
DROP TRIGGER IF EXISTS sync_profile_plan_after_subscription_delete ON public.subscriptions;

CREATE TRIGGER sync_profile_plan_after_subscription_insert
AFTER INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_plan();

CREATE TRIGGER sync_profile_plan_after_subscription_update
AFTER UPDATE OF plan, status, start_date, end_date ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_plan();

CREATE TRIGGER sync_profile_plan_after_subscription_delete
AFTER DELETE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_plan();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;