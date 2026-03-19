# Session AR Handover — 2026-03-19 (continued from AQ)

## What Was Done

### Apex — Auth Fix (Critical, Live Client)
- **Root cause found:** `shouldCreateUser: false` silently blocked all new users from getting OTP codes. No auth account existed for approved principals, so Supabase refused to send the code. No error shown to user.
- **Fix 1:** Removed `shouldCreateUser: false` — auth accounts created on first sign-in attempt.
- **Fix 2:** Login flow switched from magic link to 6-digit OTP code entry. User types code on screen — immune to Outlook Safe Links.
- **Fix 3:** AuthCallbackPage now shows recovery screen after 8 seconds instead of spinning forever.
- **Fix 4:** Welcome email (approve-access edge function) rewritten — no longer sends magic link. Shows 3-step instructions: go to site → sign in → enter code. **Edge function deployed via Supabase CLI.**
- **Supabase config:** User bumped email rate limit from 2/hour (was blocking clients). OTP expiry at 3600s. Magic link email template updated with `{{ .Token }}`.
- **Supabase CLI:** User re-authenticated (`npx supabase login`), PAT refreshed. Edge function deployed successfully.
- **Client:** Bobby McClain at Knox JH, Conroe ISD (`bmcclain@conroeisd.net`). Was stuck on "Signing in..." spinner. Instructed to use code-based sign-in.

### Email Templates
- `admin_previews/new-principal-apex-trial.html` — Personalized for newly named principals. Empathetic opening, 3-stat problem box, 4-feature breakdown, orange CTA to trial. Uses `support@clearpathedgroup.com`.
- `admin_previews/admin-apex-trial.html` — Generic BCC-friendly version for all administrators. Warm greeting, no `[FirstName]` placeholder.

### clearpathedgroup.com — Full Site Restore
- **Problem:** Site had been rewritten in a prior session with a "pathways" approach that removed pricing, demo form, pilot application, Explore Waypoint simulation, TpT section, and slides/video.
- **Fix:** Restored to commit `70958d0` (last version with all sections), then layered good additions on top:
  - Resources nav dropdown (Teacher, Principal, IB, PD categories)
  - Store nav link → `/store.html`
  - Apex CTA updated to "Start Free 14-Day Trial"
  - "Launch App" → "Launch Waypoint" in nav
  - TEC Decision Matrix "View on TpT" → "View in Store" (`/store.html`)
  - "Browse All Tools on TpT" → "Browse All Tools" (`/store.html`)
  - Fixed TpT footer URL: was `/kimberly-culley`, now `/store/kimberly-culley`
  - Removed redundant "Tools" nav link (Resources covers it)
- **Nav now:** Products · Store · Resources ▾ · Research · Contact · Security · [Apply for Pilot Spot] · [Launch Waypoint →]

### Waypoint (from Session AQ, same day)
- DAEP campus picker on IncidentDetailPage (needs migration 059)
- All stat cards clickable across platform (Alerts, Origins, etc.)

## Commits Pushed (clearpath-apex)
- `5ed1f8e` — fix: remove shouldCreateUser:false
- `ac688f6` — fix: switch login to OTP code entry
- `3327308` — fix: replace magic link with code-based welcome email

## Commits Pushed (waypoint)
- `b875b32` — feat: DAEP campus picker + clickable stat cards
- `d654a9f` — docs: Session AQ closing
- `0f9ba01` — fix: restore clearpathedgroup.com full version
- `9927124` — copy: Launch App → Launch Waypoint
- `3eb86a0` — fix: TEC Decision Matrix + Browse Tools → /store.html
- `55263cd` — fix: correct TpT store URL path
- `5fa34dc` — copy: remove redundant Tools nav link

## What's Next
1. **Apply migration 059** to Waypoint Supabase — enables DAEP campus picker
2. **Confirm Bobby McClain can sign in** with 6-digit code
3. **Test full Apex sign-in flow** end-to-end with a fresh email
4. **SPF record** — add `include:spf.resend.com` to clearpathedgroup.com DNS
5. **Navigator product card** — user noted Navigator is missing as a standalone product card on the site (it's only in roadmap strip and pricing calc)

## Blockers
- None — Supabase CLI re-authenticated, edge functions deployable
