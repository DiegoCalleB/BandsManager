"""Prepara las entrevistas a cámara para sincronizar los labios (Sync Labs, Hedra, etc.).

Cada entrevista de la película (<figure class="ent"> en index.html con su clip de video/actores/) es un plano en el que el
personaje habla a cámara: ahí es donde se nota que la boca no va con la voz. Por cada una deja en presentacion/lipsync/<nombre>/:

  video.mp4   el clip de la entrevista, sin sonido, recortado (o repetido) a lo que dura la frase más medio segundo
  audio.mp3   la frase con su voz de ElevenLabs
  ficha.json  quién habla, qué dice, y dónde va el resultado

y un lipsync/INDICE.md. Se suben video.mp4 + audio.mp3 a la herramienta y el resultado se guarda como lipsync/<nombre>/plano.mp4.

    python3 presentacion/tools/lipsync_entrevistas.py
"""
import html, json, os, re, shutil, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
import voces  # noqa: E402  (mismo hash y reparto que el generador de voces)

# Fuera: Peláez sale a contraluz, sin boca visible; el programador lleva la cara de una persona real (sin permiso por escrito)
FUERA = {'ent-pelaez': 'a contraluz: no se le ve la boca', 'ent-ent-programador-cafe': 'cara de persona real: falta su permiso por escrito'}


def main():
    R = voces.leer_reparto()
    man = json.load(open(os.path.join(DECK, 'audio', 'voces', 'manifest.json'), encoding='utf-8'))
    doc = open(os.path.join(DECK, 'index.html'), encoding='utf-8').read()
    salida = os.path.join(DECK, 'lipsync')
    shutil.rmtree(salida, ignore_errors=True)
    os.makedirs(salida)
    filas = []
    for m in re.finditer(r'<figure class="ent ([^"]*)"([^>]*)>(.*?)</figure>', doc, re.S):
        clase, attrs, cuerpo = m.group(1).split()[0], m.group(2), m.group(3)
        clip = re.search(r'src="(video/actores/[^"]+\.mp4)"', cuerpo)
        if not clip:
            continue  # entrevista con foto, no con vídeo
        who = re.search(r'data-who="([^"]*)"', attrs).group(1)
        say = html.unescape(re.search(r'data-say="([^"]*)"', attrs).group(1))
        texto = voces.sustituir(say, R)
        nombre = clase.replace('ent-ent-', '').replace('ent-', '')
        quien = R.get(who, {}).get('nombre', who)
        frase = re.sub(r'\[[a-z ]+\]\s*', '', texto)
        if clase in FUERA:
            filas.append((nombre, quien, 'fuera: ' + FUERA[clase], frase[:60], ''))
            continue
        v = man.get(voces.fnv1a(who + '|' + texto))
        if not v:
            filas.append((nombre, quien, 'sin voz: ejecuta tools/voces.py', frase[:60], ''))
            continue
        d = os.path.join(salida, nombre)
        os.makedirs(d)
        shutil.copy(os.path.join(DECK, 'audio', 'voces', v['f']), os.path.join(d, 'audio.mp3'))
        dur = v['d'] + 0.5
        # -stream_loop: si el clip es más corto que la frase, se repite; -t lo deja justo a la duración de la frase
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-i', os.path.join(DECK, clip.group(1)), '-t', f'{dur:.2f}',
                        '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', os.path.join(d, 'video.mp4')], check=True)
        json.dump({'entrevista': nombre, 'personaje': quien, 'frase': frase, 'duracion_s': round(dur, 2), 'clip_original': clip.group(1),
                   'subir': ['video.mp4', 'audio.mp3'], 'resultado': f'lipsync/{nombre}/plano.mp4'},
                  open(os.path.join(d, 'ficha.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        filas.append((nombre, quien, 'LISTA para subir', frase[:60], f'{dur:.1f} s'))
    with open(os.path.join(salida, 'INDICE.md'), 'w', encoding='utf-8') as o:
        o.write('# Entrevistas para sincronizar los labios\n\nSube `video.mp4` y `audio.mp3` de cada carpeta; guarda el resultado como `plano.mp4`.\n\n'
                '| Carpeta | Quién | Estado | Frase | Duración |\n|---|---|---|---|---|\n')
        for f in filas:
            o.write('| ' + ' | '.join(f) + ' |\n')
    for f in filas:
        print(' · '.join(x for x in f if x))


if __name__ == '__main__':
    main()
