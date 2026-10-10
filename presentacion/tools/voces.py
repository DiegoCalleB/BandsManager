#!/usr/bin/env python3
"""Genera las voces de la presentación (audio/voces/*.mp3 y audio/voces/manifest.json).

Lee cada frase hablada de index.html (atributos data-who + data-say), la voz de cada personaje de
reparto.js (campo `tts`) y sintetiza con ElevenLabs (motor 'elevenlabs': voces castellanas naturales,
de pago) o con modelos libres que corren en local: Kokoro (multilingüe) y Piper (castellano), vía
sherpa-onnx. Después aplica tono, efecto (teléfono, radio, robot) y normaliza el volumen con ffmpeg.

Solo regenera lo que ha cambiado: si cambias un músico, su voz o una frase, se rehacen esas frases
y se borran los audios que ya no se usan.

Uso:
    pip install sherpa-onnx soundfile numpy      # y ffmpeg con rubberband, más Node para leer reparto.js
    python3 presentacion/tools/voces.py           # genera lo que falta
    python3 presentacion/tools/voces.py --qa      # además transcribe cada audio con Whisper y avisa si no se entiende
    python3 presentacion/tools/voces.py --todo    # lo rehace todo
    python3 presentacion/tools/voces.py --voces   # lista voces de ElevenLabs en castellano para elegir

ElevenLabs lee la clave de $ELEVENLABS_API_KEY, o de un secreto de red del entorno (cabecera xi-api-key hacia api.elevenlabs.io). Solo se
pagan las frases nuevas o cambiadas: el resto se reaprovecha.

Los modelos se descargan solos la primera vez en ~/.cache/bandmanager-voces (o en $VOCES_MODELOS).
"""
import difflib
import hashlib
import html
import json
import os
import re
import subprocess
import sys
import tarfile
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
from html.parser import HTMLParser

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(AQUI)
SALIDA = os.path.join(DECK, 'audio', 'voces')
MODELOS = os.environ.get('VOCES_MODELOS', os.path.expanduser('~/.cache/bandmanager-voces'))
BASE = 'https://github.com/k2-fsa/sherpa-onnx/releases/download'
PAQUETES = {
    'kokoro': ('tts-models', 'kokoro-multi-lang-v1_0'),
    'es_ES-davefx-medium': ('tts-models', 'vits-piper-es_ES-davefx-medium'),
    'es_ES-sharvard-medium': ('tts-models', 'vits-piper-es_ES-sharvard-medium'),
    'whisper': ('asr-models', 'sherpa-onnx-whisper-small'),
}
ELEVEN = 'https://api.elevenlabs.io/v1'
VERSION = 2  # súbela si cambia el procesado de audio: obliga a regenerar todo


def fnv1a(s):
    """Mismo hash que voces.js: así el navegador encuentra el audio de cada frase."""
    h = 0x811C9DC5
    for b in s.encode('utf-8'):
        h ^= b
        h = (h * 16777619) & 0xFFFFFFFF
    return f'{h:08x}'


def modelo(nombre):
    tag, carpeta = PAQUETES[nombre]
    ruta = os.path.join(MODELOS, carpeta)
    if not os.path.isdir(ruta):
        os.makedirs(MODELOS, exist_ok=True)
        print(f'Descargando {carpeta}…', flush=True)
        tmp = os.path.join(MODELOS, carpeta + '.tar.bz2')
        urllib.request.urlretrieve(f'{BASE}/{tag}/{carpeta}.tar.bz2', tmp)
        with tarfile.open(tmp) as t:
            t.extractall(MODELOS)
        os.remove(tmp)
    return ruta


def leer_reparto():
    # reparto.js es un fichero del propio repositorio: se ejecuta en un contexto aislado de Node solo para leer sus datos
    js = ("const s={window:{}};require('vm').runInNewContext(require('fs').readFileSync(process.argv[1],'utf8'),s);"
          "process.stdout.write(JSON.stringify(s.window.REPARTO))")
    return json.loads(subprocess.check_output(['node', '-e', js, os.path.join(DECK, 'reparto.js')]))


def sustituir(texto, R):
    def valor(m):
        k, f = m.group(1), m.group(2)
        p = R.get(k)
        if not p:
            return m.group(0)
        if not f or f == 'nombre':
            return p['nombre']
        if f == 'rol':
            return p['rol']
        if f == 'Rol':
            return p['rol'][:1].upper() + p['rol'][1:]
        if f == 'cargo':
            return p['cargo']
        return m.group(0)
    return re.sub(r'\{(\w+)(?::(\w+))?\}', valor, texto)


class Frases(HTMLParser):
    def __init__(self):
        super().__init__()
        self.frases = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('data-who') and a.get('data-say'):
            self.frases.append((a['data-who'], a['data-say']))


def limpiar(texto):
    # Fuera emojis y símbolos que el sintetizador leería mal
    t = ''.join(c for c in texto if unicodedata.category(c)[0] not in ('S',) or c in '€')
    return re.sub(r'\s+', ' ', t).strip()


class SinCreditos(Exception):
    """ElevenLabs sin créditos: las frases que faltan se quedan con su audio anterior."""


def eleven(ruta, metodo='GET', datos=None, intentos=4):
    # La clave puede venir en $ELEVENLABS_API_KEY o inyectada por el entorno (secreto de red con la cabecera
    # xi-api-key hacia api.elevenlabs.io); en ese caso la petición va sin clave y la añade el proxy.
    cab = {'Content-Type': 'application/json'}
    if os.environ.get('ELEVENLABS_API_KEY'):
        cab['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']
    req = urllib.request.Request(ELEVEN + ruta, method=metodo, data=json.dumps(datos).encode() if datos else None, headers=cab)
    for i in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and i < intentos - 1:
                time.sleep(2 ** (i + 1))
                continue
            cuerpo = e.read().decode(errors="replace")[:300]
            if 'quota' in cuerpo:
                raise SinCreditos(cuerpo)
            sys.exit(f'ElevenLabs {e.code}: {cuerpo}')


def listar_voces():
    """Voces de la biblioteca de ElevenLabs en español, con su acento, para elegir las de reparto.js."""
    for v in json.loads(eleven('/voices'))['voices']:
        print(f"mía      {v['voice_id']}  {v['name']}  {v.get('labels', {})}")
    for pag in range(3):
        r = json.loads(eleven(f'/shared-voices?page_size=100&language=es&page={pag}'))
        for v in r['voices']:
            print(f"pública  {v['voice_id']}  {v['public_owner_id']}  {v.get('accent')}  {v.get('gender')}  {v.get('age')}  "
                  f"{v['name']} · {(v.get('description') or '')[:90]}")
        if not r.get('has_more'):
            break


class Motores:
    def __init__(self):
        self.cache = {}

    def get(self, tts):
        clave = tts['motor'] + ':' + tts.get('modelo', '')
        if clave in self.cache:
            return self.cache[clave]
        import sherpa_onnx as so
        if tts['motor'] == 'kokoro':
            d = modelo('kokoro')
            cfg = so.OfflineTtsConfig(model=so.OfflineTtsModelConfig(kokoro=so.OfflineTtsKokoroModelConfig(
                model=f'{d}/model.onnx', voices=f'{d}/voices.bin', tokens=f'{d}/tokens.txt',
                data_dir=f'{d}/espeak-ng-data', lexicon='', lang='es'), num_threads=4))
        else:
            d = modelo(tts['modelo'])
            onnx = [f for f in os.listdir(d) if f.endswith('.onnx')][0]
            cfg = so.OfflineTtsConfig(model=so.OfflineTtsModelConfig(vits=so.OfflineTtsVitsModelConfig(
                model=f'{d}/{onnx}', tokens=f'{d}/tokens.txt', data_dir=f'{d}/espeak-ng-data'), num_threads=4))
        self.cache[clave] = so.OfflineTts(cfg)
        return self.cache[clave]

    def wav(self, tts, texto, ruta):
        if tts['motor'] == 'elevenlabs':
            # etiqueta: indicación de actuación de eleven_v3, p. ej. «[excited]», que no se escribe en la frase
            texto = (tts.get('etiqueta', '') + ' ' + texto).strip()
            if tts.get('modelo', 'eleven_v3') == 'eleven_v3':
                texto += ' [pause]'  # sin esto, v3 a veces se come la última palabra
            mp3 = eleven(f"/text-to-speech/{tts['voz']}?output_format=mp3_44100_128", 'POST', {
                'text': texto, 'model_id': tts.get('modelo', 'eleven_v3'),
                'voice_settings': {'stability': float(tts.get('estabilidad', 0.5)), 'similarity_boost': 0.75}})
            with open(ruta + '.mp3', 'wb') as f:
                f.write(mp3)
            subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', ruta + '.mp3', ruta])
            return
        import soundfile as sf
        a = self.get(tts).generate(texto, sid=int(tts.get('sid', 0)), speed=float(tts.get('vel', 1.0)))
        sf.write(ruta, a.samples, a.sample_rate)


EFECTOS = {
    'telefono': 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-20dB:ratio=3',
    'radio': 'highpass=f=120,lowpass=f=7500,acompressor=threshold=-22dB:ratio=4:attack=5:release=80,aecho=0.8:0.5:30:0.08',
    'robot': 'flanger=delay=1:depth=2:regen=-20:speed=0.35,aecho=0.8:0.6:14:0.22',
}


def procesar(entradas, tts, salida):
    """Une los trozos (y los pitidos de censura), aplica tono y efecto, normaliza y codifica a MP3."""
    filtros = []
    st = float(tts.get('tono', 0))
    if st:
        filtros.append(f'rubberband=pitch={2 ** (st / 12):.5f}')
    if tts.get('efecto') in EFECTOS:
        filtros.append(EFECTOS[tts['efecto']])
    # sin silencios al principio ni al final: las frases se encadenan sin huecos muertos
    rec = 'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04'
    filtros += [rec, 'areverse', rec, 'areverse']
    filtros.append('loudnorm=I=-16:TP=-1.5:LRA=11')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error']
    for e in entradas:
        cmd += ['-i', e]
    n = len(entradas)
    cadena = ''.join(f'[{i}:a]aresample=24000,aformat=channel_layouts=mono[a{i}];' for i in range(n))
    cadena += ''.join(f'[a{i}]' for i in range(n)) + f'concat=n={n}:v=0:a=1[c];[c]{",".join(filtros)}[o]'
    cmd += ['-filter_complex', cadena, '-map', '[o]', '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '56k', salida]
    subprocess.check_call(cmd)
    igualar(salida)
    recortar_cola(salida)
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', salida]))


def recortar_cola(mp3, umbral=-40, margen=0.15):
    """Fuera el silencio con ruido del final (el [pause] de v3 deja hasta 4 s): si no, la siguiente frase espera."""
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', mp3, '-af', f'silencedetect=n={umbral}dB:d=0.5', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]))
    inicios = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]
    finales = re.findall(r'silence_end: ([\d.]+)', o)
    # solo si el último silencio llega hasta el final del audio
    if not inicios or len(finales) >= len(inicios) and float(finales[-1]) < dur - 0.4:
        return False
    corte = inicios[-1] + margen
    if dur - corte < 0.3:
        return False
    tmp = mp3 + '.tmp.mp3'
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-t', f'{corte:.3f}', '-af', 'afade=t=out:st=%.3f:d=0.1' % (corte - 0.1),
                           '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '56k', tmp])
    os.replace(tmp, mp3)
    return True


def igualar(mp3, objetivo=-16.0):
    """Segunda pasada de volumen: loudnorm falla en frases cortas, así que se mide y se corrige la ganancia."""
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', mp3, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    i = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1])
    if abs(i - objetivo) < 1:
        return
    tmp = mp3 + '.tmp.mp3'
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-af', f'volume={objetivo - i:.2f}dB,alimiter=limit=0.89',
                           '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '56k', tmp])
    os.replace(tmp, mp3)


def pitido(ruta):
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=0.42',
                           '-af', 'volume=0.35,afade=t=in:d=0.02,afade=t=out:st=0.38:d=0.04', '-ar', '24000', ruta])


class Oido:
    """Transcribe con Whisper (local) para comprobar que cada frase se entiende."""
    def __init__(self):
        import sherpa_onnx
        d = modelo('whisper')
        self.r = sherpa_onnx.OfflineRecognizer.from_whisper(
            encoder=f'{d}/small-encoder.int8.onnx', decoder=f'{d}/small-decoder.int8.onnx',
            tokens=f'{d}/small-tokens.txt', language='es', task='transcribe', num_threads=4)

    def oir(self, mp3):
        import numpy as np
        raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
        s = self.r.create_stream()
        s.accept_waveform(16000, np.frombuffer(raw, dtype=np.float32))
        self.r.decode_stream(s)
        return s.result.text.strip()


def envolvente(mp3, fps=25):
    """Volumen de la voz, 25 veces por segundo, como dígitos 0-9: el avatar se mueve al ritmo de lo que dice."""
    import numpy as np
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', '8000', '-'])
    x = np.frombuffer(raw, dtype=np.float32)
    n = 8000 // fps
    x = x[:len(x) // n * n].reshape(-1, n)
    rms = np.sqrt((x ** 2).mean(axis=1))
    techo = np.percentile(rms, 95) or 1
    return ''.join(str(int(v)) for v in np.clip(rms / techo * 9, 0, 9).round())


def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9ñ ]+', ' ', t).split()


def main():
    if '--voces' in sys.argv:
        return listar_voces()
    qa = '--qa' in sys.argv
    todo = '--todo' in sys.argv
    R = leer_reparto()
    p = Frases()
    p.feed(open(os.path.join(DECK, 'index.html'), encoding='utf-8').read())
    os.makedirs(SALIDA, exist_ok=True)
    ruta_man = os.path.join(SALIDA, 'manifest.json')
    viejo = json.load(open(ruta_man, encoding='utf-8')) if os.path.exists(ruta_man) else {}
    nuevo, motores, oido, agotado = {}, None, None, False
    for who, say in p.frases:
        if who not in R or 'tts' not in R[who]:
            print(f'⚠ {who} no tiene voz en reparto.js', file=sys.stderr)
            continue
        texto = sustituir(html.unescape(say), R)
        clave = fnv1a(who + '|' + texto)
        # pron (reparto.js): cómo se pronuncia un nombre; la burbuja y la clave del audio siguen con el nombre escrito
        habla = texto
        for p_ in R.values():
            if p_.get('pron'):
                habla = re.sub(r'\b%s\b' % re.escape(p_['nombre']), p_['pron'], habla)
        firma = hashlib.sha1(json.dumps([VERSION, R[who]['tts'], limpiar(habla)], sort_keys=True).encode()).hexdigest()[:12]
        fichero = f'{clave}.mp3'
        ruta = os.path.join(SALIDA, fichero)
        previo = viejo.get(clave)
        if not todo and previo and previo.get('v') == firma and os.path.exists(ruta):
            nuevo[clave] = previo
            if 'e' not in previo:
                previo['e'] = envolvente(ruta)
            continue
        motores = motores or Motores()
        try:
            if agotado:
                raise SinCreditos()
            with tempfile.TemporaryDirectory() as tmp:
                entradas = []
                for i, trozo in enumerate(limpiar(habla).split('[pi]')):
                    if i:
                        b = os.path.join(tmp, f'pi{i}.wav'); pitido(b); entradas.append(b)
                    if trozo.strip():
                        w = os.path.join(tmp, f'{i}.wav'); motores.wav(R[who]['tts'], trozo.strip(), w); entradas.append(w)
                dur = procesar(entradas, R[who]['tts'], ruta)
        except SinCreditos:
            if not agotado:
                print('⚠ ElevenLabs sin créditos: lo que falta conserva su audio anterior', file=sys.stderr)
            agotado = True
            if previo and os.path.exists(ruta):
                nuevo[clave] = previo
            else:
                print(f'✗ sin audio: {who} · {texto[:70]}', file=sys.stderr)
            continue
        nuevo[clave] = {'f': fichero, 'd': round(dur, 2), 'v': firma, 'who': who, 'say': texto, 'e': envolvente(ruta)}
        print(f'✓ {who:9} {dur:5.1f}s  {texto[:70]}', flush=True)
        if qa:
            oido = oido or Oido()
            oido_txt = oido.oir(ruta)
            ref = norm(re.sub(r'\[[a-z ]+\]', '', texto))  # sin [pi] ni etiquetas de actuación
            nuevo[clave]['qa'] = round(difflib.SequenceMatcher(None, ref, norm(oido_txt)).ratio(), 2)
            nuevo[clave]['oido'] = oido_txt
        json.dump(nuevo, open(ruta_man, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)  # progreso parcial
    # fuera los audios que ya no se usan
    usados = {v['f'] for v in nuevo.values()}
    for f in os.listdir(SALIDA):
        if f.endswith('.mp3') and f not in usados:
            os.remove(os.path.join(SALIDA, f))
    json.dump(nuevo, open(ruta_man, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
    total = sum(v['d'] for v in nuevo.values())
    print(f'{len(nuevo)} frases, {total / 60:.1f} minutos de voz.')
    flojas = sorted((v for v in nuevo.values() if 'qa' in v and v['qa'] < 0.8), key=lambda v: v['qa'])
    for v in flojas:
        print(f"  revisar ({v['qa']}): {v['who']} · «{v['say']}» → se oye «{v['oido']}»")


if __name__ == '__main__':
    main()
