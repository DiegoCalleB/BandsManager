-- ====================================================================
-- MIGRATION: 20260919_strict_rls_band_isolation.sql
-- Strict Multi-Tenant Row Level Security (RLS) Policies by band_id
-- ====================================================================

-- 0. Helper functions for RLS multi-tenant evaluation

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    coalesce((auth.jwt() ->> 'role'), '') = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_active_band_id()
RETURNS TEXT AS $$
BEGIN
  RETURN coalesce(
    nullif(current_setting('app.current_band_id', true), ''),
    nullif(auth.jwt() ->> 'band_id', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'band_id', ''),
    nullif(auth.jwt() -> 'app_metadata' ->> 'band_id', '')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_authorized_band_ids()
RETURNS TABLE(band_id TEXT) AS $$
BEGIN
  -- If service role, return all bands
  IF public.is_service_role() THEN
    RETURN QUERY SELECT rb.band_id FROM public.registered_bands rb;
    RETURN;
  END IF;

  -- If active band is present in session context, include it
  IF public.get_active_band_id() IS NOT NULL THEN
    RETURN QUERY SELECT public.get_active_band_id();
  END IF;

  -- Include all permitted bands for the authenticated user from user_bands and users
  IF auth.uid() IS NOT NULL THEN
    RETURN QUERY
      SELECT ub.band_id FROM public.user_bands ub WHERE ub.user_id = auth.uid()::text
      UNION
      SELECT u.band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.band_id IS NOT NULL AND u.band_id != ''
      UNION
      SELECT u.main_band_id FROM public.users u WHERE u.id = auth.uid()::text AND u.main_band_id IS NOT NULL AND u.main_band_id != '';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 1. CALENDAR TABLES (Concerts & Rehearsals)
-- Rule: Users can view (SELECT) events for ALL of their permitted bands
-- (even inactive ones they belong to), but can NEVER view events for
-- other bands. Modifications (INSERT/UPDATE/DELETE) require active band scoping.
-- ====================================================================

-- 1.1 Concerts
ALTER TABLE public.concerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.concerts;
DROP POLICY IF EXISTS "concerts_select_policy" ON public.concerts;
DROP POLICY IF EXISTS "concerts_insert_policy" ON public.concerts;
DROP POLICY IF EXISTS "concerts_update_policy" ON public.concerts;
DROP POLICY IF EXISTS "concerts_delete_policy" ON public.concerts;

CREATE POLICY "concerts_select_policy" ON public.concerts
  FOR SELECT USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  );

CREATE POLICY "concerts_insert_policy" ON public.concerts
  FOR INSERT WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

CREATE POLICY "concerts_update_policy" ON public.concerts
  FOR UPDATE USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

CREATE POLICY "concerts_delete_policy" ON public.concerts
  FOR DELETE USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 1.2 Rehearsals
ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_select_policy" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_insert_policy" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_update_policy" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_delete_policy" ON public.rehearsals;

CREATE POLICY "rehearsals_select_policy" ON public.rehearsals
  FOR SELECT USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  );

CREATE POLICY "rehearsals_insert_policy" ON public.rehearsals
  FOR INSERT WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

CREATE POLICY "rehearsals_update_policy" ON public.rehearsals
  FOR UPDATE USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

CREATE POLICY "rehearsals_delete_policy" ON public.rehearsals
  FOR DELETE USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- ====================================================================
-- 2. TENANT-SCOPED TABLES (Strict active band / authorized band isolation)
-- ====================================================================

-- 2.1 Leads & Messages
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.leads;
DROP POLICY IF EXISTS "leads_isolation_policy" ON public.leads;
CREATE POLICY "leads_isolation_policy" ON public.leads
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.lead_messages;
DROP POLICY IF EXISTS "lead_messages_isolation_policy" ON public.lead_messages;
CREATE POLICY "lead_messages_isolation_policy" ON public.lead_messages
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 2.2 Contacts & Repertoire
ALTER TABLE public.band_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_contacts;
DROP POLICY IF EXISTS "band_contacts_isolation_policy" ON public.band_contacts;
CREATE POLICY "band_contacts_isolation_policy" ON public.band_contacts
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.songs;
DROP POLICY IF EXISTS "songs_isolation_policy" ON public.songs;
CREATE POLICY "songs_isolation_policy" ON public.songs
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.setlists;
DROP POLICY IF EXISTS "setlists_isolation_policy" ON public.setlists;
CREATE POLICY "setlists_isolation_policy" ON public.setlists
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.setlist_shortcuts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.setlist_shortcuts;
DROP POLICY IF EXISTS "setlist_shortcuts_isolation_policy" ON public.setlist_shortcuts;
CREATE POLICY "setlist_shortcuts_isolation_policy" ON public.setlist_shortcuts
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 2.3 Tours & Production
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.tours;
DROP POLICY IF EXISTS "tours_isolation_policy" ON public.tours;
CREATE POLICY "tours_isolation_policy" ON public.tours
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.run_of_show ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.run_of_show;
DROP POLICY IF EXISTS "run_of_show_isolation_policy" ON public.run_of_show;
CREATE POLICY "run_of_show_isolation_policy" ON public.run_of_show
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.gear_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.gear_checklists;
DROP POLICY IF EXISTS "gear_checklists_isolation_policy" ON public.gear_checklists;
CREATE POLICY "gear_checklists_isolation_policy" ON public.gear_checklists
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 2.4 Fans, Finances & Social
ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.fans;
DROP POLICY IF EXISTS "fans_isolation_policy" ON public.fans;
CREATE POLICY "fans_isolation_policy" ON public.fans
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.payments;
DROP POLICY IF EXISTS "payments_isolation_policy" ON public.payments;
CREATE POLICY "payments_isolation_policy" ON public.payments
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.social_posts;
DROP POLICY IF EXISTS "social_posts_isolation_policy" ON public.social_posts;
CREATE POLICY "social_posts_isolation_policy" ON public.social_posts
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.social_metrics;
DROP POLICY IF EXISTS "social_metrics_isolation_policy" ON public.social_metrics;
CREATE POLICY "social_metrics_isolation_policy" ON public.social_metrics
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 2.5 Configs & AI Agent Data
ALTER TABLE public.epk_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.epk_configs;
DROP POLICY IF EXISTS "epk_configs_isolation_policy" ON public.epk_configs;
CREATE POLICY "epk_configs_isolation_policy" ON public.epk_configs
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.autonomy_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.autonomy_configs;
DROP POLICY IF EXISTS "autonomy_configs_isolation_policy" ON public.autonomy_configs;
CREATE POLICY "autonomy_configs_isolation_policy" ON public.autonomy_configs
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.band_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.band_campaigns;
DROP POLICY IF EXISTS "band_campaigns_isolation_policy" ON public.band_campaigns;
CREATE POLICY "band_campaigns_isolation_policy" ON public.band_campaigns
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.category_pitch_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.category_pitch_templates;
DROP POLICY IF EXISTS "category_pitch_templates_isolation_policy" ON public.category_pitch_templates;
CREATE POLICY "category_pitch_templates_isolation_policy" ON public.category_pitch_templates
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.pitch_learning_examples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.pitch_learning_examples;
DROP POLICY IF EXISTS "pitch_learning_examples_isolation_policy" ON public.pitch_learning_examples;
CREATE POLICY "pitch_learning_examples_isolation_policy" ON public.pitch_learning_examples
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.pitch_example_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.pitch_example_threads;
DROP POLICY IF EXISTS "pitch_example_threads_isolation_policy" ON public.pitch_example_threads;
CREATE POLICY "pitch_example_threads_isolation_policy" ON public.pitch_example_threads
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.agent_execution_logs;
DROP POLICY IF EXISTS "agent_execution_logs_isolation_policy" ON public.agent_execution_logs;
CREATE POLICY "agent_execution_logs_isolation_policy" ON public.agent_execution_logs
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

ALTER TABLE public.ai_token_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.ai_token_ledger;
DROP POLICY IF EXISTS "ai_token_ledger_isolation_policy" ON public.ai_token_ledger;
CREATE POLICY "ai_token_ledger_isolation_policy" ON public.ai_token_ledger
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    (public.get_active_band_id() IS NULL AND band_id IN (SELECT public.get_user_authorized_band_ids()))
  );

-- 2.6 Core Account & Band Membership Tables
ALTER TABLE public.registered_bands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.registered_bands;
DROP POLICY IF EXISTS "registered_bands_select_policy" ON public.registered_bands;
DROP POLICY IF EXISTS "registered_bands_modify_policy" ON public.registered_bands;

CREATE POLICY "registered_bands_select_policy" ON public.registered_bands
  FOR SELECT USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids()) OR
    user_id = auth.uid()::text
  );

CREATE POLICY "registered_bands_modify_policy" ON public.registered_bands
  FOR ALL USING (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    user_id = auth.uid()::text
  ) WITH CHECK (
    public.is_service_role() OR
    band_id = public.get_active_band_id() OR
    user_id = auth.uid()::text
  );

ALTER TABLE public.user_bands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.user_bands;
DROP POLICY IF EXISTS "user_bands_isolation_policy" ON public.user_bands;
CREATE POLICY "user_bands_isolation_policy" ON public.user_bands
  FOR ALL USING (
    public.is_service_role() OR
    user_id = auth.uid()::text OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  ) WITH CHECK (
    public.is_service_role() OR
    user_id = auth.uid()::text
  );

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON public.users;
DROP POLICY IF EXISTS "users_isolation_policy" ON public.users;
CREATE POLICY "users_isolation_policy" ON public.users
  FOR ALL USING (
    public.is_service_role() OR
    id = auth.uid()::text OR
    band_id = public.get_active_band_id() OR
    band_id IN (SELECT public.get_user_authorized_band_ids())
  ) WITH CHECK (
    public.is_service_role() OR
    id = auth.uid()::text
  );
