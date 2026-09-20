import { parseTonalidad, ParsedKey } from './harmonicAnalysis';
import { TransitionConfig, TransitionTimeline } from './transitionAudioEngine';

// Frecuencias base para notas MIDI
function midiToFreq(midi: number): number {
 return 440 * Math.pow(2, (midi - 69) / 12);
}

// Devuelve los números MIDI de un acorde según su tonalidad (tónica, 3ª, 5ª, 8ª)
function getChordMidiNotes(key: ParsedKey | null): number[] {
 if (!key) return [57, 60, 64, 69]; // Am default (A3, C4, E4, A4)
 const rootMidi = 48 + key.pitchClass; // Octava 3 (Do3 = 48)
 const thirdInterval = key.isMinor ? 3 : 4;
 const fifthInterval = 7;
 const octaveInterval = 12;

 return [
 rootMidi,
 rootMidi + thirdInterval,
 rootMidi + fifthInterval,
 rootMidi + octaveInterval
 ];
}

export interface SyntheticPlayerController {
 stop: () => void;
 setVolume: (volume: number) => void;
 getCurrentTime: () => number;
}

export function playSyntheticTransition(
 keyA: string | null | undefined,
 bpmA: number | null | undefined,
 keyB: string | null | undefined,
 bpmB: number | null | undefined,
 timeline: TransitionTimeline,
 config: TransitionConfig,
 volume: number = 0.8,
 onProgress?: (timeSec: number) => void,
 onEnded?: () => void
): SyntheticPlayerController {
 const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
 if (!AudioCtxClass) {
 return { stop: () => {}, setVolume: () => {}, getCurrentTime: () => 0 };
 }

 const ctx = new AudioCtxClass();
 const masterGain = ctx.createGain();
 masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
 masterGain.connect(ctx.destination);

 const parsedKeyA = parseTonalidad(keyA);
 const parsedKeyB = parseTonalidad(keyB);
 const notesA = getChordMidiNotes(parsedKeyA);
 const notesB = getChordMidiNotes(parsedKeyB);

 const tempoA = Math.max(50, Math.min(220, bpmA || 110));
 const tempoB = Math.max(50, Math.min(220, bpmB || 120));

 const startTime = ctx.currentTime + 0.05;
 const nodesToClean: Array<{ stop?: (time?: number) => void; disconnect?: () => void }> = [];

 // Pista A (Harmonic Pad & Rhythm)
 const gainA = ctx.createGain();
 gainA.connect(masterGain);

 // Pista B (Harmonic Pad & Rhythm)
 const gainB = ctx.createGain();
 gainB.connect(masterGain);

 const createHarmonicPad = (
 notes: number[],
 targetGain: GainNode,
 padStartTime: number,
 padDuration: number
 ) => {
 notes.forEach((midiNote, idx) => {
 const osc = ctx.createOscillator();
 const filter = ctx.createBiquadFilter();
 const noteGain = ctx.createGain();

 osc.type = idx === 0 ? 'triangle' : 'sine';
 osc.frequency.setValueAtTime(midiToFreq(midiNote), padStartTime);

 filter.type = 'lowpass';
 filter.frequency.setValueAtTime(800 + idx * 250, padStartTime);

 noteGain.gain.setValueAtTime(0.001, padStartTime);
 noteGain.gain.exponentialRampToValueAtTime(0.18 / notes.length, padStartTime + 0.3);
 noteGain.gain.setValueAtTime(0.18 / notes.length, padStartTime + Math.max(0.4, padDuration - 0.5));
 noteGain.gain.exponentialRampToValueAtTime(0.001, padStartTime + padDuration);

 osc.connect(filter);
 filter.connect(noteGain);
 noteGain.connect(targetGain);

 osc.start(padStartTime);
 osc.stop(padStartTime + padDuration + 0.1);
 nodesToClean.push(osc, filter, noteGain);
 });
 };

 const createRhythmPulses = (
 bpm: number,
 targetGain: GainNode,
 pulseStartTime: number,
 duration: number
 ) => {
 const beatInterval = 60 / bpm;
 const numBeats = Math.floor(duration / beatInterval);

 for (let i = 0; i < numBeats; i++) {
 const beatTime = pulseStartTime + i * beatInterval;
 if (beatTime >= pulseStartTime + duration) break;

 const clickOsc = ctx.createOscillator();
 const clickGain = ctx.createGain();

 const isDownbeat = i % 4 === 0;
 clickOsc.frequency.setValueAtTime(isDownbeat ? 220 : 150, beatTime);
 clickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.06);

 clickGain.gain.setValueAtTime(isDownbeat ? 0.25 : 0.12, beatTime);
 clickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.08);

 clickOsc.connect(clickGain);
 clickGain.connect(targetGain);

 clickOsc.start(beatTime);
 clickOsc.stop(beatTime + 0.09);
 nodesToClean.push(clickOsc, clickGain);
 }
 };

 // Schedule Song A
 const songADuration = timeline.songAEndSec - timeline.songAStartSec;
 createHarmonicPad(notesA, gainA, startTime, songADuration);
 createRhythmPulses(tempoA, gainA, startTime, songADuration);

 // Schedule Song B
 const songBStartCtx = startTime + timeline.songBStartSec;
 const songBDuration = timeline.songBEndSec - timeline.songBStartSec;
 createHarmonicPad(notesB, gainB, songBStartCtx, songBDuration);
 createRhythmPulses(tempoB, gainB, songBStartCtx, songBDuration);

 // Automation of volume transitions
 if (config.style === 'crossfade') {
 const fadeStartCtx = startTime + timeline.crossfadeStartSec;
 const fadeEndCtx = startTime + timeline.crossfadeEndSec;

 // Fade out A
 gainA.gain.setValueAtTime(1, startTime);
 gainA.gain.setValueAtTime(1, fadeStartCtx);
 gainA.gain.linearRampToValueAtTime(0.001, fadeEndCtx);
 gainA.gain.setValueAtTime(0, fadeEndCtx + 0.01);

 // Fade in B
 gainB.gain.setValueAtTime(0, startTime);
 gainB.gain.setValueAtTime(0.001, fadeStartCtx);
 gainB.gain.linearRampToValueAtTime(1, fadeEndCtx);
 gainB.gain.setValueAtTime(1, startTime + timeline.totalDurationSec);
 } else if (config.style === 'segue') {
 const cutCtx = startTime + timeline.songAEndSec;
 gainA.gain.setValueAtTime(1, startTime);
 gainA.gain.setValueAtTime(1, cutCtx - 0.01);
 gainA.gain.setValueAtTime(0, cutCtx);

 gainB.gain.setValueAtTime(0, startTime);
 gainB.gain.setValueAtTime(0, cutCtx - 0.01);
 gainB.gain.setValueAtTime(1, cutCtx);
 } else {
 // Pause style
 const cutACtx = startTime + timeline.songAEndSec;
 const startBCtx = startTime + timeline.songBStartSec;

 gainA.gain.setValueAtTime(1, startTime);
 gainA.gain.setValueAtTime(1, cutACtx - 0.01);
 gainA.gain.setValueAtTime(0, cutACtx);

 gainB.gain.setValueAtTime(0, startTime);
 gainB.gain.setValueAtTime(0, startBCtx - 0.01);
 gainB.gain.setValueAtTime(1, startBCtx);
 }

 let isStopped = false;
 let animId: number | null = null;

 const tick = () => {
 if (isStopped) return;
 const elapsed = Math.max(0, ctx.currentTime - startTime);
 onProgress?.(elapsed);

 if (elapsed >= timeline.totalDurationSec) {
 onProgress?.(timeline.totalDurationSec);
 onEnded?.();
 return;
 }
 animId = requestAnimationFrame(tick);
 };

 animId = requestAnimationFrame(tick);

 return {
 stop: () => {
 isStopped = true;
 if (animId !== null) cancelAnimationFrame(animId);
 try {
 nodesToClean.forEach((n) => {
 try {
 n.stop?.();
 n.disconnect?.();
 } catch {
 /* no-op */
 }
 });
 ctx.close();
 } catch {
 /* no-op */
 }
 },
 setVolume: (vol: number) => {
 try {
 masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), ctx.currentTime);
 } catch {
 /* no-op */
 }
 },
 getCurrentTime: () => {
 if (isStopped) return 0;
 return Math.max(0, ctx.currentTime - startTime);
 }
 };
}
