import fs from 'fs';
import path from 'path';
import type { Page } from '@playwright/test';

// Playwright corre desde la raíz del repo: la ruta es relativa a ella.
export const FIXTURES = path.join(process.cwd(), 'e2e', 'fixtures', 'cartel');
const CDN = 'https://x.supabase.co/storage/v1/object/public/band-media/carteles/band-demo';
const CORS = { 'access-control-allow-origin': '*' };

export interface PeticionCartel {
  metodo: string;
  ruta: string;
  tipo?: string;
  cuerpo: Buffer;
}

/**
 * Entra con el usuario semilla, simula los bolos y el servidor de carteles y abre Cartelería a
 * ~390 px (móvil primero, AGENTS.md §6). `servidor.config` es lo que el «servidor» tiene en `cartel_config`.
 */
export interface OpcionesCarteleria {
  compartido?: boolean;
  estadoEstatico?: boolean;
  /** Un segundo bolo, posterior, que ya tiene cartel publicado (se ofrece como referencia). */
  conCartelAnterior?: boolean;
  /** La banda tiene logo y plantilla de dossier «neon»: su ADN visual automático. */
  conLogo?: boolean;
}

export const URL_CDN = CDN;

export async function abrirCarteleria(page: Page, { compartido = false, estadoEstatico = false, conCartelAnterior = false, conLogo = false }: OpcionesCarteleria = {}) {
  const peticiones: PeticionCartel[] = [];
  const servidor = { config: null as unknown, logos: [] as string[], adn: { v: 1, referencias: [] as string[], favoritos: [] as Array<{ url: string; estilo: string }>, aprender: true } };
  let banda: string | undefined;

  page.on('response', async (res) => {
    if (!res.url().includes('/api/auth/') || !res.ok()) return;
    const j = await res.json().catch(() => null);
    banda = banda || j?.user?.band_id;
  });

  await page.route('**/api/state', async (route) => {
    const r = await route.fetch();
    const j = await r.json().catch(() => ({}));
    delete j.error;
    const base = { cache: 300, aforo_vendido: 0, aforo_total: 200, contrato_firmado: true, estado_pago: 'pendiente', notas: '', tipo: 'sala', band_id: banda };
    j.concerts = [
      {
        ...base, id: 'e2e-c1', fecha: '2099-11-14', sala: 'Sala El Sol', ciudad: 'Madrid', direccion: 'C/ de los Jardines 3',
        logisticaTecnica: { horaAperturaPuertas: '20:30', horaShow: '21:30' },
        ...(compartido ? { bandas_compartidas: ['Otra Banda'] } : {}),
        // Estático: el «servidor» sigue devolviendo el bolo sin cartel, así que solo la copia en memoria de la app puede recordarlo.
        cartel_config: estadoEstatico ? null : servidor.config,
      },
      ...(conCartelAnterior ? [{ ...base, id: 'e2e-ant', fecha: '2099-12-20', sala: 'Moby Dick', ciudad: 'Madrid', cartel_url: `${CDN}/e2e-ant.png?v=1` }] : []),
    ];
    if (conLogo) j.epkConfig = { ...(j.epkConfig || {}), logoUrl: 'https://logo.test/logo.png', plantilla: 'neon', genero: 'Punk' };
    await route.fulfill({ status: 200, json: j });
  });
  // Imágenes del «almacenamiento» y del logo, con CORS como el bucket real: sin él el canvas no exporta.
  await page.route('https://logo.test/**', (r) => r.fulfill({ body: fs.readFileSync(path.join(FIXTURES, 'logo.png')), contentType: 'image/png', headers: CORS }));
  await page.route(`${CDN}/**`, (r) => {
    const url = r.request().url();
    const fichero = url.includes('/ia-') ? 'fondo-ia.png' : url.includes('-logo-') ? 'logo.png' : 'ref.jpg';
    return r.fulfill({ body: fs.readFileSync(path.join(FIXTURES, fichero)), contentType: fichero.endsWith('.png') ? 'image/png' : 'image/jpeg', headers: CORS });
  });
  await page.route('**/api/short-links', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ json: { code: 'ab3k9x2', url: 'https://bandmanager.io/r/ab3k9x2', creado: false } })
      : route.fallback());
  await page.route('**/api/cartel/**', async (route) => {
    const req = route.request();
    const ruta = new URL(req.url()).pathname;
    const cuerpo = req.postDataBuffer() ?? Buffer.alloc(0);
    peticiones.push({ metodo: req.method(), ruta, tipo: req.headers()['content-type'], cuerpo });
    if (ruta.endsWith('/cartel/adn')) {
      if (req.method() === 'PUT') servidor.adn = JSON.parse(cuerpo.toString());
      return route.fulfill({ json: { adn: servidor.adn } });
    }
    if (ruta.endsWith('/referencias')) {
      const url = `${CDN}/ref/${servidor.adn.referencias.length + 1}.jpg?v=1`;
      servidor.adn = { ...servidor.adn, referencias: [...servidor.adn.referencias, url].slice(-3) };
      return route.fulfill({ json: { url, adn: servidor.adn } });
    }
    if (ruta.endsWith('/logo')) {
      if (req.method() === 'POST') {
        const url = `${CDN}/e2e-c1-logo-${servidor.logos.length + 1}.png?v=1`;
        servidor.logos.push(url);
        return route.fulfill({ json: { url, logos: [...servidor.logos] } });
      }
      const { url } = JSON.parse(cuerpo.toString());
      servidor.logos = servidor.logos.filter((u) => u !== url);
      return route.fulfill({ json: { logos: servidor.logos } });
    }
    if (ruta.endsWith('/cartel/idea')) return route.fulfill({ json: { ok: true } });
    if (ruta.endsWith('/cartel/brief')) {
      return route.fulfill({
        json: { brief: { scene: 'a winged guitar over a desert road', mood: '1970s, low sun', palette: 'rust red and cream', avoid: 'people', composition: '' }, traducido: true, conBoceto: false },
      });
    }
    if (ruta.endsWith('/cartel/fondo')) {
      return route.fulfill({ json: { url: `${CDN}/ia-1.png?v=1`, estilo: JSON.parse(cuerpo.toString()).estilo, referencias: servidor.adn.referencias.length } });
    }
    if (ruta.endsWith('/cartel/retocar')) {
      return route.fulfill({ json: { url: `${CDN}/ia-2.png?v=1`, conTexto: false, textoOk: true } });
    }
    if (ruta.endsWith('/config')) {
      servidor.config = JSON.parse(cuerpo.toString());
      return route.fulfill({ json: { config: servidor.config } });
    }
    return route.fulfill({ json: { url: 'https://x.supabase.co/storage/v1/object/public/band-media/carteles/b/e2e-c1.png?v=1' } });
  });

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  // Con los bolos simulados el asistente de configuración puede no salir: es opcional.
  await page.getByText('Configurar más tarde').click({ timeout: 8_000 }).catch(() => {});
  await page.getByText('Explorar por mi cuenta').click({ timeout: 3_000 }).catch(() => {});
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=carteleria');
  await page.getByRole('tab', { name: 'Feed' }).waitFor({ timeout: 20_000 });
  return { peticiones, servidor };
}
