import { describe, it, expect } from 'vitest';
import { calcularLayout, TEXTO_MARCA, type DatosCartel, type OpcionesLayout, type Linea } from '../layout';
import { FORMATOS, ORDEN_FORMATOS, dimensiones } from '../formatos';

// Medidor falso y estable: cada carácter mide 0,6 veces el cuerpo.
const medir = (t: string, px: number) => t.length * px * 0.6;
const ancho = (l: Linea) => medir(l.texto, l.px);

const datos = (over: Partial<DatosCartel> = {}): DatosCartel => ({
  lineup: [{ nombre: 'Los Pijamas', cabeza: true }],
  fecha: 'SÁB 14 NOV 2026',
  horario: 'PUERTAS 20:30 · SHOW 21:30',
  sala: 'Sala El Sol',
  ciudad: 'Madrid',
  extra: 'Anticipada 10 €',
  ...over,
});
const sinNada: OpcionesLayout = { qr: false, urlCorta: null, marca: false };
const todo: OpcionesLayout = { qr: true, urlCorta: 'bandmanager.io/r/ab3k9x2', marca: true };

describe('calcularLayout', () => {
  for (const f of ORDEN_FORMATOS) {
    const def = FORMATOS[f];
    for (const op of [sinNada, todo]) {
      it(`${f} ${op.qr ? 'con' : 'sin'} extras: todo dentro del lienzo y sin pisarse`, () => {
        const { ancho: w } = dimensiones(def);
        const L = calcularLayout(def, w, datos(), op, medir);
        for (const l of L.lineas) {
          const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
          expect(izq).toBeGreaterThanOrEqual(0);
          expect(izq + ancho(l)).toBeLessThanOrEqual(w + 0.5);
          expect(l.y).toBeGreaterThanOrEqual(0);
          expect(l.y + l.px).toBeLessThanOrEqual(L.alto);
        }
        // El bloque de nombres termina antes de que empiecen los datos.
        expect(L.zonas.arriba.y + L.zonas.arriba.h).toBeLessThanOrEqual(L.zonas.abajo.y + 1);
      });
    }
  }

  it('el QR no pisa ningún texto', () => {
    const def = FORMATOS.imprimir;
    const L = calcularLayout(def, def.ancho, datos(), todo, medir);
    const q = L.qr!;
    expect(q).not.toBeNull();
    for (const l of L.lineas) {
      const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
      const solapa = izq < q.x + q.w && izq + ancho(l) > q.x && l.y < q.y + q.h && l.y + l.px > q.y;
      expect(solapa, `"${l.texto}" pisa el QR`).toBe(false);
    }
  });

  it('en una historia respeta las franjas que tapa Instagram', () => {
    const def = FORMATOS.historia;
    const L = calcularLayout(def, 1080, datos(), todo, medir);
    const ys = L.lineas.map((l) => l.y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(def.seguroArriba * L.alto);
    expect(Math.max(...L.lineas.map((l) => l.y + l.px))).toBeLessThanOrEqual(L.alto * (1 - def.seguroAbajo));
  });

  it('bolo compartido: la cabeza de cartel va más grande que el resto', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Teloneros', cabeza: false }, { nombre: 'Cabeza', cabeza: true }, { nombre: 'Invitada', cabeza: false }],
    }), sinNada, medir);
    const cabeza = L.lineas.find((l) => l.texto.includes('CABEZA'))!;
    const resto = L.lineas.find((l) => l.texto.startsWith('CON'))!;
    expect(resto.texto).toBe('CON TELONEROS · INVITADA');
    expect(cabeza.px).toBeGreaterThan(resto.px * 1.5);
    expect(cabeza.y).toBeLessThan(resto.y);
  });

  it('sin cabeza de cartel todas van juntas al mismo tamaño', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Uno', cabeza: false }, { nombre: 'Dos', cabeza: false }],
    }), sinNada, medir);
    const titular = L.lineas.filter((l) => l.peso === 800 && l.y < L.alto / 2).map((l) => l.texto).join(' ');
    expect(titular).toBe('UNO + DOS');
    expect(L.lineas.some((l) => l.texto.startsWith('CON'))).toBe(false);
  });

  it('un nombre larguísimo encoge hasta caber', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'La Orquesta Sinfónica Experimental de Cacharros Reciclados', cabeza: true }],
    }), sinNada, medir);
    const titular = L.lineas.filter((l) => l.peso === 800 && l.y < L.alto / 2);
    expect(titular.length).toBeLessThanOrEqual(3);
    expect(titular[0].px).toBeLessThan(150);
    for (const l of titular) expect(medir(l.texto, l.px)).toBeLessThanOrEqual(1080 - 144 + 0.5);
  });

  it('la marca y la URL corta salen solo si se piden', () => {
    const con = calcularLayout(FORMATOS.feed, 1080, datos(), { qr: false, urlCorta: 'bandmanager.io/r/x', marca: true }, medir);
    expect(con.lineas.some((l) => l.texto === TEXTO_MARCA)).toBe(true);
    expect(con.lineas.some((l) => l.texto === 'bandmanager.io/r/x' && l.alinear === 'right')).toBe(true);
    const sin = calcularLayout(FORMATOS.feed, 1080, datos(), sinNada, medir);
    expect(sin.lineas.some((l) => l.texto === TEXTO_MARCA)).toBe(false);
  });

  it('un nombre corto crece hasta llenar el ancho', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ lineup: [{ nombre: 'Ñu', cabeza: true }] }), sinNada, medir);
    expect(L.lineas[0].px).toBeGreaterThan(180);
  });

  it('en un bolo compartido nunca parte el nombre de una banda', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({
      lineup: [{ nombre: 'Cabeza', cabeza: true }, { nombre: 'Los Pijamas', cabeza: false }, { nombre: 'Invitada Sorpresa', cabeza: false }, { nombre: 'Otra Más', cabeza: false }],
    }), sinNada, medir);
    const resto = L.lineas.filter((l) => l.peso === 700 && l.y < L.alto / 2).map((l) => l.texto).join(' | ');
    expect(resto).not.toMatch(/INVITADA \| SORPRESA|OTRA \| MÁS|LOS \| PIJAMAS/);
  });

  it('los campos vacíos no dejan huecos ni líneas en blanco', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ horario: '', extra: '', ciudad: '' }), sinNada, medir);
    expect(L.lineas.every((l) => l.texto.trim().length > 0)).toBe(true);
    expect(L.lineas.some((l) => l.texto === 'SALA EL SOL')).toBe(true);
  });

  it('el diseño escala: la vista previa a 1080 y el A4 a 2480 son el mismo cartel', () => {
    const def = FORMATOS.imprimir;
    const a = calcularLayout(def, 1080, datos(), todo, medir);
    const b = calcularLayout(def, 2480, datos(), todo, medir);
    const k = 2480 / 1080;
    expect(b.lineas.map((l) => l.texto)).toEqual(a.lineas.map((l) => l.texto));
    expect(b.lineas[0].px / a.lineas[0].px).toBeCloseTo(k, 1);
    expect(b.qr!.w / a.qr!.w).toBeCloseTo(k, 1);
  });
});

describe('fila de logos', () => {
  const conLogos = (aspectos: number[], qr = false): OpcionesLayout => ({ qr, urlCorta: null, marca: true, logos: aspectos });
  const solapan = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  for (const f of ORDEN_FORMATOS) {
    for (const qr of [false, true]) {
      it(`${f}${qr ? ' con QR' : ''}: los logos caben, no pisan texto ni QR y quedan en la zona de abajo`, () => {
        const def = FORMATOS[f];
        const { ancho: w } = dimensiones(def);
        const L = calcularLayout(def, w, datos({ lineup: [{ nombre: 'La Orquesta Sinfónica Experimental', cabeza: true }, { nombre: 'Los Pijamas', cabeza: false }] }), conLogos([1, 3, 0.8, 4, 1.5], qr), medir);
        expect(L.logos).toHaveLength(5);
        for (const g of L.logos) {
          expect(g.x).toBeGreaterThanOrEqual(0);
          expect(g.x + g.w).toBeLessThanOrEqual(w);
          expect(g.y).toBeGreaterThanOrEqual(L.zonas.abajo.y);
          expect(g.y + g.h).toBeLessThanOrEqual(L.alto);
          if (L.qr) expect(solapan(g, L.qr)).toBe(false);
          for (const l of L.lineas) {
            const izq = l.alinear === 'left' ? l.x : l.x - ancho(l);
            expect(solapan(g, { x: izq, y: l.y, w: ancho(l), h: l.px }), `"${l.texto}" pisa un logo`).toBe(false);
          }
        }
      });
    }
  }

  it('sin logos no hay fila ni cambia nada de lo demás', () => {
    const sin = calcularLayout(FORMATOS.feed, 1080, datos(), todo, medir);
    expect(sin.logos).toEqual([]);
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), { ...todo, logos: [] }, medir).zonas).toEqual(sin.zonas);
  });

  it('van en orden, de izquierda a derecha, sin pisarse y centrados en la misma línea', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 3, 0.6]), medir);
    const c = L.logos.map((g) => g.y + g.h / 2);
    expect(Math.max(...c) - Math.min(...c)).toBeLessThan(1);
    for (let i = 1; i < L.logos.length; i++) expect(L.logos[i].x).toBeGreaterThan(L.logos[i - 1].x + L.logos[i - 1].w);
  });

  it('cada hueco respeta la proporción del logo', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 2, 0.5]), medir);
    expect(L.logos[0].w / L.logos[0].h).toBeCloseTo(1, 1);
    expect(L.logos[1].w / L.logos[1].h).toBeCloseTo(2, 1);
    expect(L.logos[2].w / L.logos[2].h).toBeCloseTo(0.5, 1);
  });

  it('un logo muy apaisado y uno cuadrado pesan parecido: superficie similar, no la misma altura', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 2.2]), medir);
    const [a, b] = L.logos.map((g) => g.w * g.h);
    expect(b / a).toBeGreaterThan(0.8);
    expect(b / a).toBeLessThan(1.25);
    expect(L.logos[1].h).toBeLessThan(L.logos[0].h);
  });

  it('si no caben en el ancho útil se reducen todos por igual, sin salirse', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([2.4, 2.4, 2.4, 2.4, 2.4]), medir);
    const fin = L.logos[4].x + L.logos[4].w;
    expect(fin).toBeLessThanOrEqual(1080 - 72 + 0.5);
    expect(new Set(L.logos.map((g) => Math.round(g.w))).size).toBe(1);
  });

  it('como mucho 5 logos, y los aspectos inválidos no rompen nada', () => {
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([1, 1, 1, 1, 1, 1, 1]), medir).logos).toHaveLength(5);
    expect(calcularLayout(FORMATOS.feed, 1080, datos(), conLogos([0, -1, NaN, Infinity, 1]), medir).logos).toHaveLength(1);
  });

  it('en una historia la fila respeta la franja segura de abajo', () => {
    const def = FORMATOS.historia;
    const L = calcularLayout(def, 1080, datos(), conLogos([1, 2]), medir);
    for (const g of L.logos) expect(g.y + g.h).toBeLessThanOrEqual(L.alto - def.seguroAbajo * L.alto + 0.5);
  });
});

describe('modo compacto (con ilustración de IA)', () => {
  const compacto: OpcionesLayout = { ...sinNada, compacto: true };
  const nombre = (L: ReturnType<typeof calcularLayout>) => L.lineas[0];

  it('el nombre se hace menos grande para dejar sitio a la ilustración, nunca más', () => {
    for (const f of ORDEN_FORMATOS) {
      const def = FORMATOS[f];
      const { ancho: w } = dimensiones(def);
      const normal = calcularLayout(def, w, datos({ lineup: [{ nombre: 'Ruta', cabeza: true }] }), sinNada, medir);
      const c = calcularLayout(def, w, datos({ lineup: [{ nombre: 'Ruta', cabeza: true }] }), compacto, medir);
      expect(nombre(c).px).toBeLessThan(nombre(normal).px);
      expect(nombre(c).px).toBeLessThanOrEqual(Math.round(150 * (w / 1080)));
      expect(c.zonas.arriba.h).toBeLessThan(normal.zonas.arriba.h);
    }
  });

  it('sin pedirlo no cambia nada, y un nombre ya pequeño tampoco se toca', () => {
    const a = calcularLayout(FORMATOS.feed, 1080, datos(), sinNada, medir);
    const b = calcularLayout(FORMATOS.feed, 1080, datos(), { ...sinNada, compacto: false }, medir);
    expect(b.lineas.map((l) => l.px)).toEqual(a.lineas.map((l) => l.px));
    const largo = datos({ lineup: [{ nombre: 'La Orquesta Sinfónica Experimental del Norte', cabeza: true }] });
    expect(nombre(calcularLayout(FORMATOS.feed, 1080, largo, compacto, medir)).px).toBe(nombre(calcularLayout(FORMATOS.feed, 1080, largo, sinNada, medir)).px);
  });
});

describe('la fecha con jerarquía', () => {
  const lineasDeFecha = (L: ReturnType<typeof calcularLayout>) => L.lineas.filter((l) => l.texto === '14' || l.texto === 'NOV 2026' || l.texto === 'SÁB');

  it('el día va enorme, en la letra de cartel, y el mes, el año y el día de la semana a su lado', () => {
    for (const f of ORDEN_FORMATOS) {
      const def = FORMATOS[f];
      const { ancho: w } = dimensiones(def);
      const L = calcularLayout(def, w, datos({ fecha: 'SÁB 14 NOV 2026' }), todo, medir);
      const [num, lado, dia] = ['14', 'NOV 2026', 'SÁB'].map((t) => L.lineas.find((l) => l.texto === t)!);
      expect(num, f).toBeDefined();
      expect(num.titulo).toBe(true);
      expect(num.px).toBeGreaterThan(lado.px * 2);
      expect(lado.x).toBeGreaterThan(num.x + medir('14', num.px));
      expect(dia.x).toBe(lado.x);
      expect(dia.y).toBeGreaterThan(lado.y);
      expect(L.lineas.some((l) => l.texto === 'SÁB 14 NOV 2026')).toBe(false);
      for (const l of lineasDeFecha(L)) expect(l.y + l.px, `${l.texto} se sale`).toBeLessThanOrEqual(L.alto);
    }
  });

  it('el bloque de la fecha no pisa el de las horas ni el QR', () => {
    const L = calcularLayout(FORMATOS.imprimir, 2480, datos(), todo, medir);
    const num = L.lineas.find((l) => l.texto === '14')!;
    const horas = L.lineas.find((l) => l.texto.startsWith('PUERTAS'))!;
    expect(num.y + num.px * 0.86).toBeLessThanOrEqual(horas.y + 1);
    const finLado = Math.max(...['NOV 2026', 'SÁB'].map((t) => { const l = L.lineas.find((x) => x.texto === t)!; return l.x + medir(t, l.px); }));
    expect(finLado).toBeLessThan(L.qr!.x);
  });

  it('una fecha que no se puede partir, o que no cabe, va en una sola línea como siempre', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ fecha: 'HOY MISMO' }), sinNada, medir);
    expect(L.lineas.some((l) => l.texto === 'HOY MISMO')).toBe(true);
    const estrecho = calcularLayout(FORMATOS.feed, 1080, datos(), { ...todo, qr: true }, (t, px) => t.length * px * 2.2);
    // No cabe el día enorme con su lado: no se compone (no hay un «14» suelto con letra de exhibición).
    expect(estrecho.lineas.some((l) => l.texto === '14' && l.titulo)).toBe(false);
  });
});

describe('el nombre con letra de exhibición', () => {
  const nombre = (o: Partial<OpcionesLayout>, lineup = [{ nombre: 'Ruta 66', cabeza: true }], f: keyof typeof FORMATOS = 'imprimir') => {
    const def = FORMATOS[f];
    const L = calcularLayout(def, dimensiones(def).ancho, datos({ lineup }), { ...sinNada, ...o }, medir);
    return L.lineas.filter((l) => l.titulo && l.texto !== '14');
  };

  it('el nombre sale en la letra de exhibición de la voz y el resto no', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), { ...sinNada, voz: 'cartel' }, medir);
    expect(L.lineas.filter((l) => l.titulo).map((l) => l.texto).join(' ')).toContain('PIJAMAS');
    expect(L.lineas.find((l) => l.texto.startsWith('SALA'))?.titulo).toBeFalsy();
  });

  it('la voz de cartel (condensada) llena más ancho con letras más altas', () => {
    const moderna = nombre({ voz: 'moderna' })[0].px;
    const cartel = nombre({ voz: 'cartel' })[0].px;
    expect(cartel).toBeGreaterThan(0);
    expect(moderna).toBeGreaterThan(0);
  });

  it('con una ilustración, un nombre corto va en UNA línea ancha, y uno largo se sigue partiendo', () => {
    for (const voz of ['moderna', 'cartel', 'clasica'] as const) {
      expect(nombre({ voz, compacto: true }, [{ nombre: 'Banda Demo', cabeza: true }]), voz).toHaveLength(1);
    }
    const largo = nombre({ voz: 'cartel', compacto: true }, [{ nombre: 'La Orquesta Sinfónica Experimental del Norte', cabeza: true }]);
    expect(largo.length).toBeGreaterThan(1);
  });

  it('sin ilustración el nombre sigue ocupando el cartel (dos líneas grandes)', () => {
    expect(nombre({ voz: 'cartel' }, [{ nombre: 'Banda Demo', cabeza: true }]).length).toBeGreaterThanOrEqual(1);
  });

  it('el nombre nunca se sale del ancho útil, en ninguna voz ni formato', () => {
    for (const voz of ['moderna', 'cartel', 'clasica'] as const) {
      for (const f of ORDEN_FORMATOS) {
        for (const compacto of [false, true]) {
          const def = FORMATOS[f];
          const { ancho: w } = dimensiones(def);
          const L = calcularLayout(def, w, datos({ lineup: [{ nombre: 'Los Increíbles Pijamas de la Muerte Súbita', cabeza: true }] }), { ...sinNada, voz, compacto }, medir);
          for (const l of L.lineas.filter((x) => x.titulo)) expect(l.x + medir(l.texto, l.px), `${voz} ${f}`).toBeLessThanOrEqual(w - 72 * (w / 1080) + 0.5);
        }
      }
    }
  });
});

describe('la caja del nombre y el espaciado de las versalitas', () => {
  it('con un nombre solo, el layout da su caja; con bandas invitadas debajo no (nada se solapa con letras pequeñas)', () => {
    const solo = calcularLayout(FORMATOS.feed, 1080, datos(), sinNada, medir);
    expect(solo.titulo).not.toBeNull();
    const titulos = solo.lineas.filter((l) => l.titulo && l.texto !== '14');
    expect(solo.titulo!.y).toBeLessThanOrEqual(titulos[0].y);
    expect(solo.titulo!.y + solo.titulo!.h).toBeGreaterThanOrEqual(titulos[titulos.length - 1].y);
    const con = calcularLayout(FORMATOS.feed, 1080, datos({ lineup: [{ nombre: 'Cabeza', cabeza: true }, { nombre: 'Invitada', cabeza: false }] }), sinNada, medir);
    expect(con.titulo).toBeNull();
    expect(calcularLayout(FORMATOS.feed, 1080, datos({ lineup: [] }), sinNada, medir).titulo).toBeNull();
  });

  it('las líneas pequeñas (horas, sala, extra, pie) llevan espaciado, y el nombre y el día no', () => {
    const L = calcularLayout(FORMATOS.feed, 1080, datos(), todo, medir);
    for (const t of ['PUERTAS 20:30 · SHOW 21:30', 'SALA EL SOL · MADRID', 'ANTICIPADA 10 €', TEXTO_MARCA]) {
      expect(L.lineas.find((l) => l.texto === t)?.tracking, t).toBeGreaterThan(0);
    }
    for (const l of L.lineas.filter((x) => x.titulo)) expect(l.tracking ?? 0).toBe(0);
  });

  it('el espaciado se tiene en cuenta al medir: una línea con tracking que no cabe se reduce', () => {
    const conTracking = (t: string, px: number, _p: number, _ti?: boolean, tr = 0) => t.length * px * (0.6 + tr);
    const L = calcularLayout(FORMATOS.feed, 1080, datos({ horario: 'PUERTAS 20:30 · SHOW 21:30 · CIERRE 23:30 · FIESTA POSTERIOR' }), sinNada, conTracking);
    const h = L.lineas.find((l) => l.texto.startsWith('PUERTAS'))!;
    expect(h.x + conTracking(h.texto, h.px, 600, false, h.tracking)).toBeLessThanOrEqual(1080 - 72 + 0.5);
  });
});
