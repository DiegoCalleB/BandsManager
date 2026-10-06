/**
 * Band ID Hashing & Token Utility (Server-side)
 * Ofusca ids internos de banda (p. ej. 'band-bakandeya') en tokens de URL cortos y limpios para
 * las páginas públicas de EPK y fans.
 *
 * ⚠️ NO ES UN SECRETO NI UN CONTROL DE ACCESO. Es un XOR con una constante que está en el código
 * (y en el bundle del cliente): cualquiera que conozca el id de una banda calcula su token, y
 * cualquiera que vea un token recupera el id. Sirve solo para que las URLs públicas no enseñen el
 * id en claro. Prohibido usarlo para autorizar nada: eso va con tokens firmados (HMAC) como los de
 * `server/utils/trackingSeguro.ts`.
 */

const SALT = 'bandmanager_secure_salt_2025';

/**
 * Encodes a band ID into an obfuscated alphanumeric token.
 */
export function encodeBandId(rawBandId: string): string {
  if (!rawBandId || !rawBandId.trim()) return '';
  const cleanId = rawBandId.trim().toLowerCase();
  
  try {
    const bytes = Buffer.from(cleanId, 'utf8');
    const saltBytes = Buffer.from(SALT, 'utf8');
    const xored = Buffer.alloc(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      xored[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    }
    const b64 = xored.toString('base64url');
    return `t_${b64}`;
  } catch {
    return cleanId;
  }
}

/**
 * Decodes an obfuscated token back to the band ID.
 */
export function decodeBandId(tokenOrId: string): string {
  if (!tokenOrId || !tokenOrId.trim()) return '';
  const str = tokenOrId.trim();

  if (str.startsWith('t_')) {
    try {
      const rawB64 = str.substring(2);
      const xored = Buffer.from(rawB64, 'base64url');
      const saltBytes = Buffer.from(SALT, 'utf8');
      const unxored = Buffer.alloc(xored.length);
      for (let i = 0; i < xored.length; i++) {
        unxored[i] = xored[i] ^ saltBytes[i % saltBytes.length];
      }
      const decoded = unxored.toString('utf8');
      if (decoded && decoded.length > 0) return decoded;
    } catch {
      // Fallback
    }
  }

  // Backward compatibility: If plain string passed (e.g. 'band-bakandeya' or 'bakandeya')
  return str;
}

/**
 * Generates the official public EPK URL with a hashed token.
 */
export function getHashedPublicEpkUrl(bandId: string, baseUrl = 'https://bandmanager.io'): string {
  const token = encodeBandId(bandId);
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/epk?b=${token}`;
}

/**
 * Generates the official public Fans Landing URL with a hashed token.
 */
export function getHashedPublicFansUrl(bandId: string, baseUrl = 'https://bandmanager.io'): string {
  const token = encodeBandId(bandId);
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/unete?b=${token}`;
}
