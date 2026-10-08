import { test, expect } from '@playwright/test';
import { abrirModalDeImpresion } from './helpers/impresion';

// "Me da dudas": el músico marca desde la lista del setlist los temas donde quiere ver tono/BPM
// en su hoja. La marca viaja en la canción (notasPorMiembro[].mostrarTono) por PUT /api/songs/:id.

test.use({ viewport: { width: 1400, height: 1000 } });
test.setTimeout(120_000);

test('el músico marca un tema como duda desde la lista del setlist', async ({ page }) => {
  const puts: any[] = [];
  await page.route('**/api/songs/*', (route) => {
    if (route.request().method() === 'PUT') {
      puts.push(JSON.parse(route.request().postData() ?? '{}'));
      return route.fulfill({ json: { success: true } });
    }
    return route.fallback();
  });
  await abrirModalDeImpresion(page);
  await page.keyboard.press('Escape');
  const boton = page.getByRole('button', { name: /Me da dudas/ }).first();
  await boton.click();
  await expect(page.getByRole('button', { name: /Quitar de mis dudas/ }).first()).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => puts.length).toBeGreaterThan(0);
  const nota = (puts.at(-1).notasPorMiembro ?? []).find((n: any) => n.mostrarTono === true);
  expect(nota).toBeTruthy();
});

test('"Solo <músico>" imprime únicamente la hoja del músico en vista', async ({ page }) => {
  await abrirModalDeImpresion(page);
  const solo = page.getByRole('button', { name: /^Solo / }).first();
  await solo.waitFor({ timeout: 10_000 });
  await solo.click();
  await expect.poll(() => page.evaluate(() => (window as any).__htmls.length)).toBeGreaterThan(0);
  const hojas = await page.evaluate(() => ((window as any).__htmls.at(-1).match(/class="sheet-page/g) ?? []).length);
  expect(hojas).toBeGreaterThan(0);
  const todas = await page.evaluate(() => (window as any).__htmls.length);
  expect(todas).toBe(1);
});
