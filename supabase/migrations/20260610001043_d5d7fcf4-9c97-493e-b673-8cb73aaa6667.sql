
-- =========================================================
-- PROFILES: add competition columns
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS total_wins INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_games INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_tier TEXT NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS rank_points INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipped_title TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_coins ON public.profiles(coins DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_rank_points ON public.profiles(rank_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Enums
DO $$ BEGIN
  CREATE TYPE public.xp_source AS ENUM ('game','win','challenge','achievement','daily_login','streak','clan_war','tournament','event','companion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.challenge_kind AS ENUM ('daily','weekly','monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cosmetic_type AS ENUM ('character_skin','companion_skin','frame','title','badge','accessory');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cosmetic_rarity AS ENUM ('common','rare','epic','legendary','mythic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tournament_status AS ENUM ('scheduled','active','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.clan_war_status AS ENUM ('scheduled','active','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- XP TRANSACTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source public.xp_source NOT NULL,
  base_xp INT NOT NULL DEFAULT 0,
  difficulty_mult NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  combo_bonus INT NOT NULL DEFAULT 0,
  accuracy_bonus INT NOT NULL DEFAULT 0,
  streak_bonus INT NOT NULL DEFAULT 0,
  ref_type TEXT,
  ref_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.xp_transactions TO authenticated;
GRANT ALL ON public.xp_transactions TO service_role;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own xp tx" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_xp_tx_user ON public.xp_transactions(user_id, created_at DESC);

-- =========================================================
-- DAILY STREAKS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  milestones_claimed JSONB NOT NULL DEFAULT '[]'::jsonb,
  freezes_available INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_streaks TO authenticated;
GRANT ALL ON public.daily_streaks TO service_role;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own streak" ON public.daily_streaks FOR SELECT USING (auth.uid() = user_id);

-- =========================================================
-- ACHIEVEMENTS — extend existing
-- =========================================================
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS coin_reward INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title_reward TEXT,
  ADD COLUMN IF NOT EXISTS condition_type TEXT,
  ADD COLUMN IF NOT EXISTS condition_target INT,
  ADD COLUMN IF NOT EXISTS rarity public.cosmetic_rarity NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.achievement_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  target INT NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
GRANT SELECT ON public.achievement_progress TO authenticated;
GRANT ALL ON public.achievement_progress TO service_role;
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own ach progress" ON public.achievement_progress FOR SELECT USING (auth.uid() = user_id);

-- Allow anyone authenticated to read achievement defs (already public)
GRANT SELECT ON public.achievements TO anon, authenticated;

-- =========================================================
-- CHALLENGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.challenge_kind NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric TEXT NOT NULL,            -- e.g. games_played, wins, xp_earned, translations
  target INT NOT NULL,
  xp_reward INT NOT NULL DEFAULT 0,
  coin_reward INT NOT NULL DEFAULT 0,
  cosmetic_reward_id UUID,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_challenges_kind_code_period
  ON public.challenges(kind, code, starts_at);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view challenges" ON public.challenges FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.challenge_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);
GRANT SELECT ON public.challenge_progress TO authenticated;
GRANT ALL ON public.challenge_progress TO service_role;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own ch progress" ON public.challenge_progress FOR SELECT USING (auth.uid() = user_id);

-- =========================================================
-- TOURNAMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  kind public.challenge_kind NOT NULL DEFAULT 'weekly',
  game_code TEXT,
  status public.tournament_status NOT NULL DEFAULT 'scheduled',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  entry_cost INT NOT NULL DEFAULT 0,
  xp_pool INT NOT NULL DEFAULT 1000,
  coin_pool INT NOT NULL DEFAULT 500,
  cosmetic_reward_id UUID,
  max_participants INT,
  participant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT ALL ON public.tournaments TO service_role;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view tournaments" ON public.tournaments FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  games_played INT NOT NULL DEFAULT 0,
  final_rank INT,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);
GRANT SELECT ON public.tournament_participants TO authenticated;
GRANT ALL ON public.tournament_participants TO service_role;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view participants" ON public.tournament_participants FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_tp_tournament_score ON public.tournament_participants(tournament_id, score DESC);

-- =========================================================
-- CLAN WARS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.clan_wars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_a UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_b UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  score_a INT NOT NULL DEFAULT 0,
  score_b INT NOT NULL DEFAULT 0,
  status public.clan_war_status NOT NULL DEFAULT 'scheduled',
  winner_clan UUID,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  trophy_reward INT NOT NULL DEFAULT 50,
  coin_pool INT NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (clan_a <> clan_b)
);
GRANT SELECT ON public.clan_wars TO authenticated;
GRANT ALL ON public.clan_wars TO service_role;
ALTER TABLE public.clan_wars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view wars" ON public.clan_wars FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_cw_status ON public.clan_wars(status, ends_at);

CREATE TABLE IF NOT EXISTS public.clan_war_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id UUID NOT NULL REFERENCES public.clan_wars(id) ON DELETE CASCADE,
  clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  contributions INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(war_id, user_id)
);
GRANT SELECT ON public.clan_war_contributions TO authenticated;
GRANT ALL ON public.clan_war_contributions TO service_role;
ALTER TABLE public.clan_war_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view contributions" ON public.clan_war_contributions FOR SELECT TO authenticated USING (true);

ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS trophies INT NOT NULL DEFAULT 0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS wars_won INT NOT NULL DEFAULT 0;
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS wars_played INT NOT NULL DEFAULT 0;

-- =========================================================
-- COSMETICS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type public.cosmetic_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity public.cosmetic_rarity NOT NULL DEFAULT 'common',
  icon TEXT,
  preview_url TEXT,
  price_coins INT,                       -- null = not purchasable
  unlock_via TEXT,                       -- 'shop','achievement','tournament','event'
  unlock_ref TEXT,                       -- reference code (achievement code, tournament id...)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cosmetics TO anon, authenticated;
GRANT ALL ON public.cosmetics TO service_role;
ALTER TABLE public.cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view cosmetics" ON public.cosmetics FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.owned_cosmetics (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  acquired_via TEXT,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cosmetic_id)
);
GRANT SELECT ON public.owned_cosmetics TO authenticated;
GRANT ALL ON public.owned_cosmetics TO service_role;
ALTER TABLE public.owned_cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own cosmetics" ON public.owned_cosmetics FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.equipped_cosmetics (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.cosmetic_type NOT NULL,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  equipped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipped_cosmetics TO authenticated;
GRANT ALL ON public.equipped_cosmetics TO service_role;
ALTER TABLE public.equipped_cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage equipped" ON public.equipped_cosmetics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- EVENTS (boosts / holiday)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  xp_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  coin_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  banner_color TEXT DEFAULT '#a855f7',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view events" ON public.events FOR SELECT USING (true);

-- =========================================================
-- HELPER: current event multipliers
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_active_event_multipliers()
RETURNS TABLE(xp_mult NUMERIC, coin_mult NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(xp_multiplier),1.0), COALESCE(MAX(coin_multiplier),1.0)
  FROM public.events
  WHERE active = true AND now() BETWEEN starts_at AND ends_at;
$$;

-- =========================================================
-- LEVEL CALC
-- =========================================================
CREATE OR REPLACE FUNCTION public.level_for_xp(_xp INT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(1, FLOOR(SQRT(GREATEST(_xp,0)::numeric / 50))::int + 1);
$$;

CREATE OR REPLACE FUNCTION public.level_tier(_level INT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _level <= 10 THEN 'Beginner'
    WHEN _level <= 25 THEN 'Explorer'
    WHEN _level <= 50 THEN 'Translator'
    WHEN _level <= 75 THEN 'Language Expert'
    WHEN _level <= 100 THEN 'Master Linguist'
    ELSE 'Grand Polyglot'
  END;
$$;

CREATE OR REPLACE FUNCTION public.rank_tier_for_points(_pts INT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _pts >= 5000 THEN 'grandmaster'
    WHEN _pts >= 3500 THEN 'master'
    WHEN _pts >= 2500 THEN 'diamond'
    WHEN _pts >= 1500 THEN 'platinum'
    WHEN _pts >= 800  THEN 'gold'
    WHEN _pts >= 300  THEN 'silver'
    ELSE 'bronze'
  END;
$$;

-- =========================================================
-- CORE AWARD XP
-- =========================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  _user UUID, _base INT, _source public.xp_source,
  _difficulty NUMERIC DEFAULT 1.0, _combo INT DEFAULT 0,
  _accuracy INT DEFAULT 0, _streak_bonus INT DEFAULT 0,
  _ref_type TEXT DEFAULT NULL, _ref_id UUID DEFAULT NULL
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mult NUMERIC := 1.0; v_total INT; v_new_xp INT; v_new_level INT;
BEGIN
  SELECT xp_mult INTO v_mult FROM public.get_active_event_multipliers();
  v_total := GREATEST(0, FLOOR((_base * COALESCE(_difficulty,1.0) + _combo + _accuracy + _streak_bonus) * v_mult))::int;
  IF v_total = 0 THEN RETURN 0; END IF;

  INSERT INTO public.xp_transactions (user_id, amount, source, base_xp, difficulty_mult, combo_bonus, accuracy_bonus, streak_bonus, ref_type, ref_id)
    VALUES (_user, v_total, _source, _base, _difficulty, _combo, _accuracy, _streak_bonus, _ref_type, _ref_id);

  UPDATE public.profiles
    SET xp = xp + v_total,
        level = public.level_for_xp(xp + v_total),
        updated_at = now()
    WHERE id = _user
    RETURNING xp, level INTO v_new_xp, v_new_level;

  RETURN v_total;
END $$;

-- =========================================================
-- DAILY STREAK
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_daily_streak(_user UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_row public.daily_streaks%ROWTYPE;
  v_new_streak INT;
  v_milestone INT;
  v_bonus_xp INT := 0; v_bonus_coins INT := 0;
  v_claimed JSONB;
BEGIN
  INSERT INTO public.daily_streaks (user_id) VALUES (_user) ON CONFLICT DO NOTHING;
  SELECT * INTO v_row FROM public.daily_streaks WHERE user_id = _user FOR UPDATE;

  IF v_row.last_active_date = v_today THEN
    RETURN jsonb_build_object('ok',true,'streak',v_row.current_streak,'unchanged',true);
  ELSIF v_row.last_active_date = v_today - 1 THEN
    v_new_streak := v_row.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  v_claimed := v_row.milestones_claimed;
  FOREACH v_milestone IN ARRAY ARRAY[7,30,100,365] LOOP
    IF v_new_streak = v_milestone AND NOT (v_claimed @> to_jsonb(v_milestone)) THEN
      v_bonus_xp := v_milestone * 10;
      v_bonus_coins := v_milestone * 5;
      v_claimed := v_claimed || to_jsonb(v_milestone);
      PERFORM public.award_xp(_user, v_bonus_xp, 'streak'::public.xp_source, 1.0, 0, 0, 0, 'streak', NULL);
      UPDATE public.profiles SET coins = coins + v_bonus_coins WHERE id = _user;
      INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type)
        SELECT _user,'earn'::public.coin_tx_kind,v_bonus_coins,(SELECT coins FROM public.profiles WHERE id=_user),
               'Streak milestone: '||v_milestone||' days','streak';
    END IF;
  END LOOP;

  UPDATE public.daily_streaks
    SET current_streak = v_new_streak,
        longest_streak = GREATEST(longest_streak, v_new_streak),
        last_active_date = v_today,
        milestones_claimed = v_claimed,
        updated_at = now()
    WHERE user_id = _user;

  UPDATE public.profiles SET streak = v_new_streak, last_activity_date = v_today WHERE id = _user;

  RETURN jsonb_build_object('ok',true,'streak',v_new_streak,'bonus_xp',v_bonus_xp,'bonus_coins',v_bonus_coins);
END $$;

-- =========================================================
-- ACHIEVEMENT EVALUATION
-- =========================================================
CREATE OR REPLACE FUNCTION public.evaluate_achievements(_user UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p public.profiles%ROWTYPE;
  v_ach public.achievements%ROWTYPE;
  v_progress INT;
  v_unlocked TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO v_p FROM public.profiles WHERE id = _user;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;

  FOR v_ach IN SELECT * FROM public.achievements WHERE condition_type IS NOT NULL LOOP
    v_progress := CASE v_ach.condition_type
      WHEN 'xp' THEN v_p.xp
      WHEN 'wins' THEN v_p.total_wins
      WHEN 'games' THEN v_p.total_games
      WHEN 'streak' THEN v_p.streak
      WHEN 'translations' THEN v_p.translations_count
      WHEN 'words' THEN v_p.words_count
      WHEN 'coins' THEN v_p.coins
      WHEN 'level' THEN v_p.level
      ELSE 0
    END;

    INSERT INTO public.achievement_progress(user_id,achievement_id,progress,target,completed)
      VALUES (_user, v_ach.id, v_progress, COALESCE(v_ach.condition_target,1),
              v_progress >= COALESCE(v_ach.condition_target,1))
      ON CONFLICT (user_id, achievement_id) DO UPDATE
        SET progress = EXCLUDED.progress,
            completed = EXCLUDED.completed,
            updated_at = now();

    IF v_progress >= COALESCE(v_ach.condition_target,1) AND NOT EXISTS (
      SELECT 1 FROM public.user_achievements WHERE user_id = _user AND achievement_id = v_ach.id
    ) THEN
      INSERT INTO public.user_achievements(user_id, achievement_id) VALUES (_user, v_ach.id);
      PERFORM public.award_xp(_user, v_ach.xp_reward, 'achievement'::public.xp_source, 1.0, 0, 0, 0, 'achievement', v_ach.id);
      IF v_ach.coin_reward > 0 THEN
        UPDATE public.profiles SET coins = coins + v_ach.coin_reward WHERE id = _user;
        INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
          SELECT _user,'earn'::public.coin_tx_kind,v_ach.coin_reward,
                 (SELECT coins FROM public.profiles WHERE id=_user),
                 'Achievement: '||v_ach.title,'achievement',v_ach.id;
      END IF;
      v_unlocked := array_append(v_unlocked, v_ach.code);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok',true,'unlocked',to_jsonb(v_unlocked));
END $$;

-- =========================================================
-- CHALLENGE PROGRESS HELPER
-- =========================================================
CREATE OR REPLACE FUNCTION public.tick_challenges(_user UUID, _metric TEXT, _delta INT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ch RECORD;
BEGIN
  FOR v_ch IN
    SELECT c.* FROM public.challenges c
    WHERE c.active = true AND c.metric = _metric
      AND now() BETWEEN c.starts_at AND c.ends_at
  LOOP
    INSERT INTO public.challenge_progress(user_id, challenge_id, progress, completed)
      VALUES (_user, v_ch.id, _delta, _delta >= v_ch.target)
      ON CONFLICT (user_id, challenge_id) DO UPDATE
        SET progress = LEAST(challenge_progress.progress + _delta, v_ch.target),
            completed = (challenge_progress.progress + _delta) >= v_ch.target,
            updated_at = now();
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.claim_challenge_reward(_challenge_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_ch public.challenges%ROWTYPE;
  v_pr public.challenge_progress%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_ch FROM public.challenges WHERE id = _challenge_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  SELECT * INTO v_pr FROM public.challenge_progress WHERE user_id=v_user AND challenge_id=_challenge_id;
  IF NOT FOUND OR NOT v_pr.completed THEN RETURN jsonb_build_object('ok',false,'error','not_completed'); END IF;
  IF v_pr.claimed THEN RETURN jsonb_build_object('ok',false,'error','already_claimed'); END IF;

  UPDATE public.challenge_progress SET claimed=true, updated_at=now() WHERE user_id=v_user AND challenge_id=_challenge_id;
  PERFORM public.award_xp(v_user, v_ch.xp_reward, 'challenge'::public.xp_source, 1.0, 0, 0, 0, v_ch.kind::text, _challenge_id);
  IF v_ch.coin_reward > 0 THEN
    UPDATE public.profiles SET coins = coins + v_ch.coin_reward WHERE id = v_user;
    INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
      SELECT v_user,'earn'::public.coin_tx_kind,v_ch.coin_reward,
             (SELECT coins FROM public.profiles WHERE id=v_user),
             'Challenge: '||v_ch.title,v_ch.kind::text,_challenge_id;
  END IF;
  IF v_ch.cosmetic_reward_id IS NOT NULL THEN
    INSERT INTO public.owned_cosmetics(user_id, cosmetic_id, acquired_via)
      VALUES (v_user, v_ch.cosmetic_reward_id, 'challenge')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN jsonb_build_object('ok',true,'xp',v_ch.xp_reward,'coins',v_ch.coin_reward);
END $$;

-- =========================================================
-- ENHANCED GAME SCORE SUBMISSION
-- =========================================================
CREATE OR REPLACE FUNCTION public.submit_game_score_v2(
  _game_code TEXT, _score INT, _duration INT DEFAULT NULL,
  _accuracy INT DEFAULT 100, _combo INT DEFAULT 0,
  _difficulty TEXT DEFAULT 'medium', _won BOOLEAN DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_game public.games%ROWTYPE;
  v_mult NUMERIC := 1.0;
  v_combo_bonus INT := 0;
  v_acc_bonus INT := 0;
  v_streak_bonus INT := 0;
  v_xp INT; v_coins INT;
  v_clan UUID;
  v_streak_data jsonb;
  v_active_war public.clan_wars%ROWTYPE;
  v_war_score INT;
  v_unlocked jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_game FROM public.games WHERE code = _game_code AND status='live';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','game_not_available'); END IF;

  -- Anti-farm: cap recent same-game submissions to 30/hour
  IF (SELECT COUNT(*) FROM public.game_sessions
       WHERE user_id=v_user AND game_code=_game_code AND created_at > now()-interval '1 hour') >= 30 THEN
    RETURN jsonb_build_object('ok',false,'error','rate_limited');
  END IF;
  -- Score sanity
  IF _score < 0 OR _score > 100000 OR _accuracy < 0 OR _accuracy > 100 THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_score');
  END IF;

  v_mult := CASE _difficulty WHEN 'easy' THEN 1.0 WHEN 'medium' THEN 1.5
                              WHEN 'hard' THEN 2.0 WHEN 'expert' THEN 3.0 ELSE 1.0 END;
  v_combo_bonus := LEAST(_combo * 2, 100);
  v_acc_bonus := CASE WHEN _accuracy >= 95 THEN 50 WHEN _accuracy >= 80 THEN 25 ELSE 0 END;
  v_streak_bonus := LEAST((SELECT current_streak FROM public.daily_streaks WHERE user_id=v_user), 30);

  v_xp := LEAST(v_game.xp_reward * GREATEST(1, _score / 5), v_game.xp_reward * 20);
  v_xp := public.award_xp(v_user, v_xp, CASE WHEN _won THEN 'win'::public.xp_source ELSE 'game'::public.xp_source END,
                          v_mult, v_combo_bonus, v_acc_bonus, v_streak_bonus, 'game', NULL);

  v_coins := LEAST(v_game.coin_reward * GREATEST(1, _score / 10), v_game.coin_reward * 10);
  UPDATE public.profiles
    SET coins = coins + v_coins,
        total_games = total_games + 1,
        total_wins = total_wins + CASE WHEN _won THEN 1 ELSE 0 END,
        rank_points = GREATEST(0, rank_points + CASE WHEN _won THEN 15 ELSE -5 END),
        rank_tier = public.rank_tier_for_points(GREATEST(0, rank_points + CASE WHEN _won THEN 15 ELSE -5 END)),
        last_activity_date = CURRENT_DATE
    WHERE id = v_user;

  INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type)
    SELECT v_user,'earn'::public.coin_tx_kind,v_coins,
           (SELECT coins FROM public.profiles WHERE id=v_user),
           'Game reward: '||v_game.name,'game';

  INSERT INTO public.game_sessions (user_id, game_code, score, xp_earned, coins_earned, duration_seconds)
    VALUES (v_user, _game_code, _score, v_xp, v_coins, _duration);

  -- Streak
  v_streak_data := public.update_daily_streak(v_user);

  -- Clan + clan war
  SELECT clan_id INTO v_clan FROM public.clan_members WHERE user_id=v_user;
  IF v_clan IS NOT NULL THEN
    UPDATE public.clans SET total_xp = total_xp + v_xp, updated_at = now() WHERE id = v_clan;
    UPDATE public.clan_members SET contributed_xp = contributed_xp + v_xp WHERE clan_id=v_clan AND user_id=v_user;
    SELECT * INTO v_active_war FROM public.clan_wars
      WHERE status='active' AND (clan_a=v_clan OR clan_b=v_clan) AND now() BETWEEN starts_at AND ends_at
      ORDER BY starts_at DESC LIMIT 1;
    IF FOUND THEN
      v_war_score := _score;
      INSERT INTO public.clan_war_contributions(war_id, clan_id, user_id, score, contributions)
        VALUES (v_active_war.id, v_clan, v_user, v_war_score, 1)
        ON CONFLICT (war_id, user_id) DO UPDATE
          SET score = clan_war_contributions.score + v_war_score,
              contributions = clan_war_contributions.contributions + 1,
              updated_at = now();
      IF v_active_war.clan_a = v_clan THEN
        UPDATE public.clan_wars SET score_a = score_a + v_war_score, updated_at=now() WHERE id = v_active_war.id;
      ELSE
        UPDATE public.clan_wars SET score_b = score_b + v_war_score, updated_at=now() WHERE id = v_active_war.id;
      END IF;
    END IF;
  END IF;

  -- Active tournament for this game
  UPDATE public.tournament_participants tp
    SET score = tp.score + _score, games_played = tp.games_played + 1, updated_at = now()
    FROM public.tournaments t
    WHERE tp.tournament_id = t.id AND tp.user_id = v_user AND t.status='active'
      AND (t.game_code = _game_code OR t.game_code IS NULL)
      AND now() BETWEEN t.starts_at AND t.ends_at;

  -- Challenges
  PERFORM public.tick_challenges(v_user, 'games_played', 1);
  IF _won THEN PERFORM public.tick_challenges(v_user, 'wins', 1); END IF;
  PERFORM public.tick_challenges(v_user, 'xp_earned', v_xp);

  -- Achievements
  v_unlocked := public.evaluate_achievements(v_user);

  RETURN jsonb_build_object('ok',true,'xp_earned',v_xp,'coins_earned',v_coins,
    'streak',v_streak_data,'unlocked',v_unlocked->'unlocked',
    'multiplier',v_mult,'rank_points',(SELECT rank_points FROM public.profiles WHERE id=v_user));
END $$;

-- =========================================================
-- TOURNAMENTS
-- =========================================================
CREATE OR REPLACE FUNCTION public.join_tournament(_tid UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_t public.tournaments%ROWTYPE; v_balance INT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_t FROM public.tournaments WHERE id=_tid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF v_t.status NOT IN ('scheduled','active') THEN RETURN jsonb_build_object('ok',false,'error','closed'); END IF;
  IF v_t.max_participants IS NOT NULL AND v_t.participant_count >= v_t.max_participants THEN
    RETURN jsonb_build_object('ok',false,'error','full');
  END IF;
  IF EXISTS(SELECT 1 FROM public.tournament_participants WHERE tournament_id=_tid AND user_id=v_user) THEN
    RETURN jsonb_build_object('ok',false,'error','already_joined');
  END IF;
  IF v_t.entry_cost > 0 THEN
    SELECT coins INTO v_balance FROM public.profiles WHERE id=v_user FOR UPDATE;
    IF v_balance < v_t.entry_cost THEN RETURN jsonb_build_object('ok',false,'error','insufficient_coins'); END IF;
    UPDATE public.profiles SET coins = coins - v_t.entry_cost WHERE id=v_user;
    INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
      VALUES(v_user,'spend',-v_t.entry_cost,(SELECT coins FROM public.profiles WHERE id=v_user),
             'Tournament entry: '||v_t.name,'tournament',_tid);
  END IF;
  INSERT INTO public.tournament_participants(tournament_id,user_id) VALUES(_tid,v_user);
  UPDATE public.tournaments SET participant_count = participant_count + 1, updated_at=now() WHERE id=_tid;
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.finalize_tournament(_tid UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_t public.tournaments%ROWTYPE; v_row RECORD; v_rank INT := 0; v_xp INT; v_coins INT;
BEGIN
  SELECT * INTO v_t FROM public.tournaments WHERE id=_tid FOR UPDATE;
  IF v_t.status='completed' THEN RETURN jsonb_build_object('ok',false,'error','already_finalized'); END IF;
  FOR v_row IN SELECT * FROM public.tournament_participants WHERE tournament_id=_tid ORDER BY score DESC LOOP
    v_rank := v_rank + 1;
    -- Top 3 get major prizes
    v_xp := CASE v_rank WHEN 1 THEN v_t.xp_pool/2 WHEN 2 THEN v_t.xp_pool/4 WHEN 3 THEN v_t.xp_pool/8
                       ELSE GREATEST(50, v_t.xp_pool/100) END;
    v_coins := CASE v_rank WHEN 1 THEN v_t.coin_pool/2 WHEN 2 THEN v_t.coin_pool/4 WHEN 3 THEN v_t.coin_pool/8
                       ELSE GREATEST(10, v_t.coin_pool/100) END;
    PERFORM public.award_xp(v_row.user_id, v_xp, 'tournament'::public.xp_source, 1.0, 0, 0, 0, 'tournament', _tid);
    UPDATE public.profiles SET coins = coins + v_coins WHERE id = v_row.user_id;
    INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
      SELECT v_row.user_id,'earn'::public.coin_tx_kind,v_coins,
             (SELECT coins FROM public.profiles WHERE id=v_row.user_id),
             'Tournament rank #'||v_rank||': '||v_t.name,'tournament',_tid;
    UPDATE public.tournament_participants SET final_rank = v_rank, rewards_claimed = true WHERE id = v_row.id;
    IF v_rank = 1 AND v_t.cosmetic_reward_id IS NOT NULL THEN
      INSERT INTO public.owned_cosmetics(user_id, cosmetic_id, acquired_via)
        VALUES(v_row.user_id, v_t.cosmetic_reward_id, 'tournament') ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  UPDATE public.tournaments SET status='completed', updated_at=now() WHERE id=_tid;
  RETURN jsonb_build_object('ok',true,'finalized',v_rank);
END $$;

-- =========================================================
-- CLAN WARS
-- =========================================================
CREATE OR REPLACE FUNCTION public.start_clan_war(_clan_a UUID, _clan_b UUID, _minutes INT DEFAULT 10)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF _clan_a = _clan_b THEN RETURN jsonb_build_object('ok',false,'error','same_clan'); END IF;
  IF EXISTS (SELECT 1 FROM public.clan_wars
              WHERE status='active' AND (clan_a IN (_clan_a,_clan_b) OR clan_b IN (_clan_a,_clan_b))) THEN
    RETURN jsonb_build_object('ok',false,'error','already_in_war');
  END IF;
  INSERT INTO public.clan_wars(clan_a, clan_b, status, starts_at, ends_at)
    VALUES(_clan_a, _clan_b, 'active', now(), now() + (_minutes || ' minutes')::interval)
    RETURNING id INTO v_id;
  UPDATE public.clans SET wars_played = wars_played + 1 WHERE id IN (_clan_a, _clan_b);
  RETURN jsonb_build_object('ok',true,'war_id',v_id);
END $$;

CREATE OR REPLACE FUNCTION public.finalize_clan_war(_war_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_w public.clan_wars%ROWTYPE; v_winner UUID; v_loser UUID; v_member RECORD;
BEGIN
  SELECT * INTO v_w FROM public.clan_wars WHERE id=_war_id FOR UPDATE;
  IF NOT FOUND OR v_w.status='completed' THEN RETURN jsonb_build_object('ok',false); END IF;
  IF v_w.score_a >= v_w.score_b THEN v_winner := v_w.clan_a; v_loser := v_w.clan_b;
  ELSE v_winner := v_w.clan_b; v_loser := v_w.clan_a; END IF;
  UPDATE public.clan_wars SET status='completed', winner_clan=v_winner, updated_at=now() WHERE id=_war_id;
  UPDATE public.clans SET trophies = trophies + v_w.trophy_reward, wars_won = wars_won + 1 WHERE id = v_winner;
  -- Distribute coin pool to winner clan members proportional to contribution
  FOR v_member IN
    SELECT user_id, score FROM public.clan_war_contributions WHERE war_id=_war_id AND clan_id=v_winner
  LOOP
    DECLARE v_share INT;
    BEGIN
      v_share := GREATEST(50, (v_w.coin_pool * v_member.score) / NULLIF(GREATEST(v_w.score_a, v_w.score_b),0));
      UPDATE public.profiles SET coins = coins + v_share WHERE id = v_member.user_id;
      INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
        SELECT v_member.user_id,'earn'::public.coin_tx_kind,v_share,
               (SELECT coins FROM public.profiles WHERE id=v_member.user_id),
               'Clan war victory','clan_war',_war_id;
      PERFORM public.award_xp(v_member.user_id, 200, 'clan_war'::public.xp_source, 1.0, 0, 0, 0, 'clan_war', _war_id);
    END;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'winner',v_winner);
END $$;

-- =========================================================
-- COSMETICS PURCHASE / EQUIP
-- =========================================================
CREATE OR REPLACE FUNCTION public.purchase_cosmetic(_cosmetic_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_c public.cosmetics%ROWTYPE; v_bal INT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_c FROM public.cosmetics WHERE id=_cosmetic_id AND available=true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF v_c.price_coins IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_purchasable'); END IF;
  IF EXISTS(SELECT 1 FROM public.owned_cosmetics WHERE user_id=v_user AND cosmetic_id=_cosmetic_id) THEN
    RETURN jsonb_build_object('ok',false,'error','already_owned');
  END IF;
  SELECT coins INTO v_bal FROM public.profiles WHERE id=v_user FOR UPDATE;
  IF v_bal < v_c.price_coins THEN RETURN jsonb_build_object('ok',false,'error','insufficient_coins'); END IF;
  UPDATE public.profiles SET coins = coins - v_c.price_coins WHERE id=v_user;
  INSERT INTO public.owned_cosmetics(user_id, cosmetic_id, acquired_via) VALUES(v_user,_cosmetic_id,'shop');
  INSERT INTO public.coin_transactions(user_id,kind,amount,balance_after,reason,ref_type,ref_id)
    VALUES(v_user,'spend',-v_c.price_coins,(SELECT coins FROM public.profiles WHERE id=v_user),
           'Cosmetic: '||v_c.name,'cosmetic',_cosmetic_id);
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.equip_cosmetic(_cosmetic_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_c public.cosmetics%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','unauthenticated'); END IF;
  SELECT * INTO v_c FROM public.cosmetics WHERE id=_cosmetic_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF NOT EXISTS(SELECT 1 FROM public.owned_cosmetics WHERE user_id=v_user AND cosmetic_id=_cosmetic_id) THEN
    RETURN jsonb_build_object('ok',false,'error','not_owned');
  END IF;
  INSERT INTO public.equipped_cosmetics(user_id, type, cosmetic_id)
    VALUES(v_user, v_c.type, _cosmetic_id)
    ON CONFLICT(user_id,type) DO UPDATE SET cosmetic_id=EXCLUDED.cosmetic_id, equipped_at=now();
  IF v_c.type = 'title' THEN
    UPDATE public.profiles SET equipped_title = v_c.name WHERE id = v_user;
  END IF;
  RETURN jsonb_build_object('ok',true);
END $$;

-- =========================================================
-- LEADERBOARD HELPERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.leaderboard_global(_metric TEXT DEFAULT 'xp', _limit INT DEFAULT 100, _country TEXT DEFAULT NULL, _language TEXT DEFAULT NULL)
RETURNS TABLE(user_id UUID, full_name TEXT, avatar_url TEXT, country TEXT, learning_language TEXT,
              xp INT, coins INT, level INT, total_wins INT, rank_tier TEXT, rank_points INT, equipped_title TEXT, rank BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.avatar_url, p.country, p.learning_language,
         p.xp, p.coins, p.level, p.total_wins, p.rank_tier, p.rank_points, p.equipped_title,
         ROW_NUMBER() OVER (ORDER BY
           CASE _metric WHEN 'coins' THEN p.coins WHEN 'wins' THEN p.total_wins
                        WHEN 'rank' THEN p.rank_points WHEN 'streak' THEN p.streak
                        ELSE p.xp END DESC) AS rank
  FROM public.profiles p
  WHERE (_country IS NULL OR p.country = _country)
    AND (_language IS NULL OR p.learning_language = _language)
  ORDER BY rank
  LIMIT GREATEST(1, LEAST(_limit, 500));
$$;

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_wars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_war_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.challenge_progress REPLICA IDENTITY FULL;
ALTER TABLE public.tournament_participants REPLICA IDENTITY FULL;
ALTER TABLE public.clan_wars REPLICA IDENTITY FULL;
ALTER TABLE public.clan_war_contributions REPLICA IDENTITY FULL;
