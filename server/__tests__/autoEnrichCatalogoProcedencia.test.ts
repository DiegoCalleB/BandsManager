import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SalaGuardada } from '../services/catalogoSalas.js';

const upsert = vi.fn(async (l: any, _b: string, _o?: any) => ({ ...l }));
vi.mock('../db.js', () => ({ dbUpsertLead: (...a: any[]) => (upsert as any)(...a), dbUpsertBandContact: vi.fn(), dbDeleteLead: vi.fn() }));
vi.mock('../state.js', () => ({ loadState: () => ({ leads: [] }), saveState: () => {}, getAutonomyConfigForBand: () => ({}) }));
vi.mock('../utils/bandDna.js', () => ({ getBandDnaProfile: async () => ({}), buildEnhancedPitchSystemPrompt: () => '', generateSmartDnaPitchFallback: () => 'Pitch de prueba' }));
vi.mock('../promptsManager.js', () => ({ formatGlobalPitchFeedbackForPrompt: () => '' }));
const serper = vi.hoisted(() => vi.fn(async (): Promise<any> => null));
vi.mock('../services/venueIntelligenceService.js', () => ({ enrichVenueDetailsWithSerper: serper }));
const dominioExiste = vi.hoisted(() => vi.fn(async (_email: string) => true));
vi.mock('../utils/emailValidator.js', () => ({ isValidEmailCached: dominioExiste, isValidEmailSyntax: () => true }));
vi.mock('../ai.js', () => ({ getAiClient: () => null, generateContentWithFallback: vi.fn() }));
vi.mock('../services/jinaReaderService.js', () => ({ scrapeVenueWithJina: async () => ({ success: false }) }));
vi.mock('../utils/ssrfGuard.js', async (importarOriginal) => ({
  ...(await importarOriginal<typeof import('../utils/ssrfGuard.js')>()),
  fetchUrlExternaSegura: async () => {
    throw new Error('sin red en tests');
  },
}));

const buscar = vi.hoisted(() => vi.fn());
vi.mock('../db/consultaCatalogoSupabase.js', () => ({ consultaCatalogo: { buscar } }));

import { autoEnrichLead } from '../auto_enrichment.js';

const sala = (o: Partial<SalaGuardada> = {}): SalaGuardada => ({
  id: 'sala-1',
  clave: 'nc:alfa|madrid',
  place_id: null,
  nombre: 'Alfa',
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: 'Calle Falsa 1, Madrid',
  tipo: 'sala',
  aforo: 300,
  genero: 'Rock',
  website: 'https://alfa.es/',
  instagram: 'alfasala',
  email_contacto: 'booking@alfa.es',
  telefono: '910000000',
  nivel: 'probable',
  puntuacion: 50,
  verificada_en: null,
  bandas_con_respuesta: 1,
  bandas_con_entrega: 1,
  rebotes: 0,
  no_contactar: false,
  ...o,
});

const hueco = () => ({ id: 'lead-1', band_id: 'band-x', nombre_sala: 'Alfa', ciudad: 'Madrid', tipo: 'sala', pitch_generado: 'Ya hay pitch', email_contacto: '', telefono: '', website: '', instagram: '', direccion: 'Calle', aforo: 0, genero: '', imagen_url: 'https://img/x.png' });

beforeEach(() => {
  upsert.mockClear();
  buscar.mockReset();
  serper.mockReset();
  dominioExiste.mockReset();
  dominioExiste.mockResolvedValue(true);
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red en tests'); }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.SERPER_API_KEY;
});

describe('autoEnrichLead: el catálogo compartido como primera etapa', () => {
  it('completa los huecos con lo que otras bandas encontraron y lo anota como procedente del catálogo', async () => {
    buscar.mockResolvedValue(sala());
    const r: any = await autoEnrichLead(hueco(), 'band-x');
    expect(r).toMatchObject({ email_contacto: 'booking@alfa.es', telefono: '910000000', website: 'https://alfa.es/', instagram: 'alfasala', aforo: 300, genero: 'Rock' });
    for (const campo of ['email_contacto', 'telefono', 'website', 'instagram', 'aforo', 'genero']) {
      expect(r.datos_fuentes[campo]).toMatchObject({ fuente: 'catalogo', confianza: 'media' });
    }
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('no pisa lo que la banda ya tiene ni lo anota como enriquecido', async () => {
    buscar.mockResolvedValue(sala());
    const r: any = await autoEnrichLead({ ...hueco(), email_contacto: 'mio@alfa.es', aforo: 120 }, 'band-x');
    expect(r.email_contacto).toBe('mio@alfa.es');
    expect(r.aforo).toBe(120);
    expect(r.datos_fuentes).not.toHaveProperty('email_contacto');
    expect(r.datos_fuentes).not.toHaveProperty('aforo');
  });

  it('si el catálogo falla, el enriquecimiento sigue sin él', async () => {
    buscar.mockRejectedValue(new Error('db caída'));
    const lead = { ...hueco(), instagram: '@ya', website: 'https://ya.es', email_contacto: 'a@ya.es', telefono: '1', aforo: 10, genero: 'x' };
    await expect(autoEnrichLead(lead, 'band-x')).resolves.toBeTruthy();
  });

  it('una sala «no contactar» no aporta nada', async () => {
    buscar.mockResolvedValue(sala({ no_contactar: true }));
    const r: any = await autoEnrichLead(hueco(), 'band-x');
    expect(r.email_contacto).toBe('');
  });
});

describe('autoEnrichLead: Google Maps', () => {
  it('guarda el place_id y anota la dirección y la web como procedentes de Google Maps', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'clave-de-prueba';
    buscar.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (new URL(String(url)).hostname === 'places.googleapis.com') {
        return new Response(JSON.stringify({ places: [{ id: 'ChIJabc123', formattedAddress: 'Calle Real 5, Madrid', nationalPhoneNumber: '910 000 111', websiteUri: 'https://alfa.example/' }] }), { status: 200 });
      }
      throw new Error('sin red en tests');
    }));
    const r: any = await autoEnrichLead({ ...hueco(), direccion: '' }, 'band-x');
    expect(r.place_id).toBe('ChIJabc123');
    expect(r.datos_fuentes.place_id).toMatchObject({ fuente: 'places', confianza: 'alta' });
    expect(r.datos_fuentes.direccion).toMatchObject({ fuente: 'places' });
    expect(r.datos_fuentes.website).toMatchObject({ fuente: 'places' });
  });

  it('un lead que ya tiene place_id no lo cambia', async () => {
    process.env.GOOGLE_PLACES_API_KEY = 'clave-de-prueba';
    buscar.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (new URL(String(url)).hostname === 'places.googleapis.com') return new Response(JSON.stringify({ places: [{ id: 'OTRO', formattedAddress: 'Calle Real 5, Madrid' }] }), { status: 200 });
      throw new Error('sin red en tests');
    }));
    const r: any = await autoEnrichLead({ ...hueco(), direccion: '', place_id: 'ChIJoriginal' }, 'band-x');
    expect(r.place_id).toBe('ChIJoriginal');
  });
});

describe('autoEnrichLead: los emails de un buscador se comprueban y, si dudan, llevan un aviso', () => {
  const conBuscador = (email: string) => {
    process.env.SERPER_API_KEY = 'clave-de-prueba';
    buscar.mockResolvedValue(null);
    serper.mockResolvedValue({ email });
  };

  it('guarda el email cuyo dominio no existe, con un aviso ligado a ese email', async () => {
    conBuscador('booking@dominio-inventado.xyz');
    dominioExiste.mockResolvedValue(false);
    const r: any = await autoEnrichLead(hueco(), 'band-x');
    expect(r.email_contacto).toBe('booking@dominio-inventado.xyz');
    expect(r.datos_fuentes.email_contacto.aviso).toEqual({ tipo: 'dominio_inexistente', para: 'booking@dominio-inventado.xyz' });
  });

  it('conserva el email si el dominio existe y lo anota como del buscador', async () => {
    conBuscador('booking@alfa.es');
    const r: any = await autoEnrichLead(hueco(), 'band-x');
    expect(r.email_contacto).toBe('booking@alfa.es');
    expect(r.datos_fuentes.email_contacto).toMatchObject({ fuente: 'buscador', confianza: 'media' });
    expect(r.datos_fuentes.email_contacto.aviso).toBeUndefined();
  });

  it('el email del catálogo no se cuestiona', async () => {
    buscar.mockResolvedValue(sala());
    dominioExiste.mockResolvedValue(false);
    const r: any = await autoEnrichLead(hueco(), 'band-x');
    expect(r.email_contacto).toBe('booking@alfa.es');
    expect(dominioExiste).not.toHaveBeenCalled();
  });
});
