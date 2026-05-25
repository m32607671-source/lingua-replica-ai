CREATE TABLE public.checkout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan TEXT NOT NULL,
  billing TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  user_email TEXT,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own checkout events"
  ON public.checkout_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own checkout events"
  ON public.checkout_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_checkout_events_user_id ON public.checkout_events(user_id);
CREATE INDEX idx_checkout_events_created_at ON public.checkout_events(created_at DESC);