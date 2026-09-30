import { test, expect } from '@playwright/test';
import {
  INSTANTE_FIJO,
  ESCRITORIO,
  MOVIL,
  COMPARACION,
  prepararPagina,
  silenciarTutoriales,
  abrirApp,
  irAEscritorio,
  irAMovil,
} from './helpers-visual';

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

    await page.locator('#dashboard-settings-gear-btn').click();
    await page.getByText('Personalizar / Reordenar').click();
    await page.getByText('Añadir Widget').click();

    const cerrar = page.getByRole('button', { name: 'Cerrar', exact: true }).last();
    await expect(cerrar).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport no disponible');

    // Selector por clase ambiguo (puede haber otros z-[9999] montados aunque cerrados,
    // p. ej. el panel de chat del agente IA) — se sube desde el propio título del modal
    // hasta el primer ancestro con position:fixed, que es el overlay real sea cual sea
    // su clase.
    const overlayBox = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h3')).find((h) =>
        h.textContent?.includes('Catálogo de widgets del dashboard')
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
