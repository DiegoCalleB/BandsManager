import { test, expect, type Page } from '@playwright/test';

/**
 * RED DE REGRESIÓN VISUAL — fase 0 de la migración a «Espectro».
 *
 * Por qué existe: los 1000+ tests unitarios son de lógica y NO comprueban
 * `className`, así que no detectan que un cambio de estilos haya desplazado,
 * solapado o recortado media pantalla. Esta suite es la única red que ve eso.
 *
 * Cómo se usa:
 *   npm run test:visual            → compara contra las capturas de referencia
 *   npm run test:visual:update     → regenera las referencias (solo a propósito)
 *
 * Cuándo regenerar: cuando un cambio visual sea DELIBERADO y esté revisado.
 * Nunca para "que pase el CI" — ese es justo el fallo que esta suite detecta.
 *
 * Determinismo. Tres cosas hacen que una captura sea estable entre corridas:
 *  1. Reloj congelado (`page.clock.setFixedTime`): sin esto el calendario y
 *     cualquier "hace N días" cambian solos cada día y la suite se vuelve
 *     ruido que nadie mira.
 *  2. Animaciones y transiciones desactivadas, incluido `animate-pulse`, que
 *     la app usa en 138 sitios y congela en un fotograma distinto cada vez.
 *  3. Fuentes cargadas antes de disparar (`document.fonts.ready`): capturar a
 *     media carga produce diffs fantasma por el cambio de métrica.
 *
 * Aviso conocido: las referencias se generan por plataforma (Playwright las
 * sufija). Si CI corre en un contenedor con otro renderizado de fuentes habrá
 * que regenerarlas allí una vez. El umbral de `maxDiffPixelRatio` absorbe el
 * antialiasing, no un cambio de layout.
 */

// Login + cadena de modales + cambio de modulo no cabe en los 30s por defecto.
test.describe.configure({ timeout: 90_000 });

/** Cabecera móvil autenticada. En escritorio existe pero es `md:hidden`, por
 *  eso cada viewport espera una señal distinta de "ya he entrado". */
const PANEL_MOVIL = '[title*="cambiar de banda"]';

/** 2026-06-15 12:00 UTC. Fecha fija y arbitraria: lo que importa es que no se mueva. */
const INSTANTE_FIJO = new Date('2026-06-15T12:00:00.000Z');

const ESCRITORIO = { width: 1280, height: 800 };
const MOVIL = { width: 390, height: 844 };

/** Tolerancia al antialiasing entre corridas. No tapa un cambio de layout. */
const COMPARACION = { maxDiffPixelRatio: 0.02, animations: 'disabled' as const };

/** Apaga todo lo que se mueve. `animate-pulse` incluido. */
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

async function prepararPagina(page: Page) {
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
const MODULOS_CON_TUTORIAL = ['booking', 'calendario', 'epk', 'fans', 'repertorio', 'song_studio'];

async function silenciarTutoriales(page: Page) {
  await page.addInitScript((modulos: string[]) => {
    try {
      for (const m of modulos) localStorage.setItem(`bm_tutorial_seen_${m}`, 'true');
    } catch {
      /* sin localStorage: el cierre reactivo de cerrarModales() hace de red */
    }
  }, MODULOS_CON_TUTORIAL);
}

async function abrirApp(page: Page, esMovil: boolean) {
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
const CIERRES = ['Cerrar asistente', 'Cerrar guía', 'Explorar por mi cuenta', '¡Entendido'];

async function cerrarModales(page: Page) {
  const cierres = page.getByRole('button', { name: new RegExp(`^(${CIERRES.join('|')})`) });

  for (let intento = 0; intento < 6; intento++) {
    const cierre = cierres.first();
    if (!(await cierre.isVisible({ timeout: 2_000 }).catch(() => false))) return;
    await cierre.click();
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
const GRUPO_POR_NAV_ID: Record<string, string> = {
  booking: 'Directorio', medios: 'Directorio', management: 'Directorio', bandas: 'Directorio',
  repertorio: 'Música', ensayos: 'Música', discografia: 'Música',
  epk: 'Promoción', fans: 'Promoción', reels: 'Promoción',
  giras: 'Negocio', finanzas: 'Negocio', merchan: 'Negocio',
};

async function irAEscritorio(page: Page, idNav: string) {
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
const RANURAS_MOVIL = { resumen: 0, calendario: 1, repertorio: 2, epk: 3 } as const;

async function irAMovil(page: Page, ranura: keyof typeof RANURAS_MOVIL) {
  const barra = page.locator('nav[class*="bottom-0"]').last();
  await barra.waitFor({ state: 'visible', timeout: 10_000 });
  await barra.locator('> button').nth(RANURAS_MOVIL[ranura]).click();
  await page.waitForTimeout(700);
  await cerrarModales(page);      // el tutorial de módulo salta aquí, no al entrar
  await prepararPagina(page);
}

test.describe('regresión visual — escritorio', () => {
  test.use({ viewport: ESCRITORIO });

  // Sin sesión: el proyecto `visual` arrastra storageState, y esta pantalla
  // solo existe cuando NO hay sesión.
  test.describe('sin sesión', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('login sin sesión', async ({ page }) => {
    // Este sí necesita contexto limpio: comprueba la pantalla de acceso.
    await page.clock.setFixedTime(INSTANTE_FIJO);
    await silenciarTutoriales(page);
    await page.goto('/');
    await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
    await prepararPagina(page);
    await expect(page).toHaveScreenshot('login-escritorio.png', COMPARACION);
    });
  });

  // Sin 'finanzas' ni 'merchan' a propósito, y no por dejadez: el usuario
  // semilla está en plan `de_gira`, cuyo allowedModules (planPermissions.ts)
  // no los incluye — solo `cabeza_de_cartel` los tiene. El sidebar los filtra
  // correctamente, así que no hay nada que capturar. Para cubrirlos haría
  // falta un usuario semilla con ese plan; queda pendiente y anotado.
  for (const { id, nombre } of [
    { id: 'resumen', nombre: 'panel' },
    { id: 'booking', nombre: 'booking' },
    { id: 'calendario', nombre: 'calendario' },
    { id: 'repertorio', nombre: 'repertorio' },
    { id: 'reels', nombre: 'reels' },
    { id: 'epk', nombre: 'epk' },
    { id: 'fans', nombre: 'fans' },
    { id: 'giras', nombre: 'giras' },
  ]) {
    test(nombre, async ({ page }) => {
      await abrirApp(page, false);
      await irAEscritorio(page, id);
      await expect(page).toHaveScreenshot(`${nombre}-escritorio.png`, COMPARACION);
    });
  }
});

test.describe('regresión visual — móvil', () => {
  test.use({ viewport: MOVIL });

  test.describe('sin sesión', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('login sin sesión', async ({ page }) => {
    // Este sí necesita contexto limpio: comprueba la pantalla de acceso.
    await page.clock.setFixedTime(INSTANTE_FIJO);
    await silenciarTutoriales(page);
    await page.goto('/');
    await expect(page.getByPlaceholder('Correo electrónico o Usuario')).toBeVisible();
    await prepararPagina(page);
    await expect(page).toHaveScreenshot('login-movil.png', COMPARACION);
    });
  });

  // AGENTS.md §6 exige diseñar de verdad a ~390px, así que el móvil no es un
  // extra: es donde más barato sale romper algo sin enterarse.
  test('panel', async ({ page }) => {
    await abrirApp(page, true);
    await expect(page).toHaveScreenshot('panel-movil.png', COMPARACION);
  });

  for (const ranura of ['calendario', 'repertorio', 'epk'] as const) {
    test(ranura, async ({ page }) => {
      await abrirApp(page, true);
      await irAMovil(page, ranura);
      await expect(page).toHaveScreenshot(`${ranura}-movil.png`, COMPARACION);
    });
  }

  /**
   * Regresión directa de la sesión 2026-09-23: el modal de "Añadir Widget" se
   * pintaba tapado por la barra del reproductor y la nav inferior (z-50 vs su
   * propio contexto de apilamiento en App.tsx) y la píldora "Todos" se
   * aplastaba a 0 de alto (overflow-x-auto sin shrink-0 dentro de un
   * flex-col). Un diff de píxeles no basta aquí — lo que importa es la
   * geometría: el overlay debe cubrir el viewport entero y "Cerrar" debe
   * quedar visible y clicable, no una franja de arriba nada más.
   */
  test('modal añadir widget cubre el viewport y no lo tapa nada', async ({ page }) => {
    await abrirApp(page, true);

    await page.getByText('Personalizar Dashboard').click();
    await page.getByText('Añadir Widget').click();

    const cerrar = page.getByRole('button', { name: 'Cerrar' });
    await expect(cerrar).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport no disponible');

    // Selector por clase ambiguo (puede haber otros z-[9999] montados aunque cerrados,
    // p. ej. el panel de chat del agente IA) — se sube desde el propio título del modal
    // hasta el primer ancestro con position:fixed, que es el overlay real sea cual sea
    // su clase.
    const overlayBox = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find((h) =>
        h.textContent?.includes('Catálogo de Widgets del Dashboard')
      );
      if (!heading) return null;
      let el: HTMLElement | null = heading;
      while (el && getComputedStyle(el).position !== 'fixed') el = el.parentElement;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(overlayBox).not.toBeNull();
    expect(overlayBox!.x).toBeCloseTo(0, 0);
    expect(overlayBox!.y).toBeCloseTo(0, 0);
    expect(overlayBox!.width).toBeCloseTo(viewport.width, 0);
    expect(overlayBox!.height).toBeCloseTo(viewport.height, 0);

    const cerrarBox = await cerrar.boundingBox();
    expect(cerrarBox).not.toBeNull();
    expect(cerrarBox!.y).toBeLessThanOrEqual(viewport.height);
    expect(cerrarBox!.y).toBeGreaterThanOrEqual(0);

    await prepararPagina(page);
    await expect(page).toHaveScreenshot('catalogo-widgets-movil.png', COMPARACION);
  });
});
