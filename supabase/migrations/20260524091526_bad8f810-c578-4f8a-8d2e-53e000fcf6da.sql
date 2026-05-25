
-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict avatar SELECT to own folder (public URLs still work since bucket is public)
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can list their own avatars"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Revoke execute on security-definer signup trigger from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
