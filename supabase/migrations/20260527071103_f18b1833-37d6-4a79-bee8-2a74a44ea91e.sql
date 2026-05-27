CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT p.id, p.full_name, p.avatar_url, p.plan AS profile_plan,
       p.created_at AS profile_created_at,
       u.email, u.created_at AS user_created_at, u.last_sign_in_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE public.has_role(auth.uid(), 'admin');

GRANT SELECT ON public.admin_users_view TO authenticated;