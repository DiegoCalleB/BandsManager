import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  resolverTema,
  leerPreferencia,
  guardarPreferencia,
  aplicarTema,
  escucharSistema,
  esPreferenciaValida,
  inicializarTema,
  TEMA_POR_DEFECTO,
  CLAVE_TEMA,
  PREFERENCIAS,
} from '../temaEspectro';

/*
 * Este repo corre Vitest en entorno node (no hay jsdom ni happy-dom, y los
 * 1003 tests existentes son de lógica pura). Para no meter una dependencia
 * nueva solo por estos tests, se doblan `document`, `localStorage` y
 * `matchMedia` con lo mínimo que usa el módulo.
 */

let almacen: Record<string, string>;
let lanzarAlLeer = false;
let lanzarAlEscribir = false;

function dobleDocument() {
  const dataset: Record<string, string> = {};
  return { documentElement: { dataset } };
}

let doc: ReturnType<typeof dobleDocument>;

/** Simula prefers-color-scheme y devuelve el control de los oyentes. */
function simularSistema(prefiereOscuro: boolean) {
  const oyentes: Array<() => void> = [];
  vi.stubGlobal('window', {
    matchMedia: (query: string) => ({
      matches: query.includes('dark') && prefiereOscuro,
      media: query,
      addEventListener: (_: string, cb: () => void) => oyentes.push(cb),
      removeEventListener: (_: string, cb: () => void) => {
        const i = oyentes.indexOf(cb);
        if (i >= 0) oyentes.splice(i, 1);
      },
    }),
  });
  return {
    disparar: () => [...oyentes].forEach((cb) => cb()),
    numOyentes: () => oyentes.length,
  };
}

const temaEstampado = () => doc.documentElement.dataset.theme;

beforeEach(() => {
  almacen = {};
  lanzarAlLeer = false;
  lanzarAlEscribir = false;
  doc = dobleDocument();

  vi.stubGlobal('document', doc);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => {
      if (lanzarAlLeer) throw new Error('almacenamiento bloqueado');
      return k in almacen ? almacen[k] : null;
    },
    setItem: (k: string, v: string) => {
      if (lanzarAlEscribir) throw new Error('cuota superada');
      almacen[k] = v;
    },
  });
  simularSistema(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('temaEspectro', () => {
  describe('resolverTema', () => {
    it('devuelve el tema explícito tal cual, ignorando el sistema', () => {
      simularSistema(true);
      expect(resolverTema('light')).toBe('light');
      expect(resolverTema('dark')).toBe('dark');
      expect(resolverTema('classic')).toBe('classic');
    });

    it('con "system" sigue al sistema operativo', () => {
      simularSistema(true);
      expect(resolverTema('system')).toBe('dark');
      simularSistema(false);
      expect(resolverTema('system')).toBe('light');
    });

    it('con "system" cae a claro si el navegador no soporta matchMedia', () => {
      vi.stubGlobal('window', {});
      expect(resolverTema('system')).toBe('light');
    });
  });

  describe('preferencia por defecto', () => {
    it('es "classic": introducir los tokens no cambia lo que ve nadie', () => {
      expect(TEMA_POR_DEFECTO).toBe('classic');
      expect(leerPreferencia()).toBe('classic');
    });

    it('ignora un valor corrupto o de otro sistema de temas', () => {
      almacen[CLAVE_TEMA] = 'indie_velvet';
      expect(leerPreferencia()).toBe('classic');
    });

    it('no revienta si localStorage lanza (navegación privada)', () => {
      lanzarAlLeer = true;
      expect(() => leerPreferencia()).not.toThrow();
      expect(leerPreferencia()).toBe('classic');
    });
  });

  describe('esPreferenciaValida', () => {
    it('acepta solo las cuatro preferencias reales', () => {
      ['light', 'dark', 'classic', 'system'].forEach((v) => expect(esPreferenciaValida(v)).toBe(true));
      [null, undefined, 42, '', 'stitch_light', 'indie_velvet'].forEach((v) => expect(esPreferenciaValida(v)).toBe(false));
    });

    it('toda opción expuesta en PREFERENCIAS es válida', () => {
      expect(PREFERENCIAS.length).toBeGreaterThan(0);
      PREFERENCIAS.forEach((p) => expect(esPreferenciaValida(p.id)).toBe(true));
    });

    it('PREFERENCIAS incluye "classic": el diseño anterior no se elimina', () => {
      expect(PREFERENCIAS.map((p) => p.id)).toContain('classic');
    });
  });

  describe('aplicarTema', () => {
    it('estampa el tema resuelto en data-theme', () => {
      aplicarTema('dark');
      expect(temaEstampado()).toBe('dark');
      aplicarTema('system');
      expect(temaEstampado()).toBe('light');
    });

    it('nunca estampa "system": data-theme siempre es un tema pintable', () => {
      simularSistema(true);
      aplicarTema('system');
      expect(temaEstampado()).toBe('dark');
      expect(temaEstampado()).not.toBe('system');
    });
  });

  describe('guardarPreferencia', () => {
    it('persiste la preferencia, no el tema resuelto', () => {
      simularSistema(true);
      guardarPreferencia('system');
      expect(almacen[CLAVE_TEMA]).toBe('system');
      expect(temaEstampado()).toBe('dark');
    });

    it('sigue aplicando el tema aunque no se pueda persistir', () => {
      lanzarAlEscribir = true;
      expect(() => guardarPreferencia('dark')).not.toThrow();
      expect(temaEstampado()).toBe('dark');
    });
  });

  describe('escucharSistema', () => {
    it('repinta al cambiar el SO solo si la preferencia es "system"', () => {
      let pref: 'system' | 'light' = 'system';
      const sis = simularSistema(false);
      const parar = escucharSistema(() => pref);

      simularSistema(true);
      sis.disparar();
      expect(temaEstampado()).toBe('dark');

      doc.documentElement.dataset.theme = 'light';
      pref = 'light';
      sis.disparar();
      expect(temaEstampado()).toBe('light');

      parar();
    });

    it('se desuscribe al llamar a la función devuelta', () => {
      const sis = simularSistema(false);
      const parar = escucharSistema(() => 'system' as const);
      expect(sis.numOyentes()).toBe(1);
      parar();
      expect(sis.numOyentes()).toBe(0);
    });

    it('no revienta sin matchMedia', () => {
      vi.stubGlobal('window', {});
      expect(() => escucharSistema(() => 'system' as const)()).not.toThrow();
    });
  });

  describe('inicializarTema', () => {
    it('arranca en classic sin preferencia guardada, aunque el SO sea oscuro', () => {
      simularSistema(true);
      expect(inicializarTema()).toBe('classic');
      expect(temaEstampado()).toBe('classic');
    });

    it('respeta la preferencia guardada', () => {
      almacen[CLAVE_TEMA] = 'dark';
      expect(inicializarTema()).toBe('dark');
    });
  });
});
