#!/usr/bin/env python3
"""Mezcla el audio de la película grabada por grabar_pelicula.mjs y lo une al vídeo.

Uso (lo llama grabar_pelicula.mjs): mezclar_pelicula.py <carpeta_temporal> <carpeta_presentacion> <video.webm> <salida.mp4>

Las voces salen de audio/voces siguiendo el registro de reproducciones; la música (con su ducking y sus fundidos entre
piezas) y los sonidos del montaje vienen de la derivación de WebAudio grabada en el navegador. Si el registro trae una
música de fichero (versiones antiguas de cine.js), se mezcla aparte como antes.
"""
import json
import os
import subprocess
import sys
from urllib.parse import unquote, urlparse

import numpy as np

SR = 32000
tmp, base, video, salida = sys.argv[1:5]
ev = json.load(open(os.path.join(tmp, 'eventos.json')))
taps = json.load(open(os.path.join(tmp, 'taps.json')))
OFF = ev['off']


def duracion(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))


def leer(f, filtro=None, canales=2):
    cmd = ['ffmpeg', '-v', 'error', '-i', f]
    if filtro:
        cmd += ['-af', filtro]
    cmd += ['-f', 'f32le', '-ac', str(canales), '-ar', str(SR), '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, canales)


dur_total = duracion(video)
N = int((dur_total + 2) * SR)
mezcla = np.zeros((N, 2), dtype=np.float32)


def poner(x, t, g=1.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    a, b = max(0, -i), min(len(x), N - i)
    mezcla[i + a:i + b] += g * x[a:b]


cache = {}
habla = []  # intervalos en los que hay una voz
musica_t = None
for e in ev['audio']:
    ruta = os.path.join(base, unquote(urlparse(e['src']).path).lstrip('/'))
    t = OFF + e['t'] / 1000
    if e.get('bgm'):
        if musica_t is None:
            musica_t, musica_src = t, e['src']
        continue
    if not os.path.exists(ruta):
        print('sin fichero:', ruta, file=sys.stderr)
        continue
    clave = (ruta, round(e['rate'], 3))
    if clave not in cache:
        cache[clave] = leer(ruta, f"atempo={e['rate']}" if abs(e['rate'] - 1) > 0.001 else None)
    x = cache[clave]
    poner(x, t, float(e.get('vol', 1)))
    habla.append((t, t + len(x) / SR))

# sonidos de WebAudio (logotipo, tráiler, transiciones)
for tp in taps:
    f = os.path.join(tmp, tp['f'])
    if os.path.exists(f) and os.path.getsize(f) > 1000:
        poner(leer(f), OFF + tp['t'] / 1000, 1.0)

# música con su ducking
if musica_t is not None:
    mus = leer(os.path.join(base, unquote(urlparse(musica_src).path).lstrip('/')))
    reps = int(np.ceil((N / SR - musica_t) * SR / len(mus))) + 1
    mus = np.tile(mus, (reps, 1))
    paso = 100  # Hz de la curva de volumen
    n = int(N / SR * paso) + 2
    obj = np.full(n, 0.2, dtype=np.float32)
    for a, b in habla:
        obj[int(a * paso):int(b * paso) + 1] = 0.07
    g = np.empty(n, dtype=np.float32)
    v = 0.0
    k = 1 - (1 - 0.07) ** (60 / paso)  # mismo suavizado que cine.js (0,07 por fotograma a 60 fps)
    for i in range(n):
        v += (obj[i] - v) * k
        g[i] = v
    t0 = int(musica_t * paso)
    g[:t0] = 0
    curva = np.interp(np.arange(N) / SR * paso, np.arange(n), g).astype(np.float32)
    seg = mus[:N - int(musica_t * SR)] if int(musica_t * SR) < N else mus[:0]
    i0 = int(musica_t * SR)
    mezcla[i0:i0 + len(seg)] += seg * curva[i0:i0 + len(seg), None]

pico = float(np.max(np.abs(mezcla))) or 1.0
print(f'voces: {len(habla)} · música de fichero: {"desde %.1f s" % musica_t if musica_t is not None else "no (va por WebAudio)"} · taps: {len(taps)} · pico {pico:.2f}')
wav = os.path.join(tmp, 'mezcla.wav')
import wave
with wave.open(wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mezcla / max(pico, 1.0), -1, 1) * 32767).astype('<i2').tobytes())
subprocess.check_call([
    'ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', wav,
    '-c:v', 'libx264', '-crf', os.environ.get('CRF', '30'), '-preset', 'slow' if os.environ.get('CRF', '30') < '25' else 'medium', '-pix_fmt', 'yuv420p', '-r', '25',
    '-ss', os.environ.get('INICIO', '0'), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k' if os.environ.get('CRF', '30') < '25' else '128k', '-ar', '44100', '-movflags', '+faststart', '-shortest', salida])
print(f'{salida}: {os.path.getsize(salida) / 1048576:.1f} MB')
