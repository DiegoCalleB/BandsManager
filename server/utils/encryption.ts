import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('⚠️  ENCRYPTION_KEY no configurada — credenciales de email se guardarán sin cifrar (solo en local/test)');
}

/**
 * Cifra un string con AES-256-GCM.
 * Devuelve formato: "iv.authTag.ciphertext" en base64 para almacenamiento.
 */
export function encryptCredential(plaintext: string): string {
  if (!ENCRYPTION_KEY) {
    // Fallback para local/test sin clave configurada
    return plaintext;
  }

  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32); // Normalizar clave a 256 bits
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Formato: "iv.authTag.ciphertext" en base64 para portabilidad
  const combined = `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted}`;
  return Buffer.from(combined).toString('base64');
}

/**
 * Descifra credencial en formato "iv.authTag.ciphertext" base64.
 * Si falla, devuelve null y loguea el error (no es una credencial válida).
 */
export function decryptCredential(encrypted: string): string | null {
  if (!ENCRYPTION_KEY) {
    // Si no hay clave, asumir que el texto está en claro (local/test)
    return encrypted;
  }

  try {
    const combined = Buffer.from(encrypted, 'base64').toString('hex');
    const parts = combined.split('.');
    if (parts.length !== 3) {
      console.error('Formato de credencial cifrada inválido');
      return null;
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    console.error('Error descifrando credencial:', e instanceof Error ? e.message : e);
    return null;
  }
}
