import { describe, expect, it } from 'vitest';
import { esIpPrivadaOReservada, validarYResolverUrlSegura, fetchUrlExternaSegura } from '../ssrfGuard';

describe('esIpPrivadaOReservada', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.0.1', '169.254.169.254', '0.0.0.0',
    '100.64.0.1', '224.0.0.1', '255.255.255.255', '198.18.0.1',
    '::1', '::', 'fe80::1', 'fc00::1', 'fd12::1', 'ff02::1',
    // Formas IPv4-mapped que el filtro por prefijo de texto dejaba pasar:
    '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', '0:0:0:0:0:ffff:7f00:1', '64:ff9b::7f00:1',
    'no-es-una-ip',
  ])('bloquea %s', (ip) => {
    expect(esIpPrivadaOReservada(ip)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8'])('permite %s', (ip) => {
    expect(esIpPrivadaOReservada(ip)).toBe(false);
  });
});

describe('validarYResolverUrlSegura', () => {
  it.each([
    'http://[::1]/', 'http://[::ffff:7f00:1]/', 'http://127.0.0.1:8080/', 'http://2130706433/', 'http://0x7f.1/',
    'http://localhost/', 'http://metadata.internal/', 'file:///etc/passwd', 'ftp://example.com/',
  ])('rechaza %s', async (url) => {
    expect((await validarYResolverUrlSegura(url)).segura).toBe(false);
  });
});

describe('fetchUrlExternaSegura', () => {
  it('lanza SSRF_BLOCKED ante un destino interno aunque se pidan redirecciones', async () => {
    await expect(fetchUrlExternaSegura('http://127.0.0.1/', { maxRedirects: 3 })).rejects.toThrow('SSRF_BLOCKED');
  });
});
