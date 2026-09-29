import { test, expect, type Page } from '@playwright/test';
import { ESCRITORIO, abrirApp, irAEscritorio } from './helpers-visual';

/**
 * MAPA DE ENERGÍA (Onda) — energía y orden siguen siendo editables.
 *
 * Contrato tras sustituir Recharts por barras: cada canción es un botón
 * ("#n Título, energía x de 10"); ↑/↓ cambia la energía, Alt+←/→ la mueve,
 * el arrastre vertical cambia energía y el horizontal reordena.
 */
test.describe.configure({ timeout: 90_000 });
test.use({ viewport: ESCRITORIO });

const barras = (page: Page) => page.getByRole('button', { name: /^#\d+ .*energía \d+ de 10$/ });
const etiquetas = async (page: Page) => (await barras(page).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') || '')));
const energiaDe = (label: string) => Number(label.match(/energía (\d+) de 10/)?.[1]);
const titulo = (label: string) => label.replace(/^#\d+ /, '').replace(/, energía.*$/, '');

async function abrirSetlist(page: Page) {
  await abrirApp(page, false);
  await irAEscritorio(page, 'repertorio');
  await expect(barras(page).first()).toBeVisible({ timeout: 15_000 });
}

test('teclado: ↑ sube la energía', async ({ page }) => {
  await abrirSetlist(page);
  const primera = barras(page).first();
  const antes = energiaDe((await etiquetas(page))[0]);
  await primera.focus();
  // Un paso interno es media unidad de 10: dos pulsaciones para notar el cambio en /10.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect.poll(async () => energiaDe((await etiquetas(page))[0])).toBeGreaterThan(antes);
});

test('teclado: Alt+→ reordena', async ({ page }) => {
  await abrirSetlist(page);
  const antes = (await etiquetas(page)).map(titulo);
  await barras(page).first().focus();
  await page.keyboard.press('Alt+ArrowRight');
  await expect.poll(async () => (await etiquetas(page)).map(titulo)[0]).not.toBe(antes[0]);
});

test('arrastre horizontal reordena', async ({ page }) => {
  await abrirSetlist(page);
  const antes = (await etiquetas(page)).map(titulo);
  const b = await barras(page).first().boundingBox();
  const destino = await barras(page).nth(2).boundingBox();
  if (!b || !destino) throw new Error('sin geometría');
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2, { steps: 4 });
  await page.mouse.move(destino.x + destino.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await etiquetas(page)).map(titulo)[0]).not.toBe(antes[0]);
});

test('arrastre vertical cambia la energía', async ({ page }) => {
  await abrirSetlist(page);
  const antes = energiaDe((await etiquetas(page))[0]);
  const b = await barras(page).first().boundingBox();
  if (!b) throw new Error('sin geometría');
  await page.mouse.move(b.x + b.width / 2, b.y + 4);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y - 60, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => energiaDe((await etiquetas(page))[0])).toBeGreaterThan(antes);
});
