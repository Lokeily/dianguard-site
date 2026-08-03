#!/usr/bin/env python3
"""
生成社交分享卡片 assets/og-cover.png（1200x630）。

微信、QQ、Twitter 等平台抓取 og:image 时需要 1200x630 左右的横图，
直接用 192x192 的应用图标会被裁成一小块或干脆不显示。

用法：python3 tools/make-og-image.py
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "og-cover.png")
ICON = os.path.join(ROOT, "assets", "ic_launcher.png")

W, H = 1200, 630
BG = (5, 5, 8)
BLUE = (10, 132, 255)
RED = (255, 59, 48)

FONT_CANDIDATES = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
]


def font(size, index=0):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                continue
    return ImageFont.load_default()


def radial(size, color, alpha):
    """生成一团柔和的径向光晕，用来模拟站点的极光背景。"""
    d = size * 2
    layer = Image.new("L", (d, d), 0)
    dr = ImageDraw.Draw(layer)
    steps = 60
    for i in range(steps, 0, -1):
        r = int(d / 2 * i / steps)
        a = int(alpha * (1 - i / steps) ** 1.7)
        dr.ellipse([d / 2 - r, d / 2 - r, d / 2 + r, d / 2 + r], fill=a)
    layer = layer.filter(ImageFilter.GaussianBlur(d / 14))
    tint = Image.new("RGB", (d, d), color)
    return tint, layer


def main():
    img = Image.new("RGB", (W, H), BG)

    # 极光光晕：左上偏蓝、右下偏红，与站点主视觉一致
    for cx, cy, size, color, alpha in [
        (170, 90, 430, BLUE, 130),
        (1080, 600, 400, RED, 96),
        (640, 330, 520, (40, 60, 120), 52),
    ]:
        tint, mask = radial(size, color, alpha)
        img.paste(tint, (cx - tint.width // 2, cy - tint.height // 2), mask)

    draw = ImageDraw.Draw(img, "RGBA")

    # 地震波纹线条
    for idx in range(7):
        y0 = 120 + idx * 74
        amp = 13 + idx * 3.0
        wl = 250 + idx * 46
        col = RED if idx % 3 == 2 else BLUE
        alpha = 34 if idx % 3 == 2 else 26
        pts = []
        for x in range(0, W + 8, 8):
            pts.append((x, y0 + math.sin(x / wl * math.pi * 2 + idx) * amp))
        draw.line(pts, fill=col + (alpha,), width=2)

    # 应用图标（带蓝色柔光）
    if os.path.exists(ICON):
        icon = Image.open(ICON).convert("RGBA").resize((132, 132), Image.LANCZOS)
        glow = Image.new("RGBA", (220, 220), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([20, 20, 200, 200], fill=BLUE + (70,))
        glow = glow.filter(ImageFilter.GaussianBlur(30))
        img.paste(glow, (78 - 44, 96 - 44), glow)
        img.paste(icon, (78, 96), icon)

    # 主标题
    draw.text((236, 104), "地震哨兵", font=font(60), fill=(244, 244, 247))
    draw.text((236, 178), "Dianguard", font=font(31), fill=(139, 139, 150))

    # 主张
    draw.text((78, 292), "把一台旧手机，", font=font(50), fill=(244, 244, 247))
    draw.text((78, 360), "变成守护家人的地震预警哨兵。", font=font(50), fill=(244, 244, 247))

    # 副说明
    draw.text(
        (78, 446),
        "在破坏性 S 波抵达前，全屏倒计时 + 真实大陆预警语音告警",
        font=font(25),
        fill=(160, 160, 172),
    )

    # 底部特性标签
    x = 78
    for label, color in [
        ("多源冗余", BLUE),
        ("四级预警", (255, 149, 0)),
        ("开源免费", (52, 199, 89)),
        ("无广告无埋点", (175, 82, 222)),
    ]:
        f = font(23)
        tw = draw.textlength(label, font=f)
        draw.rounded_rectangle(
            [x, 512, x + tw + 36, 562], radius=25,
            fill=color + (26,), outline=color + (92,), width=1,
        )
        draw.text((x + 18, 524), label, font=f, fill=color)
        x += tw + 36 + 14

    # 右下角站点地址
    f = font(21)
    url = "lokeily.github.io/dianguard-site"
    draw.text((W - 78 - draw.textlength(url, font=f), 536), url,
              font=f, fill=(105, 105, 118))

    # 顶部高光描边
    draw.line([(0, 0), (W, 0)], fill=(255, 255, 255, 18), width=2)

    img.save(OUT, "PNG", optimize=True)
    print("已生成 %s (%dx%d, %.0f KB)" % (OUT, W, H, os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
