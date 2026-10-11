#!/usr/bin/env python3
"""Genera la banda sonora del modo película (audio/musica/*.mp3): cuatro piezas originales en Mi menor que comparten
el mismo leitmotiv, sintetizadas con numpy, en estéreo y en bucle sin costuras.

  tension.mp3   · «Cuenta atrás»        92,5 BPM · prólogo y cierre del cartel: pulso de corazón, ostinato Mi-Fa
                                         (semitono, a lo Nolan), tic-tac grave y un tono de Shepard que nunca deja de subir
  tema.mp3      · «Compila ou Morre»    185 BPM  · el tema de Os Herdeiros: rock bravú (punk con gaita galega)
  noches.mp3    · «As noites»           72 BPM   · las noches de Iago: piano y flauta, el leitmotiv despacio
  lostrego.mp3  · «Cabalga o Lóstrego»  200 BPM  · el clímax: galope de batería y la gaita a dos voces

Uso:  python3 presentacion/tools/musica.py            (necesita numpy y ffmpeg)
      python3 presentacion/tools/musica.py tema       (solo una pieza)
Los BPM tienen que coincidir con MUSICA en cine.js: el montaje hace caer las rampas de velocidad en el pulso.
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 32000
CARPETA = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio', 'musica')
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# ───────── Instrumentos (mono, numpy) ─────────
def filtro(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if lo:
        X *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        X *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X, len(x))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a=0.005, r=0.05):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1)
    cola = int(r * SR)
    if cola and cola < n:
        e[-cola:] *= np.linspace(1, 0, cola)
    return e


def saw(f, dur, det=(0.0,), techo=6000):
    t = tt(dur)
    out = np.zeros(len(t))
    for c in det:
        ff = f * 2 ** (c / 1200)
        for k in range(1, max(2, int(techo / ff)) + 1):
            out += np.sin(2 * np.pi * k * ff * t + k * 1.7) / k
    return out / len(det)


def pizca(f, dur, brillo=2400, caida=1.0):
    """Cuerda pulsada / piano suave: armónicos que caen antes cuanto más agudos."""
    t = tt(dur)
    out = sum(np.sin(2 * np.pi * k * f * t) / k ** 1.2 * np.exp(-t * (caida * (1.0 + 0.8 * k))) for k in range(1, max(2, int(brillo / f)) + 1))
    return out * np.minimum(t / 0.004, 1)


FORMANTES = ((1150, 380, 1.0), (2600, 600, 0.55), (650, 300, 0.5))  # el «nasal» del punteiro


def gaita(f, dur, floreo=None):
    """Punteiro de gaita galega: lengüeta doble (muchos armónicos, sin vibrato ni dinámica) y formantes nasales.
    floreo: nota de adorno muy corta antes de la principal, como hacen los gaiteros."""
    def tono(ff, d):
        t = tt(d)
        out = np.zeros(len(t))
        for k in range(1, int(5200 / ff) + 1):
            fk = k * ff
            g = sum(a * np.exp(-((fk - c) / bw) ** 2) for c, bw, a in FORMANTES) + 0.25 / k
            out += g * np.sin(2 * np.pi * fk * t + k)
        return out
    principal = tono(f, dur) * adsr(int(dur * SR), 0.012, 0.03)
    if floreo:
        n = int(0.045 * SR)
        adorno = tono(floreo, 0.045) * adsr(n, 0.003, 0.01)
        return np.concatenate([adorno, principal[:max(0, len(principal) - n)]])
    return principal


def bordon(f, dur):
    """Ronco de la gaita: zumbido grave continuo."""
    s = saw(f, dur, det=(-3, 3), techo=1800)
    return filtro(s, lo=50, hi=900)


def flauta(f, dur):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * 4.8 * t) * np.minimum(t / 0.6, 1) * 0.02 * f / 5)
    s += 0.18 * np.sin(4 * np.pi * f * t) + 0.06 * filtro(rng.standard_normal(len(t)), lo=f, hi=f * 3)
    return s * adsr(len(t), 0.09, min(0.4, dur * 0.4))


def bombo(dur=0.4, g=1.0):
    t = tt(dur)
    f = 44 + 95 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8.5) * 1.25 * g


def caja(dur=0.28):
    t = tt(dur)
    ruido = filtro(rng.standard_normal(len(t)), lo=900, hi=6000) * np.exp(-t * 17)
    return ruido * 0.85 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 24) * 0.6


def hat(dur=0.06):
    t = tt(dur)
    return filtro(rng.standard_normal(len(t)), lo=6000, hi=11000) * np.exp(-t * 75)


def plato(dur=1.6):
    t = tt(dur)
    return filtro(rng.standard_normal(len(t)), lo=3500, hi=10000) * np.exp(-t * 2.6)


def tom(f=110, dur=0.45):
    t = tt(dur)
    ff = f * (1 + 0.5 * np.exp(-t * 25))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 7)


def potencia(raiz, dur, quinta=True, sucio=2.8, hi=2800):
    """Acorde de quinta distorsionado (raíz + quinta + octava)."""
    s = saw(hz(raiz), dur, det=(-6, 6), techo=4000)
    if quinta:
        s = s + 0.8 * saw(hz(raiz + 7), dur, det=(-5, 5), techo=4000) + 0.5 * saw(hz(raiz + 12), dur, techo=4000)
    s = np.tanh(sucio * s)
    return filtro(s, lo=80, hi=hi)


def bajo(raiz, dur):
    s = pizca(hz(raiz), dur, 900, 0.6) + 0.5 * np.tanh(2 * saw(hz(raiz), dur, techo=700))
    return filtro(s, hi=800) * adsr(int(dur * SR), 0.004, 0.03)


# ───────── Lienzo en bucle ─────────
class Pista:
    def __init__(self, segundos):
        self.N = int(round(segundos * SR))
        self.buf = {}

    def poner(self, canal, t, sig, pan=0.0, g=1.0):
        if canal not in self.buf:
            self.buf[canal] = np.zeros((2, self.N))
        b = self.buf[canal]
        l, r = g * np.sqrt((1 - pan) / 2), g * np.sqrt((1 + pan) / 2)
        i = int(round(t * SR)) % self.N
        n = len(sig)
        while n > 0:  # lo que se pasa del final vuelve al principio: el bucle no tiene costura
            a = min(n, self.N - i)
            b[0, i:i + a] += l * sig[:a]
            b[1, i:i + a] += r * sig[:a]
            sig = sig[a:]
            n -= a
            i = 0

    def mezcla(self, niveles, eco=None):
        mix = np.zeros((2, self.N))
        for k, x in self.buf.items():
            if eco and k in eco:
                x = eco_pp(x, *eco[k])
            mix += niveles.get(k, 0.3) * x
        mix = np.tanh(mix * 1.15)
        return mix / (np.max(np.abs(mix)) or 1) * 0.9


def eco_pp(buf, retardo, fb=0.4, g=0.4, n=4):
    out = buf.copy()
    for k in range(1, n + 1):
        d = int(retardo * k * SR)
        c = k % 2
        out[c] += g * fb ** (k - 1) * np.roll(buf[1 - c], d)
    return out


# El leitmotiv: ocho compases de corcheas en Mi menor (MIDI; None = silencio; números negativos = ligadura de la anterior)
#            Em                                 C                                   G                                   D
MOTIVO = [[71, None, 76, 74, 71, None, 69, 67], [64, None, 67, 69, 67, None, 64, None], [74, None, 71, 74, 76, None, 74, 71], [69, None, 66, 69, 71, 69, 66, None],
          [71, None, 76, 74, 71, None, 69, 67], [64, None, 67, 69, 71, None, 72, 71], [69, None, 67, 66, 67, None, 66, 64], [64, -1, -1, -1, None, None, None, None]]
ACORDES = [40, 36, 43, 38, 40, 36, 38, 40]  # raíces (MIDI) Em C G D · Em C D Em
TERCERA = {40: 7, 36: 4, 43: 4, 38: 4}  # tercera de cada acorde, en semitonos sobre la raíz: menor (Em) o mayor


def motivo_notas(transp=0):
    """[(compás, corchea, midi, duración en corcheas)] con las ligaduras resueltas."""
    out = []
    for c, bar in enumerate(MOTIVO):
        for p, n in enumerate(bar):
            if n is None or n < 0:
                continue
            d = 1
            while p + d < 8 and bar[p + d] is not None and bar[p + d] < 0:
                d += 1
            if p + d < 8 and bar[p + d] is None:
                d += 1  # la nota suena hasta la siguiente, como sostiene la gaita
            out.append((c, p, n + transp, d))
    return out


# ───────── Las piezas ─────────
def tension():
    bpm = 92.5
    beat = 60 / bpm
    bar = beat * 4
    compases = 16
    P = Pista(bar * compases)
    dur = bar * compases
    # Shepard: 6 capas de Mi que suben una octava cada 4 compases; el bucle dura 4 ciclos → costura invisible
    ciclo = bar * 4
    t = np.arange(P.N) / SR
    for k in range(6):
        fase = ((t / ciclo) + k / 6) % 1.0
        octava = k + fase  # posición continua en octavas sobre la capa base
        f = 41.2 * 2 ** (octava % 6)
        peso = np.exp(-(((octava % 6) - 3) / 1.2) ** 2)
        P.poner('shepard', 0, np.sin(2 * np.pi * np.cumsum(f) / SR) * peso * 0.5)
    # ostinato de cuerdas graves: Mi-Fa en corcheas, crece en la segunda mitad
    for c in range(compases):
        for e in range(8):
            n = 40 if e % 4 < 2 else 41
            s = saw(hz(n), beat / 2 * 0.9, det=(-8, 8), techo=1500) * adsr(int(beat / 2 * 0.9 * SR), 0.01, 0.05)
            P.poner('cuerdas', c * bar + e * beat / 2, filtro(s, lo=40, hi=700 + 900 * (c / compases)), pan=-0.2 if e % 2 else 0.2, g=0.5 + 0.5 * (c >= 8))
        # corazón: dos latidos por compás
        for b in (0, 2):
            P.poner('corazon', c * bar + b * beat, bombo(0.5, 0.9))
            P.poner('corazon', c * bar + b * beat + 0.24, bombo(0.4, 0.55))
        # tic-tac grave, en negras
        for b in range(4):
            tk = np.sin(2 * np.pi * (170 if b % 2 else 200) * tt(0.12)) * np.exp(-tt(0.12) * 40)
            P.poner('tic', c * bar + b * beat, tk, pan=0.4 if b % 2 else -0.4)
    # colchón de bordón
    P.poner('bordon', 0, bordon(hz(28), dur))
    return P.mezcla({'shepard': 0.22, 'cuerdas': 0.32, 'corazon': 0.55, 'tic': 0.12, 'bordon': 0.16}), bpm


def compila_ou_morre():
    bpm = 185
    beat = 60 / bpm
    bar = beat * 4
    corchea = beat / 2
    # intro 4 · A (medio tiempo) 8 · B (punk con gaita) 8 · C (ruptura) 8 · B' 8 · puente 4 = 40 compases
    plan = ['intro'] * 4 + ['A'] * 8 + ['B'] * 8 + ['C'] * 8 + ['B'] * 8 + ['puente'] * 4
    P = Pista(bar * len(plan))
    mot = motivo_notas()
    for c, sec in enumerate(plan):
        t0 = c * bar
        raiz = ACORDES[c % 8]
        P.poner('bordon', t0, bordon(hz(28), bar * 1.02), g=1.0 if sec != 'C' else 0.5)
        if sec in ('A', 'B', 'C', 'puente'):
            for e in range(8):  # bajo en corcheas
                P.poner('bajo', t0 + e * corchea, bajo(raiz - 12 + 12 * (sec == 'C' and e % 4 == 3), corchea * 0.95), g=1.0 if e % 4 == 0 else 0.75)
        if sec == 'A':  # medio tiempo: bombo en 1 y 3, caja en 3 del doble
            for b in range(4):
                P.poner('bat', t0 + b * beat, hat(), pan=0.3, g=0.6)
                P.poner('bat', t0 + b * beat + corchea, hat(), pan=0.3, g=0.35)
            P.poner('bat', t0, bombo()); P.poner('bat', t0 + 2.5 * beat, bombo(g=0.8)); P.poner('bat', t0 + 2 * beat, caja(), pan=0.1)
            if c % 2 == 0:
                g = potencia(raiz, bar * 0.98)
                g *= np.exp(-np.arange(len(g)) / SR / 1.8)
                P.poner('gtr', t0, g, pan=-0.5); P.poner('gtr', t0 + 0.011, g, pan=0.5)
        if sec in ('B', 'puente'):  # punk a piñón: bombo en cada negra, caja en 2 y 4, hi-hat en corcheas
            for b in range(4):
                P.poner('bat', t0 + b * beat, bombo(g=0.9))
                if b % 2:
                    P.poner('bat', t0 + b * beat, caja(), pan=0.1)
                for e in (0, 1):
                    P.poner('bat', t0 + b * beat + e * corchea, hat(), pan=0.3, g=0.5 if e else 0.7)
            for e in range(8):  # guitarras en corcheas con palm mute
                s = potencia(raiz, corchea * 0.8, sucio=3.2) * adsr(int(corchea * 0.8 * SR), 0.003, 0.02)
                P.poner('gtr', t0 + e * corchea, s, pan=-0.55 if e % 2 else 0.55, g=1.0 if e % 4 == 0 else 0.8)
            if c % 8 == 0:
                P.poner('bat', t0, plato(), pan=-0.3)
        if sec == 'C':  # ruptura: toms, bajo solo y la gaita respondiendo
            for b in range(4):
                P.poner('bat', t0 + b * beat, tom(98 if b % 2 else 82), pan=-0.2 if b % 2 else 0.2)
            P.poner('bat', t0, bombo())
        if sec == 'puente' and c == len(plan) - 1:  # redoble para volver al principio
            for e in range(8):
                P.poner('bat', t0 + e * corchea, caja(), pan=0.1, g=0.4 + e * 0.08)
    # la gaita: el leitmotiv en la intro (sola con el bordón) y en B; en C, solo frases sueltas
    for c, sec in enumerate(plan):
        if sec not in ('intro', 'B', 'C'):
            continue
        k = c % 8 if sec != 'intro' else c + 4
        for (cc, p, n, d) in mot:
            if cc != k or (sec == 'C' and p > 3):
                continue
            fl = n + 2 if p % 4 == 0 else None
            P.poner('gaita', c * bar + p * corchea, gaita(hz(n + 12 * 0), d * corchea * 0.97, hz(fl) if fl else None), pan=0.15)
    return P.mezcla({'bordon': 0.11, 'bajo': 0.36, 'bat': 0.5, 'gtr': 0.2, 'gaita': 0.16}, eco={'gaita': (corchea * 3, 0.35, 0.3)}), bpm


def noches():
    bpm = 72
    beat = 60 / bpm
    bar = beat * 4
    compases = 16
    P = Pista(bar * compases)
    voz = {40: (52, 55, 59, 64), 36: (48, 52, 55, 59), 43: (43, 50, 55, 59), 38: (42, 50, 54, 57)}  # Em · Cmaj7 · G · D/F#
    for c in range(compases):
        raiz = ACORDES[c % 8]
        notas = voz[raiz]
        for e in range(8):  # piano: arpegio lento en corcheas
            n = notas[[0, 1, 2, 3, 2, 1, 2, 3][e]]
            P.poner('piano', c * bar + e * beat / 2, pizca(hz(n), 2.4, 1600, 0.45), pan=-0.3 + 0.6 * (e % 2), g=0.9 if e == 0 else 0.6)
        P.poner('piano', c * bar, pizca(hz(raiz), 3.2, 800, 0.35), g=0.9)  # la raíz, abajo
        pad = sum(saw(hz(n), bar * 1.1, det=(-7, 7), techo=1400) for n in notas[:3])
        pad = filtro(pad, lo=100, hi=900) * np.minimum(tt(bar * 1.1) / 1.2, 1) * np.minimum((bar * 1.1 - tt(bar * 1.1)) / 1.2, 1)
        P.poner('pad', c * bar, pad)
    # la flauta: el leitmotiv, despacio (compases 9-16)
    for (cc, p, n, d) in motivo_notas():
        P.poner('flauta', (cc + 8) * bar + p * beat / 2, flauta(hz(n), d * beat / 2 * 1.05), pan=0.15)
    return P.mezcla({'piano': 0.3, 'pad': 0.1, 'flauta': 0.24}, eco={'piano': (beat * 0.75, 0.35, 0.3), 'flauta': (beat, 0.4, 0.35)}), bpm


def lostrego():
    bpm = 200
    beat = 60 / bpm
    bar = beat * 4
    corchea = beat / 2
    plan = ['galope'] * 8 + ['himno'] * 16 + ['galope'] * 8
    P = Pista(bar * len(plan))
    mot = motivo_notas()
    for c, sec in enumerate(plan):
        t0 = c * bar
        raiz = ACORDES[c % 8]
        P.poner('bordon', t0, bordon(hz(28), bar * 1.02))
        for b in range(4):  # galope: «pa-ta-plán» (corchea + dos semicorcheas) en bombo y bajo
            for k, (dt, g) in enumerate(((0, 1.0), (corchea, 0.7), (corchea * 1.5, 0.75))):
                P.poner('bat', t0 + b * beat + dt, bombo(0.3, g))
                P.poner('bajo', t0 + b * beat + dt, bajo(raiz - 12, corchea * (0.9 if k == 0 else 0.45)), g=g)
            if b % 2:
                P.poner('bat', t0 + b * beat, caja(), pan=0.1)
            P.poner('bat', t0 + b * beat, hat(0.09), pan=0.35, g=0.6)
        if c % 4 == 0:
            P.poner('bat', t0, plato(2.2), pan=-0.35 if c % 8 else 0.35)
        g = potencia(raiz, bar * 0.98, sucio=3.4, hi=3200)
        g *= np.minimum(np.arange(len(g)) / SR / 0.01, 1) * np.exp(-np.arange(len(g)) / SR / 2.5)
        P.poner('gtr', t0, g, pan=-0.55); P.poner('gtr', t0 + 0.012, g, pan=0.55)
    # la gaita a dos voces (melodía y su tercera) en el himno; en el galope, solo la primera mitad del motivo
    for c, sec in enumerate(plan):
        k = c % 8
        for (cc, p, n, d) in mot:
            if cc != k or (sec == 'galope' and k >= 4):
                continue
            fl = n + 2 if p % 4 == 0 else None
            P.poner('gaita', c * bar + p * corchea, gaita(hz(n), d * corchea * 0.97, hz(fl) if fl else None), pan=-0.1)
            if sec == 'himno':
                ter = n - (3 if (n - 4) % 12 in (0, 3, 7) else 4)  # una tercera por debajo, dentro de la escala
                P.poner('gaita2', c * bar + p * corchea, gaita(hz(ter), d * corchea * 0.97), pan=0.3)
    return P.mezcla({'bordon': 0.1, 'bajo': 0.34, 'bat': 0.5, 'gtr': 0.22, 'gaita': 0.17, 'gaita2': 0.1}, eco={'gaita': (corchea * 3, 0.3, 0.25)}), bpm


PIEZAS = {'tension': tension, 'tema': compila_ou_morre, 'noches': noches, 'lostrego': lostrego}


def guardar(nombre, mix):
    os.makedirs(CARPETA, exist_ok=True)
    salida = os.path.join(CARPETA, nombre + '.mp3')
    with tempfile.TemporaryDirectory() as tmp:
        w = os.path.join(tmp, 'm.wav')
        with wave.open(w, 'wb') as f:
            f.setnchannels(2)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes((mix.T * 32767).astype('<i2').tobytes())
        # sin agudos que piquen: un estante suave por encima de 7 kHz
        subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-af', 'highshelf=f=7000:g=-5,loudnorm=I=-18:TP=-2:LRA=7',
                               '-c:a', 'libmp3lame', '-b:a', '112k', salida])
    return salida


if __name__ == '__main__':
    for nombre in (sys.argv[1:] or PIEZAS):
        mix, bpm = PIEZAS[nombre]()
        s = guardar(nombre, mix)
        print(f'{s}: {mix.shape[1] / SR:.1f} s · {bpm} BPM · {os.path.getsize(s) / 1024:.0f} KB')
