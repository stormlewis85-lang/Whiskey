import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// DigitalOcean Spaces configuration
const SPACES_REGION = process.env.SPACES_REGION || 'sfo3'; // San Francisco
const SPACES_BUCKET = process.env.SPACES_BUCKET || 'whiskeypedia-uploads';
const SPACES_ENDPOINT = `https://${SPACES_REGION}.digitaloceanspaces.com`;
const SPACES_CDN_ENDPOINT = process.env.SPACES_CDN_ENDPOINT || `https://${SPACES_BUCKET}.${SPACES_REGION}.cdn.digitaloceanspaces.com`;

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: SPACES_REGION,
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET_KEY || '',
  },
  forcePathStyle: false,
});

/**
 * Check if Spaces is configured
 */
export function isSpacesConfigured(): boolean {
  return !!(process.env.SPACES_ACCESS_KEY && process.env.SPACES_SECRET_KEY);
}

/**
 * Upload a file to DigitalOcean Spaces
 * @param filePath Local file path to upload
 * @param key The key (path) in the bucket
 * @param contentType MIME type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadToSpaces(
  filePath: string,
  key: string,
  contentType: string = 'image/webp'
): Promise<string> {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: SPACES_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
    // ACL handled by Space/CDN settings
  });

  await s3Client.send(command);

  // Return the CDN URL for faster access
  return `${SPACES_CDN_ENDPOINT}/${key}`;
}

/**
 * Delete a file from DigitalOcean Spaces
 * @param key The key (path) in the bucket to delete
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: SPACES_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Extract the key from a Spaces URL
 * @param url The full Spaces URL
 * @returns The key portion of the URL
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url) return null;

  // Handle CDN URLs: https://bucket.region.cdn.digitaloceanspaces.com/key
  // Handle direct URLs: https://region.digitaloceanspaces.com/bucket/key
  const cdnMatch = url.match(/cdn\.digitaloceanspaces\.com\/(.+)$/);
  if (cdnMatch) return cdnMatch[1];

  const directMatch = url.match(/digitaloceanspaces\.com\/[^/]+\/(.+)$/);
  if (directMatch) return directMatch[1];

  return null;
}

console.log('=== DigitalOcean Spaces Configuration ===');
console.log(`  Endpoint: ${SPACES_ENDPOINT}`);
console.log(`  Bucket: ${SPACES_BUCKET}`);
console.log(`  CDN: ${SPACES_CDN_ENDPOINT}`);
console.log(`  Configured: ${isSpacesConfigured() ? 'Yes' : 'No (missing credentials)'}`);
console.log('==========================================');
