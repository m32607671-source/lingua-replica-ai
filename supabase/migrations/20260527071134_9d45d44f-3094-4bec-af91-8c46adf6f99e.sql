DROP VIEW IF EXISTS public.admin_users_view;

CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  profile_plan text,
  profile_created_at timestamptz,
  email text,
  user_created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.avatar_url, p.plan::text,
         p.created_at, u.email::text, u.created_at, u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'auth_users_count', (SELECT count(*) FROM auth.users),
    'profiles_count', (SELECT count(*) FROM public.profiles),
    'admin_users_count', (SELECT count(*) FROM public.profiles p JOIN auth.users u ON u.id=p.id),
    'my_roles', COALESCE((SELECT jsonb_agg(role) FROM public.user_roles WHERE user_id = auth.uid()), '[]'::jsonb),
    'is_admin', public.has_role(auth.uid(), 'admin'),
    'my_uid', auth.uid()
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_diagnostics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_diagnostics() TO authenticated;