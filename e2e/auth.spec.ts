import { test, expect } from '@playwright/test';

// Selector estable frente a rebrands: la cabecera del panel autenticado siempre lleva este
// title (ver App.tsx), aunque cambie el logo, el nombre de la banda o el layout. Solo existe
// en la cabecera móvil (md:hidden), así que el viewport de este archivo se fuerza a móvil -
// AGENTS.md §6 exige diseñar "de verdad" a ~390px, así que probar el login ahí es coherente
// con esa regla, no solo un workaround.
test.use({ viewport: { width: 390, height: 844 } });

const SELECTOR_PANEL_AUTENTICADO = '[title*="cambiar de banda"]';

test('sin sesión, la raíz muestra la landing y "Entrar" lleva al login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu banda, tus bolos');
  await expect(page.locator(SELECTOR_PANEL_AUTENTICADO)).toHaveCount(0);
  await page.locator('#landing-entrar').click();
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('/login va directo al formulario, sin landing', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
});

test('login con un usuario semilla lleva al panel de la banda', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('bakandeya2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();

  await expect(page.locator(SELECTOR_PANEL_AUTENTICADO).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toHaveCount(0);
});

test('la landing carga todas sus capturas (ninguna imagen rota)', async ({ page }) => {
  await page.goto('/');
  const scroller = page.locator('.h-dvh.overflow-y-auto');
  const alto = await scroller.evaluate((el) => el.scrollHeight);
  for (let y = 0; y <= alto; y += 600) {
    await scroller.evaluate((el, yy) => { el.scrollTop = yy; }, y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  const rotas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none').map((i) => i.src));
  expect(rotas, `imágenes rotas: ${rotas.join(', ')}`).toEqual([]);
});
