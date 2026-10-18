import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
const aqui = (f) => fileURLToPath(new URL(f, import.meta.url));
const S = [
 ['s1', '<div class="c"><b style="color:#d6ae5c">PELÁEZ · DISCOS CUARZO</b>«Yo os llevo los bolos, me quedo el 30&nbsp;% y el repertorio lo decido yo.»</div>'],
 ['s2', '<div class="c"><b style="color:#8fb6ff">IAGO · BAJO</b>«No firméis nada. Las canciones son nuestras.»</div>'],
 ['s3', '<div class="g">Y AHORA, A TOCAR.</div>'],
];
const H = ['h3', '<div class="h">Y AHORA, A TOCAR.</div>'];
// cartel final del tráiler: logo, lema y TFM
const F = ['h4', '<div class="h" style="text-align:center"><div><div style="font:700 132px/1 Oswald;color:#fff;letter-spacing:.01em">BandManager<span style="color:#5b9cff">.io</span></div><div style="margin-top:26px;font:600 46px/1.2 Onest;color:#ffb37a;letter-spacing:.02em">Menos gestión, más música.</div><div style="margin-top:40px;font:600 24px/1.3 Onest;color:rgba(255,255,255,.62);letter-spacing:.32em">TFM · MÁSTER DE DESARROLLO CON IA · THE BIG SCHOOL</div></div></div>'];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto(new URL('subs.html', import.meta.url).href); await p.waitForTimeout(2000);
for (const [n,h] of S) { await p.evaluate((h)=>{document.getElementById('x').innerHTML=h}, h); await p.waitForTimeout(300); await p.screenshot({path: aqui(`${n}.png`), omitBackground:true}); }
await p.setViewportSize({width:1920,height:1080}); await p.evaluate((h)=>{document.getElementById('x').innerHTML=h}, H[1]); await p.waitForTimeout(300);
await p.screenshot({path: aqui('h3.png')});
await p.evaluate((h)=>{document.getElementById('x').innerHTML=h}, F[1]); await p.waitForTimeout(300);
await p.screenshot({path: aqui('h4.png')});
await b.close();
