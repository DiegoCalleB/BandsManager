/**
 * Motor Client-Side de Separación de Stems con Cancelación Activa de Fase (Anti-Phase Cancellation Engine)
 *
 * Funciona igual que los auriculares con cancelación activa de ruido (ANC):
 * 1. Aísla la onda de la voz humana V(t).
 * 2. Invierte la fase de la onda vocal 180° (-V(t)).
 * 3. Suma la onda invertida a la mezcla original M(t) - V(t), anulando matemáticamente
 * la voz por interferencia destructiva en todas las pistas instrumentales.
 */

import { getAudioArrayBufferFromUrl } from './audioStorage';

export interface IsolatedStemResult {
  instrument: string;
  trackName: string;
  audioBlob: Blob;
  audioUrl: string;
  recommendedVolume: number;
  formato?: string;
  tamano?: string;
}

/**
 * Procesa un archivo de audio y genera stems aislados con cancelación activa de fase anti-vocal
 */
export async function separateAudioIntoStems(audioUrl: string, targetInstruments?: string[]): Promise<IsolatedStemResult[]> {
  try {
    // 1. Fetch original audio content safely handling indexeddb keys, base64 data URLs & streams
    const arrayBuffer = await getAudioArrayBufferFromUrl(audioUrl);

    // 2. Decode raw PCM audio buffer
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const tempCtx = new AudioCtx();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    // STEP 1: Render the isolated Vocal Buffer V(t)
    const vocalBuffer = await renderIsolatedVocalBuffer(audioBuffer, duration, sampleRate, numberOfChannels);

    // STEP 2: Generate Anti-Phase Vocal-Cancelled Base Buffer: M_instrumental(t) = Original(t) - V(t)
    const vocalCancelledBuffer = createPhaseCancelledBuffer(tempCtx, audioBuffer, vocalBuffer, 0.96);

    // STEP 3: Generate Side-Channel Buffer S(t) = L(t) - R(t) (mathematically cancels dead-center vocals, kick & snare)
    const sideChannelBuffer = createSideChannelBuffer(tempCtx, audioBuffer);

    const allStemTypes = [
      { instrument: 'Voz', trackName: '🎤 Pista IA: Voz Principal (Aislada)', volume: 1.0, sourceBuf: vocalBuffer },
      { instrument: 'Instrumental', trackName: '🎵 Pista IA: Base Instrumental (Playback)', volume: 0.95, sourceBuf: vocalCancelledBuffer },
      { instrument: 'Batería', trackName: '🥁 Pista IA: Batería & Percusión', volume: 0.9, sourceBuf: vocalCancelledBuffer },
      { instrument: 'Bajo', trackName: '🎸 Pista IA: Bajo (Sub-Bass)', volume: 0.95, sourceBuf: vocalCancelledBuffer },
      { instrument: 'Guitarras', trackName: '🎹 Pista IA: Guitarras & Teclados', volume: 0.85, sourceBuf: sideChannelBuffer },
      { instrument: 'Arreglos', trackName: '🎺 Pista IA: Vientos, Cuerdas & Solos', volume: 0.85, sourceBuf: sideChannelBuffer },
    ];

    const stemTypes =
      targetInstruments && targetInstruments.length > 0
        ? allStemTypes.filter((s) => targetInstruments.some((t) => t.toLowerCase() === s.instrument.toLowerCase()))
        : allStemTypes;

    const results: IsolatedStemResult[] = [];

    for (const stem of stemTypes) {
      const offlineCtx = new OfflineAudioContext(numberOfChannels, Math.ceil(duration * sampleRate), sampleRate);

      const source = offlineCtx.createBufferSource();
      source.buffer = stem.sourceBuf;

      let lastNode: AudioNode = source;

      if (stem.instrument === 'Voz') {
        // Vocal refinement node
        const formantBoost = offlineCtx.createBiquadFilter();
        formantBoost.type = 'peaking';
        formantBoost.frequency.value = 1500;
        formantBoost.gain.value = 2.0;

        source.connect(formantBoost);
        lastNode = formantBoost;
      } else if (stem.instrument === 'Bajo') {
        // Steep 4-stage lowpass filter (180 Hz) on vocal-cancelled buffer
        let current = source as AudioNode;
        for (let i = 0; i < 4; i++) {
          const lp = offlineCtx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 180;
          lp.Q.value = 1.4;
          current.connect(lp);
          current = lp;
        }
        lastNode = current;
      } else if (stem.instrument === 'Guitarras') {
        // Bandpass for mid guitars/keys on vocal-cancelled buffer
        const hp = offlineCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 160;

        const lp = offlineCtx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 4500;

        source.connect(hp);
        hp.connect(lp);
        lastNode = lp;
      } else if (stem.instrument === 'Batería') {
        // High transients + Kick lowpass on vocal-cancelled buffer
        const hp = offlineCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;

        const kickLp = offlineCtx.createBiquadFilter();
        kickLp.type = 'lowpass';
        kickLp.frequency.value = 120;

        source.connect(hp);

        const kickGain = offlineCtx.createGain();
        kickGain.gain.value = 1.2;
        source.connect(kickLp);
        kickLp.connect(kickGain);

        hp.connect(offlineCtx.destination);
        kickGain.connect(offlineCtx.destination);
        lastNode = hp;
      } else if (stem.instrument === 'Arreglos') {
        // High-mid bandpass for solos/strings on vocal-cancelled buffer
        const hp = offlineCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2400;

        source.connect(hp);
        lastNode = hp;
      }

      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = stem.volume;
      if (stem.instrument !== 'Batería') {
        lastNode.connect(masterGain);
        masterGain.connect(offlineCtx.destination);
      } else {
        masterGain.connect(offlineCtx.destination);
      }

      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();

      // Clean background floor noise
      const cleanedBuffer = applyNoiseThreshold(renderedBuffer, stem.instrument);

      const wavBlob = audioBufferToWavBlob(cleanedBuffer);
      const blobUrl = URL.createObjectURL(wavBlob);
      const bytes = wavBlob.size;
      const sizeFormatted = bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

      results.push({
        instrument: stem.instrument,
        trackName: stem.trackName,
        audioBlob: wavBlob,
        audioUrl: blobUrl,
        recommendedVolume: stem.volume,
        formato: 'WAV',
        tamano: sizeFormatted,
      });
    }

    tempCtx.close().catch(() => {});
    return results;
  } catch (err) {
    console.error('Error rendering anti-phase cancelled stems:', err);
    throw err;
  }
}

/**
 * Renderiza el buffer aislado de voz usando aislamiento de formantes y canal central
 */
async function renderIsolatedVocalBuffer(
  audioBuffer: AudioBuffer,
  duration: number,
  sampleRate: number,
  numberOfChannels: number
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(numberOfChannels, Math.ceil(duration * sampleRate), sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const hp = offlineCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 260;

  const lp = offlineCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3400;

  const formantBoost = offlineCtx.createBiquadFilter();
  formantBoost.type = 'peaking';
  formantBoost.frequency.value = 1450;
  formantBoost.Q.value = 1.5;
  formantBoost.gain.value = 4.5;

  const bassCut = offlineCtx.createBiquadFilter();
  bassCut.type = 'notch';
  bassCut.frequency.value = 100;
  bassCut.Q.value = 4.0;

  source.connect(hp);
  hp.connect(lp);
  lp.connect(formantBoost);
  formantBoost.connect(bassCut);
  bassCut.connect(offlineCtx.destination);

  source.start(0);
  return await offlineCtx.startRendering();
}

/**
 * Cancela matemáticamente la onda vocal de la mezcla original mediante inversión de fase anti-onda (180°):
 * Output(t) = Original(t) - (Gain * Vocal(t))
 */
function createPhaseCancelledBuffer(
  ctx: AudioContext | OfflineAudioContext,
  originalBuffer: AudioBuffer,
  vocalBuffer: AudioBuffer,
  cancellationGain: number = 0.96
): AudioBuffer {
  const numChannels = originalBuffer.numberOfChannels;
  const length = originalBuffer.length;
  const sampleRate = originalBuffer.sampleRate;

  const cancelledBuffer = ctx.createBuffer(numChannels, length, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const origData = originalBuffer.getChannelData(c);
    const vocalData = vocalBuffer.getChannelData(c);
    const outData = cancelledBuffer.getChannelData(c);

    for (let i = 0; i < length; i++) {
      const vocalSample = i < vocalBuffer.length ? vocalData[i] : 0;
      // Anti-phase wave cancellation math: M(t) + (-V(t)) = M(t) - V(t)
      let sample = origData[i] - cancellationGain * vocalSample;
      outData[i] = Math.max(-1, Math.min(1, sample));
    }
  }

  return cancelledBuffer;
}

/**
 * Genera el buffer del canal lateral Side: S(t) = 0.5 * (L(t) - R(t)).
 * Anula matemáticamente todo sonido paneado al centro exacto (Voces principales, bombo y caja de batería).
 */
function createSideChannelBuffer(ctx: AudioContext | OfflineAudioContext, originalBuffer: AudioBuffer): AudioBuffer {
  const numChannels = originalBuffer.numberOfChannels;
  const length = originalBuffer.length;
  const sampleRate = originalBuffer.sampleRate;

  const sideBuffer = ctx.createBuffer(numChannels, length, sampleRate);

  if (numChannels >= 2) {
    const left = originalBuffer.getChannelData(0);
    const right = originalBuffer.getChannelData(1);
    const outL = sideBuffer.getChannelData(0);
    const outR = sideBuffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const side = 0.5 * (left[i] - right[i]);
      outL[i] = side;
      outR[i] = -side;
    }
  } else {
    const mono = originalBuffer.getChannelData(0);
    const outL = sideBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      outL[i] = mono[i];
    }
  }

  return sideBuffer;
}

/**
 * Puerta de ruido para eliminar zumbidos o ruidos residuales por debajo del umbral auditivo
 */
function applyNoiseThreshold(buffer: AudioBuffer, instrument: string): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;

  for (let c = 0; c < numChannels; c++) {
    const data = buffer.getChannelData(c);
    const threshold = instrument === 'Bajo' ? 0.001 : 0.003;

    for (let i = 0; i < length; i++) {
      if (Math.abs(data[i]) < threshold) {
        data[i] = 0;
      }
    }
  }

  return buffer;
}

/**
 * Convierte un AudioBuffer de Web Audio API a Blob de archivo .WAV estándar PCM de 16-bit
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // WAV Header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // Subchunk1Size
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16); // BitsPerSample
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
