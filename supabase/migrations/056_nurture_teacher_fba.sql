-- Migration 056: Nurture sequence, teacher observations, FBA/BIP notes
-- Applied: 2026-03-10

-- 1. leads: nurture stage tracking (0=new, 1=day3_sent, 2=day7_sent, 3=complete)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nurture_stage SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nurture_sent_at TIMESTAMPTZ;

-- 2. reentry_checklists: teacher observations field
ALTER TABLE reentry_checklists
  ADD COLUMN IF NOT EXISTS teacher_observations TEXT;

-- 3. compliance_checklists: FBA and BIP documentation notes
ALTER TABLE compliance_checklists
  ADD COLUMN IF NOT EXISTS fba_notes TEXT,
  ADD COLUMN IF NOT EXISTS bip_notes TEXT;

-- 4. pg_cron: daily nurture check at 14:00 UTC (9am CT)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'daily-nurture-check';
SELECT cron.schedule(
  'daily-nurture-check',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  )
  $$
);
