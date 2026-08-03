#!/usr/bin/env python3
"""给所有 HTML 注入统一的 SEO / Open Graph / JSON-LD 标签。"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://lokeily.github.io/dianguard-site"

PAGES = {
    "index.html": {
        "title": "地震哨兵 Dianguard — 私人地震预警哨兵",
        "desc": "地震哨兵是一款面向中国大陆用户的 Android 地震预警应用，在破坏性 S 波到达前以全屏倒计时 + 真实大陆预警语音告警。多源去单点，下载到的永远是最新版。",
        "path": "",
    },
    "features.html": {
        "title": "功能详解 — 地震哨兵 Dianguard",
        "desc": "地震哨兵的完整功能说明：全屏倒计时告警、四级预警体系、真实大陆预警语音、多源冗余、烈度阈值、模拟演练、历史记录、深色省电与隐私策略。",
        "path": "features.html",
    },
    "how.html": {
        "title": "技术原理 — 地震哨兵 Dianguard",
        "desc": "地震哨兵如何为你争取那几秒：P 波与 S 波传播、预警时间轴、汪素云等（2000）烈度衰减公式、多源数据流架构、预警盲区与触发决策流程。",
        "path": "how.html",
    },
    "changelog.html": {
        "title": "版本更新 — 地震哨兵 Dianguard",
        "desc": "地震哨兵 Dianguard 的版本更新记录。本站下载按钮实时指向最新 Release，你下载到的永远是最新版。",
        "path": "changelog.html",
    },
    "disclaimer.html": {
        "title": "免责声明与用户协议 — 地震哨兵 Dianguard",
        "desc": "地震哨兵 Dianguard 的免责声明与用户协议。地震预警涉及生命安全，请以官方预警渠道为准。",
        "path": "disclaimer.html",
    },
}

LD = """
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "地震哨兵 Dianguard",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "softwareVersion": "v1.2.0",
    "downloadUrl": "https://github.com/Lokeily/Earthquake-Sentinel/releases/latest",
    "codeRepository": "https://github.com/Lokeily/Earthquake-Sentinel",
    "author": {
      "@type": "Organization",
      "name": "Lokeily"
    }
  }
  </script>
""".strip()


def seo_block(path, title, desc):
    url = BASE + ("/" + path if path else "/")
    return f"""  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#050508">
  <meta name="color-scheme" content="dark">
  <link rel="icon" type="image/png" href="assets/ic_launcher.png">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="地震哨兵 Dianguard">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}/assets/og-cover.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{BASE}/assets/og-cover.png">
  <link rel="stylesheet" href="styles.css">
  {LD}
"""



def main():
    for filename, cfg in PAGES.items():
        p = os.path.join(ROOT, filename)
        with open(p, "r", encoding="utf-8") as f:
            html = f.read()

        # 删除已有的 JSON-LD，后面会重新统一注入
        html = re.sub(r"\s*<script type=\"application/ld\+json\"[^>]*>.*?</script>\s*", "\n", html, flags=re.S)

        # 替换 <head> 开头到 </head> 前的内容
        def repl(m):
            block = seo_block(cfg["path"], cfg["title"], cfg["desc"])
            return "<head>\n" + block + "</head>"

        new_html = re.sub(r"<head>\s*.*?</head>", repl, html, count=1, flags=re.S)

        with open(p, "w", encoding="utf-8") as f:
            f.write(new_html)
        print("注入完成:", filename)


if __name__ == "__main__":
    main()
