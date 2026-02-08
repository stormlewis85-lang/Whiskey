/**
 * Migration script to upload existing images to DigitalOcean Spaces
 * and update the database paths.
 *
 * Usage: npx tsx scripts/migrate-images-to-spaces.ts
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Configuration - update these values
const SPACES_REGION = 'sfo3'; // San Francisco
const SPACES_BUCKET = 'whiskeypedia-uploads';
const SPACES_ACCESS_KEY = 'DO801EWVRQC6U33HFE9A';
const SPACES_SECRET_KEY = 'papHaViYnmLx6xFKglJnck6m9gNTn0zpS6QBmPosKeo';
const DATABASE_URL = 'postgresql://neondb_owner:npg_5Pz4MkrhaqGl@ep-still-snow-a5vhmgtk.us-east-2.aws.neon.tech/neondb?sslmode=require';

const SPACES_ENDPOINT = `https://${SPACES_REGION}.digitaloceanspaces.com`;
const SPACES_CDN_ENDPOINT = `https://${SPACES_BUCKET}.${SPACES_REGION}.cdn.digitaloceanspaces.com`;

const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: SPACES_ACCESS_KEY,
    secretAccessKey: SPACES_SECRET_KEY,
  },
  forcePathStyle: false,
});

async function uploadFile(filePath: string, key: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);

  // Determine content type
  const ext = filePath.toLowerCase().split('.').pop();
  const contentType = ext === 'webp' ? 'image/webp' :
                      ext === 'png' ? 'image/png' :
                      'image/jpeg';

  const command = new PutObjectCommand({
    Bucket: SPACES_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    // Note: ACL removed - make sure Space is set to public or configure CDN
  });

  await s3Client.send(command);
  return `${SPACES_CDN_ENDPOINT}/${key}`;
}

async function migrate() {
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Check if uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found. Nothing to migrate.');
    return;
  }

  // Get all image files
  const files = fs.readdirSync(uploadsDir).filter(f =>
    f.endsWith('.webp') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
  );

  if (files.length === 0) {
    console.log('No image files found in uploads directory.');
    return;
  }

  console.log(`Found ${files.length} images to migrate.`);

  // Connect to database
  const pool = new Pool({ connectionString: DATABASE_URL });

  const uploadedMap: Record<string, string> = {};

  // Upload each file to Spaces
  for (const file of files) {
    const localPath = path.join(uploadsDir, file);
    const spacesKey = `bottles/${file}`;

    try {
      console.log(`Uploading: ${file}...`);
      const spacesUrl = await uploadFile(localPath, spacesKey);
      uploadedMap[`/uploads/${file}`] = spacesUrl;
      console.log(`  ✓ Uploaded to: ${spacesUrl}`);
    } catch (error) {
      console.error(`  ✗ Failed to upload ${file}:`, error);
    }
  }

  // Update database records
  console.log('\nUpdating database records...');

  for (const [oldPath, newUrl] of Object.entries(uploadedMap)) {
    try {
      const result = await pool.query(
        'UPDATE whiskeys SET image = $1 WHERE image = $2 RETURNING id, name',
        [newUrl, oldPath]
      );

      if (result.rowCount && result.rowCount > 0) {
        for (const row of result.rows) {
          console.log(`  ✓ Updated whiskey #${row.id}: ${row.name}`);
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to update database for ${oldPath}:`, error);
    }
  }

  // Also update profile images
  for (const [oldPath, newUrl] of Object.entries(uploadedMap)) {
    try {
      const result = await pool.query(
        'UPDATE users SET profile_image = $1 WHERE profile_image = $2 RETURNING id, username',
        [newUrl, oldPath]
      );

      if (result.rowCount && result.rowCount > 0) {
        for (const row of result.rows) {
          console.log(`  ✓ Updated user profile #${row.id}: ${row.username}`);
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to update profile image for ${oldPath}:`, error);
    }
  }

  await pool.end();

  console.log('\n=== Migration Complete ===');
  console.log(`Uploaded ${Object.keys(uploadedMap).length} images to DigitalOcean Spaces.`);
  console.log('\nYou can now delete the local uploads folder if everything looks good.');
}

migrate().catch(console.error);
