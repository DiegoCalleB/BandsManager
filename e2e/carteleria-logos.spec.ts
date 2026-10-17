import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { abrirCarteleria, FIXTURES } from './helpers/carteleria';

// Logos de las otras bandas del bolo: se suben desde Ajustes, salen en la fila del cartel en la tinta del
// texto y se pueden quitar. El servidor se simula: se comprueba el contrato del cliente.

test.setTimeout(120_000);

const abrirAjustes = async (page: Page) => {
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  await page.getByRole('menuitem', { name: 'Ajustes del cartel' }).click();
};
const cartel = (page: Page) => page.getByLabel(/Vista previa del cartel/).evaluate((c: HTMLCanvasElement) => c.toDataURL());

test('un logo subido entra en el cartel como PNG y se puede quitar', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const sinLogo = await cartel(page);
  await abrirAjustes(page);
  await page.getByLabel('Añadir un logo').setInputFiles(path.join(FIXTURES, 'logo.png'));
  await expect(page.getByAltText('Logo 1')).toBeVisible({ timeout: 10_000 });

  const subida = peticiones.find((p) => p.ruta.endsWith('/e2e-c1/logo') && p.metodo === 'POST')!;
  expect(subida.tipo).toBe('image/png');
  expect(subida.cuerpo.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
  await expect(page.getByRole('switch', { name: 'Logos en una tinta' })).toHaveAttribute('aria-checked', 'true');

  // El cartel cambia: ahora lleva su fila de logos.
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(sinLogo);

  // Se guarda en la configuración del bolo, saneada.
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && p.cuerpo.toString().includes('-logo-1.png')), { timeout: 8_000 }).toBe(true);

  await page.getByRole('button', { name: 'Quitar logo' }).click();
  await expect(page.getByAltText('Logo 1')).toHaveCount(0);
  const borrado = peticiones.find((p) => p.ruta.endsWith('/e2e-c1/logo') && p.metodo === 'DELETE')!;
  expect(JSON.parse(borrado.cuerpo.toString()).url).toContain('-logo-1.png');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).toBe(sinLogo);
});

test('caben como mucho cuatro logos: al llegar a cuatro ya no se ofrece añadir', async ({ page }) => {
  await abrirCarteleria(page);
  await abrirAjustes(page);
  for (let i = 1; i <= 4; i++) {
    await page.getByLabel('Añadir un logo').setInputFiles(path.join(FIXTURES, 'logo.png'));
    await expect(page.getByAltText(`Logo ${i}`)).toBeVisible({ timeout: 10_000 });
  }
  await expect(page.getByLabel('Añadir un logo')).toHaveCount(0);
});

test('el interruptor de «una tinta» cambia cómo salen los logos', async ({ page }) => {
  await abrirCarteleria(page);
  await abrirAjustes(page);
  await page.getByLabel('Añadir un logo').setInputFiles(path.join(FIXTURES, 'logo.png'));
  await expect(page.getByAltText('Logo 1')).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => page.getByLabel(/Vista previa del cartel/).evaluate((c: HTMLCanvasElement) => c.toDataURL().length)).toBeGreaterThan(0);
  const enTinta = await cartel(page);
  await page.getByRole('switch', { name: 'Logos en una tinta' }).click();
  await expect(page.getByRole('switch', { name: 'Logos en una tinta' })).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(enTinta);
});
