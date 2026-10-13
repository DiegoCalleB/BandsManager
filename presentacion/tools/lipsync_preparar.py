#!/usr/bin/env python3
"""Prepara los planos de sincronía de labios: por cada plano de tools/lipsync/planos.json deja en presentacion/lipsync/<id>/
el audio de la frase, la imagen de referencia, la duración, un prompt y una ficha, listos para subir a la herramienta que se use
(Hedra, HeyGen, Sync Labs, LatentSync/Wav2Lip en local…). Después, el vídeo resultante se guarda como lipsync/<id>/plano.mp4.

    python3 presentacion/tools/lipsync_preparar.py                 # prepara los planos
    python3 presentacion/tools/lipsync_preparar.py --con-permiso 55.1,56.1   # desbloquea planos con cara de persona real

Reglas:
  · Un plano con «real»: true (cara de una persona real) NO se prepara sin --con-permiso: hace falta su consentimiento por escrito.
    «real»: «propio» (la cara de Diego, que decide por sí mismo) se prepara sin más.
    «real»: «confirmar» se prepara, pero la ficha lo avisa: confirma de quién es la foto antes de generar nada.
  · El audio sale de audio/voces (el que genera tools/voces.py). Si aún no existe, el plano queda «pendiente de voz».
"""
import json
import os
import shutil
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(AQUI, 'guion'))
import revision  # noqa: E402
import voces  # noqa: E402


def main():
    permiso = set()
    if '--con-permiso' in sys.argv:
        permiso = set(sys.argv[sys.argv.index('--con-permiso') + 1].split(','))
    planos = json.load(open(os.path.join(AQUI, 'lipsync', 'planos.json'), encoding='utf-8'))['planos']
    R = voces.leer_reparto()
    man = json.load(open(os.path.join(DECK, 'audio', 'voces', 'manifest.json'), encoding='utf-8'))
    frases = {f['id']: f for e in revision.escenas() for f in e['frases']}
    salida = os.path.join(DECK, 'lipsync')
    os.makedirs(salida, exist_ok=True)
    filas = []
    for p in planos:
        f = frases.get(p['id'])
        if not f:
            filas.append((p['id'], '—', 'NO EXISTE (el guion cambió: revisa el número)', '', ''))
            continue
        pers = R.get(f['who']) or {}
        texto = voces.sustituir(f['say'], R)
        h = voces.fnv1a(f['who'] + '|' + texto)
        m = man.get(h)
        real = p.get('real')
        estado = []
        if real is True and p['id'] not in permiso:
            filas.append((p['id'], f['quien'], 'BLOQUEADO: cara de persona real, falta permiso por escrito', f['txt'][:60], ''))
            continue
        d = os.path.join(salida, p['id'])
        os.makedirs(d, exist_ok=True)
        foto = pers.get('foto')
        if foto and os.path.exists(os.path.join(DECK, foto)):
            shutil.copy(os.path.join(DECK, foto), os.path.join(d, 'referencia' + os.path.splitext(foto)[1]))
        else:
            estado.append('sin imagen de referencia')
        audio = os.path.join(DECK, 'audio', 'voces', m['f']) if m else None
        if audio and os.path.exists(audio):
            shutil.copy(audio, os.path.join(d, 'audio.mp3'))
        else:
            estado.append('pendiente de voz (genera las voces con tools/voces.py)')
        if real == 'confirmar':
            estado.append('CONFIRMAR de quién es la foto antes de generar')
        dur = m['d'] if m else None
        prompt = (f"Plano medio, cámara casi fija, luz natural. {f['quien']} habla a cámara con naturalidad, gestos pequeños, mirada al objetivo. "
                  f"Sincroniza los labios con el audio adjunto. Mismo rostro, pelo y ropa que la imagen de referencia. Sin texto en pantalla, sin logotipos."
                  + (f" Duración: {dur:.1f} s." if dur else ''))
        open(os.path.join(d, 'prompt.txt'), 'w', encoding='utf-8').write(prompt + '\n')
        json.dump({'id': p['id'], 'personaje': f['quien'], 'frase': f['txt'], 'voz_dicha': f['voz'], 'por_que': p['por_que'], 'real': real,
                   'duracion_s': dur, 'audio': 'audio.mp3' if (audio and os.path.exists(audio)) else None, 'estado': estado,
                   'salida_esperada': 'plano.mp4'}, open(os.path.join(d, 'ficha.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        filas.append((p['id'], f['quien'], '; '.join(estado) or 'LISTO para subir', f['txt'][:60], f'{dur:.1f} s' if dur else ''))
    with open(os.path.join(salida, 'INDICE.md'), 'w', encoding='utf-8') as o:
        o.write('# Planos con sincronía de labios\n\n| Plano | Personaje | Estado | Frase | Duración |\n|---|---|---|---|---|\n')
        for r in filas:
            o.write('| ' + ' | '.join(str(x).replace('|', '/') for x in r) + ' |\n')
    for r in filas:
        print(' · '.join(str(x) for x in r))


if __name__ == '__main__':
    main()
