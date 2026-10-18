#!/usr/bin/env python3
"""Prepara los planos de sincronía de labios: por cada plano de tools/lipsync/planos.json deja en presentacion/lipsync/<id>/
el audio de la frase, la imagen de referencia, la duración, un prompt y una ficha, listos para subir a la herramienta que se use
(Hedra, HeyGen, Sync Labs, LatentSync/Wav2Lip en local…). Después, el vídeo resultante se guarda como lipsync/<id>/plano.mp4.

    python3 presentacion/tools/lipsync_preparar.py                 # prepara los planos

Los planos con «real»: true (cara de persona real) se preparan igual, con un aviso en la ficha y en el índice.
El audio sale de audio/voces (el que genera tools/voces.py). Si aún no existe, el plano queda «pendiente de voz».
"""
import json
import os
import shutil
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(AQUI, 'guion'))
import revision  # noqa: E402
import voces  # noqa: E402


def main():
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
        if real is True:
            estado.append('aviso: cara de persona real (decisión de Diego)')
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
        # Las herramientas de lip-sync (Sync Labs, etc.) piden un vídeo de entrada: la foto, quieta, durante lo que dura la frase
        ref = [x for x in os.listdir(d) if x.startswith('referencia.') and not x.endswith('.mp4')]
        if ref and m:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-i', os.path.join(d, ref[0]), '-t', f"{m['d'] + 0.6:.2f}", '-r', '25',
                            '-vf', 'scale=-2:1024:flags=lanczos', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an',
                            os.path.join(d, 'referencia.mp4')], check=True)
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
