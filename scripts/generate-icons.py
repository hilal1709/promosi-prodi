"""
Menghasilkan ikon PWA (public/icons/*) untuk SISFOR UISI: Pilih Jalurmu.
Desain sederhana: kotak biru navy (brand) dengan monogram "SI" emas,
dilengkapi versi maskable (safe-zone) sesuai spesifikasi PWA.
Jalankan: python3 scripts/generate-icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

NAVY = (11, 42, 74, 255)
NAVY_DARK = (6, 26, 48, 255)
GOLD = (242, 177, 52, 255)
WHITE = (255, 255, 255, 255)

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def rounded_bg(size, radius_ratio=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * radius_ratio)
    # gradient navy -> navy dark, simple vertical
    for y in range(size):
        t = y / size
        r = int(NAVY[0] + (NAVY_DARK[0] - NAVY[0]) * t)
        g = int(NAVY[1] + (NAVY_DARK[1] - NAVY[1]) * t)
        b = int(NAVY[2] + (NAVY_DARK[2] - NAVY[2]) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def draw_monogram(img, size, scale=0.5):
    draw = ImageDraw.Draw(img)
    font_size = int(size * scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "SI"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=GOLD)
    # aksen garis kecil di bawah monogram
    line_w = size * 0.28
    line_y = y + th + size * 0.06
    draw.rounded_rectangle(
        [(size - line_w) / 2, line_y, (size + line_w) / 2, line_y + size * 0.025],
        radius=size * 0.02,
        fill=WHITE,
    )
    return img


def make_icon(size, filename, maskable=False):
    if maskable:
        # safe zone: konten inti harus dalam 80% lingkaran tengah -> beri padding lebih
        img = rounded_bg(size, radius_ratio=0)  # maskable: bg penuh, tanpa rounded (OS yg crop)
        draw_monogram(img, size, scale=0.38)
    else:
        img = rounded_bg(size)
        draw_monogram(img, size, scale=0.46)
    img.save(os.path.join(OUT_DIR, filename))
    print("saved", filename)


make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(512, "icon-maskable-512.png", maskable=True)
make_icon(180, "apple-touch-icon.png")

print("Selesai. Ikon tersimpan di public/icons/")
