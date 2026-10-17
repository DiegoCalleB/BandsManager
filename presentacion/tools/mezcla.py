"""Mide la sonoridad (LUFS) de todas las voces y canciones de la película y avisa de las que se salen del objetivo.

    python3 presentacion/tools/mezcla.py             # informe
    python3 presentacion/tools/mezcla.py --normaliza  # reescribe (con ffmpeg loudnorm) lo que se sale más de 1,5 LU

Objetivo: voces y canciones entre -18 y -15 LUFS (hoy: voces -16,5 de mediana; canciones -16,6 a -16,9). La mezcla en pantalla
(mezcla.js) pone la música a unos -15 dB de la voz cuando hablan y a unos -7 dB cuando no.
"""
import glob, os, re, subprocess, sys

DECK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBJ, TOL = -16.5, 1.5


def lufs(f):
    r = subprocess.run(['ffmpeg', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(m[-1]) if m else None


def normaliza(f):
    tmp = f + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', f'loudnorm=I={OBJ}:TP=-1.5:LRA=11', '-b:a', '128k', tmp], check=True)
    os.replace(tmp, f)


def main():
    fuera, total = [], 0
    for patron in ('audio/voces/*.mp3', 'audio/musica/*.mp3'):
        for f in sorted(glob.glob(os.path.join(DECK, patron))):
            l = lufs(f); total += 1
            if l is not None and abs(l - OBJ) > TOL:
                fuera.append((f, l))
    for f, l in fuera:
        print(f'fuera de objetivo: {os.path.relpath(f, DECK)}  {l:.1f} LUFS')
        if '--normaliza' in sys.argv:
            normaliza(f)
    print(f'{total} archivos medidos, {len(fuera)} fuera de {OBJ} ± {TOL} LU')


if __name__ == '__main__':
    main()
