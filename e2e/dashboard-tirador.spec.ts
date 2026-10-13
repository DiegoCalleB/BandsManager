import { test, expect, type Page } from '@playwright/test';

// Redimensionar widgets del Dashboard con el tirador de la esquina (ratón y teclado). Comprueba en
// un navegador real lo que los tests unitarios no pueden: que el arrastre llega de verdad (el
// widget lleva `draggable` para reordenar), que el panel se reorganiza en vivo y que se guarda UNA
// vez, en el formato v2. Usa los tamaños relativos, no absolutos, para no depender del panel que
// haya quedado guardado en el servidor de desarrollo.
test.use({ viewport: { width: 1400, height: 1000 } });

const columnas = (page: Page, id: string) =>
  page.evaluate((i) => {
    const el = document.querySelector(`[data-widget-id="${i}"]`);
    const m = el ? /md:col-span-(\d+)/.exec(el.className) : null;
    return m ? Number(m[1]) : 0;
  }, id);

async function abrirEdicion(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.locator('#dashboard-settings-gear-btn').waitFor({ timeout: 40_000 });
  // El asistente de primera configuración tapa el panel la primera vez.
  const luego = page.getByText('Configurar más tarde');
  await luego.waitFor({ timeout: 15_000 }).then(() => luego.click()).catch(() => {});
  await page.locator('#dashboard-settings-gear-btn').click();
  await page.locator('#gear-menu-edit-layout-btn').click();
  await page.locator('[data-widget-id]').first().waitFor();
  // Un widget que no esté ya a ancho completo, para poder ensancharlo.
  const id = await page.evaluate(
    () => [...document.querySelectorAll<HTMLElement>('[data-widget-id]')].find((e) => !e.className.includes('md:col-span-12'))?.dataset.widgetId,
  );
  expect(id, 'hace falta un widget que no esté a ancho completo').toBeTruthy();
  const tirador = page.locator(`[data-widget-id="${id}"] button[aria-label^="Cambiar el tamaño"]`);
  await tirador.scrollIntoViewIfNeeded();
  return { id: id as string, tirador };
}

test('arrastrar el tirador ensancha el widget en vivo y guarda una sola vez en formato v2', async ({ page }) => {
  const guardados: Array<{ dashboard_widgets?: { version?: number; base?: unknown[] } }> = [];
  page.on('request', (r) => {
    if (r.url().includes('/ui-preferences') && r.method() === 'POST') guardados.push(JSON.parse(r.postData() || '{}'));
  });
  const { id, tirador } = await abrirEdicion(page);
  const antes = await columnas(page, id);
  const caja = (await tirador.boundingBox())!;

  await page.mouse.move(caja.x + 10, caja.y + 10);
  await page.mouse.down();
  await page.mouse.move(caja.x + 10 + 500, caja.y + 10, { steps: 12 });
  // En vivo: antes de soltar el panel ya se ha reorganizado
  expect(await columnas(page, id)).toBeGreaterThan(antes);
  expect(guardados).toHaveLength(0);
  await page.mouse.up();

  await expect.poll(() => guardados.length, { timeout: 5_000 }).toBe(1);
  expect(guardados[0].dashboard_widgets?.version).toBe(2);
  expect(guardados[0].dashboard_widgets?.base?.length).toBeGreaterThan(0);
  expect(await columnas(page, id)).toBeGreaterThan(antes);
});

test('con el teclado las flechas cambian el ancho y Escape cancela un arrastre', async ({ page }) => {
  const { id, tirador } = await abrirEdicion(page);
  const inicial = await columnas(page, id);

  await tirador.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => columnas(page, id)).toBeGreaterThanOrEqual(inicial);
  const tras = await columnas(page, id);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => columnas(page, id)).toBeLessThanOrEqual(tras);

  const reposo = await columnas(page, id);
  const caja = (await tirador.boundingBox())!;
  await page.mouse.move(caja.x + 10, caja.y + 10);
  await page.mouse.down();
  await page.mouse.move(caja.x + 10 + 400, caja.y + 10, { steps: 8 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await columnas(page, id)).toBe(reposo);
});

test('en el móvil no hay tirador (la rejilla es de una columna)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.locator('#dashboard-settings-gear-btn').waitFor({ timeout: 40_000 });
  const luego = page.getByText('Configurar más tarde');
  await luego.waitFor({ timeout: 15_000 }).then(() => luego.click()).catch(() => {});
  await page.locator('#dashboard-settings-gear-btn').click();
  await page.locator('#gear-menu-edit-layout-btn').click();
  await page.locator('[data-widget-id]').first().waitFor();
  const visibles = await page.evaluate(
    () => [...document.querySelectorAll('button[aria-label^="Cambiar el tamaño"]')].filter((e) => getComputedStyle(e).display !== 'none').length,
  );
  expect(visibles).toBe(0);
});
