/**
 * Migration script to update database image paths from local /uploads/
 * to DigitalOcean Spaces CDN URLs.
 *
 * Prerequisites: Images must already exist in DO Spaces under bottles/ prefix.
 * This script ONLY rewrites database paths — it does not upload files.
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

  console.log('=== Migrate Image Paths to DO Spaces CDN ===');
  console.log(`CDN Endpoint: ${SPACES_CDN_ENDPOINT}`);

  // First, show what will be updated
  const preview = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image IS NOT NULL AND image LIKE '/uploads/%'"
  );

  if (preview.rowCount === 0) {
    console.log('\nNo local /uploads/ paths found in database. Nothing to migrate.');
    await pool.end();
    return;
  }

  console.log(`\nFound ${preview.rowCount} whiskeys with local image paths:\n`);
  for (const row of preview.rows) {
    const filename = row.image.replace('/uploads/', '');
    const newUrl = `${SPACES_CDN_ENDPOINT}/bottles/${filename}`;
    console.log(`  #${row.id} ${row.name}`);
    console.log(`    old: ${row.image}`);
    console.log(`    new: ${newUrl}`);
  }

  // Update whiskey image paths: /uploads/bottle-xxx.webp → CDN_URL/bottles/bottle-xxx.webp
  const result = await pool.query(
    `UPDATE whiskeys
     SET image = $1 || '/bottles/' || substring(image from '/uploads/(.*)$')
     WHERE image LIKE '/uploads/%'
     RETURNING id, name, image`,
    [SPACES_CDN_ENDPOINT]
  );

  console.log(`\nUpdated ${result.rowCount} whiskey image paths:`);
  for (const row of result.rows) {
    console.log(`  ✓ #${row.id} ${row.name} → ${row.image}`);
  }

  // Also update user profile images if any use local paths
  const profileResult = await pool.query(
    `UPDATE users
     SET profile_image = $1 || '/bottles/' || substring(profile_image from '/uploads/(.*)$')
     WHERE profile_image LIKE '/uploads/%'
     RETURNING id, username, profile_image`,
    [SPACES_CDN_ENDPOINT]
  );

  if (profileResult.rowCount && profileResult.rowCount > 0) {
    console.log(`\nUpdated ${profileResult.rowCount} user profile images:`);
    for (const row of profileResult.rows) {
      console.log(`  ✓ #${row.id} ${row.username} → ${row.profile_image}`);
    }
  }

  await pool.end();
  console.log('\n=== Migration Complete ===');
}

migrate().catch(console.error);
