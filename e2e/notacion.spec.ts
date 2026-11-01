// La notación de acordes/tonalidades la elige cada persona en su perfil: por defecto americana (D, Em) y, al
// elegir la española, toda la pantalla pasa a Re, Mim sin recargar. Lo guardado no cambia (siempre americano).
import { test, expect } from '@playwright/test';
import { RUTA66_SONGS } from './fixtures/setlistRuta66';
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(90_000);
test('la notación se elige en el perfil y cambia las tonalidades en pantalla', async ({ page }) => {
  await page.route('**/api/songs', (route) => route.request().method() === 'GET' ? route.fulfill({ json: { songs: RUTA66_SONGS } }) : route.fallback());
  await page.route('**/api/setlists', (route) => route.request().method() === 'GET' ? route.fulfill({ json: { setlists: [] } }) : route.fallback());
  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.getByText('Configurar más tarde').click({ timeout: 4_000 }).catch(() => {});
  await page.getByText('Explorar por mi cuenta').click({ timeout: 20_000 }).catch(() => {});
  await page.getByText('Música', { exact: true }).first().click();
  await page.getByText('Discografía').first().click();
  await page.getByText(/Todas las Canciones/).first().click();
  await page.getByText('Some Kind Of Wonderful').first().waitFor({ timeout: 20_000 });
  const fila = page.locator('text=/105 BPM/').first();
  await expect(fila).toContainText('D');
  // perfil: la tarjeta de notación
  await page.getByText('Diego', { exact: true }).first().click();
  await page.getByText('Notación de acordes y tonalidades').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Española/ }).click();
  await page.getByText('Cerrar', { exact: true }).first().click();
  const fila2 = page.locator('text=/105 BPM/').first();
  await expect(fila2).toContainText('Re');
});
