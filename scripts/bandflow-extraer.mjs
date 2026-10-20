/**
 * Extrae las fichas públicas de salas de Bandflow (bandflow.es) para generar la semilla del catálogo.
 *   node scripts/bandflow-extraer.mjs sitemap-venues.xml fichas.jsonl
 * Lee las URLs de /sala/ del sitemap que publica la propia web (robots.txt lo declara), abre cada ficha con un navegador (la web
 * se pinta con JavaScript), espera 1,5 s entre páginas y se identifica en el User-Agent. Solo se leen las páginas públicas que
 * permite su robots.txt. Es reanudable: salta las URLs ya guardadas. Lo extraído se filtra después con
 * scripts/bandflow-semilla.ts (privacidad). No se guardan reseñas, perfiles de usuarios, descripciones ni fotos.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const SITEMAP = process.argv[2];
const SALIDA = process.argv[3];
const urls = [...fs.readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const hechas = new Set(fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).url) : []);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ userAgent: 'BandManager/1.0 (+https://bandmanager.io; datos publicos de salas)' });
let n = 0;
for (const url of urls) {
  if (hechas.has(url)) continue;
  try {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const dato = await p.evaluate(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent || ''); } catch { return null; } }).filter(Boolean);
      const grafo = ld.flatMap((x) => x['@graph'] ?? [x]);
      const sala = grafo.find((x) => ['MusicVenue', 'LocalBusiness', 'PerformingArtsTheater', 'EventVenue'].includes(x['@type']) || (Array.isArray(x['@type']) && x['@type'].includes('MusicVenue'))) ?? null;
      const enlaces = [...document.querySelectorAll('a[href]')].map((a) => ({ h: a.getAttribute('href') || '', t: (a.textContent || '').trim().slice(0, 60) }));
      return {
        titulo: document.title,
        sala,
        tel: enlaces.filter((e) => e.h.startsWith('tel:')).map((e) => e.h.slice(4)),
        mail: enlaces.filter((e) => e.h.startsWith('mailto:')).map((e) => e.h.slice(7)),
        instagram: enlaces.filter((e) => /instagram\.com/i.test(e.h)).map((e) => e.h),
        web: enlaces.filter((e) => /^https?:/i.test(e.h) && !/bandflow\.es|instagram\.com|supabase\.co/i.test(e.h)).map((e) => e.h),
        texto: document.body.innerText.slice(0, 4000),
      };
    });
    fs.appendFileSync(SALIDA, JSON.stringify({ url, ...dato }) + '\n');
  } catch (e) {
    fs.appendFileSync(SALIDA + '.errores', JSON.stringify({ url, error: String(e).slice(0, 200) }) + '\n');
  }
  n++;
  if (n % 20 === 0) console.log('hechas', n, 'de', urls.length - hechas.size);
  await new Promise((r) => setTimeout(r, 1500));
}
await b.close();
console.log('FIN');
