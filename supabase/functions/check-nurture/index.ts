// Supabase Edge Function: check-nurture
// Runs daily (via pg_cron at 14:00 UTC) to send nurture emails to leads.
//
// Nurture sequence:
//   Day 3 after creation (nurture_stage = 0) → nurture_day3 email → set stage = 1
//   Day 7 after creation (nurture_stage = 1) → nurture_day7 email → set stage = 2
//
// Only targets demo_request and pilot_application sources.
// Stops if lead was contacted (status !== 'new').

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

const NURTURE_SOURCES = ['demo_request', 'pilot_application', 'chat_widget']

serve(async (_req) => {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const now = new Date()
  const day3Min = new Date(now.getTime() - 4 * 86400000).toISOString()  // created > 4 days ago
  const day3Max = new Date(now.getTime() - 3 * 86400000).toISOString()  // created < 3 days ago
  const day7Min = new Date(now.getTime() - 8 * 86400000).toISOString()
  const day7Max = new Date(now.getTime() - 7 * 86400000).toISOString()

  let sent = 0
  let errors = 0

  // ── Day 3 nurture ──────────────────────────────────────────────────────────
  const { data: day3Leads } = await sb
    .from('leads')
    .select('id, name, email, source')
    .eq('nurture_stage', 0)
    .eq('status', 'new')
    .in('source', NURTURE_SOURCES)
    .gte('created_at', day3Min)
    .lte('created_at', day3Max)

  for (const lead of (day3Leads || [])) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        to:       lead.email,
        subject:  "Still thinking about Waypoint?",
        template: 'nurture_day3',
        data:     { name: lead.name || '', email: lead.email },
      }),
    })

    if (res.ok) {
      await sb.from('leads').update({
        nurture_stage:   1,
        nurture_sent_at: now.toISOString(),
        updated_at:      now.toISOString(),
      }).eq('id', lead.id)
      sent++
    } else {
      console.error(`[check-nurture] day3 failed for ${lead.email}:`, await res.text())
      errors++
    }
  }

  // ── Day 7 nurture ──────────────────────────────────────────────────────────
  const { data: day7Leads } = await sb
    .from('leads')
    .select('id, name, email, source')
    .eq('nurture_stage', 1)
    .eq('status', 'new')
    .in('source', NURTURE_SOURCES)
    .gte('created_at', day7Min)
    .lte('created_at', day7Max)

  for (const lead of (day7Leads || [])) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        to:       lead.email,
        subject:  "Last check-in from Waypoint",
        template: 'nurture_day7',
        data:     { name: lead.name || '', email: lead.email },
      }),
    })

    if (res.ok) {
      await sb.from('leads').update({
        nurture_stage:   2,
        nurture_sent_at: now.toISOString(),
        updated_at:      now.toISOString(),
      }).eq('id', lead.id)
      sent++
    } else {
      console.error(`[check-nurture] day7 failed for ${lead.email}:`, await res.text())
      errors++
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent, errors, ran_at: now.toISOString() }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
