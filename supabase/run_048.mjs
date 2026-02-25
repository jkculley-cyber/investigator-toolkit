import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const password = process.env.SUPABASE_DB_PASSWORD
const host = process.env.SUPABASE_DB_HOST || 'db.kvxecksvkimcgwhxxyhw.supabase.co'

if (!password) { console.error('SUPABASE_DB_PASSWORD required'); process.exit(1) }

const client = new pg.Client({
  host, port: 5432, database: 'postgres', user: 'postgres', password,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
console.log('Connected.')

const sql = readFileSync(join(__dirname, 'migrations', '048_fix_orientation_status_constraint.sql'), 'utf-8')
console.log('Applying 048_fix_orientation_status_constraint.sql...')
await client.query(sql)
console.log('✓ Done.')

await client.end()
console.log('\n✓ Migration 048 applied successfully.')
