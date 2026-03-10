# Session AE Handover — 2026-03-10

## What Was Done This Session

### 1. Sandbox Provisioning (Completed)
- Verified Explorer ISD district already existed at fixed UUID `22222222-2222-2222-2222-222222222222`
- Fixed products from `["waypoint"]` → `["waypoint","navigator","meridian"]` via REST PATCH
- Deployed `reset-sandbox` Edge Function (was built but undeployed); added `reentry_checkins` + `reentry_checklists` wipe before transition_plans delete; confirmed working (`{"success":true}`)
- Confirmed Cloudflare Pages env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) already set on `cpeg-site`
- **Sandbox credentials:** URL: `waypoint.clearpathedgroup.com` · Email: `explore@clearpathedgroup.com` · Password: `Explore2026!`

### 2. Campus Reception Score (Completed)
Built `useCampusReceptionScore()` hook + `CampusReceptionScoreCard` component (added to DAEP Dashboard Analytics tab).
- Queries `daep_exit`/`iss_reentry` plans past end_date (last 180 days)
- Fetches subsequent DAEP/OSS incidents within 90-day window per student
- Score = 70% retention + 30% check-in positivity; grades A/B/C/D
- Table: Campus | Returned | Re-referred | Check-ins | Score bar + badge

### 3. Lead Pipeline Wire (Phase 2)
- `clearpath-site/functions/api/welcome.js` — updated to also POST lead data to `leads` table after sending email (non-blocking). Demo form was the only source not logging leads; pilot + widget already used `capture-lead` Edge Function.

### 4. District Onboarding Checklist (Phase 3)
- `src/components/ui/SetupChecklist.jsx` — admin-only checklist on Dashboard (5 steps: campuses, offense codes, staff, students, DAEP capacity). Progress bar. Auto-hides when all done. localStorage dismiss.
- `WaypointAdminPage.jsx` ManageDistrictDrawer — "Onboarding" health card (5 dots, green/yellow/red, X/5 complete) added to every district drawer. Fetches offense codes + students count in existing load call.

### 5. Full Audit → 9-Point Product Improvement (Phase 1–6)

**send-notification templates (redeployed):**
- `welcome_demo_request` + `welcome_pilot_application` — added Google Calendar scheduling CTA button
- New `nurture_day3` template: "Still thinking about Waypoint?" — sandbox reminder + booking link
- New `nurture_day7` template: "Last check-in from Waypoint" — final touch + booking link
- **Scheduling URL:** `https://calendar.app.google/YN6Wki3eAkM6V8c49` (Google Calendar, updated from placeholder after user confirmed)

**check-nurture Edge Function (deployed, `--no-verify-jwt`):**
- Daily Day 3 (nurture_stage=0 → 1) + Day 7 (nurture_stage=1 → 2) email sequence
- Only targets `new` status leads with sources: `demo_request`, `pilot_application`, `chat_widget`
- Sets `nurture_stage` + `nurture_sent_at` on each send

**Migration 056 (applied to production):**
- `leads.nurture_stage SMALLINT DEFAULT 0`
- `leads.nurture_sent_at TIMESTAMPTZ`
- `reentry_checklists.teacher_observations TEXT`
- `compliance_checklists.fba_notes TEXT`
- `compliance_checklists.bip_notes TEXT`

**ImportStepUpload.jsx:**
- Blue "Download template first" banner at top of step 1 (before type selection), shows pill buttons for each import type

**DashboardPage.jsx — StaffQuickStart:**
- Role-specific getting-started card for 7 non-admin roles (counselor, teacher, principal, ap, sped_coordinator, cbc, director_student_affairs)
- 3 contextual action links per role; localStorage-dismissed per role

**WaypointAdminPage.jsx — LeadsPanel nurture indicator:**
- Per-lead date cell shows nurture status: "Day 3 nurture pending" / "Day 3 sent" / "Day 7 nurture pending" / "Sequence complete"

**ReentryHub.jsx — TeacherObservationsCard:**
- New card below CheckinTrackerCard; counselors log teacher feedback on returned students
- Saves to `reentry_checklists.teacher_observations` via upsert

**ComplianceChecklist.jsx — FBA/BIP Documentation:**
- Purple documentation panel appears inline when `fba_conducted` or `bip_reviewed` is checked
- Separate textarea for FBA summary + BIP review notes
- IDEA 34 CFR §300.530(d) citation included
- Saves to `compliance_checklists.fba_notes` + `bip_notes`
- Read-only display when checklist is completed

**ReportsPage.jsx — CampusDisproportionalityTable:**
- New table at bottom of Disproportionality tab
- Per-campus DAEP/OSS breakdown: Total | SPED% | ELL% | Hispanic% | African American%
- Red flags ≥60%, yellow ≥40%

**DaepDashboardPage.jsx — TexasBenchmarkCard:**
- Static TEA 2022-23 statewide benchmarks in Analytics tab
- 5 metrics: DAEP placement rate (2.3%), avg days (42), SPED share (21%), re-referral (18%), OSS rate (4.1%)

---

## Commits This Session
```
aa47e5a fix: replace Calendly with Google Calendar booking link
bb6ef8e feat: 9-point product improvement — Phase 1-6 gap closure
4b4952a feat: district onboarding checklist + setup health indicator
0048066 feat: log demo form leads to Supabase via welcome.js
e08bf4c feat: Campus Reception Score
```

---

## Key Technical Notes

### Google Calendar Booking Link
`https://calendar.app.google/YN6Wki3eAkM6V8c49` — appears in send-notification templates (4 places). User confirmed this URL; do not revert to Calendly.

### Nurture Sequence Architecture
- `leads.nurture_stage`: 0=new, 1=day3_sent, 2=day7_sent (no day7 yet), 3=complete (reserved)
- `check-nurture` Edge Function uses ±1 day windows to catch leads on day 3 and day 7
- pg_cron entry in migration 056 uses `current_setting('app.supabase_url')` — may need manual cron setup via Supabase dashboard if settings not configured. Alternative: call via external cron.
- To manually test: `curl -X POST https://kvxecksvkimcgwhxxyhw.supabase.co/functions/v1/check-nurture`

### Nul File in Working Directory
There is a `nul` file at repo root (Windows artifact) that prevents `git add -A`. Always use `git add src/ supabase/ clearpath-site/` etc. to avoid it.

### FBA/BIP Notes
`compliance_checklists.fba_notes` and `bip_notes` are TEXT columns added in migration 056. The UI only shows the edit panel when `fba_conducted` or `bip_reviewed` is truthy (not null) AND checklist is not completed.

---

## State of Migrations
- **001–055** — Applied to production
- **056** — Applied to production (leads nurture, teacher_observations, fba_notes, bip_notes)

---

## Pending / Still Not Done
1. **`privacy@clearpathedgroup.com`** mailbox — must exist before sharing compliance docs with districts
2. **Google Search Console** — register clearpathedgroup.com (Sage owns)
3. **SPF record** — add `include:spf.resend.com` to Cloudflare DNS (needs DNS:Edit token)
4. **First pilot district** — product sales-ready; Nova owns outreach
5. **Meridian escalations table** — Escalate button logs to console; needs migration for `meridian_escalations`
6. **pg_cron for nurture** — migration 056 includes cron setup but depends on `app.supabase_url` setting; verify in Supabase dashboard or set up manually
7. **SMS booking alert** — user wants text when appointment is booked via Google Calendar. Options discussed: (a) email-to-SMS via carrier gateway, (b) Zapier Google Calendar → SMS, (c) Twilio in capture-lead Edge Function on form submit. User deferred; no decision made.
8. **Parent Communication Hub** — #1 pain point (due process liability): timestamped log of call attempts, voicemail, certified mail. Not yet built.

---

## What To Work On Next
- **Parent Communication Hub** — highest-value remaining gap; court-ready communication timeline
- **SMS booking alert** — quick win if user provides Twilio credentials
- **First pilot outreach** — product is ready
- **pg_cron verification** — confirm nurture cron is scheduled in Supabase dashboard
