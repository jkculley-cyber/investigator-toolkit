-- Migration 057: Navigator performance indexes
-- Adds indexes on high-frequency filter/join columns for navigator tables

-- navigator_referrals
CREATE INDEX IF NOT EXISTS idx_nav_referrals_district_student
  ON navigator_referrals (district_id, student_id);

CREATE INDEX IF NOT EXISTS idx_nav_referrals_district_campus
  ON navigator_referrals (district_id, campus_id);

CREATE INDEX IF NOT EXISTS idx_nav_referrals_district_date
  ON navigator_referrals (district_id, referral_date DESC);

CREATE INDEX IF NOT EXISTS idx_nav_referrals_district_status
  ON navigator_referrals (district_id, status);

-- navigator_placements
CREATE INDEX IF NOT EXISTS idx_nav_placements_district_student
  ON navigator_placements (district_id, student_id);

CREATE INDEX IF NOT EXISTS idx_nav_placements_district_campus
  ON navigator_placements (district_id, campus_id);

CREATE INDEX IF NOT EXISTS idx_nav_placements_district_type
  ON navigator_placements (district_id, placement_type);

CREATE INDEX IF NOT EXISTS idx_nav_placements_end_date
  ON navigator_placements (district_id, end_date)
  WHERE end_date IS NULL;

-- navigator_supports
CREATE INDEX IF NOT EXISTS idx_nav_supports_district_student
  ON navigator_supports (district_id, student_id);

CREATE INDEX IF NOT EXISTS idx_nav_supports_district_status
  ON navigator_supports (district_id, status);
