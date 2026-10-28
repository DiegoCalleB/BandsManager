import { test, expect } from '@playwright/test';
import { abrirCarteleria } from './helpers/carteleria';

// Cartelería: el cartel sale al instante sin IA, solo se escribe lo que la persona toca, se publica
// en el bolo al compartir y lo elegido sobrevive a salir y volver a la vista. El servidor y los bolos
// se simulan: se comprueba el contrato del cliente, no Supabase ni Gemini.

test.setTimeout(120_000);

const medidasPng = (b: Buffer) => `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;

test('abrir no escribe nada y el cartel se pinta sin IA', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await expect(page.getByLabel(/Vista previa del cartel/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compartir' })).toBeVisible();
  await page.waitForTimeout(2000);
  // Leer el estilo de la banda (GET) es normal; escribir no: nada se guarda hasta que la persona toca algo.
  expect(peticiones.filter((p) => p.metodo !== 'GET')).toEqual([]);
});

test('elegir fondo guarda la configuración, saneada y sin URLs locales', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await page.getByRole('button', { name: 'Fondo Bosque' }).click();
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config')), { timeout: 8_000 }).toBe(true);
  const put = peticiones.find((p) => p.ruta.endsWith('/config'))!;
  expect(put.metodo).toBe('PUT');
  const config = JSON.parse(put.cuerpo.toString());
  expect(config.fondo).toEqual({ tipo: 'paleta', id: 'bosque' });
  expect(put.cuerpo.toString()).not.toContain('blob:');
});

test('descargar publica el PNG de feed en el bolo con las medidas exactas', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page);
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: 'Descargar', exact: true }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/^cartel-.*-feed\.png$/);
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/imagen')), { timeout: 8_000 }).toBe(true);
  const img = peticiones.find((p) => p.ruta.endsWith('/imagen'))!;
  expect(img.tipo).toBe('image/png');
  expect(medidasPng(img.cuerpo)).toBe('1080x1350');
  await expect(page.getByText('El cartel ya sale en la página del bolo')).toBeVisible();
});

test('bolo compartido: pregunta quién encabeza una vez', async ({ page }) => {
  await abrirCarteleria(page, { compartido: true });
  await expect(page.getByText('¿Quién encabeza?')).toBeVisible();
  await page.getByRole('button', { name: 'Otra Banda' }).click();
  await expect(page.getByText('¿Quién encabeza?')).toBeHidden();
});

// Regresión: la app carga los bolos una sola vez. Sin reflejar lo guardado en memoria, al salir de
// Cartelería y volver (SIN recargar) se olvidaban la cabeza de cartel y el fondo elegidos.
test('lo elegido sobrevive a salir de la vista y volver sin recargar', async ({ page }) => {
  const { peticiones } = await abrirCarteleria(page, { compartido: true, estadoEstatico: true });
  await page.getByRole('button', { name: 'Otra Banda' }).click();
  await page.getByRole('button', { name: 'Fondo Bosque' }).click();
  await expect.poll(() => peticiones.some((p) => p.ruta.endsWith('/config')), { timeout: 8_000 }).toBe(true);

  // Navegación dentro de la app: Resumen y de vuelta a Cartelería por el menú de Promoción.
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Feed' })).toBeHidden();
  await page.getByRole('button', { name: 'Dossier (EPK)', exact: true }).click();
  await page.getByRole('button', { name: 'Dossier (EPK)', exact: true }).click(); // segundo toque: despliega el grupo
  await page.getByText('Cartelería', { exact: true }).filter({ visible: true }).click();
  await page.getByRole('tab', { name: 'Feed' }).waitFor();

  await expect(page.getByText('¿Quién encabeza?')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Fondo Bosque' })).toHaveAttribute('aria-pressed', 'true');
});

test('el A4 para imprenta solo se ofrece en Imprimir y baja con sangrado y marcas de corte', async ({ page }) => {
  await abrirCarteleria(page);
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  await expect(page.getByRole('menuitem', { name: /para imprenta/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Imprimir A4' }).click();
  await page.getByRole('button', { name: 'Más opciones del cartel' }).click();
  const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: /para imprenta/ }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/imprenta\.png$/);
  const ruta = await descarga.path();
  const fs = await import('fs');
  const buf = fs.readFileSync(ruta!);
  // A4 a 300 ppp (2480×3508) + 3 mm (35 px) de sangre y 7 mm (83 px) de margen por cada lado: +236 px.
  expect(medidasPng(buf)).toBe('2716x3744');
});
