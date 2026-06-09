
-- ============== ENUMS ==============
CREATE TYPE public.team_role AS ENUM ('owner','admin','manager','translator','reviewer','viewer');
CREATE TYPE public.team_project_status AS ENUM ('draft','active','review','completed','archived');
CREATE TYPE public.team_assignment_role AS ENUM ('translator','reviewer');

-- ============== TEAMS ==============
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '👥',
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  member_count INT NOT NULL DEFAULT 1,
  project_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ============== TEAM MEMBERS ==============
CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ============== HELPER FUNCTIONS (security definer to avoid RLS recursion) ==============
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.team_member_role(_team_id UUID, _user_id UUID)
RETURNS public.team_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_team(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.team_member_role(_team_id, _user_id) IN ('owner','admin','manager');
$$;

-- ============== PROJECTS ==============
CREATE TABLE public.team_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'es',
  status public.team_project_status NOT NULL DEFAULT 'draft',
  progress INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_projects_team ON public.team_projects(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_projects TO authenticated;
GRANT ALL ON public.team_projects TO service_role;
ALTER TABLE public.team_projects ENABLE ROW LEVEL SECURITY;

-- ============== PROJECT ASSIGNMENTS ==============
CREATE TABLE public.team_project_assignments (
  project_id UUID NOT NULL REFERENCES public.team_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_role public.team_assignment_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id, assignment_role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_project_assignments TO authenticated;
GRANT ALL ON public.team_project_assignments TO service_role;
ALTER TABLE public.team_project_assignments ENABLE ROW LEVEL SECURITY;

-- ============== GLOSSARY ==============
CREATE TABLE public.team_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  translation TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'es',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_glossary_team ON public.team_glossary(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_glossary TO authenticated;
GRANT ALL ON public.team_glossary TO service_role;
ALTER TABLE public.team_glossary ENABLE ROW LEVEL SECURITY;

-- ============== CHAT ==============
CREATE TABLE public.team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_chat_team_created ON public.team_chat_messages(team_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.team_chat_messages TO authenticated;
GRANT ALL ON public.team_chat_messages TO service_role;
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;

-- ============== ACTIVITY ==============
CREATE TABLE public.team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_team_activity_team_created ON public.team_activity(team_id, created_at DESC);
GRANT SELECT, INSERT ON public.team_activity TO authenticated;
GRANT ALL ON public.team_activity TO service_role;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

-- ============== RLS POLICIES ==============
-- teams
CREATE POLICY "members can view team" ON public.teams FOR SELECT TO authenticated
  USING (public.is_team_member(id, auth.uid()));
CREATE POLICY "authenticated can create team" ON public.teams FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "managers can update team" ON public.teams FOR UPDATE TO authenticated
  USING (public.can_manage_team(id, auth.uid())) WITH CHECK (public.can_manage_team(id, auth.uid()));
CREATE POLICY "owner can delete team" ON public.teams FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- team_members
CREATE POLICY "members can view team members" ON public.team_members FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "managers can manage members" ON public.team_members FOR ALL TO authenticated
  USING (public.can_manage_team(team_id, auth.uid()))
  WITH CHECK (public.can_manage_team(team_id, auth.uid()));

-- projects
CREATE POLICY "members view projects" ON public.team_projects FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "managers manage projects" ON public.team_projects FOR ALL TO authenticated
  USING (public.can_manage_team(team_id, auth.uid()))
  WITH CHECK (public.can_manage_team(team_id, auth.uid()));

-- assignments
CREATE POLICY "members view assignments" ON public.team_project_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_projects p WHERE p.id = project_id AND public.is_team_member(p.team_id, auth.uid())));
CREATE POLICY "managers manage assignments" ON public.team_project_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.team_projects p WHERE p.id = project_id AND public.can_manage_team(p.team_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.team_projects p WHERE p.id = project_id AND public.can_manage_team(p.team_id, auth.uid())));

-- glossary
CREATE POLICY "members view glossary" ON public.team_glossary FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "managers manage glossary" ON public.team_glossary FOR ALL TO authenticated
  USING (public.can_manage_team(team_id, auth.uid()))
  WITH CHECK (public.can_manage_team(team_id, auth.uid()));

-- chat
CREATE POLICY "members read chat" ON public.team_chat_messages FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "members post chat" ON public.team_chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "delete own chat or manage" ON public.team_chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_team(team_id, auth.uid()));

-- activity
CREATE POLICY "members view activity" ON public.team_activity FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "members log activity" ON public.team_activity FOR INSERT TO authenticated
  WITH CHECK (public.is_team_member(team_id, auth.uid()));

-- ============== updated_at triggers ==============
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_team_projects_updated_at BEFORE UPDATE ON public.team_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_team_glossary_updated_at BEFORE UPDATE ON public.team_glossary
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== RPCs ==============
-- Plan limits helper
CREATE OR REPLACE FUNCTION public._team_limits(_plan public.subscription_plan)
RETURNS TABLE (max_teams INT, max_members INT, max_projects INT)
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE _plan WHEN 'business' THEN 2147483647 WHEN 'pro' THEN 3 ELSE 1 END,
    CASE _plan WHEN 'business' THEN 2147483647 WHEN 'pro' THEN 10 ELSE 3 END,
    CASE _plan WHEN 'business' THEN 2147483647 WHEN 'pro' THEN 10 ELSE 2 END;
$$;

CREATE OR REPLACE FUNCTION public.create_team(_name TEXT, _emoji TEXT DEFAULT '👥', _description TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_plan public.subscription_plan;
  v_limits RECORD;
  v_owned_count INT;
  v_team_id UUID;
  v_slug TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF length(trim(_name)) < 2 OR length(trim(_name)) > 60 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_name');
  END IF;

  v_plan := COALESCE(public.get_active_plan(v_user), 'free'::public.subscription_plan);
  SELECT * INTO v_limits FROM public._team_limits(v_plan);

  SELECT COUNT(*) INTO v_owned_count FROM public.teams WHERE owner_id = v_user;
  IF v_owned_count >= v_limits.max_teams THEN
    RETURN jsonb_build_object('ok', false, 'error', 'team_limit_reached', 'limit', v_limits.max_teams, 'plan', v_plan);
  END IF;

  v_slug := lower(regexp_replace(trim(_name), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);

  INSERT INTO public.teams (name, slug, emoji, description, owner_id)
    VALUES (trim(_name), v_slug, COALESCE(NULLIF(_emoji, ''), '👥'), _description, v_user)
    RETURNING id INTO v_team_id;

  INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team_id, v_user, 'owner');

  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (v_team_id, v_user, 'team.created', jsonb_build_object('name', _name));

  RETURN jsonb_build_object('ok', true, 'team_id', v_team_id, 'slug', v_slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_team_by_code(_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_team public.teams%ROWTYPE;
  v_owner_plan public.subscription_plan;
  v_limits RECORD;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT * INTO v_team FROM public.teams WHERE invite_code = lower(trim(_code));
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_code'); END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = v_team.id AND user_id = v_user) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_member', 'team_id', v_team.id);
  END IF;

  -- Enforce member cap against the owner's plan
  v_owner_plan := COALESCE(public.get_active_plan(v_team.owner_id), 'free'::public.subscription_plan);
  SELECT * INTO v_limits FROM public._team_limits(v_owner_plan);
  IF v_team.member_count >= v_limits.max_members THEN
    RETURN jsonb_build_object('ok', false, 'error', 'team_full', 'limit', v_limits.max_members);
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role) VALUES (v_team.id, v_user, 'translator');
  UPDATE public.teams SET member_count = member_count + 1, updated_at = now() WHERE id = v_team.id;

  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (v_team.id, v_user, 'member.joined', '{}'::jsonb);

  RETURN jsonb_build_object('ok', true, 'team_id', v_team.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_team(_team_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_role public.team_role;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT role INTO v_role FROM public.team_members WHERE team_id = _team_id AND user_id = v_user;
  IF v_role IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_a_member'); END IF;
  IF v_role = 'owner' THEN RETURN jsonb_build_object('ok', false, 'error', 'owner_cannot_leave'); END IF;
  DELETE FROM public.team_members WHERE team_id = _team_id AND user_id = v_user;
  UPDATE public.teams SET member_count = GREATEST(1, member_count - 1), updated_at = now() WHERE id = _team_id;
  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (_team_id, v_user, 'member.left', '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_member_role(_team_id UUID, _user_id UUID, _role public.team_role)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_actor_role public.team_role;
BEGIN
  IF v_actor IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_actor_role := public.team_member_role(_team_id, v_actor);
  IF v_actor_role NOT IN ('owner','admin') THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF _role = 'owner' THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_assign_owner'); END IF;
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id AND role = 'owner') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_change_owner');
  END IF;
  UPDATE public.team_members SET role = _role WHERE team_id = _team_id AND user_id = _user_id;
  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (_team_id, v_actor, 'member.role_changed', jsonb_build_object('user_id', _user_id, 'role', _role));
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member(_team_id UUID, _user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_actor_role public.team_role;
BEGIN
  IF v_actor IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  v_actor_role := public.team_member_role(_team_id, v_actor);
  IF v_actor_role NOT IN ('owner','admin') THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id AND role = 'owner') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_remove_owner');
  END IF;
  DELETE FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id;
  UPDATE public.teams SET member_count = GREATEST(1, member_count - 1), updated_at = now() WHERE id = _team_id;
  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (_team_id, v_actor, 'member.removed', jsonb_build_object('user_id', _user_id));
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_team_invite_code(_team_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_new TEXT;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF NOT public.can_manage_team(_team_id, v_user) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  v_new := encode(gen_random_bytes(6), 'hex');
  UPDATE public.teams SET invite_code = v_new, updated_at = now() WHERE id = _team_id;
  RETURN jsonb_build_object('ok', true, 'invite_code', v_new);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_team_project(_team_id UUID, _name TEXT, _description TEXT DEFAULT NULL,
  _source_language TEXT DEFAULT 'en', _target_language TEXT DEFAULT 'es')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_owner_plan public.subscription_plan;
  v_limits RECORD;
  v_count INT;
  v_owner UUID;
  v_project_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  IF NOT public.can_manage_team(_team_id, v_user) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF length(trim(_name)) < 2 OR length(trim(_name)) > 80 THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_name'); END IF;

  SELECT owner_id INTO v_owner FROM public.teams WHERE id = _team_id;
  v_owner_plan := COALESCE(public.get_active_plan(v_owner), 'free'::public.subscription_plan);
  SELECT * INTO v_limits FROM public._team_limits(v_owner_plan);
  SELECT COUNT(*) INTO v_count FROM public.team_projects WHERE team_id = _team_id;
  IF v_count >= v_limits.max_projects THEN
    RETURN jsonb_build_object('ok', false, 'error', 'project_limit_reached', 'limit', v_limits.max_projects);
  END IF;

  INSERT INTO public.team_projects (team_id, name, description, source_language, target_language, created_by, status)
    VALUES (_team_id, trim(_name), _description, _source_language, _target_language, v_user, 'active')
    RETURNING id INTO v_project_id;

  UPDATE public.teams SET project_count = project_count + 1, updated_at = now() WHERE id = _team_id;
  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (_team_id, v_user, 'project.created', jsonb_build_object('project_id', v_project_id, 'name', _name));

  RETURN jsonb_build_object('ok', true, 'project_id', v_project_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_project_member(_project_id UUID, _user_id UUID, _role public.team_assignment_role)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_team_id UUID;
BEGIN
  IF v_actor IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated'); END IF;
  SELECT team_id INTO v_team_id FROM public.team_projects WHERE id = _project_id;
  IF v_team_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'project_not_found'); END IF;
  IF NOT public.can_manage_team(v_team_id, v_actor) THEN RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
  IF NOT public.is_team_member(v_team_id, _user_id) THEN RETURN jsonb_build_object('ok', false, 'error', 'user_not_in_team'); END IF;

  INSERT INTO public.team_project_assignments (project_id, user_id, assignment_role)
    VALUES (_project_id, _user_id, _role)
    ON CONFLICT DO NOTHING;

  INSERT INTO public.team_activity (team_id, user_id, event_type, payload)
    VALUES (v_team_id, v_actor, 'project.assigned', jsonb_build_object('project_id', _project_id, 'user_id', _user_id, 'role', _role));

  RETURN jsonb_build_object('ok', true);
END;
$$;
