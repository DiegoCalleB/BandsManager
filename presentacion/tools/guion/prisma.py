"""Prisma de «The Dark Side of the Moon» para la escena de Iris: un rayo blanco entra, el prisma lo abre y cada instrumento sale como una onda
de barras que late (como las pistas en la app). Todo es SVG + CSS (transform: scaleY), sin imágenes. Lo usa generar.py."""
import math, random


def svg():
    W, H = 800, 450
    P = (300, 208)
    rays = [('Voz', '#ff4d6d', -34), ('Guitarras', '#ff9a3c', -17), ('Bajo', '#ffe14a', 0), ('Batería', '#46d37b', 17), ('Otros', '#4aa8ff', 34)]
    rnd = random.Random(7)
    out = []
    for k, (nom, col, ang) in enumerate(rays):
        L = 300
        ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
        for i in range(0, L, 5):
            x, y = P[0] + i * ca, P[1] + i * sa
            env = min(1, i / 70)
            h = (5 + 17 * rnd.random()) * env + 2
            dur = 0.45 + rnd.random() * 0.7
            out.append(f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang})"><line class="pr-b" style="--c:{col};--d:{i};--k:{k};--p:{dur:.2f}s;--s:{rnd.random() * .6 + .15:.2f}" x1="0" y1="{-h:.1f}" x2="0" y2="{h:.1f}"/></g>')
        ex, ey = P[0] + L * ca, P[1] + L * sa
        out.append(f'<text class="pr-l" style="--c:{col};--k:{k}" x="{ex + 16:.0f}" y="{ey + 7:.0f}">{nom}</text>')
    return f'''<svg class="pr-svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
<defs><linearGradient id="prg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#9fb4ff" stop-opacity=".12"/></linearGradient></defs>
<path class="pr-beam" d="M0,238 L204,216" pathLength="1"/>
<polygon class="pr-prisma" points="248,96 134,312 362,312" />
<polygon class="pr-prisma-in" points="248,96 134,312 362,312" fill="url(#prg)"/>
{''.join(out)}</svg>'''
