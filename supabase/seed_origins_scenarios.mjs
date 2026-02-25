// Seed global Origins scenarios into origins_scenarios table
// Run AFTER migration 044 is applied:
//   SUPABASE_SERVICE_ROLE_KEY=xxx node supabase/seed_origins_scenarios.mjs

import { createClient } from '@supabase/supabase-js'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const url = process.env.SUPABASE_URL || 'https://kvxecksvkimcgwhxxyhw.supabase.co'

if (!serviceRoleKey) { console.error('SUPABASE_SERVICE_ROLE_KEY required'); process.exit(1) }

const supabase = createClient(url, serviceRoleKey)

// Import scenario data (must be run from project root)
const { SCENARIOS } = await import('../src/lib/originsScenarios.js')

const rows = SCENARIOS.map(s => ({
  id:            s.id,
  district_id:   null,   // global — available to all districts
  title:         s.title,
  description:   s.description,
  skill_pathway: s.skill_pathway,
  grade_band:    s.grade_band,
  content:       {
    ...s.content,
    tec_offense: s.tec_offense,
  },
  is_active: s.is_active,
}))

console.log(`Seeding ${rows.length} global scenarios...`)

const { error } = await supabase
  .from('origins_scenarios')
  .upsert(rows, { onConflict: 'id' })

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log(`✓ ${rows.length} scenarios seeded successfully.`)
