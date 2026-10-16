#!/usr/bin/env python3
"""«Mis bandas»: destaca a Diego en las fotos con más gente oscureciendo un poco al resto (sin taparlo).

Para cada etapa de img/historia/historia.json con "foco": [cx, cy, rx, ry] (elipse, en fracciones de la foto) o
"foco": [cx, cy, rx, ry, oscuridad] (brillo de lo de fuera, 0,55 por defecto), escribe img/historia/_foco/<foto>:
dentro de la elipse la foto queda igual y fuera se oscurece con una transición suave. Está horneado en la imagen para que
funcione con el zoom de cámara y igual en el navegador que en el render. El original no se toca.
"""
import json
import os

import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
H = os.path.join(AQUI, '..', 'img', 'historia')


def aplicar(foco, entrada, salida):
    cx, cy, rx, ry = foco[:4]
    osc = foco[4] if len(foco) > 4 else 0.55
    im = Image.open(entrada).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    y, x = np.mgrid[0:h, 0:w]
    d = np.sqrt(((x / w - cx) / rx) ** 2 + ((y / h - cy) / ry) ** 2)
    t = np.clip((d - 0.75) / 0.7, 0, 1)
    t = t * t * (3 - 2 * t)  # smoothstep
    f = 1 - (1 - osc) * t
    Image.fromarray(np.clip(a * f[..., None], 0, 255).astype(np.uint8)).save(salida, quality=93)


def main():
    etapas = json.load(open(os.path.join(H, 'historia.json'), encoding='utf-8'))
    os.makedirs(os.path.join(H, '_foco'), exist_ok=True)
    hechas = []
    for f in etapas:
        if f.get('foco') and f.get('foto'):
            aplicar(f['foco'], os.path.join(H, f['foto']), os.path.join(H, '_foco', f['foto']))
            hechas.append(f['foto'])
    return hechas


if __name__ == '__main__':
    print('foco en:', ', '.join(main()) or '—')
