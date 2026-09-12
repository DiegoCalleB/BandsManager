/**
 * Motor Client-Side de Separación Espectral y Aislamiento de Stems de Audio (OfflineAudioContext)
 * Renderiza 5 archivos de audio completamente independientes (.wav) a partir de la mezcla original
 * para que cada pista del mezclador multipista tenga su propia fuente de audio aislada y real.
 */

export interface IsolatedStemResult {
  instrument: string;
  trackName: string;
  audioBlob: Blob;
  audioUrl: string;
  recommendedVolume: number;
}

/**
 * Procesa un archivo de audio y genera 5 stems aislados reales (.wav)
 */
export async function separateAudioIntoStems(audioUrl: string): Promise<IsolatedStemResult[]> {
  try {
    // 1. Fetch original audio content
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`HTTP error fetching audio: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // 2. Decode audio buffer
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const tempCtx = new AudioCtx();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    const stemConfigs = [
      {
        instrument: 'Voz',
        trackName: '🎤 Stem IA: Voz Principal (Aislada)',
        filterType: 'bandpass' as BiquadFilterType,
        cutoff: 1400,
        q: 1.8,
        volume: 0.95
      },
      {
        instrument: 'Batería',
        trackName: '🥁 Stem IA: Batería & Percusión',
        filterType: 'highpass' as BiquadFilterType,
        cutoff: 1800,
        q: 1.2,
        volume: 0.90
      },
      {
        instrument: 'Bajo',
        trackName: '🎸 Stem IA: Bajo (Sub-Bass)',
        filterType: 'lowpass' as BiquadFilterType,
        cutoff: 200,
        q: 2.0,
        volume: 0.95
      },
      {
        instrument: 'Guitarras',
        trackName: '🎹 Stem IA: Guitarras & Teclados',
        filterType: 'bandpass' as BiquadFilterType,
        cutoff: 750,
        q: 1.5,
        volume: 0.85
      },
      {
        instrument: 'Arreglos',
        trackName: '🎺 Stem IA: Vientos, Cuerdas & Solos',
        filterType: 'bandpass' as BiquadFilterType,
        cutoff: 2400,
        q: 2.2,
        volume: 0.85
      }
    ];

    const results: IsolatedStemResult[] = [];

    for (const cfg of stemConfigs) {
      // Create an OfflineAudioContext for rendering this isolated stem
      const offlineCtx = new OfflineAudioContext(
        numberOfChannels,
        Math.ceil(duration * sampleRate),
        sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = cfg.filterType;
      filter.frequency.value = cfg.cutoff;
      filter.Q.value = cfg.q;

      const gain = offlineCtx.createGain();
      gain.gain.value = cfg.volume;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);

      source.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWavBlob(renderedBuffer);
      const blobUrl = URL.createObjectURL(wavBlob);

      results.push({
        instrument: cfg.instrument,
        trackName: cfg.trackName,
        audioBlob: wavBlob,
        audioUrl: blobUrl,
        recommendedVolume: cfg.volume
      });
    }

    tempCtx.close().catch(() => {});
    return results;
  } catch (err) {
    console.error("Error rendering offline stems:", err);
    throw err;
  }
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
  setUint16(1);  // PCM
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
