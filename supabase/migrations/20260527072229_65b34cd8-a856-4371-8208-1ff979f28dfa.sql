
CREATE OR REPLACE FUNCTION public.sync_profile_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_plan subscription_plan;
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  v_plan := public.get_active_plan(v_user);
  UPDATE public.profiles
    SET plan = COALESCE(v_plan::text, 'free'),
        updated_at = now()
    WHERE id = v_user;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_plan_trg ON public.subscriptions;
CREATE TRIGGER sync_profile_plan_trg
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_plan();

-- Backfill existing profiles to match active subscription
UPDATE public.profiles p
SET plan = COALESCE(public.get_active_plan(p.id)::text, 'free'),
    updated_at = now();
