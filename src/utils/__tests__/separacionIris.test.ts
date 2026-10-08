import { describe, expect, it } from 'vitest';
import type { AudioTrack, SongAudioIdea } from '../../types';
import {
  ideaParaSeparar,
  autorDeSeparacion,
  avanzarProgreso,
  describirErrorSeparacion,
  esErrorDeRed,
  esperaMaximaMs,
  fusionarPistasServidor,
  ideasConSeparacion,
  cancionConSeparacion,
  motorFinal,
  nombreMotor,
  pistasSinMaestra,
  textoFaseEspera,
  type ProgresoIris,
} from '../separacionIris';

const idea = (o: Partial<SongAudioIdea> = {}): SongAudioIdea =>
  ({ id: 'i1', titulo: 'Demo', audioUrl: 'https://x/demo.mp3', ...o }) as SongAudioIdea;
const pista = (o: Partial<AudioTrack>): AudioTrack => ({ id: 'p', nombre: 'n', audioUrl: 'u', ...o }) as AudioTrack;

describe('motores', () => {
  it('nombre comercial y espera máxima', () => {
    expect(nombreMotor('fal')).toBe('Iris Ultra');
    expect(nombreMotor('mvsep-mdx23')).toBe('Iris Studio');
    expect(nombreMotor('demucs')).toBe('Iris Cloud');
    expect(nombreMotor('dsp-server')).toBe('Iris Básico');
    expect(esperaMaximaMs('fal')).toBe(240_000);
    expect(esperaMaximaMs('demucs')).toBe(1_200_000);
  });

  it('textoFaseEspera cambia por tramos', () => {
    expect(textoFaseEspera('fal', 3)).toContain('Conectando');
    expect(textoFaseEspera('fal', 30)).toContain('aislando');
    expect(textoFaseEspera('fal', 90)).toContain('alta fidelidad');
    expect(textoFaseEspera('demucs', 5)).toContain('Subiendo');
    expect(textoFaseEspera('demucs', 20)).toContain('Reservando GPU');
    expect(textoFaseEspera('mvsep-mdx23', 60)).toContain('6 pasadas');
    expect(textoFaseEspera('demucs', 60)).toContain('1-2 min');
    expect(textoFaseEspera('dsp-server', 7)).toContain('7s');
  });
});

describe('avanzarProgreso', () => {
  const base: ProgresoIris = { isOpen: true, songTitle: 's', ideaTitle: 'i', stage: 'preparing', progressPct: 15, currentStepText: '' };

  it('preparing sube de 3 en 3 con tope 30', () => {
    expect(avanzarProgreso(base, 0)!.progressPct).toBe(18);
    expect(avanzarProgreso({ ...base, progressPct: 29 }, 0)!.progressPct).toBe(30);
  });

  it('demucs sale del reloj, no del acumulado (no retrocede)', () => {
    const d: ProgresoIris = { ...base, stage: 'demucs', engineChoice: 'fal', demucsStartedAt: 1000 };
    expect(avanzarProgreso(d, 3000)!.progressPct).toBe(47);
    expect(avanzarProgreso(d, 1_000_000)!.progressPct).toBe(94);
    expect(avanzarProgreso({ ...d, engineChoice: 'dsp-server' }, 1_000_000)!.progressPct).toBe(92);
    expect(avanzarProgreso({ ...d, engineChoice: 'demucs' }, 1_000_000)!.progressPct).toBe(90);
  });

  it('persisting con tope 96; completed/error/null no se tocan', () => {
    expect(avanzarProgreso({ ...base, stage: 'persisting', progressPct: 96 }, 0)!.progressPct).toBe(96);
    const fin = { ...base, stage: 'completed' as const };
    expect(avanzarProgreso(fin, 0)).toBe(fin);
    expect(avanzarProgreso(null, 0)).toBeNull();
  });
});

describe('pistasSinMaestra', () => {
  it('descarta la maestra y las pistas sin instrumento', () => {
    const i = idea();
    const r = pistasSinMaestra(
      [
        pista({ id: 'i1-track-1', nombre: 'Demo' }),
        pista({ id: 'a', nombre: 'Pista Principal', instrumento: 'Voz' }),
        pista({ id: 'b', nombre: 'Voz', audioUrl: 'https://x/voz.mp3', instrumento: 'Voz' }),
        pista({ id: 'c', nombre: 'Sin', audioUrl: 'https://x/s.mp3' }),
      ],
      i
    );
    expect(r.map((t) => t.id)).toEqual(['b']);
  });
});

describe('autor y motor final', () => {
  it('autorDeSeparacion', () => {
    expect(autorDeSeparacion({ degraded: true }, 'fal')).toBe('Iris Básico (Modo Degradado)');
    expect(autorDeSeparacion({}, 'fal')).toBe('Iris Ultra (Fal.ai GPU A100)');
    expect(autorDeSeparacion({ separationEngine: 'MVSEP' }, 'demucs')).toBe('Iris Studio');
    expect(autorDeSeparacion({ isNeural: true }, 'demucs')).toBe('Iris Cloud');
    expect(autorDeSeparacion({}, 'dsp-server')).toBe('Iris Básico (gratis)');
  });
  it('motorFinal', () => {
    expect(motorFinal({ degraded: true }, 'fal')).toBe('Iris Básico (modo degradado)');
    expect(motorFinal({}, 'mvsep-mdx23')).toBe('Iris Studio');
  });
});

describe('fusionarPistasServidor', () => {
  const comunes = { autor: 'Iris', fecha: '2026-01-01', nuevoId: (i: string) => `id-${i}` };

  it('añade pistas nuevas; lo no pedido queda silenciado, no descartado', () => {
    const { pistas, anadidas } = fusionarPistasServidor({
      ...comunes,
      existentes: [],
      pedidas: ['Voz'],
      stems: [
        { audioUrl: 'v.mp3', instrument: 'Voz', trackName: 'Voz' },
        { audioUrl: 'b.wav', instrument: 'Bajo', trackName: 'Bajo', recommendedVolume: 0.7 },
        { instrument: 'Batería' },
      ],
    });
    expect(anadidas).toBe(2);
    expect(pistas.map((p) => [p.id, p.muted, p.formato, p.volumen])).toEqual([
      ['id-voz', false, 'MP3', 1],
      ['id-bajo', true, 'WAV', 0.7],
    ]);
  });

  it('sustituye en su sitio la pista del mismo instrumento (también sin tildes)', () => {
    const { pistas, anadidas } = fusionarPistasServidor({
      ...comunes,
      existentes: [pista({ id: 'viejo', nombre: 'Bateria vieja', instrumento: 'Batería', volumen: 0.4 })],
      stems: [{ audioUrl: 'd.mp3', instrument: 'Batería', trackName: 'Batería HQ' }],
    });
    expect(anadidas).toBe(1);
    expect(pistas).toHaveLength(1);
    expect(pistas[0]).toMatchObject({ id: 'viejo', nombre: 'Batería HQ', audioUrl: 'd.mp3', volumen: 0.4, muted: false });
  });

  it('«Instrumental» pedida mantiene todo lo que no es voz', () => {
    const { pistas } = fusionarPistasServidor({
      ...comunes,
      existentes: [],
      pedidas: ['Instrumental'],
      stems: [
        { audioUrl: 'v.mp3', instrument: 'Voz' },
        { audioUrl: 'g.mp3', instrument: 'Guitarras' },
      ],
    });
    expect(pistas.map((p) => p.muted)).toEqual([true, false]);
  });

  it('sin selección no silencia nada', () => {
    const { pistas } = fusionarPistasServidor({ ...comunes, existentes: [], stems: [{ audioUrl: 'v.mp3', instrument: 'Voz' }] });
    expect(pistas[0].muted).toBe(false);
  });
});

describe('ideasConSeparacion', () => {
  const meta = { motor: 'Iris Ultra', neural: true, degradado: false, procesadoEn: 'ahora' };
  it('actualiza por id y anota el motor', () => {
    const i = idea();
    const r = ideasConSeparacion([idea({ id: 'otra', titulo: 'Otra', audioUrl: 'o' }), i], i, [pista({ id: 'x' })], meta);
    expect(r.ideas).toHaveLength(2);
    expect(r.ideas[1]).toMatchObject({ id: 'i1', stemEngineUsed: 'Iris Ultra', stemIsNeural: true, stemDegraded: false });
    expect(r.ideas[1].pistas).toHaveLength(1);
  });
  it('encuentra por audioUrl o título y, si no existe, añade', () => {
    const i = idea({ id: 'nuevo-id' });
    expect(ideasConSeparacion([idea({ id: 'viejo' })], i, [], meta).ideas).toHaveLength(1);
    expect(ideasConSeparacion([idea({ id: 'viejo', audioUrl: 'z', titulo: 'z' })], i, [], meta).ideas).toHaveLength(2);
    expect(ideasConSeparacion(undefined, i, [], meta).ideas).toHaveLength(1);
  });
});

describe('errores', () => {
  it('esErrorDeRed', () => {
    expect(esErrorDeRed(new Error('Failed to fetch'))).toBe(true);
    expect(esErrorDeRed(new Error('NetworkError when'))).toBe(true);
    expect(esErrorDeRed(new Error('otra'))).toBe(false);
    expect(esErrorDeRed(null)).toBe(false);
  });

  it('red', () => {
    const e = describirErrorSeparacion(new Error('Failed to fetch'), 'fal');
    expect(e).toMatchObject({ errorProvider: 'network', errorType: 'network_error' });
    expect(e.errorMessage).toContain('Failed to fetch');
  });

  it('Fal: saldo, clave, límite y genérico', () => {
    expect(describirErrorSeparacion({ message: 'locked: TOP_UP', status: 403 }, 'fal').errorType).toBe('fal_billing_locked');
    expect(describirErrorSeparacion({ message: 'unauthorized' }, 'fal').errorType).toBe('fal_auth_invalid');
    expect(describirErrorSeparacion({ message: 'rate exceeded' }, 'fal').errorType).toBe('fal_rate_limit');
    expect(describirErrorSeparacion({ message: 'boom' }, 'fal').errorType).toBe('fal_generic');
  });

  it('por estado HTTP en el resto de motores', () => {
    const t = (status: number) => describirErrorSeparacion({ message: 'x', status }, 'demucs').errorType;
    expect(t(401)).toBe('auth_invalid');
    expect(t(402)).toBe('billing_required');
    expect(t(422)).toBe('audio_unsupported');
    expect(t(429)).toBe('rate_limit');
    expect(t(504)).toBe('timeout');
    expect(t(502)).toBe('server_error');
    expect(t(400)).toBe('generic');
  });

  it('proveedor: dsp local sin pistas → system; ffmpeg y supabase por mensaje', () => {
    expect(describirErrorSeparacion({ message: 'x' }, 'dsp-server').errorProvider).toBe('system');
    expect(describirErrorSeparacion({ message: 'ffmpeg exploded: codec' }, 'dsp-server')).toMatchObject({
      errorProvider: 'ffmpeg',
      errorType: 'ffmpeg_codec_unsupported',
    });
    expect(describirErrorSeparacion({ message: 'supabase credentials' }, 'dsp-server').errorType).toBe('supabase_credentials_missing');
  });

  it('el servidor manda: data.* gana, y el detalle solo sale si aporta', () => {
    const e = describirErrorSeparacion(
      { data: { provider: 'gemini', errorType: 'gemini_quota_exceeded', message: 'm', actionAdvice: 'a', details: { x: 1 } } },
      'fal'
    );
    expect(e).toMatchObject({ errorProvider: 'gemini', errorType: 'gemini_quota_exceeded', errorMessage: 'm', actionAdvice: 'a' });
    expect(e.errorTitle).toBe('Cuota de Gemini API Excedida (HTTP 429)');
    expect(e.errorDetail).toBe(JSON.stringify({ x: 1 }, null, 2));
    expect(describirErrorSeparacion({ data: { message: 'm', details: 'm' } }, 'demucs').errorDetail).toBeUndefined();
  });

  it('consejo y título genéricos para tipos desconocidos', () => {
    const e = describirErrorSeparacion({ data: { errorType: 'rara', message: 'm' } }, 'demucs');
    expect(e.errorTitle).toBe('Inconveniente en la Separación de Pistas');
    expect(e.actionAdvice).toContain('Motor DSP local');
  });
});

describe('ideaParaSeparar', () => {
  const idea = (id: string, audioUrl: string) => ({ id, titulo: id, audioUrl, subidoPor: 'x', seccion: 'general', fecha: '2026-01-01' }) as any;
  it('prefiere la idea cuyo audio es el activo', () => {
    const song = { id: 's', titulo: 'T', audioIdeas: [idea('a', 'u1'), idea('b', 'u2')] } as any;
    expect(ideaParaSeparar(song, 'u2')?.id).toBe('b');
  });
  it('si ninguna coincide usa la primera con audio', () => {
    const song = { id: 's', titulo: 'T', audioIdeas: [idea('a', ''), idea('b', 'u2')] } as any;
    expect(ideaParaSeparar(song, 'otro')?.id).toBe('b');
  });
  it('sin ideas crea la maqueta principal desde el audio activo', () => {
    const r = ideaParaSeparar({ id: 's', titulo: 'T' } as any, 'u9');
    expect(r?.id).toBe('idea-main-s');
    expect(r?.audioUrl).toBe('u9');
  });
  it('sin nada devuelve null', () => {
    expect(ideaParaSeparar({ id: 's', titulo: 'T' } as any, '')).toBeNull();
  });
});

describe('cancionConSeparacion', () => {
  const meta = { motor: 'Iris Studio', neural: true, degradado: false, procesadoEn: '2026-10-08T00:00:00Z' };
  it('escribe las ideas y, a la vez, song.pistas con los stems de Iris', () => {
    const i = idea();
    const { ideas } = ideasConSeparacion([], i, [pista({ id: 'a' }), pista({ id: 'b' })], meta);
    const s = cancionConSeparacion({ id: 's1', titulo: 'T' } as never, ideas) as { audioIdeas: SongAudioIdea[]; pistas: AudioTrack[] };
    expect(s.audioIdeas).toBe(ideas);
    expect(s.pistas.map((p) => p.id)).toEqual(['a', 'b']);
  });
  it('conserva el resto de campos de la canción', () => {
    const s = cancionConSeparacion({ id: 's1', bpm: 120 } as never, []) as { bpm: number; pistas: AudioTrack[] };
    expect(s.bpm).toBe(120);
    expect(s.pistas).toEqual([]);
  });
});
