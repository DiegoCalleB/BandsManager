import { describe, it, expect, vi, beforeEach } from 'vitest';

// Con la guardia REAL: ni una sola petición debe salir hacia destinos internos.
const lookupDns = vi.hoisted(() => vi.fn(async (_host: string) => [{ address: '10.0.0.5', family: 4 }]));
vi.mock('dns/promises', () => ({ default: { lookup: lookupDns } }));
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

const fetchGlobal = vi.fn(async () => {
  throw new Error('fetch global no debe usarse con URLs externas');
});
vi.stubGlobal('fetch', fetchGlobal);

import { scrapeWebsiteForContact } from '../auto_enrichment.js';

describe('scrapeWebsiteForContact: SSRF', () => {
  beforeEach(() => {
    fetchGlobal.mockClear();
    lookupDns.mockClear();
  });

  const maliciosas = [
    'http://localhost/admin',
    'http://127.0.0.1:3000/api/secret',
    'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
    'http://[::1]/',
    'http://[::ffff:7f00:1]/',
    'http://10.0.0.1/',
    'http://192.168.1.1/router',
    'http://metadata.internal/computeMetadata/v1/',
    'http://intranet.local/',
  ];

  for (const url of maliciosas) {
    it(`no hace la petición a ${url}`, async () => {
      expect(await scrapeWebsiteForContact(url)).toEqual({});
      expect(fetchGlobal).not.toHaveBeenCalled();
    });
  }

  it('bloquea un dominio público que resuelve a una IP privada (DNS rebinding / alias interno)', async () => {
    expect(await scrapeWebsiteForContact('https://sala-legitima.example.org/')).toEqual({});
    expect(lookupDns).toHaveBeenCalled();
    expect(fetchGlobal).not.toHaveBeenCalled();
  });

  it('rechaza esquemas que no son http/https', async () => {
    expect(await scrapeWebsiteForContact('file:///etc/passwd')).toEqual({});
    expect(await scrapeWebsiteForContact('ftp://10.0.0.1/')).toEqual({});
    expect(fetchGlobal).not.toHaveBeenCalled();
  });
});
