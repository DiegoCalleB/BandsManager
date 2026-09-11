import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '../public/audio/samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function writeWav(filePath: string, sampleRate: number, numChannels: number, samples: Float32Array) {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

const sr = 44100;

// Track 1: 'Groove de Apertura' (Funk / Groove, 116 BPM, A minor, 30s)
function genGroove(duration = 30) {
  const numSamples = sr * duration;
  const out = new Float32Array(numSamples);
  const bpm = 116;
  const beatDuration = 60 / bpm;
  const bassNotes = [55, 55, 65.4, 73.4, 82.4, 82.4, 73.4, 98];
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const beat = t / beatDuration;
    const beatInBar = beat % 4;

    let sample = 0;

    // Kick on beat 0 and 2.5
    if (beatInBar < 0.2 || (beatInBar >= 2.5 && beatInBar < 2.7)) {
      const kTime = beatInBar < 0.2 ? beatInBar : (beatInBar - 2.5);
      const freq = 120 * Math.exp(-kTime * 25) + 45;
      sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-kTime * 15) * 0.7;
    }

    // Snare on beat 1 and 3
    if ((beatInBar >= 1 && beatInBar < 1.3) || (beatInBar >= 3 && beatInBar < 3.3)) {
      const sTime = beatInBar >= 3 ? (beatInBar - 3) : (beatInBar - 1);
      const noise = (Math.random() * 2 - 1) * Math.exp(-sTime * 14) * 0.35;
      const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-sTime * 20) * 0.25;
      sample += noise + tone;
    }

    // Hi-hat every 8th note
    const eighth = (beat * 2) % 1;
    if (eighth < 0.15) {
      sample += (Math.random() * 2 - 1) * Math.exp(-eighth * 35) * 0.12;
    }

    // Bass line
    const noteIdx = Math.floor(beat * 2) % bassNotes.length;
    const noteT = (beat * 2) % 1;
    const bFreq = bassNotes[noteIdx];
    const bass = (Math.sin(2 * Math.PI * bFreq * t) + 0.5 * Math.sin(2 * Math.PI * bFreq * 2 * t)) * Math.exp(-noteT * 2.5) * 0.35;
    sample += bass;

    // Electric piano chord stab on beat 0.5 and 2
    const chordTime = (beat % 2);
    if (chordTime < 0.4) {
      const chord = (Math.sin(2 * Math.PI * 220 * t) +
                     Math.sin(2 * Math.PI * 261.6 * t) +
                     Math.sin(2 * Math.PI * 329.6 * t) +
                     Math.sin(2 * Math.PI * 392 * t)) * 0.08 * Math.exp(-chordTime * 4);
      sample += chord;
    }

    if (t > duration - 2) {
      sample *= (duration - t) / 2;
    }

    out[i] = sample * 0.8;
  }
  return out;
}

// Track 2: 'Balada de Medianoche' (Acústico / Indie, 84 BPM, Em, 30s)
function genBalada(duration = 30) {
  const numSamples = sr * duration;
  const out = new Float32Array(numSamples);
  const bpm = 84;
  const beatDuration = 60 / bpm;
  const chords = [
    [164.8, 196, 246.9, 329.6, 164.8], // Em
    [130.8, 164.8, 196, 261.6, 130.8], // C
    [98, 123.5, 146.8, 196, 98],       // G
    [146.8, 185, 220, 293.7, 146.8]    // D
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const beat = t / beatDuration;
    const bar = Math.floor(beat / 4);
    const chordIdx = bar % chords.length;
    const currentChord = chords[chordIdx];

    let sample = 0;

    const subBeat = Math.floor(beat * 2) % currentChord.length;
    const noteTime = (beat * 2) % 1;
    const freq = currentChord[subBeat];
    const pluck = (Math.sin(2 * Math.PI * freq * t) + 
                   0.4 * Math.sin(2 * Math.PI * freq * 2 * t) +
                   0.15 * Math.sin(2 * Math.PI * freq * 3 * t)) * Math.exp(-noteTime * 3) * 0.35;
    sample += pluck;

    const bassFreq = currentChord[0] / 2;
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.2;
    sample += bass;

    const pad = (Math.sin(2 * Math.PI * currentChord[1] * t) + Math.sin(2 * Math.PI * currentChord[2] * t)) * 0.05;
    sample += pad;

    if (t > duration - 2) {
      sample *= (duration - t) / 2;
    }
    out[i] = sample * 0.75;
  }
  return out;
}

// Track 3: 'Fuego en el Asfalto' (Rock / High Energy, 138 BPM, Dm, 30s)
function genRock(duration = 30) {
  const numSamples = sr * duration;
  const out = new Float32Array(numSamples);
  const bpm = 138;
  const beatDuration = 60 / bpm;
  const riff = [73.4, 73.4, 87.3, 73.4, 98, 103.8, 110, 130.8];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const beat = t / beatDuration;
    const beatInBar = beat % 4;

    let sample = 0;

    const kTime = beat % 1;
    if (kTime < 0.2) {
      const freq = 130 * Math.exp(-kTime * 30) + 50;
      sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-kTime * 18) * 0.8;
    }

    if ((beatInBar >= 1 && beatInBar < 1.35) || (beatInBar >= 3 && beatInBar < 3.35)) {
      const sTime = beatInBar >= 3 ? (beatInBar - 3) : (beatInBar - 1);
      const noise = (Math.random() * 2 - 1) * Math.exp(-sTime * 12) * 0.5;
      const snap = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-sTime * 25) * 0.35;
      sample += noise + snap;
    }

    const hhTime = (beat * 2) % 1;
    if (hhTime < 0.2) {
      sample += (Math.random() * 2 - 1) * Math.exp(-hhTime * 28) * 0.15;
    }

    const riffIdx = Math.floor(beat * 2) % riff.length;
    const rTime = (beat * 2) % 1;
    const rFreq = riff[riffIdx];
    const rawGuitar = Math.sin(2 * Math.PI * rFreq * t) +
                      0.7 * Math.sin(2 * Math.PI * (rFreq * 1.5) * t) +
                      0.5 * Math.sin(2 * Math.PI * rFreq * 2 * t);
    const distGuitar = Math.tanh(rawGuitar * 2.8) * Math.exp(-rTime * 1.8) * 0.35;
    sample += distGuitar;

    if (t > duration - 2) {
      sample *= (duration - t) / 2;
    }
    out[i] = sample * 0.8;
  }
  return out;
}

// Track 4: 'Brisa Mediterránea' (Pop / Fiesta / Reggae, 128 BPM, G Major, 30s)
function genFiesta(duration = 30) {
  const numSamples = sr * duration;
  const out = new Float32Array(numSamples);
  const bpm = 128;
  const beatDuration = 60 / bpm;
  const roots = [98, 146.8, 82.4, 130.8]; // G2, D3, E2, C3

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const beat = t / beatDuration;
    const bar = Math.floor(beat / 4);
    const root = roots[bar % roots.length];

    let sample = 0;

    const kTime = beat % 1;
    if (kTime < 0.22) {
      const freq = 120 * Math.exp(-kTime * 25) + 48;
      sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-kTime * 16) * 0.7;
    }

    const upbeat = (beat + 0.5) % 1;
    if (upbeat < 0.25) {
      const c1 = Math.sin(2 * Math.PI * root * 3 * t);
      const c2 = Math.sin(2 * Math.PI * root * 3.75 * t);
      const c3 = Math.sin(2 * Math.PI * root * 4.5 * t);
      const skank = (c1 + c2 + c3) * 0.15 * Math.exp(-upbeat * 10);
      sample += skank;
    }

    const hookNotes = [root * 2, root * 2.25, root * 2.5, root * 3];
    const hookIdx = Math.floor(beat) % hookNotes.length;
    const hTime = beat % 1;
    const hFreq = hookNotes[hookIdx];
    const hook = Math.sin(2 * Math.PI * hFreq * t) * Math.exp(-hTime * 3) * 0.2;
    sample += hook;

    const bTime = (beat * 2) % 1;
    const bass = Math.sin(2 * Math.PI * root * t) * Math.exp(-bTime * 2.5) * 0.35;
    sample += bass;

    const shakerTime = (beat * 4) % 1;
    if (shakerTime < 0.1) {
      sample += (Math.random() * 2 - 1) * Math.exp(-shakerTime * 35) * 0.09;
    }

    if (t > duration - 2) {
      sample *= (duration - t) / 2;
    }
    out[i] = sample * 0.75;
  }
  return out;
}

// Track 5: 'Cierre Triunfal' (Épico / Festival Anthem, 132 BPM, C Major, 30s)
function genAnthem(duration = 30) {
  const numSamples = sr * duration;
  const out = new Float32Array(numSamples);
  const bpm = 132;
  const beatDuration = 60 / bpm;
  const chords = [
    [130.8, 164.8, 196, 261.6],  // C
    [98, 123.5, 146.8, 196],     // G
    [110, 130.8, 164.8, 220],    // Am
    [87.3, 110, 130.8, 174.6]    // F
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sr;
    const beat = t / beatDuration;
    const bar = Math.floor(beat / 4);
    const chord = chords[bar % chords.length];

    let sample = 0;

    const kTime = beat % 1;
    if (kTime < 0.25) {
      const freq = 140 * Math.exp(-kTime * 28) + 45;
      sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-kTime * 15) * 0.75;
    }

    const beatInBar = beat % 4;
    if ((beatInBar >= 1 && beatInBar < 1.4) || (beatInBar >= 3 && beatInBar < 3.4)) {
      const sTime = beatInBar >= 3 ? (beatInBar - 3) : (beatInBar - 1);
      const clap = (Math.random() * 2 - 1) * Math.exp(-sTime * 9) * 0.4;
      sample += clap;
    }

    let saw = 0;
    for (let h = 1; h <= 4; h++) {
      saw += (1 / h) * Math.sin(2 * Math.PI * chord[0] * h * t);
      saw += (0.8 / h) * Math.sin(2 * Math.PI * chord[2] * h * t);
      saw += (0.6 / h) * Math.sin(2 * Math.PI * chord[3] * h * t);
    }
    sample += saw * 0.12;

    const pump = Math.min(1, kTime * 3);
    const bass = Math.sin(2 * Math.PI * (chord[0] / 2) * t) * 0.35 * pump;
    sample += bass;

    const barTime = beat % 4;
    if (barTime < 0.6) {
      sample += (Math.random() * 2 - 1) * Math.exp(-barTime * 4) * 0.2;
    }

    if (t > duration - 2) {
      sample *= (duration - t) / 2;
    }
    out[i] = sample * 0.8;
  }
  return out;
}

const tracks = [
  { name: 'sample_01_groove_apertura', fn: genGroove },
  { name: 'sample_02_balada_medianoche', fn: genBalada },
  { name: 'sample_03_fuego_asfalto', fn: genRock },
  { name: 'sample_04_brisa_mediterranea', fn: genFiesta },
  { name: 'sample_05_cierre_triunfal', fn: genAnthem }
];

for (const { name, fn } of tracks) {
  const wavPath = `/tmp/${name}.wav`;
  const mp3Path = path.join(outDir, `${name}.mp3`);
  console.log(`Generating ${name}...`);
  const data = fn(30);
  writeWav(wavPath, sr, 1, data);
  execSync(`ffmpeg -i "${wavPath}" -c:a libmp3lame -b:a 128k -y "${mp3Path}"`);
  if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
  console.log(`Saved ${mp3Path} (${fs.statSync(mp3Path).size} bytes)`);
}

console.log('Done generating all 5 audio samples!');
