# Clear Path Education Group — Partner Briefing
**Date:** March 18, 2026
**Prepared for:** Business Partner
**Purpose:** Full catch-up on where we are across all products, infrastructure, and go-to-market

---

## Who We Are

**Clear Path Education Group, LLC** — Texas-focused EdTech company building compliance and instructional leadership software for K-12 school administrators.

- **Website:** clearpathedgroup.com
- **Primary contact / sales lead:** Kim Culley — kim@clearpathedgroup.com
- **Support email:** support@clearpathedgroup.com

We have two products live and two more in the suite. Both live products are deployed, real users can sign up, and both have full email automation running.

---

## Product 1: Waypoint (District Product — DAEP Compliance)

### What It Is
Waypoint is a discipline management platform built specifically for Texas K-12 districts. It manages the full DAEP (Disciplinary Alternative Education Program) placement workflow — from incident creation through placement, compliance documentation, transition plans, and PEIMS reporting.

**The core differentiator:** Waypoint physically *blocks* a principal from completing a DAEP or expulsion placement for a SPED or 504 student until every legally required compliance step is documented. Missing a manifestation determination can cost a district $50,000+ in OCR complaints and legal fees. Waypoint prevents that from happening.

### What's Built
Everything. The product is feature-complete and ready to sell:
- Incident creation and approval chain
- SPED/504 compliance blocking (hard workflow gate, not a reminder)
- DAEP placement management
- Transition plans with structured 30/60/90-day reviews
- Repeat-offender alerts (automatic red/yellow flags for dangerous patterns)
- Parent portal (read-only access, acknowledgment button)
- PEIMS discipline data export
- Laserfiche integration (for districts using Laserfiche — daily Excel sync, no duplicate entry)
- Full user management with 12 distinct roles
- Daily behavior tracking kiosk
- Orientation kiosk
- PDF and Excel report exports
- Mobile-responsive, PWA-installable

### Additional Modules (all built, gated by subscription tier)
- **Navigator** — ISS/OSS tracking, risk scoring, escalation engine, intervention tracking
- **Meridian** — SPED compliance (IEPs, 504s, ARDs, dyslexia/HB3928, transition SPPI-13)
- **Origins** — Family portal with student skill-building scenarios and parent conversation starters

### Where to Access
- **Live app:** https://waypoint.clearpathedgroup.com
- **Demo login:** admin@lonestar-isd.org / Password123!
  - Lone Star ISD is a fully seeded demo district — real-looking data, 12 incidents, transition plans, behavior tracking, everything
- **Internal admin panel:** https://waypoint.clearpathedgroup.com/waypoint-admin
  - Login: admin@waypoint.internal / Waypoint2025!
  - Here you can provision new districts, manage contracts, see pipeline metrics, and chat with Melissa (ops site)

### Business Status
- **Stage:** Pre-pilot. Product is sales-ready. No districts contracted yet.
- **Target:** Mid-size Texas districts (3,000–15,000 students) with a DAEP campus
- **Pricing:** Waypoint only = $6,500/yr; full suite = $14,000/yr (5,000-student district)
- **Pilot offer:** 60 days free, full features, no commitment
- **First signed contract goal:** By June 1, 2026 (per GTM plan)

### GTM Plan (Waypoint)
Full go-to-market plan is in `docs/brand/nova-pilot-gtm-plan.md`. Summary:
1. Build a list of 50 target districts from TEA PEIMS public data (50+ DAEP placements/yr, 3,000–15,000 enrollment)
2. Priority geographies: DFW suburbs → Houston metro → Central Texas
3. Cold email cadence: 5 emails/texts over 30 days, then archive to fall nurture
4. Primary conferences: TASA (January), TASSP (June/July), TAASE (fall)
5. ESC strategy: Target Region 10, 4, and 13 — one ESC contact multiplies to 20–50 districts

**Week of March 16–22 (current week):** First 15 DFW superintendent emails should go out.

---

## Product 2: Apex (Individual Principal Product — Instructional Leadership)

### What It Is
Apex is a separate, standalone product — not part of Waypoint. It's a mobile-first tool for individual campus principals to manage classroom walkthroughs, T-TESS evaluations, and coaching communications with teachers.

**The problem it solves:** A principal doing 10 walkthroughs a week spends 5–6 hours/week writing notes, scoring T-TESS dimensions, and drafting coaching emails. Apex cuts that to about 10 minutes/week. The principal narrates what they see in the classroom — out loud, like leaving a voicemail — and Apex transcribes it, scores T-TESS dimensions automatically, and drafts a coaching email to the teacher. Review, edit, send.

**Business model:** Individual principal subscriptions — not sold to districts. Principals find it, sign up for a free 14-day trial, and either buy or get a free extension through the end of school year.

### What's Built
- Full observation loop: voice recording → AI transcription (OpenAI Whisper) → AI scoring + coaching email draft (Claude) → principal review → send to teacher
- Formal T-TESS mode (annual evaluations) and walkthrough mode
- Teacher roster management with growth arc tracking and coaching focus editor
- T-TESS scorecard PDF export
- Dashboard command center: walkthrough counts, pending drafts, teacher watchlist, daily morning brief
- Morning brief: AI-generated daily leadership brief delivered automatically at the principal's chosen time
- Communication tool: compose → AI-drafted parent emails/staff memos → review → send
- Settings: profile, school info, notification preferences
- 14-day trial system with automated drip emails and two conversion paths (buy now vs. free extension through end of year)
- Lead capture: when a principal signs up, Kim gets an instant email notification with their name, school, district, and trial dates

### Where to Access
- **Live app:** https://clearpath-apex.pages.dev
- **Trial signup:** https://clearpath-apex.pages.dev/try
- **Login method:** Magic link (email-based, no password — principal enters email, clicks the link in their inbox)

### Email Automation (All Live)
When a principal signs up:
1. **Immediately:** Kim gets a lead notification email. Principal gets a welcome email from Kim with first-walkthrough CTA.
2. **Day 3:** "How's Apex going?" — teaches good observation narration technique
3. **Day 7:** One-week check-in — explains morning brief, coaching focus, formal T-TESS mode
4. **Day 14:** Trial expiration with two-path offer:
   - Option 1: Reply to Kim for spring pricing proposal (same day)
   - Option 2: Click to extend free access through end of school year — Kim follows up in July

### Outreach Sequence (Ready to Deploy)
A cold outreach sequence for reaching new principals is drafted and saved in `docs/apex-outreach-sequence.md`:
- **3 emails** over 12 days (problem-framing, feature add, low-pressure close)
- **3 texts** staggered between emails
- Best send times: Tuesday–Thursday, 7–8 AM

**Note on texts:** No text platform is set up yet. Need to choose a service (SimpleTexting or TextMagic recommended) and decide if texts come from Kim's cell or a dedicated number.

### Business Status
- **Stage:** Live, trial-ready. No paying principals yet — trial system just launched.
- **Pricing:** Not published yet — Kim handles individually via the "reply for proposal" path
- **Founding principal offer:** Best pricing ever offered — position as limited window

---

## The Website (clearpathedgroup.com)

The company website is live and serves as the marketing hub for both products. It is NOT product-specific — it's company-level, introducing the full Clear Path suite.

**What's on the site:**
- Company overview and product suite (Waypoint, Navigator, Meridian)
- Interactive pricing calculator
- Free DAEP Compliance Checklist (lead magnet — 20-point self-audit, downloadable)
- Demo request form → goes to Kim via Formspree
- Pilot application form
- Floating "Talk to Our Team" widget with 7 personalized auto-replies
- Security page (`/security.html`) and Research page (`/research.html`)
- Google Slides embed + narrated demo video placeholder
- Cloudflare Analytics tracking

**Lead capture channels:** All 4 lead forms on the site → Formspree (xpqjngpp) → Kim's email

---

## Operations Dashboard (clearpath-ops.pages.dev)

There is a separate internal operations site for Kim and her partner (Melissa) to manage the business day-to-day. This is separate from the Waypoint app.

- **Access:** clearpath-ops.pages.dev
- **What it does:** Internal command center for business operations — tasks, pipeline, notes, partner coordination
- **Partner chat:** Real-time messaging between Kim and Melissa is built into both the ops site and the Waypoint admin panel

---

## Infrastructure Overview (Non-Technical Summary)

| Item | Detail |
|------|--------|
| Waypoint hosting | Cloudflare Pages — auto-deploys when code is pushed to GitHub |
| Apex hosting | Cloudflare Pages — same auto-deploy setup |
| Database (Waypoint) | Supabase — cloud Postgres, handles auth, data storage, security |
| Database (Apex) | Supabase — separate project from Waypoint |
| Email sending | Resend — all transactional emails sent via clearpathedgroup.com domain |
| Domain | clearpathedgroup.com — managed in Cloudflare DNS |
| DKIM | Set ✅ — emails are authenticated |
| SPF record | Pending ⚠️ — needs one DNS record added to prevent emails going to spam |

**One pending DNS item:** Add `include:spf.resend.com` to the clearpathedgroup.com TXT record in Cloudflare DNS. This is a 2-minute manual change in the Cloudflare dashboard. Until it's done, some Resend emails may land in spam.

---

## What Needs to Happen Next

### This Week / Urgent
- [ ] **Start Waypoint outreach** — first 15 DFW superintendent emails (template in nova-pilot-gtm-plan.md)
- [ ] **Deploy Apex outreach** — choose text platform, load principal list, start sequence
- [ ] **Fix SPF record** — Cloudflare DNS → clearpathedgroup.com → add `include:spf.resend.com` to TXT record

### Soon
- [ ] **Set up privacy@clearpathedgroup.com** — referenced in compliance docs; needs to exist before sharing with districts
- [ ] **Apex pricing** — decide on founding principal rate before first trial converts
- [ ] **SMS platform** — choose SimpleTexting or TextMagic to enable the text sequence

### Longer Horizon
- [ ] **First Waypoint pilot** — goal by June 1, 2026
- [ ] **TASSP session proposal** — submit by March 2026 (TASSP is June/July)
- [ ] **Parent Communication Hub** — #1 pain point from district conversations: timestamped call log for due process. Not built yet.
- [ ] **Meridian escalations table** — the Escalate button in Meridian logs to console only; needs a future database migration

---

## Demo Credentials (All Environments)

| Environment | URL | Login |
|-------------|-----|-------|
| Waypoint (demo district) | waypoint.clearpathedgroup.com | admin@lonestar-isd.org / Password123! |
| Waypoint (internal admin) | waypoint.clearpathedgroup.com/waypoint-admin | admin@waypoint.internal / Waypoint2025! |
| Apex (trial signup) | clearpath-apex.pages.dev/try | (magic link — enter any email) |
| Ops dashboard | clearpath-ops.pages.dev | (gate code — ask Kim) |

---

*This document reflects the state of Clear Path Education Group as of March 18, 2026.*
*Technical docs, decision log, and full session history are in the project repository.*
