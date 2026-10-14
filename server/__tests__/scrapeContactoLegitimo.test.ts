import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchSeguro = vi.hoisted(() => vi.fn());
vi.mock('../utils/ssrfGuard.js', () => ({ fetchUrlExternaSegura: fetchSeguro }));
vi.mock('../db.js', () => ({ dbUpsertLead: vi.fn(), dbUpsertBandContact: vi.fn(), dbDeleteLead: vi.fn() }));
vi.mock('../state.js', () => ({ loadState: () => ({ leads: [] }), saveState: () => {}, getAutonomyConfigForBand: () => ({}) }));
vi.mock('../utils/bandDna.js', () => ({
  getBandDnaProfile: async () => ({}),
  buildEnhancedPitchSystemPrompt: () => '',
  generateSmartDnaPitchFallback: () => ''
}));
vi.mock('../promptsManager.js', () => ({ formatGlobalPitchFeedbackForPrompt: () => '' }));
vi.mock('../services/venueIntelligenceService.js', () => ({ enrichVenueDetailsWithSerper: async () => null }));
vi.mock('../ai.js', () => ({ getAiClient: () => null, generateContentWithFallback: vi.fn() }));

import { scrapeWebsiteForContact } from '../auto_enrichment.js';

const respuesta = (html: string, statusCode = 200) => ({ statusCode, text: () => html });

describe('scrapeWebsiteForContact: entradas legítimas', () => {
  beforeEach(() => fetchSeguro.mockReset());

  it('extrae email, instagram y teléfono pasando por el guard SSRF con límites', async () => {
    fetchSeguro.mockResolvedValueOnce(
      respuesta('<a href="mailto:booking@sala-real.es">x</a><a href="https://www.instagram.com/salareal/">ig</a><a href="tel:+34 600 111 222">t</a>')
    );
    const r = await scrapeWebsiteForContact('https://sala-real.es');
    expect(r).toEqual({ email: 'booking@sala-real.es', instagram: '@salareal', phone: '+34 600 111 222' });
    const [url, opciones] = fetchSeguro.mock.calls[0];
    expect(url).toBe('https://sala-real.es');
    expect(opciones.timeoutMs).toBe(3500);
    expect(opciones.maxBytes).toBeGreaterThan(0);
    expect(opciones.maxRedirects).toBeLessThanOrEqual(3);
  });

  it('descarta emails de dominios de ejemplo pero no los que solo los contienen como texto', async () => {
    fetchSeguro.mockResolvedValueOnce(
      respuesta('contacto: user@example.com, you@sub.sentry.io, example.com@sala-real.es')
    );
    const r = await scrapeWebsiteForContact('https://sala-real.es');
    expect(r.email).toBe('example.com@sala-real.es');
  });

  it('prueba las subpáginas cuando la guardia rechaza o la respuesta es un error', async () => {
    fetchSeguro.mockRejectedValueOnce(new Error('SSRF_BLOCKED: IP privada o reservada'));
    fetchSeguro.mockResolvedValueOnce(respuesta('nope', 404));
    fetchSeguro.mockResolvedValueOnce(respuesta('<a href="mailto:hola@sala.es">'));
    const r = await scrapeWebsiteForContact('https://sala.es');
    expect(r.email).toBe('hola@sala.es');
    expect(fetchSeguro.mock.calls[2][0]).toBe('https://sala.es/contactos');
  });
});
