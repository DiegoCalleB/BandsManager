#!/usr/bin/env python3
"""Genera la música de fondo del modo película (audio/musica/rock.mp3): un riff de rock de garaje original,
sintetizado con numpy (guitarra distorsionada, bajo y batería), en bucle sin costuras.

Uso:  python3 presentacion/tools/musica.py        (necesita numpy y ffmpeg)
Cambiar el aire de la película = tocar BPM, ACORDES o los niveles de mezcla de aquí abajo.
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 32000
BPM = 112
ACORDES = [82.41, 82.41, 98.0, 110.0, 82.41, 82.41, 98.0, 73.42]  # E E G A | E E G D (fundamental, 1 compás cada uno)
PASO = 60 / BPM / 2                       # una corchea
COMPAS = PASO * 8
N = int(round(COMPAS * len(ACORDES) * SR))  # longitud exacta del bucle
SALIDA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio', 'musica', 'rock.mp3')
rng = np.random.default_rng(7)


def poner(buf, t, sig):
    """Suma sig en el instante t; lo que se pasa del final vuelve al principio (bucle sin costuras)."""
    i = int(round(t * SR)) % N
    n = len(sig)
    a = min(n, N - i)
    buf[i:i + a] += sig[:a]
    if a < n:
        buf[:n - a] += sig[a:]


def filtro(x, lo=None, hi=None):
    """Paso alto/bajo por FFT (el bucle es periódico, así que no deja costuras)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if lo:
        X *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        X *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X, len(x))


def tono(f0, dur, armonicos=40, lim=4500):
    t = np.arange(int(dur * SR)) / SR
    n = np.arange(1, armonicos + 1)
    n = n[n * f0 < lim]
    return sum(np.sin(2 * np.pi * k * f0 * t) / k for k in n), t


guitarra, bajo, bateria = (np.zeros(N) for _ in range(3))
for c, raiz in enumerate(ACORDES):
    t0 = c * COMPAS
    for p in range(8):
        t = t0 + p * PASO
        ultimo = c in (3, 7) and p >= 6
        dur = PASO * (2.6 if ultimo else 0.95)
        s, tt = tono(raiz, dur)
        acorde = s + tono(raiz * 1.498, dur)[0] * 0.9 + tono(raiz * 2, dur)[0] * 0.8
        env = np.exp(-tt * (3.2 if ultimo else 14)) * np.minimum(1, tt * 400)
        acento = 1.0 if p % 2 == 0 else 0.7
        poner(guitarra, t, acorde * env * acento)
        b, tb = tono(raiz, PASO * 0.9, 8, 900)
        poner(bajo, t, b * np.exp(-tb * 7) * np.minimum(1, tb * 300) * (1.0 if p % 2 == 0 else 0.75))
    # batería
    for p in range(8):
        t = t0 + p * PASO
        h = np.arange(int(0.05 * SR)) / SR
        poner(bateria, t, filtro(np.concatenate([rng.standard_normal(len(h)), np.zeros(SR // 50)]), lo=7000)[:len(h)] * np.exp(-h * 70) * (0.5 if p % 2 else 0.3))
        if p in (0, 4) or (c % 2 == 1 and p == 6):  # bombo
            k = np.arange(int(0.28 * SR)) / SR
            fase = 2 * np.pi * np.cumsum(48 + 110 * np.exp(-k * 28)) / SR
            poner(bateria, t, np.sin(fase) * np.exp(-k * 13) * 1.6)
        if p in (2, 6):  # caja
            k = np.arange(int(0.22 * SR)) / SR
            ruido = filtro(rng.standard_normal(len(k)), lo=1400) * np.exp(-k * 17)
            poner(bateria, t, ruido * 0.9 + np.sin(2 * np.pi * 190 * k) * np.exp(-k * 28) * 0.7)
    if c % 4 == 0:  # platillo en el primer tiempo de cada cuatro compases
        k = np.arange(int(1.6 * SR)) / SR
        poner(bateria, t0, filtro(rng.standard_normal(len(k)), lo=4500) * np.exp(-k * 2.6) * 0.5)

guitarra = filtro(np.tanh(filtro(guitarra, lo=80) / np.max(np.abs(guitarra)) * 7), lo=90, hi=3200)
bajo = filtro(bajo, hi=700)
mezcla = guitarra / np.max(np.abs(guitarra)) * 0.5 + bajo / np.max(np.abs(bajo)) * 0.42 + bateria / np.max(np.abs(bateria)) * 0.7
mezcla = np.tanh(mezcla * 1.2)
mezcla = mezcla / np.max(np.abs(mezcla)) * 0.9

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    w = os.path.join(tmp, 'rock.wav')
    with wave.open(w, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((mezcla * 32767).astype('<i2').tobytes())
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9',
                           '-ar', str(SR), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '80k', SALIDA])
print(f'{SALIDA}: {N / SR:.1f} s, {os.path.getsize(SALIDA) / 1024:.0f} KB')
