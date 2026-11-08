// `state` firmado de los flujos OAuth por banda (Gmail, Instagram).
//
// La app autentica con Bearer en cabecera, no con cookies, y el callback del proveedor es una
// navegación del navegador sin cabecera nuestra: la banda viaja en el `state` firmado, no en la
// sesión. `state` = bandId.ts.nonce.firma. El nonce se guarda también en una cookie HttpOnly del
// navegador que inició el flujo: así el callback solo vale en ESE navegador (un `state` filtrado
// ya no permite a otro conectar su cuenta a la banda) y cada nonce se consume una sola vez.

import crypto from "crypto";
import type express from "express";

export const ESTADO_VALIDEZ_MS = 10 * 60 * 1000; // tiempo de sobra para completar el consentimiento

export function leerCookie(req: express.Request, nombre: string): string {
  const cabecera = String(req.headers.cookie || "");
  for (const trozo of cabecera.split(";")) {
    const [k, ...v] = trozo.trim().split("=");
    if (k === nombre) return v.join("=");
  }
  return "";
}

/**
 * La cookie del flujo (nonce) solo viaja al dominio donde se puso. Si el usuario empieza en un
 * dominio pero el proveedor le devuelve a la URL de retorno registrada (otro dominio), el callback
 * llega sin cookie y falla con un opaco «estado inválido». Devuelve el dominio donde hay que abrir
 * la app para que el flujo cierre, o null si ya coincide (o no se puede saber).
 */
export function dominioDeRetornoDistinto(hostPeticion: string | undefined, redirectUri: string | undefined): string | null {
  if (!hostPeticion || !redirectUri) return null;
  try {
    const esperado = new URL(redirectUri).hostname.toLowerCase();
    const actual = hostPeticion.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
    return esperado && actual && esperado !== actual ? esperado : null;
  } catch {
    return null;
  }
}

/**
 * Crea el firmador/verificador de `state` de un flujo OAuth. `proposito` entra en la firma: un
 * `state` de Gmail no vale para Instagram aunque compartan secreto (CRON_SECRET).
 *
 * La firma es HMAC-SHA256. CodeQL la marca como «hash de contraseña con esfuerzo insuficiente»
 * (falso positivo): no se hashea ninguna contraseña, el secreto es una clave del servidor de alta
 * entropía y HMAC con clave es el primitivo correcto para autenticar un mensaje.
 */
export function crearEstadoOAuth(proposito: string) {
  const noncesConsumidos = new Map<string, number>();

  const firma = (secreto: string, bandId: string, ts: string, nonce: string): string =>
    crypto.createHmac("sha256", secreto).update(`${proposito}:${bandId}:${ts}:${nonce}`).digest("hex").slice(0, 32);

  function firmar(bandId: string, nonce: string = crypto.randomBytes(16).toString("hex")): string {
    const secreto = process.env.CRON_SECRET;
    if (!secreto) {
      throw new Error(`Falta CRON_SECRET en el servidor: no se puede firmar el estado de OAuth (${proposito}).`);
    }
    const ts = Date.now().toString();
    return `${bandId}.${ts}.${nonce}.${firma(secreto, bandId, ts, nonce)}`;
  }

  function partesVerificadas(state: unknown): { bandId: string; nonce: string } | null {
    const secreto = process.env.CRON_SECRET;
    if (!secreto || typeof state !== "string") return null;

    const partes = state.split(".");
    if (partes.length !== 4) return null;
    const [bandId, ts, nonce, firmaRecibida] = partes;
    if (!bandId || !ts || !nonce || !firmaRecibida) return null;

    const edadMs = Date.now() - Number(ts);
    if (!Number.isFinite(edadMs) || edadMs < 0 || edadMs > ESTADO_VALIDEZ_MS) return null;

    const firmaEsperada = firma(secreto, bandId, ts, nonce);
    if (firmaEsperada.length !== firmaRecibida.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(firmaEsperada), Buffer.from(firmaRecibida))) return null;

    return { bandId, nonce };
  }

  /** band_id si la firma es válida y no ha caducado, o null. Nunca lanza: un estado inválido es un caso esperado. */
  function verificar(state: unknown): string | null {
    return partesVerificadas(state)?.bandId ?? null;
  }

  /** Valida el `state` del callback contra la cookie del navegador y lo consume (un solo uso). */
  function validarYConsumir(state: unknown, nonceCookie: string): string | null {
    const verificado = partesVerificadas(state);
    if (!verificado) return null;

    const a = Buffer.from(verificado.nonce);
    const b = Buffer.from(nonceCookie || "");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const ahora = Date.now();
    for (const [n, caduca] of noncesConsumidos) if (caduca < ahora) noncesConsumidos.delete(n);
    if (noncesConsumidos.has(verificado.nonce)) return null;
    noncesConsumidos.set(verificado.nonce, ahora + ESTADO_VALIDEZ_MS);

    return verificado.bandId;
  }

  return { firmar, verificar, validarYConsumir, estadoVerificable: (state: unknown) => partesVerificadas(state) !== null };
}
