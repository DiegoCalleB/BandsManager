import { describe, it, expect } from 'vitest';
import {
  parseTimeToSeconds,
  parseRange,
  formatMMSS,
  formatVttTime,
  formatAssTime,
  extractJsonObject,
  normalizeHighlights,
  buildFallbackHighlights,
  buildSubtitleCues,
  buildVtt,
  buildWordOffsets,
  buildAssSubtitles,
  buildVerticalFilter,
  escapeFilterPath,
  decodeTranscriptText,
  wrapSubtitleLine,
  type TranscriptItem,
} from '../reelsCore';

describe('parseo de tiempos', () => {
  it('lee mm:ss, hh:mm:ss y segundos sueltos', () => {
    expect(parseTimeToSeconds('01:30')).toBe(90);
    expect(parseTimeToSeconds('01:00:05')).toBe(3605);
    expect(parseTimeToSeconds('45')).toBe(45);
    expect(parseTimeToSeconds('')).toBe(0);
    expect(parseTimeToSeconds(undefined)).toBe(0);
  });

  it('acepta los distintos guiones y flechas que devuelve la IA', () => {
    expect(parseRange('0:15 - 0:45')).toEqual({ start: 15, end: 45 });
    expect(parseRange('0:15-0:45')).toEqual({ start: 15, end: 45 });
    expect(parseRange('00:15 → 00:45')).toEqual({ start: 15, end: 45 });
    expect(parseRange('1:05 — 1:35')).toEqual({ start: 65, end: 95 });
  });

  it('formatea a MM:SS, VTT y ASS', () => {
    expect(formatMMSS(90)).toBe('01:30');
    expect(formatMMSS(-5)).toBe('00:00');
    expect(formatVttTime(65.5)).toBe('00:01:05.500');
    expect(formatAssTime(65.5)).toBe('0:01:05.50');
  });
});

describe('extractJsonObject', () => {
  it('lee JSON limpio', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('quita las vallas markdown', () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJsonObject('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('recorta el JSON cuando el modelo añade texto alrededor', () => {
    const raw = 'Claro, aquí tienes el análisis:\n{"highlights":[{"id":"hl-1"}]}\nEspero que te sirva.';
    expect(extractJsonObject(raw)).toEqual({ highlights: [{ id: 'hl-1' }] });
  });

  it('tolera comas colgantes', () => {
    expect(extractJsonObject('{"a":1,"b":[1,2,],}')).toEqual({ a: 1, b: [1, 2] });
  });

  it('no se confunde con llaves dentro de strings', () => {
    expect(extractJsonObject('{"texto":"un } suelto","ok":true}')).toEqual({ texto: 'un } suelto', ok: true });
  });

  it('devuelve null si no hay nada parseable', () => {
    expect(extractJsonObject('lo siento, no puedo ayudarte')).toBeNull();
    expect(extractJsonObject('')).toBeNull();
    expect(extractJsonObject(null)).toBeNull();
  });
});

describe('normalizeHighlights', () => {
  const opciones = { videoDuration: 180, targetDuration: 30 };

  it('acepta segundos numéricos y calcula el rango en texto', () => {
    const [clip] = normalizeHighlights([{ id: 'hl-1', title: 'A', startSec: 20, endSec: 50 }], opciones);
    expect(clip.startSec).toBe(20);
    expect(clip.endSec).toBe(50);
    expect(clip.duration).toBe(30);
    expect(clip.range).toBe('00:20 - 00:50');
  });

  it('cae al rango en texto cuando no hay segundos numéricos', () => {
    const [clip] = normalizeHighlights([{ title: 'A', range: '0:10 - 0:40' }], opciones);
    expect(clip.startSec).toBe(10);
    expect(clip.endSec).toBe(40);
  });

  it('recorta los rangos alucinados fuera del vídeo real', () => {
    // Un clip de 12:30 en un vídeo de 3 minutos llegaba tal cual a ffmpeg y salía vacío.
    const [clip] = normalizeHighlights([{ title: 'A', range: '12:30 - 13:00' }], opciones);
    expect(clip.endSec).toBeLessThanOrEqual(180);
    expect(clip.startSec).toBeLessThan(clip.endSec);
    expect(clip.duration).toBeGreaterThanOrEqual(8);
  });

  it('recorta los clips más largos que el máximo permitido', () => {
    const [clip] = normalizeHighlights([{ title: 'A', startSec: 0, endSec: 170 }], opciones);
    expect(clip.duration).toBeLessThanOrEqual(45);
  });

  it('descarta los que se solapan casi por completo', () => {
    const clips = normalizeHighlights(
      [
        { title: 'A', startSec: 10, endSec: 40, confidence: 95 },
        { title: 'B', startSec: 12, endSec: 42, confidence: 90 },
        { title: 'C', startSec: 90, endSec: 120, confidence: 85 },
      ],
      opciones
    );
    expect(clips).toHaveLength(2);
    expect(clips.map((c) => c.title)).toEqual(['A', 'C']);
  });

  it('ordena por confianza descendente', () => {
    const clips = normalizeHighlights(
      [
        { title: 'baja', startSec: 0, endSec: 30, confidence: 60 },
        { title: 'alta', startSec: 60, endSec: 90, confidence: 99 },
      ],
      opciones
    );
    expect(clips[0].title).toBe('alta');
  });

  it('normaliza los hashtags y usa los de la banda cuando faltan', () => {
    const [clip] = normalizeHighlights(
      [{ title: 'A', startSec: 0, endSec: 30, hashtags: ['sinAlmohadilla', '#YaTiene'] }],
      opciones
    );
    expect(clip.hashtags).toEqual(['#sinAlmohadilla', '#YaTiene']);

    const [sinTags] = normalizeHighlights([{ title: 'A', startSec: 0, endSec: 30 }], {
      ...opciones,
      defaultHashtags: ['#Lavanda'],
    });
    expect(sinTags.hashtags).toEqual(['#Lavanda']);
  });

  it('aguanta entradas basura sin lanzar', () => {
    expect(normalizeHighlights(null, opciones)).toEqual([]);
    expect(normalizeHighlights([null, 'texto', 42], opciones)).toEqual([]);
  });
});

describe('buildFallbackHighlights', () => {
  it('reparte los cortes dentro de la duración real', () => {
    const clips = buildFallbackHighlights({
      videoDuration: 200,
      targetDuration: 30,
      bandName: 'Lavanda',
      videoTitle: 'Directo en la sala',
      hashtags: ['#Lavanda'],
    });
    expect(clips.length).toBeGreaterThan(0);
    for (const clip of clips) {
      expect(clip.startSec).toBeGreaterThanOrEqual(0);
      expect(clip.endSec).toBeLessThanOrEqual(200);
      expect(clip.endSec).toBeGreaterThan(clip.startSec);
      expect(clip.recommendedCopy).toContain('Lavanda');
    }
  });

  it('no genera cortes duplicados en vídeos muy cortos', () => {
    const clips = buildFallbackHighlights({
      videoDuration: 20,
      targetDuration: 30,
      bandName: 'X',
      videoTitle: 'Corto',
      hashtags: ['#X'],
    });
    const inicios = clips.map((c) => c.startSec);
    expect(new Set(inicios).size).toBe(inicios.length);
    for (const clip of clips) expect(clip.endSec).toBeLessThanOrEqual(20);
  });
});

describe('subtítulos', () => {
  const transcript: TranscriptItem[] = [
    { offset: 0, duration: 2000, text: 'antes del corte' },
    { offset: 10000, duration: 2000, text: 'primera l&amp;nea' },
    { offset: 13000, duration: 2000, text: 'segunda linea' },
    { offset: 60000, duration: 2000, text: 'muy despues' },
  ];

  it('recorta al tramo del clip con tiempos relativos', () => {
    const cues = buildSubtitleCues(transcript, 10, 10);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ text: 'primera l&nea', start: 0, end: 2 });
    expect(cues[1]).toEqual({ text: 'segunda linea', start: 3, end: 5 });
  });

  it('excluye las líneas que solo tocan el borde', () => {
    // Una línea que acaba justo cuando empieza el clip no se ve en el clip.
    const cues = buildSubtitleCues([{ offset: 8000, duration: 2000, text: 'justo antes' }], 10, 10);
    expect(cues).toHaveLength(0);
  });

  it('devuelve vacío sin transcripción', () => {
    expect(buildSubtitleCues([], 0, 30)).toEqual([]);
    expect(buildSubtitleCues(null as any, 0, 30)).toEqual([]);
  });

  it('genera un VTT válido', () => {
    const vtt = buildVtt(buildSubtitleCues(transcript, 10, 10));
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('00:00:00.000 --> 00:00:02.000');
    expect(buildVtt([])).toBe('');
  });

  it('reparte offsets por palabra dentro del cue', () => {
    const palabras = buildWordOffsets([{ text: 'hola mundo', start: 0, end: 2 }]);
    expect(palabras).toHaveLength(2);
    expect(palabras[0].word).toBe('hola');
    expect(palabras[0].start).toBe(0);
    expect(palabras[1].end).toBeLessThanOrEqual(2);
    expect(palabras[1].start).toBeGreaterThanOrEqual(palabras[0].end - 0.01);
  });

  it('parte las líneas largas para que quepan en vertical', () => {
    expect(wrapSubtitleLine('corto')).toBe('corto');
    const partido = wrapSubtitleLine('esta linea es bastante mas larga de lo que cabe', 20);
    expect(partido).toContain('\\N');
  });

  it('decodifica entidades HTML de la transcripción', () => {
    expect(decodeTranscriptText('rock &amp; roll  &quot;en vivo&quot;')).toBe('rock & roll "en vivo"');
  });

  it('genera ASS con cabecera, estilo y diálogos', () => {
    const ass = buildAssSubtitles([{ text: 'hola', start: 0, end: 1 }]);
    expect(ass).toContain('[Script Info]');
    expect(ass).toContain('Style: Reel');
    expect(ass).toContain('Dialogue: 0,0:00:00.00,0:00:01.00,Reel');
  });

  it('escapa las llaves del texto para que ASS no las lea como override', () => {
    const ass = buildAssSubtitles([{ text: 'un {tag} raro', start: 0, end: 1 }]);
    expect(ass).toContain('\\{tag\\}');
  });
});

describe('filtros de ffmpeg', () => {
  it('crop produce una cadena que acaba en [v]', () => {
    const filtros = buildVerticalFilter('crop');
    expect(filtros).toHaveLength(1);
    expect(filtros[0].endsWith('[v]')).toBe(true);
  });

  it('blur compone fondo desenfocado y vídeo centrado', () => {
    const filtros = buildVerticalFilter('blur');
    expect(filtros).toHaveLength(3);
    expect(filtros[0]).toContain('boxblur');
    expect(filtros[2].endsWith('[v]')).toBe(true);
  });

  it('none no aplica filtros', () => {
    expect(buildVerticalFilter('none')).toEqual([]);
  });

  it('escapa los dos puntos y comillas de las rutas de subtítulos', () => {
    expect(escapeFilterPath("C:\\temp\\a'b.ass")).toBe("C\\:/temp/a\\'b.ass");
  });
});
