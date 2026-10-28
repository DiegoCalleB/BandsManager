import { test, expect, type Page } from '@playwright/test';
import { abrirCarteleria } from './helpers/carteleria';

// La letra del nombre y de la fecha: automática según el estilo de la banda y cambiable en Ajustes. Cambiarla
// repinta el cartel y se guarda en la configuración del bolo. El servidor se simula.

test.setTimeout(120_000);

const abrirAjustes = async (page: Page) => {
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  await page.getByRole('menuitem', { name: 'Ajustes del cartel' }).click();
};
const cartel = (page: Page) => page.getByLabel(/Vista previa del cartel/).evaluate((c: HTMLCanvasElement) => c.toDataURL());

test('cambiar la letra repinta el cartel y se guarda en el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await abrirAjustes(page);
  const selector = page.getByLabel('Letra del nombre y la fecha');
  await expect(selector).toHaveValue('auto');
  await selector.selectOption('clasica');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).letra === 'clasica'), { timeout: 8_000 }).toBe(true);
});

test('las tres letras dan tres carteles distintos y ninguno deja el lienzo en blanco', async ({ page }) => {
  await abrirCarteleria(page);
  await abrirAjustes(page);
  const vistos = new Set<string>();
  for (const letra of ['moderna', 'cartel', 'clasica']) {
    await page.getByLabel('Letra del nombre y la fecha').selectOption(letra);
    await page.waitForTimeout(900);
    const png = await cartel(page);
    expect(png.length).toBeGreaterThan(5_000);
    vistos.add(png);
  }
  expect(vistos.size).toBe(3);
});

test('la composición se elige en Ajustes, repinta el cartel y se guarda en el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await abrirAjustes(page);
  const selector = page.getByLabel('Composición');
  await expect(selector).toHaveValue('auto');
  await selector.selectOption('centrada');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).composicion === 'centrada'), { timeout: 8_000 }).toBe(true);
  const centrada = await cartel(page);
  await selector.selectOption('base');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(centrada);
});

test('la dirección se activa en Ajustes, repinta el cartel y se guarda en el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await abrirAjustes(page);
  const interruptor = page.getByRole('switch', { name: 'Dirección' });
  await expect(interruptor).not.toBeChecked();
  await interruptor.click();
  await expect(interruptor).toBeChecked();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).direccion === true), { timeout: 8_000 }).toBe(true);
});
