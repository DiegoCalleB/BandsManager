/**
 * Verificación de la identidad de Google en el servidor.
 *
 * `/auth/google` recibía `email` y `uid` del cuerpo y abría sesión con ellos sin comprobar nada:
 * bastaba conocer el email de una cuenta (también la de un admin) para entrar. Ahora el servidor
 * le pregunta a Google por el access token que mandó el cliente y SOLO se fía de lo que Google
 * responde: email verificado, `sub` y que el token se emitió para NUESTRA aplicación.
 */
import fs from 'node:fs';
import path from 'node:path';

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

export interface IdentidadGoogle {
  email: string;
  sub: string;
}

export class GoogleVerifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleVerifyError';
  }
}

/** Client ID permitido: variable de entorno o el de firebase-applet-config.json (el mismo que usa el cliente). */
export function clientIdsPermitidos(): string[] {
  const ids = new Set<string>();
  for (const v of [process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID]) {
    if (v) v.split(',').forEach((x) => x.trim() && ids.add(x.trim()));
  }
  if (ids.size === 0) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
      if (cfg?.oAuthClientId) ids.add(String(cfg.oAuthClientId));
    } catch {
      /* sin fichero: se queda vacío y la verificación falla cerrada */
    }
  }
  return [...ids];
}

export async function verificarAccessTokenDeGoogle(
  accessToken: unknown,
  opciones: { emailDeclarado?: string; subDeclarado?: string; fetchImpl?: typeof fetch; clientIds?: string[] } = {}
): Promise<IdentidadGoogle> {
  if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 4096) {
    throw new GoogleVerifyError('Falta el token de Google');
  }
  const permitidos = opciones.clientIds ?? clientIdsPermitidos();
  if (permitidos.length === 0) throw new GoogleVerifyError('No hay GOOGLE_CLIENT_ID configurado');

  const f = opciones.fetchImpl ?? fetch;
  let respuesta: Response;
  try {
    respuesta = await f(`${TOKENINFO_URL}?access_token=${encodeURIComponent(accessToken)}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new GoogleVerifyError('No se pudo contactar con Google');
  }
  if (!respuesta.ok) throw new GoogleVerifyError('Google rechazó el token');

  const info: any = await respuesta.json().catch(() => null);
  if (!info) throw new GoogleVerifyError('Respuesta de Google no válida');

  const emitidoPara = String(info.aud || info.azp || '');
  if (!permitidos.includes(emitidoPara)) throw new GoogleVerifyError('El token no es de esta aplicación');

  const email = String(info.email || '').trim().toLowerCase();
  const verificado = info.email_verified === true || info.email_verified === 'true';
  if (!email || !verificado) throw new GoogleVerifyError('El email de Google no está verificado');

  const sub = String(info.sub || '');
  if (!sub) throw new GoogleVerifyError('Google no devolvió el identificador de la cuenta');

  if (opciones.emailDeclarado && opciones.emailDeclarado.trim().toLowerCase() !== email) {
    throw new GoogleVerifyError('El email no coincide con el del token');
  }
  if (opciones.subDeclarado && String(opciones.subDeclarado) !== sub) {
    throw new GoogleVerifyError('El identificador no coincide con el del token');
  }
  return { email, sub };
}
