import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { abrirCarteleria, FIXTURES } from './helpers/carteleria';

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

test('el QR sale también en Feed por defecto y se puede quitar: repinta el cartel y se guarda en el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await abrirAjustes(page);
  const interruptor = page.getByRole('switch', { name: 'QR también en Feed e Historia' });
  await expect(interruptor).toBeChecked();
  await interruptor.click();
  await expect(interruptor).not.toBeChecked();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).qrDigital === false), { timeout: 8_000 }).toBe(true);
});

test('el QR puede llevar a la página de fans: pide su enlace, repinta el cartel y se guarda en el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await abrirAjustes(page);
  const selector = page.getByLabel('El QR lleva a');
  await expect(selector).toHaveValue('concierto');
  // Sin enlace de entradas en el bolo, esa opción no se puede elegir.
  await expect(selector.locator('option[value="entradas"]')).toBeDisabled();
  const enlace = page.waitForRequest((r) => r.url().endsWith('/api/short-links') && JSON.parse(r.postData() || '{}').destino === 'fans');
  await selector.selectOption('fans');
  expect(JSON.parse((await enlace).postData()!)).toMatchObject({ concertId: expect.any(String), destino: 'fans', canal: 'cartel' });
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).qrDestino === 'fans'), { timeout: 8_000 }).toBe(true);
});

test('las plantillas de autor son un respaldo: no están por defecto y salen si la IA falla', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await expect(page.getByRole('button', { name: /^Plantilla / })).toHaveCount(0);
  await page.route('**/api/cartel/fondo', (r) => r.fulfill({ status: 503, json: { error: 'La IA de imágenes no está disponible ahora mismo.' } }));
  await page.locator('button[title="Fondo con IA"]').click();
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByLabel('Carteles de autor')).toBeVisible({ timeout: 15_000 });

  const antes = await cartel(page);
  const muestra = page.getByRole('button', { name: 'Plantilla Vinilo' });
  await muestra.click();
  await expect(muestra).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).fondo?.id === 'vinilo'), { timeout: 8_000 }).toBe(true);
  // Con una plantilla elegida el panel sigue ahí para poder cambiarla, y no se ofrece retocarla como una imagen de IA.
  await expect(page.getByLabel('Carteles de autor')).toBeVisible();
  await expect(page.getByLabel('Retocar el fondo')).toHaveCount(0);
});

test('en el ordenador «Foto» e «IA» están siempre a la vista a la derecha y los fondos hechos no se esconden', async ({ page }) => {
  await abrirCarteleria(page);
  // El ayudante abre en móvil: se pasa a escritorio una vez dentro.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('button[title="Fondo con IA"]').click();
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel('Fondos con IA de este bolo')).toBeVisible();

  const ia = (await page.locator('button[title="Fondo con IA"]').boundingBox())!;
  const foto = (await page.locator('label[title="Usar una foto vuestra"]').boundingBox())!;
  const columna = (await page.getByRole('group', { name: 'Fondo del cartel' }).boundingBox())!;
  // Dentro de la pantalla y a la derecha de los fondos fijos, sin tener que desplazar nada.
  expect(ia.x + ia.width).toBeLessThanOrEqual(1280);
  expect(foto.x).toBeGreaterThanOrEqual(columna.x + columna.width - 1);
  expect(ia.x).toBeGreaterThan(foto.x);
  await page.screenshot({ path: 'test-results/selector-fondo-escritorio.png' });
});

test('un fondo de IA dibujado con su propio marco de papel se recorta: el cartel es el arte, hasta el borde', async ({ page }) => {
  await abrirCarteleria(page);
  await page.route('**/ia-1.png*', (r) => r.fulfill({ body: fs.readFileSync(path.join(FIXTURES, 'fondo-ia-marco.png')), contentType: 'image/png', headers: { 'access-control-allow-origin': '*' } }));
  await page.locator('button[title="Fondo con IA"]').click();
  await page.getByRole('button', { name: 'Pintar fondo' }).click();
  await expect(page.getByRole('button', { name: /Fondo con IA 1/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  // El borde del cartel es del arte (oscuro), no del papel crema del marco.
  await expect
    .poll(() => page.getByLabel(/Vista previa del cartel/).evaluate((c: HTMLCanvasElement) => {
      // A media altura del borde izquierdo no hay velo ni texto: solo el papel del marco o el arte.
      const px = c.getContext('2d')!.getImageData(6, Math.round(c.height / 2), 1, 1).data;
      return 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2];
    }), { timeout: 10_000 })
    .toBeLessThan(120);
});

test('ajustar el texto a mano: arrastrar un bloque, escalarlo y volver al automático', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await page.getByRole('button', { name: 'Ajustar el texto' }).click();
  const nombre = page.getByRole('button', { name: 'Mover Nombre' });
  await expect(nombre).toBeVisible();
  const caja = (await nombre.boundingBox())!;
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2 + 40, caja.y + caja.height / 2 - 60, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).ajustesFinos?.feed?.nombre), { timeout: 8_000 }).toBe(true);

  const movido = await cartel(page);
  await page.getByRole('button', { name: 'Más grande' }).click();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(movido);

  await page.getByRole('button', { name: 'Volver al automático' }).click();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).toBe(antes);
  await expect.poll(() => peticiones.filter((p) => p.ruta.endsWith('/config')).some((p) => !JSON.parse(p.cuerpo.toString()).ajustesFinos?.feed), { timeout: 8_000 }).toBe(true);
});

test('estilo de un bloque: cambiar su letra y su color, ocultarlo y volver a mostrarlo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await page.getByRole('button', { name: 'Ajustar el texto' }).click();
  await page.getByRole('button', { name: 'Mover Fecha' }).click();

  await page.getByLabel('Letra de Fecha').selectOption('clasica');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  const conLetra = await cartel(page);
  await page.getByRole('button', { name: 'Color #e63946' }).click();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(conLetra);
  await page.screenshot({ path: 'test-results/estilo-bloque.png', fullPage: true });
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).estilos?.fecha?.fuente === 'clasica'), { timeout: 8_000 }).toBe(true);

  const conColor = await cartel(page);
  await page.getByRole('button', { name: 'Ocultar' }).click();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(conColor);
  await expect(page.getByRole('button', { name: 'Mover Fecha' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar fecha' }).click();
  await expect(page.getByRole('button', { name: 'Mover Fecha' })).toBeVisible();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).toBe(conColor);
});

test('texto suelto: añadirlo, escribirlo, moverlo y quitarlo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await page.getByRole('button', { name: 'Ajustar el texto' }).click();
  await page.getByRole('button', { name: 'Añadir texto' }).click();
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await page.getByLabel('Texto', { exact: true }).fill('Entrada 8 €');
  await expect(page.getByRole('button', { name: 'Mover Texto 1' })).toBeVisible();
  const escrito = await cartel(page);
  await page.getByLabel('Letra de Texto 1').selectOption('cartel');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(escrito);
  const caja = (await page.getByRole('button', { name: 'Mover Texto 1' }).boundingBox())!;
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  await page.mouse.move(caja.x + caja.width / 2 + 30, caja.y + caja.height / 2 + 40, { steps: 5 });
  await page.mouse.up();
  await page.screenshot({ path: 'test-results/texto-suelto.png', fullPage: true });
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).libres?.[0] === 'Entrada 8 €' && JSON.parse(p.cuerpo.toString()).ajustesFinos?.feed?.libre1), { timeout: 8_000 }).toBe(true);

  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(page.getByRole('button', { name: 'Mover Texto 1' })).toHaveCount(0);
  await expect.poll(() => cartel(page), { timeout: 10_000 }).toBe(antes);
});

test('editar el nombre y el lugar del cartel repinta y se guarda sin tocar el bolo', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  const antes = await cartel(page);
  await abrirAjustes(page);
  await page.getByLabel('Nombre en el cartel').fill('Los Hijos del Toro');
  await page.getByLabel('Lugar en el cartel').fill('Teatro Lara');
  await expect.poll(() => cartel(page), { timeout: 10_000 }).not.toBe(antes);
  await expect
    .poll(() => peticiones.some((p) => p.ruta.endsWith('/config') && JSON.parse(p.cuerpo.toString()).textos?.nombre === 'Los Hijos del Toro' && JSON.parse(p.cuerpo.toString()).textos?.lugar === 'Teatro Lara'), { timeout: 8_000 })
    .toBe(true);
  // El bolo no se ha tocado: solo el PUT de la configuración del cartel.
  expect(peticiones.some((p) => /\/api\/concerts?\//.test(p.ruta) && p.metodo !== 'GET')).toBe(false);
});
