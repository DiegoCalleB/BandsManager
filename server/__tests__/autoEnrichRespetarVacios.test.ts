import { describe, it, expect, vi, beforeEach } from 'vitest';

const upsert = vi.fn(async (l: any, _b: string, _o?: any) => ({ ...l }));
vi.mock('../db.js', () => ({
  dbUpsertLead: (...a: any[]) => (upsert as any)(...a),
  dbUpsertBandContact: vi.fn(),
  dbDeleteLead: vi.fn()
}));
vi.mock('../state.js', () => ({
  loadState: () => ({ leads: [] }),
  saveState: () => {},
  getAutonomyConfigForBand: () => ({})
}));
vi.mock('../utils/bandDna.js', () => ({
  getBandDnaProfile: async () => ({}),
  buildEnhancedPitchSystemPrompt: () => '',
  generateSmartDnaPitchFallback: () => 'Pitch de prueba'
}));
vi.mock('../promptsManager.js', () => ({ formatGlobalPitchFeedbackForPrompt: () => '' }));
vi.mock('../services/venueIntelligenceService.js', () => ({ enrichVenueDetailsWithSerper: async () => null }));
vi.mock('../ai.js', () => ({ getAiClient: () => null, generateContentWithFallback: vi.fn() }));
vi.mock('../services/jinaReaderService.js', () => ({
  scrapeVenueWithJina: async () => ({
    success: true,
    email_contacto: 'info@sala-real.es',
    email_secundario: 'eventos@sala-real.es',
    telefono_movil: '699000111'
  })
}));

vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red en tests'); }));

import { autoEnrichLead } from '../auto_enrichment.js';

const ficha = () => ({
  id: 'lead-1',
  band_id: 'band-x',
  nombre_sala: 'Sala Real',
  ciudad: 'Madrid',
  website: 'https://sala-real.es',
  email_contacto: 'diego@test.es',
  email_secundario: '',
  telefono: '',
  telefono_movil: '',
  instagram: '@sala',
  aforo: 300,
  imagen_url: 'https://img/x.png',
  contacto_nombre: 'Ana',
  pitch_generado: 'Ya hay pitch'
});

describe('autoEnrichLead: respeta lo que el usuario ha vaciado a propósito', () => {
  beforeEach(() => upsert.mockClear());

  it('sin respetarVacios, rellena el email secundario desde la web (comportamiento de siempre)', async () => {
    const r = await autoEnrichLead(ficha(), 'band-x');
    expect(r.email_secundario).toBe('eventos@sala-real.es');
  });

  it('con respetarVacios, el email secundario vaciado NO reaparece', async () => {
    const r = await autoEnrichLead(ficha(), 'band-x', { respetarVacios: ['email_secundario'] });
    expect(r.email_secundario).toBe('');
    // lo demás sí se enriquece
    expect(r.telefono_movil).toBe('699000111');
    // y se guarda permitiendo vaciar, para que el '' llegue a la BD
    expect(upsert).toHaveBeenCalled();
    expect(upsert.mock.calls[0][2]).toEqual({ permitirVaciar: true });
  });
});
