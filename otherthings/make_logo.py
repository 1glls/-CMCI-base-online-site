"""Detoure le logo CMCI (fond blanc) et produit une variante or/ivoire pour fonds sombres.
usage: python3 make_logo.py <source.png> <out_dir>"""
import sys, colorsys
from collections import deque
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()

# Zones en coordonnees source. Le globe garde ses couleurs ; l'anneau blanc
# qui l'entoure aussi (mais pas l'arc bleu qui le longe) ; le livre aussi.
CX, CY = 172, 150
R_GLOBE, R_RING = 88, 96
BOOK = (125, 185, 255, 222)
# Garder le noir : lettres « B E » du ruban et bande noire du drapeau belge
KEEP_DARK = [(92, 226, 140, 254), (245, 188, 304, 224)]
inside = lambda box, x, y: box[0] <= x <= box[2] and box[1] <= y <= box[3]
def keep_dark(x, y): return any(inside(b, x, y) for b in KEEP_DARK)
def protected(x, y, p):
    d2 = (x - CX) ** 2 + (y - CY) ** 2
    if d2 <= R_GLOBE ** 2 or inside(BOOK, x, y): return True
    return d2 <= R_RING ** 2 and min(p[0], p[1], p[2]) >= 200

# 1. Fond : remplissage depuis les bords sur les pixels quasi blancs
WHITE = 205
def whiteish(p): return min(p[0], p[1], p[2]) >= WHITE
def free(x, y): return whiteish(px[x, y]) and not protected(x, y, px[x, y])
bg = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if free(x, y): bg[y][x] = True; q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if free(x, y) and not bg[y][x]: bg[y][x] = True; q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and free(nx, ny):
            bg[ny][nx] = True; q.append((nx, ny))

# 2. Alpha doux sur la frange + retrait du halo blanc (de-premultiplication)
cut = Image.new('RGBA', (w, h))
cp = cut.load()
for y in range(h):
    for x in range(w):
        r, g, b, _ = px[x, y]
        if bg[y][x]:
            m = min(r, g, b)
            a = max(0.0, min(1.0, (255 - m) / (255 - WHITE)))
            if a < 0.04:
                cp[x, y] = (0, 0, 0, 0); continue
            un = lambda c: int(max(0, min(255, (c - 255 * (1 - a)) / a)))
            cp[x, y] = (un(r), un(g), un(b), int(a * 255))
        else:
            cp[x, y] = (r, g, b, 255)

box = cut.getbbox()
cut = cut.crop(box)
pad = 6
light = Image.new('RGBA', (cut.width + 2 * pad, cut.height + 2 * pad))
light.paste(cut, (pad, pad))
light.save(f'{out}/cmci-logo-light.png', optimize=True)

# 3. Variante sombre : bleus -> or, neutres sombres -> ivoire, le reste intact
GOLD_DARK, GOLD_LIGHT, IVORY = (122, 88, 22), (248, 222, 150), (244, 236, 216)
lerp = lambda a, b, t: tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
dark = light.copy()
dp = dark.load()
src_px = Image.open(src).convert('RGB').load()
for y in range(dark.height):
    for x in range(dark.width):
        r, g, b, a = dp[x, y]
        if a == 0: continue
        sx, sy = x - pad + box[0], y - pad + box[1]
        if protected(sx, sy, src_px[sx, sy]): continue
        hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        deg = hh * 360
        if s >= 0.22 and 165 <= deg <= 265:          # bleus / cyans
            t = min(1.0, max(0.0, (v - 0.15) / 0.85)) ** 0.85
            dp[x, y] = (*lerp(GOLD_DARK, GOLD_LIGHT, t), a)
        elif s < 0.22 and v < 0.55 and not keep_dark(sx, sy):  # textes et contours sombres
            dp[x, y] = (*IVORY, a)
dark.save(f'{out}/cmci-logo-dark.png', optimize=True)

# 4. Planches de controle
for name, img in (('light', light), ('dark', dark)):
    for bgname, col in (('ivory', (246, 241, 231)), ('black', (11, 10, 8))):
        sheet = Image.new('RGBA', img.size, col + (255,))
        sheet.alpha_composite(img)
        sheet.convert('RGB').save(f'{out}/check-{name}-on-{bgname}.png')
print('ok', light.size)
