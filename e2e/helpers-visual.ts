import { expect, type Page } from '@playwright/test';

/** Helpers compartidos por las suites visuales (visual.spec.ts, superficies.spec.ts). */
/** Cabecera móvil autenticada. En escritorio existe pero es `md:hidden`, por
 *  eso cada viewport espera una señal distinta de "ya he entrado". */
export const PANEL_MOVIL = '[title*="cambiar de banda"]';

/** 2026-06-15 12:00 UTC. Fecha fija y arbitraria: lo que importa es que no se mueva. */
export const INSTANTE_FIJO = new Date('2026-06-15T12:00:00.000Z');

export const ESCRITORIO = { width: 1280, height: 800 };
export const MOVIL = { width: 390, height: 844 };

/** Tolerancia al antialiasing entre corridas. No tapa un cambio de layout. */
export const COMPARACION = { maxDiffPixelRatio: 0.02, animations: 'disabled' as const };

/** Apaga todo lo que se mueve. `animate-pulse` incluido. */
export const CSS_SIN_MOVIMIENTO = `
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

export async function prepararPagina(page: Page) {
  await page.addStyleTag({ content: CSS_SIN_MOVIMIENTO });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

/**
 * Abre la app con la sesión ya creada por `auth.setup.ts` (proyecto
 * `setup-visual`). No hace login: el backend limita a 10 logins/minuto y
 * quince tests logueándose agotaban la cuota a mitad de corrida.
 */
/**
 * Módulos con tutorial propio (`useModuleTutorial`), que se abre solo la
 * PRIMERA vez que se entra en cada uno. Marcarlos como vistos ANTES de cargar
 * la app es la única forma determinista de que no aparezca: cerrarlo de forma
 * reactiva no vale, porque se monta con retraso variable y capturaba la
 * pantalla con el tutorial dibujado encima en una corrida sí y otra no.
 *
 * Ver TUTORIAL_STORAGE_PREFIX en src/utils/userPreferences.ts.
 */
export const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio', 'song_studio'];

export async function silenciarTutoriales(page: Page) {
  await page.addInitScript((modulos: string[]) => {
    try {
      for (const m of modulos) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true');
      localStorage.setItem('bandmanager_onboarding_completed', 'true');
      localStorage.setItem('bandmanager_profile_wizard_completed', 'true');
    } catch {
      /* sin localStorage: el cierre reactivo de cerrarModales() hace de red */
    }
  }, MODULOS_CON_TUTORIAL);
}

export async function abrirApp(page: Page, esMovil: boolean) {
  await page.clock.setFixedTime(INSTANTE_FIJO);
  await silenciarTutoriales(page);
  await page.goto('/');

  // El selector de banda es `md:hidden`, así que en escritorio resuelve pero
  // nunca se hace visible: cada viewport espera su propia señal de sesión.
  const señal = esMovil
    ? page.locator(PANEL_MOVIL).first()
    : page.locator('#nav-btn-resumen').first();
  await expect(señal).toBeVisible({ timeout: 30_000 });

  await cerrarModales(page);
  await prepararPagina(page);
}

/**
 * Cierra cualquier modal que tape la pantalla antes de capturar.
 *
 * Hay DOS familias y las dos han hecho fallar esta suite:
 *  · Bienvenida — asistente de configuración y guía «¿Por dónde empezamos
 *    hoy?». `auth.setup.ts` ya las atraviesa una vez; esto cubre que vuelvan.
 *  · Tutorial de módulo (`ModuleTutorialModal`) — salta la PRIMERA vez que se
 *    abre cada módulo, así que aparece al navegar, no al entrar. Su botón se
 *    llama «Cerrar guía (Esc)», con sufijo, por eso la coincidencia es por
 *    prefijo y no exacta: con `^...$` no lo pillaba y booking fallaba de forma
 *    intermitente con el tutorial dibujado encima.
 *
 * Por eso se llama tras el login Y tras cada cambio de módulo. Si no hay nada
 * abierto —lo normal— sale en un par de segundos sin coste.
 */
export const CIERRES = ['Cerrar asistente', 'Cerrar guía', 'Explorar por mi cuenta', '¡Entendido'];

export async function cerrarModales(page: Page) {
  const cierres = page.getByRole('button', { name: new RegExp(`^(${CIERRES.join('|')})`) });

  for (let intento = 0; intento < 6; intento++) {
    const cierre = cierres.first();
    if (!(await cierre.isVisible({ timeout: 2_000 }).catch(() => false))) return;
    await cierre.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/**
 * Escritorio: los grupos del sidebar (Directorio, Música, Promoción, Negocio)
 * arrancan PLEGADOS, así que sus `#nav-btn-*` no existen hasta desplegar SU
 * grupo. Solo `resumen` y `calendario` están fijos arriba (NAV_PINNED_TOP_IDS).
 *
 * Es un acordeón DE VERDAD (App.tsx `toggleNavGroup`: abrir un grupo cierra
 * los demás — decisión de UX deliberada, no un bug), así que no se puede
 * "desplegar todo" de una sentada: como mucho hay un grupo abierto en cada
 * momento. Mapa duplicado a mano desde `src/config/navGroups.tsx` porque el
 * proyecto E2E no comparte bundler con la app — si cambia la agrupación allí,
 * hay que tocarlo aquí también.
 */
export const GRUPO_POR_NAV_ID: Record<string, string> = {
  booking: 'Directorio', medios: 'Directorio', management: 'Directorio', bandas: 'Directorio',
  repertorio: 'Música', ensayos: 'Música', discografia: 'Música',
  epk: 'Promoción', fans: 'Promoción', reels: 'Promoción',
  giras: 'Negocio', finanzas: 'Negocio', merchan: 'Negocio',
};

export async function irAEscritorio(page: Page, idNav: string) {
  const boton = page.locator(`#nav-btn-${idNav}`).first();
  if (!(await boton.isVisible({ timeout: 500 }).catch(() => false))) {
    const grupo = GRUPO_POR_NAV_ID[idNav];
    if (grupo) {
      // Header del grupo (no el chevron): si el grupo no está activo, un solo
      // clic ya navega a su primer item Y lo despliega (ver `handleHeaderClick`
      // en NavGroupSection.tsx) — para los demás items del grupo basta con que
      // quede abierto para clicar su botón directamente a continuación.
      await page.getByRole('button', { name: new RegExp(`^${grupo}`) }).first().click();
      await page.waitForTimeout(300);
    }
  }
  await boton.waitFor({ state: 'visible', timeout: 10_000 });
  await boton.click();
  await page.waitForTimeout(700); // asentar render tras cambiar de módulo
  await cerrarModales(page);      // el tutorial de módulo salta aquí, no al entrar
  await prepararPagina(page);
}

/**
 * Móvil: la navegación es la barra inferior de NAV_BOTTOM_BAR_SLOTS, cuyos
 * botones no llevan `id` (a diferencia del sidebar) y cuyo `title` va
 * traducido, así que ni uno ni otro sirven de ancla. Se selecciona por
 * posición dentro de la barra, que es el orden declarado en
 * config/navGroups.tsx: resumen · calendario · música · promoción · más.
 */
export const RANURAS_MOVIL = { resumen: 0, calendario: 1, repertorio: 2, epk: 3 } as const;

export async function irAMovil(page: Page, ranura: keyof typeof RANURAS_MOVIL) {
  const barra = page.locator('nav[class*="bottom-0"]').last();
  await barra.waitFor({ state: 'visible', timeout: 10_000 });
  await barra.locator('> button').nth(RANURAS_MOVIL[ranura]).click();
  await page.waitForTimeout(700);
  await cerrarModales(page);      // el tutorial de módulo salta aquí, no al entrar
  await prepararPagina(page);
}

