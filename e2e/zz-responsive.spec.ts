import { test } from '@playwright/test';
import { abrirApp, irAEscritorio, irAMovil, prepararPagina } from './helpers-visual';
const SP = process.env.SP!;
for (const tema of ['light', 'dark']) {
  test(`menu ${tema}`, async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await abrirApp(page, false);
    for (const v of ['booking', 'repertorio', 'epk', 'giras']) {
      await irAEscritorio(page, v);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema); await prepararPagina(page);
      await page.screenshot({ path: `${SP}/g-${tema}-${v}.png`, clip: { x: 0, y: 0, width: 640, height: 800 } });
    }
  });
  test(`movil ${tema}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 390, height: 844 });
    await abrirApp(page, true);
    for (const v of ['repertorio', 'epk']) {
      await irAMovil(page, v as any);
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema); await prepararPagina(page);
      await page.screenshot({ path: `${SP}/gm-${tema}-${v}.png` });
    }
  });
}
