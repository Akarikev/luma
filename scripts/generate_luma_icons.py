#!/usr/bin/env python3
"""
Generate Luma mascot PNGs — oval tamagotchi body (companion proportions), pill mouth, lighter fills for tray.
Run: python3 scripts/generate_luma_icons.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "src-tauri" / "icons"
SRC = 128


def hex_rgba(h: str, a: int = 255) -> tuple[int, int, int, int]:
    h = h.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (r, g, b, a)


def draw_mascot(variant: str, size: int, *, with_shine: bool) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)

    # Brighter bodies so tray/dock icons don’t sink into dark themes
    palettes = {
        "idle": {
            "body": "#343840",
            "rim": "#64748b",
            "eye": "#f8fafc",
            "mouth": "#94a3b8",
            "shine": (255, 255, 255, 55),
        },
        "focus": {
            "body": "#3a2d58",
            "rim": "#a78bfa",
            "eye": "#faf5ff",
            "mouth": "#c4b5fd",
            "shine": (237, 233, 254, 70),
        },
        "break": {
            "body": "#4f3f24",
            "rim": "#fbbf24",
            "eye": "#fffbeb",
            "mouth": "#fcd34d",
            "shine": (254, 249, 195, 65),
        },
    }
    p = palettes[variant]

    cx, cy = size // 2, int(size * 52 / 128)
    # Horizontal oval like companion face 72×56 → wider than tall
    rx = int(size * 46 / 128)
    ry = int(size * 36 / 128)
    stroke = max(2, size // 26)

    dr.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=hex_rgba(p["body"]),
        outline=hex_rgba(p["rim"]),
        width=stroke,
    )

    if with_shine:
        sx = cx - rx + size // 14
        sy = cy - ry + size // 8
        dr.ellipse(
            [sx, sy, sx + size // 5, sy + size // 5],
            fill=p["shine"],
        )

    # Vertical oval eyes (companion ~9×11 on 72px wide → scale)
    eye_cy = cy - int(size * 8 / 128)
    rex = max(3, int(size * 8 / 128))
    rey = max(4, int(size * 11 / 128))
    lx = cx - int(size * 18 / 128)
    rx_ = cx + int(size * 18 / 128)
    dr.ellipse(
        [lx - rex, eye_cy - rey, lx + rex, eye_cy + rey],
        fill=hex_rgba(p["eye"]),
    )
    dr.ellipse(
        [rx_ - rex, eye_cy - rey, rx_ + rex, eye_cy + rey],
        fill=hex_rgba(p["eye"]),
    )

    # Pill mouth — inside the oval body, not below it
    mw = int(size * 22 / 128)
    mh = max(4, int(size * 9 / 128))
    mx = cx - mw // 2
    my = cy + int(size * 10 / 128)
    rad = mh // 2
    dr.rounded_rectangle(
        [mx, my, mx + mw, my + mh],
        radius=rad,
        fill=hex_rgba(p["mouth"]),
    )

    return im


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)

    for name, key in [
        ("tray-idle", "idle"),
        ("tray-focus", "focus"),
        ("tray-break", "break"),
    ]:
        src = draw_mascot(key, SRC, with_shine=False)
        src.resize((48, 48), Image.Resampling.LANCZOS).save(
            ICONS / f"{name}.png", format="PNG"
        )
        print(f"wrote {name}.png (48×48)")

    hi = draw_mascot("focus", SRC, with_shine=True)
    hi.resize((256, 256), Image.Resampling.LANCZOS).save(ICONS / "icon.png", format="PNG")
    hi.resize((32, 32), Image.Resampling.LANCZOS).save(ICONS / "32x32.png", format="PNG")
    hi.resize((128, 128), Image.Resampling.LANCZOS).save(
        ICONS / "128x128.png", format="PNG"
    )
    hi.resize((256, 256), Image.Resampling.LANCZOS).save(
        ICONS / "128x128@2x.png", format="PNG"
    )
    print("updated icon.png, 32x32.png, 128x128.png, 128x128@2x.png")


if __name__ == "__main__":
    main()
