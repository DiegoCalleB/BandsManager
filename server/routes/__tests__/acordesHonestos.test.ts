import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { hashDeUrl } from '../concert_to_album';

const repertorio = fs.readFileSync(path.join(__dirname, '..', 'repertorio.ts'), 'utf-8');
const aiTs = fs.readFileSync(path.join(__dirname, '..', '..', 'ai.ts'), 'utf-8');

describe('Caché de audio por URL', () => {
  it('dos ficheros distintos del mismo host no comparten nombre de caché', () => {
    const base = 'https://abcdefgh.supabase.co/storage/v1/object/public/audio/';
    // Con el hash anterior (16 primeros caracteres del base64) esto daba el mismo valor y la
    // segunda canción recibía el audio de la primera.
    expect(hashDeUrl(base + 'uno.mp3')).not.toBe(hashDeUrl(base + 'dos.mp3'));
  });

  it('es estable para la misma URL', () => {
    expect(hashDeUrl('https://x.test/a.mp3')).toBe(hashDeUrl('https://x.test/a.mp3'));
  });
});

describe('/generate-song-chords no inventa ni pisa datos', () => {
  it('no contiene la plantilla de relleno con letra inventada', () => {
    expect(repertorio).not.toContain('Arrancamos la noche en la');
  });

  it('responde error cuando la IA no da un resultado, sin llegar a persistir', () => {
    const idxError = repertorio.indexOf('chordsSource: "sin_resultado"');
    const idxPersistir = repertorio.indexOf('dbUpsertSong(', repertorio.indexOf('"/generate-song-chords"'));
    expect(idxError).toBeGreaterThan(-1);
    expect(idxError).toBeLessThan(idxPersistir);
  });

  it('con audio usa el timeout largo y recorta la duración', () => {
    expect(repertorio).toContain('TIMEOUT_IA_LARGO_MS');
    expect(repertorio).toContain('maxSeconds: MAX_SEGUNDOS_ANALISIS_ACORDES');
  });

  it('persiste el origen del cifrado dentro de guiaSustituto', () => {
    expect(repertorio).toContain('origenCifrado: chordsSource');
  });
});

describe('Respaldo global de la IA', () => {
  it('no devuelve una progresión de acordes inventada para cualquier prompt', () => {
    expect(aiTs).not.toContain('Progresión recomendada en Am - F - C - G');
  });
});
