import { useState, useEffect, useRef } from 'react';
import { Setlist, Song } from '../types';
import { resolveAudioUrl } from '../utils/audioStorage';

export function useStagePlayer(
  activeSetlist: Setlist | null,
  songs: Song[],
  parseMmSsToSeconds: (timeStr: string) => number
) {
 // Stage Mode Concert Player State (Modo Escenario)
 const [stagePlayingIndex, setStagePlayingIndex] = useState<number | null>(null);
 const [stageIsPlaying, setStageIsPlaying] = useState<boolean>(false);
 const [stageAutoplayNext, setStageAutoplayNext] = useState<boolean>(true);
 const [stageCurrentTime, setStageCurrentTime] = useState<number>(0);
 const [stageItemDuration, setStageItemDuration] = useState<number>(210);
 const [stageResolvedUrl, setStageResolvedUrl] = useState<string>('');
 const stageAudioRef = useRef<HTMLAudioElement | null>(null);
 const stageSynthIntervalRef = useRef<any>(null);
 const stageAudioCtxRef = useRef<AudioContext | null>(null);

 // Effect when active playing index changes in Stage Mode (Modo Escenario)
 useEffect(() => {
 if (stagePlayingIndex === null || !activeSetlist || !activeSetlist.items[stagePlayingIndex]) {
 setStageResolvedUrl('');
 setStageCurrentTime(0);
 return;
 }

 const item = activeSetlist.items[stagePlayingIndex];
 setStageCurrentTime(0);

 let rawUrl = '';
 let durationSec = 180;

 if (item.tipoItem === 'cancion' && item.songId) {
 const song = songs.find(s => s.id === item.songId);
 if (song) {
 rawUrl = song.audioPrincipalUrl || (song.audioIdeas && song.audioIdeas[0]?.audioUrl) || (song as any).audioUrl || '';
 durationSec = song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210;
 }
 } else {
 rawUrl = item.audioUrl || '';
 durationSec = item.duracionEstimadaSegundos ?? ((item.duracionEstimadaMinutos || 2) * 60);
 }

 setStageItemDuration(durationSec > 0 ? durationSec : 120);

 if (rawUrl) {
 resolveAudioUrl(rawUrl).then(resolved => {
 setStageResolvedUrl(resolved);
 if (stageAudioRef.current) {
 stageAudioRef.current.src = resolved;
 if (stageIsPlaying) {
 stageAudioRef.current.play().catch(console.warn);
 }
 }
 }).catch(() => setStageResolvedUrl(''));
 } else {
 setStageResolvedUrl('');
 }
 }, [stagePlayingIndex, activeSetlist, songs]);

 // Synthetic timer when no real audio file exists in Stage Mode
 useEffect(() => {
 if (stageIsPlaying && !stageResolvedUrl && stagePlayingIndex !== null && activeSetlist) {
 stageSynthIntervalRef.current = setInterval(() => {
 setStageCurrentTime(prev => {
 const next = prev + 1;
 if (next >= stageItemDuration) {
 // Current track / speech finished -> Auto move to next item if autoplay enabled
 if (stageAutoplayNext && stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 } else {
 setStageIsPlaying(false);
 setStagePlayingIndex(null);
 }
 return 0;
 }
 return next;
 });

 // Subtle beat tone for simulation
 try {
 if (!stageAudioCtxRef.current) {
 stageAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
 }
 if (stageAudioCtxRef.current.state === 'suspended') {
 stageAudioCtxRef.current.resume();
 }
 const osc = stageAudioCtxRef.current.createOscillator();
 const gain = stageAudioCtxRef.current.createGain();
 osc.type = 'triangle';
 osc.frequency.setValueAtTime(520, stageAudioCtxRef.current.currentTime);
 gain.gain.setValueAtTime(0.02, stageAudioCtxRef.current.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, stageAudioCtxRef.current.currentTime + 0.06);
 osc.connect(gain);
 gain.connect(stageAudioCtxRef.current.destination);
 osc.start();
 osc.stop(stageAudioCtxRef.current.currentTime + 0.06);
 } catch {}
 }, 1000);
 } else {
 if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
 }

 return () => {
 if (stageSynthIntervalRef.current) clearInterval(stageSynthIntervalRef.current);
 };
 }, [stageIsPlaying, stageResolvedUrl, stagePlayingIndex, stageItemDuration, stageAutoplayNext, activeSetlist]);

 // Handlers for Stage Mode Concert Player Controls
 const toggleStagePlayPause = () => {
 if (!activeSetlist || activeSetlist.items.length === 0) return;

 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 return;
 }

 if (stageResolvedUrl && stageAudioRef.current) {
 if (stageIsPlaying) {
 stageAudioRef.current.pause();
 setStageIsPlaying(false);
 } else {
 stageAudioRef.current.play().then(() => setStageIsPlaying(true)).catch(console.error);
 }
 } else {
 setStageIsPlaying(!stageIsPlaying);
 }
 };

 const handleStageNext = () => {
 if (!activeSetlist) return;
 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 } else if (stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 setStageIsPlaying(true);
 }
 };

 const handleStagePrev = () => {
 if (!activeSetlist) return;
 if (stagePlayingIndex === null) {
 setStagePlayingIndex(0);
 setStageIsPlaying(true);
 } else if (stagePlayingIndex > 0) {
 setStagePlayingIndex(stagePlayingIndex - 1);
 setStageIsPlaying(true);
 }
 };

 const handleStageSeek = (newTime: number) => {
 setStageCurrentTime(newTime);
 if (stageAudioRef.current && stageResolvedUrl) {
 stageAudioRef.current.currentTime = newTime;
 }
 };

 const handleStageAudioEnded = () => {
 if (stageAutoplayNext && activeSetlist && stagePlayingIndex !== null && stagePlayingIndex < activeSetlist.items.length - 1) {
 setStagePlayingIndex(stagePlayingIndex + 1);
 } else {
 setStageIsPlaying(false);
 setStagePlayingIndex(null);
 }
 };

  return {
    stageAudioRef,
    stagePlayingIndex, setStagePlayingIndex,
    stageIsPlaying, setStageIsPlaying,
    stageAutoplayNext, setStageAutoplayNext,
    stageCurrentTime, setStageCurrentTime,
    stageItemDuration,
    stageResolvedUrl,
    toggleStagePlayPause,
    handleStageNext,
    handleStagePrev,
    handleStageSeek,
    handleStageAudioEnded,
  };
}
