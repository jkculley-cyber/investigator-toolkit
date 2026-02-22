-- Migration 038: Fix waypoint_admin profile RLS
-- The existing "Users can view profiles in their district" policy uses
-- district_id = user_district_id(). For waypoint_admin (district_id = NULL),
-- NULL = NULL evaluates to NULL (falsy), blocking their own profile fetch.
-- This policy adds a fallback: any user can always read their own profile row.

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());
