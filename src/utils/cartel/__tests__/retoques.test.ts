import { describe, it, expect } from 'vitest';
import { CONFIG_INICIAL, MAX_PASOS_RETOQUE, conFondoIa, conLinaje, sanearConfigCartel } from '../config';

const U = (n: string) => `https://x.supabase.co/storage/v1/object/public/band-media/carteles/band-a/${n}.png`;
const valida = (u: string) => u.includes('/carteles/band-a/');

describe('linaje de los retoques en la config', () => {
  it('se sanea: solo fondos del historial, con su original también en el historial, y recortado', () => {
    const c = sanearConfigCartel(
      {
        v: 1,
        fondosIa: [U('b'), U('a')],
        retoques: {
          [U('b')]: { origen: U('a'), instrucciones: ['Más oscuro', '', 5, 'x'.repeat(400), 'a', 'b', 'c', 'd', 'e'] },
          [U('z')]: { origen: U('a'), instrucciones: ['de un fondo que no está'] },
          [U('a')]: { origen: U('fuera'), instrucciones: ['original fuera del historial'] },
          'https://evil.com/x.png': { origen: U('a'), instrucciones: ['x'] },
        },
      },
      valida
    );
    expect(Object.keys(c!.retoques)).toEqual([U('b')]);
    expect(c!.retoques[U('b')].instrucciones).toHaveLength(MAX_PASOS_RETOQUE);
    expect(c!.retoques[U('b')].instrucciones[1]).toHaveLength(300);
  });

  it('un fondo que sale del historial se lleva su linaje (y el que lo tenía de original)', () => {
    let c = { ...CONFIG_INICIAL, fondosIa: [U('a')] };
    c = conLinaje(c, U('b'), { origen: U('a'), instrucciones: ['x'] });
    expect(Object.keys(c.retoques)).toEqual([U('b')]);
    for (let i = 0; i < 8; i++) c = conFondoIa(c, U(`n${i}`));
    expect(c.fondosIa).not.toContain(U('a'));
    expect(c.retoques).toEqual({});
  });
});
