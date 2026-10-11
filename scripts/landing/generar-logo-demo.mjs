// Genera el logo de la banda de ejemplo («Banda Demo»): public/logo_demo.jpg (con fondo) y
// public/logo_demo_sin_fondo.png (transparente). Es un logo neutro con la Onda de BandManager;
// sustituye al de una banda real que se había quedado como logo de demostración (ADR 0027).
// Uso: node scripts/landing/generar-logo-demo.mjs   (necesita el Chromium de Playwright)
import { chromium } from 'playwright';

const BARRAS = [34, 58, 86, 62, 100, 74, 46, 68, 30];

function svg({ fondo }) {
  const ancho = 22, hueco = 12, base = 190;
  const total = BARRAS.length * ancho + (BARRAS.length - 1) * hueco;
  const x0 = (400 - total) / 2;
  const barras = BARRAS.map((h, i) => {
    const color = i === 4 ? '#E0615C' : i % 2 ? '#F08B84' : '#FDE9E7';
    return `<rect x="${x0 + i * (ancho + hueco)}" y="${base - h}" width="${ancho}" height="${h}" rx="11" fill="${color}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
${fondo ? '<rect width="400" height="400" rx="0" fill="#191C21"/>' : ''}
${barras}
<text x="200" y="262" text-anchor="middle" font-family="Onest, 'Segoe UI', Arial, sans-serif" font-size="58" font-weight="800" fill="${fondo ? '#E3E7EC' : '#2A2E35'}">Banda Demo</text>
<text x="200" y="304" text-anchor="middle" font-family="Onest, 'Segoe UI', Arial, sans-serif" font-size="22" font-weight="600" fill="${fondo ? '#99A1AC' : '#646C78'}">banda de ejemplo</text>
</svg>`;
}

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
for (const [salida, fondo, tipo] of [['public/logo_demo.jpg', true, 'jpeg'], ['public/logo_demo_sin_fondo.png', false, 'png']]) {
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg({ fondo })}</body></html>`);
  await page.screenshot({ path: salida, type: tipo, omitBackground: !fondo, ...(tipo === 'jpeg' ? { quality: 88 } : {}) });
  console.log('Generado', salida);
}
await browser.close();
