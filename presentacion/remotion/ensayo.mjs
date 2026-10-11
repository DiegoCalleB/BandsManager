#!/usr/bin/env node
/**
 * Ensayo general de la película: la reproduce una vez en Chromium, en directo, y anota con la hora exacta de la página
 * todo lo que cambia (clases, estilos, textos, nodos), cuándo empieza cada animación CSS, por dónde va cada vídeo y
 * cuándo empieza a sonar de verdad cada voz. Remotion (src/) vuelve a montar la película fotograma a fotograma con
 * estas notas: imagen y sonido van con el mismo reloj, así que no se desincronizan aunque la máquina vaya cargada.
 *
 *   python3 -m http.server 8099 --directory presentacion &
 *   node presentacion/remotion/ensayo.mjs [--corte] [--max SEGUNDOS]
 * Deja en public/ensayo/: foto.html (la página al empezar), notas.json y las derivaciones de WebAudio (música y efectos).
 */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const aqui = path.dirname(new URL(import.meta.url).pathname);
const dest = path.join(aqui, 'public', 'ensayo');
const DECK = process.env.DECK_URL || 'http://localhost:8099/';
const WEBM = process.env.WEBM_DIR || '/tmp/claude-0/webm';
const corte = process.argv.includes('--corte');
const max = process.argv.includes('--max') ? +process.argv[process.argv.indexOf('--max') + 1] : 0;
fs.mkdirSync(dest, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.route(/\/video\/[^/]+\.mp4$/, async (r) => {
  const f = path.join(WEBM, r.request().url().split('/').pop().replace('.mp4', '.webm'));
  if (fs.existsSync(f)) await r.fulfill({ path: f, contentType: 'video/webm' }); else await r.continue();
});
page.on('pageerror', (e) => console.error('error en la página:', e.message));
await page.addInitScript(() => {
  try { localStorage.setItem('bm_subs', 'es'); } catch (e) { /* sin almacenamiento */ }
  document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('grabando'));
  const R = (window.__R = { ops: [], anims: [], media: [], voces: [], taps: [], on: false });
  let n = 0;
  const id = (el) => { if (!el.dataset.rid) el.dataset.rid = String(++n); return el.dataset.rid; };
  const marcar = (el) => { if (el.nodeType !== 1) return; id(el); for (const h of el.querySelectorAll('*')) id(h); };
  R.marcar = marcar;
  const ahora = () => performance.now();
  // ── cambios del DOM ──
  R.obs = new MutationObserver((lista) => {
    const t = ahora(), textos = new Set();
    for (const m of lista) {
      if (m.type === 'attributes') {
        if (m.attributeName === 'data-rid' || !m.target.isConnected) continue;
        R.ops.push({ t, k: 'a', id: id(m.target), n: m.attributeName, v: m.target.getAttribute(m.attributeName) });
      } else if (m.type === 'characterData') {
        if (m.target.parentElement) textos.add(m.target.parentElement);
      } else {
        let soloTexto = true;
        for (const x of m.removedNodes) { if (x.nodeType === 1) { soloTexto = false; if (x.dataset && x.dataset.rid) R.ops.push({ t, k: 'rm', id: x.dataset.rid }); } }
        for (const x of m.addedNodes) {
          if (x.nodeType !== 1) continue;
          soloTexto = false;
          if (!x.isConnected || x.parentElement !== m.target) continue;
          marcar(x);
          const prev = x.previousElementSibling;
          R.ops.push({ t, k: 'add', p: id(m.target), tras: prev ? id(prev) : null, html: x.outerHTML });
        }
        if (soloTexto || [...m.addedNodes, ...m.removedNodes].some((x) => x.nodeType === 3)) textos.add(m.target);
      }
    }
    for (const el of textos) { if (el.isConnected) { marcar(el); R.ops.push({ t, k: 'h', id: id(el), html: el.innerHTML }); } }
  });
  // ── animaciones y transiciones CSS: cuándo empieza cada una (startTime, en el reloj del documento) ──
  const vistas = new WeakSet();
  const animas = () => {
    if (R.on) {
      for (const a of document.getAnimations()) {
        if (vistas.has(a) || a.startTime === null) continue;
        vistas.add(a);
        const ef = a.effect, el = ef && ef.target;
        if (!el || !el.isConnected) continue;
        R.anims.push({ id: id(el), ps: ef.pseudoElement || '', n: a.animationName || a.transitionProperty || a.id || '', s: a.startTime, k: a.constructor.name });
      }
    }
    requestAnimationFrame(animas);
  };
  requestAnimationFrame(animas);
  // ── vídeos y voces ──
  const MED = ['play', 'playing', 'pause', 'seeked', 'ratechange', 'ended', 'timeupdate', 'volumechange'];
  // las voces son new Audio() sueltos (fuera del documento): sus eventos no llegan a document, se escuchan en cada uno
  const oidos = new WeakSet(), play = HTMLMediaElement.prototype.play;
  const escuchar = (m) => { if (oidos.has(m)) return; oidos.add(m); for (const e of MED) m.addEventListener(e, (ev) => nota(e, ev)); };
  HTMLMediaElement.prototype.play = function () { escuchar(this); return play.apply(this, arguments); };
  const nota = (e, ev) => {
      const m = ev.target;
      if (!R.on || !(m instanceof HTMLMediaElement)) return;
      const t = ahora();
      if (m.tagName === 'VIDEO') {
        if (m.isConnected) R.media.push({ t, id: id(m), e, ct: m.currentTime, r: m.playbackRate, p: m.paused });
      } else if (!(m.dataset && m.dataset.tap) && !/^data:/.test(m.currentSrc || m.src || '')) {
        // las voces: la hora buena es la de «playing» (cuando empieza a sonar), no la de play()
        if (e === 'playing' || e === 'pause' || e === 'ended' || e === 'volumechange') R.voces.push({ t, e, src: m.currentSrc || m.src, ct: m.currentTime, r: m.playbackRate, vol: m.volume });
      }
  };
  // ── derivación de la salida de WebAudio (música con su ducking, logotipo, tráiler, efectos) ──
  const conectar = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      if (dest && dest.constructor && dest.constructor.name === 'AudioDestinationNode') {
        const c = dest.context;
        if (!c.__tap) {
          c.__tap = c.createMediaStreamDestination();
          const rec = new MediaRecorder(c.__tap.stream, { mimeType: 'audio/webm;codecs=opus' });
          const info = { t: 0, chunks: [], rec };
          rec.onstart = () => { info.t = performance.now(); };
          rec.ondataavailable = (e) => info.chunks.push(e.data);
          rec.start(1000); R.taps.push(info);
        }
        conectar.call(this, c.__tap);
      }
    } catch (e) { /* si falla, solo se pierde ese sonido */ }
    return conectar.apply(this, arguments);
  };
  // empieza a anotar: foto de la página y, desde ahí, cada cambio
  R.empezar = () => {
    marcar(document.documentElement);
    R.foto = '<!doctype html>\n' + document.documentElement.outerHTML;
    R.t0 = ahora();
    R.reloj = performance.now() - (document.timeline.currentTime || 0); // reloj de la página − reloj de las animaciones
    R.on = true;
    R.obs.observe(document.documentElement, { subtree: true, attributes: true, childList: true, characterData: true });
    return R.t0;
  };
});

await page.goto(DECK);
const PUERTA = corte ? 'gateCorto' : 'gatePeli';
await page.waitForSelector('#' + PUERTA);
await page.waitForTimeout(1500); // que carguen fuentes e imágenes de la entrada
await page.evaluate(() => window.__R.empezar());
await page.click('#' + PUERTA);
const tIni = Date.now();
let ultimo = '';
for (;;) {
  await page.waitForTimeout(500);
  const h = await page.evaluate(() => (window.Deck ? window.Deck.cur + 1 : 0) + '/' + (window.Deck ? window.Deck.N : 0));
  if (h !== ultimo) { ultimo = h; process.stdout.write(`\r#${h}  ${Math.round((Date.now() - tIni) / 1000)} s   `); }
  if (max && (Date.now() - tIni) / 1000 > max) break;
  if (await page.evaluate(() => document.body.dataset.fin === '1')) { await page.waitForTimeout(2500); break; }
  if (Date.now() - tIni > 40 * 60 * 1000) { console.error('\ndemasiado larga'); break; }
}
console.log('\nrecogiendo notas…');
const notas = await page.evaluate(async () => {
  const R = window.__R; R.on = false; R.obs.disconnect();
  const taps = [];
  for (const [i, t] of R.taps.entries()) {
    await new Promise((res) => { t.rec.onstop = res; try { t.rec.stop(); } catch (e) { res(); } });
    const buf = new Uint8Array(await new Blob(t.chunks, { type: 'audio/webm' }).arrayBuffer());
    let s = ''; for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(k, k + 0x8000));
    taps.push({ f: `tap${i}.webm`, t: t.t, b64: btoa(s) });
  }
  return { foto: R.foto, t0: R.t0, fin: performance.now(), reloj: R.reloj, ops: R.ops, anims: R.anims, media: R.media, voces: R.voces, taps };
});
await browser.close();
fs.writeFileSync(path.join(dest, 'foto.html'), notas.foto);
// la hoja de estilos de este ensayo (Remotion no sirve enlaces simbólicos a ficheros)
fs.copyFileSync(path.join(aqui, '..', 'styles.css'), path.join(aqui, 'public', 'styles.css'));
for (const t of notas.taps) { fs.writeFileSync(path.join(dest, t.f), Buffer.from(t.b64, 'base64')); delete t.b64; }
delete notas.foto;
fs.writeFileSync(path.join(dest, 'notas.json'), JSON.stringify(notas));
console.log(`${((notas.fin - notas.t0) / 1000).toFixed(1)} s · ${notas.ops.length} cambios · ${notas.anims.length} animaciones · ${notas.media.length} notas de vídeo · ${notas.voces.filter((v) => v.e === 'playing').length} voces · ${notas.taps.length} derivaciones de audio`);
