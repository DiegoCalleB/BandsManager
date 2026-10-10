#!/usr/bin/env python3
"""Comprobación rápida de la presentación antes de subirla (sin navegador):
- cada elemento de deck.js que se busca por id existe en index.html (así no se rompe el arranque)
- cada frase hablada (data-who + data-say) tiene su audio en audio/voces/manifest.json y el mp3 existe
- cada personaje que habla está en reparto.js
Uso:  python3 presentacion/tools/comprobar.py      (sale con error si algo falla)
"""
import html
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import voces  # noqa: E402  (mismo hash y misma lectura del reparto que el generador de voces)

DECK = voces.DECK
fallos = []
idx = open(os.path.join(DECK, 'index.html'), encoding='utf-8').read()
deck = open(os.path.join(DECK, 'deck.js'), encoding='utf-8').read()
ids = set(re.findall(r'id="([^"]+)"', idx))
for i in sorted(set(re.findall(r"\$\('#([\w-]+)'\)", deck))):
    if i not in ids and f"if ($('#{i}'))" not in deck and f"($('#{i}') ||" not in deck:
        fallos.append(f'deck.js usa #{i} sin comprobarlo y no está en index.html')

R = voces.leer_reparto()
man = json.load(open(os.path.join(voces.SALIDA, 'manifest.json'), encoding='utf-8'))
p = voces.Frases(); p.feed(idx)
for who, say in p.frases:
    if who not in R:
        fallos.append(f'{who} no está en reparto.js'); continue
    texto = voces.sustituir(html.unescape(say), R)
    e = man.get(voces.fnv1a(who + '|' + texto))
    if not e:
        fallos.append(f'sin audio: {who} · {texto[:60]}')
    elif not os.path.exists(os.path.join(voces.SALIDA, e['f'])):
        fallos.append(f'falta el mp3 {e["f"]} de {who}')
print(f'{len(p.frases)} frases revisadas, {len(fallos)} fallos')
for f in fallos:
    print('  ✗', f)
sys.exit(1 if fallos else 0)
