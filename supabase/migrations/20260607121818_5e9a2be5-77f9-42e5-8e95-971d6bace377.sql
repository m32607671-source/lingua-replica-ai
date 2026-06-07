CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'Lingua Learner'),
    NEW.raw_user_meta_data->>'avatar_url',
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
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status, payment_status, notes)
  VALUES (NEW.id, 'free'::public.subscription_plan, 'active'::public.subscription_status, 'paid'::public.payment_status, 'Auto-created on signup')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.companion_prefs (user_id, character)
  VALUES (NEW.id, 'owl')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type)
  VALUES (NEW.id, 'bonus'::public.coin_tx_kind, 50, 50, 'Welcome wallet initialized', 'auth')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();