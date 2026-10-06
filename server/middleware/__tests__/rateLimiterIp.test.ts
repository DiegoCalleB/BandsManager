import { beforeEach, describe, expect, it } from 'vitest';
import { _vaciarRateLimitStore, createRateLimiter, ipDelCliente } from '../rateLimiter';

const peticion = (xff?: string, ip = '10.0.0.1'): any => ({ headers: xff === undefined ? {} : { 'x-forwarded-for': xff }, ip });

function resFalso() {
  const r: any = { cabeceras: {} };
  r.setHeader = (k: string, v: string) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
}

beforeEach(() => _vaciarRateLimitStore());

describe('ipDelCliente', () => {
  it('usa la ÚLTIMA entrada de X-Forwarded-For (la que añade el proxy), no la que escribe el cliente', () => {
    expect(ipDelCliente(peticion('1.2.3.4, 9.9.9.9'))).toBe('9.9.9.9');
    expect(ipDelCliente(peticion('9.9.9.9'))).toBe('9.9.9.9');
  });

  it('sin cabecera cae a req.ip', () => {
    expect(ipDelCliente(peticion(undefined, '10.1.1.1'))).toBe('10.1.1.1');
  });
});

describe('el limitador no se evade rotando X-Forwarded-For', () => {
  it('mismo cliente real con una IP «de cliente» distinta en cada petición sigue limitado', () => {
    const limitador = createRateLimiter({ nombre: 'test-xff', maxRequests: 3 });
    let bloqueado = 0;
    for (let i = 0; i < 6; i++) {
      const res = resFalso();
      let paso = false;
      // El atacante inventa la primera entrada; el proxy añade siempre la real (9.9.9.9).
      limitador(peticion(`1.2.3.${i}, 9.9.9.9`), res, () => (paso = true));
      if (!paso) bloqueado++;
    }
    expect(bloqueado).toBe(3);
  });

  it('dos clientes reales distintos no se afectan entre sí', () => {
    const limitador = createRateLimiter({ nombre: 'test-xff2', maxRequests: 1 });
    let pasos = 0;
    limitador(peticion('8.8.8.8'), resFalso(), () => pasos++);
    limitador(peticion('7.7.7.7'), resFalso(), () => pasos++);
    expect(pasos).toBe(2);
  });
});
