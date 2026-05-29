
-- Rarity enum
DO $$ BEGIN
  CREATE TYPE public.skin_rarity AS ENUM ('common','rare','epic','legendary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.coin_tx_kind AS ENUM ('earn','spend','refund','bonus');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================================
-- companion_skins: catalog
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.companion_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  character text NOT NULL CHECK (character IN ('owl','fox','nova','panda')),
  name text NOT NULL,
  description text,
  emoji text NOT NULL DEFAULT '✨',
  gradient text NOT NULL DEFAULT 'from-primary to-primary/60',
  rarity public.skin_rarity NOT NULL DEFAULT 'common',
  price_coins integer NOT NULL DEFAULT 100 CHECK (price_coins >= 0),
  featured boolean NOT NULL DEFAULT false,
  limited boolean NOT NULL DEFAULT false,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companion_skins TO anon, authenticated;
GRANT ALL ON public.companion_skins TO service_role;

ALTER TABLE public.companion_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skins viewable by everyone"
  ON public.companion_skins FOR SELECT
  USING (true);

CREATE POLICY "Admins manage skins"
  ON public.companion_skins FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =====================================================================
-- owned_skins
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.owned_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skin_id uuid NOT NULL REFERENCES public.companion_skins(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  price_paid integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, skin_id)
);

CREATE INDEX IF NOT EXISTS owned_skins_user_idx ON public.owned_skins(user_id);

GRANT SELECT, INSERT ON public.owned_skins TO authenticated;
GRANT ALL ON public.owned_skins TO service_role;

ALTER TABLE public.owned_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own skins"
  ON public.owned_skins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all owned skins"
  ON public.owned_skins FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own owned skins"
  ON public.owned_skins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- equipped_skins (one per character per user)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.equipped_skins (
  user_id uuid NOT NULL,
  character text NOT NULL CHECK (character IN ('owl','fox','nova','panda')),
  skin_id uuid NOT NULL REFERENCES public.companion_skins(id) ON DELETE CASCADE,
  equipped_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, character)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipped_skins TO authenticated;
GRANT ALL ON public.equipped_skins TO service_role;

ALTER TABLE public.equipped_skins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own equipped"
  ON public.equipped_skins FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- coin_transactions audit log
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind public.coin_tx_kind NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  ref_type text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coin_tx_user_idx ON public.coin_transactions(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coin tx"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all coin tx"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own coin tx"
  ON public.coin_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- purchase_skin RPC: atomic balance check + deduct + grant + equip + log
-- =====================================================================
CREATE OR REPLACE FUNCTION public.purchase_skin(_skin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_skin public.companion_skins%ROWTYPE;
  v_balance integer;
  v_new_balance integer;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO v_skin FROM public.companion_skins WHERE id = _skin_id AND available = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'skin_not_found');
  END IF;

  IF EXISTS (SELECT 1 FROM public.owned_skins WHERE user_id = v_user AND skin_id = _skin_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_owned');
  END IF;

  SELECT coins INTO v_balance FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_profile');
  END IF;

  IF v_balance < v_skin.price_coins THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins',
      'balance', v_balance, 'price', v_skin.price_coins);
  END IF;

  v_new_balance := v_balance - v_skin.price_coins;

  UPDATE public.profiles SET coins = v_new_balance, updated_at = now() WHERE id = v_user;

  INSERT INTO public.owned_skins (user_id, skin_id, price_paid)
    VALUES (v_user, _skin_id, v_skin.price_coins);

  INSERT INTO public.coin_transactions (user_id, kind, amount, balance_after, reason, ref_type, ref_id)
    VALUES (v_user, 'spend', -v_skin.price_coins, v_new_balance, 'Purchased skin: ' || v_skin.name, 'skin', _skin_id);

  INSERT INTO public.equipped_skins (user_id, character, skin_id)
    VALUES (v_user, v_skin.character, _skin_id)
    ON CONFLICT (user_id, character) DO UPDATE SET skin_id = EXCLUDED.skin_id, equipped_at = now();

  RETURN jsonb_build_object('ok', true, 'balance', v_new_balance, 'skin_id', _skin_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_skin(uuid) TO authenticated;

-- =====================================================================
-- Seed catalog
-- =====================================================================
INSERT INTO public.companion_skins (code, character, name, description, emoji, gradient, rarity, price_coins, featured, limited) VALUES
  ('owl_golden',  'owl',  'Golden Owl',     'A gilded scholar radiating wisdom.',     '🦉', 'from-amber-400 to-yellow-600',  'rare',      300, true,  false),
  ('owl_cyber',   'owl',  'Cyber Owl',      'Neon-circuit owl from the future.',      '🦉', 'from-cyan-400 to-blue-600',     'epic',      800, false, false),
  ('owl_wizard',  'owl',  'Wizard Owl',     'Arcane mentor of ancient tongues.',      '🧙', 'from-violet-500 to-purple-700', 'legendary', 1500, true,  true),
  ('fox_ninja',   'fox',  'Ninja Fox',      'Stealthy explorer of hidden phrases.',   '🦊', 'from-zinc-700 to-zinc-900',     'rare',      300, false, false),
  ('fox_galaxy',  'fox',  'Galaxy Fox',     'Star-flecked fur from across the void.', '🌌', 'from-indigo-500 to-fuchsia-600','epic',      800, true,  false),
  ('fox_fire',    'fox',  'Fire Fox',       'Blazing trail through every lesson.',    '🔥', 'from-orange-500 to-red-600',    'legendary', 1500, false, true),
  ('nova_neon',   'nova', 'Neon Nova',      'Bright synthwave companion bot.',        '🤖', 'from-pink-500 to-purple-600',   'rare',      300, false, false),
  ('nova_stealth','nova', 'Stealth Nova',   'Matte-black tactical edition.',          '🛰', 'from-slate-700 to-slate-900',   'epic',      800, false, false),
  ('nova_chrome', 'nova', 'Chrome Nova',    'Polished mirror finish, premium build.', '✨', 'from-slate-300 to-slate-500',   'legendary', 1500, true,  true),
  ('panda_samurai','panda','Samurai Panda', 'Disciplined warrior of grammar.',        '🐼', 'from-red-500 to-rose-700',      'rare',      300, false, false),
  ('panda_royal', 'panda','Royal Panda',    'Crowned and confident.',                 '👑', 'from-yellow-400 to-amber-600',  'epic',      800, true,  false),
  ('panda_space', 'panda','Space Panda',    'Astronaut from the bamboo nebula.',      '🚀', 'from-blue-500 to-indigo-700',   'legendary', 1500, false, true)
ON CONFLICT (code) DO NOTHING;
