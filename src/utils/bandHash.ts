/**
 * Band ID Hashing & Token Utility (Client-side)
 * Generates and parses obfuscated URLs for public EPK and Fans landing pages
 * so that raw database IDs ('band-demo', 'reg-1729...') are never exposed in links.
 */

const SALT = 'bandmanager_secure_salt_2025';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Encodes a band ID into an obfuscated alphanumeric token.
 */
export function encodeBandIdClient(rawBandId: string): string {
  if (!rawBandId || !rawBandId.trim()) return '';
  const cleanId = rawBandId.trim().toLowerCase();

  try {
    const bytes = new TextEncoder().encode(cleanId);
    const saltBytes = new TextEncoder().encode(SALT);
    const xored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      xored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    // Convert to URL-safe base64
    let binary = '';
    xored.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `t_${b64}`;
  } catch {
    return cleanId;
  }
}

/**
 * Decodes an obfuscated token back to the band ID.
 */
export function decodeBandIdClient(tokenOrId: string): string {
  if (!tokenOrId || !tokenOrId.trim()) return '';
  const str = tokenOrId.trim();

  if (str.startsWith('t_')) {
    try {
      const b64 = str.substring(2).replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const saltBytes = new TextEncoder().encode(SALT);
      const unxored = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        unxored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
      }
      const decoded = new TextDecoder().decode(unxored);
      if (decoded && decoded.length > 0) return decoded;
    } catch {
      // Fallback
    }
  }

  return str;
}

/**
 * Resolves the band ID from the current browser URL query parameters.
 * Checks 'b', 'token', 't', 'band_id', 'band' and automatically decodes tokens.
 */
export function extractBandIdFromUrl(searchParams?: string): string {
  const search = searchParams !== undefined ? searchParams : typeof window !== 'undefined' ? window.location.search : '';

  const params = new URLSearchParams(search);
  const rawParam = params.get('b') || params.get('token') || params.get('t') || params.get('band_id') || params.get('band') || '';

  if (!rawParam) return '';
  return decodeBandIdClient(rawParam);
}

/**
 * Generates the official public EPK URL with a hashed token.
 */
export function getPublicEpkUrl(bandId: string, origin?: string): string {
  if (!bandId) return '';
  const token = encodeBandIdClient(bandId);
  const base =
    origin && !origin.includes('run.app') && !origin.includes('localhost')
      ? `${origin.replace(/\/+$/, '')}/epk`
      : 'https://bandmanager.io/epk';

  return `${base}?b=${encodeURIComponent(token)}`;
}

/**
 * Generates the official public Fans Landing URL with a hashed token.
 */
export function getPublicFansUrl(bandId: string, origin?: string): string {
  if (!bandId) return '';
  const token = encodeBandIdClient(bandId);
  const base =
    origin && !origin.includes('run.app') && !origin.includes('localhost')
      ? `${origin.replace(/\/+$/, '')}/unete`
      : 'https://bandmanager.io/unete';

  return `${base}?b=${encodeURIComponent(token)}`;
}

/**
 * Generates the official public Deal URL with the deal token.
 */
export function getPublicDealUrl(dealToken: string, origin?: string): string {
  if (!dealToken) return '';
  const base =
    origin && !origin.includes('run.app') && !origin.includes('localhost')
      ? `${origin.replace(/\/+$/, '')}/deal`
      : 'https://bandmanager.io/deal';

  return `${base}/${encodeURIComponent(dealToken)}`;
}
