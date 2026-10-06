import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  decodificarToken, destinoSeguro, firmarDestino, generarToken, idSeguro, textoLibreSeguro, verificarFirmaSvix,
} from '../trackingSeguro';

describe('tokens de seguimiento', () => {
  it('ida y vuelta de un token firmado', () => {
    const t = generarToken({ leadId: 'lead-1', bandId: 'band-a', msgId: 'm1' });
    expect(decodificarToken(t)).toEqual({ leadId: 'lead-1', bandId: 'band-a', msgId: 'm1' });
  });

  it('rechaza el base64 SIN firma (lo que cualquiera podía fabricar) y firmas manipuladas', () => {
    const sinFirma = Buffer.from(JSON.stringify({ leadId: 'lead-1', bandId: 'band-a' })).toString('base64url');
    expect(decodificarToken(sinFirma)).toBeNull();
    const t = generarToken({ leadId: 'lead-1', bandId: 'band-a' });
    const [datos] = t.split('.');
    expect(decodificarToken(`${datos}.0000000000000000`)).toBeNull();
    const otroDato = Buffer.from(JSON.stringify({ leadId: 'lead-2', bandId: 'band-a' })).toString('base64url');
    expect(decodificarToken(`${otroDato}.${t.split('.')[1]}`)).toBeNull();
    expect(decodificarToken(undefined)).toBeNull();
  });

  it('rechaza ids con caracteres de filtro (inyección en .or)', () => {
    const malo = generarToken({ leadId: 'x,id.neq.zzz', bandId: 'band-a' });
    expect(decodificarToken(malo)).toBeNull();
    expect(idSeguro('lead-123_abc')).toBe(true);
    expect(idSeguro('a,b')).toBe(false);
    expect(idSeguro('a)')).toBe(false);
    expect(idSeguro('%')).toBe(false);
  });
});

describe('redirecciones', () => {
  it('un destino cualquiera sin firmar NO se respeta (adiós al phishing sobre el dominio de la marca)', () => {
    expect(destinoSeguro('https://evil.example/login', undefined)).toBe('https://bandmanager.io');
    expect(destinoSeguro('javascript:alert(1)', undefined)).toBe('https://bandmanager.io');
    expect(destinoSeguro('https://bandmanager.io.evil.com/x', undefined)).toBe('https://bandmanager.io');
  });

  it('un destino firmado por nosotros sí, y la firma no sirve para otra URL', () => {
    const url = 'https://mibanda.com/tienda';
    expect(destinoSeguro(url, firmarDestino(url))).toBe(url);
    expect(destinoSeguro('https://evil.example', firmarDestino(url))).toBe('https://bandmanager.io');
  });

  it('los enlaces antiguos a redes conocidas siguen funcionando sin firma', () => {
    expect(destinoSeguro('https://open.spotify.com/artist/1', undefined)).toBe('https://open.spotify.com/artist/1');
    expect(destinoSeguro('https://www.instagram.com/banda', undefined)).toBe('https://www.instagram.com/banda');
  });
});

describe('webhook de Resend (Svix)', () => {
  const secreto = `whsec_${Buffer.from('clave-de-prueba-123').toString('base64')}`;
  const firmar = (id: string, ts: string, cuerpo: string) =>
    'v1,' + crypto.createHmac('sha256', Buffer.from('clave-de-prueba-123')).update(`${id}.${ts}.${cuerpo}`).digest('base64');
  const ahora = 1_800_000_000_000;
  const ts = String(ahora / 1000);

  it('acepta una firma correcta', () => {
    const cuerpo = '{"type":"email.opened"}';
    expect(verificarFirmaSvix({ secreto, id: 'msg_1', timestamp: ts, firma: firmar('msg_1', ts, cuerpo), cuerpo, ahoraMs: ahora })).toBe(true);
  });

  it('rechaza sin secreto, firma falsa, cuerpo alterado o evento viejo (repetición)', () => {
    const cuerpo = '{"type":"email.opened"}';
    const firma = firmar('msg_1', ts, cuerpo);
    expect(verificarFirmaSvix({ secreto: undefined, id: 'msg_1', timestamp: ts, firma, cuerpo, ahoraMs: ahora })).toBe(false);
    expect(verificarFirmaSvix({ secreto, id: 'msg_1', timestamp: ts, firma: 'v1,AAAA', cuerpo, ahoraMs: ahora })).toBe(false);
    expect(verificarFirmaSvix({ secreto, id: 'msg_1', timestamp: ts, firma, cuerpo: '{"type":"otro"}', ahoraMs: ahora })).toBe(false);
    expect(verificarFirmaSvix({ secreto, id: 'msg_1', timestamp: ts, firma, cuerpo, ahoraMs: ahora + 10 * 60 * 1000 })).toBe(false);
  });
});

describe('textoLibreSeguro', () => {
  it('quita saltos de línea y caracteres de control y recorta', () => {
    expect(textoLibreSeguro('a\nb\r\nc\td', 50)).toBe('a b c d');
    expect(textoLibreSeguro('x'.repeat(500), 40)).toHaveLength(40);
    expect(textoLibreSeguro(undefined, 10)).toBe('');
  });
});
