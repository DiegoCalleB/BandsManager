import { describe, it, expect } from' vitest';
import {
 computeTransitionTimeline,
 getTransitionGains,
 diagnoseTransition,
 DEFAULT_TRANSITION_CONFIG,
 resolveSongAudioUrl
} from' ../transitionAudioEngine';
import { Song } from' ../../types';

describe('transitionAudioEngine', () => {
 it('computeTransitionTimeline calcula correctamente los tiempos de crossfade', () => {
 const timeline = computeTransitionTimeline({
 style:' crossfade',
 fadeDurationSec: 5,
 tailDurationSec: 8,
 headDurationSec: 8,
 pauseDurationSec: 2
 });

 expect(timeline.songAStartSec).toBe(0);
 expect(timeline.songAEndSec).toBe(8);
 expect(timeline.songBStartSec).toBe(3); // 8 - 5 = 3
 expect(timeline.songBEndSec).toBe(11); // 3 + 8 = 11
 expect(timeline.crossfadeStartSec).toBe(3);
 expect(timeline.crossfadeEndSec).toBe(8);
 expect(timeline.totalDurationSec).toBe(11);
 });

 it('computeTransitionTimeline calcula correctamente los tiempos de segue (corte seco)', () => {
 const timeline = computeTransitionTimeline({
 style:' segue',
 fadeDurationSec: 5,
 tailDurationSec: 8,
 headDurationSec: 8,
 pauseDurationSec: 2
 });

 expect(timeline.songAStartSec).toBe(0);
 expect(timeline.songAEndSec).toBe(8);
 expect(timeline.songBStartSec).toBe(8);
 expect(timeline.songBEndSec).toBe(16);
 expect(timeline.crossfadeStartSec).toBe(8);
 expect(timeline.crossfadeEndSec).toBe(8);
 expect(timeline.totalDurationSec).toBe(16);
 });

 it('computeTransitionTimeline calcula correctamente los tiempos con pausa/interludio', () => {
 const timeline = computeTransitionTimeline({
 style:' pause',
 fadeDurationSec: 5,
 tailDurationSec: 6,
 headDurationSec: 6,
 pauseDurationSec: 3
 });

 expect(timeline.songAStartSec).toBe(0);
 expect(timeline.songAEndSec).toBe(6);
 expect(timeline.songBStartSec).toBe(9); // 6 + 3 = 9
 expect(timeline.songBEndSec).toBe(15); // 9 + 6 = 15
 expect(timeline.totalDurationSec).toBe(15);
 });

 it('getTransitionGains calcula las ganancias en crossfade', () => {
 const config = {
 style:' crossfade' as const,
 fadeDurationSec: 4,
 tailDurationSec: 8,
 headDurationSec: 8,
 pauseDurationSec: 2
 };
 const timeline = computeTransitionTimeline(config);

 // En t=0 (solo pista A)
 const gainsStart = getTransitionGains(0, timeline, config);
 expect(gainsStart.gainA).toBe(1);
 expect(gainsStart.gainB).toBe(0);
 expect(gainsStart.isPlayingA).toBe(true);
 expect(gainsStart.isCrossfading).toBe(false);

 // En t=6 (mitad del fundido de 4s que va de 4 a 8)
 const gainsMid = getTransitionGains(6, timeline, config);
 expect(gainsMid.gainA).toBeCloseTo(Math.SQRT1_2, 3);
 expect(gainsMid.gainB).toBeCloseTo(Math.SQRT1_2, 3);
 expect(gainsMid.isCrossfading).toBe(true);

 // En t=10 (solo pista B)
 const gainsEnd = getTransitionGains(10, timeline, config);
 expect(gainsEnd.gainA).toBe(0);
 expect(gainsEnd.gainB).toBe(1);
 expect(gainsEnd.isPlayingB).toBe(true);
 expect(gainsEnd.isCrossfading).toBe(false);
 });

 it('diagnoseTransition detecta compatibilidad armónica y salto de BPM', () => {
 const songA: Song = {
 id:' song-1',
 bandId:' band-1',
 titulo:' Canción A',
 tonalidad:' Lam',
 bpm: 120,
 energia: 10,
 duracionMinutos: 3
 };

 const songB: Song = {
 id:' song-2',
 bandId:' band-1',
 titulo:' Canción B',
 tonalidad:' Lam',
 bpm: 122,
 energia: 12,
 duracionMinutos: 4
 };

 const diag = diagnoseTransition(songA, songB);
 expect(diag.harmonyStatus).toBe('identica');
 expect(diag.bpmDelta).toBe(2);
 expect(diag.energyDelta).toBe(2);
 expect(diag.scorePercent).toBeGreaterThanOrEqual(90);
 expect(diag.verdict.status).toBe('excelente');
 expect(diag.porQueSi.length).toBeGreaterThan(0);
 expect(diag.porQueSi.some(p => p.category ===' armonia')).toBe(true);
 expect(diag.stageRecommendations.length).toBeGreaterThan(0);
 });

 it('diagnoseTransition detecta choque armónico y genera críticas en porQueNo', () => {
 const songA: Song = {
 id:' song-1',
 bandId:' band-1',
 titulo:' Canción A',
 tonalidad:' Do',
 bpm: 90,
 energia: 8,
 duracionMinutos: 3
 };

 const songB: Song = {
 id:' song-2',
 bandId:' band-1',
 titulo:' Canción B',
 tonalidad:' Fa#', // Tritono en círculo de quintas (distancia 6 -> choque)
 bpm: 140, // Gran salto de tempo (+50 BPM)
 energia: 18,
 duracionMinutos: 4
 };

 const diag = diagnoseTransition(songA, songB);
 expect(diag.harmonyStatus).toBe('choque');
 expect(diag.bpmDelta).toBe(50);
 expect(diag.recommendedStyle).toBe('pause');
 expect(diag.porQueNo.length).toBeGreaterThan(0);
 expect(diag.porQueNo.some(c => c.severity ===' critico')).toBe(true);
 expect(diag.verdict.status).toBe('desaconsejada');
 expect(diag.stageRecommendations.length).toBeGreaterThan(0);
 expect(diag.tips.length).toBeGreaterThan(0);
 });

 it('resolveSongAudioUrl obtiene url de demo o ideas', () => {
 const songWithUrl: Song = {
 id:' song-1',
 bandId:' band-1',
 titulo:' Tema 1',
 audioPrincipalUrl:' https://example.com/audio.mp3',
 duracionMinutos: 3
 };
 expect(resolveSongAudioUrl(songWithUrl)).toBe('https://example.com/audio.mp3');

 const songWithIdeas: Song = {
 id:' song-2',
 bandId:' band-1',
 titulo:' Tema 2',
 audioIdeas: [{ id:' idea-1', titulo:' Solo', audioUrl:' https://example.com/idea.mp3', tipo:' guitarra' }],
 duracionMinutos: 3
 };
 expect(resolveSongAudioUrl(songWithIdeas)).toBe('https://example.com/idea.mp3');
 });
});
