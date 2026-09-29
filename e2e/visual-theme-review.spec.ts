import { test, expect, type Page } from '@playwright/test';

/**
 * AUDITORÍA DE TEMAS LIGHT/DARK
 *
 * Captura todas las pantallas principales en los tres temas disponibles:
 * light, dark, classic. Pensado para revisión manual y verificación de
 * que cada tema sea coherente y legible sin mezcla de colores.
 */

test.describe.configure({ timeout: 90_000 });

const PANEL_MOVIL = '[title*="cambiar de banda"]';
const INSTANTE_FIJO = new Date('2026-06-15T12:00:00.000Z');
const ESCRITORIO = { width: 1280, height: 800 };

const CSS_SIN_MOVIMIENTO = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio', 'song_studio'];
const CIERRES = ['Cerrar asistente', 'Cerrar guía', 'Explorar por mi cuenta', '¡Entendido'];

async function prepararPagina(page: Page) {
  await page.addStyleTag({ content: CSS_SIN_MOVIMIENTO });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function silenciarTutoriales(page: Page) {
  await page.addInitScript((modulos: string[]) => {
    try {
      for (const m of modulos) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true');
    } catch { }
  }, MODULOS_CON_TUTORIAL);
}

async function cerrarModales(page: Page) {
  const cierres = page.getByRole('button', { name: new RegExp(`^(${CIERRES.join('|')})`) });
  for (let intento = 0; intento < 6; intento++) {
    const cierre = cierres.first();
    if (!(await cierre.isVisible({ timeout: 2_000 }).catch(() => false))) return;
    await cierre.click();
    await page.waitForTimeout(400);
  }
}

async function desplegarGrupos(page: Page) {
  const plegados = page.getByTitle('Desplegar sección');
  for (let i = await plegados.count(); i > 0; i = await plegados.count()) {
    await plegados.first().click();
    await page.waitForTimeout(150);
    if ((await plegados.count()) >= i) break;
  }
}

async function irAEscritorio(page: Page, idNav: string) {
  await desplegarGrupos(page);
  const boton = page.locator(`#nav-btn-${idNav}`).first();
  await boton.waitFor({ state: 'visible', timeout: 10_000 });
  await boton.click();
  await page.waitForTimeout(700);
  await cerrarModales(page);
  await prepararPagina(page);
}

async function abrirApp(page: Page) {
  await page.clock.setFixedTime(INSTANTE_FIJO);
  await silenciarTutoriales(page);
  await page.goto('/');
  const señal = page.locator('#nav-btn-resumen').first();
  await expect(señal).toBeVisible({ timeout: 30_000 });
  await cerrarModales(page);
  await prepararPagina(page);
}

async function establecerTema(page: Page, tema: 'light' | 'dark' | 'classic') {
  // Localiza el botón de tema en settings o usa API directamente
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme_preference', t);
  }, tema);
  await page.waitForTimeout(500); // esperar a que se aplique el tema
}

const TEMAS = ['light', 'dark', 'classic'] as const;
const PANTALLAS = [
  { id: 'resumen', nombre: 'panel' },
  { id: 'booking', nombre: 'booking' },
  { id: 'calendario', nombre: 'calendario' },
  { id: 'repertorio', nombre: 'repertorio' },
  { id: 'reels', nombre: 'reels' },
  { id: 'epk', nombre: 'epk' },
  { id: 'fans', nombre: 'fans' },
  { id: 'giras', nombre: 'giras' },
];

test.describe('auditoría visual — temas light/dark/classic', () => {
  test.use({ viewport: ESCRITORIO });

  for (const tema of TEMAS) {
    test.describe(`tema: ${tema}`, () => {
      for (const pantalla of PANTALLAS) {
        test(pantalla.nombre, async ({ page }) => {
          await abrirApp(page);
          await establecerTema(page, tema);

          // Solo navega si no es la pantalla inicial
          if (pantalla.id !== 'resumen') {
            await irAEscritorio(page, pantalla.id);
          }

          // Captura pantalla completa (scrollable)
          await expect(page).toHaveScreenshot(
            `${pantalla.nombre}-${tema}.png`,
            { maxDiffPixelRatio: 0.02, animations: 'disabled' }
          );
        });
      }
    });
  }
});
