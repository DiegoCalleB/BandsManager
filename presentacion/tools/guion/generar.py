"""Genera presentacion/index.html: las diapositivas contadas con el chat de la banda.

Fuente: base.html (diapositivas originales), guion_hablado.py (lo que dice cada personaje en voz alta, con sus
etiquetas de actuación) y los recursos de esta carpeta. Uso:  python3 presentacion/tools/guion/generar.py
Después, si cambia algo hablado:  python3 presentacion/tools/voces.py --qa
OJO: index.html se reescribe entero. Cualquier cambio a mano en index.html se pierde: hazlo aquí.
"""
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
#!/usr/bin/env python3
# Genera presentacion/index.html: el mazo contado casi solo con el chat de la banda.
import re

SRC = open(os.path.join(AQUI, 'base.html'), encoding='utf-8').read()
QR = open(os.path.join(AQUI, 'qr.svg'), encoding='utf-8').read()

head = SRC[:SRC.index('<main id="stage">') + len('<main id="stage">')]
head = head.replace('family=Onest:wght@400;500;600&display=swap',
                    'family=Onest:wght@400;500;600&family=Anton&family=Caveat:wght@600;700&family=Oswald:wght@600;700&display=swap')
tail = SRC[SRC.index('</main>'):]


def section(title):
    i = SRC.index(f'data-title="{title}"')
    s = SRC.rfind('<section', 0, i)
    e = SRC.index('</section>', i) + len('</section>')
    return SRC[s:e]


trailer = section('Tráiler')
# Rebobinado (Tenet): de la noche del festival, hacia atrás, hasta seis meses antes; 7 fotogramas de 90 ms
REBOBINA = ['concierto-3', 'd-h-finanzas', 'd-h-dossier', 'd-h-calendario', 'd-h-pitch', 'd-h-booking', 'concierto-1']
_rw = '<div class="tr-rewind" aria-hidden="true">' + ''.join(f'<img src="img/{n}.jpg" alt="" style="--k:{k}">' for k, n in enumerate(REBOBINA)) + '</div>'
_i = trailer.index('<div class="tr-beat tr-photo" style="--t:3.6s')
trailer = trailer[:_i] + _rw + '\n  ' + trailer[_i:]
# Cold open: el tráiler se queda en el gancho (festival → rebobinado → «Seis meses antes») y entra directo en el chat del jueves.
# El título (¿Qué había hecho Iago? + logo) va después de la llamada de Peláez, como en las series: gancho, título y reparto.
_c0 = trailer.index('<div class="tr-beat tr-photo" style="--t:7.4s'); _c1 = trailer.index('<div class="tr-beat tr-collage"'); _c2 = trailer.index('<div class="tr-sound-hint">')
titulo = (trailer[:trailer.index('>') + 1].replace('data-title="Tráiler"', 'data-title="Título" data-tr-off="9.6" data-dur="7200"') + '\n  '
          + trailer[_c1:_c2].replace('--t:9.6s', '--t:0s').replace('--t:13.4s', '--t:3.8s').replace('data-delay="12500"', 'data-delay="2900"') + '</section>')
trailer = (trailer[:_c0].replace('data-title="Tráiler"', 'data-title="Tráiler" data-dur="7700"', 1)
           .replace('--t:3.6s;--d:4.0s', '--t:3.6s;--d:4.1s') + trailer[_c2:])
cast = section('Prólogo · La banda')
excel = section('Prólogo · La hoja de cálculo')
room = section('Prólogo · Sábado, 11:00 en el local')
import glob
import sys
def build_graph():
    n = {}; e = set()
    for f in glob.glob(os.path.join(AQUI, '..', '..', '..', 'docs', 'knowledge_graph', '*.md')):
        if f.endswith('index.md'): continue
        t = open(f, encoding='utf-8').read(); i = f.split('/')[-1][:-3]
        n[i] = re.search(r'^layer: (\S+)', t, re.M).group(1)
        sec = t.split('Conexiones Salientes')[1].split('Conexiones Entrantes')[0] if 'Conexiones Salientes' in t else ''
        for mm in re.findall(r'\[\[([^\]|]+)', sec): e.add((i, mm))
    e = {(a, b) for a, b in e if b in n}
    W, H = 760, 800
    cols = [['frontend', 'hook'], ['route'], ['agent', 'service'], ['db', 'schema']]
    xs = [26, 262, 500, 735]
    pos = {}
    for ci, ls in enumerate(cols):
        ids = sorted(i for i in n if n[i] in ls)
        for k, i in enumerate(ids):
            pos[i] = (xs[ci], 120 + (k + .5) * (H - 150) / len(ids))
    sec_ids = sorted(i for i in n if n[i] == 'security')
    for k, i in enumerate(sec_ids): pos[i] = (200 + k * 215, 28)
    col = {'frontend': '#60a5fa', 'hook': '#60a5fa', 'route': '#a6aeb9', 'agent': '#4fc7b8', 'service': '#4fc7b8', 'db': '#e3e7ec', 'schema': '#e3e7ec', 'security': '#ff9e9e'}
    o = [f'<svg viewBox="0 0 {W} {H}" width="100%" style="display:block" role="img" aria-label="Mapa de {len(n)} módulos y {len(e)} dependencias del grafo de conocimiento">']
    for a, b in sorted(e):
        x1, y1 = pos[a]; x2, y2 = pos[b]
        o.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="rgba(255,255,255,.16)" stroke-width="1.6"/>')
    for i, (x, y) in pos.items():
        o.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="{col[n[i]]}"/>')
        dx, anc = (14, 'start')
        if x > 700: dx, anc = (-14, 'end')
        yy = y + 5
        if n[i] == 'security': dx, anc, yy = (0, 'middle', y + 28)
        o.append(f'<text x="{x+dx:.0f}" y="{yy:.0f}" font-size="15" fill="rgba(255,255,255,.82)" text-anchor="{anc}" style="paint-order:stroke;stroke:#05070d;stroke-width:4px">{i}</text>')
    o.append('</svg>')
    return '\n'.join(o), len(n), len(e)
import json
svg = open(os.path.join(AQUI, 'graph2.svg'), encoding='utf-8').read()
_g = json.load(open(os.path.join(AQUI, 'graph2.json')))
N_NODES, N_EDGES = _g['nodes'], f"{_g['edges']:,}".replace(',', '.')

# ───────── Reparto ─────────
P = {
    'iago': ('Iago · bajo', 'img/miembro-iago.jpg', True),
    'brais': ('Brais · batería', 'img/miembro-brais.jpg', False),
    'xandre': ('Xandre · voz', 'img/miembro-xandre.jpg', False),
    'alvaro': ('Álvaro · guitarra', 'img/miembro-alvaro.jpg', False),
    'manager': ('Programador · Sala El Faro', 'img/personaje-manager.jpg', False),
    'mop': ('Master of Prompts · voz', 'img/personaje-cantante.jpg', False),
    'claudio': ('Claudio · Claude Code', None, False),
    'guglio': ('Guglio · Gemini', None, False),
}


ROLE = {'diego': 'diego', 'iago': 'bajo', 'brais': 'bateria', 'xandre': 'voz', 'alvaro': 'guitarra', 'manager': 'manager',
        'mop': 'voz_mop', 'claudio': 'ia_claude', 'guglio': 'ia_gemini', 'sello': 'sello'}


exec(open(os.path.join(AQUI, 'guion_hablado.py'), encoding='utf-8').read())
USADOS = set()


def hablado(text):
    for k, v in SAY:
        if text.startswith(k):
            USADOS.add(k); return v
    raise SystemExit(f'Sin guion hablado: {text}')


def m(who, text, time=None, cls='', say=None):
    t = f' data-t="{time}"' if time else ''
    c = f' class="{cls}"' if cls else ''
    v = (say or hablado(text)).replace('"', '&quot;')
    return f'<li data-who="{ROLE[who]}"{t}{c} data-say="{v}">{text}</li>'


def dlg(*items, cls=''):
    body = '\n      '.join(items)
    return f'<ul class="dlg{" " + cls if cls else ""}">\n      {body}\n    </ul>'


# ───────── Plantillas ─────────
def feat(title, tag, h2, items, shot, grupo='promocion', tr='rise', cls=''):
    return f'''<section class="slide feat dl{" " + cls if cls else ""}" data-grupo="{grupo}" data-title="{title}" data-transition="{tr}">
  <div class="ft-copy"><span class="tag">{tag}</span><h2>{h2}</h2>
    {dlg(*items)}
  </div>
  {shot}
</section>
'''


def scene(title, tag, h2, bg, body, tr='fade', cls='', bgstyle=''):
    return f'''<section class="slide scene{" " + cls if cls else ""}" data-title="{title}" data-transition="{tr}">
  <div class="scene-bg" style="--bg-img:url({bg}){bgstyle}"></div>
  <span class="tag">{tag}</span>
  <h2>{h2}</h2>
  {body}
</section>
'''


def act(title, roman, tag, h2, sub, who, msg, done, bg):
    dots = ''.join('<i class="done"></i>' if i < done else ('<i class="on"></i>' if i == done else '<i class=""></i>') for i in range(6))
    name = '{%s} · {%s:rol}' % (ROLE[who], ROLE[who])
    return f'''<section class="slide act" data-title="{title}" data-transition="fade" style="--bg-img:url({bg})">
  <div class="act-bg"></div>
  <div class="act-num" aria-hidden="true">{roman}</div>
  <span class="tag">{tag}</span>
  <h2>{h2}</h2>
  <div class="act-msg" data-who="{ROLE[who]}" data-say="{[v for k, v in ACT_SAY.items() if msg.startswith(k)][0]}"><b>{name}</b>{msg}</div>
  <div class="act-foot"><div class="act-dots" aria-hidden="true">{dots}</div></div>
  <div class="curtain l" aria-hidden="true"></div><div class="curtain r" aria-hidden="true"></div>
</section>
'''


def plano(title, base, dur):
    """Plano mudo a pantalla completa (respiro entre capítulos, cierre): sin rótulo ni diálogo."""
    return (f'<section class="slide plano" data-title="{title}" data-transition="fade" data-dur="{dur}">'
            f'<video data-ambient data-restart muted loop playsinline preload="auto" poster="{base}.jpg"><source src="{base}.mp4" type="video/mp4"></video></section>\n')


def shot_img(src, pos='50% 0', cls=''):
    return f'<div class="ft-shot{" " + cls if cls else ""}"><img src="{src}" alt="" style="object-position:{pos}"></div>'


def shot_vid(src, poster, cls='', pos='50% 0'):
    return f'<div class="ft-shot{" " + cls if cls else ""}"><video data-ambient muted loop playsinline preload="auto" poster="{poster}" style="object-position:{pos}"><source src="{src}" type="video/mp4"></video></div>'


def shot_vid_sync(src, poster, cls=''):
    """Vídeo que no arranca solo: lo lanza la línea del chat con clase «sync» (ver voces.js)."""
    return f'<div class="ft-shot{" " + cls if cls else ""}"><video data-sync muted playsinline preload="auto" poster="{poster}"><source src="{src}" type="video/mp4"></video></div>'


S = []
add = S.append

# ───────── Tráiler y prólogo ─────────
add(trailer + '\n')

add(scene('Prólogo · Jueves, 23:47', 'Prólogo · Os Herdeiros do Código', 'Un jueves cualquiera, a las 23:47.', 'img/concierto-3.jpg',
          dlg(m('xandre', '¿Alguien ha contestado a la sala del 14?'),
              m('alvaro', 'Llevamos tres ensayos sin saber qué tocamos.', 'cold'),
              m('brais', 'Así no llegamos a ningún lado.', 'cold'),
              m('iago', 'Ya he dejado dos grupos por esto y no quiero que me vuelva a pasar.'),
              m('iago', 'Dadme hasta el sábado.'))))

add(scene('Prólogo · La llamada', 'Prólogo · Jueves · 00:09', 'Y entonces, sonó el teléfono.', 'img/concierto-1.jpg',
          '<div class="callcard"><i class="cc-ico" aria-hidden="true">☎</i><div><small>Llamada entrante · 00:09</small><b>Discos Cuarzo</b><span>Sr. Peláez</span></div></div>' +
          dlg(m('sello', 'Herdeiros, os escribí hace tres meses y nadie contestó. Os ofrezco contrato: os llevo yo los bolos, me quedo el 30 % de cada uno y decido yo qué tocáis.', '00:09',
                say='[calmly] Herdeiros, os escribí hace tres meses, y nadie contestó. Os ofrezco contrato. Yo os llevo los bolos, me quedo el treinta por ciento de cada uno, y el repertorio, naturalmente, lo decido yo.'),
              m('alvaro', 'Es que el correo… se nos pierde.', '00:10', say='[sighs] Es que el correo… se nos pierde, tío.'),
              m('iago', 'No firméis nada. Las canciones son nuestras, y los bolos los podemos llevar nosotros. El sábado os lo demuestro.', '00:12',
                say='[firmly] No firméis nada, chavales. Las canciones son nuestras. Y los bolos, los podemos llevar nosotros. El sábado os lo demuestro.'), cls='tight'), tr='zoom'))

add(titulo + '\n')
add(cast + '\n')

add(f'''<section class="slide scene" data-title="Prólogo · La decisión" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">Ocho meses antes · 00:20</span>
  <h2 style="font-size:78px">Ocho meses antes, Iago abrió el portátil.</h2>
  <div class="enrol slim">
    <div class="en-top"><div class="mono" aria-hidden="true">TBS</div><div><b>Máster de Desarrollo con IA</b><span>The Big School by Brais Moure · Requisito para acabar: un Trabajo Fin de Máster</span></div></div>
  </div>
  {dlg(m('iago', 'Para acabar el máster necesito un proyecto. Y mi banda necesita un milagro.'),
       m('claudio', '¿Y si el proyecto es el milagro?'),
       m('guglio', 'Yo pongo las ideas locas. Claudio las discute.'),
       m('claudio', 'Y tú decides, Iago. Nosotros proponemos y tú revisas cada respuesta.'),
       m('iago', 'Hecho, tronco. Empezamos esta noche.'), cls='tight')}
  <div class="ia-duo">
    <div class="ia-card ia-claude"><img src="img/logo-claude.svg" alt="Claude"><div><b>Claudio</b><span>Claude Code</span><em>el que discute</em><i class="ia-pt" aria-hidden="true"><u></u><u></u><u></u></i></div></div>
    <div class="ia-card ia-gemini"><img src="img/logo-gemini.svg" alt="Gemini"><div><b>Guglio</b><span>Gemini</span><em>el de las ideas locas</em><i class="ia-pt" aria-hidden="true"><u></u><u></u><u></u></i></div></div>
  </div>
  <p class="scene-foot"><b>Y esta parte es cierta:</b> esta presentación es el TFM de ese máster.</p>
</section>
''')

add(scene('Prólogo · Viernes, 22:10', 'Prólogo · Viernes · 22:10', 'Iago tiene algo que enseñar.', 'img/concierto-1.jpg',
          dlg(m('iago', 'Chicos, mañana a las 11 en el local. Tengo que enseñaros algo que ni yo me lo creo. 🤯', '22:10'),
              m('alvaro', 'Y ojo: mañana a las 14:00 cierran el cartel del Resurrection Fest. Si no mandamos nada, no tocamos.', '22:40',
                say='[worried] Y ojo: mañana a las dos cierran el cartel del Resurrection Fest. Si no mandamos nada, no tocamos.'))))

add(room + '\n')

# ───────── Capítulo 1 · Conseguir el bolo ─────────
add(act('Capítulo 1 · Conseguir el bolo', 'I', 'Capítulo 1 de 5 · Conseguir el bolo', 'Primero, las salas.',
        'Buscar, escribir y cerrar fechas sin perseguir a nadie.', 'iago',
        'Empezamos por lo que más nos dolía: las salas.', 1, 'img/concierto-2.jpg'))

TAG1 = 'Sábado · 11:00 · Conseguir el bolo'
add(feat('Todas las salas, en un sitio', TAG1, 'Salas y festivales, en un sitio.',
         [m('xandre', '¡¿Esto lo has hecho tú?!'),
          m('iago', 'Con ayuda. Aquí tengo las salas y los festivales, y cada conversación queda guardada.'),
          m('alvaro', '¡Una base de datos de salas!'),
          m('iago', 'Casi. Y hay un agente, el Scout, que busca salas nuevas por nosotros.'),
          m('iago', 'Y todas, en el mapa de toda España.', cls='sync', say='Y todas, en el mapa de toda España.')],
         shot_vid_sync('video/v-mapa-peninsula.mp4', 'img/d-h-booking.jpg')))

add(feat('La IA escribe, tú apruebas', TAG1, 'La IA escribe. Tú apruebas.',
         [m('alvaro', '¡Ha escrito a tres salas y al Resurrection Fest mientras yo afinaba!'),
          m('iago', 'Cada correo suena a nosotros: la IA lo escribe con el estilo de la banda y lo adapta a cada sala.'),
          m('brais', '¿Y si se le va la mano y escribe una burrada?'),
          m('iago', 'Por eso nada sale sin mi visto bueno. Y cuando la sala contesta, otro agente lee la respuesta y me avisa.'),
          m('alvaro', '¿Y cómo sabemos si lo han leído?', say='[curious] ¿Y cómo sabemos si lo han leído de verdad?'),
          m('iago', 'Porque la app te avisa: cuando abren el correo, el dossier o nuestras redes. Y a la IA la entrenas con estrellas: aprende cómo hablamos.', say='Porque la app te avisa: cuando abren el correo, cuando abren el dossier, y cuando se pasan por nuestras redes. Y a la IA la entrenas con estrellas: aprende cómo hablamos.')],
         shot_img('img/d-h-pitch.jpg')))

MAIL_HTML = """<div class="ms" aria-hidden="true">
  <div class="ms-app">
    <div class="ms-app-top"><span class="ms-dots"><i></i><i></i><i></i></span><b>bandmanager.io</b><em>Pitch · Sala El Faro</em></div>
    <div class="ms-app-body">
      <div class="ms-chips"><span>Gemini 2.5</span><span>Tono de la banda: rock gallego</span><span class="ms-borr">Borrador de la IA</span><span class="ms-apr">✓ Aprobado por Iago</span></div>
      <div class="ms-pitch">
        <p style="--t:0.5s"><strong>Asunto:</strong> Propuesta de concierto · sábado 14 de noviembre</p>
        <p style="--t:1.1s">Hola, equipo de Sala El Faro:</p>
        <p style="--t:1.7s">Somos Os Herdeiros do Código: rock con gaita y mucho ruido bueno. Nos encantaría tocar en vuestra sala el sábado 14 de noviembre.</p>
        <p style="--t:2.5s">En el dossier tenéis fotos, vídeos y el rider técnico. ¿Tenéis hueco esa noche?</p>
        <p style="--t:3.2s">Un abrazo rockero.</p>
      </div>
      <div class="ms-actions"><span>Regenerar</span><span>Editar</span><span>Comparar A/B</span><b class="ms-send">✓ Aprobar y enviar</b></div>
    </div>
    <div class="ms-toast">✓ Enviado a Sala El Faro</div>
  </div>
  <div class="ms-mail">
    <aside class="ms-side"><b class="ms-comp">＋ Redactar</b><span class="on">Recibidos <u>4</u></span><span>Destacados</span><span>Enviados</span><span>Borradores</span><span>Más</span></aside>
    <div class="ms-listwrap">
      <div class="ms-search">🔍 Buscar en el correo</div>
      <div class="ms-row new"><i class="ms-dot"></i><b class="ms-from">Os Herdeiros do Código</b><span class="ms-subj"><b>Propuesta de concierto · sábado 14 de noviembre</b> — Hola, equipo de Sala El Faro: somos Os Herdeiros do Código…</span><em>ahora</em></div>
      <div class="ms-row"><i></i><b class="ms-from">Ticketing Madrid</b><span class="ms-subj"><b>Liquidación de octubre</b> — Adjuntamos el resumen de taquilla del mes…</span><em>09:12</em></div>
      <div class="ms-row"><i></i><b class="ms-from">Proveedor de sonido</b><span class="ms-subj"><b>Presupuesto monitores</b> — Te paso las dos opciones que comentamos…</span><em>08:40</em></div>
      <div class="ms-row"><i></i><b class="ms-from">Banda de Vigo</b><span class="ms-subj"><b>¿Fechas libres en diciembre?</b> — Buenas, ¿tendríais algún sábado…</span><em>ayer</em></div>
      <div class="ms-row"><i></i><b class="ms-from">Ayuntamiento</b><span class="ms-subj"><b>Licencia de actividad</b> — Recordatorio: documentación pendiente…</span><em>ayer</em></div>
    </div>
    <section class="ms-read">
      <div class="ms-rd-in">
        <h4 class="ms-rd-h" style="--t:8.2s">Propuesta de concierto · sábado 14 de noviembre</h4>
        <div class="ms-rd-from" style="--t:8.4s"><img src="img/logo-hdc.png" alt=""><div><b>Os Herdeiros do Código</b> <small>&lt;booking@herdeiros.example&gt;</small><span>para Sala El Faro</span></div><em>ahora</em></div>
        <div class="ms-rd-body">
          <p style="--t:8.9s">Hola, equipo de Sala El Faro:</p>
          <p style="--t:9.5s">Somos Os Herdeiros do Código: rock con gaita y mucho ruido bueno. Nos encantaría tocar en vuestra sala el sábado 14 de noviembre.</p>
          <p style="--t:10.2s">En el dossier tenéis fotos, vídeos y el rider técnico. ¿Tenéis hueco esa noche?</p>
          <p style="--t:10.9s">Un abrazo rockero.</p>
        </div>
        <div class="ms-foot">
          <div class="ms-btn" style="--t:11.6s">📄 Ver Dossier Oficial &amp; Kit de Prensa</div>
          <div class="ms-sig" style="--t:15.9s"><img src="img/logo-hdc.png" alt=""><div><b>Iago</b><span>Booking &amp; Management | Os Herdeiros do Código</span><small>+34 600 12 34 56 &nbsp;•&nbsp; <u>booking@herdeiros.example</u></small></div></div>
          <div class="ms-soc" style="--t:17.2s"><span class="ig">Instagram</span><span class="sp">Spotify</span><span class="yt">YouTube</span></div>
          <p class="ms-pin p1">① Botón al dossier <small>con seguimiento de clics</small></p>
          <p class="ms-pin p2">② Firma con tu logo, tu cargo y tu contacto</p>
          <p class="ms-pin p3">③ Tus redes, en un clic</p>
        </div>
      </div>
    </section>
  </div>
  <i class="ms-cur"></i>
  <div class="ms-notif"><i>🔔</i><div><small>BandManager · ahora</small><b>Sala El Faro ha abierto tu correo</b><span>y ha pulsado el botón del dossier</span></div></div>
  <p class="ms-fin"></p>
</div>"""

_it = [m('iago', 'Lo repasas, lo apruebas y le das a enviar.'),
       m('alvaro', '¿Y cómo le llega a la sala?'),
       m('iago', 'Así: en su bandeja de entrada, con vuestro logo y el botón al dossier.'),
       m('brais', '¡Pero qué bonito! ¡Si parece el correo de una agencia de verdad!'),
       m('iago', 'Con tu firma, tu cargo y tus redes. Y el dossier, a un clic.'),
       m('xandre', '¡Y yo sin saber ni firmar un correo!')]
add(f'''<section class="slide feat dl mailscene" data-grupo="promocion" data-title="El correo llega a la sala" data-transition="rise" data-fin=".ms-fin">
  <div class="ft-copy"><span class="tag">{TAG1}</span><h2>Y así le llega a la sala.</h2>
    {dlg(*_it)}
  </div>
  {MAIL_HTML}
</section>
''')

add(feat('Medios de comunicación', TAG1, 'Que hablen de la banda.',
         [m('brais', '¿Y para que hablen de nosotros? ¿La radio, la tele, las webs?', say='¿Y cómo hacemos para que hablen de nosotros? ¿La radio, la tele, las webs de música?'),
          m('iago', 'Tengo también la base de datos de medios: radios, webs, prensa y podcasts. Con el mismo redactor de la IA y nada sale sin tu visto bueno.', say='Tengo también la base de datos de medios: radios, webs, prensa y pódcasts. Y el mismo redactor de la inteligencia artificial les escribe con el tono de la banda. Nada sale sin tu visto bueno.'),
          m('xandre', '¡Yo ya estoy ensayando la entrevista!', say='[excited] ¡Yo ya estoy ensayando la entrevista, che!')],
         shot_img('img/d-h-medios.jpg')))

add(feat('Afina el correo', TAG1, 'Afínalo con una instrucción.',
         [m('alvaro', '¿Y si el correo me suena demasiado serio?', say='¿Y si el correo me suena demasiado serio, tío?'),
          m('iago', 'Le escribes una instrucción, como «hazlo más directo», y la IA lo reescribe.', say='Le escribes una instrucción sencilla, como: hazlo más directo. Y la inteligencia artificial lo reescribe.'),
          m('xandre', '¿Y se acuerda para la próxima?', say='¿Y se acuerda para la próxima vez, che?'),
          m('iago', 'Sí: lo calificas con estrellas y aprende cómo hablamos.', say='Sí. Lo calificas con estrellas, y aprende cómo hablamos. Cada vez escribe más como vosotros.')],
         shot_img('img/d-h-medio-pitch.jpg')))

add(feat('Date Swap', TAG1, 'Date Swap: cambio de fecha.',
         [m('iago', 'Esto es Date Swap: le propongo a otra banda cambiarnos las fechas. Nosotros tocamos en su ciudad y ellos en la nuestra. La IA redacta la propuesta.'),
          m('mop', 'Os leo. Me encanta: nosotros vamos a Santiago y vosotros venís a Vigo. ¡Cartel doble!'),
          m('brais', '¡Cartel doble con otra banda! ¡Esto no lo tenían ni los Rolling!'),
          m('xandre', '¿Y quién es ese?'),
          m('iago', 'El cantante de Master of Prompts. Guardaos su cara, que va a volver.'),
          m('mop', 'Y oye, Brais: nos falta batería. ¿Te vienes a Master of Prompts?', say='[laughs] Y oye, {bateria}: nos falta batería. ¿Te vienes a Máster of Prompts?'),
          m('brais', '¿Yo? ¡Pero si ya tengo banda! Bueno… los miércoles libro.', say='[gasps] ¿Yo? ¡Pero si ya tengo banda! Bueno… los miércoles libro.'),
          m('xandre', '¡Traidor! ¡Nos deja por unos metaleros!', say='[dramatically] ¡Traidor! ¡Nos deja por unos metaleros, che!')],
         shot_img('img/d-h-swap.jpg')))

add(feat('Cambio de perfil', TAG1, 'Una cuenta, varias bandas.',
         [m('iago', 'Tranquilo, Xandre: Brais puede tocar en las dos bandas sin liarse. Mirad su cuenta.', say='Tranquilo, {voz}: {bateria} puede tocar en las dos bandas, y sin liarse. Mirad su cuenta.'),
          m('brais', 'Un momento… arriba pone Brais Moure. ¿Esa es mi cuenta?', say='[curious] Un momento… ahí arriba pone Brais Moure. ¿Esa es mi cuenta?'),
          m('iago', 'Claro, Brais: tu cuenta de Cabeza de Cartel. Una cuenta, varias bandas.', say='Claro, {bateria}. Es tu cuenta de Cabeza de Cartel: una cuenta, y varias bandas.'),
          m('alvaro', '¿Y cómo cambias de una banda a otra?', say='¿Y cómo cambias de una banda a otra?'),
          m('iago', 'Como los perfiles de una plataforma de cine. ¿Quién toca hoy? Master of Prompts.', cls='sync', say='Como los perfiles de una plataforma de cine. ¿Quién toca hoy? Máster of Prompts.'),
          m('xandre', '¡Cambió todo! ¡El logo, el calendario, hasta las salas!', say='[amazed] ¡Ché, cambió todo! ¡El logo, el calendario, hasta las salas!'),
          m('iago', 'Y lo de una banda no se ve nunca en la otra. Esa es la primera regla de la casa. Solo se juntan en tu calendario.', say='Y lo de una banda no se ve nunca en la otra. Esa es la primera regla de la casa. Solo se juntan en tu calendario personal.')],
         shot_vid_sync('video/v-perfiles.mp4', 'video/v-perfiles.jpg')))

add(feat('Bandas amigas', TAG1, 'Bandas amigas, a la escucha.',
         [m('xandre', '¿Y las otras bandas? Siempre acabamos con los mismos contactos en el móvil.'),
          m('iago', 'Aquí las tengo todas: estilo, ciudad, contacto y el público que suelen llevar.'),
          m('alvaro', '¿Y puedo escucharlas antes de proponerles nada?'),
          m('iago', 'Sí. Nos conectamos a su Spotify y a su YouTube para sacar un preview de sus temas más populares.'),
          m('brais', '¿Y cómo les va? ¿Tienen público de verdad?'),
          m('iago', 'Ves sus métricas del mes: seguidores en Spotify y suscriptores en YouTube.')],
         shot_vid('video/v-spotify.mp4', 'video/v-spotify.jpg')))

add(feat('El acuerdo, firmado desde BandManager', TAG1, 'Un acuerdo firmado, sin sorpresas.',
         [m('brais', '¿Y si la sala nos cambia el caché el mismo día del bolo?'),
          m('iago', 'Por eso el acuerdo se cierra desde la plataforma: fecha, caché, rider y camerino, por escrito.'),
          m('alvaro', '¿Y la sala tiene que instalarse algo?'),
          m('iago', 'Nada: solo abrir un enlace y firmar con el dedo. Y le llega su copia.'),
          m('brais', '¡Se acabaron las sorpresas el día del bolo!')],
         '<div class="ft-shot phone acuerdo"><img src="img/md-h-acuerdo.jpg" alt="Hoja de acuerdo de la sala con la firma"></div>'))

add(scene('La sala contestó', 'Sábado · 11:35 · Conseguir el bolo', 'La sala contestó. Por fin.', 'img/concierto-2.jpg',
          '<figure class="faroapp"><img src="img/d-h-faro.jpg" alt="BandManager: la Sala El Faro, confirmada"></figure>'
          '<div class="reaccion" aria-hidden="true"><video data-ambient data-restart muted loop playsinline preload="auto" poster="video/actores/local.jpg"><source src="video/actores/local.mp4" type="video/mp4"></video></div>' + dlg(m('manager', 'Chicos, soy el programador de la Sala El Faro. Me ha llegado vuestro correo: ¡el 14 de noviembre es vuestro!', say='Chicos, soy el programador de la Sala El Faro. Me ha llegado vuestro correo: ¡el catorce de noviembre es vuestro!'),
            m('xandre', '¡Por fin! ¡Del rojo al verde!'),
            m('manager', 'Y qué gusto: un correo con dossier y rider. Aquí la mayoría ni dice quién es.', say='Y qué gusto, de verdad: un correo con dossier y con rider. Aquí la mayoría ni dice quiénes son. Eso sí: el caché se cobra en croquetas.'), cls='tight')))

# ───────── Capítulo 2 · Antes del concierto ─────────
add(act('Capítulo 2 · Antes del concierto', 'II', 'Capítulo 2 de 5 · Antes del concierto', 'Ahora, la música.',
        'Cada uno con lo suyo, sin repartir hojas ni perder acordes.', 'iago',
        'Ahora lo bueno: lo que os toca a cada uno.', 2, 'img/concierto-1.jpg'))

TAG2 = 'Sábado · 11:40 · Antes del concierto'


def paper(cls, who, rows):
    li = ''
    for r in rows:
        if r[0] == 'blk':
            li += f'<li class="blk">{r[1]}</li>'
            continue
        n, t, tag, note = r
        tg = f'<span class="tag2">{tag}</span>' if tag else ''
        nt = f'<span class="nt">{note}</span>' if note else ''
        li += f'<li><div class="row"><span class="n">{n}.</span><span class="t">{t}</span>{tg}</div>{nt}</li>'
    return f'''<div class="paper {cls}"><div class="wm"></div>
      <div class="ph"><span class="band">Os Herdeiros do Código</span><span class="set">Directo Festivais Galegos 2026 · 45 min</span><span class="who">Copia para músico<b>{who}</b></span></div>
      <ol>{li}</ol>
      <div class="pf"><span>BandManager.io</span><span>Hoja 1 de 4</span></div></div>'''


front = paper('front', 'Brais · Batería', [
    (1, 'Compila ou morre', 'Em · 185 BPM', '↖ Entrada directa de batería sen intro'),
    (2, 'Git push force no prod', '172 BPM', '↖ Empalmar baixo sen tregua'),
    (3, 'O bug da Ribeira', '', 'Xandre pide palmas ao público'),
    ('blk', 'Chapa · Saúdo a Vilaxoán e brinde con licor café'),
    (4, 'Stack overflow na verbena', 'Am', '↖ Pogo xeral na pista'),
    (5, 'Funciona na miña máquina', '', ''),
    (6, 'É un feature, non un bug', 'Dm · 96 BPM', '↖ Só baquetas no estribillo'),
    (7, 'Localhost non é produción', '', ''),
])
back = paper('back', 'Xandre · Voz', [
    (1, 'Compila ou morre', 'Em', 'Arrincar con voz soa'),
    (2, 'Git push force no prod', 'Bm', ''),
    (3, 'O bug da Ribeira', 'F#m', 'Palmas con todos'),
    ('blk', 'Chapa · Saúdo a Vilaxoán e brinde con licor café'),
    (4, 'Stack overflow na verbena', 'Am', ''),
    (5, 'Funciona na miña máquina', 'D', ''),
    (6, 'É un feature, non un bug', 'Dm', 'Sen micro no segundo verso'),
    (7, 'Localhost non é produción', 'Gm', ''),
])

# Fusión de «La curva de energía» y «Una hoja para cada músico»: la app ordena el setlist por energía (pantalla)
# y, al imprimirlo (línea «paso»), entran encima las hojas de cada músico.
add(feat('Una hoja para cada músico', TAG2, 'El setlist, ordenado e impreso.',
         [m('alvaro', 'Vale, ¿y los ensayos? Llevamos tres sin saber qué tocamos.'),
          m('iago', 'Cada tema tiene su energía: la app dibuja la curva del concierto y te propone el setlist perfecto.'),
          m('iago', 'Y al imprimirlo, sale una hoja distinta para cada uno.', cls='paso'),
          m('xandre', 'Y la mía, con el tono de cada tema.')],
         shot_vid('video/v-energia.mp4', 'video/v-energia.jpg') + f'''
  <div class="paperwrap paso2-in" aria-label="Hoja de setlist impresa para el batería y la voz">{back}{front}</div>''', grupo='musica', cls='con-paso'))

add(feat('Los acordes pasan solos', TAG2, 'Los acordes pasan solos.',
         [m('iago', 'Dale al play, Álvaro. Los acordes y la letra van siguiendo la canción solos.'),
          m('alvaro', '¡Pero tío! ¡Te has copiado de Ultimate Guitar! ¡Pellízcame! ¡Esto es mejor que un solo de Slash!'),
          m('brais', '¡Estoy flipando, neno!'),
          m('iago', 'Espera, espera, que esto es solo la intro. ¡Todavía no ha entrado la batería!')],
         shot_vid('video/atril.mp4', 'img/atril-poster.jpg'), grupo='musica'))

add(feat('El profesor de armonía', TAG2, 'El profesor de armonía.',
         [m('alvaro', '¿Y si no sé qué escala tocar encima?', say='[curious] ¿Y si no sé qué escala tocar encima de los acordes?'),
          m('iago', 'Para eso está el profesor de armonía: lee los acordes de la canción y te explica cómo funciona.', say='Para eso está el profesor de armonía. Lee los acordes de la canción, y te explica cómo funciona.'),
          m('iago', 'Le dices tu nivel y tu instrumento, y te sugiere qué escala usar para improvisar y cómo componer encima.', say='Le dices tu nivel y tu instrumento, y te sugiere qué escala usar para improvisar. Y cómo componer encima.'),
          m('alvaro', '¡Pentatónica menor de Mi, y a volar! ¡Me acaba de arreglar el solo!', say='[amazed] ¡Pentatónica menor de Mi, y a volar! ¡Me acaba de arreglar el solo!'),
          m('iago', 'Eso sí: lo marca como idea. Los datos los calcula el código; la IA solo los explica.', say='Eso sí: lo marca como idea. Los datos los calcula el código. La inteligencia artificial solo los explica.')],
         shot_vid('video/v-profesor.mp4', 'video/v-profesor.jpg'), grupo='musica'))

add(feat('Iris separa los instrumentos', TAG2, 'Cada instrumento, por separado.',
         [m('iago', 'Subo una canción y Iris separa la voz, la batería, el bajo y las guitarras.'),
          m('xandre', '¡Mi voz sola! ¡Nunca me había oído así!'),
          m('alvaro', '¡Parece un Cubase! ¡Y cada pista de un color del arcoíris! 🌈', say='[amazed] ¡Pero si parece un Cubase! ¡Y cada pista con un color del arcoíris!'),
          m('alvaro', '¡Espera, espera! ¿Esto no será un Moises?'),
          m('iago', '¡Sí, tío! Un Moises metido en nuestro repertorio. Y encima grabamos nuestras ideas sobre nuestras propias pistas. Me ha costado sangre, sudor y cuerdas rotas. ¡Y por fin se oye el bajo!')],
         shot_vid('video/v-iris.mp4', 'video/v-iris.jpg', cls='alto')
         + '<div class="prisma" aria-hidden="true"><video data-ambient data-restart muted playsinline preload="auto" poster="video/iris-prisma.jpg"><source src="video/iris-prisma.mp4" type="video/mp4"></video></div>', grupo='musica'))

add(feat('Las ideas, en su sitio', TAG2, 'Las ideas, en su sitio.',
         [m('brais', '¿Y el break que grabé en el móvil?', say='[softly] Neno, ¿y el break de batería que grabé el otro día en el móvil?'),
          m('iago', 'Va a su canción y a su sección: intro, verso, estribillo o solo.', say='Va a su canción y a su sección: intro, verso, estribillo o solo. Con tu nombre, tronco.'),
          m('xandre', '¡Y cada uno comenta la idea! 💬', say='[excited] ¡Y encima le podemos dejar comentarios a cada idea! ¡Me encanta, boludo!'),
          m('alvaro', '¡Se acabó el audio perdido en el WhatsApp! 🙌', say='[laughs] ¡Se acabó el audio perdido en el guasap!')],
         shot_vid('video/v-ideas.mp4', 'video/v-ideas.jpg', cls='alto'), grupo='musica'))

add(feat('Calendario de la banda', TAG2, 'Ensayos y bolos, en un calendario.',
         [m('iago', 'Y aquí sí se juntan: el calendario de cada músico muestra los ensayos y los bolos de todas sus bandas. Y se sincroniza con Google Calendar.',
            say='Y aquí sí se juntan: el calendario de cada músico muestra los ensayos y los bolos de todas sus bandas. Y se sincroniza con Gúgel Calendar.'),
          m('brais', '¡Te lo dije! ¡Google Calendar! 🤣', say='[excited] ¡Te lo dije! ¡Gúgel Calendar! ¡Soy un visionario!'),
          m('iago', 'Cada fecha tiene su ficha, con la meteo y el aviso de puente o festivo.', say='Cada fecha tiene su ficha, con la meteo y el aviso de puente o festivo.'),
          m('xandre', '¡Por fin sé cuándo ensayamos y cuándo tocamos!')],
         shot_img('img/d-h-calendario.jpg'), grupo='musica'))

add(feat('La ficha del bolo', TAG2, 'Cada bolo, con su ficha.',
         [m('xandre', '¿Y esto? ¿También sabe qué tiempo hará en el bolo?', say='[amazed] ¿Y esto? ¿También sabe qué tiempo va a hacer en el bolo?'),
          m('iago', 'Cada bolo tiene su ficha: el aviso de puente, el tiempo, la logística, el rider, los contactos, el merchan y cuánto os queda limpio.', cls='sync',
            say='Cada bolo tiene su ficha. El aviso si cae en puente, y la ciudad se vacía. El tiempo que va a hacer. La logística, el rider, los contactos, el merchan… Y cuánto os queda limpio. Todo, en un clic.'),
          m('brais', 'Y yo sin enterarme del puente. 🤦', say='[laughs] Y yo, sin enterarme nunca del puente.')],
         shot_vid_sync('video/v-concierto.mp4', 'img/d-h-evento.jpg'), grupo='musica'))

add(feat('Choques en el calendario', TAG2, 'El calendario avisa de los choques.',
         [m('brais', 'Oye… ¿y si me coinciden dos ensayos a la vez, uno con cada banda?', say='[worried] Oye… ¿y si me coinciden dos ensayos a la vez? Uno con cada banda.'),
          m('iago', 'El calendario te avisa si dos eventos se pisan, si no da tiempo a llegar o si vas justo para montar.', cls='sync', say='El calendario te avisa. Si dos eventos se pisan, si no da tiempo a llegar de un sitio a otro, o si vas justo para montar.'),
          m('brais', '¡Ai, mi madriña! ¡Me ha salvado el miércoles!', say='[amazed] ¡Ai, mi madriña! ¡Me acaba de salvar el miércoles!'),
          m('iago', 'Y solo avisa cuando hay una persona en los dos sitios. Si no, no te molesta.', say='Y solo avisa cuando hay una persona en los dos sitios. Si no, no te molesta.')],
         shot_vid_sync('video/v-choques.mp4', 'img/d-h-calendario.jpg'), grupo='musica'))

# ───────── Capítulo 3 · Que te conozcan ─────────
add(plano('Plano · Furgoneta (tras el ensayo)', 'video/actores/furgoneta', 4500))
add(act('Capítulo 3 · Que te conozcan', 'III', 'Capítulo 3 de 5 · Que te conozcan', 'Que nos conozcan.',
        'Un dossier, un QR y un vídeo para que la gente nos siga.', 'iago',
        '¡Y ahora, que nos conozca más gente! 🌍', 3, 'img/concierto-3.jpg'))

TAG3 = 'Sábado · 12:20 · Que te conozcan'
add(feat('El dossier de la banda', TAG3, 'El dossier de la banda.',
         [m('alvaro', '¿Pero qué co*****? ¿Que ahora tenemos una web? ¡Como los de verdad!'),
          m('brais', '¡Pero si está guapísima! ¡¿Qué me estás contando?!'),
          m('iago', '¡Es una pasada, tronco! Es el dossier de la banda: fotos, formación y contacto para contratarnos. Y se edita en un momento desde la app. ¡Pero esperad, que esto no ha hecho más que empezar!'),
          m('alvaro', 'Yo ya no sé si esto es un local de ensayo o una discográfica.')],
         shot_img('img/d-h-dossier.jpg')))

add(f'''<section class="slide feat dl" data-grupo="promocion" data-title="Un QR y el público se hace fan" data-transition="rise">
  <div class="ft-copy" style="width:720px"><span class="tag">{TAG3}</span><h2>Un QR, y el público se hace fan.</h2>
    {dlg(m('alvaro', '¿Cómo? ¿Que si ponemos este QR en el concierto, la gente lo escanea y nos sigue en redes? ¿Así, sin más?'),
         m('iago', '¡Sí! Y también pueden echarnos una mano con dinero, comprarnos merchan cuando lo tengamos, ver los próximos bolos y entrar en nuestra nueva web.'),
         m('iago', 'Y dejan su correo, con su permiso, y se llevan un regalo nuestro: un descuento o una descarga exclusiva.', say='Y dejan su correo, con su permiso, y se llevan un regalo nuestro: un descuento, o una descarga exclusiva. Y tú te quedas con la lista, para avisarles de los bolos.'),
         m('xandre', '¿Una lista de gente que nos quiere? ¡Dónde firmo, che!', say='[excited] ¿Una lista de gente que nos quiere de verdad? ¡Dónde firmo, che!'))}
  </div>
  <div class="qrcard">{QR}<b>Os Herdeiros do Código</b><span>Escanea y únete a la banda</span></div>
  <div class="ft-shot phone"><img src="img/md-h-fans-full.jpg" alt="Página de fans de la banda en el móvil" style="object-position:50% 0"></div>
</section>
''')

add(feat('Merchan en un minuto', TAG3, 'El merchan, diseñado en un minuto.',
         [m('xandre', '¿Merchan? ¡Si no tenemos!', say='[gasps] ¿Merchan? ¡Pero si no tenemos, boludo!'),
          m('iago', 'Ahora sí: camisetas y pegatinas con nuestro logo y el QR.', say='Ahora sí, chaval: camisetas y pegatinas con nuestro logo y el QR de los fans. Listas para imprimir.'),
          m('brais', '¡Yo quiero la roja! 👕', say='[excited] ¡Ai, mi madriña! ¡Yo quiero la roja!')],
         shot_img('img/d-h-merchan.jpg')))

add(feat('Del directo al reel', TAG3, 'Del directo al reel.',
         [m('xandre', '¿Y esto qué es?'),
          m('iago', 'Se me ocurrió hacer un generador automático de reels para Instagram, TikTok y YouTube. Todo personalizado y generado con IA.'),
          m('brais', '¿O sea, que le subes el vídeo entero del concierto y te saca los trozos más virales para cada red?'),
          m('iago', '¡Eso es! Y te los deja listos, con el formato de cada plataforma.'),
          m('alvaro', '¿Y luego los subimos uno a uno, a mano?', say='¿Y luego los vamos subiendo uno a uno, a mano? ¡Que yo me aburro!'),
          m('iago', 'No: programas cada reel en cada red, con su día y su hora.', say='Qué va. Programas la publicación de cada reel, en cada red, con su día y su hora. Y vosotros, a tocar.')],
         shot_img('img/d-h-reels.jpg')))

add(feat('El seguimiento de las redes', TAG3, 'Cuánto crece la banda, mes a mes.',
         [m('brais', '¿Y cómo sabemos si todo esto funciona?', say='¿Y cómo sabemos si todo esto funciona? ¿Si de verdad nos sigue más gente?'),
          m('iago', 'Con este panel: apuntas los seguidores de cada red cada mes. Mirad cómo se rellena.', say='Con este panel. Apuntas los seguidores de cada red, cada mes. Mirad cómo se rellena la curva.'),
          m('alvaro', '¡Y la curva sube! ¡Instagram, de 1.385 a 4.580!', say='[amazed] ¡Y la curva sube, tío! ¡Instagram, de mil trescientos a más de cuatro mil quinientos!')],
         shot_vid('video/v-metricas.mp4', 'video/v-metricas.jpg'), grupo='promocion'))

add(feat('Del concierto al disco', TAG3, 'Del concierto, al disco.',
         [m('alvaro', '¿Y la grabación entera del bolo de la Ribeira?', say='¿Y la grabación entera del bolo de la Ribeira? ¿Eso no vale para nada?'),
          m('iago', 'La subes y la IA separa las canciones de lo que hablamos con el público.', say='La subes, y la inteligencia artificial separa las canciones de lo que hablamos con el público. Y saca hasta la letra y los acordes.'),
          m('xandre', '¡Un disco en directo sin mis chistes malos! 💿', say='[laughs] ¡Un disco en vivo, sin mis chistes malos! ¡Qué genio!')],
         shot_img('img/d-h-concierto-disco.jpg')))

# ───────── Capítulo 4 · Después del concierto ─────────
add(feat('La discografía, desde Spotify', TAG3, 'Y tu discografía, desde Spotify.',
         [], shot_vid('video/v-discografia.mp4', 'video/v-discografia.jpg'), grupo='musica').replace('<section ', '<section data-dur="15500" ', 1))

add(act('Capítulo 4 · Después del concierto', 'IV', 'Capítulo 4 de 5 · Después del concierto', 'Y al final, las cuentas.',
        'Cuánto entra, cuánto sale y cuánto queda para la banda.', 'iago',
        'Lo último. Y creo que es lo que más os va a sorprender.', 4, 'img/concierto-1.jpg'))

add(feat('Cuánto entra y cuánto queda', 'Sábado · 12:50 · Después del concierto', 'Cuánto entra y cuánto queda.',
         [m('iago', 'Lo que entra por cada bolo, los gastos y lo que le toca a cada uno, en una sola pantalla.'),
          m('alvaro', '¡Las cuentas claras! ¡Me encanta! ¡Y salen números positivos! 💰'),
          m('iago', 'Y para las giras mi idea es meterle algo tipo Tricount o Splitwise, para que Brais no nos haga el lío como siempre. 😄'),
          m('brais', '¡Oye!')],
         shot_img('img/d-h-finanzas.jpg'), grupo='negocio'))

add(feat('La gira, con gasolina y todo', 'Sábado · 12:55 · Después del concierto', 'La gira, con la gasolina calculada.',
         [m('brais', '¿Y la gasolina de la furgo y de mi coche?', say='Home, ¿y la gasolina de la furgo y de mi coche? ¿Quién la paga?'),
          m('iago', 'Metes los coches que van en ruta y calcula el gasto de cada parada.', say='Metes los coches que van en ruta, con su consumo, y te calcula la gasolina de cada parada.'),
          m('iago', 'Y lo que queda limpio de cada bolo.', say='Y te dice lo que queda limpio de cada bolo, después de gasolina, dietas y hotel.'),
          m('alvaro', '¡Ni una discusión más en la gasolinera! ⛽', say='[laughs] ¡Ni una discusión más en la gasolinera!')],
         shot_vid('video/v-giras.mp4', 'video/v-giras.jpg'), grupo='negocio'))

add(scene('Lo han visto todo', 'Sábado · 13:00 · El local de ensayo', 'Lo han visto todo.', 'img/concierto-1.jpg',
          dlg(m('alvaro', '¡¿Pero cuándo has hecho esto?! ¡Si tienes trabajo y dos hijas! 🤯'),
              m('xandre', '¡Sos un genio, Iago! 🙌'),
              m('iago', 'Por las noches, con Claudio y Guglio.'), cls='tight') + '''
  <ul class="fin-crowd">
    <li><img src="img/miembro-brais.jpg" alt="Brais"><span>Brais</span></li>
    <li><img src="img/miembro-xandre.jpg" alt="Xandre"><span>Xandre</span></li>
    <li><img src="img/miembro-alvaro.jpg" alt="Álvaro"><span>Álvaro</span></li>
    <li><img src="img/miembro-iago.jpg" alt="Iago"><span>Iago</span></li>
  </ul>''', tr='zoom'))

add(scene('Las noches', 'Sábado · 13:02 · El local de ensayo', 'Casi siempre, de noche.', 'img/concierto-1.jpg',
          '<div class="noche-reloj" aria-hidden="true"><b>02:47</b><span>la hora a la que Iago seguía programando</span></div>' +
          dlg(m('iago', 'Casi siempre de noche, cuando las niñas ya dormían. Cerraba el portátil, las miraba un momento… y volvía a abrirlo.', '02:47',
                say='[softly] Casi siempre de noche, cuando las niñas ya dormían. Cerraba el portátil, las miraba un momento… y volvía a abrirlo.'),
              m('brais', 'Tío… no teníamos ni idea.', '02:48', say='[softly] Tío… no teníamos ni idea.'),
              m('alvaro', 'Y nosotros, quejándonos de las birras.', '02:48', say='[sighs] Y nosotros, quejándonos de las birras.'),
              m('xandre', 'Gracias, Iago. De verdad.', '02:49', say='[softly] Gracias, {bajo}. De verdad.'), cls='tight'), cls='noches', tr='fade'))

add(feat('Y mucho más', 'Sábado · 13:03 · Y mucho más', 'Y mucho más.',
         [m('iago', 'Y hay más: ensayos, armonías, eventos, reels, dossier…', say='Y esto no acaba aquí, chavales: ensayos, armonías, eventos, reels, el dossier… Todo en la misma app.'),
          m('brais', '¡Pero si no le falta de nada! 🤯', say='[gasps] ¡Ai, mi madriña! ¡Pero si no le falta de nada!')],
         shot_vid('video/v-montaje.mp4', 'video/v-montaje.jpg'), grupo='negocio'))

add(scene('Esto lo necesitan todos', 'Sábado · 13:05 · El local de ensayo', 'Y entonces, alguien lo dijo.', 'img/concierto-3.jpg',
          dlg(m('xandre', 'Iago, esto es una locura. Lo necesitan todos los grupos, todos los mánagers, todas las productoras. ¡Todos!'),
              m('alvaro', '¿Y si lo vendemos? Además de dar conciertos, nos forramos ayudando a los músicos de todo el mundo. 💸'),
              m('iago', '¿En serio? ¿Creéis que esto lo podemos vender?'),
              m('brais', '¡Pero tío, te vas a forrar! Ya te veo en Miami, en descapotable, con traje y gafas de sol.'),
              m('iago', 'Si me hago rico, una buena parte irá para la banda. ¡Os Herdeiros do Código lo va a petar, chavales!'), cls='tight'), tr='zoom'))

# ───────── Capítulo 5 · Cómo lo hacemos ─────────
add(plano('Plano · Furgoneta (hacia el negocio)', 'video/actores/furgoneta', 4000))
add(act('Capítulo 5 · Cómo lo hacemos', 'V', 'Capítulo 5 de 5 · Cómo lo hacemos', '¿Y cómo lo hacemos?',
        'De qué vivimos, y cómo está hecho por dentro.', 'iago',
        'Vamos por partes. Os cuento mi estrategia.', 5, 'img/concierto-1.jpg'))

add(f'''<section class="slide scene" data-title="Para darlo a conocer" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">Sábado · 13:20 · Cómo lo hacemos</span>
  <h2 style="font-size:78px">Y para darlo a conocer, otro máster.</h2>
  <div class="enrol slim">
    <div class="en-top"><div class="mono" aria-hidden="true">MKT</div><div><b>Máster de Marketing Digital con IA</b><span>Para que BandManager llegue a los músicos de todo el mundo</span></div></div>
  </div>
  {dlg(m('brais', 'Pero tío… ¿y tú cómo sabes todo esto?'),
       m('iago', 'Ahh, se me había olvidado deciros que me acabo de apuntar al máster de Marketing Digital de la Big School. Es una pasta que flipas.'),
       m('iago', 'Aunque, con el pedazo de proyecto que ha quedado, igual me dan hasta un premio. No sé… A ver si Paula lo ve y me regala el máster. 🤣', say='[laughs] Aunque, mirad, con el pedazo de proyecto que ha quedado, igual me dan hasta un premio. No sé… A ver si Paula lo ve, y me regala el máster.'),
       m('brais', '¡Tú sueña, tú sueña!', say='[laughs] ¡Sueña, neno, sueña!'),
       m('iago', 'Pero creo que va a merecer la pena. Cuando esté en Miami con mi Lambo, iré gritando: «¡Estos másteres han sido el dinero mejor invertido de mi vida!»'),
       m('brais', '¡Pero tú no paras, Iago!'),
       m('iago', 'Os cuento mi estrategia de negocio y me decís qué os parece, ¿vale?'), cls='tight')}
</section>
''')

add(f'''<section class="slide scene biz" data-title="A quién se lo vendemos" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg)"></div>
  <span class="tag">Cómo lo hacemos · A quién</span>
  <h2>A quién se lo vendemos.</h2>
  <div class="biz-cols">
    <div class="biz-col"><span class="badge">B2C</span><h3>Bandas, músicos, DJs y solistas</h3><p>Una cuota por banda, de 0 a 79 € al mes</p></div>
    <div class="biz-col"><span class="badge b2b">B2B</span><h3>Mánagers, agencias y productoras</h3><p>Una cuenta con varias bandas y planes de empresa, más caros</p></div>
  </div>
  {dlg(m('iago', 'Dos tipos de cliente. B2C: bandas, músicos, DJs y solistas, o sea, nosotros. Pagan una cuota por banda.'),
       m('brais', '¿Y B2B?'),
       m('iago', 'Los que llevan a varias bandas: mánagers, agencias y productoras. Para ellos, una cuenta con todas sus bandas y planes de empresa, más caros.'),
       m('iago', 'Las salas y los festivales no son clientes: son el canal. Si trabajar con nosotros es fácil, contestan antes. Mirad El Faro.'), cls='tight')}
</section>
''')

add(f'''<section class="slide scene biz" data-title="Cómo ganamos dinero" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">Cómo lo hacemos · El dinero</span>
  <h2>Y de qué vivimos.</h2>
  <div class="biz-cols">
    <div class="biz-col"><span class="badge">Construido, desactivado a propósito</span><h3>Suscripción por banda</h3><p>Seis planes, de gratis a 79 € al mes</p></div>
    <div class="biz-col"><span class="badge b2b">Ya habilitado, voluntario</span><h3>Apoyo de los usuarios</h3><p>Para pagar la IA, la base de datos y los servidores</p></div>
  </div>
  {dlg(m('alvaro', '¿Y de qué vivimos, entonces?'),
       m('iago', 'Dos motores. Una suscripción por banda, que ya está construida aunque la tengo desactivada a propósito. Y el apoyo voluntario de quien use la app.'),
       m('brais', '¿Y cuánto es ese apoyo?', say='¿Y cuánto es ese apoyo? ¿Más o menos que Peláez?'),
       m('iago', 'Lo que cada uno quiera. Ya he habilitado que los usuarios apoyen el proyecto, para pagar la IA, la base de datos y los servidores.', say='Muchísimo menos: lo que cada uno quiera. Ya he habilitado que los usuarios apoyen el proyecto, para pagar la inteligencia artificial, la base de datos y los servidores. Si vosotros tocáis y cobráis, nosotros ganamos.'), cls='tight')}
</section>
''')

# Por dentro (antes, el capítulo 6; ahora va dentro del 5)
TAGT = 'Sábado · 13:40 · Por dentro'
add(f'''<section class="slide scene tech" data-title="Arquitectura" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">{TAGT}</span>
  <h2>Un monolito sensato.</h2>
  {dlg(m('brais', 'Vale, pero… ¿y por dentro cómo funciona todo esto?', say='Vale, pero, ¿y por dentro cómo funciona este monstruo?'),
       m('iago', 'Delante, React con Vite. Detrás, Express y TypeScript. Supabase guarda los datos y la IA solo vive en los bordes.'),
       m('brais', 'Pues como si me hablas en chino.'),
       m('alvaro', 'Yo no entiendo nada…'),
       m('iago', 'Yo tampoco tenía ni idea, pero desde que hago el máster de MoureDev lo entiendo casi todo. ¡Una pasada! Aunque, la verdad, casi todo esto lo ha tocado mi colega Claudio.'), cls='tight')}
  <div class="tech-vis">
    <div class="pn"><h3>Frontend</h3><p class="chips2"><span>React 19 + Vite</span><span>Tailwind CSS v4</span><span>Motion</span><span>Tone.js · wavesurfer</span><span>PWA instalable</span></p></div>
    <div class="pn mid"><h3>Backend · Express 4 + TypeScript</h3><p class="chips2"><span>44 ficheros de rutas</span><span>Scout · Enviador · Lector</span><span>Cola y planificador</span><span>Aislamiento por banda</span></p></div>
    <div class="pn"><h3>Servicios</h3><p class="chips2"><span>Supabase</span><span>Gemini</span><span>Gmail OAuth2 · IMAP</span><span>Stripe · Resend</span><span>Railway · Sentry</span></p></div>
  </div>
  <p class="scene-foot">Supabase, única fuente de verdad. Cada integración se desactiva sola si falta su clave.</p>
</section>
''')

add(f'''<section class="slide scene tech" data-title="El mapa que lee la IA" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">{TAGT}</span>
  <h2>Un mapa del código que lee la IA.</h2>
  {dlg(m('alvaro', '¿Y eso qué es? ¿Un plato de espaguetis?'),
       m('iago', f'Es el mapa de nuestro código: {N_NODES} módulos y {N_EDGES} conexiones, sacadas de los imports reales. Claudio y Guglio lo leen antes de tocar nada, para no romper lo que ya funciona.'),
       m('brais', '¡Qué listos!'),
       m('iago', 'Los puntos dorados son las funciones clave, como Booking o Iris: cada una enlaza pantalla, ruta, servicio, tabla y proveedor.'), cls='tight')}
  <div class="tech-vis graphbox">{svg}</div>
  <p class="scene-foot">Azul, interfaz · verde, servicios y agentes · rojo, seguridad · naranja, proveedores. <span class="mono">npm run graph:sync</span></p>
</section>
''')

add(f'''<section class="slide scene tech" data-title="Cómo se construyó con IA" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg)"></div>
  <span class="tag">{TAGT}</span>
  <h2>Construido con IA y gobernado por reglas.</h2>
  {dlg(m('brais', 'Y si Claudio y Guglio programan, ¿quién manda aquí?'),
       m('iago', 'Un fichero: AGENTS.md. Es el contrato que leen antes de tocar nada, y tiene tres reglas que no se negocian.'),
       m('xandre', '¿Y si se las saltan?'),
       m('iago', 'Se rompe el build. Un test lo vigila en cada commit; hay 22 skills y un hook que avisa cuando se toca algo sensible.'), cls='tight')}
  <pre class="code tech-vis"><b>AGENTS.md · no negociable</b>

1. Ningún dato de una banda
   visible para otra.

2. Ningún email automatizado
   sin aprobación humana
   explícita.

3. Cero errores nuevos de
   TypeScript sobre el
   baseline de CI.</pre>
  <p class="scene-foot">Claudio y Guglio, los de la historia, son Claude Code y Gemini.</p>
</section>
''')

add(f'''<section class="slide scene tech" data-title="Seguridad" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">{TAGT}</span>
  <h2>Defensa por capas.</h2>
  {dlg(m('brais', 'Y con esto, ¿ni el mejor hacker del mundo nos va a poder tumbar la aplicación?'),
       m('iago', 'Esa es la idea. Hay varias capas y ninguna es la única barrera: si una falla, queda otra detrás.'),
       m('iago', 'La banda se saca de la sesión en el servidor, nunca de lo que manda el navegador. Y lo que llega de las salas es un dato, no una orden.'),
       m('alvaro', '¿Y eso es lo que hace que no nos hackeen?'),
       m('iago', 'Una parte. Tú toca la guitarra, que de lo demás me encargo yo.'), cls='tight')}
  <div class="tech-vis mini">
    <div class="pn"><h3>Aislamiento por banda</h3><p>Test estático en cada CI</p></div>
    <div class="pn"><h3>Inyección de prompt</h3><p>Texto externo saneado</p></div>
    <div class="pn"><h3>SSRF y abuso</h3><p>IP validada y límites de ritmo, también en el chat de IA</p></div>
    <div class="pn"><h3>Autenticación</h3><p>PBKDF2-SHA512 y sesiones que caducan</p></div>
    <div class="pn"><h3>Obra del músico</h3><p>Una ruta por banda, sin URLs predecibles</p></div>
    <div class="pn"><h3>Errores</h3><p>Panel propio y Sentry. Un lint impide filtrar datos internos</p></div>
  </div>
</section>
''')

add(f'''<section class="slide bigstats dl" data-title="Calidad en cifras">
  <div class="hero-bg"></div>
  <span class="tag">Sábado · 13:40 · Por dentro</span>
  <h2>Un producto con tests de verdad.</h2>
  {dlg(m('alvaro', '¡Madre mía! ¡Esto tiene más pruebas que en la época del Covid!'),
       m('iago', 'Más de dos mil, y se ejecutan solos en cada commit y en cada push. Y en producción, un control de salud y Sentry vigilando los errores.'), cls='tight')}
  <div class="bs-grid">
    <div class="bs"><b class="bs-n" data-count="284" data-suffix="k">284k</b><span>líneas de TypeScript, entre cliente y servidor, sin tests</span></div>
    <div class="bs"><b class="bs-n" data-count="358">358</b><span>rutas HTTP, de las que 307 son handlers propios</span></div>
    <div class="bs"><b class="bs-n" data-count="60">60</b><span>tablas en producción con RLS, y 48 migraciones SQL</span></div>
    <div class="bs"><b class="bs-n" data-count="2820">2820</b><span>tests unitarios declarados, además de 29 pruebas E2E con Playwright</span></div>
  </div>
  <p class="bs-foot"><i>Medido el 14 de octubre de 2026 con <span class="mono">wc -l</span>, <span class="mono">npm run verify:docs</span> y la base de datos de producción.</i></p>
</section>
''')

# Vídeo opcional (solo existe si hay video/demo.mp4)
if os.path.exists(os.path.join(AQUI, '..', '..', 'video', 'demo.mp4')):  # sin el archivo no se pregunta por él (ni da error en consola)
    add(re.search(r'<section class="slide sunk" data-title="Vídeo de demostración".*?</section>', SRC, re.S).group(0) + '\n')

add(f'''<section class="slide scene tech" data-title="Qué viene" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">Sábado · 14:00 · Lo que viene</span>
  <h2>De máster a banda real.</h2>
  {dlg(m('iago', 'Y ahora, lo que viene: probarlo con una banda real. La nuestra.'),
       m('alvaro', '¡Iago! ¡El móvil! ¡El Resurrection Fest acaba de abrir el dossier!', say='[gasps] ¡Iago! ¡El móvil! ¡El Resurrection Fest acaba de abrir el dossier!'),
       m('iago', 'Tres veces en una hora. Están leyendo. Y el cartel cierra… ahora.', say='Tres veces en una hora. Eso es que están leyendo. [softly] Y el cartel cierra… ahora.'), cls='tight')}
  <div class="notif" aria-hidden="true"><i>🔔</i><div><small>BandManager · ahora</small><b>Resurrection Fest ha abierto tu dossier</b><span>3 veces en la última hora</span></div></div>
  <ol class="tech-vis steps">
    <li><b>1</b><div><h3>Probarlo con una banda real</h3><p>Lead, aprobación, borrador en Gmail y respuesta</p></div></li>
    <li><b>2</b><div><h3>Reactivar el cobro</h3><p>Facturación y planes de pago</p></div></li>
    <li><b>3</b><div><h3>Vídeos de fans por QR</h3><p>El público sube su clip del directo</p></div></li>
    <li><b>4</b><div><h3>El Tricount de las giras</h3><p>Cuentas de la gira entre todos</p></div></li>
    <li><b>5</b><div><h3>Darlo a conocer</h3><p>Marketing digital, con IA</p></div></li>
  </ol>
</section>
''')

# «Confirmados»: el Resurrection Fest contesta justo cuando el reloj llega a cero (cierra el gancho de «nadie contestó»)
add(f'''<section class="slide scene tech" data-title="Confirmados" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg)"></div>
  <span class="tag">Sábado · 14:00 · Confirmados</span>
  <h2>Esta vez, contestaron.</h2>
  {dlg(m('alvaro', '¡Iago! ¡Nos han contestado! ¡Estamos dentro!'),
       m('xandre', '¡¿Escenario principal?! ¡Che, escenario principal!'),
       m('brais', 'Vale, pero que haya croquetas en el camerino.'),
       m('iago', 'Esta vez, nos han contestado.'), cls='tight')}
  <div class="notif" aria-hidden="true"><i>🔔</i><div><small>Resurrection Fest · ahora</small><b>Confirmados: escenario principal</b><span>Sábado · 02:14 · Viveiro</span></div></div>
</section>
''')

# ───────── Convergencia: el festival, la radio, el espejo y el giro ─────────
add(f'''<section class="slide scene" data-title="El festival, 02:14" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg)"></div>
  <span class="tag">Seis meses después · Sábado noche · 02:09 · Backstage</span>
  <h2 style="font-size:76px">Cinco minutos para salir.</h2>
  <div class="cartel" style="max-width:980px;padding:26px 40px;margin-top:22px">
    <div class="fest" style="font-size:30px">Resurrection Fest</div>
    <div class="l1" style="font-size:78px">Os Herdeiros do Código</div>
    <div class="l2" style="font-size:36px">Escenario principal · Viveiro</div>
  </div>
  {dlg(m('manager', 'Cinco minutos, chicos. El rider está en el camerino, tal y como firmamos.'),
       m('sello', 'Iago, soy Peláez. Os veo desde la mesa de mezclas. Mi oferta sigue en pie: el 30 %.', say='Iago, soy Peláez. Os estoy viendo desde la mesa de mezclas. Mi oferta sigue en pie: el treinta por ciento.'),
       m('iago', 'Gracias, Peláez. Pero los bolos ya los llevamos nosotros.', say='[softly] Gracias, Peláez. Pero los bolos ya los llevamos nosotros. Y el repertorio, también.'),
       m('manager', 'Que conste, Peláez: los bolos los llevan ellos solitos.', say='Y que conste, Peláez: aquí los bolos los llevan ellos solitos. Yo solo pongo el camerino.'),
       m('xandre', '¿Tengo el tono de la primera?'),
       m('iago', 'Em, en tu hoja, como siempre.'),
       m('iago', 'Escuchad ahí fuera: la app organiza, pero esto lo hacéis vosotros.', say='[softly] Escuchad ahí fuera. La app organiza, chavales. Pero esto lo hacéis vosotros.'),
       m('manager', '¡Y ahora, a tocar!', say='[shouts] ¡Y ahora, a tocar!'),
       m('brais', 'Hace seis meses no sabíamos ni quién contestaba a las salas.'), cls='tight')}
</section>
''')

add(f'''<section class="slide scene" data-title="En la radio" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">Domingo · 09:00 · En antena</span>
  <div class="radio">
    <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div><div class="dial">Radio Riff · en directo</div><div class="head" data-who="locutor" data-say="{EXTRA_SAY['radio']}">La banda que casi se separa por problemas de gestión interna acaba tocando en el Resurrection Fest gracias a su bajista Iago y a bandmanager.io, la increíble app que ha creado y que va a revolucionar la industria musical.</div></div>
  </div>
</section>
''')

add(scene('Otro jueves, 23:47', 'Otro jueves · 23:47', 'El grupo seguía existiendo.', 'img/concierto-2.jpg',
          dlg(m('xandre', '¿Alguien ha contestado a la sala del 14?', say=EXTRA_SAY['otro_jueves']),
              m('iago', 'Cerrao y bien cerrao, chaval. Mirad el calendario. ✅'),
              m('alvaro', 'Y ya tenemos los setlists, cada uno en su hoja.'),
              m('brais', 'Entonces ensayamos el sábado. 🥁', '23:51'))))

# El giro: dos diapositivas, el punto álgido
add('''<section class="slide scene reveal" data-title="El giro: el bajista soy yo" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg);opacity:.5"></div>
  <span class="tag">Fin de la historia · Diego de la Calle</span>
  <figure class="rv-photo"><img src="img/historia/mop-gira.jpg" alt="Diego de la Calle tocando el bajo con Master of Prompts (imagen generada con IA)"><figcaption><b>Diego de la Calle</b><span>El bajista · imagen generada con IA</span></figcaption></figure>
  <h2>El bajista soy yo.<br><span class="acc">Necesito volver a tocar.</span></h2>
  <p class="sub">Toqué en varios grupos. Los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado.</p>
  <p class="sub sub2">Hice BandManager para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.</p>
</section>

<!--MIS-BANDAS-->
<section class="slide scene reveal dream" data-title="Un sueño hecho realidad" data-transition="fade" data-dur="12500">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg);opacity:.5"></div>
  <span class="tag">Fin de la historia · Diego de la Calle</span>
  <figure class="rv-photo"><img src="img/historia/mop-gira.jpg" alt="Diego de la Calle tocando el bajo con Master of Prompts (imagen generada con IA)"><figcaption><b>Diego de la Calle</b><span>El bajista · imagen generada con IA</span></figcaption></figure>
  <h2>Y ya estamos montando un grupo de metal. Nos falta batería…</h2>
  <p class="sub">Con muchísima ilusión, y sabiendo que con BandManager.io toda la gestión va a ir rodada.</p>
  <p class="sub sub2 hijas">Y quién sabe si el día de mañana a mis hijas les da por formar sus grupos… y les ayuda a que los comienzos sean mucho más fáciles.</p>
  <p class="sub sub3 dream-line">Un sueño hecho realidad.</p>
</section>
''')

# Mis bandas (de verdad): fotos reales de Diego en img/historia/, en el orden de img/historia/historia.json
# [{"foto": "big-band-2015.jpg", "texto": "Big Band · 2015", "logro": "Primer concierto"}…]. Sin fotos, la escena no sale.
_hj = os.path.join(AQUI, '..', '..', 'img', 'historia', 'historia.json')
FOTOS = [f for f in (json.load(open(_hj, encoding='utf-8')) if os.path.exists(_hj) else [])
         if f.get('tarjeta') or os.path.exists(os.path.join(AQUI, '..', '..', 'img', 'historia', f['foto']))]
if [f for f in FOTOS if f.get('provisional')]:
    print('OJO: «Mis bandas» tiene fotos sin confirmar (provisional: true en img/historia/historia.json): ' + ', '.join(f['foto'] for f in FOTOS if f.get('provisional')))
if FOTOS:
    # Cronología: cada banda con la edad que tenía Diego (la edad va en grande, y una línea de tiempo abajo se va encendiendo)
    pasos, t = [], 0.4
    for k, f in enumerate(FOTOS):
        d = f.get("dur", 2.2 if f.get("tarjeta") else 2.0)  # la del público (la última), más: «gran» lleva efecto
        pasos.append((t, d, f)); t += d
    # el foco sobre Diego (oscurece un poco al resto) va horneado en img/historia/_foco/
    sys.path.insert(0, os.path.join(AQUI, '..'))
    import historia_foco
    historia_foco.main()
    for f in FOTOS:
        if f.get('foco') and f.get('foto'):
            f['ruta'] = '_foco/' + f['foto']
    from PIL import Image  # las fotos casi cuadradas o verticales se ven enteras sobre su propio fondo desenfocado
    def _vert(f):
        w, h = Image.open(os.path.join(AQUI, '..', '..', 'img', 'historia', f.get('ruta', f['foto']))).size
        return w / h < 1.25
    def _fig(t0, d, f):
        edad = f'<em class="mb-edad"><i>{f["edad"]}</i><u>años</u></em>' if f.get('edad') else ''
        cap = f'<figcaption><b>{f.get("texto", "")}</b>{("<span>" + f["logro"] + "</span>") if f.get("logro") else ""}</figcaption>'
        if f.get('tarjeta'):
            return f'<figure class="mb-foto tarjeta" style="--t:{t0:.2f}s;--d:{d:.2f}s">{edad}{cap}</figure>'
        return (f'<figure class="mb-foto{" vert" if _vert(f) else ""}{" gran" if f.get("gran") else ""}{" izq" if f.get("lado") == "izq" else ""}" style="--t:{t0:.2f}s;--d:{d:.2f}s;--bg:url(img/historia/{f.get("ruta", f["foto"])});--pos:{f.get("pos", "50% 50%")}">'
                f'<img src="img/historia/{f.get("ruta", f["foto"])}" alt="{f.get("texto", "")}">{edad}{cap}</figure>')
    cuerpo = ''.join(_fig(t0, d, f) for t0, d, f in pasos)
    # línea de tiempo: un punto por edad distinta; se enciende cuando llega su primera foto y ya no se apaga
    hitos = []
    for t0, d, f in pasos:
        if f.get('edad') and f['edad'] not in [h[0] for h in hitos]:
            hitos.append((f['edad'], t0, f.get('hito', f.get('texto', ''))))
    linea = ('<div class="mb-linea" aria-hidden="true">' + ''.join(
        f'<span style="--t:{t0:.2f}s"><i></i><b>{e}</b><u>{n}</u></span>' for e, t0, n in hitos) + '</div>')
    S[[i for i, x in enumerate(S) if 'data-title="El giro: el bajista soy yo"' in x][0]] = S[[i for i, x in enumerate(S) if 'data-title="El giro: el bajista soy yo"' in x][0]].replace(
        '<!--MIS-BANDAS-->', f'''<section class="slide mis-bandas" data-title="Mis bandas" data-transition="fade" data-dur="{int((t + 1.8) * 1000)}" data-fin=".mb-fin">
  <span class="tag" style="opacity:0">Fin de la historia · Diego de la Calle</span>
  {cuerpo}
  {linea}
  <p class="mb-fin" style="--t:{t:.2f}s"><small>Hoy, a los 40</small>Y siempre, la música.</p>
</section>''')
else:
    S[:] = [x.replace('<!--MIS-BANDAS-->\n', '') for x in S]

# El giro final (Nolan): el reloj de toda la película no contaba para el festival
add('''<section class="slide giro-reloj" data-title="El reloj" data-transition="fade" data-dur="22000" data-fin=".gr-ask">
  <span class="tag" style="opacity:0">Fin de la historia · El reloj</span>
  <div class="gr-reloj" aria-hidden="true"><small><i class="gr-l1">CIERRE DEL CARTEL · RESURRECTION FEST</i><i class="gr-l2">ENTREGA DEL TFM · THE BIG SCHOOL</i></small>
    <span class="gr-t"><i>-00:00:03</i><i>-00:00:02</i><i>-00:00:01</i><i>00:00:00</i></span></div>
  <p class="gr-c" style="--t:3.8s;--d:2.8s">¿Os habéis fijado en el reloj?</p>
  <p class="gr-c" style="--t:6.6s;--d:2.7s">No solo contaba para el cierre del cartel del Resu.</p>
  <p class="gr-c" style="--t:9.3s;--d:2.7s">También contaba para esto.</p>
  <div class="notif" aria-hidden="true"><i>🔔</i><div><small>BandManager · ahora</small><b>Alguien está viendo tu TFM</b><span>Ahora mismo. Desde el principio.</span></div></div>
  <p class="gr-c" style="--t:12.3s;--d:3s">Brais: en esta historia eras el batería.</p>
  <p class="gr-c" style="--t:15.2s;--d:3s">Pero en la de verdad, el festival sois vosotros.</p>
  <p class="gr-c gr-ask" style="--t:18.4s">Y ahora… un reto.</p>
</section>
''')

# El reto: para Brais Moure de verdad (no el batería de la historia). Toca muy bien en casa; le falta el escenario. La pantalla la dirige direccion.py
add(f'''<section class="slide feat dl reto" data-grupo="promocion" data-title="El reto" data-vent-vivo="En directo · el portátil de Diego de la Calle, el bajista de verdad" data-transition="zoom">
  <div class="ft-copy"><span class="tag">Fin de la historia · El reto</span><h2>Brais, un reto.</h2>
    {dlg(m('diego', 'Y ahora, Brais, un reto. No para el Brais de esta historia: para ti, el de verdad. En casa le das caña a la batería.',
           say='Y ahora, {bateria}, un reto. No para el {bateria} de esta historia: para ti. El de verdad. En casa le das caña a la batería.'),
         m('diego', 'Te he preparado el setlist del primer ensayo de Master of Prompts: metal, con letras de coña sobre programar.',
           say='Te he preparado el sétlist del primer ensayo de Máster of Prompts. Metal, con letras de coña sobre programar.'),
         m('diego', 'Y te lo mando como lo mandamos todo: la IA lo redacta, yo lo repaso y… enviado.',
           say='Y te lo mando como lo mandamos todo: la IA lo redacta, yo lo repaso, y… enviado.'))}
  </div>
  <div class="ft-shot"><img src="img/miembro-brais.jpg" alt="El setlist del primer ensayo de la banda de Diego, con la hoja de batería para Brais Moure"></div>
  <aside class="ficha" aria-hidden="true"><i>🥁</i><b>El reto</b><p>Para Brais Moure, el de verdad: el setlist del primer ensayo.</p><span>Metallica</span><span>AC/DC</span><span>Iron Maiden</span><span>Slipknot</span><span>Korn</span></aside>
</section>
''')

# La invitación: el correo llega a la bandeja de Brais. La voz de Diego, sin bromas. El cursor se queda sobre «Aceptar»: la decisión es suya
add(f'''<section class="slide feat dl reto invitacion" data-grupo="promocion" data-title="La invitación" data-vent-tab="Recibidos · Brais Moure" data-vent-url="correo" data-vent-vivo="Mientras tanto, en el portátil de Brais…" data-transition="fade">
  <div class="ft-copy"><span class="tag">Fin de la historia · La invitación</span><h2>Te guardamos el sitio.</h2>
    {dlg(m('diego', 'Brais… yo había dejado de tocar. Este máster me devolvió las ganas.', say='[softly] {bateria}… yo había dejado de tocar. Este máster me devolvió las ganas.'),
         m('diego', 'Nos falta batería, Brais. Y es tuya: solo tienes que decir que sí.', say='[softly] Nos falta batería, {bateria}. Y es tuya: solo tienes que decir que sí.'))}
  </div>
  <div class="ft-shot"><img src="img/miembro-brais.jpg" alt="El correo de Diego en la bandeja de Brais, con el botón para aceptar la invitación"></div>
</section>
''')

# Gracias
add(re.search(r'<section class="slide cover" data-title="Gracias".*?</section>', SRC, re.S).group(0) + '\n')

# Títulos de crédito: suben solos, como al final de una película (en modo película duran lo que tarda el rollo)
add(plano('Plano · El local, vacío', 'video/actores/local-vacio', 7500).replace('</section>',
    '<p class="lema" aria-hidden="true">Los bolos, los llevas tú.<small>bandmanager.io · Pruébala con tu banda</small></p></section>'))
add('''<section class="slide creditos" data-title="Créditos" data-transition="fade" data-dur="150000">
  <div class="rollo">
    <p class="cr-pre">Os Herdeiros do Código en</p>
    <h2 class="cr-titulo">BandManager.io</h2>
    <p class="cr-sub">Una película de rock, código y café</p>
    <h3>Reparto</h3>
    <dl>
      <dt>{bajo}</dt><dd>{bajo:cargo} · el que nadie oye</dd>
      <dt>{bateria}</dt><dd>{bateria:cargo} · y las birras. En dos bandas, desde que lo ficharon</dd>
      <dt>{voz}</dt><dd>{voz:cargo} · la cara bonita</dd>
      <dt>{guitarra}</dt><dd>{guitarra:cargo} · los solos y los riffs</dd>
      <dt>{manager}</dt><dd>Siempre al teléfono</dd>
      <dt>{voz_mop}</dt><dd>El rival. Y luego, el amigo</dd>
      <dt>{sello}</dt><dd>Discos Cuarzo · quería el 30 % y el repertorio</dd>
      <dt>{ia_claude}</dt><dd>Claude Code · el que discute</dd>
      <dt>{ia_gemini}</dt><dd>Gemini · el de las ideas locas</dd>
      <dt>{locutor}</dt><dd>En directo</dd>
    </dl>
    <h3>Escrita, programada y dirigida por</h3>
    <p class="cr-nombre">Diego de la Calle</p>
    <div class="cr-extra">
    <h2 class="cr-seccion">Las bandas de Diego</h2>
    <p class="cr-nota" style="margin-top:6px">Antes de BandManager, ya había música</p>
    <dl class="cr-dl">
      <dt>THC</dt><dd>A los 15 años · con su hermano Fer al fondo</dd>
      <dt>Arritmia</dt><dd>A los 17 · al teclado · su primera maqueta</dd>
      <dt>Limando</dt><dd>A los 20 · Pradoluengo, Burgos</dd>
      <dt>Walter Sax Big Band</dt><dd>A los 25 · hasta el Santiago Bernabéu</dd>
      <dt>Repercusión</dt><dd>De los 30 a los 33 · fiestas del PCE (2015), compartiendo cartel con Siniestro Total, y Batalla Naval de Vallekas (2018)</dd>
      <dt>Master of Prompts</dt><dd>A los 40 · la primera gira · foto generada con IA</dd>
      <dt>Fer</dt><dd>Su hermano, al fondo de la foto de THC</dd>
    </dl>
    </div>
    <div class="solo-largo">
    <div class="cr-extra">
    <h2 class="cr-seccion">Los que aparecen en BandManager.io</h2>
    <h3>Los que tocan</h3>
    <dl class="cr-dl">
      <dt>Bandas y músicos</dt><dd>Booking, repertorio, ensayos, finanzas y giras</dd>
      <dt>Líderes y miembros</dt><dd>El líder manda; los miembros ven y colaboran</dd>
      <dt>Cabeza de Cartel</dt><dd>Mánagers con hasta cinco bandas a la vez</dd>
    </dl>
    <h3>Los que programan</h3>
    <dl class="cr-dl">
      <dt>Salas y clubs</dt><dd>Reciben el pitch y firman el acuerdo con un enlace</dd>
      <dt>Festivales</dt><dd>Cada uno con su ficha, su mapa y su historial</dd>
      <dt>Medios</dt><dd>Prensa, radio y podcast</dd>
      <dt>Representantes y sellos</dt><dd>Los que llevan varias bandas</dd>
      <dt>Ayuntamientos</dt><dd>Fiestas patronales y programación municipal</dd>
      <dt>Grupos amigos</dt><dd>Cartel doble con Date Swap</dd>
    </dl>
    <h3>Los que escuchan</h3>
    <dl class="cr-dl">
      <dt>Fans</dt><dd>Entran por QR y dejan su correo, con su consentimiento</dd>
      <dt>Donantes</dt><dd>Apoyan a la banda con Stripe</dd>
      <dt>Músicos en lista de espera</dt><dd>Los próximos Herdeiros</dd>
    </dl>
    </div>
    <div class="cr-extra">
    <h2 class="cr-seccion">Marketing digital</h2>
    <p class="cr-nota" style="margin-top:6px">Máster de Marketing Digital con IA · The Big School</p>
    <h3>Buyer persona de la película · Netflix</h3>
    <p class="cr-nota" style="margin-top:4px">A quién va dirigida esta película, con su humor</p>
    <dl class="cr-dl">
      <dt>Principal</dt><dd>Brais Moure</dd>
      <dt>Secundario</dt><dd>Profesorado del Máster de Desarrollo con IA de The Big School</dd>
      <dt>Secundario</dt><dd>Paula González · Directora del Máster de Marketing Digital con IA</dd>
      <dt>Secundario</dt><dd>Romuald Fons · Fundador y presidente de The Big School y cantante de Master of Prompts</dd>
      <dt>Negativo, el real</dt><dd>Quien busca una demo técnica seca, sin historia ni música</dd>
      <dt>Negativo, el real</dt><dd>Quien no soporta el rock: aquí los chistes llevan guitarra</dd>
      <dt>Negativo, de coña</dt><dd>Peláez: quiere el 30 % y que no se note</dd>
      <dt>Negativo, de coña</dt><dd>Quien salta los créditos y se pierde la escena final</dd>
    </dl>
    <h3>Buyer persona principal de BandManager.io</h3>
    <p class="cr-nota" style="margin-top:4px">El organizador de la banda. Es el perfil de Diego en sus seis grupos</p>
    <dl class="cr-dl">
      <dt>Quién es</dt><dd>De 30 a 45 años. Toca en uno o dos grupos de directo, tiene otro trabajo y, a menudo, familia. En cada banda hay uno así: el que acaba organizándolo todo</dd>
      <dt>Qué hace hoy</dt><dd>Escribe a las salas, cuadra fechas, reparte setlists y lleva las cuentas con WhatsApp, hojas de cálculo y memoria</dd>
      <dt>Qué le duele</dt><dd>Correos sin respuesta, fechas que chocan, un setlist distinto para cada uno y cuentas poco claras después del bolo</dd>
      <dt>Qué quiere</dt><dd>Pasar menos tiempo organizando y más tiempo tocando</dd>
      <dt>Cómo decide</dt><dd>Decide él por toda la banda. Empieza en un plan gratuito y, si le compensa, paga una cuota por banda</dd>
      <dt>Dónde está</dt><dd>Grupos de WhatsApp, Instagram, salas, festivales y otras bandas</dd>
    </dl>
    <h3>Otros buyer persona de BandManager.io</h3>
    <dl class="cr-dl">
      <dt>Secundario · B2C</dt><dd>DJs, solistas y cantautores: tocan solos, pero sufren los mismos correos, fechas, contratos y cuentas</dd>
      <dt>Secundario · B2C</dt><dd>Orquestas y grupos de fiestas: muchas fechas, muchas rutas y muchas cuentas por gestionar</dd>
      <dt>Secundario · B2B</dt><dd>Mánagers y bookers pequeños que llevan varias bandas a la vez (plan Cabeza de Cartel, hasta cinco)</dd>
      <dt>Secundario · B2B</dt><dd>Salas, festivales y productoras: reciben propuestas ordenadas y confirman el bolo por escrito</dd>
      <dt>Canal</dt><dd>Radios y medios musicales: reciben el dossier y el material de prensa de cada banda ya preparados</dd>
      <dt>Negativo</dt><dd>Artistas que no tocan en directo: no tienen conciertos que gestionar</dd>
      <dt>Negativo</dt><dd>Grandes estructuras con su propio sistema de booking y contratación: no necesitan sustituirlo</dd>
    </dl>
    <h3>Modelos de negocio de BandManager.io</h3>
    <dl class="cr-dl">
      <dt>B2C</dt><dd>Músicos, DJs, solistas y orquestas con su suscripción, de 0 a 79 € al mes. Construida y desactivada a propósito</dd>
      <dt>B2B</dt><dd>Mánagers, agencias, salas, festivales y productoras, con planes para varias bandas</dd>
      <dt>B2B2C</dt><dd>La plataforma sirve a la banda y esta llega a su público: QR de fans, apoyo y entradas</dd>
      <dt>C2C</dt><dd>Entre bandas: Date Swap y bandas amigas, con intercambio de fechas</dd>
      <dt>C2B</dt><dd>La banda se ofrece a salas, festivales, radios y medios con su dossier, su rider y su acuerdo firmado</dd>
      <dt>B2G</dt><dd>Ayuntamientos que contratan bandas para fiestas. Hipótesis, aún sin construir</dd>
      <dt>Hoy</dt><dd>Apoyo voluntario de los usuarios para pagar IA, base de datos y servidores</dd>
    </dl>
    </div>
    <h2 class="cr-seccion">Departamentos técnicos</h2>
    <h3>Los agentes</h3>
    <dl class="cr-dl">
      <dt>Scout</dt><dd>Busca salas nuevas y las enriquece</dd>
      <dt>Redactor</dt><dd>Escribe el correo con el tono de la banda</dd>
      <dt>Enviador</dt><dd>Solo envía lo que tú apruebas</dd>
      <dt>Lector</dt><dd>Lee las respuestas y propone la réplica</dd>
      <dt>Agente Mánager</dt><dd>Chat con catorce herramientas, todas con tu visto bueno</dd>
      <dt>Iris</dt><dd>Separa las pistas de cada canción</dd>
      <dt>Profesor de armonía</dt><dd>Explica los acordes</dd>
    </dl>
    <h3>Inteligencia artificial</h3>
    <dl class="cr-dl">
      <dt>Gemini 2.5 Flash</dt><dd>Pitches, chat y análisis</dd>
      <dt>DeepSeek V3</dt><dd>El segundo redactor, a elegir</dd>
      <dt>Gemini con Google Search</dt><dd>Encuentra salas y sus correos</dd>
      <dt>Embeddings text-embedding-004</dt><dd>Memoria de los pitches que funcionaron</dd>
      <dt>Lyria 3</dt><dd>Música y jingles</dd>
      <dt>Imagen 3</dt><dd>El logo de la banda</dd>
      <dt>Whisper</dt><dd>Transcribe las letras, con sus tiempos</dd>
      <dt>Demucs, en Fal.ai</dt><dd>Iris: las pistas separadas</dd>
    </dl>
    <h3>Datos, música y calle</h3>
    <dl class="cr-dl">
      <dt>Spotify · YouTube · Meta</dt><dd>Métricas de cada banda</dd>
      <dt>Deezer · iTunes</dt><dd>Avances para escuchar a las bandas amigas</dd>
      <dt>Setlist.fm · MusicBrainz · Bandsintown</dt><dd>Qué toca cada sala</dd>
      <dt>Ticketmaster · Google Places</dt><dd>Salas y eventos</dd>
      <dt>Jina Reader · Serper · Apify</dt><dd>Leer webs y redes de las salas</dd>
      <dt>OpenStreetMap · ArcGIS · Leaflet</dt><dd>El mapa de salas</dd>
      <dt>Open-Meteo</dt><dd>El tiempo de cada bolo</dd>
    </dl>
    <div class="cr-extra">
    <h3>Comunicaciones</h3>
    <dl class="cr-dl">
      <dt>Gmail API</dt><dd>Borradores y bandeja de entrada</dd>
      <dt>SMTP e IMAP</dt><dd>Para los que no usan Gmail</dd>
      <dt>Resend</dt><dd>Correos de la plataforma</dd>
      <dt>Web Push</dt><dd>Avisos en el móvil</dd>
    </dl>
    </div>
    <h3>Dinero, datos y nube</h3>
    <dl class="cr-dl">
      <dt>Stripe</dt><dd>Planes y donaciones</dd>
      <dt>Supabase</dt><dd>Base de datos, archivos y seguridad por banda</dd>
      <dt>Firebase</dt><dd>Entrar con Google</dd>
      <dt>Railway</dt><dd>Donde vive la aplicación</dd>
      <dt>Sentry</dt><dd>Vigila los errores</dd>
    </dl>
    <div class="cr-extra">
    <h3>Rodada en</h3>
    <dl class="cr-dl">
      <dt>React 19 · Vite · Tailwind</dt><dd>Lo que ves</dd>
      <dt>Express · TypeScript</dt><dd>Lo que no ves</dd>
      <dt>Tone.js · wavesurfer</dt><dd>El sonido</dd>
    </dl>
    <h3>Control de calidad</h3>
    <dl class="cr-dl">
      <dt>Vitest · Playwright</dt><dd>Más de dos mil pruebas</dd>
      <dt>ESLint · Husky · GitHub Actions</dt><dd>Nadie sube nada roto</dd>
    </dl>
    </div>
    </div>
    <div class="cr-extra">
    <h2 class="cr-seccion">La parte técnica</h2>
    <p class="cr-nota" style="margin-top:6px">Para los profesores: cómo está hecho por dentro. Para defenderlo en vivo, pulsa D</p>
    <!--TECNICA-->
    </div>
    <div class="cr-extra">
    <h2 class="cr-seccion">Todo lo que usamos</h2>
    <h3>Lo que ves</h3>
    <dl class="cr-dl">
      <dt>Motion</dt><dd>Las animaciones</dd>
      <dt>Lucide</dt><dd>Los iconos</dd>
      <dt>class-variance-authority · clsx · tailwind-merge</dt><dd>Los estilos, sin líos</dd>
      <dt>Onest</dt><dd>La letra de la aplicación</dd>
      <dt>html2canvas</dt><dd>Capturas de pantalla desde la propia app</dd>
      <dt>Leaflet y marker-cluster</dt><dd>El mapa de salas, con sus chinchetas</dd>
      <dt>react-qr-code · qrcode</dt><dd>Los QR de los conciertos</dd>
    </dl>
    <h3>Lo que no ves</h3>
    <dl class="cr-dl">
      <dt>Node.js · Express</dt><dd>El servidor</dd>
      <dt>TypeScript</dt><dd>Que el código sepa lo que hace</dd>
      <dt>Helmet</dt><dd>Cabeceras de seguridad</dd>
      <dt>compression</dt><dd>Respuestas más ligeras</dd>
      <dt>Multer</dt><dd>La subida de ficheros</dd>
      <dt>pg</dt><dd>Hablar con Postgres</dd>
      <dt>dotenv</dt><dd>Los secretos, fuera del código</dd>
      <dt>tsx · esbuild</dt><dd>Arrancar y empaquetar el servidor</dd>
    </dl>
    <h3>Correo y ficheros</h3>
    <dl class="cr-dl">
      <dt>Nodemailer · imapflow · mailparser</dt><dd>Enviar, leer y entender el correo</dd>
      <dt>xlsx</dt><dd>El Excel de toda la vida, ahora con importación y exportación</dd>
      <dt>JSZip</dt><dd>Paquetes de ficheros comprimidos</dd>
    </dl>
    <h3>Sonido y vídeo</h3>
    <dl class="cr-dl">
      <dt>Tone.js</dt><dd>Sintetizar y hacer sonar</dd>
      <dt>wavesurfer.js</dt><dd>Las ondas de cada canción</dd>
      <dt>soundtouchjs</dt><dd>Cambiar el tono y la velocidad</dd>
      <dt>ffmpeg · fluent-ffmpeg</dt><dd>Procesar audio y vídeo</dd>
      <dt>youtube-transcript · ytdl-core</dt><dd>Entender los vídeos de YouTube</dd>
    </dl>
    <h3>Datos, nube y despliegue</h3>
    <dl class="cr-dl">
      <dt>PGlite</dt><dd>Una base de datos en memoria para las pruebas</dd>
      <dt>Supabase</dt><dd>Postgres, archivos y seguridad por banda</dd>
      <dt>Firebase</dt><dd>Entrar con Google</dd>
      <dt>Railway · Nixpacks · Railpack</dt><dd>Construir y desplegar</dd>
      <dt>Sentry</dt><dd>Los errores, a la vista</dd>
    </dl>
    <h3>Calidad y orden</h3>
    <dl class="cr-dl">
      <dt>Vitest</dt><dd>Las pruebas unitarias y su cobertura</dd>
      <dt>Playwright</dt><dd>Pruebas de extremo a extremo y capturas de regresión visual</dd>
      <dt>ESLint · react-hooks · typescript-eslint</dt><dd>Que el código se porte bien</dd>
      <dt>Husky · lint-staged · commitlint</dt><dd>Nadie sube nada roto ni mal escrito</dd>
      <dt>Conventional Commits · release-please</dt><dd>Versiones y changelog sin esfuerzo</dd>
      <dt>GitHub · GitHub Actions</dt><dd>El repositorio y la integración continua</dd>
    </dl>
    <h3>Cómo se gobierna</h3>
    <dl class="cr-dl">
      <dt>AGENTS.md</dt><dd>El contrato que leen las IAs antes de tocar nada</dd>
      <dt>Veintidós skills</dt><dd>Reglas para cada tipo de trabajo</dd>
      <dt>Hooks</dt><dd>Avisan cuando se toca algo sensible</dd>
      <dt>Graphify</dt><dd>El mapa del código que lee la IA</dd>
    </dl>
    </div>
    <h2 class="cr-seccion">Cómo se hizo esta película</h2>
    <dl class="cr-dl">
      <dt>Claude Code</dt><dd>Escribió casi todo el código y la historia</dd>
      <dt>Gemini y AI Studio</dt><dd>El otro cerebro</dd>
      <dt>ElevenLabs</dt><dd>Las voces, con acento de aquí</dd>
      <dt>Playwright</dt><dd>Los vídeos de la app, con su cursor</dd>
      <dt>ffmpeg</dt><dd>El montaje y el sonido</dd>
      <dt>Whisper</dt><dd>Escuchó cada frase para comprobarla</dd>
      <dt>Python y numpy</dt><dd>La banda sonora: «Compila ou Morre», «Cabalga o Lóstrego», «As noites» y «Cuenta atrás»</dd>
    </dl>
    <div class="cr-extra">
    <dl class="cr-dl">
      <dt>Remotion</dt><dd>El MP4, fotograma a fotograma, con imagen y sonido en el mismo reloj</dd>
      <dt>Chromium sin cabeza</dt><dd>El navegador que no se ve y graba la película</dd>
      <dt>sherpa-onnx</dt><dd>Hace correr a Whisper en local para escuchar cada voz</dd>
      <dt>Web Audio API</dt><dd>Efectos de sonido sintetizados: graves y ninguna campanita</dd>
      <dt>Pillow</dt><dd>Recortes, focos de luz y fotogramas</dd>
      <dt>CSS puro</dt><dd>El cursor, el scroll y el tecleo de las pantallas en directo</dd>
      <dt>Google Fonts</dt><dd>Onest, Anton, Oswald y Caveat; la «I» de Iago es de IBM Plex Sans</dd>
      <dt>Archivo de Diego de la Calle</dt><dd>Las fotos de «Mis bandas»</dd>
    </dl>
    </div>
    <h3>Con el apoyo de</h3>
    <p>Brais Moure y The Big School · Máster de Desarrollo con IA</p>
    <p class="cr-nota">Ningún bajista fue ignorado durante el rodaje. Bueno, casi.</p>
    <p class="cr-nota">Todas las salas de esta historia acabaron contestando.</p>
    <p class="cr-fin">Os Herdeiros do Código volverán.</p>
  </div>
</section>

<section class="slide scene creditos-post" data-title="Escena post-créditos" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg);opacity:.35"></div>
  <span class="tag">Escena post-créditos · Domingo, 03:12</span>
  ''' + dlg(m('brais', '¿Ya se ha acabado la peli? 🍿', '03:12', say='[laughs] ¿Ya se ha acabado la peli? ¿Y quién paga las birras de la fiesta?'),
            m('iago', 'Dividir gastos está en mi lista de pendientes.', '03:12', say='[sighs] Lo de dividir gastos está en mi lista de pendientes, Brais. Justo debajo de cobrarte las birras.'),
            m('alvaro', '¡Pues que las pague la IA! 🤘', '03:13', say='[shouts] ¡Pues que las pague la inteligencia artificial! ¡Rocanrol!'),
            m('brais', 'Por cierto, mañana ensayo con Master of Prompts. ¿A qué hora era?', '03:14', say='[sighs] Por cierto, mañana ensayo con Máster of Prompts. ¿A qué hora era?'),
            m('iago', 'Mira el calendario, Brais.', '03:14', say='Mira el calendario, {bateria}. Mira el calendario.')) + '''
</section>
''')

# «Y mucho más»: las funciones del anexo vuelven en ráfaga (modo película), una cada 4 pulsos de «Compila ou Morre» (1,3 s)
RAFAGA = [('Medios', 'Radios, webs, prensa y podcasts', 'img/d-h-medios.jpg'), ('Afina el correo', 'Una instrucción y estrellas: la IA aprende', 'img/d-h-medio-pitch.jpg'),
          ('Redes', 'Cuánto crece la banda, mes a mes', 'video/v-metricas.mp4'), ('Discografía', 'Tus discos, desde Spotify', 'video/v-discografia.mp4'),
          ('Ideas', 'Cada idea, en su canción', 'video/v-ideas.mp4'), ('Ficha del bolo', 'Tiempo, rider y logística', 'img/d-h-evento.jpg')]
def _rf_medio(src):  # los .mp4 se ven en movimiento (data-ambient: deck.js los arranca y los pausa al salir)
    if src.endswith('.mp4'):
        return f'<video data-ambient data-restart muted loop playsinline preload="auto" poster="{src[:-4]}.jpg"><source src="{src}" type="video/mp4"></video>'
    return f'<img src="{src}" alt="">'
_k = [i for i, x in enumerate(S) if 'data-title="Y mucho más"' in x]
assert len(_k) == 1
_r = ('<div class="rafaga" aria-hidden="true" style="--n:' + str(len(RAFAGA)) + '">' + ''.join(
    f'<figure class="rf" style="--k:{k}">{_rf_medio(src)}<figcaption><b>{t}</b><span>{s}</span></figcaption></figure>' for k, (t, s, src) in enumerate(RAFAGA))
    + f'<p class="rf rf-fin" style="--k:{len(RAFAGA)}">Y todo, en la misma app.</p></div>\n')
_x = S[_k[0]]; S[_k[0]] = _x[:_x.rindex('</section>')] + '  ' + _r + _x[_x.rindex('</section>'):]

# Orden del capítulo 1: salas → la IA escribe → afina el correo → llega a la sala → medios → bandas amigas (Spotify) → Date Swap → cambio de perfil → acuerdo → respuesta
def _mover(titulo, tras):
    i = [k for k, x in enumerate(S) if f'data-title="{titulo}"' in x]
    j = [k for k, x in enumerate(S) if f'data-title="{tras}"' in x]
    assert len(i) == 1 and len(j) == 1, ('reorden', titulo, tras)
    x = S.pop(i[0]); j = [k for k, y in enumerate(S) if f'data-title="{tras}"' in y][0]; S.insert(j + 1, x)
_mover('Afina el correo', 'La IA escribe, tú apruebas')
_mover('Medios de comunicación', 'El correo llega a la sala')
_mover('Bandas amigas', 'Medios de comunicación')

# Orden de la recta final del capítulo 4: la ráfaga de funciones va antes del momento íntimo (así «Las noches» no se pisa)
_ym = [i for i, x in enumerate(S) if 'data-title="Y mucho más"' in x]
_lh = [i for i, x in enumerate(S) if 'data-title="Lo han visto todo"' in x]
if _ym and _lh and _ym[0] > _lh[0]:
    _x = S.pop(_ym[0]); S.insert(_lh[0], _x)

# Entrevistas a cámara (hilo documental): grabadas «seis meses después», van entre escenas. Salen de guion_final.json
# (las escenas con «entrevista»). Cada frase es un plano: su clip (video/actores/<clip>.mp4, o el de reserva si aún no existe),
# el rótulo con nombre y cargo la primera vez que sale cada persona, y la frase (en la película la dicen los subtítulos).
_ACTD = os.path.join(AQUI, '..', '..', 'video', 'actores')
_ROT = {'bateria': ('Brais', 'Batería'), 'voz': ('Alan', 'Voz y guitarra'), 'guitarra': ('Álvaro', 'Guitarra solista'), 'bajo': ('Iago', 'Bajo'),
        'manager': ('Programador', 'Sala El Faro'), 'sello': ('Sr. Peláez', 'Discos Cuarzo'), 'diego': ('Diego de la Calle', 'El bajista')}
_vistos = set()


def _inserto(l):
    """Inserto de la app mientras habla (recurso de documental): la frase empieza en su cara, a mitad corta a la pantalla
    de BandManager de la que habla y, si queda remate, vuelve a la cara. desde/hasta son trozos de la frase; su posición
    en el texto da el momento (fracción de la duración de la voz: cine.js lo cuadra con el audio real)."""
    i = l.get('inserto')
    if not i:
        return ''
    t = l['txt']; a = t.index(i['desde']) / len(t); b = (t.index(i['hasta']) + len(i['hasta'])) / len(t) if i.get('hasta') else 1
    from PIL import Image
    iw, ih = Image.open(os.path.join(AQUI, '..', '..', i['img'])).size
    cx, cy, z = i['foco']; w = 1920 * z; h = w * ih / iw
    x = min(0, max(1920 - w, 960 - cx * w)); y = min(0, max(1080 - h, 540 - cy * h))
    return (f'<div class="ent-ins" data-a="{a:.3f}" data-b="{b:.3f}"><img src="{i["img"]}" alt="" style="width:{w:.0f}px;left:{x:.0f}px;top:{y:.0f}px">'
            f'<span class="ent-ins-rot"><b>BandManager.io</b>{i["rot"]}</span></div>')


for _e in [e for e in json.load(open(os.path.join(AQUI, 'guion_final.json'), encoding='utf-8')) if e.get('entrevista')]:
    _pl = []
    for _l in _e['lines']:
        _c = _l['clip'] if os.path.exists(os.path.join(_ACTD, _l['clip'] + '.mp4')) else _l['reserva']
        _pl_c = _c or _l['clip']
        _n, _r = _ROT[_l['who']]
        _rot = '' if _l['who'] in _vistos else f'<figcaption class="ent-rot"><b>{_n}</b><span>{_r}</span></figcaption>'
        _vistos.add(_l['who'])
        _media = (f'<video data-ambient data-restart muted loop playsinline preload="auto" poster="video/actores/{_c}.jpg"><source src="video/actores/{_c}.mp4" type="video/mp4"></video>'
                  if _c else f'<img src="{_l["foto"]}" alt="">')  # sin clip rodado aún: su foto real, entera sobre su propio fondo desenfocado, con el mismo rótulo
        _fa = '' if _c else f' ent-foto" style="--bg:url({_l["foto"]})'
        _pl.append(f'<figure class="ent ent-{_pl_c}{_fa}" data-who="{_l["who"]}" data-efecto="ninguno" data-say="{_l["voz"].replace(chr(34), "&quot;")}">'
                   f'{_media}{_rot}{_inserto(_l)}<p class="ent-txt">{_l["txt"]}</p></figure>')
    _sec = (f'<section class="slide entrevista" data-title="{_e["title"]}" data-transition="fade">\n  ' + '\n  '.join(_pl) + '\n</section>\n')
    _tras = _e['entrevista']['tras']
    if _tras.startswith('REEMPLAZA:'):
        _tt = _tras[10:]; _j = [k for k, x in enumerate(S) if f'data-title="{_tt}"' in x]; assert len(_j) == 1, _tras
        _n = len(re.findall(r'<section\b[^>]*data-title="' + re.escape(_tt) + '"', S[_j[0]])); assert _n == 1, (_tt, _n)
        S[_j[0]] = re.sub(r'<section\b[^>]*data-title="' + re.escape(_tt) + r'".*?</section>', lambda _m: _sec.rstrip('\n'), S[_j[0]], count=1, flags=re.S)
    elif _tras.startswith('ANTES:'):
        _j = [k for k, x in enumerate(S) if f'data-title="{_tras[6:]}"' in x]; assert len(_j) == 1, _tras; S.insert(_j[0], _sec)
    else:
        _j = [k for k, x in enumerate(S) if f'data-title="{_tras}"' in x]; assert len(_j) == 1, _tras; S.insert(_j[0] + 1, _sec)

# Anexo: escenas que no entran en la película (para que dure lo que dice el cartel) pero siguen en la presentación,
# al final, para el turno de preguntas. En modo película se saltan (data-anexo, ver deck.js).
ANEXO = ['Medios de comunicación', 'Afina el correo', 'Bandas amigas', 'El seguimiento de las redes', 'La discografía, desde Spotify',
         'El profesor de armonía', 'Choques en el calendario', 'Merchan en un minuto', 'La gira, con gasolina y todo',
         'Las ideas, en su sitio', 'La ficha del bolo',
         'El mapa que lee la IA', 'Arquitectura', 'Cómo se construyó con IA', 'Seguridad', 'Calidad en cifras']
fuera = []
for t in ANEXO:
    k = [i for i, x in enumerate(S) if x.lstrip().startswith('<section') and f'data-title="{t}"' in x]
    assert len(k) == 1, ('anexo', t, k)
    fuera.append(S[k[0]].replace(f'data-title="{t}"', f'data-title="{t}" data-anexo', 1))
    S[k[0]] = ''
S[:] = [x for x in S if x] + [scene('Anexo', 'Anexo · Para las preguntas', 'Lo que no cupo en la película.', 'img/concierto-2.jpg',
                                     '<p class="scene-foot">Más funciones de BandManager, por si el tribunal quiere verlas.</p>').replace(
                                         'data-title="Anexo"', 'data-title="Anexo" data-anexo', 1)] + fuera
# Dolores de la banda, contados mientras Iago enseña la app: una etiqueta «antes → ahora» que entra al segundo y medio y se va sola (solo modo película)
DOLOR = {
    'Todas las salas, en un sitio': ('Salas y festivales, apuntados en un Excel', 'Todos en un sitio, con su historial'),
    'La IA escribe, tú apruebas': ('Horas escribiendo el mismo correo', 'La IA lo escribe; tú solo apruebas'),
    'El correo llega a la sala': ('Correos que se pierden sin respuesta', 'Sabes cuándo abren tu correo y tu dossier'),
    'Date Swap': ('Tocar siempre en tu ciudad', 'Cambias fecha con otra banda amiga'),
    'Cambio de perfil': ('Una cuenta distinta por cada banda', 'Una cuenta, varias bandas'),
    'Bandas amigas': ('Siempre los mismos contactos', 'Escuchas a otras bandas y ves sus números'),
    'El acuerdo, firmado desde BandManager': ('El caché cambia el día del bolo', 'Fecha, caché y rider, por escrito'),
    'Una hoja para cada músico': ('El mismo setlist para todos', 'Una hoja para cada músico, con sus notas'),
    'Los acordes pasan solos': ('Buscar los acordes en otra web', 'Acordes y letra siguen la canción'),
    'El profesor de armonía': ('Sin saber qué escala tocar', 'El profesor te sugiere la escala'),
    'Iris separa los instrumentos': ('Sin pistas separadas, no se oye el bajo', 'Iris separa cada instrumento'),
    'Calendario de la banda': ('Ensayos y bolos, en sitios distintos', 'Todos tus eventos, en un calendario'),
    'Choques en el calendario': ('Dos ensayos a la vez, sin enterarte', 'El calendario avisa de los choques'),
    'El dossier de la banda': ('Sin web para que te contraten', 'Un dossier que se edita en un momento'),
    'Un QR y el público se hace fan': ('El público se va sin dejar rastro', 'Un QR para que te sigan'),
    'Merchan en un minuto': ('Merchan sin diseño ni tiempo', 'Camisetas con vuestro QR en un minuto'),
    'Del directo al reel': ('Horas editando vídeos', 'Reels listos para cada red'),
    'La discografía, desde Spotify': ('Subir cada disco a mano', 'Álbumes, portadas y temas importados de Spotify'),
    'Medios de comunicación': ('Pedir una entrevista a cada medio', 'Radios, webs y prensa, con su contacto'),
    'Afina el correo': ('Reescribir el correo una y otra vez', 'Una instrucción y la IA lo reescribe'),
    'El seguimiento de las redes': ('Apuntar los seguidores a mano', 'Una curva que sube mes a mes'),
    'Del concierto al disco': ('El directo, sin aprovechar', 'Del concierto sacas las canciones'),
    'Cuánto entra y cuánto queda': ('Cuentas en el aire tras cada bolo', 'Lo que entra y lo que queda, claro'),
    'La gira, con gasolina y todo': ('Las cuentas de la gira, a ojo', 'La gasolina de la ruta, calculada'),
}
for _i, _x in enumerate(S):
    _t = re.search(r'data-title="([^"]+)"', _x) if _x.lstrip().startswith('<section') else None
    if _t and _t.group(1) in DOLOR:
        _a, _b = DOLOR[_t.group(1)]
        S[_i] = _x[:_x.rindex('</section>')] + f'  <div class="dolor" aria-hidden="true"><p class="dl-a"><i>Antes</i>{_a}</p><p class="dl-b"><i>Ahora</i>{_b}</p></div>\n' + _x[_x.rindex('</section>'):]
# Fichas de cada función (solo en modo película): el titular dice qué es; la ficha, qué hace. Como el rótulo de una keynote:
# entra cuando la cámara sube hacia la pantalla y luego se queda pequeña, con su número. Todo lo que dicen existe en la app.
FICHAS = {
    'Todas las salas, en un sitio': ('Booking', 'Todas las salas y festivales, en el mapa y con cada conversación guardada.', ['Agente Scout: busca salas y festivales nuevos', 'Mapa de toda España', 'Historial de cada contacto']),
    'La IA escribe, tú apruebas': ('Pitch con IA', 'Escribe a cada sala con el tono de la banda. Nada sale sin tu visto bueno.', ['Gemini o DeepSeek', 'Aprobación humana', 'Avisa cuando lo abren']),
    'Date Swap': ('Date Swap', 'Cambia fechas con otra banda: tú tocas en su ciudad y ella en la tuya.', ['Propuesta redactada por IA', 'Cartel doble']),
    'Cambio de perfil': ('Varias bandas, una cuenta', 'Cambias de banda como de perfil. Lo de una banda nunca se ve en otra.', ['Hasta cinco bandas', 'Aislamiento por banda']),
    'El acuerdo, firmado desde BandManager': ('Acuerdo firmado', 'Fecha, caché, rider y camerino, por escrito. La sala firma desde un enlace.', ['Sin instalar nada', 'Copia para la sala']),
    'Una hoja para cada músico': ('Setlist', 'Una hoja impresa distinta para cada músico, con sus notas, tonos y BPM.', ['Cada uno elige qué ve', 'Con el logo de la banda']),
    'Los acordes pasan solos': ('Atril', 'La letra y los acordes avanzan solos mientras suena la canción.', ['Sincronizado con el audio', 'Para cada tema del repertorio']),
    'Iris separa los instrumentos': ('Iris', 'Separa la voz, la batería, el bajo y las guitarras de cualquier canción.', ['Pistas separadas con IA', 'Ideas sobre vuestras pistas']),
    'Calendario de la banda': ('Calendario', 'Ensayos y bolos en un calendario, cada fecha con su ficha.', ['El tiempo de cada bolo', 'Aviso de puentes y festivos']),
    'El dossier de la banda': ('Dossier web', 'La web de la banda, con fotos, formación y contacto de booking.', ['Se edita desde la app', 'La IA sabe cuándo lo abren']),
    'Un QR y el público se hace fan': ('QR de fans', 'El público escanea y os sigue, ve los bolos, apoya a la banda y deja su correo.', ['Con su consentimiento', 'Regalo a cambio del correo']),
    'Del directo al reel': ('Reels con IA', 'Del vídeo del concierto saca los mejores trozos, listos para cada red.', ['Instagram, TikTok y YouTube', 'Formato de cada plataforma']),
    'Cuánto entra y cuánto queda': ('Finanzas', 'Lo que entra por cada bolo, los gastos y lo que le toca a cada músico.', ['En una sola pantalla', 'Cuentas claras']),
}
_nf = 0
for i, x in enumerate(S):
    t = re.search(r'data-title="([^"]+)"', x)
    if not t or t.group(1) not in FICHAS or t.group(1) in ANEXO:
        continue
    _nf += 1
    nombre, frase, chips = FICHAS[t.group(1)]
    ficha = (f'<aside class="ficha" aria-hidden="true"><i>{_nf:02d}<small>/{len(FICHAS):02d}</small></i><b>{nombre}</b><p>{frase}</p>'
             + ''.join(f'<span>{c}</span>' for c in chips) + '</aside>\n')
    k = x.rindex('</section>')
    S[i] = x[:k] + '  ' + ficha + x[k:]
assert _nf == len(FICHAS), _nf

# Destello anamórfico (una veta horizontal de luz azul que cruza el plano al entrar) en las escenas de la historia
import re as _re
for _i, _x in enumerate(S):
    if _re.match(r'\s*<section class="slide scene(?![^"]*\b(?:tech|biz|creditos-post|reveal|dream)\b)', _x) and '<div class="scene-bg"' in _x and 'class="flare"' not in _x:
        S[_i] = _re.sub(r'(<div class="scene-bg"[^>]*></div>)', r'\1<i class="flare" aria-hidden="true"></i>', _x, count=1)
# Dirección de pantalla (tools/guion/direccion.py): cámara, resaltes, rótulos y cursor en las capturas fijas
sys.path.insert(0, AQUI)
import direccion
direccion.aplicar(S)
# Actores en movimiento (presentacion/ACTORES.md): si existe video/actores/<clave>.mp4, sustituye al fondo fijo de la escena
# (o a la foto del miembro en el reparto). Sin el vídeo, la escena queda como estaba.
PLANOS = {'Prólogo · Jueves, 23:47': 'jueves', 'Prólogo · Viernes, 22:10': 'viernes', 'Prólogo · La llamada': 'pelaez', 'Prólogo · La decisión': 'decision',
          'Lo han visto todo': 'local', 'Las noches': 'noches', 'El festival, 02:14': 'festival',
          'Otro jueves, 23:47': 'otro-jueves', 'En la radio': 'concierto', 'La sala contestó': 'manager',
          # el capítulo 5 ya no es fondo de foto con tarjetas: pasa sobre planos en movimiento
          'Para darlo a conocer': 'local', 'A quién se lo vendemos': 'concierto', 'Cómo ganamos dinero': 'espaldas-a', 'Qué viene': 'hombro-iago', 'Confirmados': 'otro-jueves'}
_ACT = os.path.join(AQUI, '..', '..', 'video', 'actores')
def _vid(k, extra=''):
    return (f'<video class="actor-vid"{extra} data-ambient data-restart muted loop playsinline preload="auto"'
            + (f' poster="video/actores/{k}.jpg"' if os.path.exists(os.path.join(_ACT, k + '.jpg')) else '')
            + '>' + (f'<source src="video/actores/{k}.webm" type="video/webm">' if os.path.exists(os.path.join(_ACT, k + '.webm')) else '')
            + f'<source src="video/actores/{k}.mp4" type="video/mp4"></video>')
for _i, _x in enumerate(S):
    _t = re.search(r'data-title="([^"]+)"', _x)
    _k = _t and PLANOS.get(_t.group(1))
    if _k and os.path.exists(os.path.join(_ACT, _k + '.mp4')):
        S[_i] = re.sub(r'(<div class="scene-bg"[^>]*>)', lambda mm: mm.group(1) + _vid(_k) + '<i class="actor-velo"></i>', _x, count=1)
        if _k == 'manager': S[_i] = re.sub(r'(<section [^>]*)>', r'\1 data-sin-plato>', S[_i], count=1)  # el vídeo ya es el mánager: sin su retrato encima
    for _m in ('brais', 'xandre', 'alvaro', 'iago'):
        if 'data-title="Prólogo · La banda"' in S[_i] and os.path.exists(os.path.join(_ACT, f'miembro-{_m}.mp4')):
            S[_i] = re.sub(rf'<img[^>]*src="img/miembro-{_m}.jpg"[^>]*>', lambda mm: mm.group(0) + _vid(f'miembro-{_m}'), S[_i], count=1)
import json as _json
_json.dump(direccion.MOVS, open(os.path.join(AQUI, '..', '..', 'remotion', 'public', 'direccion.json'), 'w'))
html = head + '\n\n' + '\n'.join(S) + '\n' + tail
# Defensa técnica: el panel (tecla D) y presentacion/DEFENSA.md salen del mismo contenido (defensa.py)
import defensa as _df, re as _re
def _md(t): return _re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
_tabs = ''.join(f'<button type="button" data-df="{i}">{t}</button>' for i, t, _ in _df.SECCIONES) + '<button type="button" data-df="preg">Preguntas del tribunal</button>'
_secs = ''.join(f'<section data-df="{i}" hidden>' + ''.join(f'<article><h3>{a}</h3><p>{_md(b)}</p></article>' for a, b in cs) + '</section>' for i, t, cs in _df.SECCIONES)
_secs += '<section data-df="preg" hidden>' + ''.join(f'<details><summary>{q}</summary><p>{_md(a)}</p></details>' for q, a in _df.PREGUNTAS) + '</section>'
_panel = f'<div id="defensa" role="dialog" aria-label="Defensa técnica" hidden><div class="df-cab"><b>Defensa técnica</b><nav class="df-tabs">{_tabs}</nav><button type="button" class="df-x">Cerrar · Esc</button></div><div class="df-cuerpo">{_secs}</div></div>'
_md_doc = ['# Defensa técnica · guion de 5 minutos', '', 'Para después de la película. Pulsa **D** en la presentación para abrir el panel de apoyo (pestañas por tema y preguntas del tribunal). Todo sale de `AGENTS.md`; si algo cambia allí, se cambia en `tools/guion/defensa.py` y se regenera.', '', '## Guion', '']
for _m, _t, _d, _e in _df.GUION:
    _md_doc += [f'**{_m} · {_t}**', f'- Dices: {_d}', f'- Enseñas: {_e}', '']
_md_doc += ['## Preguntas probables del tribunal', '']
for _q, _a in _df.PREGUNTAS:
    _md_doc += [f'**{_q}**', '', _a, '']
_md_doc += ['## Una idea por tema', '', *[f'- **{t}** · {a}: {b}' for i, t, cs in _df.SECCIONES for a, b in cs[:1]], '']
open(os.path.join(AQUI, '..', '..', 'DEFENSA.md'), 'w', encoding='utf-8').write('\n'.join(_md_doc))
# La parte técnica de la película vive en los créditos (misma fuente que el panel D)
_tec = ''.join('<h3>' + _t + '</h3><dl class="cr-dl">' + ''.join('<dt>' + _a + '</dt><dd>' + _md(_b) + '</dd>' for _a, _b in _cs) + '</dl>' for _i, _t, _cs in _df.SECCIONES)
html = html.replace('<!--TECNICA-->', _tec, 1)
html = html.replace('<script src="sound.js"></script>', _panel + '\n<script src="sound.js"></script>', 1)
html = html.replace('<script src="sound.js"></script>', '<script src="reparto.js"></script>\n<script src="sound.js"></script>\n<script src="voces.js"></script>\n<script src="subs-en.js"></script>\n<script src="cine.js"></script>')
for k, r, say in (('brais', 'bateria', EXTRA_SAY['cast_bateria']), ('xandre', 'voz', EXTRA_SAY['cast_voz']),
                  ('alvaro', 'guitarra', EXTRA_SAY['cast_guitarra']), ('iago', 'bajo', EXTRA_SAY['cast_bajo'])):
    html = html.replace(f'<figure><img src="img/miembro-{k}.jpg"', f'<figure data-who="{r}" data-say="{say}"><img src="img/miembro-{k}.jpg"', 1)
CORTO = ['Tráiler', 'Prólogo · Jueves, 23:47', 'Prólogo · La llamada', 'Título', 'Prólogo · La decisión', 'La IA escribe, tú apruebas', 'El correo llega a la sala', 'Cambio de perfil',
         'Iris separa los instrumentos', 'Choques en el calendario', 'Las noches', 'El festival, 02:14', 'En la radio', 'El giro: el bajista soy yo',
         'Un sueño hecho realidad', 'El reloj', 'El reto', 'La invitación', 'Gracias', 'Créditos']
if FOTOS:
    CORTO.insert(CORTO.index('Un sueño hecho realidad'), 'Mis bandas')
for t in CORTO:
    n = html.count(f'data-title="{t}"')
    assert n == 1, (t, n)
    html = html.replace(f'data-title="{t}"', f'data-title="{t}" data-corto', 1)
html = html.replace('data-title="Créditos" data-corto', 'data-title="Créditos" data-corto data-dur-corto="33000"', 1)
# en la película completa, sin los bloques .cr-extra: 48 s de rollo (styles.css), a la misma velocidad que en el corte
html = html.replace('data-dur="150000"', 'data-dur="150000" data-dur-peli="146000" data-dur-corto="50000"', 1)
html = html.replace('data-title="Y mucho más"', 'data-title="Y mucho más" data-min="10500"', 1)
html = html.replace('<table class="sheet">', '<table class="sheet" data-who="guitarra" data-say="' + EXTRA_SAY['excel'] + '">', 1)
html = html.replace('<div class="rm-say">', '<div class="rm-say" data-who="bajo" data-say="' + EXTRA_SAY['sala'] + '">', 1)
html = html.replace('<div class="react wow"><img src="img/miembro-brais.jpg"', '<div class="react wow" data-who="bateria" data-say="' + EXTRA_SAY['react'] + '"><img src="img/miembro-brais.jpg"', 1)
html = html.replace('<button class="hb sec" id="bSound"', '<button class="hb sec" id="bPeli" title="Modo película: avanza solo (P)" aria-pressed="false">Película</button>\n  <button class="hb sec" id="bVoces" title="Voces de la banda (V)" aria-pressed="true">Voces</button>\n  <button class="hb sec" id="bSound"', 1)
html = html.replace('F para pantalla completa · M para el sonido', 'F para pantalla completa · M para el sonido · V para las voces')
html = html.replace('T tema · F pantalla completa</div>', 'T tema · F pantalla completa · V voces · P película</div>')
html = html.replace('>Empezar con sonido</button>', '>Empezar con sonido y voces</button>')
html = html.replace('<button id="gateSound" class="gate-btn primary">Empezar con sonido y voces</button>', '<button id="gatePeli" class="gate-btn primary">🎬 Ver como película</button>\n      <button id="gateSound" class="gate-btn">Empezar con sonido y voces</button>', 1)
# Pantalla de entrada a lo Netflix: ¿quién está viendo? → inicio con la película destacada (el tráiler arranca solo) y el resto «Próximamente»
PROXIMAMENTE = [
    ('Setlist_v7_FINAL_def2', 'img/concierto-1.jpg'), ('El cantante que no leía los correos', 'img/historia/bajo-contraluz.jpg'),
    ('Master of Prompts: la gira', 'img/historia/mop-gira.jpg'), ('Ensayo a las siete de la mañana', 'img/historia/bajo-bn.jpg'),
    ('Cuatro acordes y un solo', 'img/historia/thc.jpg'), ('Dadme hasta el domingo', 'img/concierto-3.jpg'),
]
filas = ''.join(f'<div class="nx-card" style="--img:url({img})"><b>{t}</b><em>Próximamente</em></div>' for t, img in PROXIMAMENTE)
# Fotos de los perfiles (si falta un fichero, se queda la carita de color; lo de Brais y el logo de The Big School los aporta Diego)
import os
PERFILES = [('brais', 'Brais', 'img/perfil-brais.jpg'), ('profes', 'Profesorado', 'img/perfil-tbs.png'),
            ('pelaez', 'Invitado Peláez', 'video/actores/pelaez.jpg'), ('diego', 'Diego', 'img/diego-bajista.jpg')]
def _av(k, foto, extra=''):
    ok = os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', foto))
    return f'<i class="av {k}{" foto" if ok else ""}{extra}"' + (f' style="--foto:url({foto})"' if ok else '') + '></i>'
perfiles = ''.join(f'<button class="nx-perfil" data-p="{k}">{_av(k, f)}<span>{n}</span></button>' for k, n, f in PERFILES)
AV_BRAIS = _av('brais', PERFILES[0][2], ' mini')
i0 = html.index('<div id="gate"'); i1 = html.index('<div id="prog">')
html = html[:i0] + '''<div id="gate" data-fase="perfiles" role="dialog" aria-modal="true" aria-label="Empezar la película">
  <div class="nx-perfiles">
    <span class="nx-logo nx-logo-g">NETFLIX</span>
    <h2>¿Quién está viendo ahora?</h2>
    <div class="nx-pf">''' + perfiles + '''</div>
    <span class="nx-admin">ADMINISTRAR PERFILES</span>
  </div>
  <div class="nx-home">
    <div class="nx-bg" style="--img:url(img/concierto-2.jpg)"></div>
    <video class="nx-vid" muted loop playsinline preload="auto" poster="video/actores/concierto.jpg" aria-hidden="true"><source src="video/actores/concierto.mp4" type="video/mp4"></video>
    <div class="nx-velo"></div>
    <div class="nx-top">
      <span class="nx-logo">NETFLIX</span>
      <nav><span class="on">Inicio</span><span>Series</span><span>Películas</span><span>Novedades más vistas</span><span>Mi lista</span></nav>
      <div class="nx-der"><i class="nx-lupa"></i><span>Infantil</span><i class="nx-camp"></i>' + AV_BRAIS + '</div>
    </div>
    <div class="nx-hero">
      <div class="nx-sello"><i>N</i> PELÍCULA</div>
      <h1 class="nx-titulo">Os Herdeiros<br>do Código</h1>
      <div class="nx-top10"><b>TOP<br>10</b><span>N.º 1 en películas hoy</span></div>
      <p class="nx-sin">Una banda a punto de separarse. Un bajista con un portátil y hasta el sábado. Y una aplicación que ni él se cree que haya hecho.</p>
      <div class="gate-btns">
        <button id="gatePeli" class="gate-btn primary">&#9654; Reproducir</button>
        <button id="gateInfo" class="gate-btn nx-info">&#9432; Más información</button>
      </div>
      <div class="nx-alt"><button id="gateCorto" class="gate-btn">Corte de 5 min</button><button id="gateSound" class="gate-btn">Ver como presentación</button><button id="gateSilent" class="gate-btn">Sin sonido</button></div>
      <div class="nx-meta"><span>2026</span><span class="nx-edad">+12</span><span>15 min</span><span>HD</span><span>Español</span><span class="nx-cc">CC</span></div>
      <p class="nx-gen">Comedia · Rock · Tecnología · Basada en hechos casi reales</p>
    </div>
    <div class="nx-lado"><i class="nx-mute"></i><span class="nx-edad">+12</span></div>
    <div class="nx-filas"><h3>Próximamente</h3><div class="nx-row">''' + filas + '''</div></div>
    <div class="nx-modal" id="nxModal" role="dialog" aria-label="Más información" hidden>
      <div class="nx-mcard">
        <div class="nx-mfoto" style="--img:url(img/concierto-2.jpg)"><button class="nx-cerrar" id="nxCerrar" aria-label="Cerrar">&#10005;</button>
          <h2>Os Herdeiros<br>do Código</h2>
          <div class="gate-btns"><button class="gate-btn primary" id="nxModalPeli">&#9654; Reproducir</button></div>
        </div>
        <div class="nx-mcuerpo">
          <div class="nx-mizq">
            <div class="nx-meta"><span class="nx-verde">98 % para ti</span><span>2026</span><span class="nx-edad">+12</span><span>15 min</span><span>HD</span></div>
            <p>Una banda a punto de separarse. Un bajista con un portátil y hasta el sábado. Y una aplicación que ni él se cree que haya hecho.</p>
            <p class="nx-peq">Cuatro amigos, un Excel con siete versiones de todo y una pregunta que nadie contestaba: ¿quién gestiona la banda? La respuesta cabe en una presentación de trabajo fin de máster.</p>
          </div>
          <dl class="nx-mder">
            <dt>Reparto:</dt><dd>{voz}, {guitarra}, {bateria}, {bajo}</dd>
            <dt>Géneros:</dt><dd>Comedias de rock, Películas sobre tecnología</dd>
            <dt>Esta película es:</dt><dd>Divertida, Inspiradora, Muy de local de ensayo</dd>
            <dt>Dirección:</dt><dd>Diego de la Calle</dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="gate-note">TFM · Máster de Desarrollo con IA · The Big School by Brais Moure — F pantalla completa · espacio pausa · C subtítulos</div>
  </div>
</div>
''' + html[i1:]
# ───────── Montaje: cómo se entra en cada plano (deck.js) y qué música suena (cine.js) ─────────
# j: se oye antes de verse · l: la voz del plano anterior sigue sobre este · rampa: rampa de velocidad con golpe en el pulso
# golpe: corte seco · negro: fundido a negro (saltos de tiempo, capítulos) · fundido: encadenado
CORTES = {
    'Prólogo · Jueves, 23:47': 'negro', 'Prólogo · La llamada': 'golpe', 'Título': 'golpe', 'Prólogo · La banda': 'golpe',
    'Prólogo · La decisión': 'l', 'Prólogo · Viernes, 22:10': 'fundido', 'Prólogo · Sábado, 11:00 en el local': 'j',
    'Todas las salas, en un sitio': 'rampa', 'La IA escribe, tú apruebas': 'j', 'El correo llega a la sala': 'golpe', 'Date Swap': 'rampa', 'Cambio de perfil': 'l',
    'Bandas amigas': 'rampa', 'El acuerdo, firmado desde BandManager': 'j', 'La sala contestó': 'negro',
    'Una hoja para cada músico': 'rampa', 'Los acordes pasan solos': 'j', 'El profesor de armonía': 'l',
    'Iris separa los instrumentos': 'l', 'Las ideas, en su sitio': 'j', 'Calendario de la banda': 'rampa', 'La ficha del bolo': 'j',
    'Choques en el calendario': 'l', 'El dossier de la banda': 'rampa', 'Un QR y el público se hace fan': 'j', 'Merchan en un minuto': 'rampa',
    'Del directo al reel': 'rampa', 'Del concierto al disco': 'rampa', 'Cuánto entra y cuánto queda': 'rampa', 'La gira, con gasolina y todo': 'j',
    'Lo han visto todo': 'golpe', 'Las noches': 'l', 'Y mucho más': 'rampa', 'Esto lo necesitan todos': 'j',
    'Para darlo a conocer': 'rampa', 'A quién se lo vendemos': 'j', 'Cómo ganamos dinero': 'j', 'Arquitectura': 'rampa',
    'El mapa que lee la IA': 'j', 'Cómo se construyó con IA': 'j', 'Seguridad': 'l', 'Calidad en cifras': 'rampa', 'Qué viene': 'j', 'Confirmados': 'golpe',
    'El festival, 02:14': 'negro', 'En la radio': 'j', 'Otro jueves, 23:47': 'fundido', 'El giro: el bajista soy yo': 'negro',
    'Entrevista · Un correo': 'negro', 'Entrevista · El treinta por ciento': 'golpe', 'Entrevista · Nadie lo sabía': 'golpe',
    'Entrevista · Treinta y cinco minutos': 'golpe', 'Entrevista · El tono': 'golpe', 'Entrevista · Los fans': 'golpe',
    'Entrevista · Los commits': 'fundido', 'Entrevista · Peláez': 'golpe',
    'Mis bandas': 'golpe', 'Un sueño hecho realidad': 'fundido', 'El reloj': 'golpe', 'El reto': 'golpe', 'La invitación': 'fundido', 'Gracias': 'negro', 'Créditos': 'negro', 'Escena post-créditos': 'negro',
}
# La música cambia en estas escenas y sigue hasta el próximo cambio («-» = silencio)
MUSICA = {'Tráiler': '-', 'Título': '-', 'Prólogo · La banda': 'tension', 'Capítulo 1 · Conseguir el bolo': 'tema', 'Las noches': 'dramatica', 'Esto lo necesitan todos': 'noches', 'Y mucho más': 'tema',
          'Qué viene': 'tension', 'Confirmados': 'tema', 'El festival, 02:14': 'lostrego', 'Otro jueves, 23:47': 'noches', 'Mis bandas': 'lostrego', 'El giro: el bajista soy yo': 'dramatica', 'Un sueño hecho realidad': 'dramatica', 'El reloj': '-', 'El reto': 'tema', 'La invitación': 'dramatica', 'Gracias': 'lostrego',
          'Escena post-créditos': 'tema'}
for t in CORTES:
    if t.startswith('Capítulo') or (t == 'Mis bandas' and not FOTOS):
        continue
    assert html.count(f'data-title="{t}"') == 1, ('corte', t)
for t in [x for x in re.findall(r'data-title="([^"]+)"', html) if x.startswith('Capítulo')]:
    CORTES[t] = 'negro'
musica = '-'
def _marca(mm):
    global musica
    t = mm.group(1)
    musica = MUSICA.get(t, musica)
    c = f' data-corte="{CORTES[t]}"' if t in CORTES else ''
    return f'{mm.group(0)}{c} data-musica="{musica}"'
html = re.sub(r'(?<=<section class="slide)[^>]*?data-title="([^"]+)"', lambda mm: _marca(mm), html)
sin_usar = [k for k, v in SAY if k not in USADOS]
if sin_usar: print('Guion hablado sin usar:', sin_usar)
# fotos del reparto
for k, r in (('iago', 'bajo'), ('brais', 'bateria'), ('xandre', 'voz'), ('alvaro', 'guitarra')):
    html = html.replace(f'src="img/miembro-{k}.jpg"', f'data-foto="{r}" src="img/miembro-{k}.jpg"')
# cargos del reparto (figuras)
for lit, r in (('<span>Batería</span>', 'bateria'), ('<span>Voz y guitarra</span>', 'voz'), ('<span>Guitarra solista</span>', 'guitarra'), ('<span>Bajo</span>', 'bajo')):
    html = html.replace(lit, '<span>{%s:cargo}</span>' % r)
# etiquetas «Nombre · rol» y nombres sueltos (menos el profesor: «Brais Moure» / MoureDev)
for nombre, r in (('Iago', 'bajo'), ('Brais', 'bateria'), ('Xandre', 'voz'), ('Álvaro', 'guitarra')):
    rol = {'bajo': 'bajo', 'bateria': 'batería', 'voz': 'voz', 'guitarra': 'guitarra'}[r]
    html = html.replace(f'{nombre} · {rol}', '{%s} · {%s:rol}' % (r, r))
    html = re.sub(rf'\b{nombre}\b(?! Moure)', '{%s}' % r, html)
html = re.sub(r'\bClaudio\b', '{ia_claude}', html)
html = re.sub(r'\bGuglio\b', '{ia_gemini}', html)
# lo que no debe tocarse: el contenido de <script> y <style> no lleva nombres, pero por si acaso se restauran

# ───────── Guion final (guion_final.json): diálogos pulidos de cada escena, pantalla y voz ─────────
import json as _jg, html as _hg
_GRACIAS_VID = ('<video class="foto-mop" data-ambient data-restart muted loop playsinline preload="auto" poster="img/gracias-mop.jpg" aria-label="Brais y Diego con una Estrella Galicia, ya en Master of Prompts">'
                '<source src="video/actores/gracias.webm" type="video/webm"><source src="video/actores/gracias.mp4" type="video/mp4"></video>')
def _aplicar_guion(html):
    datos = _jg.load(open(os.path.join(AQUI, 'guion_final.json'), encoding='utf-8'))
    esc = lambda t: _hg.escape(t, quote=True)
    avisos = []
    for sc in datos:
        t = sc['title']
        ini = html.find(f'data-title="{t}"')
        if ini < 0:
            avisos.append('sin escena: ' + t); continue
        ini = html.rfind('<section', 0, ini); fin = html.index('</section>', ini)
        cuerpo = html[ini:fin]
        pat = re.compile(r'<(li|div|figure|p|span)\b([^>]*\bdata-who="([^"]*)"[^>]*)>')
        els = [m for m in pat.finditer(cuerpo) if 'data-say=' in m.group(2)]
        L = sc['lines']
        if len(els) == len(L) and all(m.group(3) == l['who'] for m, l in zip(els, L)):
            # misma cantidad y mismos personajes: se actualiza cada elemento en su sitio (la animación de pantalla va ligada a esas líneas)
            nuevo, pos = [], 0
            for m, l in zip(els, L):
                if m.group(3) != l['who']:
                    avisos.append(f"{t}: personaje {m.group(3)}≠{l['who']}")
                tag = re.sub(r'data-say="[^"]*"', lambda _: 'data-say="' + esc(l['voz']) + '"', m.group(0), 1)
                nuevo.append(cuerpo[pos:m.start()]); nuevo.append(tag); pos = m.end()
                if m.group(1) in ('li', 'div', 'p', 'span'):
                    fin_t = cuerpo.find('</' + m.group(1) + '>', pos)
                    if fin_t > 0 and '<' not in cuerpo[pos:fin_t] and m.group(1) == 'li':
                        nuevo.append(esc(l['txt']).replace('&#x27;', "'")); pos = fin_t
            nuevo.append(cuerpo[pos:]); cuerpo = ''.join(nuevo)
        elif els and all(m.group(1) == 'li' for m in els):
            # cambia la cantidad de líneas: se rehace la lista conservando los atributos (sync, hora) de las que se mantienen
            a, b = els[0].start(), cuerpo.find('</li>', els[-1].end()) + 5
            lis = []
            for k, l in enumerate(L):
                base = els[min(k, len(els) - 1)].group(2)
                atrs = re.sub(r'\s*data-who="[^"]*"|\s*data-say="[^"]*"|\s*data-t="[^"]*"', '', base).strip()
                if k >= len(els): atrs = re.sub(r'\bsync\b', '', atrs)
                atrs = re.sub(r'class="\s*"', '', atrs).strip()
                hora = f' data-t="{l["t"]}"' if l.get('t') else (re.search(r'data-t="[^"]*"', base).group(0).join([' ', '']) if re.search(r'data-t="[^"]*"', base) else '')
                lis.append(f'<li data-who="{l["who"]}"{hora}{(" " + atrs) if atrs else ""} data-say="{esc(l["voz"])}">{esc(l["txt"]).replace("&#x27;", chr(39))}</li>')
            cuerpo = cuerpo[:a] + '\n      '.join(lis) + cuerpo[b:]
        elif not els and t == 'Gracias':
            # Diego habla sobre la portada de «Gracias»: cada frase es un elemento con su voz y su texto en pantalla
            v = [l['voz'] for l in L]
            cuerpo = re.sub(r'<p class="sub">.*?</p>',
                '<p class="sub" data-who="diego" data-say="' + esc(v[0]) + '">A Brais y a todo el profesorado de The Big School, por un máster que acaba en una aplicación de verdad.</p>\n'
                '  <p class="sub inv" data-who="diego" data-say="' + esc(v[1]) + '">Y la invitación sigue en pie, Brais, y es solo para ti: un batería tan bueno no se deja escapar.</p>', cuerpo, 1, flags=re.S)
            cuerpo = re.sub(r'<div class="sign-msg">', '<div class="sign-msg" data-who="diego" data-say="' + esc(v[2]) + '">', cuerpo, 1)
            if os.path.exists(os.path.join(AQUI, '..', '..', 'img', 'gracias-mop.jpg')):
                _i = cuerpo.find('<div class="art">')
                if _i >= 0:  # se quita entero el bloque de la pantalla de la app (div anidados: se cuentan las aperturas y los cierres)
                    _n, _j = 0, _i
                    for _m in re.finditer(r'<(/?)div\b', cuerpo[_i:]):
                        _n += -1 if _m.group(1) else 1
                        if _n == 0:
                            _j = _i + _m.end(); _j = cuerpo.index('>', _j) + 1; break
                    cuerpo = cuerpo[:_i] + '<div class="art foto">' + (_GRACIAS_VID if os.path.exists(os.path.join(AQUI, '..', '..', 'video', 'actores', 'gracias.mp4')) else '<img class="foto-mop" src="img/gracias-mop.jpg" alt="Brais y Diego con una Estrella Galicia, ya en Master of Prompts">') + '<p class="foto-lema"><b>¿Te imaginas vivir esto?</b><b class="l2">¿Te gustaría?</b><span class="l3">Con BandManager es posible esto y mucho más.</span></p><span class="foto-pie">Montaje con IA · ya sois de Master of Prompts</span></div>' + cuerpo[_j:]

        else:
            avisos.append(f'{t}: estructura no soportada ({len(els)}→{len(L)})')
        html = html[:ini] + cuerpo + html[fin:]
    for a in avisos: print('  guion ⚠', a)
    return html
html = _aplicar_guion(html)
if os.path.exists(os.path.join(AQUI, '..', '..', 'img', 'gracias-mop.jpg')):
    html = html.replace('<dt>Fer</dt>', '<dt>Foto final de «Gracias»</dt><dd>Montaje con IA: Brais y Diego, ya en Master of Prompts</dd>\n      <dt>Fer</dt>', 1)
open(os.path.join(AQUI, '..', '..', 'index.html'), 'w', encoding='utf-8').write(html)
print('slides', html.count('<section class="slide'))
import subs_en
subs_en.main()
