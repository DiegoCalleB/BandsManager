import { describe, it, expect } from 'vitest';
import http from 'http';
import { crearAgenteIpPinneada } from '../ssrfGuard';

/**
 * Regresión: con el lookup anclado devolviendo una sola cadena, Node ≥ 20 (autoSelectFamily llama
 * al lookup con { all: true } y espera un array) fallaba con «Invalid IP address: undefined» en
 * CUALQUIER petición anclada. Los tests existentes mockeaban la red y no lo vieron; este abre un
 * socket real.
 */
describe('crearAgenteIpPinneada: conexión real anclada', () => {
  it('conecta a la IP anclada aunque el hostname no resuelva', async () => {
    const srv = http.createServer((_q, r) => r.end('ok'));
    await new Promise<void>((res) => srv.listen(0, '127.0.0.1', res));
    const port = (srv.address() as any).port;
    try {
      const cuerpo = await new Promise<string>((resolve, reject) => {
        const req = http.request(
          { hostname: 'host-que-no-existe.invalid', port, path: '/', agent: crearAgenteIpPinneada('127.0.0.1', false) },
          (res) => {
            let d = '';
            res.on('data', (c) => (d += c));
            res.on('end', () => resolve(d));
          }
        );
        req.on('error', reject);
        req.end();
      });
      expect(cuerpo).toBe('ok');
    } finally {
      srv.close();
    }
  });

  it('el lookup atiende tanto { all: true } (array) como la forma clásica', () => {
    const agente: any = crearAgenteIpPinneada('203.0.113.9', true);
    const lookup = agente.options.lookup;

    let conAll: any;
    lookup('x', { all: true }, (_e: any, r: any) => (conAll = r));
    expect(conAll).toEqual([{ address: '203.0.113.9', family: 4 }]);

    let sinAll: any[] = [];
    lookup('x', {}, (_e: any, ...r: any[]) => (sinAll = r));
    expect(sinAll).toEqual(['203.0.113.9', 4]);
  });

  it('IPv6 anclada informa family 6', () => {
    const agente: any = crearAgenteIpPinneada('2606:4700::1111', true);
    let r: any;
    agente.options.lookup('x', { all: true }, (_e: any, x: any) => (r = x));
    expect(r).toEqual([{ address: '2606:4700::1111', family: 6 }]);
  });
});
