// Las tablas de planes del README y de AGENTS.md §2.3 se escriben a mano. Este test falla si
// precio, créditos IA o límites se desfasan de lo que de verdad aplica el código
// (`PLANS` en el cliente, `getPlanLimits` en el servidor).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PLANS } from '../planPermissions';
import { getPlanLimits } from '../../../server/utils/planLimits';

type PlanId = 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel';

const RAIZ = path.resolve(__dirname, '../../..');
const leer = (f: string) => fs.readFileSync(path.join(RAIZ, f), 'utf8');

// "2.500", "79 €", "∞" -> número (Infinity para ∞)
const num = (t: string): number => {
  const s = t.trim();
  if (s.includes('∞')) return Infinity;
  const m = s.replace(/\./g, '').match(/\d+/);
  if (!m) throw new Error(`No se pudo leer un número en "${t}"`);
  return Number(m[0]);
};
const celdas = (fila: string) => fila.split('|').slice(1, -1).map((c) => c.trim());

describe('README.md: tabla de planes', () => {
  const filas = leer('README.md')
    .split('\n')
    .filter((l) => /^\| (Promo|Ensayo|Local|De Gira|Cabeza de Cartel)/.test(l))
    .map(celdas);

  const aIds = (nombre: string): PlanId[] =>
    nombre === 'Promo / Promo+' ? ['promo', 'promo_plus'] :
    nombre === 'Ensayo' ? ['ensayo'] :
    nombre === 'Local' ? ['local'] :
    nombre === 'De Gira' ? ['de_gira'] : ['cabeza_de_cartel'];

  it('lista los 6 planes', () => {
    expect(filas.flatMap((f) => aIds(f[0])).sort()).toEqual(Object.keys(PLANS).sort());
  });

  it.each(filas.map((f) => [f[0], f] as const))('%s: precio y créditos coinciden con PLANS', (_n, f) => {
    for (const id of aIds(f[0])) {
      expect(num(f[1]), `precio de ${id}`).toBe(num(PLANS[id].price));
      expect(num(f[2]), `créditos de ${id}`).toBe(num(PLANS[id].credits));
    }
  });

  it('los límites citados en la columna descriptiva coinciden con getPlanLimits', () => {
    for (const f of filas) {
      const id = aIds(f[0])[0];
      const leads = f[3].match(/(\d+) leads/);
      if (leads) expect(Number(leads[1]), `leads de ${id}`).toBe(getPlanLimits(id).maxLeads);
      const bandas = f[3].match(/hasta (\d+) bandas/i);
      if (bandas) expect(Number(bandas[1]), `bandas de ${id}`).toBe(getPlanLimits(id).maxBands);
    }
  });
});

describe('AGENTS.md §2.3: tabla de límites', () => {
  // | Plan | Fans | Leads | Canciones | Contactos medios | Bandas | Créditos IA/mes |
  const filas = leer('AGENTS.md')
    .split('\n')
    .filter((l) => /^\s*\| `(promo|promo_plus|ensayo|local|de_gira|cabeza_de_cartel)` \|/.test(l))
    .map(celdas);

  it('lista los 6 planes', () => {
    expect(filas.map((f) => f[0].replace(/`/g, '')).sort()).toEqual(Object.keys(PLANS).sort());
  });

  it.each(filas.map((f) => [f[0], f] as const))('%s coincide con el código', (nombre, f) => {
    const id = nombre.replace(/`/g, '') as PlanId;
    const lim = getPlanLimits(id);
    expect(num(f[1]), 'fans').toBe(lim.maxFans);
    expect(num(f[2]), 'leads').toBe(lim.maxLeads);
    expect(num(f[3]), 'canciones').toBe(lim.maxSongs);
    expect(num(f[4]), 'contactos medios').toBe(lim.maxPressContacts);
    expect(num(f[5]), 'bandas').toBe(lim.maxBands);
    expect(num(f[6]), 'créditos IA').toBe(num(PLANS[id].credits));
  });
});
