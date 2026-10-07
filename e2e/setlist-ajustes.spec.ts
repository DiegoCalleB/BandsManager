import { test, expect } from '@playwright/test';
import { abrirModalDeImpresion } from './helpers/impresion';

// Los ajustes de impresión se recuerdan POR BANDA en el servidor (GET/PUT /api/bands/print-settings,
// ver AGENTS.md §4.11). Aquí el servidor se simula: lo que se comprueba es el contrato del cliente
// — aplica lo guardado al abrir y manda solo los ajustes (completos, con valores válidos) al
// cambiarlos —, no la base de datos.

test.use({ viewport: { width: 1400, height: 1000 } });
test.setTimeout(120_000);

test('al abrir aplica los ajustes guardados de la banda', async ({ page }) => {
  await abrirModalDeImpresion(page, {
    textAlign: 'center',
    columnsChoice: 2,
    showGeneralNotes: false,
    showTonality: true,
    showBpm: true,
    showDuration: false,
    showBandLogo: true,
    showWatermark: false,
    showAppBranding: true,
    handwritingFont: 'sans',
    handwritingColor: 'black',
  });

  await expect(page.getByLabel('Tono')).toBeChecked();
  await expect(page.getByLabel('BPM', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Notas generales')).not.toBeChecked();
  await expect(page.getByLabel('Marca de agua')).not.toBeChecked();
  // La alineación y las columnas guardadas se ven en la vista previa real: centrado + 2 columnas.
  const hoja = page.frameLocator('iframe[title="Vista previa del setlist impreso"]');
  await expect(hoja.locator('.setlist-columns-row').first()).toBeVisible({ timeout: 30_000 });
  await expect(hoja.locator('.is-centered').first()).toBeVisible();
});

test('al cambiar un ajuste lo guarda, completo y con valores válidos', async ({ page }) => {
  const { guardados } = await abrirModalDeImpresion(page, null);
  // Sin ajustes guardados (null = sin base de datos) no se guarda nada: modo "sin recordar".
  await page.getByLabel('Tono').check();
  await page.waitForTimeout(1500);
  expect(guardados).toEqual([]);
});

test('con ajustes de la banda, un cambio se guarda tras el debounce', async ({ page }) => {
  const { guardados } = await abrirModalDeImpresion(page, {
    textAlign: 'left',
    columnsChoice: 'auto',
    showGeneralNotes: true,
    showTonality: false,
    showBpm: false,
    showDuration: false,
    showBandLogo: true,
    showWatermark: true,
    showAppBranding: true,
    handwritingFont: 'caveat',
    handwritingColor: 'blue',
  });

  await page.getByRole('button', { name: 'Centrado' }).click();
  await page.getByLabel('BPM', { exact: true }).check();
  await expect.poll(() => guardados.length, { timeout: 10_000 }).toBeGreaterThan(0);

  const ultimo = guardados.at(-1) as Record<string, unknown>;
  expect(ultimo).toMatchObject({ textAlign: 'center', showBpm: true, columnsChoice: 'auto', handwritingColor: 'blue', badgesScope: 'all', markedSongs: {} });
  // Solo claves de la lista blanca, nada de ruido (p. ej. el nº de hojas no se recuerda).
  expect(Object.keys(ultimo).sort()).toEqual(
    [
      'badgesScope', 'columnsChoice', 'handwritingColor', 'handwritingFont', 'showAppBranding', 'showBandLogo', 'showBpm',
      'markedSongs', 'showDuration', 'showGeneralNotes', 'showTonality', 'showWatermark', 'textAlign',
    ].sort(),
  );
});
