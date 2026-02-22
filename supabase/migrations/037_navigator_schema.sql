-- Migration 037: Navigator module — ISS/OSS tracker + proactive supports
-- Adds navigator_referrals, navigator_placements, navigator_supports tables
-- Updates provision_new_district to accept products array

-- ─── Update provision_new_district to accept p_products ───────────────────────

DROP FUNCTION IF EXISTS provision_new_district(TEXT,TEXT,TEXT,TEXT);

CREATE FUNCTION provision_new_district(
  p_name     TEXT,
  p_tea_id   TEXT,
  p_state    TEXT,
  p_tier     TEXT,
  p_products TEXT[] DEFAULT ARRAY['waypoint']
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT is_waypoint_admin() THEN
    RAISE EXCEPTION 'Access denied: waypoint_admin role required';
  END IF;

  INSERT INTO districts(name, tea_district_id, state, settings)
  VALUES (
    p_name,
    p_tea_id,
    p_state,
    jsonb_build_object(
      'subscription_tier', p_tier,
      'products', to_jsonb(p_products)
    )
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION provision_new_district(TEXT,TEXT,TEXT,TEXT,TEXT[]) TO authenticated;

-- ─── navigator_referrals ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS navigator_referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id      UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  campus_id        UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reported_by      UUID NOT NULL REFERENCES profiles(id),
  offense_code_id  UUID REFERENCES offense_codes(id),
  referral_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  location         TEXT,
  description      TEXT,
  witnesses        TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','reviewed','closed','escalated_to_daep')),
  reviewed_by      UUID REFERENCES profiles(id),
  reviewed_at      TIMESTAMPTZ,
  outcome          TEXT CHECK (outcome IN (
                     'iss','oss','conference','support_assigned','no_action','escalated_to_daep'
                   )),
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE navigator_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation_referrals" ON navigator_referrals
  FOR ALL
  USING (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()));

-- ─── navigator_placements ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS navigator_placements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id           UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  campus_id             UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referral_id           UUID REFERENCES navigator_referrals(id) ON DELETE SET NULL,
  placement_type        TEXT NOT NULL CHECK (placement_type IN ('iss','oss')),
  start_date            DATE NOT NULL,
  end_date              DATE,
  days                  INTEGER,
  assigned_by           UUID NOT NULL REFERENCES profiles(id),
  location              TEXT,
  reason                TEXT,
  reentry_plan          TEXT,
  parent_notified       BOOLEAN NOT NULL DEFAULT false,
  parent_notified_at    TIMESTAMPTZ,
  parent_notified_by    UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE navigator_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation_placements" ON navigator_placements
  FOR ALL
  USING (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()));

-- ─── navigator_supports ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS navigator_supports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id    UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  campus_id      UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  support_type   TEXT NOT NULL CHECK (support_type IN (
                   'cico','behavior_contract','counseling_referral',
                   'parent_contact','mentoring','other'
                 )),
  assigned_by    UUID NOT NULL REFERENCES profiles(id),
  assigned_to    UUID REFERENCES profiles(id),
  start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date       DATE,
  status         TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','completed','discontinued')),
  contact_method TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE navigator_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation_supports" ON navigator_supports
  FOR ALL
  USING (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (district_id = (SELECT district_id FROM profiles WHERE id = auth.uid()));
