#!/usr/bin/env python3
"""Assemble index.html from src/shell/*.html and src/chapters/*.html.

Chapters are included in filename order (00-hero, 10-origins, ...).
Each chapter partial may declare extra assets in an HTML comment on its
first line:  <!-- css: chapters/aero.css  js: chapters/aero.js -->
Those are linked in <head> (css) and before </body> (js, deferred).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"


def main() -> int:
    shell = (SRC / "shell" / "page.html").read_text(encoding="utf-8")
    chapters = sorted((SRC / "chapters").glob("*.html"))
    css, js, body = [], [], []
    for path in chapters:
        text = path.read_text(encoding="utf-8")
        m = re.match(r"\s*<!--\s*(.*?)\s*-->", text)
        if m and ("css:" in m.group(1) or "js:" in m.group(1)):
            for key, bucket in (("css", css), ("js", js)):
                for ref in re.findall(rf"{key}:\s*([^\s]+)", m.group(1)):
                    if ref not in bucket:
                        bucket.append(ref)
            text = text[m.end():]
        body.append(f"<!-- {path.name} -->\n{text.strip()}\n")
    out = (
        shell.replace("<!--CHAPTER_CSS-->", "\n".join(f'<link rel="stylesheet" href="assets/css/{c}">' for c in css))
        .replace("<!--CHAPTER_JS-->", "\n".join(f'<script defer src="assets/js/{j}"></script>' for j in js))
        .replace("<!--CHAPTERS-->", "\n".join(body))
    )
    (ROOT / "index.html").write_text(out, encoding="utf-8")
    print(f"index.html: {len(chapters)} chapters, {len(css)} chapter css, {len(js)} chapter js")
    return 0


if __name__ == "__main__":
    sys.exit(main())
