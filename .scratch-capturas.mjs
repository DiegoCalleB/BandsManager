import { chromium } from '@playwright/test';
import fs from 'fs';
const OUT = '/tmp/claude-0/-home-user-BandsManager/7d60d6a6-e2e6-5ad6-a051-fb07b8e6465b/scratchpad/capturas';
fs.mkdirSync(OUT, { recursive: true });
const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio', 'song_studio'];
const CIERRES = ['Cerrar asistente', 'Cerrar guía', 'Explorar por mi cuenta', '¡Entendido', 'Configurar más tarde'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
await page.addInitScript((modulos) => {
  try { for (const m of modulos) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true'); } catch {}
}, MODULOS_CON_TUTORIAL);
await page.goto('http://localhost:3000/');
await page.getByPlaceholder('Correo electrónico o Usuario').fill('diego');
await page.getByPlaceholder('Contraseña').fill('bakandeya2026');
await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();
await page.locator('#nav-btn-resumen').first().waitFor({ state: 'visible', timeout: 30000 });
await page.waitForTimeout(800);
async function cerrarModales() {
  for (let i = 0; i < 10; i++) {
    const c = page.getByRole('button', { name: new RegExp(`^(${CIERRES.join('|')})`) }).first();
    if (await c.isVisible({ timeout: 1200 }).catch(() => false)) { await c.click({timeout:3000}).catch(()=>{}); await page.waitForTimeout(400); continue; }
    break;
  }
}
await cerrarModales();
async function desplegarGrupos() {
  for (let i = 0; i < 8; i++) {
    const p = page.getByTitle('Desplegar sección');
    if ((await p.count()) === 0) break;
    await p.first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
}
await desplegarGrupos();
async function establecerTema(tema) {
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
  await page.waitForTimeout(400);
}
async function irA(idNav) {
  await desplegarGrupos();
  const boton = page.locator(`#nav-btn-${idNav}`).first();
  await boton.waitFor({ state: 'visible', timeout: 10000 });
  await boton.click({ force: true });
  await page.waitForTimeout(700);
  await cerrarModales();
}

await establecerTema('light');
await irA('resumen');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/FINAL-panel-light.png` });

await irA('repertorio');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/FINAL-repertorio-light.png` });

await irA('booking');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/FINAL-booking-light.png` });

// Sidebar footer con ThemeToggle
await page.screenshot({ path: `${OUT}/FINAL-sidebar-footer-light.png`, clip: { x: 0, y: 780, width: 240, height: 120 } });

// Dashboard edit mode (resize UI)
await irA('resumen');
await page.waitForTimeout(500);
const editBtn = page.getByText('Personalizar Dashboard').first();
if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  await editBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/FINAL-dashboard-editmode-light.png` });
}

await establecerTema('dark');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/FINAL-dashboard-editmode-dark.png` });

await browser.close();
console.log('OK');
