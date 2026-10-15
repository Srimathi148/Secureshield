/**
 * Cryptographic utilities for SecureShield Graphical Password Authentication
 * Uses Web Crypto API (SubtleCrypto) for secure salted SHA-256 hashing.
 */

/**
 * Generate a cryptographically secure 16-byte random hex salt.
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes SHA-256 hex digest of a given string.
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a salted hash for recognition-based authentication.
 * Canonicalizes the selected items by sorting them alphabetically so order of selection does not matter.
 */
export async function hashRecognitionCredential(
  selectedItemIds: string[],
  salt: string
): Promise<string> {
  // Alphabetical sort for order-independent set matching
  const canonicalSet = [...selectedItemIds].sort().join('::');
  const payload = `REC_${canonicalSet}::SALT_${salt}`;
  return sha256(payload);
}

/**
 * Generates a salted hash for recall-based authentication.
 * Preserves the exact sequential order of the selected items.
 */
export async function hashRecallCredential(
  sequenceItemIds: string[],
  salt: string
): Promise<string> {
  // Preserve order for strict sequence matching
  const orderedSequence = sequenceItemIds.join('->');
  const payload = `SEQ_${orderedSequence}::SALT_${salt}`;
  return sha256(payload);
}

/**
 * Cryptographically random Fisher-Yates array shuffle.
 * Returns a new shuffled copy of the array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    // Generate secure random index
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
