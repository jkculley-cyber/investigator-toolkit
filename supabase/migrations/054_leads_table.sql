-- Migration 054: leads table for prospect tracking
--
-- Stores every email capture from clearpathedgroup.com:
--   - Sandbox explore modal
--   - Demo request form
--   - Pilot application form
--   - Chat widget

CREATE TABLE IF NOT EXISTS leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT NOT NULL,
  source      TEXT NOT NULL,  -- 'sandbox_explore' | 'demo_request' | 'pilot_application' | 'chat_widget'
  district    TEXT,           -- optional: district name if provided in demo form
  concern     TEXT,           -- optional: biggest challenge selected in demo form
  notes       TEXT,           -- any extra context
  status      TEXT NOT NULL DEFAULT 'new',  -- 'new' | 'contacted' | 'demo_scheduled' | 'closed'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- waypoint_admin only — no district RLS needed (leads are company-wide)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waypoint_admin_full_access" ON leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'waypoint_admin'
    )
  );

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION fn_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION fn_leads_updated_at();
