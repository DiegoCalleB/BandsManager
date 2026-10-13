"""Dirección de pantalla «en directo»: cada captura de la app se maneja como si Iago estuviera compartiendo su pantalla.

Nada se queda quieto: la página hace scroll de verdad (rueda del ratón en el escritorio, dedo con inercia en el móvil), el cursor
va y viene con trayectorias curvas de mano humana, hace clic (se hunde y deja una onda), escribe en los campos letra a letra, la IA
redacta en directo, los números cuentan, la sala firma con el dedo y saltan avisos. La cámara (estilo Screen Studio) se acerca a
lo que se toca y nunca para del todo: entre movimiento y movimiento sigue empujando despacio.

Todo sale como CSS (@keyframes por escena): sin JavaScript, cada fotograma es idéntico en el navegador y en el render con Remotion.

Los tiempos van en segundos desde que entra la escena, o anclados a las frases: «3» es cuando empieza la tercera frase, «3+1.5» un
segundo y medio después, «3-0.5» medio segundo antes y «fin-1» un segundo antes de que acabe la escena. Las frases se cronometran
con las voces de verdad (audio/voces/manifest.json), así que si cambia una frase la dirección la sigue sola.
Las coordenadas van en fracciones de la captura (x del ancho, y del alto de la página entera).

Acciones de cada escena (lista «pasos»):
  ('scroll', t, y)                     la página baja/sube hasta que y (fracción del alto) queda arriba del todo
  ('zoom', t, x, y, z)                 la cámara se acerca a ese punto de la página (z = 1 es la pantalla entera)
  ('ir', t, x, y)                      el cursor llega a ese punto en el segundo t
  ('clic', t, x, y)                    llega y hace clic (en el móvil, un toque con el dedo)
  ('teclear', t, x, y, w, h, texto, estilo)   clic en el campo, se vacía y se escribe letra a letra (estilo: fs, color, fondo, peso…)
  ('stream', t, x, y, w, h, texto, estilo)    la IA escribe un texto entero, deprisa y por palabras (tapa lo que hubiera debajo)
  ('tapa', t0, t1, x, y, w, h, html, estilo)  cambia un trozo de la pantalla por otro contenido (del segundo t0 al t1)
  ('contar', t, x, y, w, h, antes, n, despues, estilo)  un número que cuenta desde 0 hasta n
  ('firma', t, x, y, w, h, ruta, dur)  la firma se dibuja con el dedo dentro de ese recuadro (ruta SVG en un lienzo 0..100)
  ('pulsar', t, x, y, w, h)            el botón se ilumina al pulsarlo (va con un clic en el mismo sitio)
  ('hover', t0, t1, x, y, w, h)        el elemento se ilumina mientras el cursor está encima
  ('aviso', t0, t1, html)              notificación que entra por arriba a la derecha de la pantalla
  ('marca', t0, t1, x, y, w, h, rótulo) resalte (el resto se atenúa) y su rótulo numerado (x=None: solo el rótulo)
"""
import html as _html
import json
import math
import os
import random
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, os.path.dirname(AQUI))

# pantalla de la película (px dentro del cuadro de 1920x1080): escritorio (bajo la barra de la ventana) y móvil. Medido con Playwright.
MARCO = {'esc': (1792, 822), 'mov': (504, 968)}
VEL_VOZ, PISAR = 1.17, 0.3  # los de voces.js: velocidad de las voces y cuánto se pisan al cambiar de personaje
ARRANQUE = 0.35  # lo que tarda en sonar la primera frase desde que entra la escena


# ───────────────────────── reloj de las frases ─────────────────────────
_VOZ = None


def _voces():
    global _VOZ
    if _VOZ is None:
        import voces as V
        man = json.load(open(os.path.join(DECK, 'audio', 'voces', 'manifest.json'), encoding='utf-8'))
        _VOZ = (V, V.leer_reparto(), man)
    return _VOZ


def frases(seccion):
    """[(inicio, duración, quién)] de cada frase de la escena, encadenadas como lo hace voces.js."""
    V, R, man = _voces()
    out, t, prev = [], ARRANQUE, None
    for who, say in re.findall(r'data-who="([^"]+)"[^>]*?data-say="([^"]*)"', seccion):
        texto = V.sustituir(_html.unescape(say), R)
        m = man.get(V.fnv1a(who + '|' + texto))
        d = m['d'] / VEL_VOZ if m else max(0.9, len(texto) * 0.042)
        if not m:
            print(f'    · sin voz todavía (se estima su duración): {texto[:70]}')
        if prev is not None and who != prev:
            t -= PISAR
        out.append((round(t, 3), round(d, 3), who))
        t += d; prev = who
    return out


def _reloj(F, fin):
    def T(x):
        if isinstance(x, (int, float)):
            return float(x)
        x = str(x).replace(' ', '')
        if x.startswith('fin'):
            return fin + float(x[3:] or 0)
        m = re.match(r'^(\d+)(?:([+-])([\d.]+))?$', x)
        assert m, ('dirección: tiempo raro', x)
        base = F[int(m.group(1)) - 1][0]
        return base + (float(m.group(3)) * (1 if m.group(2) == '+' else -1) if m.group(2) else 0)
    return T


# ───────────────────────── keyframes ─────────────────────────
EASE = {'mano': 'cubic-bezier(.42, 0, .22, 1)', 'mano2': 'cubic-bezier(.3, .1, .36, 1)', 'rueda': 'cubic-bezier(.15, .6, .3, 1)',
        'inercia': 'cubic-bezier(.06, .72, .22, 1)', 'cam': 'cubic-bezier(.62, 0, .3, 1)', 'lineal': 'linear', 'salto': 'steps(1, end)'}


def _kf(nombre, T, puntos, prop):
    """puntos: [(t, valor, curva del tramo que empieza ahí)] → @keyframes. Con fotograma final: al acabar no vuelve al principio."""
    puntos = sorted(puntos, key=lambda p: p[0])
    lim = []
    for p in puntos:
        if lim and abs(p[0] - lim[-1][0]) < 1e-3:
            lim[-1] = p
        else:
            lim.append(p)
    css = [f'@keyframes {nombre} {{']
    for t, v, e in lim:
        pc = max(0, min(100, t / T * 100))
        css.append(f'  {pc:.3f}% {{ {prop(v)};{" animation-timing-function: " + EASE[e] + ";" if e else ""} }}')
    css.append(f'  100% {{ {prop(lim[-1][1])}; }}')
    css.append('}')
    return '\n'.join(css)


def _intervalos(lst):
    lst = sorted(lst); out = []
    for a, b in lst:
        if out and a <= out[-1][1] + 0.08:
            out[-1] = (out[-1][0], max(out[-1][1], b))
        else:
            out.append((a, b))
    return out


class Escena:
    def __init__(self, n, spec, F, T):
        self.n, self.spec, self.F, self.T = n, spec, F, T
        self.mov = spec['marco'] == 'mov'
        self.W, self.Hv = MARCO[spec['marco']]
        iw, ih = spec['img']
        self.Hp = self.W * ih / iw  # alto de la página entera, en px de pantalla
        self.R = _reloj(F, T)
        self.css, self.capas, self.vista, self.marcas = [], [], [], []
        self.scroll = [(0.0, spec.get('y0', 0) * self.Hp, None)]  # (t, px, curva)
        self.cam = [(0.0, (.5, .5, 1.0), None)]  # (t, (cx, cy, z) en fracciones de la pantalla, curva)
        self.cur = []  # (t, x, y, curva) en px de pantalla
        self.clics, self.teclas, self.toques = [], [], []
        self.rnd = random.Random(n * 7919 + 17)

    # ── scroll ──
    def y_en(self, t):
        """Scroll (px) en el segundo t, con la misma forma de frenada que el CSS."""
        pts = self.scroll
        for i in range(1, len(pts)):
            t0, y0 = pts[i - 1][0], pts[i - 1][1]
            t1, y1 = pts[i][0], pts[i][1]
            if t <= t0:
                return y0
            if t <= t1:
                k = (t - t0) / max(1e-6, t1 - t0)
                return y0 + (y1 - y0) * (1 - (1 - k) ** 3)
        return pts[-1][1]

    def a_vista(self, t, x, y):
        """De la página (fracciones) a la pantalla (px) en el segundo t."""
        vy = y * self.Hp - self.y_en(t)
        if not -2 <= vy <= self.Hv + 2:
            print(f'    ⚠ escena {self.n}: ({x:.3f}, {y:.3f}) queda fuera de la pantalla a los {t:.1f} s (scroll {self.y_en(t) / self.Hp:.3f})')
        return x * self.W, vy

    def hacer_scroll(self, t, yfr):
        y1 = max(0, min(self.Hp - self.Hv, yfr * self.Hp))
        y0 = self.y_en(t)
        D = y1 - y0
        if abs(D) < 2:
            return
        if not self.mov:
            # rueda del ratón: golpes de ~110 px que se encadenan y cada uno frena (el scroll suave de Chrome)
            n = max(2, round(abs(D) / 110)); dt = 0.075
            for k in range(n):
                self.scroll.append((t + k * dt, y0 + D * k / n, 'rueda'))
            self.scroll.append((t + n * dt + 0.24, y1, None))
        else:
            # el dedo se apoya, arrastra (la página va pegada a él), suelta y la inercia hace el resto
            arr = min(abs(D), self.Hv * 0.3) * (1 if D > 0 else -1)
            fx = self.W * (0.6 + self.rnd.uniform(-.07, .07)); fy0 = self.Hv * (0.72 if D > 0 else 0.3)
            ta, tb = t - 0.12, t + 0.16
            self._poner_dedo(ta, fx, fy0)
            self.cur.append((t, fx, fy0, None))
            self.cur.append((tb, fx + self.rnd.uniform(-12, 12), fy0 - arr, None))
            self.toques.append((ta, tb + 0.02))
            self.scroll.append((t, y0, None))
            self.scroll.append((tb, y0 + arr, 'inercia'))
            self.scroll.append((tb + (0.9 if abs(D) > abs(arr) + 5 else 0.1), y1, None))

    # ── cursor y dedo ──
    def _poner_dedo(self, t, x, y):
        if self.cur:
            self.cur.append((t - 0.03, *self.cur[-1][1:3], 'salto'))
        self.cur.append((t - 0.02, x, y, None))

    def ir_px(self, t, x, y):
        if self.mov:
            self._poner_dedo(t, x, y)
            return
        if not self.cur:  # entra desde abajo a la derecha
            self.cur.append((max(0, t - 1.1), self.W * 0.86, self.Hv * 1.06, 'mano'))
        tp, xp, yp, _ = self.cur[-1]
        dist = math.hypot(x - xp, y - yp) / self.W
        t0 = max(tp, t - min(1.1, 0.32 + 0.75 * dist))
        if t0 - tp > 1.4:  # mientras espera, la mano no está quieta del todo
            k = int((t0 - tp) // 1.6)
            for j in range(1, k + 1):
                self.cur.append((tp + j * (t0 - tp) / (k + 1), xp + self.rnd.uniform(-9, 9), yp + self.rnd.uniform(-6, 6), 'mano2'))
        self.cur.append((t0, *self.cur[-1][1:3], 'mano'))
        # se pasa un pelín y corrige, como una mano de verdad
        self.cur.append((t, x + (x - xp) * 0.025, y + (y - yp) * 0.025, 'mano2'))
        self.cur.append((t + 0.14, x, y, None))

    def ir(self, t, x, y):
        self.ir_px(t, *self.a_vista(t, x, y))

    def clic(self, t, x, y):
        self.ir(t, x, y)
        self.clics.append(round(t + 0.04, 3))
        if self.mov:
            self.toques.append((t - 0.08, t + 0.24))

    # ── cámara ──
    def zoom(self, t, x, y, z, dur=0.9):
        vx, vy = self.a_vista(t, x, y)
        tp, (px, py, pz), _ = self.cam[-1]
        t0 = max(tp + 0.05, t - dur)
        if t0 - tp > 0.4:  # mientras espera, la cámara sigue empujando despacio: nunca se queda quieta
            self.cam.append((t0, (px, py, pz * (1 + min(0.045, 0.011 * (t0 - tp)))), 'cam'))
        else:
            self.cam[-1] = (tp, (px, py, pz), 'cam')
        self.cam.append((t, (vx / self.W, vy / self.Hv, z), 'lineal'))

    def cam_css(self):
        W, H = self.W, self.Hv

        def tr(v):
            cx, cy, z = v
            tx = min(0, max(W - z * W, W / 2 - z * cx * W))
            ty = min(0, max(H - z * H, H / 2 - z * cy * H))
            return f'transform: translate({tx:.1f}px, {ty:.1f}px) scale({z:.4f})'
        pts = list(self.cam)
        tp, v, _ = pts[-1]
        if self.T - tp > 0.4:  # empuje final, hasta el corte
            pts[-1] = (tp, v, 'lineal')
            pts.append((self.T, (v[0], v[1], v[2] * (1 + min(0.05, 0.011 * (self.T - tp)))), None))
        return _kf(f'drcam{self.n}', self.T, pts, tr)

    def scroll_css(self):
        return _kf(f'drpag{self.n}', self.T, self.scroll, lambda y: f'transform: translateY({-y:.1f}px)')

    def cur_css(self):
        if not self.cur:
            return ''
        pts = sorted(self.cur, key=lambda p: p[0])
        swap = {'mano': 'mano2', 'mano2': 'mano'}  # el eje y con otra curva que el x: la trayectoria sale curva
        css = [_kf(f'drcx{self.n}', self.T, [(t, x, e) for t, x, y, e in pts], lambda x: f'left: {x:.1f}px'),
               _kf(f'drcy{self.n}', self.T, [(t, y, swap.get(e, e)) for t, x, y, e in pts], lambda y: f'top: {y:.1f}px')]
        if self.mov:  # el dedo solo se ve mientras toca la pantalla
            vis = [(0, 0, None)]
            for a, b in _intervalos(self.toques):
                vis += [(a - 0.07, 0, None), (a, 1, None), (b, 1, None), (b + 0.14, 0, None)]
            css.append(_kf(f'drvis{self.n}', self.T, vis, lambda v: f'opacity: {v * .85:.2f}; scale: {1.35 - .35 * v:.2f}'))
        else:
            t0 = pts[0][0]
            css.append(_kf(f'drvis{self.n}', self.T, [(0, 0, None), (t0, 0, None), (t0 + 0.2, 1, None), (self.T - 0.5, 1, None), (self.T - 0.1, 0, None)], lambda v: f'opacity: {v}'))
        if self.clics:  # clic: el cursor se hunde y suelta una onda
            pr, on = [(0, 0, None)], [(0, 0, None)]
            for c in self.clics:
                pr += [(c - 0.01, 0, None), (c, 1, None), (c + 0.13, 0, None)]
                on += [(c - 0.01, 0, None), (c, 1, None), (c + 0.5, 2, None)]
            css.append(_kf(f'drpr{self.n}', self.T, pr, lambda v: f'transform: scale({1 - .18 * v:.2f})'))
            css.append(_kf(f'dron{self.n}', self.T, on, lambda v: 'opacity: 0; transform: scale(.3)' if v == 0 else ('opacity: .95; transform: scale(.3)' if v == 1 else 'opacity: 0; transform: scale(2.1)')))
        return '\n'.join(css)

    # ── capas sobre la página ──
    def _caja(self, x, y, w, h, cls, estilo='', dentro='', var=''):
        return f'<div class="{cls}" style="left:{x * 100:.3f}%;top:{y * 100:.3f}%;width:{w * 100:.3f}%;height:{h * 100:.3f}%;{var}{estilo}">{dentro}</div>'

    def _estilo(self, e):
        iw = self.spec['img'][0]
        px = lambda v: f'calc({v} / {iw} * 100cqw)'
        e = dict(e or {}); out = []
        if 'fs' in e:
            out.append(f'font-size:{px(e.pop("fs"))}')
        for k, css in (('color', 'color'), ('fondo', 'background'), ('peso', 'font-weight'), ('alin', 'text-align'), ('lh', 'line-height'), ('pad', 'padding'),
                       ('radio', 'border-radius'), ('borde', 'border')):
            if k in e:
                v = e.pop(k)
                if k == 'pad':
                    v = f'0 {px(v)}'
                if k == 'radio':
                    v = px(v)
                out.append(f'{css}:{v}')
        return ';'.join(out + [f'{k}:{v}' for k, v in e.items()]) + ';'

    def _letras(self, texto, t, cps, humano):
        """Cada letra aparece a su hora y el cursor de texto va justo detrás. Devuelve (html, cuándo acaba)."""
        out, tt = [], t
        for tr in re.split(r'(\n)', texto):
            if tr == '\n':
                out.append('<br>'); tt += 0.3 if humano else 0.1
                continue
            for ch in tr:
                g = 1 / cps
                if humano:
                    g *= self.rnd.uniform(.55, 1.6) * (1.35 if ch == ' ' else 1)
                elif ch == ' ':
                    g = 0.0 if self.rnd.random() < .5 else g * 1.6  # la IA suelta palabras enteras
                tt += g
                out.append(f'<span style="--t:{tt + 0.1:.3f}s">{_html.escape(ch) if ch != " " else " "}</span>')
                if humano and ch != ' ':
                    self.teclas.append(round(tt, 3))
        return ''.join(out), tt

    def teclear(self, t, x, y, w, h, texto, estilo):
        self.clic(t, x + w * 0.3, y + h * 0.55)
        e = dict(estilo or {}); e.setdefault('fondo', '#0c0d11')
        letras, fin = self._letras(texto, t + 0.4, 11, True)
        self.capas.append(self._caja(x, y, w, h, 'dr-campo', self._estilo(e), f'<span class="dr-tx" style="--fin:{fin + 0.1:.2f}s">{letras}</span>', f'--t:{t + 0.12:.2f}s;'))
        return fin

    def stream(self, t, x, y, w, h, texto, estilo):
        estilo = dict(estilo or {}); cps = estilo.pop('cps', 75)
        letras, fin = self._letras(texto, t, cps, False)
        self.capas.append(self._caja(x, y, w, h, 'dr-stream', self._estilo(estilo), f'<span class="dr-tx" style="--fin:{fin + 0.1:.2f}s">{letras}</span>', f'--t:{t + 0.1:.2f}s;'))
        return fin

    def tapa(self, t0, t1, x, y, w, h, contenido, estilo):
        estilo = dict(estilo or {}); cls = ('dr-tapa ' + estilo.pop('clase')) if 'clase' in estilo else 'dr-tapa'
        self.capas.append(self._caja(x, y, w, h, cls, self._estilo(estilo), contenido, f'--t:{t0 + 0.1:.2f}s;--d:{max(0.01, t1 - t0):.2f}s;'))

    def contar(self, t, x, y, w, h, antes, n, despues, estilo):
        nom = f'drn{self.n}_{len(self.css)}'
        self.css.append(f'@property --{nom} {{ syntax: "<integer>"; inherits: false; initial-value: 0; }}\n'
                        f'@keyframes {nom} {{ from {{ --{nom}: 0; }} to {{ --{nom}: {n}; }} }}\n'
                        f'.dr{self.n}.active .{nom} {{ counter-reset: c var(--{nom}); animation: {nom} 1.7s cubic-bezier(.2, .7, .2, 1) {t + 0.1:.2f}s both; }}'
                        f' .{nom}::before {{ content: "{antes}" counter(c) "{despues}"; }}')
        self.capas.append(self._caja(x, y, w, h, f'dr-num {nom}', self._estilo(estilo)))

    def firma(self, t, x, y, w, h, ruta, dur=1.9):
        self.capas.append(self._caja(x, y, w, h, 'dr-firma', '', f'<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="--t:{t + 0.1:.2f}s;--d:{dur:.2f}s"><path d="{ruta}"/></svg>'))
        pts = _muestras(ruta, 30)
        vx, vy = self.a_vista(t, x + w * pts[0][0] / 100, y + h * pts[0][1] / 100)
        self._poner_dedo(t, vx, vy)
        for i, (px, py) in enumerate(pts):
            ti = t + dur * i / (len(pts) - 1)
            vx, vy = self.a_vista(ti, x + w * px / 100, y + h * py / 100)
            self.cur.append((ti, vx, vy, None))
        self.toques.append((t - 0.05, t + dur + 0.05))

    def pulsar(self, t, x, y, w, h):
        self.capas.append(self._caja(x, y, w, h, 'dr-pulsa', '', '', f'--t:{t + 0.1:.2f}s;'))

    def hover(self, t0, t1, x, y, w, h):
        self.capas.append(self._caja(x, y, w, h, 'dr-hover', '', '', f'--t:{t0 + 0.1:.2f}s;--d:{max(0.3, t1 - t0):.2f}s;'))

    def aviso(self, t0, t1, contenido):
        self.vista.append(f'<div class="dr-aviso{" mov" if self.mov else ""}" style="--t:{t0 + 0.1:.2f}s;--d:{max(0.5, t1 - t0):.2f}s">{contenido}</div>')

    def marca(self, t0, t1, x, y, w, h, txt):
        self.marcas.append((t0, t1, x, y, w, h, txt))


def _muestras(ruta, n):
    """Puntos de una ruta SVG sencilla (M/L/Q/C absolutos) para que el dedo la recorra."""
    tok = re.findall(r'[MLQC]|-?[\d.]+', ruta)
    segs, cur, i = [], (0, 0), 0
    while i < len(tok):
        c = tok[i]; i += 1
        k = {'M': 2, 'L': 2, 'Q': 4, 'C': 6}[c]
        v = list(map(float, tok[i:i + k])); i += k
        if c == 'M':
            cur = (v[0], v[1]); continue
        segs.append((c, cur, v)); cur = (v[-2], v[-1])
    pts = []
    for c, p0, v in segs:
        for j in range(1, 9):
            s = j / 8
            if c == 'L':
                pts.append((p0[0] + (v[0] - p0[0]) * s, p0[1] + (v[1] - p0[1]) * s))
            elif c == 'Q':
                a, b, d = (1 - s) ** 2, 2 * (1 - s) * s, s * s
                pts.append((a * p0[0] + b * v[0] + d * v[2], a * p0[1] + b * v[1] + d * v[3]))
            else:
                a, b, d, e = (1 - s) ** 3, 3 * (1 - s) ** 2 * s, 3 * (1 - s) * s * s, s ** 3
                pts.append((a * p0[0] + b * v[0] + d * v[2] + e * v[4], a * p0[1] + b * v[1] + d * v[3] + e * v[5]))
    paso = max(1, len(pts) // n)
    return [segs[0][1]] + pts[::paso] + [pts[-1]]


# ───────────────────────── guion de cada escena ─────────────────────────
CAMPO = {'fs': 19, 'color': '#e8ebf2', 'fondo': '#0c0d11', 'pad': 16, 'radio': 10, 'borde': '1px solid #3a3d47'}
CAMPO_M = {'fs': 26, 'color': '#e8ebf2', 'fondo': '#0c0d12', 'pad': 26, 'radio': 18}
BOTON_M = {'fs': 27, 'color': '#fff', 'fondo': '#3d8bff', 'radio': 18, 'peso': 700, 'alin': 'center'}
ESTRELLA = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.6 9.4l6.5-.8z" fill="#5b9cff"/></svg>'
NOTA = {'fs': 15, 'color': '#9aa3b2', 'fondo': '#1d2026'}

PITCH_TXT = ('Boas, equipo da Sala Capitol!\n\nSomos Os Herdeiros do Código, banda de Rock Bravú e Punk-Rock galaico liderada por Brais Moure (MoureDev) á batería. '
             'Temos un directo cheo de retranca, riffs potentes e enerxía para encher a pista de Santiago.\n\nQueremos pechar a nosa data de presentación do disco '
             '"Compila ou Morre" para o venres 13 de Novembro. Temos unha comunidade fiel de máis de 40.000 seguidores en Galicia.\n\n'
             'Dossier e directos: https://bandmanager.io/epk?b=os-herdeiros-do-codigo\n\n¿Como tedes a dispoñibilidade para ese venres de novembro?\n\nUnha aperta bravú,\nOs Herdeiros do Código Management')
SWAP_TXT = ('¡Buenas, Master of Prompts! 🎸🔥\n\nOs escribimos desde Os Herdeiros do Código. Nos flipa vuestro directo y creemos que juntos llenamos dos salas.\n\n'
            'Os proponemos un intercambio de fechas (Date Swap) para noviembre:\n\n1. Venís a tocar con nosotros a Santiago de Compostela (Sala Capitol): cartel doble y taquilla al 50 %.\n'
            '2. Nosotros vamos a Vigo, a vuestra sala de siempre, y sumamos los dos públicos.\n\n¿Lo hablamos por WhatsApp esta semana?')

# la pantalla del reto no es una captura: es la app dibujada aquí. Dos pantallas de alto (1792x1644): arriba el setlist y la formación, abajo el correo
SETLIST = [('Enter Sandbox', 'Enter Sandman · Metallica', '≈123', 'Arrancas tú: cuatro de charles y a la sandbox'), ('Master of Pull Requests', 'Master of Puppets · Metallica', '≈212', 'Doble bombo. Sin piedad y sin code review'), ('Highway to Deploy', 'Highway to Hell · AC/DC', '≈116', 'Que el público cante: «¡a producción!»'), ('Back in Prod', 'Back in Black · AC/DC', '≈94', 'Groove de AC/DC: menos es más'), ('The Number of the Bug', 'The Number of the Beast · Iron Maiden', '≈120', 'Grito inicial: 666 errores en consola'), ('Fear of the Deadline', 'Fear of the Dark · Iron Maiden', '≈145', 'Todo el mundo a coro: oh-oh-oh'), ('Before I Commit', 'Before I Forget · Slipknot', '≈128', 'Entrada con todo el kit. Aquí se suda'), ('Psychosocket', 'Psychosocial · Slipknot', '≈135', 'Contratiempos: aquí te luces'), ('Freak on a Branch', 'Freak on a Leash · Korn', '≈105', 'El beatbox lo hace la guitarra'), ('Blind Deploy', 'Blind · Korn', '≈110', 'Silencio… y «¿Estáis listos?»')]
RETO_HTML = '''<div class="dr-app">
  <header style="height:4.5%"><b>BandManager<em>.io</em></b><span class="dr-chip">DC · Diego de la Calle</span></header>
  <h3 style="top:6.2%">Master of Prompts · Primer ensayo</h3><p class="dr-sub" style="top:10.6%">Tributo metal con letras de programador · Metallica, AC/DC, Iron Maiden, Slipknot y Korn · sábado, 11:00</p>
  <section class="dr-hojaset" style="left:4%;top:14.5%;width:55%;height:33.5%">
    <div class="dr-hs-top"><b>Setlist · Primer ensayo</b><span>Copia para músico <em>Brais Moure</em> · Batería · 10 temas · ≈50 min</span></div>
    <p class="dr-vacia">Preparando tu hoja…</p>
  </section>
  <section class="dr-col" style="left:62%;top:14.5%;width:34%;height:25%">
    <label style="top:5%">Formación</label>
    <div class="dr-fila" style="top:18%"><span>🎸</span><b>Bajo</b><em>Diego de la Calle</em><small class="dr-lider">Líder</small></div>
    <div class="dr-fila" style="top:38%"><span>🎸</span><b>Guitarra</b><em>Confirmado</em><small>✓</small></div>
    <div class="dr-fila" style="top:58%"><span>🎤</span><b>Voz</b><em>Confirmado</em><small>✓</small></div>
    <div class="dr-fila dr-falta" style="top:78%"><span>🥁</span><b>Batería</b><em class="dr-busca">Buscando batería…</em><small>Se busca</small></div>
  </section>
  <div class="dr-boton" style="left:75%;top:41.5%;width:21%;height:4%">✉ Escribirle</div>
  <section class="dr-correo" style="left:5%;top:51%;width:90%;height:46%">
    <div class="dr-c-top"><b>Nuevo mensaje</b><span>✨ Redactado por la IA · lo revisas antes de enviar</span></div>
    <p class="dr-c-l" style="top:11%"><i>Para</i>Brais Moure · MoureDev</p>
    <p class="dr-c-l" style="top:19%"><i>Asunto</i></p>
    <p class="dr-adj" style="top:78%">📎 Setlist · Primer ensayo · <b>Hoja de batería de Brais</b> · 10 temas</p>
    <div class="dr-boton" style="left:2.5%;top:88%;width:14%;height:8%">Enviar</div>
  </section>
</div>'''
CORREO_BRAIS = ('Hola, Brais:\n\nSabemos que en casa le das caña a la batería (y muy bien). Y nos da que te falta una cosa: subirte a un escenario.\n\n'
                'Estoy montando Master of Prompts, una banda de tributo metal —Metallica, AC/DC, Iron Maiden, Slipknot y Korn— con letras de coña sobre desarrollar aplicaciones. '
                'Te adjunto el setlist del primer ensayo, con tu hoja de batería.\n\nNos falta batería. Y nos encantaría que fueras tú.\n\n'
                'Primer ensayo: el sábado a las 11. Trae las baquetas. 🤘\n\nUn abrazo metalero,\nDiego de la Calle · bajo')

# la bandeja de Brais (sin marca de ningún correo real): el mensaje de Diego, recién llegado
BANDEJA_HTML = '''<div class="dr-app dr-bandeja">
  <header><b>Correo</b><span class="dr-chip">BM · Brais Moure</span></header>
  <aside class="dr-lista">
    <p class="dr-m nuevo"><b>Diego de la Calle</b><span>¿Te vienes a la batería? 🤘</span><small>ahora</small></p>
    <p class="dr-m"><b>The Big School</b><span>Entregas del TFM: últimas presentaciones</span><small>09:12</small></p>
    <p class="dr-m"><b>GitHub</b><span>[mouredev] Nueva issue en el repositorio</span><small>08:40</small></p>
    <p class="dr-m"><b>Comunidad MoureDev</b><span>Resumen semanal de la comunidad</span><small>ayer</small></p>
    <p class="dr-m"><b>Tienda de música</b><span>Tus baquetas ya están en camino</span><small>ayer</small></p>
  </aside>
  <div class="dr-leer"><p class="dr-vacia" style="left:6%;top:12%">Selecciona un mensaje</p></div>
</div>'''
LEIDO_HTML = ('<div class="dr-leido"><h4>¿Te vienes a la batería? 🤘</h4><p class="dr-de"><b>Diego de la Calle</b> · vía BandManager · ahora</p>'
              '<p>Hola, Brais:</p><p>Sabemos que en casa le das caña a la batería (y muy bien). Y nos da que te falta una cosa: subirte a un escenario.</p>'
              '<p>Nos falta batería. Y nos encantaría que fueras tú.</p><p class="dr-firma-c">Diego de la Calle · bajo</p>'
              '<p class="dr-adj2">📎 Setlist · Primer ensayo · Hoja de batería de Brais · 10 temas</p>'
              '<div class="dr-acepta"><span class="si">🥁 Aceptar la invitación</span><span class="no">Pensármelo</span></div>'
              '<p class="dr-ens">📅 Primer ensayo: sábado · 11:00 · Te guardamos el sitio</p></div>')
RETO_CAMPO = {'fs': 30, 'color': '#e8ebf2', 'fondo': '#0c0d11', 'pad': 22, 'radio': 14, 'borde': '1px solid #3d8bff'}

DIRECCION = {
    # vídeos de la app: ya traen su propio cursor; la cámara y los rótulos los acompañan
    'Todas las salas, en un sitio': dict(
        img=(1600, 900), marco='esc', y0=.09,
        pasos=[('zoom', '2-0.6', .38, .42, 1.42), ('marca', '2', '4-0.3', .22, .26, .55, .5, 'Todas las salas y festivales, con su estado y su contacto'),
               ('zoom', '4', .55, .45, 1.18), ('marca', '4+0.3', '5', None, None, None, None, 'El Scout busca salas nuevas por ti'),
               ('zoom', '5-0.3', .56, .55, 1.38), ('marca', '5', 'fin-0.4', None, None, None, None, 'Y todas, en el mapa de toda España')]),
    'Cambio de perfil': dict(
        img=(1600, 900), marco='esc', y0=.09,
        pasos=[('zoom', '1+1.2', .12, .14, 1.65), ('marca', '1+1.5', '3-0.3', .02, .05, .17, .07, 'Una cuenta, varias bandas'),
               ('zoom', '3+0.4', .5, .5, 1.08), ('zoom', '5-0.4', .31, .50, 2.0), ('marca', '5-0.2', '6', .09, .33, .45, .45, '¿Quién toca hoy? Cambias de banda como de perfil'),
               ('zoom', '6+0.3', .5, .45, 1.12), ('marca', '6+0.5', 'fin-0.4', .01, .05, .13, .12, 'Cambia todo: logo, calendario y salas')]),

    # los reels: se cuenta la idea, la IA escribe la publicación, se ve la vista previa y se programa cada red
    'Del directo al reel': dict(
        img=(1920, 1650), marco='esc', y0=.10,
        pasos=[('scroll', '2-0.8', .43), ('zoom', '2-0.5', .46, .74, 1.3),
               ('marca', '2', '3+0.5', .21, .55, .50, .39, 'Cuentas la idea y la IA escribe el reel'),
               ('teclear', '2+0.2', .228, .665, .47, .075, 'Brais reventando la caja en el solo de Compila ou Morre', {'fs': 21, 'color': '#e7e9ee', 'fondo': '#1a1d23', 'lh': 1.5}),
               ('clic', '3-0.5', .30, .805), ('pulsar', '3-0.5', .228, .787, .147, .036),
               ('stream', '3', .39, .775, .31, .14, '¡Compila ou Morre en directo! 🤘 Brais le dio caña a la batería y la sala se vino abajo. #OsHerdeiros #Rock', {'fs': 20, 'color': '#e7e9ee', 'fondo': '#1a1d23', 'lh': 1.5}),
               ('scroll', '4-0.5', .14), ('zoom', '4-0.3', .86, .45, 1.25),
               ('marca', '4', '5-0.2', .745, .24, .225, .52, 'Vista previa con el formato de cada red'),
               ('zoom', '5', .46, .34, 1.3),
               ('marca', '5+0.3', 'fin-0.3', .21, .16, .50, .36, 'Cada reel, a su red, con su día y su hora')]),

    # el pitch: le da a «Regenerar» y la IA escribe el correo delante de todos; luego entrena el tono con estrellas
    'La IA escribe, tú apruebas': dict(
        img=(1920, 1650), marco='esc', y0=.07,
        pasos=[('zoom', 0.9, .66, .23, 1.35), ('clic', 1.0, .642, .228), ('pulsar', 1.0, .600, .216, .085, .028),
               ('stream', 1.25, .4552, .3135, .468, .345, PITCH_TXT, {'fs': 17.6, 'color': '#e7e9ee', 'fondo': '#191c21', 'lh': 1.62}),
               ('zoom', 2.3, .69, .42, 1.42), ('scroll', '2+1.6', .2), ('zoom', '2+2.6', .69, .54, 1.4),
               ('marca', '2+0.4', '3+0.6', .445, .295, .485, .385, 'Redactado con el tono de la banda y de la sala'),
               ('ir', '3+0.6', .72, .46), ('scroll', '4-0.4', .1), ('zoom', '4+0.2', .62, .3, 1.0),
               ('hover', '4+1.4', '5', .563, .172, .072, .028), ('ir', '4+1.6', .60, .185),
               ('marca', '4+1.8', '5+0.4', .563, .15, .09, .045, 'Un agente lee las respuestas y te avisa'),
               ('aviso', '6+0.2', '6+4.2', '<b>🔔 Sala Capitol</b> ha abierto tu correo · hace 2 min'),
               ('scroll', '6+2.6', .36), ('zoom', '6+3.4', .72, .79, 1.55),
               ('clic', '6+4.3', .5625, .7735), ('tapa', '6+4.3', 'fin', .552, .7605, .021, .026, ESTRELLA, {}), ('tapa', '6+4.3', 'fin', .576, .764, .022, .02, '5/5', NOTA),
               ('clic', '6+5.1', .797, .7735), ('tapa', '6+5.1', 'fin', .7865, .7605, .021, .026, ESTRELLA, {}), ('tapa', '6+5.1', 'fin', .8105, .764, .022, .02, '5/5', NOTA),
               ('marca', '6+4.0', 'fin-0.3', .455, .69, .475, .21, 'Calificas con estrellas y la IA aprende tu estilo'),
               ('clic', 'fin-1.1', .855, .848), ('pulsar', 'fin-1.1', .783, .836, .135, .025)]),

    # Date Swap: escribe la ciudad y la sala, la IA redacta la propuesta para Master of Prompts y la manda
    'Date Swap': dict(
        img=(1920, 1650), marco='esc', y0=.2,
        pasos=[('tapa', 0, '1+4.4', .2645, .435, .468, .25, '<i class="dr-vacio">Escribe la ciudad y la sala, y la IA redacta la propuesta…</i>', {'fs': 14.2, 'color': '#6b7280', 'fondo': '#0c0d12'}),
               ('tapa', 0, 'fin', .278, .2645, .42, .024, 'Generador de pitch Date Swap: Os Herdeiros do Código x Master of Prompts', {'fs': 19.5, 'color': '#5b9cff', 'fondo': '#16181e', 'peso': 600}),
               ('tapa', 0, 'fin', .309, .716, .14, .02, 'Master of Prompts', {'fs': 14.5, 'color': '#ffffff', 'fondo': '#16181e', 'peso': 700}),
               ('zoom', 0.8, .42, .33, 1.65),
               ('teclear', 1.0, .2665, .3475, .1495, .031, 'Santiago de Compostela', CAMPO),
               ('teclear', '1+3.1', .4255, .3475, .1495, .031, 'Sala Capitol', CAMPO),
               ('zoom', '1+4.6', .5, .5, 1.28),
               ('stream', '1+4.4', .2645, .435, .468, .25, SWAP_TXT, {'fs': 14.2, 'color': '#d7dbe3', 'fondo': '#0c0d12', 'lh': 1.72}),
               ('marca', '1+0.6', '1+4.3', .255, .265, .495, .085, 'Eliges ciudad, sala y fechas'),
               ('marca', '1+4.6', '3+0.5', .255, .425, .495, .26, 'La IA redacta la propuesta, de músico a músico'),
               ('ir', '2+1', .55, .55),
               ('scroll', '4-0.5', .26), ('zoom', '4', .62, .66, 1.75), ('hover', '4+0.6', '5', .642, .706, .062, .025), ('ir', '4+0.8', .704, .722),
               ('clic', '5+0.3', .72, .725), ('pulsar', '5+0.3', .665, .712, .078, .025),
               ('marca', '5+0.2', 'fin-0.5', .255, .705, .50, .045, 'Y la mandas por email o por WhatsApp'),
               ('aviso', '5+0.6', 'fin-0.3', '✓ Propuesta enviada a <b>Master of Prompts</b>'),
               ('zoom', '6+0.2', .5, .45, 1.06), ('ir', '7', .74, .30)]),

    # el calendario: va tocando días y en el panel de la derecha sale la ficha de cada uno (con su tiempo y el festivo)
    'Calendario de la banda': dict(
        img=(1920, 1650), marco='esc', y0=.08,
        pasos=[('zoom', 0.8, .45, .45, 1.3), ('hover', 1.2, 2.4, .232, .224, .23, .025), ('ir', 1.5, .33, .284),
               ('marca', '1+0.3', '1+4.2', .235, .31, .485, .55, 'Ensayos y bolos de todas tus bandas, por colores'),
               ('marca', '1+4.4', '2', None, None, None, None, 'Se sincroniza con Google Calendar'),
               ('clic', '3+0.2', .59, .49),
               ('tapa', '3+0.2', '3+2.6', .755, .105, .2, .17, '<p class="dr-ficha"><b>Sáb 10 Oct · Ensayo</b>Estudios Mans · A Coruña<br>Master of Prompts · 19:00<span>☀️ 18 °C · sin lluvia</span></p>', {'fondo': '#16181e'}),
               ('zoom', '3+0.5', .62, .32, 1.15),
               ('clic', '3+2.6', .27, .545),
               ('tapa', '3+2.6', 'fin', .755, .105, .2, .17, '<p class="dr-ficha"><b>Lun 12 Oct · Concierto</b>Sala Mon Live · Madrid<br>Os Herdeiros do Código · 21:30<span>🌤️ 21° · 🎉 Festivo nacional</span></p>', {'fondo': '#16181e'}),
               ('zoom', '3+2.9', .85, .2, 1.7), ('marca', '3+3.2', 'fin-0.4', .748, .1, .21, .18, 'Cada fecha, con su ficha, el tiempo y si cae en festivo'),
               ('ir', '4+0.4', .86, .19), ('zoom', '4+1.2', .5, .45, 1.08), ('ir', '4+1.9', .58, .56)]),

    # el dossier: baja con la rueda por la web de la banda, se para en las fotos, pasa por el contacto y le da al play
    'El dossier de la banda': dict(
        img=(1920, 2622), marco='esc',
        pasos=[('zoom', 0.6, .5, .14, 1.08), ('ir', 1.6, .52, .25), ('scroll', '1+0.9', .29), ('zoom', '1+1.6', .5, .4, 1.15),
               ('ir', '2+0.3', .30, .41), ('hover', '2+0.4', '2+2.6', .242, .37, .123, .09), ('zoom', '2+0.6', .30, .42, 1.75),
               ('ir', '2+2.0', .44, .41), ('hover', '2+2.0', '3', .373, .37, .124, .09),
               ('zoom', '3', .5, .42, 1.12), ('marca', '3+0.2', '3+3.4', .24, .335, .52, .16, 'La banda: fotos, formación y roles'),
               ('scroll', '3+3.0', .47), ('zoom', '3+3.6', .68, .63, 1.6), ('ir', '3+4.1', .675, .668), ('hover', '3+4.1', '3+6.4', .609, .655, .137, .026),
               ('marca', '3+3.8', '3+6.6', .60, .525, .16, .17, 'Contacto de booking, con botón de contratación'),
               ('scroll', '3+6.4', .62), ('zoom', '3+7.0', .4, .77, 1.45), ('clic', '3+7.6', .33, .7755),
               ('tapa', '3+7.6', 'fin', .2515, .7705, .148, .0095, '<span class="dr-eq"><i></i><i></i><i></i><i></i></span> Sonando · 0:12', {'fs': 11.5, 'color': '#8fd8ff', 'fondo': '#1a1d24', 'radio': 6, 'peso': 600}),
               ('marca', '4-0.4', 'fin-0.4', .24, .70, .52, .23, 'Temas destacados y galería de prensa'),
               ('zoom', '4', .5, .8, 1.06), ('ir', '4+1', .55, .86)]),

    # las cuentas: los números cuentan al cargar, pasa por cada bolo y aparece el gasto de las birras de Brais
    'Cuánto entra y cuánto queda': dict(
        img=(1920, 1650), marco='esc', y0=.03,
        pasos=[('contar', 0.4, .2275, .138, .1, .021, '+', 4270, ' €', {'fs': 38, 'color': '#ffffff', 'fondo': '#191c21', 'peso': 700}),
               ('contar', 0.55, .4865, .138, .1, .021, '-', 805, ' €', {'fs': 38, 'color': '#ffffff', 'fondo': '#191c21', 'peso': 700}),
               ('contar', 0.7, .7455, .138, .1, .021, '+', 3465, ' €', {'fs': 38, 'color': '#ffffff', 'fondo': '#191c21', 'peso': 700}),
               ('zoom', 1.0, .6, .14, 1.3), ('ir', 1.6, .5, .17),
               ('marca', '1+0.4', '2', .215, .095, .76, .125, 'Ingresos, gastos y caja neta, al día'),
               ('zoom', '2-0.4', .6, .32, 1.3), ('ir', '2', .6, .33), ('marca', '2', '2+3.8', .215, .275, .76, .105, 'Caché, gasolina y dietas de la gira, y beneficio por bolo'),
               ('scroll', '3-1.0', .32), ('zoom', '3-0.6', .6, .58, 1.22), ('hover', '3-0.4', '3+1.6', .23, .515, .73, .07), ('ir', '3-0.2', .45, .55),
               ('hover', '3+1.6', '3+3.4', .23, .585, .73, .07), ('ir', '3+1.8', .45, .63),
               ('marca', '3', '3+4', .23, .46, .74, .45, 'Cada bolo: caché, gastos y margen'),
               ('zoom', '3+3.8', .73, .58, 1.75), ('ir', '3+4.2', .73, .575), ('marca', '3+4.3', 'fin-0.4', .695, .52, .10, .38, 'Y lo que le toca a cada músico'),
               ('clic', '4-0.3', .925, .551), ('pulsar', '4-0.3', .893, .54, .065, .022),
               ('aviso', '4', 'fin-0.2', '🍺 Birras de la gira · <b>Brais</b> · 48 € · <i>pendiente de dividir</i>')]),

    # el acuerdo en el móvil de la sala: lo repasa con el dedo, escribe su nombre, marca la casilla, firma y le llega la copia
    'El acuerdo, firmado desde BandManager': dict(
        img=(780, 3518), marco='mov',
        pasos=[('zoom', 0.8, .5, .06, 1.08), ('scroll', '1+0.6', .135), ('scroll', '2+0.6', .215), ('zoom', '2+1.0', .5, .30, 1.18),
               ('marca', '2+1.2', '2+3.6', .05, .30, .90, .08, 'Caché por escrito: cantidad y forma de pago'),
               ('scroll', '2+3.4', .33), ('marca', '2+3.8', '3+0.2', .05, .395, .90, .125, 'Rider, camerino y catering, acordados'),
               ('scroll', '3+0.4', .505), ('zoom', '3+0.8', .5, .6, 1.1),
               ('teclear', '3+1.2', .089, .6075, .82, .0185, 'Marta Lois', CAMPO_M),
               ('teclear', '4+0.1', .089, .6955, .82, .0185, 'programacion@elfaro.example', CAMPO_M),
               ('clic', '4+2.0', .137, .751), ('tapa', '4+2.0', 'fin', .126, .746, .034, .0075, '✓', {'fs': 24, 'color': '#fff', 'fondo': '#3d8bff', 'radio': 6, 'peso': 800, 'alin': 'center', 'lh': 1.1}),
               ('scroll', '4+2.6', .655),
               ('firma', '4+3.0', .12, .812, .76, .058, 'M8 62 C14 30 22 20 26 44 C29 62 31 70 36 48 C40 30 44 26 46 52 C47 66 52 64 56 40 Q60 26 64 50 C66 62 72 60 76 44 L92 40', 1.7),
               ('marca', '4+2.8', '4+5.2', .05, .805, .90, .09, 'La sala firma con el dedo, sin instalar nada'),
               ('tapa', '4+4.8', 'fin', .085, .8935, .83, .025, '✓ Confirmar y firmar concierto', {**BOTON_M, 'lh': 2.4}),
               ('clic', '4+5.4', .5, .905), ('pulsar', '4+5.4', .085, .8935, .83, .025),
               ('aviso', '4+5.7', 'fin', '✓ <b>Acuerdo firmado</b><br>Copia enviada a programacion@elfaro.example'),
               ('marca', '4+5.7', 'fin-0.3', None, None, None, None, 'Y le llega su copia'), ('zoom', '5', .5, .55, 1.0)]),

    # la página de fans en el móvil del público: baja con el dedo, toca cada cosa y al final deja su correo
    'Un QR y el público se hace fan': dict(
        img=(780, 4088), marco='mov',
        pasos=[('zoom', 0.6, .5, .08, 1.06), ('clic', '1+1.0', .30, .223), ('scroll', '1+1.8', .21), ('clic', '1+3.0', .29, .307), ('pulsar', '1+3.0', .103, .297, .382, .021),
               ('marca', '1+2.6', '2+0.4', .08, .27, .84, .13, 'Sus redes, en un toque'),
               ('scroll', '2+0.6', .395), ('clic', '2+1.6', .68, .53), ('pulsar', '2+1.6', .513, .515, .348, .025),
               ('marca', '2+1.3', '2+3.6', .06, .43, .88, .13, 'Apoyan con dinero: Bizum, PayPal o Revolut'),
               ('scroll', '2+3.6', .555), ('clic', '2+4.6', .33, .6225), ('pulsar', '2+4.6', .164, .617, .325, .0125),
               ('marca', '2+4.2', '3', .06, .56, .88, .17, 'Ven vuestros próximos conciertos y compran entrada'),
               ('scroll', '3-0.2', .672), ('clic', '3+0.6', .5, .7365),
               ('tapa', '3+0.9', 'fin', .07, .705, .86, .1, '<div class="dr-hoja"><b>🎁 ¡Llévate un regalo!</b><p>Déjanos tu correo y te mandamos una descarga exclusiva.</p></div>', {'fondo': '#1d2230', 'radio': 28, 'fs': 26, 'color': '#e8ebf2'}),
               ('teclear', '3+2.0', .11, .757, .78, .0155, 'lucia.fan@correo.example', {**CAMPO_M, 'fs': 24}),
               ('tapa', '3+4.6', 'fin', .11, .779, .78, .0155, '✓ Quiero mi regalo', {**BOTON_M, 'fs': 26, 'lh': 2.45}),
               ('clic', '3+5.4', .5, .787), ('pulsar', '3+5.4', .11, .779, .78, .0155),
               ('marca', '3+0.6', 'fin-0.3', .06, .70, .88, .11, 'Dejan su correo, con su permiso, y se llevan un regalo'),
               ('aviso', '3+5.8', 'fin', '🎁 ¡Hecho! Mira tu correo, <b>Lucía</b>'), ('zoom', '4', .5, .72, 1.0)]),

    # el reto: para Brais de verdad. El setlist del primer ensayo, su hueco en la formación y el correo que redacta la IA
    'El reto': dict(
        img=(1792, 1644), marco='esc', html=RETO_HTML, cola=1.8,
        pasos=[('zoom', 0.8, .5, .25, 1.05), ('ir', '1+1.6', .55, .2),
               ('marca', '1+1.2', '1+3.3', None, None, None, None, 'Para Brais Moure. El de verdad'),
               ('zoom', '1+3.3', .79, .28, 1.45), ('hover', '1+3.9', '2+0.2', .6302, 0.3400, .3196, .0375), ('ir', '1+4.1', .78, 0.3590),
               ('marca', '1+4.1', '2+0.2', .625, 0.3360, .33, .0455, 'En casa toca de lujo. Le falta el escenario'),
               ('zoom', '2+0.2', .31, .3, 1.3),
               ('tapa', '2+0.30', 'fin', .0435, 0.1952, .541, 0.0268, '<p class="dr-tema2"><u>1</u><b>Enter Sandbox</b><span>Enter Sandman · Metallica</span><em>≈123 BPM</em><i>↖ Arrancas tú: cuatro de charles y a la sandbox</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+0.65', 'fin', .0435, 0.2234, .541, 0.0268, '<p class="dr-tema2"><u>2</u><b>Master of Pull Requests</b><span>Master of Puppets · Metallica</span><em>≈212 BPM</em><i>↖ Doble bombo. Sin piedad y sin code review</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+1.00', 'fin', .0435, 0.2515, .541, 0.0268, '<p class="dr-tema2"><u>3</u><b>Highway to Deploy</b><span>Highway to Hell · AC/DC</span><em>≈116 BPM</em><i>↖ Que el público cante: «¡a producción!»</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+1.35', 'fin', .0435, 0.2797, .541, 0.0268, '<p class="dr-tema2"><u>4</u><b>Back in Prod</b><span>Back in Black · AC/DC</span><em>≈94 BPM</em><i>↖ Groove de AC/DC: menos es más</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+1.70', 'fin', .0435, 0.3078, .541, 0.0268, '<p class="dr-tema2"><u>5</u><b>The Number of the Bug</b><span>The Number of the Beast · Iron Maiden</span><em>≈120 BPM</em><i>↖ Grito inicial: 666 errores en consola</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+2.05', 'fin', .0435, 0.3360, .541, 0.0268, '<p class="dr-tema2"><u>6</u><b>Fear of the Deadline</b><span>Fear of the Dark · Iron Maiden</span><em>≈145 BPM</em><i>↖ Todo el mundo a coro: oh-oh-oh</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+2.40', 'fin', .0435, 0.3641, .541, 0.0268, '<p class="dr-tema2"><u>7</u><b>Before I Commit</b><span>Before I Forget · Slipknot</span><em>≈128 BPM</em><i>↖ Entrada con todo el kit. Aquí se suda</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+2.75', 'fin', .0435, 0.3922, .541, 0.0268, '<p class="dr-tema2"><u>8</u><b>Psychosocket</b><span>Psychosocial · Slipknot</span><em>≈135 BPM</em><i>↖ Contratiempos: aquí te luces</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+3.10', 'fin', .0435, 0.4204, .541, 0.0268, '<p class="dr-tema2"><u>9</u><b>Freak on a Branch</b><span>Freak on a Leash · Korn</span><em>≈105 BPM</em><i>↖ El beatbox lo hace la guitarra</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('tapa', '2+3.45', 'fin', .0435, 0.4485, .541, 0.0268, '<p class="dr-tema2"><u>10</u><b>Blind Deploy</b><span>Blind · Korn</span><em>≈110 BPM</em><i>↖ Silencio… y «¿Estáis listos?»</i></p>', {'fondo': '#fbfaf6', 'radio': 4}),
               ('marca', '2+0.4', '2+3.6', .035, .14, .56, .345, 'Metallica, AC/DC, Iron Maiden, Slipknot y Korn… con letras de programador'),
               ('ir', '2+1.0', .3, 0.2334), ('ir', '2+3.0', .3, 0.3741),
               ('zoom', '3-0.6', .8, .4, 1.25), ('clic', '3-0.2', .855, .435), ('pulsar', '3-0.2', .75, .415, .21, .04),
               ('scroll', '3+0.3', .5), ('zoom', '3+0.7', .5, .74, 1.12),
               ('tapa', '3+0.6', 'fin', .14, .5951, .6, .02, '¿Te vienes a la batería? 🤘', {'fs': 22, 'color': '#fff', 'fondo': '#151821', 'peso': 600}),
               ('stream', '3+0.8', .075, .655, .85, .205, CORREO_BRAIS, {'fs': 18, 'color': '#dfe3ea', 'fondo': '#151821', 'lh': 1.5, 'cps': 230}),
               ('marca', '3+1.0', 'fin-2.4', .05, .505, .9, .47, 'Redactado por la IA, con su hoja de batería; Diego lo revisa'),
               ('zoom', 'fin-3.2', .2, .9, 1.35), ('clic', 'fin-2.6', .113, .9396), ('pulsar', 'fin-2.6', .0725, .9148, .126, .0368),
               ('aviso', 'fin-2.4', 'fin', '✓ <b>Enviado a Brais Moure</b><br><i>Con el setlist y su hoja de batería</i>'),
               ('marca', 'fin-2.4', 'fin-0.3', None, None, None, None, 'Enviado. Ahora le toca a Brais'),
               ('zoom', 'fin-2.0', .5, .74, 1.0), ('ir', 'fin-1.4', .6, .8)]),
    # la invitación: la bandeja de Brais; lo abre, lo lee y el cursor se queda sobre «Aceptar»
    'La invitación': dict(
        img=(1792, 822), marco='esc', html=BANDEJA_HTML, cola=2.5,
        pasos=[('zoom', 0.5, .2, .3, 1.15), ('ir', 1.4, .17, .175), ('hover', 1.2, 2.0, .005, .11, .32, .1), ('clic', 1.9, .17, .175),
               ('tapa', 1.95, 'fin', .335, .09, .665, .91, LEIDO_HTML, {'fondo': '#12141a', 'clase': 'suave'}),
               ('zoom', 2.6, .62, .42, 1.12), ('ir', '1+1.5', .55, .5),
               ('zoom', '2-0.5', .5, .74, 1.4), ('ir', '2', .45, .778), ('hover', '2', 'fin', .365, .7348, .1771, .0858),
               ('ir', 'fin-1.6', .442, .781), ('ir', 'fin-0.3', .446, .777)]),
}


def construir(n, spec, seccion):
    F = frases(seccion)
    fin = round((F[-1][0] + F[-1][1] + spec.get('cola', 0.9)) if F else 12, 2)
    E = Escena(n, spec, F, fin)
    R = E.R
    for p in spec['pasos']:
        a = p[0]
        if a == 'scroll':
            E.hacer_scroll(R(p[1]), p[2])
        elif a in ('zoom', 'ir', 'clic', 'teclear', 'stream', 'contar', 'firma', 'pulsar'):
            getattr(E, {'zoom': 'zoom', 'ir': 'ir', 'clic': 'clic', 'teclear': 'teclear', 'stream': 'stream', 'contar': 'contar', 'firma': 'firma', 'pulsar': 'pulsar'}[a])(R(p[1]), *p[2:])
        elif a in ('tapa', 'hover', 'marca'):
            getattr(E, a)(R(p[1]), R(p[2]), *p[3:])
        elif a == 'aviso':
            E.aviso(R(p[1]), R(p[2]), p[3])
        else:
            raise SystemExit(f'dirección: acción desconocida {a}')
    return E


MOVS = {}  # para el render: ya no hay ventanas de desenfoque (el movimiento es el de una pantalla de verdad)


def aplicar(S):
    """Convierte las capturas de las escenas con dirección en una pantalla manejada en directo."""
    for n, (titulo, spec) in enumerate(DIRECCION.items()):
        k = [i for i, x in enumerate(S) if x.lstrip().startswith('<section') and f'data-title="{titulo}"' in x]
        assert len(k) == 1, ('dirección', titulo, k)
        s = S[k[0]]
        m = re.search(r'<div class="ft-shot([^"]*)">(<img [^>]*>|<video .*?</video>)</div>', s, re.S)
        assert m, ('dirección: sin captura', titulo)
        E = construir(n, spec, s)
        iw, ih = spec['img']
        img = re.sub(r' style="[^"]*"', '', m.group(2), count=1) if 'html' not in spec else spec['html']
        marks = ''.join(
            f'<i class="dr-box" style="left:{x * 100:.2f}%;top:{y * 100:.2f}%;width:{w * 100:.2f}%;height:{h * 100:.2f}%;--t:{t0 + 0.1:.2f}s;--d:{round(t1 - t0, 2)}s"></i>'
            for t0, t1, x, y, w, h, _ in E.marcas if x is not None)
        labs = ''.join(
            f'<p class="dr-lab{" mov" if E.mov else ""}" style="--t:{t0 + 0.1:.2f}s;--d:{round(t1 - t0, 2)}s;--k:{j}"><b>{j + 1}</b>{txt}</p>'
            for j, (t0, t1, _, _, _, _, txt) in enumerate(E.marcas))
        cur = ('<i class="dr-cx"><i class="dr-cy"><i class="' + ('dr-dedo' if E.mov else 'dr-flecha') + '"></i></i></i>') if E.cur else ''
        pag = f'<div class="dr-pag" style="aspect-ratio:{iw}/{ih}">{img}{"".join(E.capas)}{marks}</div>'
        a = lambda nom, sel: f' .dr{n}.active {sel} {{ animation: {nom}{n} {E.T}s linear .1s both; }}'
        reglas = a('drcam', '.dr-cam') + a('drpag', '.dr-pag')
        if E.cur:
            reglas += a('drcx', '.dr-cx') + a('drcy', '.dr-cy')
            reglas += f' .dr{n}.active .dr-cy > i {{ animation: drvis{n} {E.T}s linear .1s both{f", drpr{n} {E.T}s linear .1s both" if E.clics else ""}; }}'
            if E.clics:
                reglas += f' .dr{n}.active .dr-cy > i::after {{ animation: dron{n} {E.T}s linear .1s both; }}'
        nuevo = (f'<div class="ft-shot{m.group(1)} dir"><div class="dr-cam">{pag}{cur}</div>{"".join(E.vista)}</div>{labs}'
                 f'\n<style>{reglas}\n{E.cam_css()}\n{E.scroll_css()}\n{E.cur_css()}\n' + '\n'.join(E.css) + '</style>')
        s = s[:m.start()] + nuevo + s[m.end():]
        s = s.replace('class="slide feat', f'class="slide feat dirigida dr{n}', 1)
        sonidos = f'data-clics="{",".join(f"{c + 0.1:.2f}" for c in E.clics)}" data-teclas="{",".join(f"{c + 0.1:.2f}" for c in E.teclas)}" '
        if 'cola' in spec:  # la escena se queda en pantalla después de la última frase
            sonidos += f'data-min="{int(E.T * 1000)}" '
        s = s.replace('data-transition=', sonidos + 'data-transition=', 1)
        S[k[0]] = s
        print(f'  dirección · {titulo}: {E.T:.1f} s · {len(E.clics)} clics · {len(E.teclas)} teclas')
