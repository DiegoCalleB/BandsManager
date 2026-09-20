#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const INSTANTE_FIJO = new Date('2026-06-15T12:00:00.000Z');
const BASE_URL = 'http://localhost:3000';

const CSS_SIN_MOVIMIENTO = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio'];
const CIERRES = ['Cerrar asistente', 'Cerrar guía', 'Explorar', '¡Entendido'];

async function prepararPagina(page) {
  await page.addStyleTag({ content: CSS_SIN_MOVIMIENTO });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function silenciarTutoriales(page) {
  await page.addInitScript((mods) => {
    for (const m of mods) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true');
  }, MODULOS_CON_TUTORIAL);
}

async function establecerTema(page, tema) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme_preference', t);
  }, tema);
  await page.waitForTimeout(300);
}

async function cerrarModales(page) {
  const cierres = page.getByRole('button', { name: new RegExp(`^(${CIERRES.join('|')})`) });
  for (let i = 0; i < 10; i++) {
    const btn = cierres.first();
    if (!(await btn.isVisible({ timeout: 1000 }).catch(() => false))) break;
    await btn.click();
    await page.waitForTimeout(300);
  }
}

async function desplegarGrupos(page) {
  const plegados = page.getByTitle('Desplegar sección');
  for (let i = 0; i < 15; i++) {
    if (await plegados.count() === 0) break;
    await plegados.first().click();
    await page.waitForTimeout(100);
  }
}

async function irAModulo(page, modulo) {
  if (modulo === 'resumen') return;

  await desplegarGrupos(page);
  const btn = page.locator(`#nav-btn-${modulo}`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(500);
  await cerrarModales(page);
}

(async () => {
  console.log('🌙 Capturando pantallas en dark mode...\n');

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium'
  });

  const MODULOS = ['resumen', 'booking', 'calendario', 'repertorio', 'epk'];
  const OUTDIR = '/home/user/BandsManager/e2e/visual.spec.ts-snapshots-dark';

  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

  try {
    // Usar stored auth
    const authFile = '/home/user/BandsManager/e2e/.auth/user.json';
    const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));

    for (const modulo of MODULOS) {
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();

      try {
        page.clock.setFixedTime(INSTANTE_FIJO);
        await silenciarTutoriales(page);
        await page.goto(BASE_URL);

        // Esperar login
        await page.waitForSelector('#nav-btn-resumen', { timeout: 15000 });

        // Establecer dark mode
        await establecerTema(page, 'dark');

        // Navegar
        await cerrarModales(page);
        await irAModulo(page, modulo);
        await prepararPagina(page);

        // Capturar
        const filename = path.join(OUTDIR, `${modulo}-escritorio-dark.png`);
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`✓ ${modulo}-dark (desktop)`);

      } catch (e) {
        console.log(`✗ ${modulo}-dark: ${e.message}`);
      } finally {
        await context.close();
      }
    }

    console.log(`\n✅ Capturas guardadas en ${OUTDIR}`);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
