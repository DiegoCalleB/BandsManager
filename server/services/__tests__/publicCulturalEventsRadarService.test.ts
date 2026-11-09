import { describe, it, expect, vi } from 'vitest';

const ia = vi.hoisted(() => ({ texto: '' }));
vi.mock('../../ai.js', () => ({ getAiClient: () => ({}), generateContentWithFallback: async () => ({ text: ia.texto }) }));
vi.mock('../openDataCulturalService.js', () => ({ fetchMadridOpenDataCulturalEvents: async () => [] }));

import { searchPublicCulturalOpportunities } from '../publicCulturalEventsRadarService';

/**
 * El radar le pide a la IA, SIN buscar en internet, que «identifique» ayuntamientos con su email y su teléfono: sin fuente,
 * lo que devuelve es lo que suena bien (`cultura@ayuntamiento.es`). Esos datos no se aceptan, y las entidades que
 * sugiere una IA sin fuente no son de fiabilidad alta.
 */
describe('radar de contratación pública con IA', () => {
  it('no acepta el email ni el teléfono que se inventa la IA', async () => {
    ia.texto = JSON.stringify({
      leads_publicos: [
        { entidad_publica: 'Ayuntamiento de Ejemplo - Cultura', ciudad: 'Ejemplo', email_contacto: 'cultura@ayuntamiento-ejemplo.es', telefono_oficial: '+34 949 000 000', fiabilidad: 'alta' },
      ],
    });
    const r = await searchPublicCulturalOpportunities({ provinciaOrRegion: 'Guadalajara', bandName: 'Banda Uno', limit: 3 });
    expect(r.leads_publicos).toHaveLength(1);
    expect(r.leads_publicos[0].email_contacto).toBe('');
    expect(r.leads_publicos[0].telefono_oficial).toBe('');
  });

  it('una entidad sugerida por la IA no consta como de fiabilidad alta aunque ella lo diga', async () => {
    ia.texto = JSON.stringify({ leads_publicos: [{ entidad_publica: 'Ayuntamiento de Ejemplo', fiabilidad: 'alta' }] });
    const r = await searchPublicCulturalOpportunities({ provinciaOrRegion: 'Guadalajara', limit: 3 });
    expect(r.leads_publicos[0].fiabilidad).toBe('media');
  });
});
