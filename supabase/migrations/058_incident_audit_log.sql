-- Migration 058: Incident audit log
-- Tracks who did what and when on each incident (approve, deny, activate, complete, etc.)

CREATE TABLE IF NOT EXISTS incident_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id   UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  incident_id   UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,  -- 'created','approved','denied','activated','completed','returned','compliance_cleared','updated'
  notes         TEXT,           -- reason (denial), justification (early complete), field label, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_incident ON incident_audit_log(incident_id);
CREATE INDEX idx_audit_district  ON incident_audit_log(district_id);
CREATE INDEX idx_audit_created   ON incident_audit_log(created_at DESC);

ALTER TABLE incident_audit_log ENABLE ROW LEVEL SECURITY;

-- Staff can read audit logs for their district
CREATE POLICY "audit_select_district" ON incident_audit_log
  FOR SELECT USING (
    district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
  );

-- Staff can insert audit entries for their district
CREATE POLICY "audit_insert_district" ON incident_audit_log
  FOR INSERT WITH CHECK (
    district_id = (SELECT district_id FROM profiles WHERE id = auth.uid())
  );
