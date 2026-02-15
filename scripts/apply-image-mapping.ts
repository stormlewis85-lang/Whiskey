/**
 * Apply manual image mapping to database.
 * Usage: npx tsx scripts/apply-image-mapping.ts
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const SPACES_CDN_ENDPOINT = process.env.SPACES_CDN_ENDPOINT ||
  `https://${process.env.SPACES_BUCKET || 'whiskeypedia-uploads'}.${process.env.SPACES_REGION || 'sfo3'}.cdn.digitaloceanspaces.com`;

const mapping: Record<number, string> = {
  105: 'bottles/bottle-1770484400641-225075660.webp',   // I = Old Forester 1920
  99:  'bottles/bottle-1770484502762-9696451.webp',     // J = Henry McKenna
  102: 'bottles/bottle-1770488455998-966906825.webp',   // M = Weller Antique 107
  103: 'bottles/bottle-1770488487901-173695412.webp',   // N = Weller Antique 107 (#2)
  109: 'bottles/bottle-1770488625679-475623830.webp',   // O = New Riff
  100: 'bottles/bottle-1770489286444-172051842.webp',   // P = Elijah Craig BP
  107: 'bottles/bottle-1770490904669-518608728.webp',   // Q = Jeffersons Ocean
  101: 'bottles/bottle-1770562254999-640788865.webp',   // R = Woodford Double Oaked
  108: 'bottles/bottle-1770563907273-616023048.webp',   // S = Russell's Reserve
};

// Whiskeys with no matching image — clear the broken path
const clearIds = [111, 113, 114];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('=== Applying Image Mapping ===\n');

  // Update matched whiskeys
  for (const [id, key] of Object.entries(mapping)) {
    const url = `${SPACES_CDN_ENDPOINT}/${key}`;
    const result = await pool.query(
      'UPDATE whiskeys SET image = $1 WHERE id = $2 RETURNING id, name, image',
      [url, parseInt(id)]
    );
    if (result.rows[0]) {
      console.log(`  ✓ [${result.rows[0].id}] ${result.rows[0].name}`);
      console.log(`    → ${result.rows[0].image}`);
    }
  }

  // Clear broken paths for unmatched whiskeys
  console.log('\n--- Clearing broken paths (no match) ---');
  for (const id of clearIds) {
    const result = await pool.query(
      'UPDATE whiskeys SET image = NULL WHERE id = $1 RETURNING id, name',
      [id]
    );
    if (result.rows[0]) {
      console.log(`  ✗ [${result.rows[0].id}] ${result.rows[0].name} → NULL (re-upload needed)`);
    }
  }

  // Verify
  console.log('\n--- Final state ---');
  const all = await pool.query(
    'SELECT id, name, image FROM whiskeys ORDER BY id'
  );
  for (const row of all.rows) {
    const status = row.image ? '✓' : '✗';
    console.log(`  ${status} [${row.id}] ${row.name}: ${row.image || '(no image)'}`);
  }

  await pool.end();
  console.log('\n=== Done ===');
}

main().catch(console.error);
