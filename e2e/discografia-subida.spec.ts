// Subir audios a un disco: barra de progreso, al terminar solo «Listo» (cierra; no vuelve a subir) y los
// acordes se analizan en segundo plano sin hacer esperar. La API de canciones se simula; /api/upload es real.
import { test, expect } from '@playwright/test';
import { RUTA66_SONGS } from './fixtures/setlistRuta66';

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(150_000);
// Audios mínimos con la firma correcta (ID3 / RIFF WAVE): el servidor valida la cabecera, no la reproducción.
const mp3 = { name: 'tema.mp3', mimeType: 'audio/mpeg', buffer: Buffer.concat([Buffer.from('ID3'), Buffer.alloc(4096)]) };
const wav = { name: 'tema.wav', mimeType: 'audio/wav', buffer: Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(4096)]) };

test('modal de subir audios del disco: progreso, «Listo» y sin re-subida', async ({ page }) => {
  const llamadas: string[] = [];
  await page.route('**/api/songs', (route) => {
    const r = route.request();
    if (r.method() === 'GET') return route.fulfill({ json: { songs: RUTA66_SONGS } });
    if (r.method() === 'POST') { llamadas.push('POST /api/songs'); return route.fulfill({ json: { success: true, song: { ...JSON.parse(r.postData() ?? '{}') } } }); }
    return route.fallback();
  });
  await page.route('**/api/songs/*', (route) => {
    const r = route.request();
    if (r.method() === 'PUT') { llamadas.push('PUT ' + r.url().split('/').pop()); return route.fulfill({ json: { success: true, song: JSON.parse(r.postData() ?? '{}') } }); }
    return route.fallback();
  });
  await page.route('**/api/songs/*/analizar-acordes', async (route) => {
    llamadas.push('ANALIZAR');
    await new Promise((r) => setTimeout(r, 4000));
    return route.fulfill({ json: { success: true, analisis: { segmentos: [] } } });
  });
  await page.route('**/api/setlists', (route) => route.request().method() === 'GET' ? route.fulfill({ json: { setlists: [] } }) : route.fallback());

  await page.goto('/');
  if (!(await page.getByPlaceholder('Correo electrónico o Usuario').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  }
  await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
  await page.getByPlaceholder('Contraseña').fill('demo2026');
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
  await page.getByText('Configurar más tarde').click({ timeout: 4_000 }).catch(() => {});
  await page.getByText('Explorar por mi cuenta').click({ timeout: 20_000 }).catch(() => {});
  await page.getByText('Música', { exact: true }).first().click();
  await page.getByText('Discografía').first().click();
  await page.getByText('Classic').first().waitFor({ timeout: 20_000 });
  // menú del álbum
  const menu = page.getByRole('button', { name: /más acciones|acciones|opciones/i });
  await menu.first().click();
  await page.getByText('Subir audios').first().click();
  await expect(page.getByText('Subir Canciones Completas del Disco')).toBeVisible();
  await page.setInputFiles('input[type=file][multiple]', [mp3, wav]);
  await expect(page.getByText('2 archivos de audio cargados')).toBeVisible({ timeout: 20_000 });
  const subir = page.getByRole('button', { name: /Subir 2 pistas/ });
  await expect(subir).toBeVisible();
  await subir.click();
  await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 15_000 });
  const listo = page.getByRole('button', { name: 'Listo' });
  await expect(listo).toBeVisible({ timeout: 60_000 });
  // el botón de confirmar ya no vuelve a subir
  await expect(page.getByRole('button', { name: /Subir \d+ pistas?/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Guardar Pistas/ })).toHaveCount(0);
  const subidasAntes = llamadas.filter((l) => l.startsWith('PUT') || l.startsWith('POST')).length;
  await listo.click();
  await expect(page.getByText('Subir Canciones Completas del Disco')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(llamadas.filter((l) => l.startsWith('PUT') || l.startsWith('POST')).length).toBe(subidasAntes); // cerrar no sube nada
});
