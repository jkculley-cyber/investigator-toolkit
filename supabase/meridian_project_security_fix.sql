-- ============================================================
-- Meridian Standalone Project — Security Lint Fix
-- Project: zipynunpwumtkwkgnwqs
-- Apply at: https://supabase.com/dashboard/project/zipynunpwumtkwkgnwqs/sql/new
--
-- Fixes:
--   1. SECURITY DEFINER views → security_invoker = on
--   2. RLS not enabled on 9 tables → ENABLE + district-scoped policies
--
-- Each statement is wrapped in its own DO block so one failure
-- does NOT roll back the rest (SQL Editor single-transaction gotcha).
-- ============================================================


-- ─── 0. Helper: user_district_id() ───────────────────────────────────────────
-- Looks up the calling user's district from the staff table.
-- SECURITY DEFINER so it can bypass staff's own RLS policy.
-- Adjust "staff" → "profiles" or "users" if your users table name differs.

DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.user_district_id()
  RETURNS UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $fn$
    SELECT district_id FROM public.staff WHERE id = auth.uid()
  $fn$;
  RAISE NOTICE 'OK: user_district_id() created/replaced';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP user_district_id: % %', SQLERRM, SQLSTATE;
END $$;


-- ─── 1. Fix Security Definer Views ───────────────────────────────────────────
-- Changes views to run as the QUERYING user, so RLS on underlying
-- tables is enforced rather than being bypassed by the view owner.

DO $$ BEGIN
  ALTER VIEW public.student_folder_readiness SET (security_invoker = on);
  RAISE NOTICE 'OK: student_folder_readiness → security_invoker = on';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP student_folder_readiness: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER VIEW public.compliance_deadlines SET (security_invoker = on);
  RAISE NOTICE 'OK: compliance_deadlines → security_invoker = on';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP compliance_deadlines: % %', SQLERRM, SQLSTATE;
END $$;


-- ─── 2. Enable RLS on all flagged tables ─────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: districts RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP districts: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: campuses RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP campuses: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: staff RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP staff: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.iep_progress_reports ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: iep_progress_reports RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP iep_progress_reports: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.plan_504_progress_reports ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: plan_504_progress_reports RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP plan_504_progress_reports: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.cap_findings ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: cap_findings RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP cap_findings: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.cap_tasks ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: cap_tasks RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP cap_tasks: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.integration_sources ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: integration_sources RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP integration_sources: % %', SQLERRM, SQLSTATE;
END $$;

DO $$ BEGIN
  ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'OK: import_logs RLS enabled';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SKIP import_logs: % %', SQLERRM, SQLSTATE;
END $$;


-- ─── 3. Drop existing policies (idempotent) ──────────────────────────────────

DROP POLICY IF EXISTS "districts_own"              ON public.districts;
DROP POLICY IF EXISTS "campuses_district"          ON public.campuses;
DROP POLICY IF EXISTS "staff_district"             ON public.staff;
DROP POLICY IF EXISTS "iep_progress_district"      ON public.iep_progress_reports;
DROP POLICY IF EXISTS "plan_504_progress_district" ON public.plan_504_progress_reports;
DROP POLICY IF EXISTS "cap_findings_district"      ON public.cap_findings;
DROP POLICY IF EXISTS "cap_tasks_district"         ON public.cap_tasks;
DROP POLICY IF EXISTS "integration_sources_district" ON public.integration_sources;
DROP POLICY IF EXISTS "import_logs_district"       ON public.import_logs;


-- ─── 4. District-scoped RLS policies ─────────────────────────────────────────
-- Each authenticated user sees only rows belonging to their district.
-- "districts" policy: user sees only their own district row (id = their district_id).

CREATE POLICY "districts_own"
  ON public.districts FOR ALL
  USING (id = public.user_district_id());

-- campuses: district_id must match user's district
CREATE POLICY "campuses_district"
  ON public.campuses FOR ALL
  USING (district_id = public.user_district_id());

-- staff: all staff in the same district can see each other
-- SECURITY DEFINER helper bypasses this policy to avoid chicken-and-egg
CREATE POLICY "staff_district"
  ON public.staff FOR ALL
  USING (district_id = public.user_district_id());

-- iep_progress_reports: district-scoped
CREATE POLICY "iep_progress_district"
  ON public.iep_progress_reports FOR ALL
  USING (district_id = public.user_district_id());

-- plan_504_progress_reports: district-scoped
CREATE POLICY "plan_504_progress_district"
  ON public.plan_504_progress_reports FOR ALL
  USING (district_id = public.user_district_id());

-- cap_findings: district-scoped
CREATE POLICY "cap_findings_district"
  ON public.cap_findings FOR ALL
  USING (district_id = public.user_district_id());

-- cap_tasks: district-scoped
CREATE POLICY "cap_tasks_district"
  ON public.cap_tasks FOR ALL
  USING (district_id = public.user_district_id());

-- integration_sources: district-scoped
CREATE POLICY "integration_sources_district"
  ON public.integration_sources FOR ALL
  USING (district_id = public.user_district_id());

-- import_logs: district-scoped
CREATE POLICY "import_logs_district"
  ON public.import_logs FOR ALL
  USING (district_id = public.user_district_id());


-- ─── 5. Verify ───────────────────────────────────────────────────────────────
-- Run this SELECT after applying to confirm all tables now have RLS.

SELECT
  t.table_name,
  pg_class.relrowsecurity AS rls_enabled
FROM information_schema.tables t
JOIN pg_class ON pg_class.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'districts','campuses','staff',
    'iep_progress_reports','plan_504_progress_reports',
    'cap_findings','cap_tasks',
    'integration_sources','import_logs'
  )
ORDER BY t.table_name;
