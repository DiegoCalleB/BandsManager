import { test, expect, type Page } from '@playwright/test';
import { abrirApp, cerrarModales, irAEscritorio, irAMovil } from './helpers-visual';

/**
 * RESPONSIVE — la app no puede desbordar en ningún ancho.
 *
 * Comprueba en 360 · 390 · 768 · 1024 · 1440 px, en Claro y Oscuro, que ninguna
 * vista provoca scroll horizontal del documento y que ningún elemento visible se
 * sale por la derecha (salvo los que están dentro de un contenedor con scroll
 * propio: carruseles, tablas, pestañas deslizables). AGENTS.md §6 y craft-interfaces §5.
 */
test.describe.configure({ timeout: 120_000 });

const ANCHOS = [360, 390, 768, 1024, 1440];
const VISTAS_ESCRITORIO = ['resumen', 'calendario', 'booking', 'repertorio', 'discografia', 'reels', 'epk', 'fans', 'giras'];
const RANURAS_MOVIL = ['calendario', 'repertorio', 'epk'] as const;

async function desbordes(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const docAncho = document.documentElement.scrollWidth;
    /** Rect visible de un elemento: su caja recortada por el viewport y por todo ancestro que recorte
     *  (overflow hidden/clip). Si un ancestro hace scroll (auto/scroll) el control es alcanzable: se excusa. */
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      let l = Math.max(r.left, 0), t = Math.max(r.top, 0), rr = Math.min(r.right, vw), bb = Math.min(r.bottom, window.innerHeight);
      for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (a === document.body || a.id === 'root') continue; // el «clip» global de la app no cuenta como recorte legítimo
        if (/(auto|scroll)/.test(cs.overflowX)) return null;
        if (/(hidden|clip)/.test(cs.overflowX)) {
          const ar = a.getBoundingClientRect();
          l = Math.max(l, ar.left); rr = Math.min(rr, ar.right);
        }
      }
      return { full: r, l, rr };
    };
    const fuera: string[] = [];
    const objetivos = document.body.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');
    for (const el of Array.from(objetivos)) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) continue;
      if ((el as HTMLElement).offsetParent === null && cs.position !== 'fixed') continue;
      const v = visible(el);
      if (!v) continue;
      const visibleAncho = Math.max(0, v.rr - v.l);
      if (visibleAncho < r.width * 0.85) {
        const txt = ((el as HTMLElement).innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 28);
        fuera.push(`${el.tagName.toLowerCase()} «${txt}» recortado: ${Math.round(visibleAncho)}/${Math.round(r.width)}px (x ${Math.round(r.left)}–${Math.round(r.right)}, vw ${vw})`);
        if (fuera.length >= 8) break;
      }
    }
    return { docAncho, vw, fuera };
  });
}

test('el detector no es un test vacío: caza un control que se sale por la derecha', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirApp(page, true);
  await page.evaluate(() => {
    const b = document.createElement('button');
    b.textContent = 'Fuera de pantalla';
    b.style.cssText = 'position:absolute;top:120px;left:330px;width:120px;height:40px;z-index:5';
    document.getElementById('root')!.appendChild(b);
  });
  const d = await desbordes(page);
  expect(d.fuera.join(' ')).toContain('Fuera de pantalla');
});

for (const tema of ['light', 'dark']) {
  for (const ancho of ANCHOS) {
    test.describe(`${tema} · ${ancho}px`, () => {
      test.use({ viewport: { width: ancho, height: 844 } });
      const esMovil = ancho < 1024;
      const vistas = esMovil ? ['resumen', ...RANURAS_MOVIL] : VISTAS_ESCRITORIO;
      for (const vista of vistas) {
        test(vista, async ({ page }) => {
          await abrirApp(page, esMovil);
          await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
          if (vista !== 'resumen') {
            if (esMovil) await irAMovil(page, vista as (typeof RANURAS_MOVIL)[number]);
            else await irAEscritorio(page, vista);
          }
          await page.waitForTimeout(400);
          const d = await desbordes(page);
          expect(d.docAncho, `scroll horizontal del documento en ${vista}`).toBeLessThanOrEqual(d.vw + 1);
          expect(d.fuera, `elementos fuera de pantalla en ${vista}`).toEqual([]);
        });
      }
    });
  }
}

/**
 * MODALES EN MÓVIL — hoja inferior. En <640 px el panel del modal se pega abajo, ocupa todo el
 * ancho y no se sale por arriba; en escritorio sigue centrado.
 */
test.describe('modales · hoja inferior', () => {
  const abrirNuevoEscenario = async (page: Page) => {
    await abrirApp(page, true);
    await irAMovil(page, 'calendario');
    await page.getByRole('button', { name: 'Evento', exact: true }).first().click();
    await page.getByRole('button', { name: /\+ Concierto/ }).first().click();
    await page.waitForTimeout(500);
  };
  const geometria = (page: Page) => page.evaluate(() => {
    const raiz = document.querySelector('[data-modal-root]');
    const panel = raiz?.querySelector('.fixed.inset-0 > *') as HTMLElement | null;
    if (!panel) return null;
    const r = panel.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vw: innerWidth, vh: innerHeight };
  });

  test('en 390 px el modal es una hoja: pegado abajo y a todo el ancho', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await abrirNuevoEscenario(page);
    const g = await geometria(page);
    expect(g, 'no se abrió ningún modal').not.toBeNull();
    expect(Math.abs(g!.bottom - g!.vh)).toBeLessThanOrEqual(2);
    expect(g!.left).toBeLessThanOrEqual(1);
    expect(g!.right).toBeGreaterThanOrEqual(g!.vw - 1);
    expect(g!.top).toBeGreaterThanOrEqual(0);
  });
});

/**
 * MENÚ MÓVIL — el panel del drawer tiene que ser lo que recibe los toques. Una vez el scrim (z-9999)
 * quedó por encima del panel (z-10): el menú se veía oscurecido y tocar una opción cerraba el
 * menú en vez de navegar. Se comprueba qué elemento hay realmente en un punto del panel.
 */
test('menú móvil · el drawer recibe los toques, no el scrim', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirApp(page, true);
  await page.locator('nav[class*="bottom-0"]').last().locator('> button').nth(4).click();
  await page.waitForTimeout(700);
  const dentroDelPanel = await page.evaluate(() => {
    const el = document.elementFromPoint(120, 300);
    return !!el?.closest('.w-\\[280px\\]');
  });
  expect(dentroDelPanel, 'en (120,300) debería estar el panel del drawer, no el scrim').toBe(true);
});

/**
 * MENÚS DESPLEGABLES EN MÓVIL — un menú que se sale de la pantalla o queda recortado por la fila
 * que lo contiene es un menú que no existe. Dos casos reales de Discografía:
 *  · «Nuevo disco»: el panel se anclaba a la derecha de un botón a la izquierda y salía por el borde.
 *  · «⋮» de canción: la fila tiene overflow-x-auto y recortaba un menú absoluto (solo se veía 1 línea).
 */
test('menús de Discografía caben en pantalla y reciben los toques (móvil)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirApp(page, true);
  await irAMovil(page, 'repertorio');
  await page.getByRole('button', { name: /Discografía/ }).first().click();
  await page.waitForTimeout(900);
  await cerrarModales(page);

  // 1) Nuevo disco
  await page.getByRole('button', { name: /Nuevo disco/ }).first().click();
  const opcion = page.getByText('Disco vacío').first();
  await expect(opcion).toBeVisible();
  const caja = (await opcion.boundingBox())!;
  expect(caja.x, 'opción del menú fuera por la izquierda').toBeGreaterThanOrEqual(0);
  expect(caja.x + caja.width, 'opción del menú fuera por la derecha').toBeLessThanOrEqual(390);
  const encima = await page.evaluate(([x, y]) => (document.elementFromPoint(x, y) as HTMLElement | null)?.textContent ?? '', [caja.x + 10, caja.y + caja.height / 2]);
  expect(encima).toContain('Disco vacío');
  await page.keyboard.press('Escape');
  await page.locator('div.fixed.inset-0.z-30').first().click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});

  // 2) ⋮ de una canción (abre el primer disco que tenga canciones)
  const chevrons = page.locator('button:has(svg.lucide-chevron-down)');
  for (let i = 0; i < await chevrons.count(); i++) {
    const b = chevrons.nth(i);
    if (await b.isVisible()) { await b.click().catch(() => {}); await page.waitForTimeout(400); if (await page.getByRole('button', { name: 'Más opciones' }).count()) break; }
  }
  const mas = page.getByRole('button', { name: 'Más opciones' }).first();
  await mas.scrollIntoViewIfNeeded();
  await mas.click();
  const acordes = page.getByText('Ver acordes y letra').first();
  await expect(acordes).toBeVisible();
  const c2 = (await acordes.boundingBox())!;
  expect(c2.y + c2.height, 'menú de canción por debajo de la pantalla').toBeLessThanOrEqual(844);
  const enc2 = await page.evaluate(([x, y]) => (document.elementFromPoint(x, y) as HTMLElement | null)?.textContent ?? '', [c2.x + 10, c2.y + c2.height / 2]);
  expect(enc2, 'el menú de canción está tapado o recortado').toContain('Ver acordes');
});
