import { test, expect } from '@playwright/test';

// Selector estable frente a rebrands: la cabecera del panel autenticado siempre lleva este
// title (ver App.tsx), aunque cambie el logo, el nombre de la banda o el layout. Solo existe
// en la cabecera móvil (md:hidden), así que el viewport de este archivo se fuerza a móvil -
// AGENTS.md §6 exige diseñar "de verdad" a ~390px, así que probar el login ahí es coherente
// con esa regla, no solo un workaround.
test.use({ viewport: { width: 390, height: 844 } });

const SELECTOR_PANEL_AUTENTICADO = '[title*="cambiar de banda"]';

test('sin sesión, la raíz muestra el login, no el panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
  await expect(page.locator(SELECTOR_PANEL_AUTENTICADO)).toHaveCount(0);
});

test('login con un usuario semilla lleva al panel de la banda', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();

  await expect(page.locator(SELECTOR_PANEL_AUTENTICADO).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toHaveCount(0);
});
