-- Enums
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'business');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'pending', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded', 'failed');

-- Table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS: users see only their own
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- updated_at trigger (reuses existing set_updated_at)
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-expire trigger: when end_date passes, the status check returns 'expired'
-- We compute this in the helper rather than via cron.

-- Helper: get current active plan
CREATE OR REPLACE FUNCTION public.get_active_plan(_user_id UUID)
RETURNS public.subscription_plan
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan
  FROM public.subscriptions
  WHERE user_id = _user_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  ORDER BY
    CASE plan WHEN 'business' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC,
    start_date DESC
  LIMIT 1;
$$;

-- Helper: check feature access by plan tier
CREATE OR REPLACE FUNCTION public.has_plan_at_least(_user_id UUID, _min_plan public.subscription_plan)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE public.get_active_plan(_user_id)
        WHEN 'business' THEN 3
        WHEN 'pro' THEN 2
        WHEN 'free' THEN 1
        ELSE 0
      END
      >=
      CASE _min_plan
        WHEN 'business' THEN 3
        WHEN 'pro' THEN 2
        WHEN 'free' THEN 1
      END
    ),
    false
  );
$$;

-- Auto-create a Free subscription on user signup (extend existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.subscriptions (user_id, plan, status, payment_status, notes)
  VALUES (NEW.id, 'free', 'active', 'paid', 'Auto-created on signup');

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: every existing user without an active subscription gets a Free one
INSERT INTO public.subscriptions (user_id, plan, status, payment_status, notes)
SELECT u.id, 'free', 'active', 'paid', 'Backfilled'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
);