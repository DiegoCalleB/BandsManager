/**
 * Seguimiento público de correos: solo con token firmado, sin redirecciones abiertas y con el
 * webhook de Resend firmado. Regresiones de la auditoría B.
 */
import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeDealsSupabase } from '../../db/__tests__/helpers/fakeDealsSupabase';

const fake = crearFakeDealsSupabase();
vi.mock('../../db/core.js', () => ({ getSupabase: () => fake.client, cleanBandId: (b?: string) => (b || '').replace(/^(band|reg)-/, '') }));
vi.mock('../../db/sync.js', () => ({ invalidateBandStateCache: () => {} }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({ leads: [] }), saveState: () => {} }));

import router, { generateTrackingToken } from '../tracking.js';
import { firmarDestino } from '../../utils/trackingSeguro';

function manejador(ruta: string, metodo: 'get' | 'post') {
  const capa: any = (router as any).stack.find((s: any) => s.route && s.route.path.includes?.(ruta) !== undefined && (Array.isArray(s.route.path) ? s.route.path.includes(ruta) : s.route.path === ruta) && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = { cabeceras: {} };
  r.setHeader = (k: string, v: any) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.send = (b: any) => ((r.body = b), r);
  r.json = (b: any) => ((r.body = b), r);
  r.redirect = (c: number, u: string) => ((r.code = c), (r.destino = u), r);
  return r;
};
const esperar = () => new Promise((r) => setTimeout(r, 20));
const lead = () => fake.tablas.leads.find((l: any) => l.id === 'lead-1');

beforeEach(() => {
  fake.tablas.leads.length = 0;
  fake.tablas.leads.push({ id: 'lead-1', band_id: 'band-a', nombre_sala: 'Sala', notas: '', historial_contacto: [], veces_abierto: 0 });
  fake.estado.fallosPorTabla = {};
});

describe('/tracking/open', () => {
  it('con un leadId en claro (sin token) NO registra nada', async () => {
    await manejador('/api/tracking/open', 'get')({ query: { leadId: 'lead-1', l: 'lead-1' }, headers: {} }, resFalso());
    await esperar();
    expect(lead().veces_abierto).toBe(0);
  });

  it('con un token firmado sí registra la apertura', async () => {
    const t = generateTrackingToken({ leadId: 'lead-1', bandId: 'band-a' });
    await manejador('/api/tracking/open', 'get')({ query: { t }, headers: { 'user-agent': 'Mozilla' } }, resFalso());
    await esperar();
    expect(lead().veces_abierto).toBe(1);
  });

  it('los atajos «diego/mon» ya no resuelven al lead de pruebas', async () => {
    fake.tablas.leads.push({ id: 'lead-diego', band_id: 'band-x', email_contacto: 'diego.delacalleb@gmail.com', nombre_sala: 'Mon Live', veces_abierto: 0, historial_contacto: [] });
    const t = generateTrackingToken({ leadId: 'diego-inexistente', bandId: 'band-a' });
    await manejador('/api/tracking/open', 'get')({ query: { t }, headers: {} }, resFalso());
    await esperar();
    expect(fake.tablas.leads.find((l: any) => l.id === 'lead-diego').veces_abierto).toBe(0);
  });
});

describe('/tracking/click: redirecciones', () => {
  const t = () => generateTrackingToken({ leadId: 'lead-1', bandId: 'band-a' });
  const clic = async (query: any) => {
    const res = resFalso();
    await manejador('/api/tracking/click', 'get')({ query, headers: {} }, res);
    await esperar();
    return res;
  };

  it('no redirige a un sitio cualquiera sin firmar', async () => {
    const res = await clic({ t: t(), url: 'https://phishing.example/login' });
    expect(res.destino).toBe('https://bandmanager.io');
  });

  it('sí a un destino firmado y a las redes conocidas', async () => {
    const url = 'https://mibanda.com/entradas';
    expect((await clic({ t: t(), url, s: firmarDestino(url) })).destino).toBe(url);
    expect((await clic({ t: t(), url: 'https://open.spotify.com/x' })).destino).toBe('https://open.spotify.com/x');
  });

  it('sin token firmado redirige igual pero no registra el clic', async () => {
    await clic({ url: 'https://open.spotify.com/x', leadId: 'lead-1' });
    expect(lead().historial_contacto).toEqual([]);
  });
});

describe('/tracking/interaction', () => {
  it('solo con token; y el texto se acorta y se limpia', async () => {
    await manejador('/api/tracking/interaction', 'post')({ body: { leadId: 'lead-1', action: 'x', details: 'y' }, headers: {} }, resFalso());
    await esperar();
    expect(lead().historial_contacto).toEqual([]);

    const t = generateTrackingToken({ leadId: 'lead-1', bandId: 'band-a' });
    await manejador('/api/tracking/interaction', 'post')({ body: { token: t, action: 'Ver\nsetlist', details: 'a'.repeat(1000) }, headers: {} }, resFalso());
    await esperar();
    const h = lead().historial_contacto[0];
    expect(h.resultado).toBe('Ver setlist');
    expect(h.notas.length).toBeLessThanOrEqual(160);
  });
});

describe('/webhooks/resend', () => {
  const secreto = `whsec_${Buffer.from('clave-de-prueba').toString('base64')}`;
  const evento = JSON.stringify({ type: 'email.opened', data: { metadata: { lead_id: 'lead-1' }, to: ['a@x.com'] } });
  const llamar = async (cabeceras: any) => {
    const res = resFalso();
    await manejador('/webhooks/resend', 'post')({ body: JSON.parse(evento), rawBody: Buffer.from(evento), headers: cabeceras }, res);
    await esperar();
    return res;
  };

  it('sin firma (o sin secreto configurado) responde 401 y no toca nada', async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    expect((await llamar({})).code).toBe(401);
    process.env.RESEND_WEBHOOK_SECRET = secreto;
    expect((await llamar({ 'svix-id': 'm1', 'svix-timestamp': String(Math.floor(Date.now() / 1000)), 'svix-signature': 'v1,falsa' })).code).toBe(401);
    expect(lead().historial_contacto).toEqual([]);
  });

  it('con firma Svix válida procesa el evento', async () => {
    process.env.RESEND_WEBHOOK_SECRET = secreto;
    const ts = String(Math.floor(Date.now() / 1000));
    const firma = 'v1,' + crypto.createHmac('sha256', Buffer.from('clave-de-prueba')).update(`m2.${ts}.${evento}`).digest('base64');
    const res = await llamar({ 'svix-id': 'm2', 'svix-timestamp': ts, 'svix-signature': firma });
    expect(res.body).toEqual({ received: true });
    expect(lead().historial_contacto.length).toBe(1);
  });
});
