import { describe, it, expect } from 'vitest';
import { estadosARedactar } from '../redactorAlcance';

describe('estadosARedactar', () => {
  it('por defecto solo redacta leads nuevos', () => {
    expect(estadosARedactar(undefined)).toEqual(['nuevo']);
    expect(estadosARedactar({})).toEqual(['nuevo']);
  });

  it.each([{ all: true }, { regenerate: true }, { id: 'lead-1' }, { lead_id: 'lead-1' }])(
    'con %o amplía a borradores pendientes pero nunca a leads en conversación',
    (params) => {
      const estados = estadosARedactar(params);
      expect(estados).toEqual(['nuevo', 'pendiente_aprobacion']);
      for (const enConversacion of ['contactado', 'esperando_respuesta', 'respondido', 'negociando', 'confirmado', 'aprobado_propuesta', 'aprobado_respuesta', 'borrador_creado']) {
        expect(estados).not.toContain(enConversacion);
      }
    }
  );
});
