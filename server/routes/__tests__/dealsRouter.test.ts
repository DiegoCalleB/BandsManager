import { describe, it, expect, beforeAll } from 'vitest';
import { dealsRouter } from '../deals.js';
import { dbUpsertDeal } from '../../db/deals.js';

describe('dealsRouter request handler logic', () => {
  const testBandId = 'band_route_test_1';
  let testToken = '';

  beforeAll(async () => {
    const deal = await dbUpsertDeal(
      {
        band_id: testBandId,
        lugar_sala: 'Sala El Sol',
        ciudad: 'Madrid',
        fecha_evento: '2026-11-15',
        cache_base: 600,
        total_acordado: 600,
        forma_pago: 'efectivo',
        hora_llegada: '18:30',
        hora_concierto: '21:30'
      },
      testBandId
    );
    testToken = deal.token!;
  });

  it('dealsRouter has defined routes for /deals and /public/deals/:token', () => {
    expect(dealsRouter).toBeDefined();
    expect(typeof dealsRouter).toBe('function');
  });

  it('evaluates public deal retrieval handler with mock req/res', async () => {
    // Find the GET /public/deals/:token handler in stack
    const layer = dealsRouter.stack.find(
      (s: any) => s.route && s.route.path === '/public/deals/:token' && s.route.methods.get
    );
    expect(layer).toBeDefined();

    const handler = layer.route.stack[0].handle;

    // Test 404 for non-existent token
    let status404: number | undefined;
    let json404: any;
    const req404: any = { params: { token: 'dl_non_existent' } };
    const res404: any = {
      status: (code: number) => {
        status404 = code;
        return res404;
      },
      json: (data: any) => {
        json404 = data;
        return res404;
      }
    };
    await handler(req404, res404);
    expect(status404).toBe(404);
    expect(json404.error).toContain('Acuerdo no encontrado');

    // Test 200 for valid token
    let status200: number | undefined;
    let json200: any;
    const req200: any = { params: { token: testToken } };
    const res200: any = {
      status: (code: number) => {
        status200 = code;
        return res200;
      },
      json: (data: any) => {
        json200 = data;
        return res200;
      }
    };
    await handler(req200, res200);
    expect(status200).toBe(200);
    expect(json200.success).toBe(true);
    expect(json200.deal.lugar_sala).toBe('Sala El Sol');
    expect(json200.deal.band_id).toBeUndefined(); // Minimization: no band_id leaked
  });

  it('evaluates public deal sign handler and rejects when rider is not accepted', async () => {
    const layer = dealsRouter.stack.find(
      (s: any) => s.route && s.route.path === '/public/deals/:token/sign' && s.route.methods.post
    );
    expect(layer).toBeDefined();

    const handler = layer.route.stack[0].handle;

    let statusCode: number | undefined;
    let jsonResponse: any;
    const req: any = {
      params: { token: testToken },
      body: {
        nombre_firmante: 'Javier Programador',
        cargo_firmante: 'Dirección',
        firma_imagen: 'data:image/png;base64,iVBORw0...',
        rider_validado_por_sala: false
      },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        jsonResponse = data;
        return res;
      }
    };

    await handler(req, res);
    expect(statusCode).toBe(400);
    expect(jsonResponse.error).toContain('condiciones técnicas');
  });
});
