import * as SoundTouchModule from 'soundtouchjs';

const SoundTouch = (SoundTouchModule as any).default || SoundTouchModule;
let soundTouch: any = null;
let channels: Float32Array[] = [];

self.onmessage = (event: MessageEvent) => {
  const { type, data, semitones } = event.data;

  if (type === 'init') {
    soundTouch = new SoundTouch(data.sampleRate);
    console.log('🎵 PitchShift worker initialized');
  } else if (type === 'setPitch') {
    if (soundTouch) {
      const pitchSemitones = Math.max(-12, Math.min(12, semitones));
      const pitchShift = Math.pow(2, pitchSemitones / 12);
      soundTouch.pitch = pitchShift;
      console.log('🎵 Pitch set to:', pitchShift, 'semitones:', pitchSemitones);
    }
  } else if (type === 'process') {
    if (soundTouch && data.length > 0) {
      try {
        soundTouch.putSamples(data);
        const output = soundTouch.getSamples();

        self.postMessage({
          type: 'samples',
          samples: output,
        });
      } catch (err) {
        console.error('Error processing audio:', err);
      }
    }
  } else if (type === 'flush') {
    if (soundTouch) {
      soundTouch.flush();
      const output = soundTouch.getSamples();
      self.postMessage({
        type: 'samples',
        samples: output,
        isFlush: true,
      });
    }
  }
};
