#!/usr/bin/env node
/**
 * License Key Generator + Provisioner
 *
 * Generates a license key and optionally inserts it into the ops Supabase
 * product_licenses table.
 *
 * Usage:
 *   node scripts/generate-license-key.mjs --product beacon --customer "Jane Smith" --email jane@school.edu
 *   node scripts/generate-license-key.mjs --product investigator --customer "John Doe" --dry-run
 *
 * Options:
 *   --product        beacon | investigator (required)
 *   --customer       Customer name (required)
 *   --email          Customer email (optional)
 *   --district       District name (optional)
 *   --expires        Expiry date, e.g. 2027-06-01 (default: 1 year from now)
 *   --dry-run        Print the key without inserting into database
 *
 * Environment:
 *   OPS_SERVICE_KEY  Service role key for ops Supabase (required unless --dry-run)
 */

const OPS_URL = 'https://xbpuqaqpcbixxodblaes.supabase.co';

function generateKey(product) {
  const prefix = product === 'beacon' ? 'BCN' : 'INV';
  const seg1 = randomSeg(6);
  const seg2 = randomSeg(4);
  return `${prefix}-${seg1}-${seg2}`;
}

function randomSeg(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let s = '';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) s += chars[b % chars.length];
  return s;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') { args.dryRun = true; continue; }
    if (arg.startsWith('--') && i + 1 < argv.length) {
      args[arg.slice(2)] = argv[++i];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.product || !['beacon', 'investigator'].includes(args.product)) {
    console.error('Error: --product must be "beacon" or "investigator"');
    process.exit(1);
  }
  if (!args.customer) {
    console.error('Error: --customer is required');
    process.exit(1);
  }

  const key = generateKey(args.product);
  const expiresAt = args.expires
    ? new Date(args.expires + 'T00:00:00Z').toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  console.log('');
  console.log('========================================');
  console.log('  LICENSE KEY GENERATED');
  console.log('========================================');
  console.log(`  Product:   ${args.product}`);
  console.log(`  Key:       ${key}`);
  console.log(`  Customer:  ${args.customer}`);
  console.log(`  Email:     ${args.email || '(none)'}`);
  console.log(`  District:  ${args.district || '(none)'}`);
  console.log(`  Expires:   ${expiresAt.split('T')[0]}`);
  console.log('========================================');

  if (args.dryRun) {
    console.log('\n  --dry-run: key NOT inserted into database.\n');
    return;
  }

  const serviceKey = process.env.OPS_SERVICE_KEY;
  if (!serviceKey) {
    console.error('\n  Error: OPS_SERVICE_KEY env var required to insert into database.');
    console.error('  Re-run with --dry-run to just generate a key.\n');
    process.exit(1);
  }

  const row = {
    license_key: key,
    product: args.product,
    customer_name: args.customer,
    customer_email: args.email || null,
    district_name: args.district || null,
    status: 'active',
    expires_at: expiresAt,
  };

  const res = await fetch(`${OPS_URL}/rest/v1/product_licenses`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`\n  Error inserting license: ${res.status} ${text}\n`);
    process.exit(1);
  }

  const inserted = await res.json();
  console.log(`\n  Inserted into product_licenses (id: ${inserted[0]?.id})\n`);
}

main();
