/**
 * Diagnostic script to check DO Spaces bucket contents and accessibility.
 * Usage: npx tsx scripts/diagnose-spaces.ts
 */

import 'dotenv/config';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';

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

async function diagnose() {
  console.log('=== DO Spaces Diagnostic ===');
  console.log(`Region: ${SPACES_REGION}`);
  console.log(`Bucket: ${SPACES_BUCKET}`);
  console.log(`Endpoint: ${SPACES_ENDPOINT}`);
  console.log(`CDN Endpoint: ${SPACES_CDN_ENDPOINT}`);
  console.log(`Credentials configured: ${!!(process.env.SPACES_ACCESS_KEY && process.env.SPACES_SECRET_KEY)}`);

  // Step 1: List ALL objects in the bucket
  console.log('\n--- All objects in bucket ---');
  try {
    const listAll = await s3Client.send(new ListObjectsV2Command({
      Bucket: SPACES_BUCKET,
      MaxKeys: 50,
    }));

    if (!listAll.Contents || listAll.Contents.length === 0) {
      console.log('  EMPTY - No objects found in bucket!');
    } else {
      console.log(`  Found ${listAll.Contents.length} objects (showing up to 50):`);
      for (const obj of listAll.Contents) {
        console.log(`  Key: ${obj.Key}  Size: ${obj.Size}  Modified: ${obj.LastModified}`);
      }
    }
  } catch (err: any) {
    console.error(`  ERROR listing objects: ${err.message}`);
  }

  // Step 2: List objects under bottles/ prefix
  console.log('\n--- Objects under bottles/ prefix ---');
  try {
    const listBottles = await s3Client.send(new ListObjectsV2Command({
      Bucket: SPACES_BUCKET,
      Prefix: 'bottles/',
      MaxKeys: 50,
    }));

    if (!listBottles.Contents || listBottles.Contents.length === 0) {
      console.log('  EMPTY - No objects under bottles/ prefix!');
    } else {
      console.log(`  Found ${listBottles.Contents.length} objects:`);
      for (const obj of listBottles.Contents) {
        console.log(`  Key: ${obj.Key}  Size: ${obj.Size}`);
      }
    }
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
  }

  // Step 3: List objects at root (no prefix, just bottle-* files)
  console.log('\n--- Objects at root (bottle-* without bottles/ prefix) ---');
  try {
    const listRoot = await s3Client.send(new ListObjectsV2Command({
      Bucket: SPACES_BUCKET,
      Prefix: 'bottle-',
      MaxKeys: 50,
    }));

    if (!listRoot.Contents || listRoot.Contents.length === 0) {
      console.log('  EMPTY - No bottle-* objects at root level');
    } else {
      console.log(`  Found ${listRoot.Contents.length} objects at root:`);
      for (const obj of listRoot.Contents) {
        console.log(`  Key: ${obj.Key}  Size: ${obj.Size}`);
      }
    }
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
  }

  // Step 4: Test HTTP accessibility of first image found
  console.log('\n--- Testing URL accessibility ---');
  try {
    const listAny = await s3Client.send(new ListObjectsV2Command({
      Bucket: SPACES_BUCKET,
      MaxKeys: 1,
    }));

    if (listAny.Contents && listAny.Contents.length > 0) {
      const key = listAny.Contents[0].Key!;

      // Check object metadata (ACL info via HeadObject)
      try {
        const head = await s3Client.send(new HeadObjectCommand({
          Bucket: SPACES_BUCKET,
          Key: key,
        }));
        console.log(`  Object "${key}" metadata:`);
        console.log(`    ContentType: ${head.ContentType}`);
        console.log(`    ContentLength: ${head.ContentLength}`);
      } catch (err: any) {
        console.error(`  HeadObject error: ${err.message}`);
      }

      // Test direct URL
      const directUrl = `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com/${key}`;
      console.log(`\n  Testing direct URL: ${directUrl}`);
      try {
        const resp = await fetch(directUrl, { method: 'HEAD' });
        console.log(`    Status: ${resp.status} ${resp.statusText}`);
        console.log(`    Headers: ${JSON.stringify(Object.fromEntries(resp.headers.entries()), null, 2)}`);
      } catch (err: any) {
        console.error(`    Fetch error: ${err.message}`);
      }

      // Test CDN URL
      const cdnUrl = `${SPACES_CDN_ENDPOINT}/${key}`;
      console.log(`\n  Testing CDN URL: ${cdnUrl}`);
      try {
        const resp = await fetch(cdnUrl, { method: 'HEAD' });
        console.log(`    Status: ${resp.status} ${resp.statusText}`);
        console.log(`    Headers: ${JSON.stringify(Object.fromEntries(resp.headers.entries()), null, 2)}`);
      } catch (err: any) {
        console.error(`    Fetch error: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error(`  ERROR: ${err.message}`);
  }

  console.log('\n=== Diagnostic Complete ===');
}

diagnose().catch(console.error);
