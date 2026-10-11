import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
const aqui = (f) => fileURLToPath(new URL(f, import.meta.url));
const S = [
 ['s1', '<div class="c"><b style="color:#d6ae5c">PELÁEZ · DISCOS CUARZO</b>«Yo gestiono, me quedo el 30 % y los másteres, naturalmente, son míos.»</div>'],
 ['s2', '<div class="c"><b style="color:#8fb6ff">IAGO · BAJO</b>«No firméis nada. Las canciones son nuestras. Y los datos, también.»</div>'],
 ['s3', '<div class="g">Y AHORA, A TOCAR.</div>'],
];
const H = ['h3', '<div class="h">Y AHORA, A TOCAR.</div>'];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await b.newPage({viewport:{width:1080,height:1920}});
await p.goto(new URL('subs.html', import.meta.url).href); await p.waitForTimeout(2000);
for (const [n,h] of S) { await p.evaluate((h)=>{document.getElementById('x').innerHTML=h}, h); await p.waitForTimeout(300); await p.screenshot({path: aqui(`${n}.png`), omitBackground:true}); }
await p.setViewportSize({width:1920,height:1080}); await p.evaluate((h)=>{document.getElementById('x').innerHTML=h}, H[1]); await p.waitForTimeout(300);
await p.screenshot({path: aqui('h3.png')});
await b.close();
