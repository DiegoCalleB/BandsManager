// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { computeAgentFunnel, type FunnelBandInput } from '../agentFunnel';

describe('computeAgentFunnel', () => {
  it('cuenta cada etapa de forma independiente y acumulativa por banda', () => {
    const bandas: FunnelBandInput[] = [
      // Banda A: conectó email, el Scout no ha traído nada todavía.
      { bandId: 'a', emailConectado: true, leadsEstados: [] },
      // Banda B: tiene leads pero se han quedado en 'nuevo' (el Redactor no ha generado pitch).
      { bandId: 'b', emailConectado: true, leadsEstados: ['nuevo', 'nuevo'] },
      // Banda C: el Redactor generó un pitch, pero nadie lo ha aprobado todavía.
      { bandId: 'c', emailConectado: false, leadsEstados: ['pendiente_aprobacion'] },
      // Banda D: aprobó un pitch y quedó como borrador a la espera de enviarlo a mano.
      { bandId: 'd', emailConectado: true, leadsEstados: ['borrador_creado'] },
      // Banda E: el Enviador despachó de verdad, pero la sala no ha contestado.
      { bandId: 'e', emailConectado: true, leadsEstados: ['contactado'] },
      // Banda F: la sala respondió y están negociando.
      { bandId: 'f', emailConectado: true, leadsEstados: ['negociando'] },
      // Banda G: concierto cerrado.
      { bandId: 'g', emailConectado: true, leadsEstados: ['confirmado'] }
    ];

    const r = computeAgentFunnel(bandas);

    expect(r.totalBandas).toBe(7);
    expect(r.bandasConEmailConectado).toBe(6);
    expect(r.bandasConAlMenosUnLead).toBe(6); // todas menos 'a'
    expect(r.bandasConPitchGenerado).toBe(5); // c, d, e, f, g
    expect(r.bandasConAprobacionHumana).toBe(4); // d, e, f, g (pendiente_aprobacion de 'c' no cuenta)
    expect(r.bandasConEnvioReal).toBe(3); // e, f, g (borrador_creado de 'd' no cuenta como enviado)
    expect(r.bandasConRespuestaDeSala).toBe(2); // f, g
    expect(r.bandasConConciertoConfirmado).toBe(1); // g
  });

  it('una banda con varios leads en distintas etapas cuenta solo una vez por etapa alcanzada', () => {
    const bandas: FunnelBandInput[] = [
      { bandId: 'h', emailConectado: true, leadsEstados: ['nuevo', 'pendiente_aprobacion', 'confirmado', 'no_interesado'] }
    ];
    const r = computeAgentFunnel(bandas);
    expect(r.bandasConPitchGenerado).toBe(1);
    expect(r.bandasConConciertoConfirmado).toBe(1);
  });

  it('con cero bandas, todos los contadores son cero sin lanzar error', () => {
    const r = computeAgentFunnel([]);
    expect(r.totalBandas).toBe(0);
    expect(r.bandasConConciertoConfirmado).toBe(0);
  });

  it('aplazado/no_interesado no cuentan como pitch aprobado ni como respuesta de sala', () => {
    const bandas: FunnelBandInput[] = [
      { bandId: 'i', emailConectado: true, leadsEstados: ['aplazado'] },
      { bandId: 'j', emailConectado: true, leadsEstados: ['no_interesado'] }
    ];
    const r = computeAgentFunnel(bandas);
    expect(r.bandasConAprobacionHumana).toBe(0);
    expect(r.bandasConRespuestaDeSala).toBe(0);
    expect(r.bandasConAlMenosUnLead).toBe(2);
  });
});
