import { test, expect } from '@playwright/test';
import { abrirAsesor, PRESENCIA } from './helpers/asesor';

// Presencia del Asesor de Marketing a ~390 px: la auditoría 360, el kit de SEO y los enlaces con
// seguimiento. El servidor se simula (la lógica la cubren los tests de Vitest): aquí se comprueba
// que la hoja se entiende, que las bios pegadas viajan y que crear un enlace llama a lo que toca.

test.setTimeout(120_000);

test('revisar presencia: lo primero que arreglar, con su origen, y cada especialista con lo que no sabe', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  await page.getByRole('button', { name: 'Revisar presencia' }).click();
  const hoja = page.getByRole('dialog', { name: 'Revisar presencia' });
  await expect(hoja.getByText('5 comprobaciones: 1 bien, 3 por mejorar y 1 sin datos.')).toBeVisible();

  const primero = hoja.getByRole('region', { name: 'Lo primero que arreglar' });
  const tarjetas = primero.getByRole('article');
  await expect(tarjetas).toHaveCount(3);
  await expect(tarjetas.first()).toContainText('El próximo bolo tiene enlace de entradas');
  await expect(tarjetas.first()).toContainText('Impacto alto');
  await expect(tarjetas.first()).toContainText('3 min');
  await expect(tarjetas.first()).toContainText('Criterio propio');
  await expect(tarjetas.nth(1)).toContainText('Del temario'); // el enlace con seguimiento sale de la lección de métricas

  await hoja.locator('summary').filter({ hasText: 'Instagram' }).click();
  const sinDatos = hoja.getByText('No conocemos vuestra bio de Instagram.');
  await expect(sinDatos).toBeVisible();
  await expect(hoja.getByText('Sin datos', { exact: true })).toBeVisible();

  expect(peticiones.find((p) => p.ruta.endsWith('/presencia'))!.cuerpo).toEqual({ bios: {} });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await hoja.screenshot({ path: 'test-results/asesor-presencia.png' });
});

test('revisar presencia: las bios pegadas viajan en la petición, y se recuerdan en este navegador', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  // En desarrollo React ejecuta el efecto dos veces: se mira la ÚLTIMA petición, no cuántas hay.
  const ultima = () => peticiones.filter((p) => p.ruta.endsWith('/presencia')).at(-1)?.cuerpo;
  await page.getByRole('button', { name: 'Revisar presencia' }).click();
  const hoja = page.getByRole('dialog', { name: 'Revisar presencia' });
  await expect(hoja.getByText('5 comprobaciones')).toBeVisible();
  expect(ultima()).toEqual({ bios: {} });

  await hoja.getByLabel('Bio de Instagram').fill('Rock desde Madrid, entradas en el enlace');
  await hoja.getByRole('button', { name: 'Revisar de nuevo' }).click();
  await expect.poll(ultima).toEqual({ bios: { instagram: 'Rock desde Madrid, entradas en el enlace' } });

  await hoja.getByRole('button', { name: 'Cerrar' }).click();
  const antes = peticiones.filter((p) => p.ruta.endsWith('/presencia')).length;
  await page.getByRole('button', { name: 'Revisar presencia' }).click();
  await expect.poll(() => peticiones.filter((p) => p.ruta.endsWith('/presencia')).length).toBeGreaterThan(antes);
  expect(ultima()).toEqual({ bios: { instagram: 'Rock desde Madrid, entradas en el enlace' } }); // recordada en este navegador
});

test('el kit de SEO enseña las frases con las que os buscan y bios con su contador de caracteres', async ({ page }) => {
  await abrirAsesor(page);
  await page.getByRole('button', { name: 'Revisar presencia' }).click();
  const hoja = page.getByRole('dialog', { name: 'Revisar presencia' });
  await hoja.getByRole('tab', { name: 'SEO' }).click();
  await expect(hoja.getByText('rock Madrid', { exact: true })).toBeVisible();
  await expect(hoja.getByText('conciertos de rock en Madrid')).toBeVisible();
  await expect(hoja.getByText('Ruta 66 | Rock Madrid')).toBeVisible();
  await expect(hoja.getByText('21 de 64 caracteres')).toBeVisible();
  const ig = hoja.getByRole('region', { name: 'Bio de Instagram' });
  await expect(ig.getByText('Directa · 57 de 150')).toBeVisible();
  await expect(ig.getByText('Con el próximo bolo · 71 de 150')).toBeVisible();
  await expect(hoja.getByRole('region', { name: 'Bio de TikTok' }).getByText('Directa · 47 de 80')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await hoja.screenshot({ path: 'test-results/asesor-seo.png' });
});

test('enlaces y clics: avisa si el enlace no lleva donde toca y crea el que falta hacia el bolo', async ({ page }) => {
  const { peticiones } = await abrirAsesor(page);
  let creado = false;
  await page.route('**/api/short-links', async (route) => {
    peticiones.push({ ruta: new URL(route.request().url()).pathname, cuerpo: JSON.parse(route.request().postData() || 'null') });
    creado = true;
    await route.fulfill({ status: 201, json: { code: 'zzz2345', url: 'https://bandmanager.io/r/zzz2345', creado: true } });
  });
  await page.route('**/api/asesor/presencia', (route) => route.fulfill({
    json: { ...PRESENCIA, enlaces: { ...PRESENCIA.enlaces, porRed: creado ? [PRESENCIA.enlaces.porRed[0], { red: 'tiktok', url: 'https://bandmanager.io/r/zzz2345', destino: 'entradas', concertId: 'c1', clics7: 0 }] : PRESENCIA.enlaces.porRed } },
  }));

  await page.getByRole('button', { name: 'Revisar presencia' }).click();
  const hoja = page.getByRole('dialog', { name: 'Revisar presencia' });
  await hoja.getByRole('tab', { name: 'Enlaces y clics' }).click();
  await expect(hoja.getByText('Ahora, el enlace de la bio debería llevar a las entradas del bolo')).toBeVisible();
  await expect(hoja.getByText('Faltan 7 días para el bolo')).toBeVisible();
  const ig = hoja.getByRole('article').filter({ hasText: 'Instagram' });
  await expect(ig).toContainText('12 clics en 7 días');
  await expect(ig).toContainText('Lleva a vuestro dossier'); // a 7 días del bolo no debería
  await expect(hoja.getByText('Tema de la semana: La furgo')).toBeVisible();
  await expect(hoja.getByText('9 clics (Instagram 9)')).toBeVisible();
  await expect(hoja.getByText('Aproximado: el enlace de la bio es el mismo para todas las piezas')).toBeVisible();
  await hoja.screenshot({ path: 'test-results/asesor-enlaces.png' });

  await hoja.getByRole('button', { name: 'Crear enlace de TikTok' }).click();
  await expect(hoja.getByText('https://bandmanager.io/r/zzz2345')).toBeVisible();
  expect(peticiones.find((p) => p.ruta.endsWith('/short-links'))!.cuerpo).toEqual({ concertId: 'c1', destino: 'entradas', canal: 'tiktok' });
});
