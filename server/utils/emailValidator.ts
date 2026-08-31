/**
 * Validación de emails con dos niveles:
 * 1. Sintáctico (RFC5322 básico)
 * 2. Dominio existe (verificar MX records)
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

const RFC5322_BASIC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Verifica si el dominio del email existe (tiene MX records)
 * Async, timeout 2s para no bloquear
 */
export async function isValidEmailDomain(email: string): Promise<boolean> {
  try {
    if (!isValidEmailSyntax(email)) return false;

    const domain = email.split('@')[1];
    if (!domain) return false;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS timeout')), 2000)
    );

    const mxRecords = await Promise.race([
      resolveMx(domain),
      timeoutPromise
    ]);

    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch (err) {
    // Si falla DNS (network error, timeout, etc), asumir que el dominio es inválido
    console.warn(`Email domain validation failed for ${email}:`, (err as Error).message);
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
const domainCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

export async function isValidEmailCached(email: string): Promise<boolean> {
  if (!isValidEmailSyntax(email)) return false;

  const domain = email.split('@')[1];
  if (!domain) return false;

  const cached = domainCache.get(domain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.valid;
  }

  try {
    const isValid = await isValidEmailDomain(email);
    domainCache.set(domain, { valid: isValid, timestamp: Date.now() });
    return isValid;
  } catch (err) {
    return false;
  }
}
