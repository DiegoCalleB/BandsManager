/** CSS compartido de las páginas públicas de SEO (copia a mano de los tokens de Espectro: no pasan por Tailwind). */
export const ESTILOS_PAGINA_PUBLICA = `
:root{--bg:#F6F7F9;--surface:#FFFFFF;--sunken:#E8EBEF;--ink:#2A2E35;--ink-2:#5A626E;--acc:#2158DC;--on-acc:#FFFFFF;--acc-ink:#1D4ED8;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101216;--surface:#191C21;--sunken:#0B0D10;--ink:#E3E7EC;--ink-2:#A6AEB9;--acc:#60A5FA;--on-acc:#0A1F3D;--acc-ink:#60A5FA;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Onest Variable","Onest",system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
main{max-width:44rem;margin:0 auto;padding:1.25rem 1rem 3rem}
h1{font-size:30px;line-height:1.12;margin:.5rem 0 .75rem;font-weight:700;text-wrap:balance}
h2{font-size:20px;margin:0 0 .6rem;font-weight:650}
h3{font-size:15px;margin:1.1rem 0 .4rem;font-weight:650;color:var(--ink-2)}
p{margin:0 0 .9rem}
.intro{color:var(--ink-2);font-size:17px}
.tarjeta{background:var(--surface);border-radius:24px;padding:1.25rem;margin:1.25rem 0}
.acciones{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0 0}
.boton{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 1.4rem;border-radius:999px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;border:0;transition:transform 120ms cubic-bezier(.23,1,.32,1)}
.boton:active{transform:scale(.97)}
.principal{background:var(--acc);color:var(--on-acc)}
.suave{background:var(--sunken);color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-weight:650;color:var(--ink-2);padding:.4rem .5rem}
td{padding:.55rem .5rem;background:var(--bg)}
tr+tr td{box-shadow:0 2px 0 var(--surface)}
td:first-child{width:2.5rem;font-variant-numeric:tabular-nums;color:var(--ink-2)}
[contenteditable]{min-height:1.4em;border-radius:8px}
[contenteditable]:focus{outline:2px solid var(--acc)}
.campo{display:flex;gap:.6rem;align-items:baseline;padding:.45rem .6rem;border-radius:12px;background:var(--bg);margin:0 0 .4rem}
.campo b{font-weight:600;white-space:nowrap}
.campo span{flex:1;min-width:0;color:var(--ink-2)}
ul.lista{list-style:none;margin:0;padding:0}
ul.lista li{padding:.45rem .6rem;border-radius:12px;background:var(--bg);margin:0 0 .4rem}
details{background:var(--surface);border-radius:18px;padding:.9rem 1.1rem;margin:0 0 .5rem}
summary{font-weight:600;cursor:pointer}
details p{margin:.6rem 0 0;color:var(--ink-2)}
.cta{background:var(--acc);color:var(--on-acc);border-radius:24px;padding:1.5rem;margin:1.5rem 0}
.cta h2{margin-bottom:.4rem}.cta p{opacity:.92}
.cta .boton{background:var(--on-acc);color:var(--acc)}
.pie{margin-top:2rem;text-align:center;font-size:13px;color:var(--ink-2)}
.pie a{color:var(--acc-ink);font-weight:600;text-decoration:none}
:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media print{body{background:#fff;color:#000}.no-imprimir{display:none}.tarjeta{padding:0;margin:.5rem 0;background:#fff}td,.campo,ul.lista li{background:#fff}main{max-width:none;padding:0}}
@media (prefers-reduced-motion:reduce){.boton{transition:none}}

ol.pasos{margin:0 0 .9rem;padding-left:1.4rem}ol.pasos li{margin:0 0 .5rem}
ul.vinetas{margin:0 0 .9rem;padding-left:1.2rem}ul.vinetas li{margin:0 0 .35rem}
.migas{font-size:13px;color:var(--ink-2);margin:0 0 .5rem}.migas a{color:var(--ink-2)}
.rel{display:grid;gap:.5rem;margin:.5rem 0 0;padding:0;list-style:none}
.rel a{display:block;padding:.8rem 1rem;border-radius:18px;background:var(--surface);color:var(--ink);text-decoration:none;font-weight:600}
.rel small{display:block;font-weight:400;color:var(--ink-2)}
section.seccion{margin:1.5rem 0}

.barra{display:flex;justify-content:space-between;align-items:center;margin:0 0 1rem;font-size:14px}
.barra a{color:var(--ink);text-decoration:none;font-weight:650}
.barra .idioma{color:var(--ink-2);font-weight:500;padding:.35rem .8rem;border-radius:999px;background:var(--sunken)}
.lectura{font-size:13px;color:var(--ink-2);margin:-.25rem 0 .9rem}
`;
