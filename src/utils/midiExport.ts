// Exporta ideas melódicas a formato MIDI (.mid) para editar en DAWs y editores de partituras.
// Usa jsmidgen para crear archivos MIDI estándar que funcionan en Logic, Ableton, Cubase, etc.

import Midi from 'jsmidgen';
import { MelodicNoteEvent, MelodicInstrument } from '../types';

// Mapeos de notas MIDI (C4 = 60, ver estándar MIDI)
// Rango típico: C2 (36) a C7 (96) para instrumentos melódicos
const notaStringToMidi: Record<string, number> = {
  'C2': 36, 'C#2': 37, 'D2': 38, 'D#2': 39, 'E2': 40, 'F2': 41, 'F#2': 42, 'G2': 43, 'G#2': 44, 'A2': 45, 'A#2': 46, 'B2': 47,
  'C3': 48, 'C#3': 49, 'D3': 50, 'D#3': 51, 'E3': 52, 'F3': 53, 'F#3': 54, 'G3': 55, 'G#3': 56, 'A3': 57, 'A#3': 58, 'B3': 59,
  'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63, 'E4': 64, 'F4': 65, 'F#4': 66, 'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71,
  'C5': 72, 'C#5': 73, 'D5': 74, 'D#5': 75, 'E5': 76, 'F5': 77, 'F#5': 78, 'G5': 79, 'G#5': 80, 'A5': 81, 'A#5': 82, 'B5': 83,
  'C6': 84, 'C#6': 85, 'D6': 86, 'D#6': 87, 'E6': 88, 'F6': 89, 'F#6': 90, 'G6': 91, 'G#6': 92, 'A6': 93, 'A#6': 94, 'B6': 95,
  'C7': 96
};

export function eventosAMidiBlob(opts: {
  eventos: MelodicNoteEvent[];
  bpm: number;
  instrument: MelodicInstrument;
  nombrePista: string;
}): Blob {
  const { eventos, bpm, instrument, nombrePista } = opts;
  const file = new Midi.File();

  // Configurar tempo (BPM)
  file.setTempo(bpm);

  // Crear pista con nombre
  const track = new Midi.Track();
  track.setInstrument(getMidiInstrument(instrument));
  track.setName(nombrePista || `${instrument} - IA Generated`);
  file.addTrack(track);

  // Ordenar eventos por tiempo
  const sortedEventos = [...eventos].sort((a, b) => a.tiempo - b.tiempo);

  let lastEventTime = 0;

  // Agregar notas a la pista
  for (const evento of sortedEventos) {
    const midiNote = notaStringToMidi[evento.nota];
    if (!midiNote) {
      console.warn(`Nota inválida: ${evento.nota}, saltando...`);
      continue;
    }

    // Convertir tiempo de beats a ticks (jsmidgen usa 128 ticks por nota 4)
    const eventTimeBeats = evento.tiempo;
    const durationBeats = evento.duracionBeats || 1;

    // Calcular delay desde la última nota en beats
    const delayBeats = Math.max(0, eventTimeBeats - lastEventTime);

    // Velocidad MIDI (0-127, con rango 0.15-1 mapeado a 20-127)
    const velocityNormalized = evento.velocidad ?? 0.85;
    const midiVelocity = Math.round(Math.max(20, Math.min(127, velocityNormalized * 127)));

    // Agregar nota con delay y duración
    if (delayBeats > 0) {
      track.addNote(0, midiNote, delayBeats, midiVelocity);
    } else {
      track.addNote(0, midiNote, durationBeats, midiVelocity);
    }

    lastEventTime = eventTimeBeats + durationBeats;
  }

  // Convertir archivo MIDI a Blob
  const midiData = file.toBytes();
  const uint8Array = new Uint8Array(midiData);
  return new Blob([uint8Array], { type: 'audio/midi' });
}

// Mapear instrumentos sintéticos a programas MIDI estándar
function getMidiInstrument(instrument: MelodicInstrument): number {
  switch (instrument) {
    case 'guitarra':
      return 24; // Acoustic guitar
    case 'violin':
      return 40; // Violin
    case 'handpan':
      return 15; // Tubular bells (sonido metálico similar)
    case 'percusion':
      return 0; // Grand piano (default para percusión)
    default:
      return 0;
  }
}
