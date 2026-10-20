// Avisa a IndexNow (Bing, Yandex...) de todas las URLs del sitemap. Uso: INDEXNOW_KEY=... node scripts/indexnow.mjs [https://bandmanager.io]
// Requiere que `/<INDEXNOW_KEY>.txt` ya esté publicado (lo sirve el servidor cuando la variable está definida).
const base = (process.argv[2] ?? 'https://bandmanager.io').replace(/\/$/, '');
const key = process.env.INDEXNOW_KEY?.trim();
if (!key) throw new Error('Falta INDEXNOW_KEY');
const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(base).host, key, keyLocation: `${base}/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URLs, HTTP ${res.status}`);
