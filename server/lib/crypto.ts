/**
 * Application-level encryption for sensitive data at rest (e.g., OAuth tokens).
 * Uses AES-256-GCM with a random IV per encryption.
 * Requires OAUTH_ENCRYPTION_KEY env var (32-byte hex string).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
  const key = process.env.OAUTH_ENCRYPTION_KEY;
  if (!key) return null;
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string. Returns "iv:authTag:ciphertext" in hex.
 * If no encryption key is configured, returns the plaintext unchanged.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string (format: "iv:authTag:ciphertext").
 * If the value doesn't look encrypted (no colons), returns it as-is
 * for backwards compatibility with existing plaintext tokens.
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  if (!key) return encryptedText;

  // Backwards compatibility: if it doesn't match our format, it's plaintext
  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;

  const [ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if encryption is configured.
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.OAUTH_ENCRYPTION_KEY;
}
