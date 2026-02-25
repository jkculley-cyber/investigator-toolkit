-- Migration 044: Origins schema
-- Family-facing skill-building platform for middle/high school students

-- ── Scenario library ──────────────────────────────────────────────────────────
CREATE TABLE origins_scenarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id  UUID REFERENCES districts(id),  -- NULL = global (Waypoint-provided)
  title        TEXT NOT NULL,
  description  TEXT,
  skill_pathway TEXT NOT NULL CHECK (skill_pathway IN (
    'emotional_regulation','conflict_deescalation','peer_pressure',
    'rebuilding','adult_communication'
  )),
  grade_band   TEXT CHECK (grade_band IN ('middle','high','both')),
  content      JSONB NOT NULL DEFAULT '{}',  -- { prompt, options: [{text, outcome, score}] }
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_origins_scenarios_district ON origins_scenarios(district_id);
CREATE INDEX idx_origins_scenarios_pathway  ON origins_scenarios(skill_pathway);

-- ── Student enrollment ────────────────────────────────────────────────────────
CREATE TABLE origins_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id),
  student_id  UUID NOT NULL REFERENCES students(id),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID REFERENCES profiles(id),
  UNIQUE (district_id, student_id)
);

CREATE INDEX idx_origins_enrollments_district ON origins_enrollments(district_id);
CREATE INDEX idx_origins_enrollments_student  ON origins_enrollments(student_id);

-- ── Response Moment sessions ──────────────────────────────────────────────────
CREATE TABLE origins_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id  UUID NOT NULL REFERENCES districts(id),
  student_id   UUID NOT NULL REFERENCES students(id),
  scenario_id  UUID NOT NULL REFERENCES origins_scenarios(id),
  assigned_by  UUID REFERENCES profiles(id),
  assigned_at  TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  responses    JSONB,        -- student's chosen responses
  score        INTEGER,      -- 0–100
  skill_pathway TEXT NOT NULL,
  status       TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed'))
);

CREATE INDEX idx_origins_sessions_district ON origins_sessions(district_id);
CREATE INDEX idx_origins_sessions_student  ON origins_sessions(student_id);
CREATE INDEX idx_origins_sessions_pathway  ON origins_sessions(skill_pathway);

-- ── Replay Tool sessions ──────────────────────────────────────────────────────
CREATE TABLE origins_replay_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id  UUID NOT NULL REFERENCES districts(id),
  student_id   UUID NOT NULL REFERENCES students(id),
  incident_id  UUID REFERENCES incidents(id),  -- optional Waypoint link
  assigned_by  UUID REFERENCES profiles(id),
  assigned_at  TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  reflection   JSONB,  -- structured guided reflection responses
  status       TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed'))
);

CREATE INDEX idx_origins_replay_district ON origins_replay_sessions(district_id);
CREATE INDEX idx_origins_replay_student  ON origins_replay_sessions(student_id);

-- ── Family Workspace activities ───────────────────────────────────────────────
CREATE TABLE origins_family_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id   UUID NOT NULL REFERENCES districts(id),
  student_id    UUID NOT NULL REFERENCES students(id),
  assigned_by   UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('conversation_starter','micro_activity','check_in')),
  content       JSONB NOT NULL DEFAULT '{}',
  completed_at  TIMESTAMPTZ,
  completed_by  UUID REFERENCES profiles(id),  -- parent or student
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_origins_family_district ON origins_family_activities(district_id);
CREATE INDEX idx_origins_family_student  ON origins_family_activities(student_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE origins_scenarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins_enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins_sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins_replay_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins_family_activities  ENABLE ROW LEVEL SECURITY;

-- origins_scenarios: global scenarios (district_id IS NULL) visible to all staff;
-- district-scoped scenarios visible to that district + waypoint_admin
-- Uses user_district_id() and is_waypoint_admin() helpers from migration 002/026
CREATE POLICY "origins_scenarios_read" ON origins_scenarios
  FOR SELECT TO authenticated
  USING (
    district_id IS NULL
    OR district_id = public.user_district_id()
    OR public.is_waypoint_admin()
  );

CREATE POLICY "origins_scenarios_write" ON origins_scenarios
  FOR ALL TO authenticated
  USING (
    district_id = public.user_district_id()
    OR public.is_waypoint_admin()
  );

-- origins_enrollments
CREATE POLICY "origins_enrollments_read" ON origins_enrollments
  FOR SELECT TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

CREATE POLICY "origins_enrollments_write" ON origins_enrollments
  FOR ALL TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

-- origins_sessions
CREATE POLICY "origins_sessions_read" ON origins_sessions
  FOR SELECT TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

CREATE POLICY "origins_sessions_write" ON origins_sessions
  FOR ALL TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

-- origins_replay_sessions
CREATE POLICY "origins_replay_read" ON origins_replay_sessions
  FOR SELECT TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

CREATE POLICY "origins_replay_write" ON origins_replay_sessions
  FOR ALL TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

-- origins_family_activities
CREATE POLICY "origins_family_read" ON origins_family_activities
  FOR SELECT TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());

CREATE POLICY "origins_family_write" ON origins_family_activities
  FOR ALL TO authenticated
  USING (district_id = public.user_district_id() OR public.is_waypoint_admin());
