import { describe, expect, it } from 'vitest';
import { camposCambiados } from '../camposCambiados';

describe('camposCambiados', () => {
  it('solo devuelve lo que cambió: el estado o el hilo que cambiaron en paralelo no se pisan', () => {
    const alEditar = { id: 'l1', estado: 'pendiente_aprobacion', telefono: '600', hilo: [1] };
    const editado = { ...alEditar, telefono: '611' };
    expect(camposCambiados(alEditar, editado)).toEqual({ telefono: '611' });
  });

  it('un campo vaciado se manda como cadena vacía (para que el servidor lo borre)', () => {
    expect(camposCambiados({ email_secundario: 'a@b.com' } as any, { email_secundario: '' } as any)).toEqual({ email_secundario: '' });
    expect(camposCambiados({ web: 'x' } as any, { web: undefined } as any)).toEqual({ web: '' });
  });

  it('compara en profundidad (arrays y objetos) sin falsos cambios', () => {
    const a = { tags: ['a', 'b'], dir: { calle: 'x' } };
    expect(camposCambiados(a, { tags: ['a', 'b'], dir: { calle: 'x' } })).toEqual({});
  });

  it('sin cambios devuelve un objeto vacío', () => {
    expect(camposCambiados({ a: 1 }, { a: 1 })).toEqual({});
  });
});
