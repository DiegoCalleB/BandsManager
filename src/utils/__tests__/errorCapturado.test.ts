import { describe, expect, it } from 'vitest';
import { comoErrorCapturado } from '../errorCapturado';

describe('comoErrorCapturado', () => {
  it('devuelve el mismo objeto, sin copiarlo ni transformarlo', () => {
    const e = Object.assign(new Error('falló'), { status: 503 });
    const vista = comoErrorCapturado(e);
    expect(vista).toBe(e);
    expect(vista.message).toBe('falló');
    expect(vista.status).toBe(503);
  });

  it('null o undefined lanzados no revientan al leer campos', () => {
    expect(comoErrorCapturado(null).message).toBeUndefined();
    expect(comoErrorCapturado(undefined).status).toBeUndefined();
  });

  it('un texto lanzado se conserva tal cual', () => {
    expect(String(comoErrorCapturado('sin conexión'))).toBe('sin conexión');
  });
});
