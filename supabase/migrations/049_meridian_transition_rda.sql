-- Migration 049: Meridian Secondary Transition (SPPI-13) + RDA Indicators
-- Apply via Supabase SQL Editor: https://supabase.com/dashboard/project/kvxecksvkimcgwhxxyhw/sql/new

-- ── Table 1: meridian_secondary_transitions ──────────────────────────────────
-- One row per student per school year; tracks all 5 SPPI-13 required IEP elements.

CREATE TABLE IF NOT EXISTS meridian_secondary_transitions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id                 UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  student_id                  UUID NOT NULL REFERENCES meridian_students(id) ON DELETE CASCADE,
  iep_id                      UUID REFERENCES meridian_ieps(id) ON DELETE SET NULL,
  school_year                 TEXT NOT NULL,  -- e.g. '2025-26'

  -- Element 1: Measurable postsecondary goals
  has_postsecondary_goals     BOOLEAN DEFAULT FALSE,
  postsecondary_goals_date    DATE,
  education_goal              TEXT,
  employment_goal             TEXT,
  independent_living_goal     TEXT,

  -- Element 2: Age-appropriate transition assessments
  has_transition_assessments  BOOLEAN DEFAULT FALSE,
  transition_assessments_date DATE,
  assessment_types            TEXT,

  -- Element 3: Transition services in IEP
  has_transition_services     BOOLEAN DEFAULT FALSE,
  transition_services_date    DATE,

  -- Element 4: Student participated in ARD
  student_participated        BOOLEAN DEFAULT FALSE,
  student_participation_date  DATE,

  -- Element 5: Outside agency involvement
  agency_invited              BOOLEAN DEFAULT FALSE,
  agency_participated         BOOLEAN DEFAULT FALSE,
  agency_name                 TEXT,
  agency_invitation_date      DATE,

  notes                       TEXT,
  updated_by                  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (district_id, student_id, school_year)
);

ALTER TABLE meridian_secondary_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation" ON meridian_secondary_transitions
  USING (district_id = user_district_id() OR is_waypoint_admin());

-- ── Table 2: meridian_rda_determination ──────────────────────────────────────
-- One row per district per school year — DL determination level + SSP tracking.

CREATE TABLE IF NOT EXISTS meridian_rda_determination (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id           UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  school_year           TEXT NOT NULL,
  determination_level   TEXT NOT NULL CHECK (determination_level IN ('dl1','dl2','dl3','dl4')),
  determination_date    DATE,
  ssp_due_date          DATE,
  ssp_submitted_date    DATE,
  next_checkin_date     DATE,
  checkin_cadence_days  INT,
  notes                 TEXT,
  updated_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (district_id, school_year)
);

ALTER TABLE meridian_rda_determination ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation" ON meridian_rda_determination
  USING (district_id = user_district_id() OR is_waypoint_admin());

-- ── Table 3: meridian_rda_indicators ─────────────────────────────────────────
-- One row per SPPI indicator per district per school year.

CREATE TABLE IF NOT EXISTS meridian_rda_indicators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id     UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  school_year     TEXT NOT NULL,
  sppi_number     TEXT NOT NULL,
  district_pct    NUMERIC(6,2),
  state_target    NUMERIC(6,2),
  status          TEXT CHECK (status IN ('meets','approaching','not_meets')),
  data_source     TEXT DEFAULT 'manual',
  notes           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (district_id, school_year, sppi_number)
);

ALTER TABLE meridian_rda_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "district_isolation" ON meridian_rda_indicators
  USING (district_id = user_district_id() OR is_waypoint_admin());
