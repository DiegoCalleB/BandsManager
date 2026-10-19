/** CSS compartido de las páginas públicas de SEO (copia a mano de los tokens de Espectro: no pasan por Tailwind). */
export const ESTILOS_PAGINA_PUBLICA = `
:root{--bg:#F6F7F9;--surface:#FFFFFF;--sunken:#E8EBEF;--ink:#2A2E35;--ink-2:#5A626E;--acc:#2158DC;--on-acc:#FFFFFF;--acc-ink:#1D4ED8;--ok:#17998C;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#101216;--surface:#191C21;--sunken:#0B0D10;--ink:#E3E7EC;--ink-2:#A6AEB9;--acc:#60A5FA;--on-acc:#0A1F3D;--acc-ink:#60A5FA;--ok:#4FC7B8;color-scheme:dark}}
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

.barra{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin:0 -1rem 1rem;padding:.6rem 1rem;background:var(--bg);font-size:14px}.barra .der{display:flex;align-items:center;gap:.5rem}
.barra a{color:var(--ink);text-decoration:none;font-weight:650}
.barra .idioma{color:var(--ink-2);font-weight:500;padding:.35rem .8rem;border-radius:999px;background:var(--sunken)}
.aviso-idioma{display:flex;justify-content:space-between;align-items:center;gap:.75rem;margin:0 0 1rem;padding:.65rem .9rem;border-radius:18px;background:var(--surface);font-size:14px;color:var(--ink)}.aviso-idioma[hidden]{display:none}.aviso-idioma a{color:var(--acc-ink,var(--acc));font-weight:650}.aviso-idioma button{flex:none;border:0;background:transparent;color:var(--ink-2);font-size:20px;line-height:1;padding:.1rem .4rem;cursor:pointer}
.lectura{font-size:13px;color:var(--ink-2);margin:-.25rem 0 .9rem}

.resumen{background:var(--surface);border-radius:24px;padding:1.1rem 1.25rem;margin:0 0 1.25rem}
.resumen h2{font-size:15px;margin:0 0 .5rem;color:var(--acc-ink)}
.resumen ul{margin:0;padding-left:1.1rem}.resumen li{margin:0 0 .35rem}
.toc{margin:0 0 1.25rem;font-size:15px}.toc p{margin:0 0 .35rem;font-weight:650;color:var(--ink-2)}
.toc ol{margin:0;padding-left:1.2rem}.toc a{color:var(--acc-ink);text-decoration:none}.toc a:hover{text-decoration:underline}
h2[id]{scroll-margin-top:1rem}

.boton-s{display:inline-flex;align-items:center;min-height:40px;padding:0 1rem;border-radius:999px;background:var(--acc);color:var(--on-acc)!important;font-weight:650;font-size:14px;white-space:nowrap}
.etiquetas{display:flex;flex-wrap:wrap;gap:.4rem;margin:.25rem 0 .75rem;padding:0;list-style:none}
.etiquetas li{padding:.2rem .7rem;border-radius:999px;background:var(--sunken);color:var(--ink-2);font-size:13px}
.hero{display:block;width:100%;height:auto;margin:0 0 1.25rem;border-radius:24px;background:var(--surface)}
figure.fig{margin:1rem 0 1.25rem;padding:1rem;border-radius:24px;background:var(--surface)}
figure.fig svg{display:block;width:100%;height:auto}
figure.fig figcaption{margin-top:.6rem;font-size:13px;color:var(--ink-2)}
.scroll{overflow-x:auto;margin:.5rem 0 1rem;border-radius:18px;background:var(--surface)}
table.tabla{width:100%;border-collapse:collapse;font-size:14px;min-width:20rem}
table.tabla caption{text-align:left;font-weight:650;padding:.7rem .9rem .2rem}
table.tabla th{text-align:left;color:var(--ink-2);font-weight:650;padding:.5rem .9rem}
table.tabla td{padding:.55rem .9rem;vertical-align:top;font-variant-numeric:tabular-nums}
table.tabla tbody tr:nth-child(even) td{background:var(--bg)}
.aviso{margin:1rem 0;padding:1rem 1.1rem;border-radius:18px;background:var(--surface);color:var(--ink);font-weight:550}
.aviso::before{content:'';display:inline-block;width:.6rem;height:.6rem;margin-right:.5rem;border-radius:999px;background:var(--acc)}

.calc{background:var(--surface);border-radius:24px;padding:1.1rem 1.1rem 1.25rem;margin:1rem 0 1.25rem}
.calc h3{margin:0 0 .75rem;font-size:17px;color:var(--ink)}
.calc .campos{display:grid;gap:.7rem;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))}
.calc label{display:grid;gap:.3rem;font-size:14px;color:var(--ink-2)}
.calc input,.calc select{width:100%;min-height:44px;padding:0 .8rem;border:0;border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;font-size:16px;font-variant-numeric:tabular-nums}
.calc .res{display:grid;gap:.5rem;margin-top:1rem;padding:1rem;border-radius:18px;background:var(--bg)}
.calc .res p{margin:0;color:var(--ink-2)}
.calc .res strong{color:var(--ink);font-size:1.25rem;font-variant-numeric:tabular-nums}
.calc .grande strong{color:var(--acc-ink);font-size:1.6rem}
.calc small{display:block;margin-top:.6rem;color:var(--ink-2);font-size:13px}
.calc .campos:has(.casilla){grid-template-columns:1fr}
.calc label.casilla{display:flex;align-items:center;gap:.7rem;padding:.55rem .7rem;border-radius:12px;background:var(--bg);color:var(--ink);font-size:15px;cursor:pointer}
.calc label.casilla input{width:22px;min-height:22px;height:22px;flex:none;accent-color:var(--acc)}
`;
