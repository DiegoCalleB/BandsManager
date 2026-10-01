import { test as setup, expect } from '@playwright/test';

/**
 * Login único para la suite de regresión visual.
 *
 * Por qué existe: el backend limita el login a 10 intentos por minuto
 * (`loginRateLimiter`, ver AGENTS.md §2.2). Con un login por test, la suite
 * visual se auto-bloqueaba a mitad de corrida con «Demasiadas peticiones» y
 * fallaba de forma aleatoria — un test que falla por su propio caudal es peor
 * que no tenerlo.
 *
 * De paso resuelve otro problema: la cadena de modales de bienvenida
 * (asistente de configuración y guía «¿Por dónde empezamos hoy?») solo hay que
 * atravesarla aquí, una vez, en lugar de en cada uno de los quince tests.
 *
 * El estado se guarda en e2e/.auth/ (ignorado por git: es un token de sesión,
 * aunque sea de un usuario semilla local — no se versionan credenciales).
 */

/** Relativa a la raíz del repo: el proyecto es ESM y no hay __dirname. */
export const FICHERO_SESION = 'e2e/.auth/user.json';

const USUARIO_SEMILLA = { usuario: 'diego', clave: 'bakandeya2026' };
const CIERRES_BIENVENIDA = ['Cerrar asistente', 'Cerrar guía', 'Explorar por mi cuenta'];

/** Ver MODULOS_CON_TUTORIAL en visual.spec.ts: se marcan como vistos para que
 *  el tutorial de módulo no se abra solo y acabe dentro de las capturas. */
const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio', 'song_studio'];

setup('crear sesión reutilizable', async ({ page }) => {
  setup.setTimeout(120_000);

  await page.addInitScript((modulos: string[]) => {
    try {
      for (const m of modulos) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true');
    } catch { /* sin localStorage */ }
  }, MODULOS_CON_TUTORIAL);

  await page.goto('/login');
  await page.getByPlaceholder('Correo electrónico o Usuario').fill(USUARIO_SEMILLA.usuario);
  await page.getByPlaceholder('Contraseña').fill(USUARIO_SEMILLA.clave);
  await page.getByRole('button', { name: 'Entrar a mi cuenta' }).click();

  // El sidebar de escritorio es la señal de sesión válida en este viewport.
  await expect(page.locator('#nav-btn-resumen').first()).toBeVisible({ timeout: 30_000 });

  // Los modales se montan DESPUÉS de que el sidebar ya sea visible, así que
  // hay que esperarlos activamente: comprobar una sola vez da falso negativo.
  const cierres = page.getByRole('button', {
    name: new RegExp(`^(${CIERRES_BIENVENIDA.join('|')})`),
  });
  await cierres.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});

  for (let intento = 0; intento < 6; intento++) {
    const cierre = cierres.first();
    if (!(await cierre.isVisible({ timeout: 2_000 }).catch(() => false))) break;
    await cierre.click();
    await page.waitForTimeout(400);
  }

  // Comprobación real: sin overlay, el sidebar acepta clics. Si esto falla,
  // toda la suite visual saldría con un modal tapando las capturas.
  await expect(page.locator('#nav-btn-resumen').first()).toBeEnabled();
  await page.locator('#nav-btn-resumen').first().click({ timeout: 10_000 });

  await page.context().storageState({ path: FICHERO_SESION });
});
