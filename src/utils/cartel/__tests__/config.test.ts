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

  it('la dirección viene apagada y solo se enciende con un booleano de verdad', () => {
    expect(CONFIG_INICIAL.direccion).toBe(false);
    expect(sanearConfigCartel({ v: 1, direccion: true }, () => true)?.direccion).toBe(true);
    expect(sanearConfigCartel({ v: 1, direccion: 'sí' }, () => true)?.direccion).toBe(false);
  });

  it('el QR en Feed e Historia viene encendido y solo se apaga con un false de verdad; el destino es uno conocido', () => {
    expect(CONFIG_INICIAL.qrDigital).toBe(true);
    expect(sanearConfigCartel({ v: 1, qrDigital: false }, () => true)?.qrDigital).toBe(false);
    expect(sanearConfigCartel({ v: 1, qrDigital: 1 }, () => true)?.qrDigital).toBe(true);
    expect(CONFIG_INICIAL.qrDestino).toBe('concierto');
    expect(sanearConfigCartel({ v: 1, qrDestino: 'fans' }, () => true)?.qrDestino).toBe('fans');
    expect(sanearConfigCartel({ v: 1, qrDestino: 'http://evil' }, () => true)?.qrDestino).toBe('concierto');
  });

  it('una plantilla de autor es un fondo válido y un id desconocido cae al fondo inicial', () => {
    expect(sanearConfigCartel({ v: 1, fondo: { tipo: 'plantilla', id: 'vinilo' } }, () => true)?.fondo).toEqual({ tipo: 'plantilla', id: 'vinilo' });
    expect(sanearConfigCartel({ v: 1, fondo: { tipo: 'plantilla', id: '../../x' } }, () => true)?.fondo).toEqual(CONFIG_INICIAL.fondo);
  });

  it('los ajustes finos se sanean al guardar: formatos y bloques conocidos, números dentro de rango', () => {
    const r = sanearConfigCartel({ v: 1, ajustesFinos: { feed: { nombre: { dx: 0.2, dy: 0.1, escala: 1.5 }, tonto: { dx: 1 } }, hackeo: {} } }, () => true)!;
    expect(r.ajustesFinos).toEqual({ feed: { nombre: { dx: 0.2, dy: 0.1, escala: 1.5 } } });
    expect(sanearConfigCartel({ v: 1, ajustesFinos: 5 }, () => true)!.ajustesFinos).toEqual({});
    expect(CONFIG_INICIAL.ajustesFinos).toEqual({});
  });

  it('los textos escritos a mano se sanean: solo cadenas de una línea y con tope', () => {
    const r = sanearConfigCartel({ v: 1, textos: { nombre: 'Los Toros\n<b>x</b>'.padEnd(200, 'a'), lugar: 5 } }, () => true)!;
    expect(r.textos.nombre).not.toContain('\n');
    expect(r.textos.nombre.length).toBeLessThanOrEqual(60);
    expect(r.textos.lugar).toBe('');
    expect(sanearConfigCartel({ v: 1, textos: 'x' }, () => true)!.textos).toEqual({ nombre: '', lugar: '' });
    expect(CONFIG_INICIAL.textos).toEqual({ nombre: '', lugar: '' });
  });
});
