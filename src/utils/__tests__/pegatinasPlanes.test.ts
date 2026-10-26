// Las cantidades del regalo de pegatinas se prometen en tres sitios (definición de planes, tarjetas del
// asistente de crear banda y pantalla Planes) y las concede el servidor. Que no se separen.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLANS } from '../planPermissions';
import { PEGATINAS_POR_PLAN } from '../../../server/utils/pegatinas';

const numero = (texto: string) => Number(/(\d[\d.]*)/.exec(texto)?.[1].replace('.', ''));
const leer = (ruta: string) => readFileSync(new URL(`../../${ruta}`, import.meta.url), 'utf-8');

describe('regalo de pegatinas: una sola cifra por plan', () => {
  it('la definición de planes coincide con el servidor y Local no regala', () => {
    expect(PLANS.local.stickerGift).toBeUndefined();
    for (const plan of ['de_gira', 'cabeza_de_cartel'] as const) {
      expect(numero(PLANS[plan].stickerGift!.qty)).toBe(PEGATINAS_POR_PLAN[plan].cantidad);
      expect(PLANS[plan].features.join(' ')).toContain(`${PEGATINAS_POR_PLAN[plan].cantidad} pegatinas`);
    }
    expect(PLANS.local.features.join(' ')).not.toMatch(/pegatinas/i);
  });

  it('las tarjetas del asistente de crear banda y la pantalla Planes dicen lo mismo', () => {
    expect(leer('components/band_switcher/PlanCardLocal.tsx')).not.toMatch(/pegatinas/i);
    expect(leer('components/band_switcher/PlanCardDeGira.tsx')).toContain(`${PEGATINAS_POR_PLAN.de_gira.cantidad} pegatinas`);
    expect(leer('components/band_switcher/PlanCardCabezaDeCartel.tsx')).toContain(`${PEGATINAS_POR_PLAN.cabeza_de_cartel.cantidad} pegatinas`);
    const planes = leer('components/Planes.tsx');
    expect(planes).toContain(`"${PEGATINAS_POR_PLAN.de_gira.cantidad} pegatinas de tu banda gratis"`);
    expect(planes).toContain(`"${PEGATINAS_POR_PLAN.cabeza_de_cartel.cantidad} pegatinas + entrega prioritaria"`);
  });

  it('todo lo que promete pegatinas dice que es con el plan anual', () => {
    for (const plan of ['de_gira', 'cabeza_de_cartel'] as const) {
      expect(PLANS[plan].stickerGift!.description).toMatch(/anual/);
      expect(PLANS[plan].features.join(' ')).toMatch(/plan anual/);
    }
    expect(leer('components/band_switcher/PlanCardDeGira.tsx')).toMatch(/pegatinas gratis con el plan anual/);
    expect(leer('components/band_switcher/PlanCardCabezaDeCartel.tsx')).toMatch(/Express con el plan anual/);
    expect(leer('components/Planes.tsx')).toMatch(/gratis con tu suscripción anual/);
  });
});

describe('créditos de IA: la pantalla Planes dice lo que da el servidor', () => {
  it('cada plan enseña los mismos créditos que su definición (PLANS)', () => {
    const planes = leer('components/Planes.tsx');
    for (const plan of ['ensayo', 'local', 'de_gira', 'cabeza_de_cartel'] as const) {
      const n = PLANS[plan].credits.match(/[\d.]+/)![0];
      expect(planes, `créditos de ${plan}`).toContain(`${n} créditos IA / mes`);
    }
  });
});
