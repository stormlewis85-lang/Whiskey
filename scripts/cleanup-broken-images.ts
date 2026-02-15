/**
 * Cleanup script to null out broken /uploads/ image paths in the database.
 * These paths pointed to local files that no longer exist after deployment.
 *
 * Usage: npx tsx scripts/cleanup-broken-images.ts
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function cleanup() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Find whiskeys with /uploads/ paths
    const findWhiskeys = await pool.query(
      "SELECT id, name, image FROM whiskeys WHERE image LIKE '/uploads/%'"
    );

    console.log(`Found ${findWhiskeys.rowCount} whiskeys with local /uploads/ image paths:\n`);

    for (const row of findWhiskeys.rows) {
      console.log(`  #${row.id}: ${row.name} -> ${row.image}`);
    }

    if (findWhiskeys.rowCount && findWhiskeys.rowCount > 0) {
      const updateWhiskeys = await pool.query(
        "UPDATE whiskeys SET image = NULL WHERE image LIKE '/uploads/%'"
      );
      console.log(`\nCleared ${updateWhiskeys.rowCount} whiskey image paths.`);
    }

    // Also check user profile images
    const findProfiles = await pool.query(
      "SELECT id, username, profile_image FROM users WHERE profile_image LIKE '/uploads/%'"
    );

    if (findProfiles.rowCount && findProfiles.rowCount > 0) {
      console.log(`\nFound ${findProfiles.rowCount} users with local profile image paths:`);
      for (const row of findProfiles.rows) {
        console.log(`  #${row.id}: ${row.username} -> ${row.profile_image}`);
      }

      await pool.query(
        "UPDATE users SET profile_image = NULL WHERE profile_image LIKE '/uploads/%'"
      );
      console.log(`Cleared ${findProfiles.rowCount} user profile image paths.`);
    }

    console.log('\nDone. Users can re-upload images through the app.');
  } finally {
    await pool.end();
  }
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
