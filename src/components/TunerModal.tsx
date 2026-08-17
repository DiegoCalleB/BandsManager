import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Guitar, Zap, Radio, Check, RefreshCw } from 'lucide-react';
import { ThemeColors } from '../types';

interface TunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors?: ThemeColors;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PresetString {
  note: string;
  octave: number;
  freq: number;
  label: string; // e.g. "6ª - E2"
}

export interface TunerPreset {
  id: string;
  name: string;
  category: 'guitar' | 'bass' | 'ukulele';
  description?: string;
  strings: PresetString[];
}

export const TunerPresets: TunerPreset[] = [
  {
    id: 'guitar_std',
    name: 'Guitarra Estándar (E A D G B E)',
    category: 'guitar',
    description: '6 cuerdas estándar (Mi, La, Re, Sol, Si, Mi)',
    strings: [
      { note: 'E', octave: 2, freq: 82.41, label: '6ª cuerda - E2 (Grave)' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4 (Aguda)' },
    ]
  },
  {
    id: 'guitar_dropd',
    name: 'Guitarra Drop D (D A D G B E)',
    category: 'guitar',
    description: 'Afinación en Re grave para rock y metal',
    strings: [
      { note: 'D', octave: 2, freq: 73.42, label: '6ª cuerda - D2 (Drop D)' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4' },
    ]
  },
  {
    id: 'guitar_7',
    name: 'Guitarra 7 Cuerdas (B E A D G B E)',
    category: 'guitar',
    description: 'Guitarra de rango extendido con Si grave',
    strings: [
      { note: 'B', octave: 1, freq: 61.74, label: '7ª cuerda - B1' },
      { note: 'E', octave: 2, freq: 82.41, label: '6ª cuerda - E2' },
      { note: 'A', octave: 2, freq: 110.00, label: '5ª cuerda - A2' },
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4' },
    ]
  },
  {
    id: 'ukulele_std',
    name: 'Ukelele Estándar / High-G (G C E A)',
    category: 'ukulele',
    description: 'Afinación reentrante tradicional (Soprano, Concierto, Tenor)',
    strings: [
      { note: 'G', octave: 4, freq: 392.00, label: '4ª cuerda - G4 (Sol agudo / High-G)' },
      { note: 'C', octave: 4, freq: 261.63, label: '3ª cuerda - C4 (Do)' },
      { note: 'E', octave: 4, freq: 329.63, label: '2ª cuerda - E4 (Mi)' },
      { note: 'A', octave: 4, freq: 440.00, label: '1ª cuerda - A4 (La)' },
    ]
  },
  {
    id: 'ukulele_lowg',
    name: 'Ukelele Low-G (G C E A - Sol Grave)',
    category: 'ukulele',
    description: 'Sol grave en 4ª cuerda, ideal para melodías y fingerpicking',
    strings: [
      { note: 'G', octave: 3, freq: 196.00, label: '4ª cuerda - G3 (Sol grave / Low-G)' },
      { note: 'C', octave: 4, freq: 261.63, label: '3ª cuerda - C4 (Do)' },
      { note: 'E', octave: 4, freq: 329.63, label: '2ª cuerda - E4 (Mi)' },
      { note: 'A', octave: 4, freq: 440.00, label: '1ª cuerda - A4 (La)' },
    ]
  },
  {
    id: 'ukulele_baritone',
    name: 'Ukelele Barítono (D G B E)',
    category: 'ukulele',
    description: 'Afinación estándar del ukelele barítono (Re, Sol, Si, Mi)',
    strings: [
      { note: 'D', octave: 3, freq: 146.83, label: '4ª cuerda - D3 (Re)' },
      { note: 'G', octave: 3, freq: 196.00, label: '3ª cuerda - G3 (Sol)' },
      { note: 'B', octave: 3, freq: 246.94, label: '2ª cuerda - B3 (Si)' },
      { note: 'E', octave: 4, freq: 329.63, label: '1ª cuerda - E4 (Mi)' },
    ]
  },
  {
    id: 'ukulele_d',
    name: 'Ukelele Afinación en D (A D F# B)',
    category: 'ukulele',
    description: 'Afinación hawaiana tradicional un tono más aguda',
    strings: [
      { note: 'A', octave: 4, freq: 440.00, label: '4ª cuerda - A4 (La)' },
      { note: 'D', octave: 4, freq: 293.66, label: '3ª cuerda - D4 (Re)' },
      { note: 'F#', octave: 4, freq: 369.99, label: '2ª cuerda - F#4 (Fa#)' },
      { note: 'B', octave: 4, freq: 493.88, label: '1ª cuerda - B4 (Si)' },
    ]
  },
  {
    id: 'bass_4',
    name: 'Bajo Eléctrico 4 Cuerdas (E A D G)',
    category: 'bass',
    description: '4 cuerdas estándar (Mi, La, Re, Sol)',
    strings: [
      { note: 'E', octave: 1, freq: 41.20, label: '4ª cuerda - E1 (Grave)' },
      { note: 'A', octave: 1, freq: 55.00, label: '3ª cuerda - A1' },
      { note: 'D', octave: 2, freq: 73.42, label: '2ª cuerda - D2' },
      { note: 'G', octave: 2, freq: 98.00, label: '1ª cuerda - G2 (Aguda)' },
    ]
  },
  {
    id: 'bass_5',
    name: 'Bajo Eléctrico 5 Cuerdas (B E A D G)',
    category: 'bass',
    description: '5 cuerdas con Si super grave adicional',
    strings: [
      { note: 'B', octave: 0, freq: 30.87, label: '5ª cuerda - B0 (Super Grave)' },
      { note: 'E', octave: 1, freq: 41.20, label: '4ª cuerda - E1' },
      { note: 'A', octave: 1, freq: 55.00, label: '3ª cuerda - A1' },
      { note: 'D', octave: 2, freq: 73.42, label: '2ª cuerda - D2' },
      { note: 'G', octave: 2, freq: 98.00, label: '1ª cuerda - G2' },
    ]
  }
];

// Helper to convert frequency to closest note
function getNoteFromFrequency(frequency: number) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
  const roundedNoteNum = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNoteNum) * 100);
  const noteIndex = (roundedNoteNum % 12 + 12) % 12;
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const exactFreq = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);

  return {
    noteName,
    octave,
    cents,
    exactFreq,
    fullNote: `${noteName}${octave}`
  };
}

// Time-domain autocorrelation algorithm
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1; // Too quiet

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  const slicedBuf = buf.slice(r1, r2);
  const bufLen = slicedBuf.length;

  const c = new Float32Array(bufLen);
  for (let i = 0; i < bufLen; i++) {
    for (let j = 0; j < bufLen - i; j++) {
      c[i] = c[i] + slicedBuf[j] * slicedBuf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < bufLen; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  if (T0 > 0 && T0 < bufLen - 1) {
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) {
      T0 = T0 - b / (2 * a);
    }
  }

  return sampleRate / T0;
}

export function TunerModal({ isOpen, onClose }: TunerModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('guitar_std');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'guitar' | 'ukulele' | 'bass'>('all');
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [pitch, setPitch] = useState<{
    freq: number;
    noteName: string;
    octave: number;
    cents: number;
    fullNote: string;
  } | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // Reference tone playback
  const [playingToneFreq, setPlayingToneFreq] = useState<number | null>(null);

  // Audio Context & Stream refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const toneOscRef = useRef<OscillatorNode | null>(null);

  const currentPreset = TunerPresets.find(p => p.id === selectedPresetId) || TunerPresets[0];

  const filteredPresets = selectedCategory === 'all' 
    ? TunerPresets 
    : TunerPresets.filter(p => p.category === selectedCategory);

  // Start Mic Listening
  const startTuner = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError("Tu navegador o entorno no soporta captura de micrófono. Puedes usar los Tonos de Referencia con sintetizador para afinar de oído.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setMicError("El navegador no soporta Web Audio API.");
        return;
      }
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096; // Large window for low bass frequencies
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      updatePitchLoop();
    } catch (err: any) {
      console.warn("Microphone access warning:", err?.message || err);
      const isPermissionDenied = 
        err?.name === 'NotAllowedError' || 
        err?.name === 'PermissionDeniedError' || 
        String(err?.message || '').toLowerCase().includes('permission denied');

      if (isPermissionDenied) {
        setMicError("Permiso de micrófono no concedido. Puedes habilitar el micrófono en el icono de permisos del navegador o pulsar abajo en las cuerdas para afinar con el sintetizador.");
      } else {
        setMicError("No se pudo iniciar el micrófono (" + (err?.message || "dispositivo no disponible") + "). Puedes usar los Tonos de Referencia.");
      }
      setIsListening(false);
    }
  };

  // Stop Mic Listening
  const stopTuner = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setPitch(null);
  };

  // Continuous Pitch Update Loop
  const updatePitchLoop = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const detectedFreq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    if (detectedFreq !== -1 && detectedFreq >= 25 && detectedFreq <= 1000) {
      const noteInfo = getNoteFromFrequency(detectedFreq);
      setPitch({
        freq: Math.round(detectedFreq * 10) / 10,
        noteName: noteInfo.noteName,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
        fullNote: noteInfo.fullNote
      });
    }

    animFrameRef.current = requestAnimationFrame(updatePitchLoop);
  };

  // Reference Tone Generator (Play note sound for tuning by ear)
  const togglePlayReferenceTone = (freq: number) => {
    if (playingToneFreq === freq) {
      stopReferenceTone();
      return;
    }

    stopReferenceTone();

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm harmonic tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      toneOscRef.current = osc;
      setPlayingToneFreq(freq);
    } catch (err) {
      console.error("Reference tone error:", err);
    }
  };

  const stopReferenceTone = () => {
    if (toneOscRef.current) {
      try {
        toneOscRef.current.stop();
        toneOscRef.current.disconnect();
      } catch (e) {}
      toneOscRef.current = null;
    }
    setPlayingToneFreq(null);
  };

  // Stop everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopTuner();
      stopReferenceTone();
    }
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTuner();
      stopReferenceTone();
    };
  }, []);

  if (!isOpen) return null;

  // Calculate meter needle position (-50 cents to +50 cents -> 0% to 100%)
  const currentCents = pitch ? pitch.cents : 0;
  const needlePercent = Math.min(100, Math.max(0, ((currentCents + 50) / 100) * 100));
  const isTunedIn = pitch && Math.abs(pitch.cents) <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-zinc-900 via-neutral-950 to-black border border-emerald-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Guitar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Afinador Pro Guitarra, Bajo & Ukelele
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Precision Autocorrelation
                </span>
              </h3>
              <p className="text-xs text-neutral-400">Detección cromática en tiempo real vía micrófono</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTuner();
              stopReferenceTone();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Instrument Filter & Preset Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                Instrumento y Afinación:
              </label>

              {/* Instrument Category Filter Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                {(['all', 'guitar', 'ukulele', 'bass'] as const).map((cat) => {
                  const labels = {
                    all: 'Todos',
                    guitar: 'Guitarra',
                    ukulele: 'Ukelele',
                    bass: 'Bajo'
                  };
                  const isCatSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        // If current preset not in filtered category, switch to the first preset of category
                        if (cat !== 'all' && currentPreset.category !== cat) {
                          const firstInCat = TunerPresets.find(p => p.category === cat);
                          if (firstInCat) {
                            setSelectedPresetId(firstInCat.id);
                            setSelectedStringIndex(null);
                          }
                        }
                      }}
                      className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        isCatSelected
                          ? 'bg-emerald-500 text-zinc-950 shadow-xs'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {labels[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setSelectedStringIndex(null);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    selectedPresetId === p.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-sm'
                      : 'bg-white/5 text-neutral-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{p.name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono shrink-0 uppercase ${
                        p.category === 'ukulele'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : p.category === 'bass'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {p.category === 'ukulele' ? 'Uke' : p.category === 'bass' ? 'Bajo' : 'Guitar'}
                      </span>
                    </div>
                    {p.description && (
                      <span className="text-[10px] text-neutral-400 font-normal truncate mt-0.5">
                        {p.description}
                      </span>
                    )}
                  </div>
                  {selectedPresetId === p.id && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Visual Tuner Display */}
          <div className="bg-black/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            
            {/* Tuning needle meter bar */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-amber-400 font-bold">-50 Cents (Grave)</span>
                <span className={`font-bold ${isTunedIn ? 'text-emerald-400 text-xs font-black animate-bounce' : 'text-emerald-300'}`}>
                  {isTunedIn ? '¡AFINADO PERFECTO!' : '0 Cents'}
                </span>
                <span className="text-rose-400 font-bold">+50 Cents (Agudo)</span>
              </div>

              {/* Meter track */}
              <div className="w-full bg-neutral-900 h-6 rounded-full border border-neutral-700 relative overflow-hidden flex items-center px-1">
                {/* Center target indicator */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-2 bg-emerald-500/40 z-0" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-emerald-400 z-10" />

                {/* Needle pointer */}
                <div 
                  className={`absolute top-0.5 bottom-0.5 w-3.5 rounded-full transition-all duration-100 z-20 shadow-md ${
                    isTunedIn 
                      ? 'bg-emerald-400 shadow-emerald-500/80 scale-110' 
                      : currentCents < -5 
                      ? 'bg-amber-400 shadow-amber-500/50' 
                      : 'bg-rose-400 shadow-rose-500/50'
                  }`}
                  style={{ left: `calc(${needlePercent}% - 7px)` }}
                />
              </div>
            </div>

            {/* Note & Frequency Big Readout */}
            <div className="my-5 flex flex-col items-center justify-center min-h-[90px]">
              {isListening && pitch ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-100">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-6xl font-black font-display tracking-tight ${
                      isTunedIn ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]' : 'text-white'
                    }`}>
                      {pitch.noteName}
                    </span>
                    <span className="text-2xl font-mono text-neutral-400 font-bold">
                      {pitch.octave}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 font-mono text-xs">
                    <span className="text-neutral-300 font-bold">
                      {pitch.freq} Hz
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      isTunedIn 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : pitch.cents < 0 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {pitch.cents > 0 ? `+${pitch.cents}` : pitch.cents} Cents
                    </span>
                  </div>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center gap-2 text-neutral-400 py-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs font-mono">Escuchando instrumento... Toca una cuerda</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-500 py-2">
                  <MicOff className="w-8 h-8 opacity-40" />
                  <span className="text-xs font-mono text-neutral-400">Micrófono desactivado</span>
                </div>
              )}
            </div>

            {/* Mic Toggle Button */}
            <button
              onClick={isListening ? stopTuner : startTuner}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Pausar Micrófono
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Activar Micrófono Afinador
                </>
              )}
            </button>

            {micError && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 w-full text-left space-y-2">
                <div className="flex items-start gap-2 text-amber-300 text-xs font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <p className="leading-snug">{micError}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                  <button
                    onClick={() => {
                      if (currentPreset.strings[0]) {
                        setSelectedStringIndex(0);
                        togglePlayReferenceTone(currentPreset.strings[0].freq);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[10px] font-mono hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    Afinar con Sintetizador ({currentPreset.strings[0]?.note})
                  </button>
                  <button
                    onClick={startTuner}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reintentar micrófono
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive String Pitch Buttons & Reference Tones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Cuerdas Objetivo & Tonos de Referencia:
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Toca un tono para oírlo</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentPreset.strings.map((str, idx) => {
                const isTonePlaying = playingToneFreq === str.freq;
                const isSelected = selectedStringIndex === idx;

                return (
                  <button
                    key={`${str.note}_${str.octave}_${idx}`}
                    onClick={() => {
                      setSelectedStringIndex(idx);
                      togglePlayReferenceTone(str.freq);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isTonePlaying
                        ? 'bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-md scale-105'
                        : isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold'
                        : 'bg-white/5 text-neutral-300 border-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-black text-sm">{str.note}{str.octave}</span>
                      {isTonePlaying && <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
                    </div>
                    <span className="text-[10px] text-neutral-400 opacity-90 truncate max-w-full">
                      {str.freq} Hz
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-white/5 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span>Soporta afinación de Guitarra eléctrica/acústica, Bajo y Ukelele (Soprano, Concierto, Tenor y Barítono).</span>
          <button
            onClick={() => {
              stopTuner();
              stopReferenceTone();
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
