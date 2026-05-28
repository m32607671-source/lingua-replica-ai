
-- Companion character preference
CREATE TABLE public.companion_prefs (
  user_id uuid PRIMARY KEY,
  character text NOT NULL DEFAULT 'owl',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_prefs TO authenticated;
GRANT ALL ON public.companion_prefs TO service_role;
ALTER TABLE public.companion_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs select" ON public.companion_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.companion_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.companion_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Companion chat message log (for history + daily quota)
CREATE TABLE public.companion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_companion_messages_user_time ON public.companion_messages(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.companion_messages TO authenticated;
GRANT ALL ON public.companion_messages TO service_role;
ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msgs select" ON public.companion_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own msgs insert" ON public.companion_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msgs delete" ON public.companion_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin msgs select" ON public.companion_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Daily usage helper
CREATE OR REPLACE FUNCTION public.companion_daily_used(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.companion_messages
   WHERE user_id = _user_id AND role = 'user'
     AND created_at >= date_trunc('day', now());
$$;
