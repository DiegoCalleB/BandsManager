// Capturas de la landing (public/landing/*.jpg) con la banda de ejemplo «Banda Demo».
//
// Antes se hacían a mano con datos de bandas reales, y la landing pública enseñaba sus logos y
// nombres. Ahora salen de la semilla neutra (scripts/landing/fixtures/, generada desde
// src/db_seed.ts), en claro y oscuro, escritorio y móvil, siempre en español.
//
// Uso: con el servidor de desarrollo en marcha (npm run dev),
//   node scripts/landing/capturar-landing.mjs [BASE_URL]
// Necesita el Chromium de Playwright (PLAYWRIGHT_CHROMIUM_EXECUTABLE si no está en la ruta por defecto).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(RAIZ, 'public/landing');
const FIX = path.join(RAIZ, 'scripts/landing/fixtures');
const DIA = 86_400_000;

/**
 * Las fechas de la semilla son fijas y envejecen. Se desplazan todas por igual para que el primer
 * concierto caiga hace una semana: la agenda y el calendario enseñan fechas próximas. El desfase se
 * calcula una vez, sobre los conciertos del estado, y se aplica a todas las fixtures.
 */
const DESFASE = (() => {
  const estado = JSON.parse(fs.readFileSync(path.join(FIX, 'state.json'), 'utf8'));
  const fechas = (estado.concerts || []).map((c) => Date.parse(c.fecha)).filter(Number.isFinite);
  return fechas.length ? Math.round((Date.now() - 7 * DIA - Math.min(...fechas)) / DIA) * DIA : 0;
})();
const desplazarFechas = (texto) =>
  texto.replace(/\b(20\d{2})-(\d{2})-(\d{2})(?=[T"])/g, (m) => new Date(Date.parse(m) + DESFASE).toISOString().slice(0, 10));
/** El usuario semilla de Diego lleva su email real: en una captura pública va uno de ejemplo. */
const sinEmailReal = (texto) => texto.replace(/diego\.delacalleb@gmail\.com/g, 'diego@banda-demo.example');
const fixture = (n) => sinEmailReal(desplazarFechas(fs.readFileSync(path.join(FIX, `${n}.json`), 'utf8')));

// Escritorio: el área principal sin la barra lateral (1040×800). Móvil: la pantalla entera.
const ESCRITORIO = { viewport: { width: 1280, height: 800 }, recorte: { x: 240, y: 0, width: 1040, height: 800 } };
const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 };

async function contexto(browser, tema, dispositivo) {
  const ctx = await browser.newContext({ locale: 'es-ES', ...(dispositivo === MOVIL ? MOVIL : { viewport: ESCRITORIO.viewport }) });
  await ctx.addInitScript(`try { localStorage.setItem('bm-tema', '${tema}'); localStorage.setItem('bandmanager_language', 'es'); } catch (e) {}`);
  await ctx.route('**/api/state', (r) => r.fulfill({ body: fixture('state'), contentType: 'application/json' }));
  for (const n of ['songs', 'setlists']) {
    await ctx.route(`**/api/${n}`, (r) => (r.request().method() === 'GET' ? r.fulfill({ body: fixture(n), contentType: 'application/json' }) : r.fallback()));
  }
  await ctx.route('**/api/auth/**', async (r) => {
    const res = await r.fetch();
    await r.fulfill({ response: res, body: sinEmailReal(await res.text()) });
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill(process.env.SEED_USER_PASSWORD || 'demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.getByText('Configurar más tarde').click({ timeout: 20000 }).catch(() => undefined);
  await page.getByText('Explorar por mi cuenta').click({ timeout: 3000 }).catch(() => undefined);
  return { ctx, page };
}

async function abrir(page, vista) {
  await page.goto(`${BASE}/?view=${vista}`);
  await page.waitForTimeout(2500);
  // Guías de primera visita y avisos: fuera de la captura.
  for (let i = 0; i < 3; i++) await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

async function guardar(page, nombre, recorte) {
  const destino = path.join(OUT, `${nombre}.jpg`);
  await page.screenshot({ path: destino, type: 'jpeg', quality: 82, ...(recorte ? { clip: recorte } : {}) });
  console.log('✓', path.relative(RAIZ, destino));
}

/** Escena «bandas»: el selector de banda abierto sobre el calendario. */
async function selectorDeBanda(page) {
  await abrir(page, 'calendario');
  await page.locator('h1', { hasText: 'Banda Demo' }).locator('visible=true').first().click();
  await page.getByText(/Quién toca hoy/).waitFor({ timeout: 8000 });
  await page.waitForTimeout(600);
}

/** Escena «hojas»: la vista previa de impresión del setlist, una hoja por músico. */
async function hojasPorMusico(page) {
  await abrir(page, 'repertorio');
  // Escritorio: «Imprimir setlist»; móvil: «Imprimir».
  await page.getByRole('button', { name: /^Imprimir( setlist)?$/i }).locator('visible=true').first().click();
  await page.frameLocator('iframe').locator('.sheet-page').first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
}


const ESCENAS = [
  { nombre: 'panel', movil: 'movil-panel', preparar: (p) => abrir(p, 'resumen') },
  { nombre: 'booking', movil: 'm-booking', preparar: (p) => abrir(p, 'booking') },
  { nombre: 'repertorio', movil: 'm-repertorio', preparar: (p) => abrir(p, 'repertorio') },
  // Lo usa el README del repositorio.
  { nombre: 'calendario', movil: 'm-calendario', preparar: (p) => abrir(p, 'calendario') },
  // Los modales se centran en la ventana entera: se capturan sin recortar la barra lateral.
  { nombre: 'bandas', movil: 'm-bandas', preparar: selectorDeBanda, sinRecorte: true },
  { nombre: 'hojas', movil: 'm-hojas', preparar: hojasPorMusico, sinRecorte: true },
];

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
for (const tema of ['light', 'dark']) {
  for (const dispositivo of [ESCRITORIO, MOVIL]) {
    const { ctx, page } = await contexto(browser, tema, dispositivo);
    for (const e of ESCENAS) {
      try {
        if (dispositivo === MOVIL) {
          await e.preparar(page);
          await guardar(page, `${e.movil}-${tema}`);
        } else {
          await e.preparar(page);
          await guardar(page, `${e.nombre}-${tema}`, e.sinRecorte ? undefined : ESCRITORIO.recorte);
        }
      } catch (err) {
        console.error('✗', e.nombre, tema, dispositivo === MOVIL ? 'móvil' : 'escritorio', String(err).split('\n')[0]);
        process.exitCode = 1;
      }
    }
    await ctx.close();
  }
}

// Página pública de fans (solo claro, como en la landing): arriba y tras desplazar.
{
  const ctx = await browser.newContext({ locale: 'es-ES', ...MOVIL });
  await ctx.addInitScript(`try { localStorage.setItem('bm-tema', 'light'); } catch (e) {}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/fans?band_id=band-demo`);
  await page.waitForTimeout(3500);
  await guardar(page, 'm-fanslanding-light');
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(800);
  await guardar(page, 'm-fanslanding-2-light');
  await ctx.close();
}
await browser.close();
