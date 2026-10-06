import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const raiz = path.join(__dirname, '..', '..', '..');
const leer = (...p: string[]) => fs.readFileSync(path.join(raiz, ...p), 'utf-8');
const rutas = leer('server', 'routes', 'repertorio.ts');
const handler = rutas.slice(rutas.indexOf('router.post("/generate-song-chords"'), rutas.indexOf('router.post("/ai-composer-arrangement"'));

describe('/generate-song-chords: la letra solo sale del audio', () => {
  it('no hay ninguna instrucción de crear, componer o proponer letra', () => {
    expect(handler).not.toMatch(/crea(r)? una progresi[oó]n y letra/i);
    expect(handler).not.toMatch(/mejor propuesta posible/i);
    expect(handler).not.toMatch(/ia_sin_audio/);
  });

  it('sin audio responde 422 ANTES de llamar a la IA', () => {
    const iSinAudio = handler.indexOf('sin_audio');
    const iLlamada = handler.indexOf('generateContentWithFallback(');
    expect(iSinAudio).toBeGreaterThan(-1);
    expect(iSinAudio).toBeLessThan(iLlamada);
    expect(handler).toContain('status(422)');
  });

  it('transcribe con temperatura 0 y prohíbe completar, corregir o recordar la letra', () => {
    expect(handler).toContain('temperature: 0');
    expect(handler).toMatch(/no completes versos ni rimas/);
    expect(handler).toMatch(/\[\?\]/);
    expect(handler).toMatch(/sin_letra/);
  });

  it('no pisa un cifrado existente sin sobrescribir: true, y lo comprueba antes de la IA', () => {
    const iConflicto = handler.indexOf('status(409)');
    expect(iConflicto).toBeGreaterThan(-1);
    expect(handler.indexOf('sobrescribir !== true')).toBeLessThan(handler.indexOf('generateContentWithFallback('));
  });

  it('usa la pista de voz aislada de Iris para la letra cuando existe', () => {
    expect(handler).toMatch(/voz\|vocals/);
  });

  it('pasa a la IA los acordes ya detectados como referencia', () => {
    expect(handler).toContain('analisisAcordes');
  });
});

describe('Cliente: ninguna letra de ejemplo escrita en el código', () => {
  const viewer = leer('src', 'components', 'SongChordsViewerModal.tsx');
  const enVivo = leer('src', 'components', 'ensayos', 'ModoLocalEnVivoTab.tsx');

  it('el visor y el modo en vivo no tienen cifrado de muestra', () => {
    for (const f of [viewer, enVivo]) {
      expect(f).not.toContain('getSampleCifrado');
      expect(f).not.toContain('Arrancamos la noche en la');
    }
  });

  it('una canción sin cifrado se muestra vacía, con una explicación', () => {
    expect(enVivo).toContain('aún no tiene cifrado');
  });

  it('generar sobre un cifrado existente pide confirmación', () => {
    expect(viewer).toMatch(/window\.confirm\([^)]*sustituir/);
  });
});
