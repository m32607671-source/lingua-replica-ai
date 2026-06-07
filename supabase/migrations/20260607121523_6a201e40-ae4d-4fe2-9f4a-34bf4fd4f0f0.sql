GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.companion_prefs TO authenticated;
GRANT ALL ON public.companion_prefs TO service_role;

GRANT SELECT, INSERT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;

GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;

GRANT SELECT, INSERT, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

GRANT SELECT, INSERT ON public.companion_messages TO authenticated;
GRANT ALL ON public.companion_messages TO service_role;

GRANT SELECT ON public.companion_skins TO anon, authenticated;
GRANT ALL ON public.companion_skins TO service_role;

GRANT SELECT, INSERT ON public.owned_skins TO authenticated;
GRANT ALL ON public.owned_skins TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.equipped_skins TO authenticated;
GRANT ALL ON public.equipped_skins TO service_role;

CREATE OR REPLACE FUNCTION public.ensure_my_account_initialized()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_full_name text := COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    auth.jwt() -> 'user_metadata' ->> 'name',
    split_part(COALESCE(auth.jwt() ->> 'email', ''), '@', 1),
    'Lingua Learner'
  );
  v_avatar_url text := auth.jwt() -> 'user_metadata' ->> 'avatar_url';
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    plan,
    translations_count,
    words_count,
    native_language,
    learning_language,
    xp,
    coins,
    streak,
    level
  ) VALUES (
    v_user,
    NULLIF(v_full_name, ''),
    v_avatar_url,
    'free',
    0,
    0,
    'en',
    'es',
    0,
    50,
    0,
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    plan = COALESCE(public.profiles.plan, 'free'),
    native_language = COALESCE(public.profiles.native_language, 'en'),
    learning_language = COALESCE(public.profiles.learning_language, 'es'),
    xp = COALESCE(public.profiles.xp, 0),
    coins = COALESCE(public.profiles.coins, 50),
    streak = COALESCE(public.profiles.streak, 0),
    level = COALESCE(public.profiles.level, 1),
    updated_at = now();

  INSERT INTO public.subscriptions (user_id, plan, status, payment_status, notes)
  SELECT v_user, 'free'::public.subscription_plan, 'active'::public.subscription_status, 'paid'::public.payment_status, 'Account initialized'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = v_user
      AND s.status = 'active'
      AND (s.end_date IS NULL OR s.end_date > now())
  );

  INSERT INTO public.companion_prefs (user_id, character)
  VALUES (v_user, 'owl')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type)
  SELECT v_user, 'bonus'::public.coin_tx_kind, 50, 50, 'Welcome wallet initialized', 'auth'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.coin_transactions c
    WHERE c.user_id = v_user
      AND c.reason = 'Welcome wallet initialized'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', v_user,
    'email', v_email,
    'profile_ready', true,
    'subscription_ready', true,
    'settings_ready', true,
    'wallet_ready', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_account_initialized() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_account_initialized() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_auth_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_role text;
  v_plan public.subscription_plan;
  v_profile_exists boolean := false;
  v_subscription_exists boolean := false;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'auth_status', 'signed_out',
      'session_status', 'missing',
      'current_user', null,
      'current_role', 'none',
      'current_subscription', 'free',
      'oauth_status', 'managed_google_enabled',
      'backend_connection_status', 'connected'
    );
  END IF;

  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user
  ORDER BY CASE role WHEN 'admin' THEN 1 ELSE 2 END
  LIMIT 1;

  v_plan := COALESCE(public.get_active_plan(v_user), 'free'::public.subscription_plan);

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user) INTO v_profile_exists;
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_user
      AND status = 'active'
      AND (end_date IS NULL OR end_date > now())
  ) INTO v_subscription_exists;

  RETURN jsonb_build_object(
    'ok', true,
    'auth_status', 'signed_in',
    'session_status', 'active',
    'current_user', jsonb_build_object(
      'id', v_user,
      'email', auth.jwt() ->> 'email',
      'provider', COALESCE(auth.jwt() -> 'app_metadata' ->> 'provider', 'email')
    ),
    'current_role', COALESCE(v_role, 'user'),
    'current_subscription', v_plan,
    'oauth_status', 'managed_google_enabled',
    'backend_connection_status', 'connected',
    'profile_ready', v_profile_exists,
    'subscription_ready', v_subscription_exists,
    'checked_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_auth_diagnostics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_auth_diagnostics() TO authenticated, service_role;

INSERT INTO public.profiles (
  id,
  full_name,
  avatar_url,
  plan,
  translations_count,
  words_count,
  native_language,
  learning_language,
  xp,
  coins,
  streak,
  level
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, ''), '@', 1), 'Lingua Learner'),
  u.raw_user_meta_data->>'avatar_url',
  'free',
  0,
  0,
  'en',
  'es',
  0,
  50,
  0,
  1
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

INSERT INTO public.subscriptions (user_id, plan, status, payment_status, notes)
SELECT u.id, 'free'::public.subscription_plan, 'active'::public.subscription_status, 'paid'::public.payment_status, 'Backfilled account initialization'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subscriptions s
  WHERE s.user_id = u.id
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
);

INSERT INTO public.companion_prefs (user_id, character)
SELECT u.id, 'owl'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.companion_prefs cp WHERE cp.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'user'::public.app_role);

INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type)
SELECT u.id, 'bonus'::public.coin_tx_kind, 50, COALESCE(p.coins, 50), 'Welcome wallet initialized', 'auth'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.coin_transactions c
  WHERE c.user_id = u.id
    AND c.reason = 'Welcome wallet initialized'
);