# Session BE Handover
**Date:** 2026-03-28
**Agent:** Archer (CTO)
**Focus:** Apex IB Leadership Hub build, Waypoint final audit, email DNS, Beacon pages

---

## What Was Done

### Apex IB — Complete IB Leadership Hub Built
- IB Practices as primary framework (was overlay only)
- All 12 rubric descriptors + real PSP 2020 codes (0101-01 through 0404-02)
- 10 IB Learner Profile attributes with observation checkboxes + frequency tracking
- Programme-specific component filtering (PYP/MYP/DP/CP priorities)
- AI scores IB correctly on server (frameworks.ts + morning brief updated)
- IB alignment in PDF/CSV export, dashboard badges, teacher detail page

**IB Leadership Hub (12 pages):**
1. IB Dashboard — programme health, stats, quick actions
2. IB Observations — 10 practice tags, voice→AI coaching with IB system prompt
3. Self-Study Workspace — standard-by-standard with authorization/evaluation modes, multiple evidence entries
4. Documentation Hub — 5 folders, upload, search, annotations
5. PD Tracker — Cat 1/2/3 tracking, staff compliance
6. PD Creator — build custom workshops, 6 templates, resource links (Google Docs/Slides/PDFs/videos)
7. Policy Manager — 5 required IB policies with review cycles
8. Student Projects — programme-aware tabs, CSV import, 5-stage completion tracker
9. Auth Checklist — 28 items across PSP domains, multiple evidence, PDF export
10. Staff Roster — IB staff with PD + observation data
11. IB Alignment Report — PSP codes, Learner Profile visibility, coordinator shared view
12. Settings — programme configuration

**Infrastructure:** 3 new roles (ib_coordinator, head_of_school, ib_district_director), 7 IB tables + RLS, role-based routing, purple sidebar, migration 011+012 applied.

**Demo account:** demo-ib@clearpathedgroup.com / IBDemo2026! (MYP, Austin International Academy, 5 teachers, 6 observations)

### Waypoint — Final Audit Grade: A
- Deploy pipeline fixed (projectName: waypoint, wrangler-action, correct account ID + token)
- Root cause React hooks crash fixed in IncidentDetailPage
- Teacher/parent removed from app (admin-only tool)
- Navigator rebranded blue (was orange)
- All report hooks campus-scoped, district_id on single-record hooks
- Meridian hidden from sidebar (not ready)
- Cosmetics: stat colors, timeline, Coming Soon cards removed, LLC typo

### Email DNS — Complete
- Google DKIM: `google._domainkey` TXT record added and authenticating
- SPF: hardened to `-all`
- DMARC: `p=quarantine` with rua reporting

### Apex Texas Fixes
- Returning users go straight to sign-in (not trial landing page)
- Forgot password link visible on trial page
- Landing page shorter on mobile
- Safari audio codec detection fixed
- PWA icon references updated

---

## Decisions Made

1. **Apex IB Hub is $1,800/yr per campus** — premium over Texas $100/yr due to IB market willingness to pay
2. **Student Projects portal = separate future product** — Hub has coordinator tracking + CSV import now, student-facing portal built later as upsell
3. **Waypoint is admin-only** — teachers and parents don't have app access
4. **Navigator brand is blue, Meridian hidden until audited**
5. **Cloudflare deploy: projectName=waypoint, uses wrangler-action@v3**

---

## What's Next

1. Wire IB Hub to student portal (future product)
2. IB observation edge function with IB-specific system prompt (currently uses main coaching draft)
3. Supabase Storage for document uploads (currently metadata only)
4. Meridian deep audit when ready to launch
5. Origins deep audit
6. Parent Communication Hub for Waypoint
