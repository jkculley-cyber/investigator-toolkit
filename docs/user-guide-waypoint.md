# Waypoint User Guide

**DAEP & Discipline Management for Texas School Districts**

Version 1.0 | Clear Path Education Group, LLC
Support: support@clearpathedgroup.com

---

## Quick Start

1. **Log in** at your district's Waypoint URL with your email and password.
2. You land on the **DAEP Dashboard** -- your home base for active placements, alerts, and compliance status.
3. To record a new discipline event, click **New Incident** from the sidebar.
4. Fill in the student, offense code, and narrative. Click **Submit**.
5. The system auto-generates compliance checklists for SPED/504 students and routes the incident through your district's approval chain.

---

## 1. Logging In & Navigation

- **Staff** (admin, principal, AP, counselor, etc.) see the full sidebar with all modules.
- **Parents** are redirected to a read-only parent portal showing their student's placement status and transition plan progress.
- The **sidebar** is organized by product. If your district has multiple Clear Path products enabled, you will see section headers (Waypoint, Navigator, etc.) with color-coded accents.

### Roles at a Glance

| Role | What You Can Do |
|------|----------------|
| Admin | Full access -- all campuses, all settings, user management |
| Principal / AP | Incident approval, DAEP oversight, reports for their campus(es) |
| Counselor | Incident creation, transition plans, intervention tracking |
| SPED Coordinator | Compliance checklists, manifestation determination reviews |
| 504 Coordinator | 504 compliance checklists, accommodation tracking |
| Teacher | Incident reporting (limited creation), behavior tracking |
| CBC / SSS | Behavior tracking, intervention support |
| Director of Student Affairs | District-wide reporting and oversight |
| Parent | Read-only portal -- placement status, transition plan progress |
| Student | Read-only access to their own records |

---

## 2. Incidents

### Creating an Incident

1. Click **New Incident** in the sidebar (or the **+** button on the Dashboard).
2. Select the **student** (search by name or ID).
3. Choose the **offense code** from the dropdown (aligned to Texas Education Code).
4. Enter the **incident date**, **location**, and **narrative**.
5. Click **Submit**.

### What Happens Automatically

- If the student has a **SPED IEP** or **504 plan**, Waypoint generates a compliance checklist with legally required steps (manifestation determination review, parent notification, etc.).
- If the student is a **repeat offender** (configurable threshold), a yellow alert is created for administrators.
- The incident enters the **approval chain** based on your district's workflow settings.

### Approval Chain

Incidents move through statuses: **Draft** > **Pending Approval** > **Approved** > **Active** (DAEP placement) > **Completed**.

- Approvers receive email notifications (if enabled).
- Approved incidents can trigger DAEP placement creation.

---

## 3. DAEP Placements

Once an incident is approved for DAEP placement:

1. The placement record is created with start/end dates, assigned campus, and conditions.
2. An **orientation** is scheduled (if your district uses the Orientation Kiosk).
3. **Daily behavior tracking** begins on the placement start date.
4. A **transition plan** is generated with 30/60/90-day review milestones.

### Separation Orders

If two students involved in the same incident must be kept apart:

1. Open the incident detail page.
2. Scroll to **Separation Orders**.
3. Search for and add the other student.
4. Separation orders display as orange badges on the Dashboard.

---

## 4. Compliance Checklists

Compliance checklists are **auto-generated** when an incident involves a SPED or 504 student. They ensure your district meets Texas Education Code requirements.

- Each checklist item has a **due date** and **completion status**.
- Overdue items generate alerts visible on the Dashboard.
- Checklists cannot be bypassed -- this is a core safety feature.

### Key Compliance Triggers

- **SPED students**: Manifestation Determination Review (MDR) required within 10 school days.
- **504 students**: 504 coordinator notification and accommodation review.
- **Repeat offenders**: Automatic alert to admin and counselor roles.

---

## 5. Transition Plans & Reviews

Every DAEP placement generates a transition plan with structured review points.

1. Navigate to **Transition Plans** in the sidebar or click from an incident.
2. The plan includes goals, supports, and reentry criteria.
3. **30-day, 60-day, and 90-day reviews** are scheduled automatically.
4. Reviewers document progress, update goals, and sign off.

---

## 6. Daily Behavior Tracking

### Staff View

- Open **Behavior Tracking** from the sidebar.
- Select the date and campus.
- Rate each student's behavior for the day (scale or category-based).
- Notes can be added per student.

### Kiosk Mode

- The **Behavior Tracking Kiosk** is a standalone screen (no sidebar) designed for DAEP classroom use.
- Access it via the kiosk URL provided by your admin.
- Staff log in once; the kiosk stays active for the session.

---

## 7. Orientation

### Orientation Kiosk

- A standalone check-in screen for students arriving at the DAEP campus.
- Students or staff confirm attendance, complete required forms, and acknowledge rules.
- Missed orientations trigger automatic alerts.

### Orientation Schedule

- View upcoming, missed, and completed orientations from **DAEP > Orientations**.
- Missed orientations appear as red alerts on the Dashboard.
- Students who complete orientation but have not started placement appear in the amber "Awaiting Placement Start" section.

---

## 8. Alerts

Alerts appear on the Dashboard and are role-filtered (only relevant roles see each alert type).

| Alert Type | Trigger | Color |
|-----------|---------|-------|
| Repeat Offender | Student exceeds incident threshold | Red |
| SPED Compliance | Checklist item overdue | Red |
| Orientation Missed | Student did not attend scheduled orientation | Yellow |
| Placement Not Started | Orientation complete but no active placement | Yellow |

Click any alert to navigate to the related incident or student record.

---

## 9. Reports & Exports

- **Reports** page offers filtered views by campus, date range, offense type, and student demographics.
- **PDF Export**: Click the PDF icon to generate a formatted report. Uses district branding.
- **Excel Export**: Click the Excel icon to download a spreadsheet for further analysis.
- **PEIMS Export**: Generate Texas PEIMS-formatted data files for state reporting.
- **Calendar View**: See incidents and placements on a monthly/weekly calendar.

---

## 10. Data Import

### CSV Import Wizard

1. Go to **Settings > Import Data**.
2. Select the import type (students, incidents, etc.).
3. Upload your CSV file.
4. Map columns to Waypoint fields.
5. Review the preview and click **Import**.
6. Errors are logged and downloadable.

### Laserfiche Integration

- Waypoint can import DAEP data from Laserfiche workflows.
- Each record uses a `laserfiche_instance_id` as a deduplication key -- re-imports update existing records rather than creating duplicates.
- Contact support@clearpathedgroup.com to configure your Laserfiche connection.

---

## 11. Settings

Accessible to **Admin** role only.

- **User Management**: Add/edit staff accounts, assign roles, assign campus access.
- **Campus Management**: Add/edit campuses, set campus-level settings.
- **Notification Preferences**: Enable/disable email notifications by event type.
- **District Settings**: Subscription tier, product access, branding.

---

## 12. Parent Portal

Parents log in and see a simplified read-only view:

- Current placement status and dates.
- Transition plan progress and upcoming reviews.
- Contact information for assigned counselor/case manager.

Parents cannot create or modify any records.

---

## Getting Help

- **Email**: support@clearpathedgroup.com
- **In-app**: Click the help icon in the top navigation bar.
- **Training**: Contact your district administrator for scheduled training sessions.
