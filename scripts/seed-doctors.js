#!/usr/bin/env node
/**
 * Seed the `doctors` table from your Excel file.
 * Uses only Node.js built-ins (https) — works on Node 14+, no fetch needed.
 *
 * Usage:
 *   npm run seed:doctors -- --file="Doctors.xlsx" --column="name"
 */

const path  = require('path');
const https = require('https');
const fs    = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    });
  console.log('Loaded .env.local');
}

const XLSX = require('xlsx');

// ---------- Parse CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const COLUMN = (args.column ?? 'name').toLowerCase();
const BATCH  = 500;

// ---------- Resolve file ----------
function findXlsx() {
  if (args.file) return path.resolve(args.file);
  const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx'));
  if (!files.length) throw new Error('No .xlsx file found. Use --file=path/to/file.xlsx');
  console.log('Auto-detected:', files[0]);
  return path.resolve(files[0]);
}

// ---------- Simple HTTPS helper (no fetch needed) ----------
function httpsRequest(urlStr, options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data ? JSON.parse(data) : {});
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------- Main ----------
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  // Strip trailing slash
  const base = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  const apiBase = `${base}/rest/v1`;

  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  };

  // Read Excel
  const xlsxPath = findXlsx();
  const workbook = XLSX.readFile(xlsxPath);
  const sheet    = workbook.Sheets[workbook.SheetNames[0]];
  const json     = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const sampleKeys = Object.keys(json[0] ?? {});
  const key = sampleKeys.find(k => k.toLowerCase() === COLUMN);
  if (!key) {
    throw new Error(`Column "${COLUMN}" not found. Available: ${sampleKeys.join(', ')}`);
  }

  const names = json
    .map(row => String(row[key]).trim())
    .filter(n => n.length > 0);

  console.log(`Found ${names.length} names in column "${key}"`);

  // Clear existing rows
  console.log('Clearing existing doctors...');
  await httpsRequest(
    `${apiBase}/doctors?id=gt.0`,
    { method: 'DELETE', headers }
  );

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH).map(name => ({ name }));
    const body  = JSON.stringify(batch);

    await httpsRequest(
      `${apiBase}/doctors`,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body) } },
      body
    );

    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted} / ${names.length}...`);
  }

  console.log(`\n✓ Done. ${inserted} doctors seeded.`);
}

main().catch(err => {
  console.error('\nSeed failed:', err.message ?? err);
  process.exit(1);
});
