import { describe, it, expect } from 'vitest';
import { CONFIG_INICIAL, MAX_LOGOS, ajustesDe, configDesdeEstado, sanearConfigCartel } from '../config';

const ok = (u: string) => u.startsWith('https://cdn.test/carteles/b1/');
const logo = (n: number) => `https://cdn.test/carteles/b1/c1-logo-${n}.png?v=1`;

describe('logos de otras bandas en la configuración', () => {
  it('por defecto no hay logos y van en una tinta', () => {
    expect(CONFIG_INICIAL.logos).toEqual([]);
    expect(CONFIG_INICIAL.logosTinta).toBe(true);
    expect(sanearConfigCartel({}, ok)!.logosTinta).toBe(true);
  });

  it('solo valen URLs de la carpeta de la banda, sin repetir y como mucho MAX_LOGOS', () => {
    const r = sanearConfigCartel({ logos: [logo(1), logo(1), 'https://evil.com/x.png', 5, logo(2), logo(3), logo(4), logo(5), logo(6)] }, ok)!;
    expect(r.logos).toEqual([logo(1), logo(2), logo(3), logo(4)]);
    expect(r.logos).toHaveLength(MAX_LOGOS);
  });

  it('un valor que no es una lista, o un booleano mal formado, vuelve al valor por defecto', () => {
    const r = sanearConfigCartel({ logos: 'x', logosTinta: 'si' }, ok)!;
    expect(r.logos).toEqual([]);
    expect(r.logosTinta).toBe(true);
    expect(sanearConfigCartel({ logosTinta: false }, ok)!.logosTinta).toBe(false);
  });

  it('logosTinta es un ajuste del bolo y los logos subidos se guardan aparte', () => {
    const c = { ...CONFIG_INICIAL, logosTinta: false, logos: [logo(1)] };
    expect(ajustesDe(c).logosTinta).toBe(false);
    expect('logos' in ajustesDe(c)).toBe(false);
  });

  it('configDesdeEstado guarda los logos (limitados) y los ajustes', () => {
    const r = configDesdeEstado({
      formato: 'feed', fondo: CONFIG_INICIAL.fondo, ajustes: ajustesDe(CONFIG_INICIAL), fondosIa: [], fotoRemota: null, anterior: CONFIG_INICIAL,
      logos: [logo(1), logo(2), logo(3), logo(4), logo(5)],
    });
    expect(r.logos).toHaveLength(MAX_LOGOS);
    expect(r.logosTinta).toBe(true);
  });
});

describe('la letra del cartel en la configuración', () => {
  it('por defecto es automática, y solo valen las voces conocidas', () => {
    expect(CONFIG_INICIAL.letra).toBe('auto');
    expect(sanearConfigCartel({}, ok)!.letra).toBe('auto');
    for (const l of ['auto', 'moderna', 'cartel', 'clasica']) expect(sanearConfigCartel({ letra: l }, ok)!.letra).toBe(l);
    for (const l of ['comic-sans', 5, null, ['cartel']]) expect(sanearConfigCartel({ letra: l }, ok)!.letra).toBe('auto');
  });

  it('es un ajuste del bolo y se guarda con él', () => {
    expect(ajustesDe({ ...CONFIG_INICIAL, letra: 'cartel' }).letra).toBe('cartel');
  });
});

describe('la composición del cartel en la configuración', () => {
  it('por defecto es automática y solo valen las conocidas', () => {
    expect(CONFIG_INICIAL.composicion).toBe('auto');
    expect(sanearConfigCartel({}, ok)!.composicion).toBe('auto');
    for (const k of ['auto', 'ventana', 'centrada', 'base']) expect(sanearConfigCartel({ composicion: k }, ok)!.composicion).toBe(k);
    for (const k of ['diagonal', 5, null, ['base']]) expect(sanearConfigCartel({ composicion: k }, ok)!.composicion).toBe('auto');
  });

  it('es un ajuste del bolo y se guarda con él', () => {
    expect(ajustesDe({ ...CONFIG_INICIAL, composicion: 'centrada' }).composicion).toBe('centrada');
  });
});
