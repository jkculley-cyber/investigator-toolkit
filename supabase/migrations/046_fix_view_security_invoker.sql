-- Migration 046: Fix SECURITY DEFINER views in Meridian schema
-- Supabase Security Advisor flags views that run as the view creator (default
-- PostgreSQL behavior), because they bypass RLS on the underlying tables.
-- Setting security_invoker = on makes the view evaluate RLS as the querying
-- user, so district isolation is enforced through the existing RLS policies.
--
-- Requires PostgreSQL 15+ (Supabase Cloud is on PG 15+).

ALTER VIEW public.meridian_student_folder_readiness SET (security_invoker = on);
ALTER VIEW public.meridian_compliance_deadlines     SET (security_invoker = on);
