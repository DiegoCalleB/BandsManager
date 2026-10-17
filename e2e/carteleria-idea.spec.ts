import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { abrirCarteleria, FIXTURES } from './helpers/carteleria';

// La idea que la persona tiene del cartel: ejemplos, cinco campos, boceto y vista previa de lo que se le
// pide a la IA (ya en inglés). El servidor se simula: se comprueba el contrato del cliente.

test.setTimeout(120_000);

const abrirIa = (page: Page) => page.locator('button[title="Fondo con IA"]').click();
const fondoPedido = (peticiones: Array<{ ruta: string; cuerpo: Buffer }>) => JSON.parse(peticiones.find((p) => p.ruta.endsWith('/cartel/fondo'))!.cuerpo.toString());

test('sin contar nada, el fondo se pide como siempre: sin idea y sin boceto', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirIa(page);
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  const pedido = fondoPedido(peticiones);
  expect(pedido.idea).toBeUndefined();
  expect(pedido.conBoceto).toBe(false);
});

test('un ejemplo rellena la idea y viaja al generar el fondo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirIa(page);
  await page.getByRole('button', { name: 'Rock de carretera' }).click();
  await expect(page.getByLabel('¿Qué se ve en el cartel?')).toHaveValue(/guitarra con alas/);
  // Los detalles se abren solos cuando ya traen algo: no se esconde lo que hay escrito.
  await expect(page.getByLabel('Colores')).toHaveValue(/Rojo oxidado/);
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  const pedido = fondoPedido(peticiones);
  expect(pedido.idea.escena).toMatch(/guitarra con alas/);
  expect(pedido.idea.evitar).toBe('Sin personas ni neones');
  expect(pedido.conBoceto).toBe(false);
});

test('se puede ver lo que se le pedirá a la IA, ya en inglés, sin gastar una imagen', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirIa(page);
  await page.getByLabel('¿Qué se ve en el cartel?').fill('Una guitarra con alas');
  await page.getByRole('button', { name: 'Ver lo que le pediré a la IA' }).click();
  await expect(page.getByText('a winged guitar over a desert road')).toBeVisible();
  await expect(page.getByText(/Traducido al inglés/)).toBeVisible();
  expect(peticiones.some((p) => p.ruta.endsWith('/cartel/fondo'))).toBe(false);
  const brief = JSON.parse(peticiones.find((p) => p.ruta.endsWith('/cartel/brief'))!.cuerpo.toString());
  expect(brief.idea.escena).toBe('Una guitarra con alas');
  // Tocar la idea deja viejo lo que se había previsualizado.
  await page.getByLabel('¿Qué se ve en el cartel?').fill('Otra cosa');
  await expect(page.getByText('a winged guitar over a desert road')).toHaveCount(0);
});

test('el boceto sube como JPEG, se usa al generar y se puede quitar', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirIa(page);
  await page.getByLabel('Subir un boceto o un cartel de ejemplo').setInputFiles(path.join(FIXTURES, 'ref.jpg'));
  await expect(page.getByAltText('Tu boceto')).toBeVisible({ timeout: 10_000 });
  const subida = peticiones.find((p) => p.ruta.endsWith('/cartel/idea') && p.metodo === 'POST')!;
  expect(subida.tipo).toBe('image/jpeg');
  expect(subida.cuerpo.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))).toBe(true);

  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  expect(fondoPedido(peticiones).conBoceto).toBe(true);

  await abrirIa(page);
  await page.getByRole('button', { name: 'Quitar boceto' }).click();
  await expect(page.getByAltText('Tu boceto')).toHaveCount(0);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/cartel/idea') && p.metodo === 'DELETE')).toBe(true);
});
