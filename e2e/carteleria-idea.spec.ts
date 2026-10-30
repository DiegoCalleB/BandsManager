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
  await expect(page.getByLabel('Colores', { exact: true })).toHaveValue(/Rojo oxidado/);
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

test('«La IA dibuja el título y la fecha» viaja al pedir el fondo y se puede desmarcar', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirIa(page);
  const casilla = page.getByLabel(/La IA dibuja el título y la fecha/);
  await expect(casilla).toBeChecked();
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  expect(fondoPedido(peticiones).conTexto).toBe(true);
  expect(fondoPedido(peticiones).encuadre).toBe('sangre');
});

test('con varias bandas en el bolo no se ofrece que la IA dibuje las letras', async ({ page }) => {
  await abrirCarteleria(page, { compartido: true });
  await abrirIa(page);
  await expect(page.getByLabel(/La IA dibuja el título y la fecha/)).toHaveCount(0);
});

test('retocar el fondo de IA manda la instrucción y deja la versión nueva al lado de la anterior', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  // Sin fondo de IA elegido, no se ofrece retocar.
  await expect(page.getByLabel('Retocar el fondo')).toHaveCount(0);
  await abrirIa(page);
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });

  const retocar = page.getByRole('button', { name: 'Retocar', exact: true });
  await expect(retocar).toBeDisabled();
  await page.getByRole('button', { name: 'Más oscuro' }).click();
  await expect(page.getByLabel('Qué quieres cambiar del fondo')).toHaveValue('Más oscuro');
  await retocar.click();

  await expect(page.getByRole('button', { name: /Fondo con IA 2/ })).toBeVisible({ timeout: 15_000 });
  const pedido = JSON.parse(peticiones.find((p) => p.ruta.endsWith('/cartel/retocar'))!.cuerpo.toString());
  expect(pedido.instruccion).toBe('Más oscuro');
  expect(pedido.url).toMatch(/ia-1\.png/);
  // Por defecto se retoca en modo libre (como en ChatGPT); «Solo lo que pida» manda el modo fiel.
  expect(pedido.modo).toBe('libre');
  await expect(page.getByRole('button', { name: 'Libre, como en ChatGPT' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Solo lo que pida' }).click();
  await page.getByLabel('Qué quieres cambiar del fondo').fill('Sin nubes');
  await retocar.click();
  await expect.poll(() => peticiones.filter((p) => p.ruta.endsWith('/cartel/retocar')).map((p) => JSON.parse(p.cuerpo.toString()).modo), { timeout: 15_000 }).toEqual(['libre', 'fiel']);
  // La versión nueva pasa a ser el fondo; la anterior sigue ahí para volver.
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toBeVisible();
});

test('si la IA falla una letra se ofrece repetir con el texto exacto, sin letras de IA', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  let primera = true;
  await page.route('**/api/cartel/fondo', async (route) => {
    const cuerpo = JSON.parse(route.request().postData() || '{}');
    peticiones.push({ metodo: 'POST', ruta: '/api/cartel/fondo', cuerpo: Buffer.from(JSON.stringify(cuerpo)) });
    const conTexto = cuerpo.conTexto === true;
    await route.fulfill({ json: { url: `https://x.supabase.co/storage/v1/object/public/band-media/carteles/band-demo/ia-${primera ? 't-' : ''}9.png?v=1`, estilo: cuerpo.estilo, referencias: 0, conTexto, textoOk: !(primera && conTexto) } });
    primera = false;
  });
  await abrirIa(page);
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('status').filter({ hasText: /ha fallado alguna letra/ })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Repetir con el texto exacto' }).click();
  await expect(page.getByRole('status').filter({ hasText: /ha fallado alguna letra/ })).toHaveCount(0, { timeout: 15_000 });
  const pedidos = peticiones.filter((p) => p.ruta.endsWith('/cartel/fondo')).map((p) => JSON.parse(p.cuerpo.toString()));
  expect(pedidos[0].conTexto).toBe(true);
  expect(pedidos[1].conTexto).toBe(false);
});
