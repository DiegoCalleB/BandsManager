import { test, expect, type Page } from '@playwright/test';
import { ESCRITORIO, MOVIL, abrirApp, irAEscritorio } from './helpers-visual';

/**
 * DASHBOARD — el panel que armas es el panel que ves, y sigue ahí tras recargar.
 * Regresión: en «Vista esencial» los widgets añadidos desaparecían al pulsar «Finalizar edición»
 * y la disposición no sobrevivía a una recarga. Y la curva de energía sale como línea, dentro
 * de su tarjeta.
 */
test.describe.configure({ timeout: 120_000 });
test.use({ viewport: ESCRITORIO });

/** Vista Completa desde el engranaje (la Esencial recorta el panel por defecto). */
async function verCompleta(page: Page) {
  await page.locator('#dashboard-settings-gear-btn').click();
  const modo = page.locator('#gear-menu-toggle-density-btn');
  if (/Esencial/.test((await modo.textContent()) || '')) await modo.click();
  else await page.keyboard.press('Escape');
}

async function abrirPanel(page: Page) {
  await abrirApp(page, false);
  await irAEscritorio(page, 'resumen');
  await verCompleta(page);
  await expect(page.getByRole('heading', { name: 'Energía del repertorio' })).toBeVisible({ timeout: 20_000 });
}

async function editar(page: Page) {
  await page.locator('#dashboard-settings-gear-btn').click();
  await page.locator('#gear-menu-edit-layout-btn').click();
  await expect(page.getByText('Editando tu panel')).toBeVisible();
}

test('la energía del repertorio es una línea y cabe en su tarjeta', async ({ page }) => {
  await abrirPanel(page);
  const tarjeta = page.getByRole('heading', { name: 'Energía del repertorio' }).locator('xpath=ancestor::div[contains(@class,"overflow-hidden")][1]');
  const curva = tarjeta.getByRole('img', { name: /Curva de energía/ });
  await expect(curva).toBeVisible();
  // Línea, no barras: un trazo con curva y ningún <rect> de datos
  await expect(curva.locator('path[stroke="var(--acc)"]')).toHaveCount(1);
  const t = await tarjeta.boundingBox();
  const c = await curva.boundingBox();
  if (!t || !c) throw new Error('sin geometría');
  expect(c.x).toBeGreaterThanOrEqual(t.x - 1);
  expect(c.x + c.width).toBeLessThanOrEqual(t.x + t.width + 1);
});

test('la disposición del panel se guarda y sobrevive a recargar', async ({ page }) => {
  await abrirPanel(page);
  await editar(page);
  // Quitar el embudo de contrataciones
  const barra = page.getByText('Embudo de Contrataciones').first();
  await expect(barra).toBeVisible();
  const total = await page.getByTitle('Quitar widget').count();
  await page.getByTitle('Quitar widget').nth(3).click();
  await expect(page.getByTitle('Quitar widget')).toHaveCount(total - 1);
  await expect(page.getByText('Guardado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finalizar edición' }).click();

  // La energía sigue (el usuario no la ha quitado) aunque la vista sea «Esencial»
  await expect(page.getByRole('heading', { name: 'Energía del repertorio' })).toBeVisible();

  await page.reload();
  await abrirApp(page, false);
  await irAEscritorio(page, 'resumen');
  await expect(page.getByRole('heading', { name: 'Energía del repertorio' })).toBeVisible({ timeout: 20_000 });
  await editar(page);
  await expect(page.getByTitle('Quitar widget')).toHaveCount(total - 1);

  // «Por defecto» lo devuelve
  await page.getByRole('button', { name: /Por Defecto/ }).click();
  await expect(page.getByTitle('Quitar widget')).toHaveCount(total);
});

test('en móvil la curva cabe y el panel no desborda', async ({ page }) => {
  await page.setViewportSize(MOVIL);
  await abrirApp(page, true);
  await verCompleta(page);
  const curva = page.getByRole('img', { name: /Curva de energía/ }).first();
  await curva.scrollIntoViewIfNeeded();
  await expect(curva).toBeVisible();
  const b = await curva.boundingBox();
  expect(b!.x + b!.width).toBeLessThanOrEqual(MOVIL.width);
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(MOVIL.width);
});
