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
  const viewer = leer('src', 'components', 'Atril.tsx');
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

describe('/songs/:id/letra-sincronizada: reconocimiento de voz con tiempos, nunca generativo', () => {
  // La lógica vive en el servicio (lo comparten la ruta manual y la cola de letras).
  const ruta = leer('server', 'services', 'letraCancion.ts');
  const ini = rutas.indexOf('router.post("/songs/:id/letra-sincronizada"');

  it('existe y transcribe con el servicio de voz, sin pasar por un modelo generativo', () => {
    expect(ini).toBeGreaterThan(-1);
    expect(rutas).toContain('ejecutarLetraSincronizada(');
    expect(ruta).toContain('transcribirLetra(');
    expect(ruta).not.toContain('generateContentWithFallback');
    expect(ruta).not.toContain('getAiClient');
  });

  it('si la transcripción falla responde 502 y NO guarda nada (el guardado va después)', () => {
    expect(ruta.indexOf('status: 502')).toBeGreaterThan(-1);
    expect(ruta.indexOf('status: 502')).toBeLessThan(ruta.indexOf('dbUpsertSong('));
  });

  it('una letra con menos de 8 palabras se rechaza como «sin letra», no se guarda', () => {
    expect(ruta).toContain('totalPalabras(lineas) < 8');
    expect(ruta.indexOf('sin_letra')).toBeLessThan(ruta.indexOf('dbUpsertSong('));
  });

  it('no sustituye un cifrado existente sin sobrescribir: true y lo comprueba antes de transcribir', () => {
    expect(ruta.indexOf('!sobrescribir')).toBeLessThan(ruta.indexOf('transcribirLetra('));
  });

  it('prefiere la pista de voz aislada de Iris y avisa de que la mezcla es peor', () => {
    expect(ruta).toMatch(/voz\|vocals/);
    expect(ruta).toContain('confianzaGlobal(lineas, fuenteLetra)');
  });

  it('sin audio no se transcribe nada (400) y el mensaje dice que no se inventa', () => {
    expect(ruta).toMatch(/no voy a inventarla/);
  });
});

describe('Cliente: la letra solo se pide a propósito', () => {
  const viewer = leer('src', 'components', 'Atril.tsx');
  const bulk = leer('src', 'components', 'repertorio', 'BulkAlbumAudioUploaderModal.tsx');
  const repertorio = leer('src', 'components', 'RepertorioSetlists.tsx');

  it('«Letra del audio» llama a la transcripción por voz, no al generador antiguo', () => {
    expect(viewer).toContain('/letra-sincronizada');
    expect(viewer).not.toContain('/api/generate-song-chords');
  });

  it('la subida de audio (suelta o en lote) solo detecta acordes, nunca genera letra', () => {
    for (const f of [bulk, repertorio]) {
      expect(f).not.toContain('generate-song-chords');
      expect(f).not.toContain('letra-sincronizada');
      expect(f).toContain('analizarAcordesDelAudio'); // única llamada cliente a /analizar-acordes
    }
    const cliente = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'utils', 'analisisAcordesCliente.ts'), 'utf-8');
    expect(cliente).toContain('analizar-acordes');
    expect(cliente).not.toContain('generate-song-chords');
  });
});
