#!/usr/bin/env python3
"""Extrae el guion de index.html (escena.frase numerados) y escribe GUION_REVISION.md.

    python3 presentacion/tools/guion/revision.py

Los números (p. ej. 19.3) siguen el orden de la película: si se añaden o mueven escenas, cambian.
tools/lipsync_preparar.py usa estos mismos números.
"""
import html
import os
import re

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(os.path.dirname(AQUI))
N = {'bajo': 'Iago', 'bateria': 'Brais', 'voz': 'Alan', 'guitarra': 'Álvaro', 'manager': 'Programador (Sala El Faro)', 'sello': 'Peláez',
     'voz_mop': 'Voz de Master of Prompts', 'ia_claude': 'Claudio', 'ia_gemini': 'Guglio', 'diego': 'Diego', 'locutor': 'Radio Riff'}
R = {'bajo': 'bajo', 'bateria': 'batería', 'voz': 'voz', 'guitarra': 'guitarra'}


def sust(t):
    def f(m):
        k, fm = m.group(1), (m.group(2) or '')
        if fm == 'rol':
            return R.get(k, k)
        if fm == 'Rol':
            return R.get(k, k).capitalize()
        return N.get(k, k).split(' (')[0]
    return re.sub(r'\{([a-z_]+)(?::([A-Za-z]+))?\}', f, html.unescape(t))


def limpia(t):
    return sust(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t))).strip()


def escenas():
    """[{n, titulo, anexo, rotulo, titular, frases:[{id, who, quien, hora, txt, voz, say}], extra}]"""
    h = open(os.path.join(DECK, 'index.html'), encoding='utf-8').read()
    res, n = [], 0
    for m in re.finditer(r'<section\b([^>]*)>(.*?)</section>', h, re.S):
        a, body = m.group(1), m.group(2)
        t = re.search(r'data-title="([^"]*)"', a)
        if not t:
            continue
        n += 1
        tag = re.search(r'<span class="tag"[^>]*>(.*?)</span>', body, re.S)
        h2 = re.search(r'<h[12][^>]*>(.*?)</h[12]>', body, re.S)
        esc = {'n': n, 'titulo': html.unescape(t.group(1)), 'anexo': 'data-anexo' in a, 'rotulo': limpia(tag.group(1)) if tag else '',
               'titular': limpia(h2.group(1)) if h2 else '', 'frases': [], 'extra': []}
        for l in re.finditer(r'<(li|p|div|figure)\b([^>]*\bdata-who="([^"]*)"[^>]*)>(.*?)</\1>', body, re.S):
            attrs, who, inner = l.group(2), l.group(3), l.group(4)
            say = re.search(r'data-say="([^"]*)"', attrs)
            if not say:
                continue
            hora = re.search(r'data-t="([^"]*)"', attrs)
            esc['frases'].append({'id': f"{n:02d}.{len(esc['frases']) + 1}", 'who': who, 'quien': N.get(who, who), 'hora': hora.group(1) if hora else '',
                                  'txt': limpia(inner), 'voz': limpia(say.group(1)), 'say': html.unescape(say.group(1))})
        if not esc['frases']:
            for c in ['sub', 'cr-nota', 'dl-a', 'dl-b', 'ft-pill', 'nx-sin', 'gr-c', 'dream-line']:
                for x in re.finditer(r'<(?:p|span|div)\b[^>]*class="[^"]*\b' + c + r'\b[^"]*"[^>]*>(.*?)</(?:p|span|div)>', body, re.S):
                    tx = limpia(x.group(1))
                    if tx and tx not in esc['extra'] and 'data-who' not in x.group(0):
                        esc['extra'].append(tx)
        res.append(esc)
    return res


def markdown():
    out = ['# Guion completo para revisar\n',
           '_Generado desde la película tal y como está ahora (`python3 presentacion/tools/guion/revision.py`). Cada frase lleva un número (escena.frase): '
           'di «corrige 12.3: …» y se localiza. **Voz** = lo que dice el audio cuando difiere de lo que se lee (los `[corchetes]` son indicaciones de actuación; '
           'las palabras escritas como suenan, p. ej. «Spótifai», son para la pronunciación)._\n']
    for e in escenas():
        out.append(f"\n---\n\n## {e['n']:02d} · {e['titulo']}" + (' _(anexo: solo en preguntas)_' if e['anexo'] else '') + '\n')
        if e['rotulo']:
            out.append(f"**Rótulo:** {e['rotulo']}  ")
        if e['titular']:
            out.append(f"**Titular:** {e['titular']}  ")
        for f in e['frases']:
            ln = f"\n**{f['id']}** · **{f['quien']}**" + (f" ({f['hora']})" if f['hora'] else '') + f": {f['txt']}"
            if f['voz'] and re.sub(r'\[[^\]]*\]\s*', '', f['voz']).strip() != f['txt']:
                ln += f"  \n   _Voz:_ {f['voz']}"
            out.append(ln)
        if e['extra']:
            out.append('\n**Texto en pantalla:**')
            out += [f'- {x}' for x in e['extra'][:24]]
        elif not e['frases']:
            out.append('\n_(escena visual, sin diálogo)_')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    open(os.path.join(DECK, 'GUION_REVISION.md'), 'w', encoding='utf-8').write(markdown())
    print('GUION_REVISION.md escrito')
