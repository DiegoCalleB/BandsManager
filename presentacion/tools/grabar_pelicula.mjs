#!/usr/bin/env node
/**
 * Graba la película (modo película del deck) a un MP4 con su audio. Pensado para tener una copia a prueba de
 * wifi y de navegadores, y para poder verla en el móvil.
 *
 *   python3 -m http.server 8099 --directory presentacion &        # el deck servido
 *   node presentacion/tools/grabar_pelicula.mjs [salida.mp4] [--max SEGUNDOS]
 *   GATE=gateCorto (el corte de 5 min) · RES=1080 (copia de entrega a 1920x1080, CRF 20)
 *
 * Cómo funciona (el Chromium de Playwright no tiene salida de audio ni reproduce H.264):
 *  - Vídeo: recordVideo de Playwright a 1280x720.
 *  - Voces: se anota cuándo se reproduce cada audio (HTMLMediaElement.play) y luego se mezclan con numpy y ffmpeg.
 *  - WebAudio (música por escenas con su ducking, logotipo, tráiler, rampas y golpes del montaje): se graba por una
 *    derivación de la salida con MediaRecorder.
 *  - Los .mp4 de video/ se sirven como .webm convertidos en $WEBM_DIR (por defecto /tmp/claude-0/webm).
 * Necesita: playwright-core, Chromium en /opt/pw-browsers/chromium, ffmpeg y python3 con numpy.
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const salida = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'pelicula.mp4');
const max = process.argv.includes('--max') ? +process.argv[process.argv.indexOf('--max') + 1] : 0;
const DECK = process.env.DECK_URL || 'http://localhost:8099/';
const WEBM = process.env.WEBM_DIR || '/tmp/claude-0/webm';
const tmp = fs.mkdtempSync('/tmp/grabar-');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
// RES=1080 para la copia de entrega (1920x1080, más calidad y más peso); por defecto 1280x720, ligera para enviarla
const [W, H] = process.env.RES === '1080' ? [1920, 1080] : [1280, 720];
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } } });
const t0 = Date.now(); // el vídeo empieza al crear la página
const page = await ctx.newPage();
const t1 = Date.now();
await page.route(/\/video\/(?:actores\/)?[^/]+\.mp4$/, async (r) => {
  const n = r.request().url().split('/').pop().replace('.mp4', '.webm');
  // los de video/actores ya traen su copia .webm al lado (el tráiler de la pantalla de Netflix usa uno)
  const f = [path.join(WEBM, n), path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'video', 'actores', n)].find((x) => fs.existsSync(x));
  if (f) await r.fulfill({ path: f, contentType: 'video/webm' }); else await r.continue();
});
await page.addInitScript(() => {
  try { localStorage.setItem('bm_subs', 'es'); } catch { /* sin almacenamiento */ }
  // en la grabación sobran los botones de «Saltar intro» y «Saltar créditos»
  document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('grabando'));
  window.__audio = []; window.__taps = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    // la música (data-tap) va por WebAudio y ya la recoge la derivación; aquí solo se anotan las voces
    if ((this.tagName === 'AUDIO' || /\.(mp3|m4a)/.test(this.currentSrc || this.src || '')) && !(this.dataset && this.dataset.tap) && !/^data:/.test(this.currentSrc || this.src || '')) {
      window.__audio.push({ t: performance.now(), src: this.currentSrc || this.src, rate: this.playbackRate, vol: this.volume, bgm: /musica/.test(this.src) });
    }
    return play.apply(this, arguments);
  };
  // derivación de la salida de WebAudio para grabarla
  const conectar = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      if (dest && dest.constructor && dest.constructor.name === 'AudioDestinationNode') {
        const c = dest.context;
        if (!c.__tap) {
          c.__tap = c.createMediaStreamDestination();
          const rec = new MediaRecorder(c.__tap.stream, { mimeType: 'audio/webm;codecs=opus' });
          const info = { t: performance.now(), chunks: [], rec };
          rec.ondataavailable = (e) => info.chunks.push(e.data);
          rec.start(1000); window.__taps.push(info);
        }
        conectar.call(this, c.__tap);
      }
    } catch { /* si falla, solo se pierde ese sonido */ }
    return conectar.apply(this, arguments);
  };
});
await page.goto(DECK);
const PUERTA = process.env.GATE || 'gatePeli'; // gateCorto = el corte de 5 minutos
await page.waitForSelector('#' + PUERTA, { state: 'attached' });
// Claqueta: medio segundo en magenta con su hora exacta en el reloj de la página. Luego se busca en el vídeo, y así
// imagen y sonido se alinean midiendo (el inicio real del vídeo de Playwright varía con la carga de la máquina)
const claqueta = () => page.evaluate(() => new Promise((res) => {
  const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#ff00ff';
  document.documentElement.appendChild(d);
  requestAnimationFrame(() => requestAnimationFrame(() => { const t = performance.now(); setTimeout(() => { d.remove(); requestAnimationFrame(() => res(t)); }, 500); }));
}));
const claq1 = await claqueta();
// Pantalla de Netflix: se elige el perfil, se ve el inicio y arranca el tráiler solo (INTRO=0 la salta y el MP4 empieza en «Reproducir»)
let tIntroPag = null;
if (process.env.INTRO !== '0' && await page.$('.nx-perfil')) {
  tIntroPag = await page.evaluate(() => performance.now());
  await page.waitForTimeout(1800); // los perfiles, un momento a la vista
  await page.click('.nx-perfil');
  await page.waitForSelector('#gate.trailer', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2200); // el tráiler rueda y la sinopsis se recoge
} else if (await page.$('.nx-perfil')) { await page.click('.nx-perfil'); await page.waitForTimeout(900); }
if (tIntroPag !== null) await page.evaluate(() => window.NxExplora && window.NxExplora()).catch(() => {}); // recorre las filas de abajo
if (tIntroPag !== null) { // el cursor de mentira llega a «Reproducir» y lo pulsa, para que el clic se vea
  await page.evaluate((id) => window.NxCursor && window.NxCursor(document.getElementById(id)), PUERTA).catch(() => {});
}
const tClick = Date.now();
const tClickPag = await page.evaluate(() => performance.now());
await page.click('#' + PUERTA);
const N = await page.evaluate(() => document.querySelectorAll('section.slide').length);
let ultimo = '', desde = Date.now();
for (;;) {
  await page.waitForTimeout(1000);
  const h = await page.evaluate(() => location.hash || '#1');
  if (h !== ultimo) { ultimo = h; desde = Date.now(); process.stdout.write(`\r${h}/${N}  ${Math.round((Date.now() - tClick) / 1000)} s   `); }
  if (max && (Date.now() - tClick) / 1000 > max) break;
  if (h === '#' + (N - 1) && Date.now() - desde > 20000) break;
  if (await page.evaluate(() => document.body.dataset.fin === '1')) { await page.waitForTimeout(2500); break; }
  if (Date.now() - desde > 150000) { console.error('\natascada en', h); break; }
}
const claq2 = await claqueta();
console.log('\nrecogiendo audio…');
const datos = await page.evaluate(async () => {
  const taps = [];
  for (const t of window.__taps) {
    await new Promise((res) => { t.rec.onstop = res; try { t.rec.stop(); } catch { res(); } });
    const b = new Blob(t.chunks, { type: 'audio/webm' });
    const buf = new Uint8Array(await b.arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    taps.push({ t: t.t, b64: btoa(s) });
  }
  return { audio: window.__audio, taps, ahora: performance.now() };
});
await ctx.close();
await browser.close();
const video = fs.readdirSync(tmp).filter((f) => f.endsWith('.webm')).map((f) => path.join(tmp, f))[0];
// el vídeo empieza (t0) unos instantes antes que el contexto de la página (t1); performance.now() cuenta desde la navegación
// dónde cae cada claqueta en el vídeo: primer fotograma magenta a partir de cada mitad
const magenta = (desde) => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(desde), '-t', '40', '-i', video, '-vf', 'fps=100,scale=4:4', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  for (let k = 0; k + 48 <= raw.length; k += 48) {
    let m = 0; for (let j = 0; j < 48; j += 3) if (raw[k + j] > 200 && raw[k + j + 1] < 70 && raw[k + j + 2] > 200) m++;
    if (m >= 14) return desde + k / 48 / 100;
  }
  return null;
};
const v1 = magenta(0), v2 = v1 === null ? null : magenta(Math.max(v1 + 2, v1 + (claq2 - claq1) / 1000 - 8));
// tiempo del vídeo = tiempo de la página / 1000 + off (sin claqueta, la estimación de antes)
const off = v1 === null ? (t1 - t0) / 1000 + 0.15 : v1 - claq1 / 1000;
if (v1 !== null && v2 !== null) console.log(`claquetas: desfase ${off.toFixed(3)} s · deriva en ${((claq2 - claq1) / 60000).toFixed(1)} min: ${((v2 - claq2 / 1000) - off).toFixed(3)} s`);
else console.log('OJO: sin claqueta en el vídeo; sincronía estimada');
// el MP4 empieza en la pantalla de perfiles de Netflix (o, con INTRO=0, al pulsar «Reproducir», justo con el logotipo), sin la claqueta
const inicio = Math.max(0, (tIntroPag !== null ? tIntroPag : tClickPag) / 1000 + off + 0.1);
fs.writeFileSync(path.join(tmp, 'eventos.json'), JSON.stringify({ off, audio: datos.audio, ahora: datos.ahora }));
datos.taps.forEach((t, i) => fs.writeFileSync(path.join(tmp, `tap${i}.webm`), Buffer.from(t.b64, 'base64')));
fs.writeFileSync(path.join(tmp, 'taps.json'), JSON.stringify(datos.taps.map((t, i) => ({ f: `tap${i}.webm`, t: t.t }))));
const aqui = path.dirname(new URL(import.meta.url).pathname);
execFileSync('python3', [path.join(aqui, 'mezclar_pelicula.py'), tmp, path.resolve(aqui, '..'), video, salida], { stdio: 'inherit', env: { ...process.env, INICIO: String(inicio), CRF: process.env.CRF || (W === 1920 ? '20' : '30') } });
console.log('→', salida);
