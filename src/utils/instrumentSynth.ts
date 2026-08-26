// SINTETIZADOR TONE.JS PARA IDEAS MELÓDICAS DE IA POR INSTRUMENTO (GUITARRA, VIOLÍN, HANDPAN,
// PERCUSIÓN). A diferencia de accompanimentSynth.ts (patrón rítmico fijo de batería/bajo), aquí
// se reproduce una secuencia de notas concreta generada por Gemini a partir del ADN musical y/o
// la canción del repertorio ('propose_melodic_idea' en el chatbot, ver server/routes/chat.ts).
//
// Se evitan deliberadamente los efectos de reverb de Tone.js (Freeverb/JCReverb usan
// AudioWorkletNode; Reverb genera su impulso con un Tone.Offline anidado): dentro de nuestro
// propio OfflineAudioContext ambos enfoques son frágiles. El timbre se consigue solo con
// osciladores/FM/filtro/vibrato, sin convolución.

import * as Tone from 'tone';
import { MelodicInstrument, MelodicNoteEvent } from '../types';
import { bufferToWavBlob } from './audioBufferToWav';

interface PlayableVoice {
  triggerAttackRelease(note: string, duration: number, time: number, velocity?: number): unknown;
}

function buildVoice(instrument: MelodicInstrument): PlayableVoice {
  switch (instrument) {
    case 'guitarra': {
      // Karplus-Strong: síntesis física de cuerda punteada, muy convincente para riffs de guitarra.
      const synth = new Tone.PluckSynth({ attackNoise: 1, dampening: 3200, resonance: 0.9 });
      synth.toDestination();
      return synth;
    }
    case 'violin': {
      // Diente de sierra con ataque lento (arco) + vibrato + filtro paso bajo cálido: aproximación
      // convincente de cuerda frotada sin necesitar samples reales.
      const filter = new Tone.Filter({ frequency: 3200, type: 'lowpass', rolloff: -12 }).toDestination();
      const vibrato = new Tone.Vibrato({ frequency: 5.5, depth: 0.15 }).connect(filter);
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.18, decay: 0.12, sustain: 0.75, release: 0.35 }
      });
      synth.connect(vibrato);
      return synth;
    }
    case 'handpan': {
      // FM con envolvente de ataque rápido y cola larga: tono metálico-campana característico del handpan.
      const synth = new Tone.FMSynth({
        harmonicity: 3.05,
        modulationIndex: 12,
        envelope: { attack: 0.004, decay: 1.1, sustain: 0.08, release: 1.6 },
        modulationEnvelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.3 }
      });
      synth.toDestination();
      return synth;
    }
    case 'percusion':
    default: {
      // Membrana con envolvente de tono (pitch decay) corta: congas/bongo con distintas alturas.
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 3,
        envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.25 }
      });
      synth.toDestination();
      return synth;
    }
  }
}

export async function renderMelodicIdeaAudioBlob(opts: {
  instrument: MelodicInstrument;
  bpm: number;
  durationSecs: number;
  eventos: MelodicNoteEvent[];
}): Promise<Blob> {
  const bpm = Math.max(40, Math.min(220, opts.bpm || 100));
  const totalLength = Math.max(4, Math.min(120, opts.durationSecs || 20));
  const secondsPerBeat = 60 / bpm;
  const eventos = opts.eventos || [];

  const rendered = await Tone.Offline(() => {
    const voice = buildVoice(opts.instrument);
    for (const evento of eventos) {
      const time = evento.tiempo * secondsPerBeat;
      if (!Number.isFinite(time) || time < 0 || time >= totalLength) continue;
      const duration = Math.max(0.08, (evento.duracionBeats || 1) * secondsPerBeat);
      voice.triggerAttackRelease(evento.nota, duration, time, evento.velocidad ?? 0.85);
    }
  }, totalLength, 2, 44100);

  const audioBuffer = rendered.get();
  if (!audioBuffer) throw new Error('No se pudo renderizar el audio del instrumento.');
  return bufferToWavBlob(audioBuffer);
}
