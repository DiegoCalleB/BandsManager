import { test, type Page } from '@playwright/test';
import { abrirApp, irAEscritorio, irAMovil, cerrarModales, MOVIL } from './helpers-visual';
import { ESTADO_APP, CANCIONES, SETLISTS, RESPUESTA_EPK_PUBLICO, BANDAS_DISPONIBLES } from './fixtures/demoBand';

/**
 * Genera las capturas de la landing pública (public/landing/*.jpg) con la BANDA DE DEMO (e2e/fixtures/demoBand.ts):
 * datos ficticios y retratos ilustrados. No corre en la suite normal:
 *   LANDING_SHOTS=1 npx playwright test --project=visual landing-capturas
 */
test.skip(!process.env.LANDING_SHOTS, 'solo bajo demanda');
test.describe.configure({ timeout: 280_000 });

const OUT = 'public/landing';

async function simular(page: Page) {
  // Cuenta de demo con DOS bandas (Bakandeya y Ruta 66): se sustituye solo la lista de bandas de la sesión.
  await page.route('**/api/auth/me', async (r) => {
    const res = await r.fetch();
    const datos = await res.json();
    await r.fulfill({ response: res, json: { ...datos, availableBands: BANDAS_DISPONIBLES, multipleBands: true } });
  });
  await page.route('**/api/state*', (r) => r.fulfill({ json: ESTADO_APP }));
  await page.route('**/api/songs', (r) => r.fulfill({ json: { songs: CANCIONES } }));
  await page.route('**/api/setlists', (r) => r.fulfill({ json: { setlists: SETLISTS } }));
  await page.route('**/api/public/epk*', (r) => r.fulfill({ json: RESPUESTA_EPK_PUBLICO }));
}

for (const tema of ['light', 'dark'] as const) {
  test(`escritorio ${tema}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await simular(page);
    await abrirApp(page, false);
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    const foto = async (nombre: string) => { await page.waitForTimeout(800); await page.screenshot({ path: `${OUT}/${nombre}-${tema}.jpg`, type: 'jpeg', quality: 82, clip: { x: 240, y: 0, width: 1040, height: 800 } }); };
    await page.waitForTimeout(1200);
    await foto('panel');
    await irAEscritorio(page, 'booking'); await page.getByRole('button', { name: 'Detalles' }).first().click().catch(() => {}); await foto('booking');
    await irAEscritorio(page, 'calendario'); await foto('calendario');
    // «¿Quién toca hoy?»: la cuenta lleva Bakandeya y Ruta 66
    await page.locator('[title="Haz clic para cambiar de banda"]').first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/bandas-${tema}.jpg`, type: 'jpeg', quality: 82, clip: { x: 120, y: 0, width: 1040, height: 800 } });
    await page.keyboard.press('Escape');
    await cerrarModales(page);
    await page.waitForTimeout(300);
    await irAEscritorio(page, 'repertorio'); await foto('repertorio');
    // Setlist personalizado: notas de cada miembro bajo el tema…
    const fila = page.getByText('Calle Mayor').locator('visible=true').first();
    await fila.scrollIntoViewIfNeeded();
    await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent === 'Calle Mayor'); el?.scrollIntoView({ block: 'start' }); });
    await page.mouse.wheel(0, -90);
    await foto('miembros');
    // …y una hoja impresa por músico
    await page.getByRole('button', { name: 'Imprimir repertorio' }).first().click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/hojas-${tema}.jpg`, type: 'jpeg', quality: 82, clip: { x: 16, y: 18, width: 1248, height: 864 } });
    await page.keyboard.press('Escape');
    await cerrarModales(page);
    await irAEscritorio(page, 'fans');
    await page.getByRole('tab', { name: /3\. Dashboard/ }).first().click(); await foto('fans');
  });

  test(`movil ${tema}`, async ({ page }) => {
    await page.setViewportSize(MOVIL);
    await simular(page);
    await abrirApp(page, true);
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    const foto = async (nombre: string) => { await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/m-${nombre}-${tema}.jpg`, type: 'jpeg', quality: 82 }); };
    const barra = () => page.locator('nav[class*="bottom-0"]').last().locator('> button');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/movil-panel-${tema}.jpg`, type: 'jpeg', quality: 82 });
    await irAMovil(page, 'repertorio'); await foto('repertorio');
    await irAMovil(page, 'calendario'); await foto('calendario');
    await page.locator('[title="Toca para cambiar de banda"]').first().click();
    await page.getByText('Selector visual').first().click().catch(() => {});
    await foto('bandas');
    await page.keyboard.press('Escape');
    await page.reload(); await cerrarModales(page);
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Directorio/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);
    const esc = page.getByRole('button', { name: /^Escenarios/ }).first();
    if (await esc.isVisible().catch(() => false)) await esc.click();
    await cerrarModales(page); await foto('booking');
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /^Promoción/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(600); await cerrarModales(page);
    await barra().nth(4).click(); await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Captura QR/ }).first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1000); await cerrarModales(page);
    await page.getByRole('tab', { name: /3\. Dashboard/ }).first().click().catch(() => {});
    await foto('fans');
  });
}

// Páginas PÚBLICAS (las que ve un promotor o un fan): una sola captura, con su propio tema.
test('dossier público y landing de fans', async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('epk_language', 'es'); } catch { /* sin storage */ } });
  await simular(page);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/epk?band_id=bakandeya');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/epk-light.jpg`, type: 'jpeg', quality: 84 });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/epk-miembros-light.jpg`, type: 'jpeg', quality: 84 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/epk?band_id=bakandeya');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/m-epk-light.jpg`, type: 'jpeg', quality: 84 });

  await page.goto('/fans?band_id=bakandeya');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/m-fanslanding-light.jpg`, type: 'jpeg', quality: 84 });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/m-fanslanding-2-light.jpg`, type: 'jpeg', quality: 84 });
  await ctx.close();
});
