import { test, expect, type Page } from '@playwright/test';
import { RUTA66_SETLIST, RUTA66_SONGS } from './fixtures/setlistRuta66';

// Qué protege: el setlist impreso. Cada vez que se rompió (fuentes sin cargar, reglas CSS que no
// llegaban al iframe de medición, títulos cortados con "…", un encabezado de bloque perdido en el
// corte entre hojas) lo vimos mirando un PDF a ojo. Este test imprime un set realista (25 temas,
// ver fixtures/setlistRuta66.ts) en varias configuraciones y comprueba INVARIANTES sobre el HTML
// resultante, no un pixel concreto: no desborda la hoja, ningún título lleva "…", están todos los
// temas, ningún bloque queda colgando al final y no sale basura de datos.
//
// Los datos se inyectan interceptando /api/songs y /api/setlists: la app no se toca.

test.use({ viewport: { width: 1400, height: 1000 } });
test.setTimeout(300_000);

async function abrirModalDeImpresion(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __htmls: string[] }).__htmls = [];
    window.print = () => {};
    window.open = () => {
      const buf: string[] = [];
      return {
        document: {
          write: (h: string) => buf.push(h),
          open: () => { buf.length = 0; },
          close: () => (window as unknown as { __htmls: string[] }).__htmls.push(buf.join('')),
        },
        close() {},
        print() {},
      } as unknown as Window;
    };
  });
  await page.route('**/api/songs', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: { songs: RUTA66_SONGS } }) : route.fallback());
  await page.route('**/api/setlists', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: { setlists: [RUTA66_SETLIST] } }) : route.fallback());

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByText('Log in').first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('bakandeya2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  // El primer login abre el asistente de configuración: se salta y se navega por el menú lateral
  // (grupo "Música" > "Setlists"). A veces aparece además la pantalla "por dónde empezar".
  await page.getByText('Configurar más tarde').click({ timeout: 20_000 });
  await page.getByText('Explorar por mi cuenta').click({ timeout: 3_000 }).catch(() => {});
  await page.getByText('Música', { exact: true }).first().click();
  await page.getByText('Setlists').first().click();
  await page.locator('#btn-print-setlist-header').waitFor({ timeout: 20_000 });
  await page.locator('#btn-print-setlist-header').click();
  await page.waitForSelector('iframe[title="Vista previa del setlist impreso"]', { timeout: 30_000 });
}

async function imprimir(page: Page): Promise<string> {
  const antes = await page.evaluate(() => (window as unknown as { __htmls: string[] }).__htmls.length);
  await page.getByRole('button', { name: /Imprimir para/ }).click();
  await page.waitForFunction(
    (n) => (window as unknown as { __htmls: string[] }).__htmls.length > n,
    antes,
    { timeout: 60_000 },
  );
  return page.evaluate(() => (window as unknown as { __htmls: string[] }).__htmls.at(-1) as string);
}

// Invariantes sobre el documento de impresión, evaluados en un navegador real.
async function comprobarInvariantes(page: Page, html: string, etiqueta: string) {
  const visor = await page.context().newPage();
  await visor.setContent(html.replace(/<script>[\s\S]*<\/script>/, ''), { waitUntil: 'load' });
  await visor.evaluate(() => document.fonts.ready);
  const r = await visor.evaluate(() => {
    const A4_SHEET_PX = (272 * 96) / 25.4; // alto útil de .sheet-page (ver PAGE_SHEET_HEIGHT_MM)
    const hojas = [...document.querySelectorAll<HTMLElement>('.sheet-page')];
    const titulos = [...document.querySelectorAll('.song-title')].map((e) => e.textContent ?? '');
    const colgando: string[] = [];
    for (const cont of document.querySelectorAll('.setlist-items-container')) {
      const ultimo = cont.lastElementChild;
      if (ultimo && /block-divider-item|bis-divider-item/.test(ultimo.className)) colgando.push(ultimo.textContent ?? '');
    }
    return {
      hojas: hojas.length,
      desbordes: hojas.map((h) => Math.round(h.getBoundingClientRect().height - A4_SHEET_PX)).filter((d) => d > 6),
      sinPie: hojas.filter((h) => !h.querySelector('.page-footer')).length,
      titulosCortados: titulos.filter((t) => t.includes('…')),
      temas: document.querySelectorAll('.setlist-song-item').length,
      texto: document.body.innerText,
      colgando,
    };
  });
  await visor.close();

  expect(r.desbordes, `${etiqueta}: hojas que se pasan del alto útil (px)`).toEqual([]);
  expect(r.titulosCortados, `${etiqueta}: títulos cortados con "…"`).toEqual([]);
  expect(r.colgando, `${etiqueta}: bloques colgando al final de una columna/hoja`).toEqual([]);
  // 5 músicos por defecto x 25 temas: no se pierde ninguno en el reparto entre hojas.
  expect(r.temas, `${etiqueta}: temas impresos`).toBe(25 * 5);
  expect(r.texto, `${etiqueta}: basura de datos importada`).not.toMatch(/Versión Original|EDITADA/i);
  expect(r.texto, `${etiqueta}: nombre con paréntesis repetido`).not.toMatch(/\(SETLIST PERFECTO\)\s*\(SETLIST PERFECTO\)/i);
  return r;
}

test('el setlist impreso cumple sus invariantes en las configuraciones principales', async ({ page }) => {
  await abrirModalDeImpresion(page);
  await page.getByLabel('Tono').check();
  await page.getByLabel('BPM', { exact: true }).check();
  const hojas = page.getByLabel('Número de hojas');

  // 1. Todo en automático, izquierda.
  const auto = await comprobarInvariantes(page, await imprimir(page), 'auto/izquierda');
  // 25 temas están en el límite de la letra mínima legible: 1 o 2 hojas por músico, no más.
  expect(auto.hojas, 'auto: hojas por músico').toBeLessThanOrEqual(5 * 2);

  // 2. Centrado en automático.
  await page.getByRole('button', { name: 'Centrado' }).click();
  await comprobarInvariantes(page, await imprimir(page), 'auto/centrado');

  // 3. Dos columnas, 1 hoja impuesta, centrado.
  await page.locator('button[title^="Dos columnas"]').click();
  await hojas.selectOption('1');
  const dosCol = await comprobarInvariantes(page, await imprimir(page), '2 columnas/centrado/1 hoja');
  expect(dosCol.hojas).toBe(5);

  // 4. Una columna, izquierda, 3 hojas impuestas: el motor reparte sin perder ni cortar nada.
  await page.getByRole('button', { name: 'Izquierda' }).click();
  await page.locator('button[title="Una columna de temas"]').click();
  await hojas.selectOption('3');
  const tres = await comprobarInvariantes(page, await imprimir(page), '1 columna/izquierda/3 hojas');
  expect(tres.hojas).toBe(15);
});
