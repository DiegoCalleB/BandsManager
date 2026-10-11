#!/usr/bin/env node
/**
 * Graba la película (modo película del deck) a un MP4 con su audio. Pensado para tener una copia a prueba de
 * wifi y de navegadores, y para poder verla en el móvil.
 *
 *   python3 -m http.server 8099 --directory presentacion &        # el deck servido
 *   node presentacion/tools/grabar_pelicula.mjs [salida.mp4] [--max SEGUNDOS]
 *
 * Cómo funciona (el Chromium de Playwright no tiene salida de audio ni reproduce H.264):
 *  - Vídeo: recordVideo de Playwright a 1280x720.
 *  - Voces y música: se anota cuándo se reproduce cada audio (HTMLMediaElement.play) y luego se mezclan con ffmpeg,
 *    bajando la música mientras habla alguien, igual que hace cine.js.
 *  - Sonidos de WebAudio (logotipo, tráiler, transiciones): se graban por una derivación de la salida con MediaRecorder.
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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: tmp, size: { width: 1280, height: 720 } } });
const t0 = Date.now(); // el vídeo empieza al crear la página
const page = await ctx.newPage();
const t1 = Date.now();
await page.route(/\/video\/[^/]+\.mp4$/, async (r) => {
  const n = r.request().url().split('/').pop().replace('.mp4', '.webm');
  const f = path.join(WEBM, n);
  if (fs.existsSync(f)) await r.fulfill({ path: f, contentType: 'video/webm' }); else await r.continue();
});
await page.addInitScript(() => {
  try { localStorage.setItem('bm_subs', 'es'); } catch (e) { /* sin almacenamiento */ }
  window.__audio = []; window.__taps = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (this.tagName === 'AUDIO' || /\.(mp3|m4a)/.test(this.currentSrc || this.src || '')) {
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
    } catch (e) { /* si falla, solo se pierde ese sonido */ }
    return conectar.apply(this, arguments);
  };
});
await page.goto(DECK);
const PUERTA = process.env.GATE || 'gatePeli'; // gateCorto = el corte de 5 minutos
await page.waitForSelector('#' + PUERTA);
const tClick = Date.now();
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
console.log('\nrecogiendo audio…');
const datos = await page.evaluate(async () => {
  const taps = [];
  for (const t of window.__taps) {
    await new Promise((res) => { t.rec.onstop = res; try { t.rec.stop(); } catch (e) { res(); } });
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
const off = (t1 - t0) / 1000 + 0.15;
fs.writeFileSync(path.join(tmp, 'eventos.json'), JSON.stringify({ off, audio: datos.audio, ahora: datos.ahora }));
datos.taps.forEach((t, i) => fs.writeFileSync(path.join(tmp, `tap${i}.webm`), Buffer.from(t.b64, 'base64')));
fs.writeFileSync(path.join(tmp, 'taps.json'), JSON.stringify(datos.taps.map((t, i) => ({ f: `tap${i}.webm`, t: t.t }))));
const aqui = path.dirname(new URL(import.meta.url).pathname);
execFileSync('python3', [path.join(aqui, 'mezclar_pelicula.py'), tmp, path.resolve(aqui, '..'), video, salida], { stdio: 'inherit' });
console.log('→', salida);
