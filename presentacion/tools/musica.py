#!/usr/bin/env python3
"""Genera la música de fondo del modo película (audio/musica/rock.mp3): una banda sonora original de rock
cinematográfico en Mi menor, sintetizada con numpy (pad, arpegio, bajo, batería, guitarra y melodía), en estéreo
y en bucle sin costuras (~80 s).

Uso:  python3 presentacion/tools/musica.py        (necesita numpy y ffmpeg)
Estructura (4 compases cada bloque, Em · C · G · D): intro (pad y arpegio) → verso (entran bajo y batería)
→ estribillo (guitarra abierta y melodía) → puente (vuelve a abrirse) y otra vez desde el principio.
Para cambiar el aire: BPM, PROGRESION y los niveles de mezcla de MEZCLA.
"""
import os
import subprocess
import tempfile
import wave

import numpy as np

SR = 32000
BPM = 92
COMPAS = 60 / BPM * 4
PASO = COMPAS / 8  # una corchea
#            fundamental, tercera, quinta (Hz): Em · C · G · D
PROGRESION = [(82.41, 98.0, 123.47), (65.41, 82.41, 98.0), (98.0, 123.47, 146.83), (73.42, 92.5, 110.0)]
BLOQUES = 8  # 8 bloques de 4 compases = 32 compases
NC = len(PROGRESION) * BLOQUES
N = int(round(COMPAS * NC * SR))
SALIDA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio', 'musica', 'rock.mp3')
rng = np.random.default_rng(11)
MEZCLA = {'pad': 0.20, 'arpegio': 0.16, 'bajo': 0.34, 'bombo': 0.52, 'caja': 0.26, 'hat': 0.07, 'guitarra': 0.20, 'melodia': 0.17}


def lienzo():
    return np.zeros((2, N))


def poner(buf, t, sig, pan=0.0, g=1.0):
    """Suma sig (mono) en el instante t, con panorama pan (-1 izq … 1 der); lo que se pasa del final vuelve al principio."""
    l, r = g * np.sqrt((1 - pan) / 2), g * np.sqrt((1 + pan) / 2)
    i = int(round(t * SR)) % N
    n = len(sig)
    a = min(n, N - i)
    for c, k in ((0, l), (1, r)):
        buf[c, i:i + a] += k * sig[:a]
        if a < n:
            buf[c, :n - a] += k * sig[a:]


def filtro(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if lo:
        X *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        X *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X, len(x))


def env(n, a=0.005, d=0.5):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)


def saw(f, dur, det=(0.0,)):
    t = np.arange(int(dur * SR)) / SR
    out = 0
    for c in det:
        ff = f * 2 ** (c / 1200)
        out = out + sum(np.sin(2 * np.pi * k * ff * t + k) / k for k in range(1, int(3500 / ff) + 1))
    return out / len(det)


def pizca(f, dur, brillo=2200):
    """Cuerda pulsada: armónicos que decaen más rápido cuanto más agudos."""
    t = np.arange(int(dur * SR)) / SR
    out = sum(np.sin(2 * np.pi * k * f * t) / k * np.exp(-t * (1.2 + 0.9 * k)) for k in range(1, int(brillo / f) + 1))
    return out * np.minimum(t / 0.003, 1)


def bombo(dur=0.38):
    t = np.arange(int(dur * SR)) / SR
    f = 46 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.2


def caja(dur=0.3):
    t = np.arange(int(dur * SR)) / SR
    ruido = filtro(rng.standard_normal(len(t)), lo=1200, hi=7000) * np.exp(-t * 18)
    return ruido * 0.9 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 26) * 0.5


def hat(dur=0.07, abierto=False):
    t = np.arange(int(dur * SR * (4 if abierto else 1))) / SR
    return filtro(rng.standard_normal(len(t)), lo=6500) * np.exp(-t * (18 if abierto else 70))


def eco(buf, retardo, fb=0.4, g=0.5, n=4):
    """Eco estéreo en ping-pong: lo repetido va rebotando de un lado a otro."""
    out = buf.copy()
    for k in range(1, n + 1):
        d = int(retardo * k * SR)
        c = (k % 2)
        out[c] += g * fb ** (k - 1) * np.roll(buf[1 - c], d)
        out[1 - c] += g * fb ** (k - 1) * 0.5 * np.roll(buf[c], d)
    return out


pad, arp, bajo, bat, gtr, mel = (lienzo() for _ in range(6))
# melodía del estribillo (grados sobre el acorde: 0 raíz, 1 tercera, 2 quinta, 3 octava), en corcheas; None = silencio
MEL = [[3, None, 2, None, 3, None, 1, None], [2, None, 1, None, 2, None, 0, None], [3, None, 2, None, 3, None, 2, None], [1, None, 2, None, 3, None, None, None]]

for c in range(NC):
    bloque, k = divmod(c, len(PROGRESION))
    r, ter, qui = PROGRESION[k]
    t0 = c * COMPAS
    fase = bloque % 4  # 0 intro · 1 verso · 2 estribillo · 3 puente
    # pad: tres notas del acorde con voces ligeramente desafinadas, entrando y saliendo con el compás
    pd = sum(saw(f * 2, COMPAS * 1.15, det=(-9, 0, 8)) for f in (r, ter, qui))
    pd = filtro(pd, lo=120, hi=1400) * np.minimum(np.arange(len(pd)) / SR / 0.9, 1) * np.minimum((len(pd) - np.arange(len(pd))) / SR / 0.9, 1)
    poner(pad, t0, pd, g=1.0)
    # arpegio limpio en corcheas (octava de arriba), siempre presente pero más suave en el estribillo
    notas = [r * 4, qui * 2, ter * 4, qui * 4, r * 4, qui * 2, ter * 4, qui * 4]
    for p in range(8):
        poner(arp, t0 + p * PASO, pizca(notas[p], 0.9) * (0.6 if fase == 2 else 1.0), pan=-0.5 if p % 2 else 0.5)
    if fase >= 1 and not (fase == 3 and k >= 2):
        for p in range(8):  # bajo: corcheas con acento en el 1 y el 5
            poner(bajo, t0 + p * PASO, filtro(pizca(r, 0.4, 900), hi=700) * (1.0 if p % 4 == 0 else 0.7), g=1.0)
        for p in range(0, 8, 4):
            poner(bat, t0 + p * PASO, bombo(), g=1.0)
        for p in (2, 6):
            poner(bat, t0 + p * PASO, caja(), pan=0.1, g=1.0)
        for p in range(8):
            poner(bat, t0 + p * PASO, hat(), pan=0.3, g=1.0 if p % 2 == 0 else 0.55)
        if fase == 2 and k == 0:
            poner(bat, t0, hat(0.2, True) * 1.8, pan=-0.3)  # platillo al entrar el estribillo
    if fase == 1:  # guitarra en sordina: corcheas cortas
        for p in range(8):
            s = np.tanh(2.2 * saw(r * 2, PASO * 0.7)) * env(int(PASO * 0.7 * SR), 0.003, 0.09)
            poner(gtr, t0 + p * PASO, filtro(s, lo=90, hi=2600), pan=-0.35, g=1.0)
    if fase in (2, 3):  # acordes abiertos de potencia (raíz + quinta), un golpe por compás con cola
        s = np.tanh(2.6 * (saw(r * 2, COMPAS * 0.98) + 0.8 * saw(qui, COMPAS * 0.98)))
        s = filtro(s, lo=90, hi=3000) * np.minimum(np.arange(len(s)) / SR / 0.02, 1) * np.exp(-np.arange(len(s)) / SR / 2.2)
        poner(gtr, t0, s, pan=-0.45, g=1.0)
        poner(gtr, t0 + 0.012, s, pan=0.45, g=1.0)
    if fase == 2:  # melodía: triángulo con vibrato y la octava arriba
        for p, gr in enumerate(MEL[k]):
            if gr is None:
                continue
            f = (r, ter, qui, r * 2)[gr] * 4
            tt = np.arange(int(PASO * 2.4 * SR)) / SR
            vib = np.sin(2 * np.pi * f * tt + 0.8 * np.sin(2 * np.pi * 5.2 * tt)) * np.minimum(tt / 0.02, 1) * np.exp(-tt * 1.8)
            poner(mel, t0 + p * PASO, vib, pan=0.2)

# eco de la melodía y el arpegio, y mezcla
mel = eco(mel, PASO * 1.5, 0.45, 0.45)
arp = eco(arp, PASO * 3, 0.4, 0.4)
mix = sum(MEZCLA[n] * x for n, x in (('pad', pad), ('arpegio', arp), ('bajo', bajo), ('guitarra', gtr), ('melodia', mel)))
bat_m = np.stack([MEZCLA['bombo'] * bat[0], MEZCLA['bombo'] * bat[1]])
mix = mix + bat_m
mix = np.tanh(mix * 1.1)
mix = mix / np.max(np.abs(mix)) * 0.9

with tempfile.TemporaryDirectory() as tmp:
    w = os.path.join(tmp, 'm.wav')
    with wave.open(w, 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((mix.T * 32767).astype('<i2').tobytes())
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-af', 'loudnorm=I=-18:TP=-2:LRA=7', '-c:a', 'libmp3lame', '-b:a', '96k', SALIDA])
print(f'{SALIDA}: {N / SR:.1f} s, {os.path.getsize(SALIDA) / 1024:.0f} KB')
