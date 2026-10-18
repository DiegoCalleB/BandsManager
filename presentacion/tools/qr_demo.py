"""Genera los QR de la película (eleccion.js y escenas): por defecto img/qr-demo.png (logo de Bakandeya en el centro).

    python3 presentacion/tools/qr_demo.py [URL]      # por defecto, https://bandmanager.io
    python3 presentacion/tools/qr_demo.py --hdc URL   # img/qr-fans.png: el QR de fans de Os Herdeiros (logo de la banda), el único que escanea Brais
    python3 presentacion/tools/qr_demo.py --bm        # img/qr-bm.png: el QR de BandManager (logo de la app en el centro), para el «Powered by»

Corrección de errores H (30 %), para que el logo del centro no impida leerlo. Necesita `pip install segno pillow`.
Cuando exista la banda de demo, pasa su dirección y cambia DEMO_URL en eleccion.js: tienen que coincidir.
"""
import io, os, sys
import segno
from PIL import Image, ImageDraw

AQUI = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.dirname(AQUI)
LOGO = os.path.join(DECK, '..', 'src', 'assets', 'images', 'logo_bakandeya_cropped_1786049557609.jpg')
BM = '--bm' in sys.argv
HDC = '--hdc' in sys.argv
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
URL = ARGS[0] if ARGS else 'https://bandmanager.io'


def main():
    buf = io.BytesIO()
    segno.make(URL, error='h', boost_error=False).save(buf, kind='png', scale=24, border=3, dark='#0b0b0f', light='#ffffff')
    qr = Image.open(buf).convert('RGB')
    W = qr.size[0]
    if HDC:
        logo = Image.open(os.path.join(DECK, 'img', 'logo-hdc.png')).convert('RGBA')
        fondo = Image.new('RGB', logo.size, 'white'); fondo.paste(logo, mask=logo.split()[3]); logo = fondo
    elif BM:
        logo = Image.open(os.path.join(DECK, 'img', 'logo.png')).convert('RGBA')
        fondo = Image.new('RGB', logo.size, 'white'); fondo.paste(logo, mask=logo.split()[3]); logo = fondo
    else:
        logo = Image.open(LOGO).convert('RGB').crop((215, 60, 810, 700))      # solo la llama (sin el texto)
    lado = int(W * 0.26)
    logo.thumbnail((lado, lado))
    placa = Image.new('RGB', (lado + 36, lado + 36), 'white')
    ImageDraw.Draw(placa).rounded_rectangle((0, 0, placa.size[0] - 1, placa.size[1] - 1), radius=26, outline='#0b0b0f', width=4, fill='white')
    placa.paste(logo, ((placa.size[0] - logo.size[0]) // 2, (placa.size[1] - logo.size[1]) // 2))
    qr.paste(placa, ((W - placa.size[0]) // 2, (W - placa.size[1]) // 2))
    salida = os.path.join(DECK, 'img', 'qr-fans.png' if HDC else 'qr-bm.png' if BM else 'qr-demo.png')
    qr.save(salida, optimize=True)
    print(f'{os.path.relpath(salida, DECK)}  {qr.size}  ->  {URL}')


if __name__ == '__main__':
    main()
