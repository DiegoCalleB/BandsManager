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
_i = trailer.index('<div class="tr-beat tr-photo" style="--t:2.6s')
trailer = trailer[:_i] + _rw + '\n  ' + trailer[_i:]
cast = section('Prólogo · La banda')
excel = section('Prólogo · La hoja de cálculo')
room = section('Prólogo · Sábado, 11:00 en el local')
import glob
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
    'manager': ('Manager · Os Herdeiros do Código', 'img/personaje-manager.jpg', False),
    'mop': ('Master of Prompts · voz', 'img/personaje-cantante.jpg', False),
    'claudio': ('Claudio · Claude Code', None, False),
    'guglio': ('Guglio · Gemini', None, False),
}


ROLE = {'iago': 'bajo', 'brais': 'bateria', 'xandre': 'voz', 'alvaro': 'guitarra', 'manager': 'manager',
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
add(cast + '\n')

add(scene('Prólogo · Jueves, 23:47', 'Prólogo · Os Herdeiros do Código', 'Un jueves cualquiera, a las 23:47.', 'img/concierto-3.jpg',
          dlg(m('xandre', '¿Alguien ha contestado a la sala del 14?', '23:47'),
              m('alvaro', 'Llevamos tres ensayos sin saber qué tocamos.', '23:52', 'cold'),
              m('brais', 'Así no llegamos a ningún lado.', '23:58', 'cold'),
              m('iago', 'Ya he dejado dos grupos por esto y no quiero que me vuelva a pasar.', '00:01'),
              m('iago', 'Dadme hasta el sábado.', '00:03'))))

add(scene('Prólogo · La llamada', 'Prólogo · Jueves · 00:09', 'Y entonces, sonó el teléfono.', 'img/concierto-1.jpg',
          '<div class="callcard"><i class="cc-ico" aria-hidden="true">☎</i><div><small>Llamada entrante · 00:09</small><b>Discos Cuarzo</b><span>Sr. Peláez</span></div></div>' +
          dlg(m('sello', 'Herdeiros, os escribí hace tres meses y nadie contestó. Os ofrezco contrato: gestiono yo, me quedo el 30 % y los másteres son míos.', '00:09',
                say='[calmly] Herdeiros, os escribí hace tres meses, y nadie contestó. Os ofrezco contrato. Yo gestiono, me quedo el treinta por ciento, y los másteres, naturalmente, son míos.'),
              m('xandre', '¿Los másteres? ¿Nuestras canciones? ¡Ni de broma!', '00:10', say='[shouts] ¿Los másteres? ¿Nuestras canciones? ¡Ni de broma, che!'),
              m('alvaro', 'Es que el correo… se nos pierde.', '00:10', say='[sighs] Es que el correo… se nos pierde, tío.'),
              m('sello', 'Sin datos no hay contrato. Pensadlo.', '00:11', say='Sin datos, no hay contrato. Pensadlo.'),
              m('iago', 'No firméis nada. Las canciones son nuestras, y los datos también. El sábado os lo demuestro.', '00:12',
                say='[firmly] No firméis nada, chavales. Las canciones son nuestras. Y los datos, también. El sábado os lo demuestro.'), cls='tight'), tr='zoom'))

add(excel + '\n')

add(f'''<section class="slide scene" data-title="Prólogo · La decisión" data-transition="rise">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">Prólogo · Jueves · 00:20</span>
  <h2 style="font-size:78px">Esa noche, Iago abrió el portátil.</h2>
  <div class="enrol slim">
    <div class="en-top"><div class="mono" aria-hidden="true">TBS</div><div><b>Máster de Desarrollo con IA</b><span>The Big School by Brais Moure · Requisito para acabar: un Trabajo Fin de Máster</span></div></div>
  </div>
  {dlg(m('iago', 'Para acabar el máster necesito un proyecto. Y mi banda necesita un milagro.'),
       m('claudio', '¿Y si el proyecto es el milagro?'),
       m('guglio', 'Yo pongo las ideas locas. Claudio las discute.'),
       m('claudio', 'Y tú decides, Iago. Revisamos cada respuesta.'),
       m('iago', 'Hecho, tronco. Empezamos esta noche.'), cls='tight')}
  <div class="ia-duo">
    <div class="ia-card ia-claude"><img src="img/logo-claude.svg" alt="Claude"><div><b>Claudio</b><span>Claude Code</span><em>el que discute</em><i class="ia-pt" aria-hidden="true"><u></u><u></u><u></u></i></div></div>
    <div class="ia-card ia-gemini"><img src="img/logo-gemini.svg" alt="Gemini"><div><b>Guglio</b><span>Gemini</span><em>el de las ideas locas</em><i class="ia-pt" aria-hidden="true"><u></u><u></u><u></u></i></div></div>
  </div>
  <p class="scene-foot"><b>Y esta parte es cierta:</b> esta presentación es el TFM de ese máster.</p>
</section>
''')

add(scene('Prólogo · El sábado en el local', 'Prólogo · Viernes · 22:10', 'Iago tiene algo que enseñar.', 'img/concierto-1.jpg',
          dlg(m('iago', 'Chicos, mañana a las 11 en el local. Tengo que enseñaros algo que ni yo me creo que haya hecho solo. 🤯', '22:10'),
              m('xandre', '¿De qué va? ¿Qué es??', '22:14'),
              m('alvaro', 'Seguro que ha encontrado una base de datos con todas las salas de Galicia.', '22:19'),
              m('brais', 'O ha descubierto Google Calendar. 🤣', '22:31'),
              m('iago', 'Mañana a las 11. Traed unas birras y os cuento. 🍻', '22:33'),
              m('alvaro', 'Y ojo: mañana a las 14:00 cierran el cartel del Resurrección Fest. Si no mandamos nada, no tocamos.', '22:40',
                say='[worried] Y ojo: mañana a las dos cierran el cartel del Resurrección Fest. Si no mandamos nada, no tocamos.'))))

add(room + '\n')

# ───────── Capítulo 1 · Conseguir el bolo ─────────
add(act('Capítulo 1 · Conseguir el bolo', 'I', 'Capítulo 1 de 6 · Conseguir el bolo', 'Primero, las salas.',
        'Buscar, escribir y cerrar fechas sin perseguir a nadie.', 'iago',
        'Empezamos por lo que más nos dolía: las salas.', 1, 'img/concierto-2.jpg'))

TAG1 = 'Sábado · 11:00 · Conseguir el bolo'
add(feat('Todas las salas, en un sitio', TAG1, 'Todas las salas, en un sitio.',
         [m('xandre', '¡¿Esto lo has hecho tú?!'),
          m('iago', 'Con ayuda. Aquí tengo las salas y los festivales, y cada conversación queda guardada.'),
          m('alvaro', '¡Una base de datos de salas! ¡Te lo dije!'),
          m('iago', 'Casi. Y hay un agente, el Scout, que busca salas nuevas por nosotros.'),
          m('brais', 'Pues yo dije Google Calendar.'),
          m('iago', 'Eso también. Ya llegamos.'),
          m('iago', 'Y todas, en el mapa, por toda España.', cls='sync', say='Y todas, en el mapa. Por toda España.')],
         shot_vid_sync('video/v-mapa-peninsula.mp4', 'img/d-h-booking.jpg')))

add(feat('La IA escribe, tú apruebas', TAG1, 'La IA escribe. Tú apruebas.',
         [m('alvaro', '¡Me ha escrito a tres salas mientras hablábamos!'),
          m('iago', 'Cada correo suena a nosotros: lo redacta la IA con el estilo de la banda y de la sala.'),
          m('brais', '¿Y si se le va la mano y escribe una burrada?'),
          m('iago', 'Por eso nada sale sin mi visto bueno. Y cuando la sala contesta, otro agente lee la respuesta y me avisa.'),
          m('alvaro', '¿Y cómo sabemos si lo han leído?', say='[curious] ¿Y cómo sabemos si lo han leído de verdad?'),
          m('iago', 'Se puede entrenar a la IA con estrellas, y te avisa cuando abren el correo, el dossier o entran en nuestras redes.', say='Y a la IA la puedes entrenar: le das estrellas a cada correo, y aprende cómo hablas. Y te avisa cuando abren el correo, cuando abren el dossier, y cuando se pasan por nuestras redes.'),
          m('xandre', 'O sea, que tú solo aprietas el botón.'),
          m('iago', 'Y presumo. 😅')],
         shot_img('img/d-h-pitch.jpg')))

add(feat('Date Swap', TAG1, 'Date Swap: cambio de fecha.',
         [m('iago', 'Propongo a otra banda cambiar fecha: yo toco en su ciudad y ellos en la mía. La IA redacta la propuesta.'),
          m('mop', 'Os leo. Me encanta: nosotros en Vigo y vosotros en Santiago. ¡Cartel doble!'),
          m('brais', '¡Cartel doble con otra banda! ¡Esto no lo tiene nadie!'),
          m('xandre', '¿Y quién es ese?'),
          m('iago', 'El cantante de Master of Prompts. Ya veréis lo que da de sí.'),
          m('mop', 'Y oye, Brais: nos falta batería. ¿Te vienes a Master of Prompts?', say='[laughs] Y oye, {bateria}: nos falta batería. ¿Te vienes a Máster of Prompts?'),
          m('brais', '¿Yo? ¡Pero si ya tengo banda! Bueno… los miércoles libro.', say='[gasps] ¿Yo? ¡Pero si ya tengo banda! Bueno… los miércoles libro.'),
          m('xandre', '¡Traidor! ¡Nos deja por unos metaleros!', say='[dramatically] ¡Traidor! ¡Nos deja por unos metaleros, che!')],
         shot_img('img/d-h-swap.jpg')))

add(feat('Cambio de perfil', TAG1, 'Una cuenta, varias bandas.',
         [m('iago', 'Tranquilos: Brais puede tocar en las dos bandas sin liarse. Mirad su cuenta.', say='Tranquilo, {voz}: {bateria} puede tocar en las dos bandas, y sin liarse. Mirad su cuenta.'),
          m('brais', 'Un momento… arriba pone Brais Moure. ¿Esa es mi cuenta?', say='[curious] Un momento… ahí arriba pone Brais Moure. ¿Esa es mi cuenta?'),
          m('iago', 'Claro, Brais: tu cuenta de Cabeza de Cartel. Una cuenta, varias bandas.', say='Claro, {bateria}. Es tu cuenta de Cabeza de Cartel: una cuenta, y varias bandas.'),
          m('alvaro', '¿Y cómo cambias de una banda a otra?', say='¿Y cómo cambias de una banda a otra?'),
          m('iago', 'Como de perfil en una plataforma de cine. ¿Quién toca hoy? Master of Prompts.', cls='sync', say='Como de perfil en una plataforma de cine. ¿Quién toca hoy? Máster of Prompts.'),
          m('xandre', '¡Cambió todo! ¡El logo, el calendario, hasta las salas!', say='[amazed] ¡Ché, cambió todo! ¡El logo, el calendario, hasta las salas!'),
          m('iago', 'Y lo de una banda no se ve nunca en la otra. Esa es la primera regla.', say='Y lo de una banda no se ve nunca en la otra. Esa es la primera regla del contrato.')],
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
          m('iago', 'Solo abrir un enlace y firmar. Y le llega copia.'),
          m('brais', '¡Se acabaron las sorpresas el día del bolo!')],
         '<div class="ft-shot phone acuerdo"><img src="img/md-h-acuerdo.jpg" alt="Hoja de acuerdo de la sala con la firma"></div>'))

add(scene('La sala contestó', 'Tres semanas después', 'La sala contestó. Por fin.', 'img/concierto-2.jpg',
          '''<table class="sheet" style="width:1180px;margin-top:26px">
    <thead><tr><th>bolos_2026_DEF_v7(1).xlsx</th><th>Enviado</th><th>Respuesta</th><th>Fecha</th></tr></thead>
    <tbody>
      <tr><td>Sala del puerto</td><td>12 mar</td><td class="no">sin respuesta</td><td>-</td></tr>
      <tr><td>Festival de verano</td><td>14 mar</td><td class="no">sin respuesta</td><td>-</td></tr>
      <tr><td>Bar de la plaza</td><td>20 abr</td><td class="no">leído, sin respuesta</td><td>-</td></tr>
      <tr><td>Sala El Faro</td><td>02 may</td><td class="yes">«Nos encaja el 14»</td><td class="yes">14 nov</td></tr>
    </tbody>
  </table>
  ''' + dlg(m('manager', 'Chicos, ha contestado la Sala El Faro: nos encaja el 14 de noviembre.'),
            m('xandre', '¡¡Por fin!! ¡Del rojo al verde!'),
            m('manager', 'Os conocí por Date Swap. Ahora os llevo yo los bolos.'), cls='tight')))

# ───────── Capítulo 2 · Antes del concierto ─────────
add(act('Capítulo 2 · Antes del concierto', 'II', 'Capítulo 2 de 6 · Antes del concierto', 'Ahora, la música.',
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

add(f'''<section class="slide feat dl" data-grupo="musica" data-title="Una hoja para cada músico" data-transition="rise">
  <div class="ft-copy"><span class="tag">{TAG2}</span><h2>Cada músico, su hoja.</h2>
    {dlg(m('iago', 'Imprimo el setlist y sale una hoja distinta para cada uno. Con el logo de la banda detrás.'),
         m('brais', '¡Mi hoja! ¡Con mis notas, solo mías!'),
         m('xandre', 'Y yo con el tono de cada tema. ¡Por fin sé en qué canto!'),
         m('alvaro', '¿Y hay temas sin tono ni BPM?'),
         m('iago', 'Cada uno elige qué ve: el tono o el BPM solo en los temas donde lo quiere. Y hasta los bloques, como el saludo.'))}
  </div>
  <div class="paperwrap" aria-label="Hoja de setlist impresa para el batería y la voz">{back}{front}</div>
</section>
''')

add(feat('La curva de energía', TAG2, 'La curva de energía.',
         [m('iago', 'Cada tema tiene su energía. La app dibuja la curva del concierto.', say='Mirad, chavales: cada tema tiene su energía, y la app dibuja la curva del concierto entero.'),
          m('alvaro', '¿Y si la curva se cae a mitad del bolo?', say='[curious] ¿Y si a mitad del bolo la curva se cae?'),
          m('iago', 'Le das a «Optimizar orden» y te propone el setlist perfecto.', say='Le das a optimizar orden, y te propone el setlist perfecto. Tú decides si lo aplicas.'),
          m('iago', 'Y vigila las transiciones: energía y tonalidad, tema a tema.', say='Y la inteligencia artificial vigila las transiciones: que no choquen ni la energía ni el tono de un tema al siguiente.'),
          m('xandre', '¡Un setlist que sube como un cohete! 🚀', say='[amazed] ¡Ché, un setlist que sube como un cohete!')],
         shot_vid('video/v-energia.mp4', 'video/v-energia.jpg'), grupo='musica'))

add(feat('Los acordes pasan solos', TAG2, 'Los acordes pasan solos.',
         [m('iago', 'Dale al play, Álvaro. Los acordes y la letra siguen la canción solos.'),
          m('alvaro', '¡Pero tío! ¡Te has copiado de Ultimate Guitar! ¡¡Pellízcame!! ¡Esto no puede ser real, esto es un sueño!'),
          m('brais', '¡Estoy flipando!'),
          m('iago', 'Espera, espera, que esto es solo el principio. ¡Vais a flipar!')],
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
          m('alvaro', '¡Espera, espera! ¡¿Esto no será un Moisés?!'),
          m('iago', '¡Sí, tío! Un Moisés integrado en nuestro repertorio, para subir nuestras ideas sobre nuestras propias pistas. Me ha costado lo suyo, pero al final lo conseguí. ¡Yo tampoco me lo creo, jajaja!')],
         shot_vid('video/v-iris.mp4', 'video/v-iris.jpg', cls='alto'), grupo='musica'))

add(feat('Las ideas, en su sitio', TAG2, 'Las ideas, en su sitio.',
         [m('brais', '¿Y el break que grabé en el móvil?', say='[softly] Neno, ¿y el break de batería que grabé el otro día en el móvil?'),
          m('iago', 'Va a su canción y a su sección: intro, verso, estribillo o solo.', say='Va a su canción y a su sección: intro, verso, estribillo o solo. Con tu nombre, tronco.'),
          m('xandre', '¡Y cada uno comenta la idea! 💬', say='[excited] ¡Y encima le podemos dejar comentarios a cada idea! ¡Me encanta, boludo!'),
          m('alvaro', '¡Se acabó el audio perdido en el WhatsApp! 🙌', say='[laughs] ¡Se acabó el audio perdido en el guasap!')],
         shot_vid('video/v-ideas.mp4', 'video/v-ideas.jpg', cls='alto'), grupo='musica'))

add(feat('Calendario de la banda', TAG2, 'Ensayos y bolos, en un calendario.',
         [m('brais', '¡Esto es lo de Google Calendar! ¡Mira, acerté! 🤣'),
          m('iago', 'Casi, Brais. Aquí están los ensayos y los bolos, y cada fecha tiene su ficha con la meteo y el aviso de puente o festivo.'),
          m('xandre', '¡Por fin sé cuándo ensayamos y cuándo tocamos!')],
         shot_img('img/d-h-calendario.jpg'), grupo='musica'))

add(feat('La ficha del bolo', TAG2, 'Cada bolo, con su ficha.',
         [m('xandre', '¿Y esto? ¿También sabe qué tiempo hará en el bolo?', say='[amazed] ¿Y esto? ¿También sabe qué tiempo va a hacer en el bolo?'),
          m('iago', 'Cada bolo tiene su ficha: el aviso de puente, el tiempo, la logística, el rider, los contactos, el merchan y cuánto os queda limpio.', cls='sync',
            say='Cada bolo tiene su ficha. El aviso si cae en puente, y la ciudad se vacía. El tiempo que va a hacer. La logística, el rider, los contactos, el merchan… Y cuánto os queda limpio. Todo, en un clic.'),
          m('brais', 'Y yo sin enterarme del puente. 🤦', say='[laughs] Y yo, sin enterarme nunca del puente.')],
         shot_vid_sync('video/v-concierto.mp4', 'img/d-h-evento.jpg'), grupo='musica'))

add(feat('Choques en el calendario', TAG2, 'El calendario avisa de los choques.',
         [m('brais', '¿Y si me cuadran dos ensayos a la vez, uno con cada banda?', say='[worried] Oye… ¿y si me cuadran dos ensayos a la vez? Uno con cada banda.'),
          m('iago', 'El calendario te avisa si dos eventos se pisan, si no da tiempo a llegar o si vas justo para montar.', cls='sync', say='El calendario te avisa. Si dos eventos se pisan, si no da tiempo de llegar de un sitio a otro, o si vas justo para montar.'),
          m('brais', '¡Ai, mi madriña! ¡Me ha salvado el miércoles!', say='[amazed] ¡Ai, mi madriña! ¡Me acaba de salvar el miércoles!'),
          m('iago', 'Y solo avisa cuando hay una persona en los dos sitios. Si no, no te molesta.', say='Y solo avisa cuando hay una persona en los dos sitios. Si no, no te molesta.')],
         shot_vid_sync('video/v-choques.mp4', 'img/d-h-calendario.jpg'), grupo='musica'))

# ───────── Capítulo 3 · Que te conozcan ─────────
add(act('Capítulo 3 · Que te conozcan', 'III', 'Capítulo 3 de 6 · Que te conozcan', 'Que nos conozcan.',
        'Un dossier, un QR y un vídeo para que la gente nos siga.', 'iago',
        '¡Y ahora, que nos conozca más gente! 🌍', 3, 'img/concierto-3.jpg'))

TAG3 = 'Sábado · 12:20 · Que te conozcan'
add(feat('El dossier de la banda', TAG3, 'El dossier de la banda.',
         [m('alvaro', '¡¿Qué co******?! ¿Que ahora tenemos una web?!'),
          m('brais', '¡Pero si está guapísima! ¡¿Qué me estás contando?!'),
          m('iago', '¡Es una pasada, tronco! Es el dossier de la banda: fotos, formación y contacto de booking, y es súper sencillo de editar desde la aplicación. ¡Pero esperad, que aún quedan muchas más cosas!'),
          m('alvaro', 'Estoy flipando en colores…')],
         shot_img('img/d-h-dossier.jpg')))

add(f'''<section class="slide feat dl" data-grupo="promocion" data-title="Un QR y el público se hace fan" data-transition="rise">
  <div class="ft-copy" style="width:720px"><span class="tag">{TAG3}</span><h2>Un QR, y el público se hace fan.</h2>
    {dlg(m('alvaro', '¿Cómo…? ¿Que si ponemos este QR en el concierto la gente podrá entrar aquí y seguirnos en redes?'),
         m('iago', '¡Sí! También pueden echarnos una mano con dinero, comprarnos merchan (cuando lo hagamos), ver nuestros próximos bolos y entrar en la web.'),
         m('iago', 'Y dejan su correo, con su permiso, y se llevan un regalo nuestro: un descuento o una descarga exclusiva.', say='Y dejan su correo, con su permiso, y se llevan un regalo nuestro: un descuento, o una descarga exclusiva. Y tú te quedas con la lista, para avisarles de los bolos.'),
         m('xandre', 'En serio… creo que estoy soñando… ¡¿pero qué locura es esta?!'))}
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
          m('brais', '¿Le subes un vídeo largo y te saca los mejores trocitos, los más virales, para cada plataforma?'),
          m('iago', '¡Eso es! Y te los deja listos, con el formato de cada plataforma.')],
         '<div class="ft-shot phone"><video data-ambient muted loop playsinline preload="auto" poster="video/reel-demo.jpg"><source src="video/reel-demo.mp4" type="video/mp4"></video></div>'))

add(feat('Del concierto al disco', TAG3, 'Del concierto, al disco.',
         [m('alvaro', '¿Y la grabación entera del bolo de la Ribeira?', say='¿Y la grabación entera del bolo de la Ribeira? ¿Eso no vale para nada?'),
          m('iago', 'La subes y la IA separa las canciones de lo que hablamos con el público.', say='La subes, y la inteligencia artificial separa las canciones de lo que hablamos con el público. Y saca hasta la letra y los acordes.'),
          m('xandre', '¡Un disco en directo sin mis chistes malos! 💿', say='[laughs] ¡Un disco en vivo, sin mis chistes malos! ¡Qué genio!')],
         shot_img('img/d-h-concierto-disco.jpg')))

# ───────── Capítulo 4 · Después del concierto ─────────
add(act('Capítulo 4 · Después del concierto', 'IV', 'Capítulo 4 de 6 · Después del concierto', 'Y al final, las cuentas.',
        'Cuánto entra, cuánto sale y cuánto queda para la banda.', 'iago',
        'Lo último. Y creo que lo que más os va a sorprender.', 4, 'img/concierto-1.jpg'))

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

add(scene('Lo han visto todo', 'Sábado, 13:00 · El local de ensayo', 'Lo han visto todo.', 'img/concierto-1.jpg',
          dlg(m('alvaro', '¡¿Pero cuándo has hecho esto?! ¡Si tienes trabajo y dos hijas! 🤯'),
              m('brais', '¡Pero si tú nunca has programado nada que no fuera para tu trabajo de promociones de coches!'),
              m('iago', 'Solo un juego de scroll challenge que estaba muerto antes de llegar a la Play Store. 😅'),
              m('xandre', '¡Eres un genio, Iago! 🙌'),
              m('iago', 'Por las noches, con Claudio y Guglio.'), cls='tight') + '''
  <ul class="fin-crowd">
    <li><img src="img/miembro-brais.jpg" alt="Brais"><span>Brais</span></li>
    <li><img src="img/miembro-xandre.jpg" alt="Xandre"><span>Xandre</span></li>
    <li><img src="img/miembro-alvaro.jpg" alt="Álvaro"><span>Álvaro</span></li>
    <li><img src="img/miembro-iago.jpg" alt="Iago"><span>Iago</span></li>
  </ul>''', tr='zoom'))

add(scene('Las noches', 'Sábado, 13:02 · El local de ensayo', 'Casi siempre, de noche.', 'img/concierto-1.jpg',
          '<div class="noche-reloj" aria-hidden="true"><b>02:47</b><span>la hora a la que Iago seguía programando</span></div>' +
          dlg(m('iago', 'Casi siempre de noche, cuando las niñas ya dormían. Cerraba el portátil, las miraba un momento… y volvía a abrirlo.', '02:47',
                say='[softly] Casi siempre de noche, cuando las niñas ya dormían. Cerraba el portátil, las miraba un momento… y volvía a abrirlo.'),
              m('brais', 'Tío… no teníamos ni idea.', '02:48', say='[softly] Tío… no teníamos ni idea.'),
              m('alvaro', 'Y nosotros, quejándonos de las birras.', '02:48', say='[sighs] Y nosotros, quejándonos de las birras.'),
              m('xandre', 'Gracias, Iago. De verdad.', '02:49', say='[softly] Gracias, {bajo}. De verdad.'), cls='tight'), cls='noches', tr='fade'))

add(feat('Y mucho más', 'Sábado · 13:00 · Y mucho más', 'Y mucho más.',
         [m('iago', 'Y hay más: ensayos, armonías, eventos, reels, dossier…', say='Y esto no acaba aquí, chavales: ensayos, armonías, eventos, reels, el dossier… Todo en la misma app.'),
          m('brais', '¡Pero si no le falta de nada! 🤯', say='[gasps] ¡Ai, mi madriña! ¡Pero si no le falta de nada!')],
         shot_vid('video/v-montaje.mp4', 'video/v-montaje.jpg'), grupo='negocio'))

add(scene('Esto lo necesitan todos', 'Sábado · 13:05 · El local de ensayo', 'Y entonces, alguien lo dijo.', 'img/concierto-3.jpg',
          dlg(m('xandre', 'Iago, ¡esto es la hostia! Lo necesitan todos los grupos, todos los managers, todas las productoras.'),
              m('alvaro', '¿Y si lo vendemos? Además de dar conciertos, nos forramos ayudando a los músicos de todo el mundo. 💸'),
              m('iago', '¿En serio? ¿Creéis que esto lo podemos vender?'),
              m('brais', '¡Pero tío, te vas a forrar! Ya te estoy imaginando en Miami, con tu descapotable y de traje.'),
              m('iago', 'Si me hago rico, una buena parte irá para la banda. ¡Os Herdeiros do Código lo va a petar, chavales!'), cls='tight'), tr='zoom'))

# ───────── Capítulo 5 · Cómo lo hacemos ─────────
add(act('Capítulo 5 · Cómo lo hacemos', 'V', 'Capítulo 5 de 6 · Cómo lo hacemos', '¿Y cómo lo hacemos?',
        'A quién se lo vendemos y cómo ganamos dinero.', 'iago',
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
       m('iago', 'Aunque, con lo bien que ha quedado este TFM, igual me dan una beca. A ver si Paula lo ve y me lo regala. 🤣', say='[laughs] Aunque, mirad, con lo guapo que ha quedado este proyecto, igual me dan una beca. A ver si Paula lo ve, y me lo regala.'),
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
    <div class="biz-col"><span class="badge">B2C</span><h3>Bandas y músicos</h3><p>Una cuota por banda, de 0 a 79 € al mes</p></div>
    <div class="biz-col"><span class="badge b2b">B2B</span><h3>Managers, agencias, salas, festivales y productoras</h3><p>Los que llevan varias bandas y los que programan</p></div>
  </div>
  {dlg(m('iago', 'Dos tipos de cliente. B2C: las bandas y los músicos, o sea, nosotros. Pagan una cuota por banda.'),
       m('brais', '¿Y B2B?'),
       m('iago', 'Managers y agencias, que llevan varias bandas a la vez. Y salas, festivales y productoras, que son las que programan.'),
       m('xandre', '¿Y por qué iba a querer una sala usar esto?'),
       m('iago', 'Porque si es fácil trabajar con nosotros, contestan antes. Quien toca paga; quien programa hace que el producto funcione.'), cls='tight')}
</section>
''')

add(f'''<section class="slide scene biz" data-title="Cómo ganamos dinero" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">Cómo lo hacemos · El dinero</span>
  <h2>Y de qué vivimos.</h2>
  <div class="biz-cols">
    <div class="biz-col"><span class="badge">Construido, desactivado a propósito</span><h3>Suscripción por banda</h3><p>Cinco planes, de 0 a 79 € al mes</p></div>
    <div class="biz-col"><span class="badge b2b">Voluntaria, de momento</span><h3>Pequeña comisión por concierto</h3><p>De los conciertos que se cierran por la plataforma</p></div>
  </div>
  {dlg(m('alvaro', '¿Y de qué vivimos, entonces?'),
       m('iago', 'Dos motores. Una suscripción por banda, que ya está construida aunque la tengo desactivada a propósito. Y una pequeña comisión de cada concierto que se cierra por la plataforma.'),
       m('brais', '¿Y esa comisión cuánto es?'),
       m('iago', 'De momento, voluntaria. Si vosotros tocáis y cobráis, nosotros ganamos.'), cls='tight')}
</section>
''')

# ───────── Capítulo 6 · Por dentro ─────────
add(act('Capítulo 6 · Por dentro', 'VI', 'Capítulo 6 de 6 · Por dentro', 'Y por dentro, ¿cómo está hecho?',
        'La técnica que lo sostiene.', 'brais',
        'Vale, pero… ¿y por dentro cómo funciona todo esto?', 6, 'img/concierto-3.jpg'))

TAGT = 'Sábado · 13:40 · Por dentro'
add(f'''<section class="slide scene tech" data-title="Arquitectura" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-2.jpg)"></div>
  <span class="tag">{TAGT}</span>
  <h2>Un monolito sensato.</h2>
  {dlg(m('iago', 'Delante, React con Vite. Detrás, Express y TypeScript. Supabase guarda los datos y la IA solo vive en los bordes.'),
       m('brais', 'Pues como si me hablas en chino.'),
       m('alvaro', 'Yo no entiendo nada…'),
       m('iago', 'Yo tampoco tenía ni idea, pero desde que hice el máster de MoureDev lo entiendo casi todo. ¡Estoy flipando! Aunque casi todo esto lo ha hecho mi amigo Claudio.'), cls='tight')}
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
       m('iago', 'Se rompe el build. Un test lo vigila en cada commit, hay 22 skills y un hook que avisa cuando se toca algo sensible.'), cls='tight')}
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
    <div class="pn"><h3>SSRF y abuso</h3><p>IP validada y límites de ritmo</p></div>
    <div class="pn"><h3>Autenticación</h3><p>PBKDF2-SHA512 y sesiones que caducan</p></div>
    <div class="pn"><h3>Obra del músico</h3><p>Una ruta por banda, sin URLs predecibles</p></div>
    <div class="pn"><h3>Errores</h3><p>Panel propio y Sentry</p></div>
  </div>
</section>
''')

add(f'''<section class="slide bigstats dl" data-title="Calidad en cifras">
  <div class="hero-bg"></div>
  <span class="tag">Sábado · 13:40 · Por dentro</span>
  <h2>Un producto con tests de verdad.</h2>
  {dlg(m('alvaro', '¡Madre mía! ¡Esto tiene más tests que cuando el Covid!'),
       m('iago', 'Y se ejecutan solos: en cada commit, en cada push y en producción hay un healthcheck y Sentry.'), cls='tight')}
  <div class="bs-grid">
    <div class="bs"><b class="bs-n" data-count="270" data-suffix="k">270k</b><span>líneas de TypeScript, entre cliente y servidor</span></div>
    <div class="bs"><b class="bs-n" data-count="358">358</b><span>rutas HTTP, de las que 307 son handlers propios</span></div>
    <div class="bs"><b class="bs-n" data-count="57">57</b><span>tablas en producción con RLS, y 45 migraciones SQL</span></div>
    <div class="bs"><b class="bs-n" data-count="2172">2172</b><span>tests unitarios declarados, además de E2E y 15 capturas de regresión visual</span></div>
  </div>
  <p class="bs-foot"><i>Cifras comprobadas en el repositorio con <span class="mono">npm run verify:docs</span> el 10 de octubre de 2026.</i></p>
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
       m('brais', '¡Claro que sí! Lo probamos, mejoramos todo lo que haga falta y, en cuanto termines el máster de Marketing Digital, lo lanzamos al mundo entero.'),
       m('xandre', '¡Y dile que te busque salas en Vigo, que tengo ganas de tocar allí en las fiestas!'),
       m('iago', 'Hecho. Y con la lista de pendientes que ya tengo, no me voy a aburrir.'),
       m('alvaro', '¡Iago! ¡El móvil! ¡El Resurrección Fest acaba de abrir el dossier!', say='[gasps] ¡Iago! ¡El móvil! ¡El Resurrección Fest acaba de abrir el dossier!'),
       m('iago', 'Tres veces en una hora. Están leyendo. Y el cartel cierra… ahora.', say='Tres veces en una hora. Eso es que están leyendo. [softly] Y el cartel cierra… ahora.'), cls='tight')}
  <div class="notif" aria-hidden="true"><i>🔔</i><div><small>BandManager · ahora</small><b>Resurrección Fest ha abierto tu dossier</b><span>3 veces en la última hora</span></div></div>
  <ol class="tech-vis steps">
    <li><b>1</b><div><h3>Probarlo con una banda real</h3><p>Lead, aprobación, borrador en Gmail y respuesta</p></div></li>
    <li><b>2</b><div><h3>Reactivar el cobro</h3><p>Facturación y planes de pago</p></div></li>
    <li><b>3</b><div><h3>Vídeos de fans por QR</h3><p>El público sube su clip del directo</p></div></li>
    <li><b>4</b><div><h3>El Tricount de las giras</h3><p>Cuentas de la gira entre todos</p></div></li>
    <li><b>5</b><div><h3>Darlo a conocer</h3><p>Máster de Marketing Digital con IA</p></div></li>
  </ol>
</section>
''')

# ───────── Convergencia: el festival, la radio, el espejo y el giro ─────────
add(f'''<section class="slide scene" data-title="El festival, 02:14" data-transition="zoom">
  <div class="scene-bg" style="--bg-img:url(img/concierto-3.jpg)"></div>
  <span class="tag">Seis meses después · Sábado · 01:58 · Backstage</span>
  <h2 style="font-size:76px">Cinco minutos para salir.</h2>
  <div class="cartel" style="max-width:980px;padding:26px 40px;margin-top:22px">
    <div class="fest" style="font-size:30px">Resurrección Fest</div>
    <div class="l1" style="font-size:78px">Os Herdeiros do Código</div>
    <div class="l2" style="font-size:36px">Escenario principal · Viveiro</div>
  </div>
  {dlg(m('manager', 'Cinco minutos, chicos. El rider está en el camerino, tal y como firmamos.'),
       m('sello', 'Iago, soy Peláez. Os veo desde la mesa de mezclas. Mi oferta sigue en pie: el 30 % y los másteres.', say='Iago, soy Peláez. Os estoy viendo desde la mesa de mezclas. Mi oferta sigue en pie: el treinta por ciento, y los másteres.'),
       m('iago', 'Gracias, Peláez. Pero los másteres son nuestros. Y la gestión, también.', say='[softly] Gracias, Peláez. Pero los másteres son nuestros. Y la gestión, también.'),
       m('manager', 'Y los datos. ¡A tocar!', say='Y los datos. ¡Y ahora, a tocar!'),
       m('xandre', '¿Tengo el tono de la primera?'),
       m('iago', 'Em, en tu hoja, como siempre.'),
       m('iago', 'Escuchad ahí fuera: la app organiza, pero esto lo hacéis vosotros.', say='[softly] Escuchad ahí fuera. La app organiza, chavales. Pero esto lo hacéis vosotros.'),
       m('brais', 'Hace seis meses no sabíamos ni quién contestaba a las salas.'), cls='tight')}
</section>
''')

add(f'''<section class="slide scene" data-title="En la radio" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg)"></div>
  <span class="tag">Domingo · 09:00 · En antena</span>
  <div class="radio">
    <div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div><div class="dial">Rock FM · en directo</div><div class="head" data-who="locutor" data-say="{EXTRA_SAY['radio']}">La banda que casi se separa por problemas de gestión interna acaba tocando en el Resurrección Fest gracias a su bajista Iago y a bandmanager.io, la increíble app que ha creado y que va a revolucionar la industria musical.</div></div>
  </div>
</section>
''')

add(scene('Otro jueves, 23:47', 'Otro jueves · 23:47', 'El grupo seguía existiendo.', 'img/concierto-2.jpg',
          dlg(m('xandre', '¿Alguien ha contestado a la sala del 14?', '23:47', say=EXTRA_SAY['otro_jueves']),
              m('iago', 'Cerrao y bien cerrao, chaval. Mirad el calendario. ✅', '23:48'),
              m('alvaro', 'Y la setlist de cada uno ya está en la hoja.', '23:49'),
              m('brais', 'Entonces ensayamos el sábado. 🥁', '23:51'))))

# El giro: dos diapositivas, el punto álgido
add('''<section class="slide scene reveal" data-title="El giro: el bajista soy yo" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg);opacity:.5"></div>
  <span class="tag">Fin de la historia · Diego de la Calle</span>
  <figure class="rv-photo"><img src="img/diego-bajista.jpg" alt="Diego de la Calle tocando el bajo"><figcaption><b>Diego de la Calle</b><span>El bajista</span></figcaption></figure>
  <h2>El bajista soy yo.<br><span class="acc">Necesito volver a tocar.</span></h2>
  <p class="sub">Toqué en varios grupos. Los fui dejando uno a uno: sin organización, sin gestión y sin tiempo, no íbamos a ningún lado.</p>
  <p class="sub sub2">Hice BandManager para volver a subirme a un escenario, delante de miles de personas, y hacerlas disfrutar con nuestra música.</p>
</section>

<!--MIS-BANDAS-->
<section class="slide scene reveal dream" data-title="Un sueño hecho realidad" data-transition="fade">
  <div class="scene-bg" style="--bg-img:url(img/concierto-1.jpg);opacity:.5"></div>
  <span class="tag">Fin de la historia · Diego de la Calle</span>
  <figure class="rv-photo"><img src="img/diego-bajista.jpg" alt="Diego de la Calle tocando el bajo"><figcaption><b>Diego de la Calle</b><span>El bajista</span></figcaption></figure>
  <h2>Y ya estamos pensando en montar un grupo.</h2>
  <p class="sub">Con muchísima ilusión, y sabiendo que con BandManager.io toda la gestión va a ir rodada.</p>
  <p class="sub sub3 dream-line">Un sueño hecho realidad.</p>
</section>
''')

# Mis bandas (de verdad): fotos reales de Diego en img/historia/, en el orden de img/historia/historia.json
# [{"foto": "big-band-2015.jpg", "texto": "Big Band · 2015", "logro": "Primer concierto"}…]. Sin fotos, la escena no sale.
_hj = os.path.join(AQUI, '..', '..', 'img', 'historia', 'historia.json')
FOTOS = [f for f in (json.load(open(_hj, encoding='utf-8')) if os.path.exists(_hj) else [])
         if os.path.exists(os.path.join(AQUI, '..', '..', 'img', 'historia', f['foto']))]
if FOTOS:
    # 0,6 s por foto (el pulso de «Cabalga o Lóstrego»); las cuatro últimas, a la mitad: la rampa del final
    pasos, t = [], 0.4
    for k, f in enumerate(FOTOS):
        d = 0.6 if k < len(FOTOS) - 4 else 0.3
        pasos.append((t, d, f)); t += d
    cuerpo = ''.join(f'''<figure class="mb-foto" style="--t:{t0:.2f}s;--d:{d:.2f}s"><img src="img/historia/{f['foto']}" alt="{f.get('texto', '')}">'''
                     f'''<figcaption><b>{f.get('texto', '')}</b>{('<span>' + f['logro'] + '</span>') if f.get('logro') else ''}</figcaption></figure>'''
                     for t0, d, f in pasos)
    S[[i for i, x in enumerate(S) if 'data-title="El giro: el bajista soy yo"' in x][0]] = S[[i for i, x in enumerate(S) if 'data-title="El giro: el bajista soy yo"' in x][0]].replace(
        '<!--MIS-BANDAS-->', f'''<section class="slide mis-bandas" data-title="Mis bandas" data-transition="fade" data-dur="{int((t + 1.6) * 1000)}">
  <span class="tag" style="opacity:0">Fin de la historia · Diego de la Calle</span>
  {cuerpo}
  <p class="mb-fin" style="--t:{t:.2f}s">Y siempre, el bajo.</p>
</section>''')
else:
    S[:] = [x.replace('<!--MIS-BANDAS-->\n', '') for x in S]

# El giro final (Nolan): el reloj de toda la película no contaba para el festival
add('''<section class="slide giro-reloj" data-title="El reloj" data-transition="fade" data-dur="27500">
  <span class="tag" style="opacity:0">Fin de la historia · El reloj</span>
  <div class="gr-reloj" aria-hidden="true"><small><i class="gr-l1">CIERRE DEL CARTEL · RESURRECCIÓN FEST</i><i class="gr-l2">ENTREGA DEL TFM · THE BIG SCHOOL</i></small>
    <span class="gr-t"><i>-00:00:03</i><i>-00:00:02</i><i>-00:00:01</i><i>00:00:00</i></span></div>
  <p class="gr-c" style="--t:4.2s;--d:3.2s">¿Os habéis fijado en el reloj?</p>
  <p class="gr-c" style="--t:7.6s;--d:3s">No contaba para un festival.</p>
  <p class="gr-c" style="--t:11s;--d:2.9s">Contaba para esto.</p>
  <div class="notif" aria-hidden="true"><i>🔔</i><div><small>BandManager · ahora</small><b>Alguien está viendo tu TFM</b><span>Ahora mismo. Desde el principio.</span></div></div>
  <p class="gr-c" style="--t:14.3s;--d:3.4s">Brais: en esta historia eras el batería.</p>
  <p class="gr-c" style="--t:18s;--d:3.4s">En la de verdad, eres el festival.</p>
  <p class="gr-c gr-ask" style="--t:22s">¿Nos dejas tocar?</p>
</section>
''')

# Gracias
add(re.search(r'<section class="slide cover" data-title="Gracias".*?</section>', SRC, re.S).group(0) + '\n')

# Títulos de crédito: suben solos, como al final de una película (en modo película duran lo que tarda el rollo)
add('''<section class="slide creditos" data-title="Créditos" data-transition="fade" data-dur="82000">
  <div class="rollo">
    <p class="cr-pre">Os Herdeiros do Código en</p>
    <h2 class="cr-titulo">BandManager.io</h2>
    <p class="cr-sub">Una película de rock, código y café</p>
    <h3>Reparto</h3>
    <dl>
      <dt>{bajo}</dt><dd>{bajo:cargo} · el que nadie oye</dd>
      <dt>{bateria}</dt><dd>{bateria:cargo} · y las birras. En dos bandas, desde que lo ficharon</dd>
      <dt>{voz}</dt><dd>{voz:cargo} · la cara bonita</dd>
      <dt>{guitarra}</dt><dd>{guitarra:cargo} · y las palabrotas</dd>
      <dt>{manager}</dt><dd>Siempre al teléfono</dd>
      <dt>{voz_mop}</dt><dd>El rival. Y luego, el amigo</dd>
      <dt>{sello}</dt><dd>Discos Cuarzo · quería los másteres</dd>
      <dt>{ia_claude}</dt><dd>Claude Code · el que discute</dd>
      <dt>{ia_gemini}</dt><dd>Gemini · el que también discute</dd>
      <dt>{locutor}</dt><dd>En directo</dd>
    </dl>
    <h3>Escrita, programada y dirigida por</h3>
    <p class="cr-nombre">Diego de la Calle</p>
    <div class="solo-largo">
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
      <dt>Mánagements y sellos</dt><dd>Los que llevan varias bandas</dd>
      <dt>Ayuntamientos</dt><dd>Fiestas patronales y programación municipal</dd>
      <dt>Grupos amigos</dt><dd>Cartel doble con Date Swap</dd>
    </dl>
    <h3>Los que escuchan</h3>
    <dl class="cr-dl">
      <dt>Fans</dt><dd>Entran por QR y dejan su correo, con su consentimiento</dd>
      <dt>Donantes</dt><dd>Apoyan a la banda con Stripe</dd>
      <dt>Músicos en lista de espera</dt><dd>Los próximos Herdeiros</dd>
    </dl>
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
    <h2 class="cr-seccion">Departamentos técnicos</h2>
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
    <h3>Comunicaciones</h3>
    <dl class="cr-dl">
      <dt>Gmail API</dt><dd>Borradores y bandeja de entrada</dd>
      <dt>SMTP e IMAP</dt><dd>Para los que no usan Gmail</dd>
      <dt>Resend</dt><dd>Correos de la plataforma</dd>
      <dt>Web Push</dt><dd>Avisos en el móvil</dd>
    </dl>
    <h3>Dinero, datos y nube</h3>
    <dl class="cr-dl">
      <dt>Stripe</dt><dd>Planes y donaciones</dd>
      <dt>Supabase</dt><dd>Base de datos, archivos y seguridad por banda</dd>
      <dt>Firebase</dt><dd>Entrar con Google</dd>
      <dt>Railway</dt><dd>Donde vive la aplicación</dd>
      <dt>Sentry</dt><dd>Vigila los errores</dd>
    </dl>
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
            m('alvaro', '¡Pues que lo pague la IA! 🤘', '03:13', say='[shouts] ¡Pues que las pague la inteligencia artificial! ¡Rocanrol!'),
            m('brais', 'Por cierto, mañana ensayo con Master of Prompts. ¿A qué hora era?', '03:14', say='[sighs] Por cierto, mañana ensayo con Máster of Prompts. ¿A qué hora era?'),
            m('iago', 'Mira el calendario, Brais.', '03:14', say='Mira el calendario, {bateria}. Mira el calendario.')) + '''
</section>
''')

html = head + '\n\n' + '\n'.join(S) + '\n' + tail
html = html.replace('<script src="sound.js"></script>', '<script src="reparto.js"></script>\n<script src="sound.js"></script>\n<script src="voces.js"></script>\n<script src="cine.js"></script>')
for k, r, say in (('brais', 'bateria', EXTRA_SAY['cast_bateria']), ('xandre', 'voz', EXTRA_SAY['cast_voz']),
                  ('alvaro', 'guitarra', EXTRA_SAY['cast_guitarra']), ('iago', 'bajo', EXTRA_SAY['cast_bajo'])):
    html = html.replace(f'<figure><img src="img/miembro-{k}.jpg"', f'<figure data-who="{r}" data-say="{say}"><img src="img/miembro-{k}.jpg"', 1)
CORTO = ['Tráiler', 'Prólogo · Jueves, 23:47', 'Prólogo · La llamada', 'Prólogo · La decisión', 'La IA escribe, tú apruebas', 'Cambio de perfil',
         'Iris separa los instrumentos', 'Choques en el calendario', 'Las noches', 'El festival, 02:14', 'En la radio', 'El giro: el bajista soy yo',
         'Un sueño hecho realidad', 'El reloj', 'Gracias', 'Créditos']
if FOTOS:
    CORTO.insert(CORTO.index('Un sueño hecho realidad'), 'Mis bandas')
for t in CORTO:
    n = html.count(f'data-title="{t}"')
    assert n == 1, (t, n)
    html = html.replace(f'data-title="{t}"', f'data-title="{t}" data-corto', 1)
html = html.replace('data-title="Créditos" data-corto', 'data-title="Créditos" data-corto data-dur-corto="33000"', 1)
html = html.replace('data-title="Y mucho más"', 'data-title="Y mucho más" data-min="19500"', 1)
html = html.replace('<table class="sheet">', '<table class="sheet" data-who="guitarra" data-say="' + EXTRA_SAY['excel'] + '">', 1)
html = html.replace('<div class="rm-say">', '<div class="rm-say" data-who="bajo" data-say="' + EXTRA_SAY['sala'] + '">', 1)
html = html.replace('<div class="react wow"><img src="img/miembro-brais.jpg"', '<div class="react wow" data-who="bateria" data-say="' + EXTRA_SAY['react'] + '"><img src="img/miembro-brais.jpg"', 1)
html = html.replace('<button class="hb sec" id="bSound"', '<button class="hb sec" id="bPeli" title="Modo película: avanza solo (P)" aria-pressed="false">Película</button>\n  <button class="hb sec" id="bVoces" title="Voces de la banda (V)" aria-pressed="true">Voces</button>\n  <button class="hb sec" id="bSound"', 1)
html = html.replace('F para pantalla completa · M para el sonido', 'F para pantalla completa · M para el sonido · V para las voces')
html = html.replace('T tema · F pantalla completa</div>', 'T tema · F pantalla completa · V voces · P película</div>')
html = html.replace('>Empezar con sonido</button>', '>Empezar con sonido y voces</button>')
html = html.replace('<button id="gateSound" class="gate-btn primary">Empezar con sonido y voces</button>', '<button id="gatePeli" class="gate-btn primary">🎬 Ver como película</button>\n      <button id="gateSound" class="gate-btn">Empezar con sonido y voces</button>', 1)
# Pantalla de entrada a lo plataforma de cine: cartel, sinopsis y «Reproducir»
i0 = html.index('<div id="gate"'); i1 = html.index('<div id="prog">')
html = html[:i0] + '''<div id="gate" role="dialog" aria-modal="true" aria-label="Empezar la película">
  <div class="nx-bg" style="--img:url(img/concierto-2.jpg)"></div>
  <div class="nx-top"><span class="nx-logo">BANDMANAGER</span><span class="nx-orig">ORIGINALS</span></div>
  <div class="nx-hero">
    <div class="nx-sello"><i>B</i> PELÍCULA ORIGINAL</div>
    <h1 class="nx-titulo">Os Herdeiros<br>do Código</h1>
    <div class="nx-meta"><span>2026</span><span class="nx-edad">+12</span><span>15 min</span><span>HD</span><span>Español</span><span class="nx-cc">CC</span></div>
    <p class="nx-gen">Comedia · Rock · Tecnología · Basada en hechos casi reales</p>
    <p class="nx-sin">Una banda a punto de separarse. Un bajista con un portátil y hasta el sábado. Y una aplicación que ni él se cree que haya hecho.</p>
    <div class="gate-btns">
      <button id="gatePeli" class="gate-btn primary">▶ Reproducir</button>
      <button id="gateCorto" class="gate-btn">Corte de 5 min</button>
      <button id="gateSound" class="gate-btn">Ver como presentación</button>
      <button id="gateSilent" class="gate-btn">Sin sonido</button>
    </div>
    <div class="gate-note">TFM · Máster de Desarrollo con IA · The Big School by Brais Moure — F pantalla completa · espacio pausa · C subtítulos</div>
  </div>
</div>
''' + html[i1:]
# ───────── Montaje: cómo se entra en cada plano (deck.js) y qué música suena (cine.js) ─────────
# j: se oye antes de verse · l: la voz del plano anterior sigue sobre este · rampa: rampa de velocidad con golpe en el pulso
# golpe: corte seco · negro: fundido a negro (saltos de tiempo, capítulos) · fundido: encadenado
CORTES = {
    'Prólogo · La banda': 'negro', 'Prólogo · Jueves, 23:47': 'negro', 'Prólogo · La llamada': 'golpe', 'Prólogo · La hoja de cálculo': 'j',
    'Prólogo · La decisión': 'l', 'Prólogo · El sábado en el local': 'fundido', 'Prólogo · Sábado, 11:00 en el local': 'j',
    'Todas las salas, en un sitio': 'rampa', 'La IA escribe, tú apruebas': 'j', 'Date Swap': 'rampa', 'Cambio de perfil': 'l',
    'Bandas amigas': 'rampa', 'El acuerdo, firmado desde BandManager': 'j', 'La sala contestó': 'negro',
    'Una hoja para cada músico': 'rampa', 'La curva de energía': 'j', 'Los acordes pasan solos': 'rampa', 'El profesor de armonía': 'l',
    'Iris separa los instrumentos': 'rampa', 'Las ideas, en su sitio': 'j', 'Calendario de la banda': 'rampa', 'La ficha del bolo': 'j',
    'Choques en el calendario': 'l', 'El dossier de la banda': 'rampa', 'Un QR y el público se hace fan': 'j', 'Merchan en un minuto': 'rampa',
    'Del directo al reel': 'j', 'Del concierto al disco': 'rampa', 'Cuánto entra y cuánto queda': 'rampa', 'La gira, con gasolina y todo': 'j',
    'Lo han visto todo': 'golpe', 'Las noches': 'l', 'Y mucho más': 'rampa', 'Esto lo necesitan todos': 'j',
    'Para darlo a conocer': 'rampa', 'A quién se lo vendemos': 'j', 'Cómo ganamos dinero': 'j', 'Arquitectura': 'rampa',
    'El mapa que lee la IA': 'j', 'Cómo se construyó con IA': 'rampa', 'Seguridad': 'j', 'Calidad en cifras': 'rampa', 'Qué viene': 'j',
    'El festival, 02:14': 'negro', 'En la radio': 'j', 'Otro jueves, 23:47': 'fundido', 'El giro: el bajista soy yo': 'negro',
    'Mis bandas': 'golpe', 'Un sueño hecho realidad': 'fundido', 'El reloj': 'golpe', 'Gracias': 'negro', 'Créditos': 'negro', 'Escena post-créditos': 'negro',
}
# La música cambia en estas escenas y sigue hasta el próximo cambio («-» = silencio)
MUSICA = {'Tráiler': '-', 'Prólogo · La banda': 'tension', 'Capítulo 1 · Conseguir el bolo': 'tema', 'Las noches': 'noches', 'Y mucho más': 'tema',
          'Qué viene': 'tension', 'El festival, 02:14': 'lostrego', 'Otro jueves, 23:47': 'noches', 'Mis bandas': 'lostrego', 'Un sueño hecho realidad': 'noches', 'El reloj': '-', 'Gracias': 'lostrego',
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

open(os.path.join(AQUI, '..', '..', 'index.html'), 'w', encoding='utf-8').write(html)
print('slides', html.count('<section class="slide'))
