# Melissa — Access Guide & Quick Reference
> Everything you need to access Clear Path systems, tools, and AI agents.
> Last updated: 2026-03-19

---

## Your Logins

### Waypoint Internal Admin Dashboard
- **URL:** https://waypoint.clearpathedgroup.com/waypoint-admin
- **Email:** melissapd16@gmail.com
- **Password:** ClearPath2026!
- **What you can do:** View/manage all districts, business dashboard (ARR/MRR/contracts), product hub, leads pipeline, Apex principal management (approve/reject access requests), partner chat with Kim

### Ops Command Center
- **URL:** https://clearpath-ops.pages.dev
- **Gate:** Enter as "Melissa"
- **What you can do:** Action tracker, pipeline management, partner chat with Kim, resources management (add/edit/delete resources for the clearpath website)

### Apex (Principal Product)
- **URL:** https://clearpath-apex.pages.dev
- **What it is:** The product principals use. You don't log in here — you manage principals from the Waypoint Admin Dashboard (Apex tab).

### Demo Account (for showing Waypoint to districts)
- **URL:** https://waypoint.clearpathedgroup.com
- **Email:** admin@lonestar-isd.org
- **Password:** Password123!
- **District:** Lone Star ISD (demo data pre-loaded)

---

## Platforms That Need Your Invite (Kim does this)

Kim needs to send you invites from each platform's dashboard. Your invite email for all of these: **melissapd16@gmail.com**

| Platform | What It Does | How Kim Invites You |
|----------|-------------|-------------------|
| **GitHub** | Code repos for all products | Each repo > Settings > Collaborators > Add melissapd16@gmail.com |
| **Cloudflare** | Website hosting, DNS, analytics | Account > Members > Invite |
| **Supabase** (Waypoint) | Database for Waypoint/Navigator/Meridian/Origins | Project Settings > Team > Invite |
| **Supabase** (Apex) | Database for Apex | Project Settings > Team > Invite |
| **Resend** | Email delivery (marketing blasts, notifications) | Settings > Team > Invite |
| **LinkedIn** | Company page posting & ads | Page > Admin tools > Manage admins |
| **Facebook** | Company page posting & ads | Business Suite > Settings > People > Add |

---

## Our Products

| Product | What It Does | Status |
|---------|-------------|--------|
| **Waypoint** | DAEP/discipline management for Texas districts | Live, demo-ready |
| **Navigator** | ISS/OSS tracker (upsell from Waypoint) | Live |
| **Meridian** | SPED compliance & case management | Operationally complete |
| **Origins** | Family portal — student scenarios & parent engagement | Live |
| **Apex** | AI chief of staff for principals — voice walkthroughs, T-TESS scoring, coaching emails | Live, accepting trials |

---

## AI Agent Team

We have 4 AI agents that help run different parts of the business. They're not separate apps — they're roles you invoke when using Claude (claude.ai or Claude Code). Start a session, reference the agent by name, and ask it to do work in its domain.

### How to Use an Agent
1. Open Claude (claude.ai or Claude Code CLI)
2. Point it at our repo (if using Claude Code, open the project folder)
3. Say something like: *"You are Nova, our CRO. I need you to draft a cold email to a superintendent in Dallas ISD..."*
4. The agent specs are in `docs/agents/` in the repo — Claude reads them for context

### The Team

| Agent | Role | What They Do |
|-------|------|-------------|
| **Archer** | CTO | Code, infrastructure, database, deployments, security. Ask Archer to build features, fix bugs, run migrations. |
| **Vera** | COO | Operations, command center, process coordination, session handovers. Ask Vera to update the ops dashboard, track actions, prep meetings. |
| **Nova** | CRO | Sales, pipeline, proposals, pricing, district outreach. Ask Nova to write proposals, build sales sequences, handle objections. |
| **Sage** | CMO | Brand, marketing, content, SEO, lead generation. Ask Sage to write email campaigns, social posts, website copy, thought leadership. |

---

## Marketing Blast System (Apex)

We can send branded marketing emails to Melissa's principal list. The system is live.

### How to Send a Blast
1. Prepare a list: each principal needs `email`, `first_name`, and optionally `school_name`
2. Give the list to Kim (or paste into Claude Code) — the system formats and fires it
3. 3-email sequence: Email 1 (Day 1), Email 2 (Day 5), Email 3 (Day 12)
4. Deduplication is automatic — same person won't get the same email twice

### Managing Resources on the Website
1. Go to https://clearpath-ops.pages.dev
2. Gate in as "Melissa"
3. Click "Resources" in the sidebar
4. Add/edit/delete resources — they appear live on clearpathedgroup.com/resources.html

---

## Key URLs at a Glance

| What | URL |
|------|-----|
| Company website | https://clearpathedgroup.com |
| Waypoint app | https://waypoint.clearpathedgroup.com |
| Waypoint admin panel | https://waypoint.clearpathedgroup.com/waypoint-admin |
| Apex (principals) | https://clearpath-apex.pages.dev |
| Ops command center | https://clearpath-ops.pages.dev |
| Resources page | https://clearpathedgroup.com/resources.html |
| Company email | support@clearpathedgroup.com |
| Kim's email | kim@clearpathedgroup.com |

---

## Need Help?

- **Technical issues:** Ask Kim to open a Claude Code session — Archer can fix anything in the codebase
- **Sales/outreach questions:** Invoke Nova in Claude
- **Marketing/content:** Invoke Sage in Claude
- **Operations/process:** Invoke Vera in Claude
