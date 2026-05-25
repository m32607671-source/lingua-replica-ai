
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS native_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS learning_language text NOT NULL DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date date,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;

-- Achievements catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'trophy',
  xp_reward integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements viewable by everyone"
  ON public.achievements FOR SELECT USING (true);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User achievements viewable by everyone"
  ON public.user_achievements FOR SELECT USING (true);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.user_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- Seed achievements
INSERT INTO public.achievements (code, title, description, icon, xp_reward) VALUES
  ('first_translation', 'First Steps', 'Complete your first translation', 'sparkles', 10),
  ('streak_3', 'On Fire', 'Maintain a 3-day streak', 'flame', 30),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 70),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', 'flame', 300),
  ('translations_10', 'Getting Started', 'Complete 10 translations', 'languages', 50),
  ('translations_100', 'Polyglot', 'Complete 100 translations', 'languages', 200),
  ('words_1000', 'Wordsmith', 'Translate 1,000 words', 'book-open', 100),
  ('level_5', 'Rising Star', 'Reach level 5', 'star', 100),
  ('level_10', 'Language Master', 'Reach level 10', 'crown', 250)
ON CONFLICT (code) DO NOTHING;
