/**
 * Validación de emails con dos niveles:
 * 1. Sintáctico (RFC5322 básico)
 * 2. Dominio existe (verificar MX records)
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

const RFC5322_BASIC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const domainCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

/**
 * Validación básica de sintaxis de email (RFC5322 simplificado)
 * No verifica si el email realmente existe, solo que tiene formato válido
 */
export function isValidEmailSyntax(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return RFC5322_BASIC.test(trimmed) && trimmed.length <= 254;
}

/**
 * Verifica si el dominio del email existe (tiene registros MX o A de fallback según RFC 5321)
 * Async, timeout 2s para no bloquear
 */
export async function isValidEmailDomain(email: string): Promise<boolean> {
  if (!isValidEmailSyntax(email)) return false;

  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;

  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.valid;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS timeout')), 2000)
    );

    let isValid = false;
    try {
      const mxRecords = await Promise.race([
        resolveMx(domain),
        timeoutPromise
      ]);
      isValid = Array.isArray(mxRecords) && mxRecords.length > 0;
    } catch (mxErr: any) {
      // RFC 5321: Si no hay registro MX (ENODATA), comprobar registro A como fallback
      if (mxErr?.code === 'ENODATA') {
        try {
          const aRecords = await Promise.race([
            resolve4(domain),
            timeoutPromise
          ]);
          isValid = Array.isArray(aRecords) && aRecords.length > 0;
        } catch {
          isValid = false;
        }
      } else {
        isValid = false;
      }
    }

    domainCache.set(domain, { valid: isValid, timestamp: Date.now() });
    return isValid;
  } catch (err) {
    // Si la resolución DNS falla (ENOTFOUND, timeout, etc.), el dominio es inválido
    // No emitir console.warn para evitar falsos positivos en los logs de error del servidor
    if (process.env.DEBUG_EMAIL_VALIDATION === 'true') {
      console.debug(`[EmailValidator] Dominio no resoluble para ${email}:`, (err as Error).message);
    }
    domainCache.set(domain, { valid: false, timestamp: Date.now() });
    return false;
  }
}

/**
 * Validación combinada: sintaxis + dominio
 * Rápida si sintaxis falla (no hace DNS)
 */
export async function isValidEmail(email: string): Promise<boolean> {
  if (!isValidEmailSyntax(email)) return false;
  return isValidEmailDomain(email);
}

/**
 * Validación "live" para generación de pitches: sintaxis + dominio con caché
 * Usado en pitch generation para evitar generar pitches para emails inválidos
 */
export async function isValidEmailCached(email: string): Promise<boolean> {
  return isValidEmailDomain(email);
}
