import { test, expect } from '@playwright/test';
import { abrirApp, irAMovil } from './helpers-visual';

/**
 * REGRESIÓN: el modal «Comprobar unión y transición» se renderizaba dentro de un ancestro que recortaba
 * su cabecera y su pie en móvil, y no había forma de cerrarlo. Ahora va en un portal (ModalPortal):
 * cabecera y «Cerrar» tienen que quedar dentro del viewport y cerrar de verdad.
 */
test.describe.configure({ timeout: 120_000 });

test('el modal de uniones se puede cerrar en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await abrirApp(page, true);
  await irAMovil(page, 'repertorio');

  const barras = page.getByRole('button', { name: /^#\d+ .*energía \d+ de 10$/ });
  await expect(barras.first()).toBeVisible({ timeout: 15_000 });
  await barras.nth(1).click();
  await page.getByRole('button', { name: /Probar unión con/ }).first().click();

  const titulo = page.getByText('Comprobar unión y transición');
  await expect(titulo).toBeVisible();

  const cerrar = page.getByRole('button', { name: 'Cerrar', exact: true }).first();
  const caja = await cerrar.boundingBox();
  expect(caja && caja.y >= 0 && caja.y + caja.height <= 700).toBeTruthy();

  await cerrar.click();
  await expect(titulo).toHaveCount(0);
});
