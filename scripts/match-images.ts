/**
 * Lists whiskeys needing images and available Spaces files for manual matching.
 * Usage: npx tsx scripts/match-images.ts
 */

import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const SPACES_REGION = process.env.SPACES_REGION || 'sfo3';
const SPACES_BUCKET = process.env.SPACES_BUCKET || 'whiskeypedia-uploads';
const SPACES_ENDPOINT = `https://${SPACES_REGION}.digitaloceanspaces.com`;
const SPACES_CDN_ENDPOINT = process.env.SPACES_CDN_ENDPOINT ||
  `https://${SPACES_BUCKET}.${SPACES_REGION}.cdn.digitaloceanspaces.com`;

const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET_KEY || '',
  },
  forcePathStyle: false,
});

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Get all whiskeys with images
  const whiskeys = await pool.query(
    "SELECT id, name, image FROM whiskeys WHERE image IS NOT NULL ORDER BY id"
  );

  console.log('=== WHISKEYS NEEDING IMAGES ===\n');
  for (const row of whiskeys.rows) {
    console.log(`  [${row.id}] ${row.name}`);
  }

  // Get all Spaces files
  const list = await s3Client.send(new ListObjectsV2Command({
    Bucket: SPACES_BUCKET,
    Prefix: 'bottles/',
    MaxKeys: 100,
  }));

  console.log('\n=== AVAILABLE IMAGES IN SPACES ===\n');
  if (list.Contents) {
    list.Contents.forEach((obj, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C...
      const url = `${SPACES_CDN_ENDPOINT}/${obj.Key}`;
      console.log(`  [${letter}] ${url}`);
    });
  }

  console.log('\n=== INSTRUCTIONS ===');
  console.log('Open each image URL in your browser to see what it is.');
  console.log('Then tell me the mapping, e.g.: 99=A, 100=C, 101=B, ...');

  await pool.end();
}

main().catch(console.error);
