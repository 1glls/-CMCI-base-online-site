"""Icones du site (onglet, ecran d'accueil) a partir du logo sombre detoure
(public/cmci-logo-dark.png : arc or, medaillon, drapeau), fond transparent.

usage: python3 make_icons.py <cmci-logo-dark.png> <dossier public>"""
import sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
logo = Image.open(src).convert('RGBA')
logo = logo.crop(logo.getbbox())

def square(size, background=None, margin=0.02):
    """Logo centre dans un carre ; fond transparent sauf si `background`."""
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    inner = int(size * (1 - 2 * margin))
    ratio = min(inner / logo.width, inner / logo.height)
    resized = logo.resize((max(1, int(logo.width * ratio)), max(1, int(logo.height * ratio))), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas

# Onglet du navigateur : transparent, plusieurs tailles dans un seul .ico
square(256).save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
square(512).save(f'{out}/icon.png', optimize=True)
# iOS remplit la transparence en noir ou blanc : fond nuit explicite
square(180, background=(11, 10, 8, 255), margin=0.1).save(f'{out}/apple-icon.png', optimize=True)
print('ok')
