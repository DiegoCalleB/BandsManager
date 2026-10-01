// Genera los retratos ilustrados de los miembros de la banda de demo y 3 escenas de escenario.
// Son ILUSTRACIONES (no fotos de personas reales). Para usar fotos reales, sustituye los ficheros
// de public/landing/demo/ por JPG con el mismo nombre base y cambia la extensión en e2e/fixtures/demoBand.ts.
import fs from 'node:fs';

const OUT = 'public/landing/demo';
fs.mkdirSync(OUT, { recursive: true });

const MIEMBROS = [
  { id: 'lucia', fondo: ['#7C3AED', '#DB2777'], piel: '#E8B796', pelo: '#2B1B17', camisa: '#F4F1EA', estilo: 'larga' },
  { id: 'marcos', fondo: ['#0EA5E9', '#2563EB'], piel: '#C98E6B', pelo: '#1A1A1A', camisa: '#1F2937', estilo: 'corto', barba: true },
  { id: 'nuria', fondo: ['#10B981', '#0F766E'], piel: '#F1C9A5', pelo: '#8B3A1E', camisa: '#FDE68A', estilo: 'rizos' },
  { id: 'dani', fondo: ['#F59E0B', '#DC2626'], piel: '#A8714F', pelo: '#111111', camisa: '#E5E7EB', estilo: 'gorro' },
  { id: 'oscar', fondo: ['#6366F1', '#0891B2'], piel: '#EFC2A0', pelo: '#4B3621', camisa: '#374151', estilo: 'gafas' },
];

function pelo(estilo, color) {
  switch (estilo) {
    case 'larga':
      return `<path d="M120 190 C110 90 175 60 200 60 C225 60 290 90 280 190 C285 250 270 300 262 330 L240 330 C250 280 252 230 250 190 L150 190 C148 230 150 280 160 330 L138 330 C130 300 115 250 120 190Z" fill="${color}"/>`;
    case 'corto':
      return `<path d="M132 170 C128 100 165 72 200 72 C238 72 272 100 268 170 C255 140 240 125 200 125 C160 125 145 140 132 170Z" fill="${color}"/>`;
    case 'rizos':
      return [[140, 120, 38], [178, 92, 40], [222, 92, 40], [262, 120, 38], [128, 168, 30], [272, 168, 30], [200, 80, 40]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('');
    case 'gorro':
      return `<path d="M130 160 C128 90 170 62 200 62 C232 62 272 90 270 160 L130 160Z" fill="${color}"/><rect x="124" y="148" width="152" height="22" rx="11" fill="#9CA3AF"/>`;
    default:
      return `<path d="M134 168 C132 100 168 78 200 78 C234 78 268 100 266 168 C250 138 236 128 200 128 C166 128 150 138 134 168Z" fill="${color}"/>`;
  }
}

function retrato(m) {
  const [c1, c2] = m.fondo;
  const gafas = m.estilo === 'gafas' ? '<g fill="none" stroke="#111827" stroke-width="5"><circle cx="170" cy="205" r="22"/><circle cx="230" cy="205" r="22"/><path d="M192 205 H208"/></g>' : '';
  const barba = m.barba ? `<path d="M148 230 C150 290 250 290 252 230 C240 262 160 262 148 230Z" fill="${m.pelo}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Retrato ilustrado de ${m.id}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="330" cy="70" r="46" fill="#fff" opacity=".12"/><circle cx="60" cy="340" r="70" fill="#fff" opacity=".1"/>
${m.estilo === 'larga' ? pelo('larga', m.pelo) : ''}
<path d="M70 400 C70 330 130 300 200 300 C270 300 330 330 330 400Z" fill="${m.camisa}"/>
<rect x="176" y="262" width="48" height="52" rx="18" fill="${m.piel}"/>
<ellipse cx="200" cy="205" rx="68" ry="82" fill="${m.piel}"/>
${m.estilo !== 'larga' ? pelo(m.estilo, m.pelo) : `<path d="M134 190 C134 120 170 100 200 100 C236 100 268 120 266 190 C250 150 236 138 200 138 C166 138 150 150 134 190Z" fill="${m.pelo}"/>`}
${barba}
<g fill="#1F2937"><ellipse cx="172" cy="208" rx="6" ry="7"/><ellipse cx="228" cy="208" rx="6" ry="7"/></g>
${gafas}
<path d="M178 245 Q200 262 222 245" fill="none" stroke="#7C2D12" stroke-width="5" stroke-linecap="round" opacity=".75"/>
</svg>`;
}

function escena(i) {
  const paletas = [['#1E1B4B', '#7C3AED', '#F472B6'], ['#0C4A6E', '#0EA5E9', '#FDE68A'], ['#3B0764', '#DB2777', '#FB923C']];
  const [a, b, c] = paletas[i];
  const siluetas = [250, 440, 620, 800, 980].map((x, k) => {
    const alto = 210 + (k % 2) * 30;
    return `<g fill="#0B0B12"><circle cx="${x}" cy="${430 - alto}" r="34"/><path d="M${x - 62} 560 C${x - 62} ${470 - alto + 120} ${x - 40} ${430 - alto + 50} ${x} ${430 - alto + 50} C${x + 40} ${430 - alto + 50} ${x + 62} ${470 - alto + 120} ${x + 62} 560Z"/></g>`;
  }).join('');
  const haces = [200, 500, 800, 1000].map((x, k) => `<path d="M${x} 0 L${x - 140 + k * 30} 560 L${x + 140 + k * 30} 560Z" fill="${k % 2 ? c : b}" opacity=".16"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="Escena ilustrada de concierto">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="1200" height="675" fill="url(#s)"/>${haces}
<ellipse cx="600" cy="600" rx="620" ry="70" fill="${c}" opacity=".35"/>
${siluetas}
<rect y="560" width="1200" height="115" fill="#0B0B12"/>
${Array.from({ length: 40 }, (_, k) => `<rect x="${20 + k * 30}" y="${620 - ((k * 37) % 55)}" width="12" height="${20 + ((k * 37) % 55)}" rx="6" fill="${c}" opacity=".5"/>`).join('')}
</svg>`;
}

for (const m of MIEMBROS) fs.writeFileSync(`${OUT}/miembro-${m.id}.svg`, retrato(m));
for (let i = 0; i < 3; i++) fs.writeFileSync(`${OUT}/escena-${i + 1}.svg`, escena(i));
console.log('Generados', MIEMBROS.length, 'retratos y 3 escenas en', OUT);
