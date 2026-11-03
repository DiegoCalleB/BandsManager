/**
 * La web del Máster de Marketing Digital vive en master-marketing-digital/web y se sirve bajo /master-marketing-digital.
 * Invariantes:
 *  · las URL antiguas de los ejercicios redirigen con 301 a la nueva;
 *  · la carpeta servida existe y trae el índice y los tres ejercicios;
 *  · el router monta el contenido estático bajo la base.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import router, { BASE_MASTER, CARPETA_MASTER, entradasMaster } from '../masterMarketingDigital';

function manejadorGet(ruta: string) {
  const capa = (router as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods.get);
  expect(capa, `falta la ruta ${ruta}`).toBeDefined();
  return capa.route.stack[capa.route.stack.length - 1].handle;
}

const REDIRECCIONES_MASTER: ReadonlyArray<readonly [string, string]> = [
  ['/ejercicio_youtube_crm', `${BASE_MASTER}/youtube-crm`],
  ['/ejercicio_youtube_crm.html', `${BASE_MASTER}/youtube-crm`],
  ['/ejercicio_branding', `${BASE_MASTER}/branding`],
  ['/ejercicio_branding.html', `${BASE_MASTER}/branding`],
  ['/ejercicio_facebook', `${BASE_MASTER}/facebook-clinica-dental`],
  ['/ejercicio_facebook.html', `${BASE_MASTER}/facebook-clinica-dental`],
];

describe('web del Máster de Marketing Digital', () => {
  it.each(REDIRECCIONES_MASTER)('%s redirige con 301 a %s', (antigua, nueva) => {
    let estado = 0;
    let destino = '';
    const res: any = { redirect: (code: number, url: string) => { estado = code; destino = url; } };
    manejadorGet(antigua)({}, res, () => {});
    expect(estado).toBe(301);
    expect(destino).toBe(nueva);
    expect(destino.startsWith(`${BASE_MASTER}/`)).toBe(true);
  });

  it('sirve la carpeta web con el índice y los ejercicios', () => {
    expect(CARPETA_MASTER()).toBe(path.join(process.cwd(), 'master-marketing-digital', 'web'));
    for (const archivo of ['index.html', 'youtube-crm.html', 'branding.html', 'facebook-clinica-dental.html']) {
      expect(fs.existsSync(path.join(CARPETA_MASTER(), archivo)), archivo).toBe(true);
    }
  });

  it('monta el contenido estático', () => {
    expect((router as any).stack.some((s: any) => s.name === 'serveStatic')).toBe(true);
  });

  it('el ejercicio de la clínica no se indexa y los otros dos sí', () => {
    const leer = (n: string) => fs.readFileSync(path.join(CARPETA_MASTER(), n), 'utf8');
    expect(leer('facebook-clinica-dental.html')).toContain('content="noindex,nofollow"');
    for (const n of ['index.html', 'youtube-crm.html', 'branding.html']) {
      expect(leer(n)).toContain('content="index,follow"');
      expect(leer(n)).toContain('rel="canonical"');
    }
  });

  it('el sitemap incluye el índice y los dos ejercicios indexables, no el de la clínica', () => {
    const locs = entradasMaster('https://bandmanager.io').map((e) => e.loc);
    expect(locs).toEqual([
      'https://bandmanager.io/master-marketing-digital/',
      'https://bandmanager.io/master-marketing-digital/youtube-crm',
      'https://bandmanager.io/master-marketing-digital/branding',
    ]);
  });
});
