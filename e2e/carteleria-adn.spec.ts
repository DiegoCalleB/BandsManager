import path from 'path';
import { test, expect } from '@playwright/test';
import { abrirCarteleria, FIXTURES } from './helpers/carteleria';

// ADN visual de la banda en Cartelería: A (automático: colores del logo y estilo sugerido),
// B (referencias: subidas y carteles anteriores) y C (favoritos que salen de lo que comparten).
// El servidor y las imágenes se simulan: se comprueba el contrato del cliente, no Gemini ni Supabase.

test.setTimeout(120_000);

const FIXTURE = (f: string) => path.join(FIXTURES, f);
const abrirPanelIa = (page: import('@playwright/test').Page) => page.locator('button[title="Fondo con IA"]').click();

test('A · «Tus colores» sale del logo y el estilo de arranque sale de la plantilla del dossier', async ({ page }) => {
  await abrirCarteleria(page, { conLogo: true });
  await expect(page.getByRole('button', { name: 'Fondo Tus colores' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Fondo Tus colores' }).click();
  await expect(page.getByRole('button', { name: 'Fondo Tus colores' })).toHaveAttribute('aria-pressed', 'true');
  await abrirPanelIa(page);
  // Plantilla «neon» del dossier → estilo Neón ya elegido, sin que la persona haga nada.
  await expect(page.getByRole('button', { name: 'Neón' })).toHaveAttribute('aria-pressed', 'true');
});

test('A · sin logo no hay «Tus colores» y no se rompe nada', async ({ page }) => {
  await abrirCarteleria(page);
  await expect(page.getByLabel(/Vista previa del cartel/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fondo Tus colores' })).toBeHidden();
});

test('B · pide ejemplos sin obligar: sube una referencia como JPEG y la IA lo sabe', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirPanelIa(page);
  await expect(page.getByText('Sube de 1 a 3 carteles')).toBeVisible();
  await page.locator('input[aria-label="Añadir una referencia"]').setInputFiles(FIXTURE('ref.jpg'));
  await expect(page.getByText('La IA mirará 1 imagen')).toBeVisible({ timeout: 10_000 });
  const subida = peticiones.find((p) => p.ruta.endsWith('/referencias'))!;
  expect(subida.tipo).toBe('image/jpeg');
  expect(subida.cuerpo.subarray(0, 3).toString('hex')).toBe('ffd8ff'); // JPEG de verdad, reescalado en el cliente
});

test('B · los carteles anteriores de la banda se ofrecen como referencia con un toque', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page, { conCartelAnterior: true });
  await abrirPanelIa(page);
  await expect(page.getByText('Tus carteles anteriores')).toBeVisible();
  await page.getByRole('button', { name: /Usar el cartel anterior 1 como referencia/ }).click();
  await expect(page.getByText('La IA mirará 1 imagen')).toBeVisible({ timeout: 10_000 });
  const put = peticiones.find((p) => p.metodo === 'PUT' && p.ruta.endsWith('/cartel/adn'))!;
  expect(JSON.parse(put.cuerpo.toString()).referencias).toHaveLength(1);
});

test('C · lo que se comparte con un fondo de IA pasa a favoritos y se puede reutilizar', async ({ page }) => {
  const { peticiones, servidor } = await abrirCarteleria(page, { conLogo: true });
  await abrirPanelIa(page);
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  const pedido = peticiones.find((p) => p.ruta.endsWith('/cartel/fondo'))!;
  expect(JSON.parse(pedido.cuerpo.toString()).estilo).toBe('neon');

  // Compartir/descargar = «me ha gustado»: ese fondo pasa a favoritos con su estilo.
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: 'Descargar', exact: true }).click()]);
  await expect.poll(() => servidor.adn.favoritos.length, { timeout: 10_000 }).toBe(1);
  expect(servidor.adn.favoritos[0].estilo).toBe('neon');

  await abrirPanelIa(page).catch(() => {});
  await expect(page.getByText('Tus favoritos')).toBeVisible();
});

test('el logo es opcional: un interruptor en Ajustes, encendido por defecto', async ({ page }) => {
  await abrirCarteleria(page, { conLogo: true });
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  await page.getByRole('menuitem', { name: 'Ajustes del cartel' }).click();
  const interruptor = page.getByRole('switch', { name: 'Logo de la banda' });
  await expect(interruptor).toBeEnabled();
  await expect(interruptor).toHaveAttribute('aria-checked', 'true');
  await interruptor.click();
  await expect(interruptor).toHaveAttribute('aria-checked', 'false');
});
