-- Migration 048: Add 'missed' to orientation_status check constraint
-- The app auto-marks overdue orientations as 'missed' but the original
-- constraint only allowed ('pending','scheduled','completed').
-- This was silently blocking the update in useOrientationSchedule.

ALTER TABLE public.daep_placement_scheduling
  DROP CONSTRAINT IF EXISTS daep_placement_scheduling_orientation_status_check;

ALTER TABLE public.daep_placement_scheduling
  ADD CONSTRAINT daep_placement_scheduling_orientation_status_check
  CHECK (orientation_status IN ('pending', 'scheduled', 'completed', 'missed'));
