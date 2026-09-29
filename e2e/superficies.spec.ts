import { test, expect, type Page } from '@playwright/test';
import { ESCRITORIO, MOVIL, abrirApp, irAEscritorio, irAMovil } from './helpers-visual';

/**
 * RED CONTRA «TARJETAS FANTASMA» — Ley 1 de visual-identity (ningún borde).
 *
 * Sin bordes, lo único que separa una tarjeta de su fondo es el escalón de
 * luminancia. Si una caja con radio pinta EXACTAMENTE el mismo color que el
 * contenedor que la rodea (y no tiene borde ni sombra), es invisible: el
 * contenido flota sin agrupar. Ni tsc, ni el audit, ni un diff de píxeles lo
 * detectan cuando el snapshot se regenera; el color computado sí.
 *
 * Corre en los tres temas y en los viewports de la suite visual.
 */
test.describe.configure({ timeout: 120_000 });

const TEMAS = ['light', 'dark', 'classic'] as const;

/** Claro y Oscuro son los temas de Espectro: fallan el test. Clásico es el
 *  diseño heredado (tokens propios, ver §7 de visual-identity) y solo informa:
 *  no se toca el marcado por él, pero se deja constancia en el informe. */
function comprobar(tema: string, etiqueta: string, fantasmas: unknown[]) {
  if (!fantasmas.length) return;
  console.log(`[${tema}/${etiqueta}]`, JSON.stringify(fantasmas.slice(0, 12), null, 1));
  if (tema === 'classic') {
    test.info().annotations.push({ type: 'clasico-informativo', description: `${etiqueta}: ${fantasmas.length} cajas` });
    return;
  }
  expect(fantasmas, `tarjetas invisibles en ${etiqueta} (${tema})`).toEqual([]);
}

/** Devuelve las cajas con radio cuyo fondo coincide con el del contenedor. */
async function cajasFantasma(page: Page) {
  return page.evaluate(() => {
    const parse = (c: string): [number, number, number, number] | null => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const fondoEfectivo = (el: Element | null): [number, number, number] => {
      const capas: [number, number, number, number][] = [];
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c[3] > 0) { capas.push(c); if (c[3] >= 0.99) break; }
      }
      let base: [number, number, number] = [255, 255, 255];
      for (const c of capas.reverse()) {
        base = [0, 1, 2].map((i) => c[i] * c[3] + base[i] * (1 - c[3])) as [number, number, number];
      }
      return base;
    };
    const campos: Element[] = Array.from(document.body.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=hidden]), select, textarea'));
    const fuera: { tag: string; clase: string; texto: string; caja: string; fondoPadre: string }[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const esCampo = campos.includes(el);
      const cs = getComputedStyle(el);
      const bg = parse(cs.backgroundColor);
      if (!bg || bg[3] < 0.5) continue; // un campo transparente se apoya en su envoltorio: no es fantasma
      const r = el.getBoundingClientRect();
      if (r.width < (esCampo ? 40 : 64) || r.height < (esCampo ? 20 : 28) || r.bottom < 0 || r.top > innerHeight) continue;
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const radio = parseFloat(cs.borderTopLeftRadius);
      if (!esCampo && !(radio >= 8)) continue;
      const borde = parseFloat(cs.borderTopWidth) > 0 && parse(cs.borderTopColor)?.[3];
      if (borde || cs.boxShadow !== 'none') continue;
      if (!esCampo && !((el as HTMLElement).innerText || '').trim()) continue;
      if (esCampo && (cs.opacity === '0' || r.width === 0)) continue;
      const propio = fondoEfectivo(el);
      const padre = fondoEfectivo(el.parentElement);
      const dif = Math.max(...propio.map((v, i) => Math.abs(v - padre[i])));
      if (dif <= 4) {
        fuera.push({
          tag: el.tagName.toLowerCase(),
          clase: (el.getAttribute('class') || '').slice(0, 110),
          texto: esCampo ? `[campo] ${(el as HTMLInputElement).placeholder || (el as HTMLInputElement).value || ''}` : ((el as HTMLElement).innerText || '').trim().slice(0, 40),
          fondoPadre: (() => { for (let e = el.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (parse(c)?.[3]) return `${e.tagName.toLowerCase()}.${(e.getAttribute('class') || '').slice(0, 60)} ${c}`; } return 'ninguno'; })(),
          caja: `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)},${Math.round(r.top)}`,
        });
      }
    }
    return fuera;
  });
}

async function aplicarTema(page: Page, tema: string) {
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
  await page.waitForTimeout(200);
}

const VISTAS_ESCRITORIO = ['resumen', 'booking', 'calendario', 'repertorio', 'reels', 'epk', 'fans', 'giras'];

for (const tema of TEMAS) {
  test.describe(`superficies — ${tema}`, () => {
    test.describe('escritorio', () => {
      test.use({ viewport: ESCRITORIO });
      for (const id of VISTAS_ESCRITORIO) {
        test(id, async ({ page }) => {
          await abrirApp(page, false);
          await irAEscritorio(page, id);
          await aplicarTema(page, tema);
          const fantasmas = await cajasFantasma(page);
          comprobar(tema, id, fantasmas);
        });
      }
    });

    test.describe('móvil', () => {
      test.use({ viewport: MOVIL });
      test('resumen', async ({ page }) => {
        await abrirApp(page, true);
        await aplicarTema(page, tema);
        const fantasmas = await cajasFantasma(page);
        comprobar(tema, 'resumen-movil', fantasmas);
      });
      for (const ranura of ['calendario', 'repertorio', 'epk'] as const) {
        test(ranura, async ({ page }) => {
          await abrirApp(page, true);
          await irAMovil(page, ranura);
          await aplicarTema(page, tema);
          const fantasmas = await cajasFantasma(page);
          comprobar(tema, `${ranura}-movil`, fantasmas);
        });
      }
    });
  });
}


/**
 * MODALES — las superficies donde más se rompió el apilado de luminancia al
 * quitar los bordes (modal → tarjeta → campo son tres escalones seguidos).
 * Cada opener llega hasta el modal por la interfaz, como lo haría un usuario.
 */
const MODALES: Record<string, (p: Page) => Promise<void>> = {
  'evento-concierto': async (p) => {
    await irAEscritorio(p, 'calendario');
    await p.getByRole('button', { name: /\+ Evento/ }).first().click();
    await p.getByRole('button', { name: /\+ Concierto/ }).first().click();
  },
  'evento-ensayo': async (p) => {
    await irAEscritorio(p, 'calendario');
    await p.getByRole('button', { name: /\+ Evento/ }).first().click();
    await p.getByRole('button', { name: /\+ Ensayo/ }).first().click();
  },
  'ficha-evento': async (p) => {
    await irAEscritorio(p, 'calendario');
    await p.getByText(/Posible Concierto/).first().click();
  },
  'escenario-nuevo': async (p) => {
    await irAEscritorio(p, 'booking');
    await p.getByRole('button', { name: /Escenario/ }).first().click();
  },
  'cancion-nueva': async (p) => {
    await irAEscritorio(p, 'discografia');
    await p.locator('#btn-add-song').click();
  },
  perfil: async (p) => {
    await p.getByText('Diego', { exact: true }).first().click();
  },
  'guia-rapida': async (p) => {
    await irAEscritorio(p, 'calendario');
    await p.getByRole('button', { name: /Guía rápida/ }).first().click();
  },
};

for (const tema of TEMAS) {
  test.describe(`modales — ${tema}`, () => {
    test.use({ viewport: ESCRITORIO });
    for (const [nombre, abrir] of Object.entries(MODALES)) {
      test(nombre, async ({ page }) => {
        await abrirApp(page, false);
        await aplicarTema(page, tema);
        await abrir(page);
        await page.waitForTimeout(700);
        if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/m-${tema}-${nombre}.png` });
        comprobar(tema, `modal-${nombre}`, await cajasFantasma(page));
      });
    }
  });
}
