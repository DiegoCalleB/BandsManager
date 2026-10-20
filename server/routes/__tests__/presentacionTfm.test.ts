/**
 * Atajos /presentacion_tfm y /netflix hacia la película del TFM. Invariantes:
 *  · ambas rutas redirigen (302) al mismo destino;
 *  · PRESENTACION_TFM_URL lo cambia, pero solo si es una URL https válida (si no, el destino por defecto).
 */
import { afterEach, describe, expect, it } from 'vitest';
import router, { destinoPresentacionTfm } from '../presentacionTfm';

const POR_DEFECTO = 'https://presentacion-storytelling.up.railway.app/';

function pedir(ruta: string) {
  const capa = (router as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods.get);
  expect(capa, ruta).toBeDefined();
  const pila = capa.route.stack;
  const res: any = { redirect: (c: number, u: string) => ((res.code = c), (res.destino = u), res) };
  pila[pila.length - 1].handle({}, res);
  return res;
}

afterEach(() => { delete process.env.PRESENTACION_TFM_URL; });

describe('atajos a la película del TFM', () => {
  it.each(['/presentacion_tfm', '/netflix'])('%s redirige con 302 al destino por defecto', (ruta) => {
    const res = pedir(ruta);
    expect(res.code).toBe(302);
    expect(res.destino).toBe(POR_DEFECTO);
  });

  it('PRESENTACION_TFM_URL cambia el destino de las dos rutas', () => {
    process.env.PRESENTACION_TFM_URL = 'https://netflix.bandmanager.io';
    expect(pedir('/presentacion_tfm').destino).toBe('https://netflix.bandmanager.io/');
    expect(pedir('/netflix').destino).toBe('https://netflix.bandmanager.io/');
  });

  it.each(['http://evil.example', 'javascript:alert(1)', 'no es una url', '   '])(
    'rechaza %j y vuelve al destino por defecto',
    (valor) => {
      process.env.PRESENTACION_TFM_URL = valor;
      expect(destinoPresentacionTfm()).toBe(POR_DEFECTO);
    },
  );
});
