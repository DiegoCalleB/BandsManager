import crypto from "node:crypto";

// Cifrado en reposo (AES-256-GCM) para credenciales de terceros guardadas en Supabase
// (app_password SMTP/IMAP, refresh_token de Gmail). La clave vive fuera de la BD:
// CREDENTIALS_ENCRYPTION_KEY = 32 bytes en base64 (`openssl rand -base64 32`).
// Formato guardado: "enc:v1:<iv>:<tag>:<ciphertext>" (base64). Un valor sin ese prefijo se
// trata como texto plano heredado, así que la migración es transparente: se lee igual y se
// cifra la próxima vez que se escribe (o con scripts/encrypt-existing-credentials.ts).

const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY debe ser 32 bytes en base64 (openssl rand -base64 32)");
  }
  return key;
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  if (isEncryptedSecret(plain)) return plain;
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falta CREDENTIALS_ENCRYPTION_KEY: no se guardan credenciales sin cifrar en producción");
    }
    console.warn("CREDENTIALS_ENCRYPTION_KEY no definida: credencial guardada SIN cifrar (solo permitido fuera de producción)");
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  if (!isEncryptedSecret(stored)) return stored;
  const key = getKey();
  if (!key) throw new Error("Credencial cifrada pero falta CREDENTIALS_ENCRYPTION_KEY");
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}
