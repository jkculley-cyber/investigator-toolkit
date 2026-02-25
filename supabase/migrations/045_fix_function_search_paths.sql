-- Migration 045: Fix functions with mutable search_path
-- Supabase Security Advisor flags ALL functions (not just SECURITY DEFINER)
-- where search_path is not pinned — a search_path injection attack vector.
-- Uses DO blocks so each ALTER is independent; one failure won't roll back others.
--
-- Already correct (SET search_path = public built-in):
--   migrations 020, 026, 032, 033, 037, 039 functions
-- Applied separately (ran as 2-line fix after error recovery):
--   process_approval_step(UUID, TEXT, TEXT), resubmit_approval_chain(UUID)

-- ── Migration 002: RLS helper functions ──────────────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.user_district_id() SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped user_district_id: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.user_role()        SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped user_role: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.user_campus_ids()  SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped user_campus_ids: %', SQLERRM; END $$;

-- ── Migration 003: Trigger functions ─────────────────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.update_updated_at()           SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped update_updated_at: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.handle_new_user()             SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped handle_new_user: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.check_sped_compliance()       SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped check_sped_compliance: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.check_compliance_completion() SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped check_compliance_completion: %', SQLERRM; END $$;

-- ── Migration 006: Offense code sync trigger ──────────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.sync_offense_code_name()      SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped sync_offense_code_name: %', SQLERRM; END $$;

-- ── Migration 015: check_repeat_offender (overrides 003) ─────────────────────
DO $$ BEGIN ALTER FUNCTION public.check_repeat_offender()       SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped check_repeat_offender: %', SQLERRM; END $$;

-- ── Migration 016: DAEP approval + scheduling triggers ───────────────────────
DO $$ BEGIN ALTER FUNCTION public.fn_create_daep_approval_chain() SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped fn_create_daep_approval_chain: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.fn_create_daep_scheduling()     SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped fn_create_daep_scheduling: %', SQLERRM; END $$;

-- ── Migration 029: Approval chain RPCs ───────────────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.process_approval_step(UUID, TEXT, TEXT) SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped process_approval_step: %', SQLERRM; END $$;
DO $$ BEGIN ALTER FUNCTION public.resubmit_approval_chain(UUID)            SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped resubmit_approval_chain: %', SQLERRM; END $$;

-- ── Migration 034: Student guardians trigger ──────────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.update_student_guardians_updated_at()        SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped update_student_guardians_updated_at: %', SQLERRM; END $$;

-- ── Migration 041: Navigator campus goals trigger ─────────────────────────────
DO $$ BEGIN ALTER FUNCTION public.update_navigator_campus_goals_updated_at()   SET search_path = public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped update_navigator_campus_goals_updated_at: %', SQLERRM; END $$;
