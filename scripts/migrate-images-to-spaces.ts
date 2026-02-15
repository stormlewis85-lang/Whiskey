/**
 * Migration script to fix database image URLs for DigitalOcean Spaces.
 *
 * Fixes broken URLs like:
 *   https://whiskeypedia-uploads.sfo3.digitaloceanspaces.com/bottle-xxx.webp
 * To the correct CDN format:
 *   https://whiskeypedia-uploads.sfo3.cdn.digitaloceanspaces.com/bottles/bottle-xxx.webp
 *
 * Also handles /uploads/ local paths if any remain.
 *
 * Usage: npx tsx scripts/migrate-images-to-spaces.ts
 *
 * Required env vars: DATABASE_URL
 * Optional env vars: SPACES_REGION, SPACES_BUCKET, SPACES_CDN_ENDPOINT
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const SPACES_REGION = process.env.SPACES_REGION || 'sfo3';
const SPACES_BUCKET = process.env.SPACES_BUCKET || 'whiskeypedia-uploads';
const SPACES_CDN_ENDPOINT = process.env.SPACES_CDN_ENDPOINT ||
  `https://${SPACES_BUCKET}.${SPACES_REGION}.cdn.digitaloceanspaces.com`;

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL env var is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('=== Fix Image URLs for DO Spaces CDN ===');
  console.log(`Target CDN Endpoint: ${SPACES_CDN_ENDPOINT}`);

  // Step 1: Show current state of all image URLs
  const all = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image IS NOT NULL ORDER BY id LIMIT 10"
  );

  console.log(`\n--- Current image URLs (first 10) ---`);
  for (const row of all.rows) {
    console.log(`  #${row.id} ${row.name}`);
    console.log(`    ${row.image}`);
  }

  // Step 2: Fix URLs missing .cdn. and /bottles/ prefix
  // Pattern: https://bucket.region.digitaloceanspaces.com/filename
  // Target:  https://bucket.region.cdn.digitaloceanspaces.com/bottles/filename
  const directUrlPattern = `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com/%`;

  const brokenDirect = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image LIKE $1",
    [directUrlPattern]
  );

  if (brokenDirect.rowCount && brokenDirect.rowCount > 0) {
    console.log(`\n--- Found ${brokenDirect.rowCount} URLs with direct (non-CDN) format ---`);
    for (const row of brokenDirect.rows) {
      console.log(`  #${row.id} ${row.name}: ${row.image}`);
    }

    // Fix: replace region.digitaloceanspaces.com/filename
    //   with region.cdn.digitaloceanspaces.com/bottles/filename
    const oldPrefix = `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com/`;
    const newPrefix = `${SPACES_CDN_ENDPOINT}/bottles/`;

    const fixResult = await pool.query(
      `UPDATE whiskeys
       SET image = REPLACE(image, $1, $2)
       WHERE image LIKE $3
       RETURNING id, name, image`,
      [oldPrefix, newPrefix, directUrlPattern]
    );

    console.log(`\nFixed ${fixResult.rowCount} direct URLs:`);
    for (const row of fixResult.rows) {
      console.log(`  ✓ #${row.id} ${row.name} → ${row.image}`);
    }
  } else {
    console.log('\nNo direct (non-CDN) URLs found.');
  }

  // Step 3: Fix CDN URLs missing /bottles/ prefix
  // Pattern: https://bucket.region.cdn.digitaloceanspaces.com/bottle-xxx.webp (no /bottles/)
  const cdnNoPrefixPattern = `${SPACES_CDN_ENDPOINT}/bottle-%`;
  const cdnCorrectPattern = `${SPACES_CDN_ENDPOINT}/bottles/%`;

  const cdnNoPrefixRows = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image LIKE $1 AND image NOT LIKE $2",
    [cdnNoPrefixPattern, cdnCorrectPattern]
  );

  if (cdnNoPrefixRows.rowCount && cdnNoPrefixRows.rowCount > 0) {
    console.log(`\n--- Found ${cdnNoPrefixRows.rowCount} CDN URLs missing /bottles/ prefix ---`);

    const oldCdnBase = `${SPACES_CDN_ENDPOINT}/bottle-`;
    const newCdnBase = `${SPACES_CDN_ENDPOINT}/bottles/bottle-`;

    const fixCdnResult = await pool.query(
      `UPDATE whiskeys
       SET image = REPLACE(image, $1, $2)
       WHERE image LIKE $3 AND image NOT LIKE $4
       RETURNING id, name, image`,
      [oldCdnBase, newCdnBase, cdnNoPrefixPattern, cdnCorrectPattern]
    );

    console.log(`\nFixed ${fixCdnResult.rowCount} CDN URLs:`);
    for (const row of fixCdnResult.rows) {
      console.log(`  ✓ #${row.id} ${row.name} → ${row.image}`);
    }
  } else {
    console.log('\nNo CDN URLs missing /bottles/ prefix.');
  }

  // Step 4: Fix any remaining /uploads/ local paths
  const localPaths = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image LIKE '/uploads/%'"
  );

  if (localPaths.rowCount && localPaths.rowCount > 0) {
    console.log(`\n--- Found ${localPaths.rowCount} local /uploads/ paths ---`);

    const fixLocalResult = await pool.query(
      `UPDATE whiskeys
       SET image = $1 || '/bottles/' || substring(image from '/uploads/(.*)$')
       WHERE image LIKE '/uploads/%'
       RETURNING id, name, image`,
      [SPACES_CDN_ENDPOINT]
    );

    console.log(`\nFixed ${fixLocalResult.rowCount} local paths:`);
    for (const row of fixLocalResult.rows) {
      console.log(`  ✓ #${row.id} ${row.name} → ${row.image}`);
    }
  } else {
    console.log('\nNo local /uploads/ paths found.');
  }

  // Step 5: Final verification
  const verify = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image IS NOT NULL ORDER BY id"
  );

  console.log(`\n--- Final state: all image URLs ---`);
  let allCorrect = true;
  for (const row of verify.rows) {
    const isCorrect = row.image.startsWith(`${SPACES_CDN_ENDPOINT}/bottles/`);
    const status = isCorrect ? '✓' : '✗';
    if (!isCorrect) allCorrect = false;
    console.log(`  ${status} #${row.id} ${row.name}: ${row.image}`);
  }

  console.log(allCorrect
    ? '\n✓ All image URLs are in the correct CDN format!'
    : '\n✗ Some URLs still need manual review.');

  await pool.end();
  console.log('\n=== Migration Complete ===');
}

migrate().catch(console.error);
