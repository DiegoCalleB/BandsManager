import { test, expect } from '@playwright/test';

// Qué protege: las rutas públicas FUERA de /api que el servidor responde antes del fallback de la
// SPA — enlaces cortos (/r/:code), página de cada concierto (/e/:slug), sitemap.xml y robots.txt.
// Si alguien reordena server.ts y el fallback se las traga, Google, WhatsApp y los carteles con QR
// reciben el index.html de la app en vez de lo que esperan, y nadie con sesión lo nota.
// No necesitan credenciales: sin Supabase, cada una cae a su respuesta segura.

test('robots.txt es texto plano, deja fuera la API y los enlaces cortos y apunta al sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBeTruthy();
  expect(res.headers()['content-type']).toContain('text/plain');
  const cuerpo = await res.text();
  expect(cuerpo).toContain('Disallow: /api/');
  expect(cuerpo).toContain('Disallow: /r/');
  expect(cuerpo).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test('sitemap.xml es XML válido (con la portada aunque no haya base de datos)', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
  expect(res.headers()['content-type']).toContain('xml');
  const cuerpo = await res.text();
  expect(cuerpo.startsWith('<?xml')).toBe(true);
  expect(cuerpo).toContain('<urlset');
  expect(cuerpo).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
});

test('un enlace corto desconocido redirige a la portada, sin caché y sin indexar', async ({ request }) => {
  const res = await request.get('/r/abcdefg', { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()['cache-control']).toBe('no-store');
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  expect(res.headers()['location']).toMatch(/^https?:\/\/[^/]+\/?$/);
});

test('una página de concierto que no existe da 404 con noindex (no el index.html de la app)', async ({ request }) => {
  const res = await request.get('/e/sin-id');
  expect(res.status()).toBe(404);
  const html = await res.text();
  expect(html).toContain('noindex');
  expect(html).toContain('Concierto no encontrado');
  expect(html).not.toContain('id="root"');
});

test('la API de enlaces y de referidos no responde sin sesión', async ({ request }) => {
  for (const ruta of ['/api/short-links', '/api/referidos']) {
    expect((await request.get(ruta)).status(), ruta).toBe(401);
  }
  expect((await request.post('/api/campana-concierto/redactar', { data: {} })).status()).toBe(401);
});
