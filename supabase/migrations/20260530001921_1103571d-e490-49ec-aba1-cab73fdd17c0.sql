GRANT EXECUTE ON FUNCTION public.get_active_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_plan_at_least(uuid, subscription_plan) TO authenticated;
GRANT EXECUTE ON FUNCTION public.companion_daily_used(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.subscription_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  plan subscription_plan,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_access_events TO authenticated;
GRANT ALL ON public.subscription_access_events TO service_role;

ALTER TABLE public.subscription_access_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own subscription access events" ON public.subscription_access_events;
CREATE POLICY "Users insert own subscription access events"
ON public.subscription_access_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own subscription access events" ON public.subscription_access_events;
CREATE POLICY "Users view own subscription access events"
ON public.subscription_access_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view subscription access events" ON public.subscription_access_events;
CREATE POLICY "Admins view subscription access events"
ON public.subscription_access_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_my_subscription_access()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_db_plan public.subscription_plan;
  v_profile_plan text;
  v_subscription public.subscriptions%ROWTYPE;
  v_jwt_plan text;
  v_limit integer;
  v_allowed_languages integer;
  v_used integer;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'permission_state', 'unauthenticated',
      'current_plan', 'free',
      'database_plan', 'free',
      'profile_plan', null,
      'jwt_plan', null,
      'cached_plan', null,
      'ai_limit', 5,
      'ai_used_today', 0,
      'ai_remaining', 5,
      'allowed_languages_count', 20,
      'unlimited_languages', false,
      'unlimited_ai', false,
      'subscription_source', 'fallback'
    );
  END IF;

  SELECT s.* INTO v_subscription
  FROM public.subscriptions s
  WHERE s.user_id = v_user
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY CASE s.plan WHEN 'business' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC,
           s.start_date DESC,
           s.created_at DESC
  LIMIT 1;

  v_db_plan := COALESCE(v_subscription.plan, 'free'::public.subscription_plan);

  SELECT p.plan INTO v_profile_plan
  FROM public.profiles p
  WHERE p.id = v_user;

  v_jwt_plan := COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'plan',
    auth.jwt() -> 'user_metadata' ->> 'plan'
  );

  v_limit := CASE v_db_plan WHEN 'business' THEN -1 WHEN 'pro' THEN 100 ELSE 5 END;
  v_allowed_languages := CASE v_db_plan WHEN 'free' THEN 20 ELSE 100000 END;
  SELECT public.companion_daily_used(v_user) INTO v_used;

  RETURN jsonb_build_object(
    'ok', true,
    'permission_state', CASE WHEN v_db_plan IN ('pro', 'business') THEN 'premium' ELSE 'free' END,
    'current_plan', v_db_plan,
    'database_plan', v_db_plan,
    'profile_plan', v_profile_plan,
    'jwt_plan', v_jwt_plan,
    'cached_plan', v_profile_plan,
    'ai_limit', v_limit,
    'ai_used_today', COALESCE(v_used, 0),
    'ai_remaining', CASE WHEN v_limit = -1 THEN -1 ELSE GREATEST(0, v_limit - COALESCE(v_used, 0)) END,
    'allowed_languages_count', v_allowed_languages,
    'unlimited_languages', v_db_plan IN ('pro', 'business'),
    'unlimited_ai', v_db_plan = 'business',
    'priority_processing', v_db_plan = 'business',
    'subscription_source', CASE WHEN v_subscription.id IS NULL THEN 'fallback_free' ELSE 'subscriptions.active' END,
    'active_subscription_id', v_subscription.id,
    'subscription_status', COALESCE(v_subscription.status::text, 'none'),
    'subscription_payment_status', v_subscription.payment_status,
    'subscription_end_date', v_subscription.end_date,
    'profile_mismatch', COALESCE(v_profile_plan, 'free') <> v_db_plan::text,
    'jwt_mismatch', v_jwt_plan IS NOT NULL AND v_jwt_plan <> v_db_plan::text,
    'checked_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_subscription_access() TO authenticated;

CREATE OR REPLACE FUNCTION public.track_subscription_access_event(_event_type text, _plan public.subscription_plan, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.subscription_access_events (user_id, event_type, plan, details)
  VALUES (auth.uid(), left(_event_type, 120), COALESCE(_plan, public.get_active_plan(auth.uid()), 'free'::public.subscription_plan), COALESCE(_details, '{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_subscription_access_event(text, public.subscription_plan, jsonb) TO authenticated;