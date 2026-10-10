import type { Page } from '@playwright/test';
import { RUTA66_SETLIST, RUTA66_SONGS } from '../fixtures/setlistRuta66';

/**
 * Entra con el usuario semilla, inyecta el set de Ruta 66 (interceptando /api/songs y
 * /api/setlists), captura lo que se mandaría a imprimir (window.open) y abre el modal de impresión.
 * `ajustes`: lo que devolvería GET /api/bands/print-settings (por defecto, sin base de datos).
 */
export async function abrirModalDeImpresion(page: Page, ajustes: Record<string, unknown> | null = null) {
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

  const guardados: unknown[] = [];
  await page.route('**/api/bands/print-settings', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT') {
      guardados.push(JSON.parse(req.postData() ?? '{}'));
      return route.fulfill({ json: { success: true, settings: guardados.at(-1) } });
    }
    return route.fulfill({ json: { success: true, settings: ajustes } });
  });

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByText('Log in').first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
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
  return { guardados };
}
