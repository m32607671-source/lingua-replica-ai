
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'::public.app_role);
$$;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  target_label text,
  before_state jsonb,
  after_state jsonb,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.admin_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_idx ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx ON public.admin_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_target_idx ON public.admin_audit_logs(target_type, target_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

CREATE OR REPLACE FUNCTION public._write_audit(
  _action text, _target_type text, _target_id uuid, _target_label text,
  _before jsonb, _after jsonb, _details jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (actor_id, actor_email, action, target_type, target_id, target_label, before_state, after_state, details)
  VALUES (auth.uid(), auth.jwt() ->> 'email', _action, _target_type, _target_id, _target_label, _before, _after, COALESCE(_details, '{}'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public._require_admin() RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_super_admin_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(COALESCE(NEW.email, '')) = 'm32607671@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin'::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ensure_super_admin ON auth.users;
CREATE TRIGGER trg_ensure_super_admin
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_super_admin_grant();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'm32607671@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'm32607671@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_adjust_xp(_user_id uuid, _delta integer, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before int; v_after int;
BEGIN
  PERFORM public._require_admin();
  SELECT xp INTO v_before FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF v_before IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  v_after := GREATEST(0, v_before + _delta);
  UPDATE public.profiles SET xp = v_after, level = GREATEST(1, (v_after/100)+1), updated_at = now() WHERE id = _user_id;
  INSERT INTO public.xp_transactions (user_id, amount, source, base_xp, ref_type)
    VALUES (_user_id, _delta, 'admin'::public.xp_source, _delta, 'admin_grant');
  PERFORM public._write_audit('xp.adjust','user',_user_id,NULL,
    jsonb_build_object('xp',v_before), jsonb_build_object('xp',v_after),
    jsonb_build_object('delta',_delta,'reason',_reason));
  RETURN jsonb_build_object('ok',true,'before',v_before,'after',v_after);
END $$;

CREATE OR REPLACE FUNCTION public.admin_adjust_coins(_user_id uuid, _delta integer, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before int; v_after int;
BEGIN
  PERFORM public._require_admin();
  SELECT coins INTO v_before FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF v_before IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  v_after := GREATEST(0, v_before + _delta);
  UPDATE public.profiles SET coins = v_after, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type)
    VALUES (_user_id,
            CASE WHEN _delta >= 0 THEN 'bonus'::public.coin_tx_kind ELSE 'spend'::public.coin_tx_kind END,
            _delta, v_after, COALESCE(_reason,'Admin adjustment'), 'admin_grant');
  PERFORM public._write_audit('coins.adjust','user',_user_id,NULL,
    jsonb_build_object('coins',v_before), jsonb_build_object('coins',v_after),
    jsonb_build_object('delta',_delta,'reason',_reason));
  RETURN jsonb_build_object('ok',true,'before',v_before,'after',v_after);
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_cosmetic(_user_id uuid, _cosmetic_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  INSERT INTO public.owned_cosmetics(user_id, cosmetic_id, acquired_via)
    VALUES (_user_id, _cosmetic_id, 'admin_grant') ON CONFLICT DO NOTHING;
  PERFORM public._write_audit('cosmetic.grant','user',_user_id,NULL,NULL,
    jsonb_build_object('cosmetic_id',_cosmetic_id), '{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_skin(_user_id uuid, _skin_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  INSERT INTO public.owned_skins(user_id, skin_id, price_paid)
    VALUES (_user_id, _skin_id, 0) ON CONFLICT DO NOTHING;
  PERFORM public._write_audit('skin.grant','user',_user_id,NULL,NULL,
    jsonb_build_object('skin_id',_skin_id), '{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_grant_achievement(_user_id uuid, _achievement_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  INSERT INTO public.user_achievements(user_id, achievement_id) VALUES (_user_id, _achievement_id) ON CONFLICT DO NOTHING;
  PERFORM public._write_audit('achievement.grant','user',_user_id,NULL,NULL,
    jsonb_build_object('achievement_id',_achievement_id), '{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  IF public.is_super_admin(_user_id) THEN RAISE EXCEPTION 'cannot_ban_super_admin'; END IF;
  UPDATE public.profiles SET banned_at = now(), ban_reason = _reason, updated_at = now() WHERE id = _user_id;
  PERFORM public._write_audit('user.ban','user',_user_id,NULL,NULL,
    jsonb_build_object('banned_at',now(),'reason',_reason), '{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  UPDATE public.profiles SET banned_at = NULL, ban_reason = NULL, suspended_until = NULL, updated_at = now() WHERE id = _user_id;
  PERFORM public._write_audit('user.unban','user',_user_id,NULL,NULL,NULL,'{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_suspend_user(_user_id uuid, _until timestamptz, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  IF public.is_super_admin(_user_id) THEN RAISE EXCEPTION 'cannot_suspend_super_admin'; END IF;
  UPDATE public.profiles SET suspended_until = _until, ban_reason = _reason, updated_at = now() WHERE id = _user_id;
  PERFORM public._write_audit('user.suspend','user',_user_id,NULL,NULL,
    jsonb_build_object('suspended_until',_until,'reason',_reason),'{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_reset_user_progress(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before jsonb;
BEGIN
  PERFORM public._require_admin();
  SELECT jsonb_build_object('xp',xp,'coins',coins,'level',level,'streak',streak,
    'total_wins',total_wins,'total_games',total_games,'rank_points',rank_points)
    INTO v_before FROM public.profiles WHERE id = _user_id;
  UPDATE public.profiles SET xp=0, coins=50, level=1, streak=0, total_wins=0,
    total_games=0, rank_points=0, rank_tier='bronze', updated_at=now() WHERE id = _user_id;
  DELETE FROM public.game_sessions WHERE user_id = _user_id;
  DELETE FROM public.xp_transactions WHERE user_id = _user_id;
  DELETE FROM public.user_achievements WHERE user_id = _user_id;
  DELETE FROM public.achievement_progress WHERE user_id = _user_id;
  DELETE FROM public.challenge_progress WHERE user_id = _user_id;
  DELETE FROM public.daily_streaks WHERE user_id = _user_id;
  PERFORM public._write_audit('user.reset_progress','user',_user_id,NULL,v_before,NULL,'{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_change_plan(_user_id uuid, _plan public.subscription_plan, _months integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before public.subscription_plan;
BEGIN
  PERFORM public._require_admin();
  v_before := public.get_active_plan(_user_id);
  UPDATE public.subscriptions SET status='cancelled', end_date=now(), updated_at=now()
    WHERE user_id=_user_id AND status='active';
  INSERT INTO public.subscriptions (user_id, plan, status, payment_status, start_date, end_date, notes)
    VALUES (_user_id, _plan, 'active', 'paid', now(),
            CASE WHEN _plan='free' THEN NULL ELSE now() + (_months || ' months')::interval END,
            'Set by admin');
  UPDATE public.profiles SET plan = _plan::text, updated_at = now() WHERE id = _user_id;
  PERFORM public._write_audit('plan.change','user',_user_id,NULL,
    jsonb_build_object('plan',v_before), jsonb_build_object('plan',_plan,'months',_months),'{}'::jsonb);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _limit int DEFAULT 100)
RETURNS TABLE(id uuid, email text, full_name text, plan text, xp int, coins int, level int,
  banned_at timestamptz, suspended_until timestamptz, created_at timestamptz, last_sign_in_at timestamptz, is_admin boolean, is_super_admin boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT p.id, u.email::text, p.full_name, p.plan, p.xp, p.coins, p.level,
    p.banned_at, p.suspended_until, u.created_at, u.last_sign_in_at,
    public.has_role(p.id,'admin'::public.app_role),
    public.is_super_admin(p.id)
  FROM public.profiles p JOIN auth.users u ON u.id = p.id
  WHERE _search IS NULL OR u.email ILIKE '%'||_search||'%' OR p.full_name ILIKE '%'||_search||'%'
  ORDER BY u.created_at DESC LIMIT GREATEST(1, LEAST(_limit, 500));
END $$;

CREATE OR REPLACE FUNCTION public.admin_platform_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'banned_users', (SELECT count(*) FROM public.profiles WHERE banned_at IS NOT NULL),
    'pro_users', (SELECT count(*) FROM public.profiles WHERE plan='pro'),
    'business_users', (SELECT count(*) FROM public.profiles WHERE plan='business'),
    'total_xp', (SELECT COALESCE(SUM(xp),0) FROM public.profiles),
    'total_coins', (SELECT COALESCE(SUM(coins),0) FROM public.profiles),
    'games_played_24h', (SELECT count(*) FROM public.game_sessions WHERE created_at > now()-interval '24 hours'),
    'new_users_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now()-interval '7 days'),
    'audit_events_24h', (SELECT count(*) FROM public.admin_audit_logs WHERE created_at > now()-interval '24 hours')
  );
END $$;
