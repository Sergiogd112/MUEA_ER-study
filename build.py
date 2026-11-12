"""Build the static study site into _site/.

Pages are HTML fragments in src/pages/*.html with a small header block:

    <!--meta
    title: Barras 1D
    nav: 2
    short: Barras 1D
    -->
    ...content...

The layout (src/layout.html) adds <head>, navigation, KaTeX and the scripts. The quiz bank is
generated from quiz/bank.py (answers of numeric questions are computed there, not typed).
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC, OUT = ROOT / "src", ROOT / "_site"


def parse(page: Path):
    text = page.read_text(encoding="utf-8")
    m = re.match(r"<!--meta\n(.*?)\n-->\n", text, re.S)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def video_html(m):
    """Embed assets/video/<id>.mp4 (+ .vtt subtitles) if the file exists; otherwise drop the slot."""
    vid = m.group(1)
    mp4 = SRC / "assets" / "video" / f"{vid}.mp4"
    if not mp4.exists():
        return ""
    vtt = mp4.with_suffix(".vtt")
    track = f'<track kind="subtitles" srclang="es" label="Español" src="assets/video/{vid}.vtt" default>' if vtt.exists() else ""
    mb = mp4.stat().st_size / 1e6
    poster = f' poster="assets/video/{vid}.jpg"' if mp4.with_suffix(".jpg").exists() else ""
    return (f'<div class="video-card"><video controls preload="metadata" playsinline{poster} src="assets/video/{vid}.mp4">{track}</video>'
            f'<p class="meta">Vídeo del tema (narración en español, subtítulos incluidos, {mb:.0f} MB).</p></div>')


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(SRC / "assets", OUT / "assets")
    # quiz bank -> JSON
    subprocess.run([sys.executable, str(ROOT / "quiz" / "bank.py"), str(OUT / "assets" / "quiz.json")], check=True)

    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    pages = []
    for p in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(p)
        pages.append((p.stem, meta, body))
    navitems = sorted([(int(m.get("nav", 99)), stem, m) for stem, m, _ in pages if "nav" in m])

    for stem, meta, body in pages:
        nav = []
        for _, s, m in navitems:
            cls = ' class="active" aria-current="page"' if s == stem else ""
            topic = f' data-topic="{m["topic"]}"' if "topic" in m else ""
            nav.append(f'<li><a href="{s}.html"{cls}{topic}>{m.get("short", m["title"])}</a></li>')
        # previous / next topic links
        order = [s for _, s, m in navitems if "topic" in m]
        pn = ""
        if stem in order:
            i = order.index(stem)
            prev = f'<a class="pn prev" href="{order[i-1]}.html">&larr; {dict((s, m) for _, s, m in navitems)[order[i-1]].get("short")}</a>' if i > 0 else "<span></span>"
            nxt = f'<a class="pn next" href="{order[i+1]}.html">{dict((s, m) for _, s, m in navitems)[order[i+1]].get("short")} &rarr;</a>' if i + 1 < len(order) else "<span></span>"
            pn = f'<nav class="prevnext">{prev}{nxt}</nav>'
        body = re.sub(r'<div class="video-slot" data-video="(\w+)"></div>', video_html, body)
        html = (layout.replace("{{title}}", meta.get("title", "ERA"))
                .replace("{{description}}", meta.get("description", "Estudio de 220375 Elements Resistents en l'Aeronàutica"))
                .replace("{{nav}}", "\n".join(nav))
                .replace("{{topic}}", meta.get("topic", ""))
                .replace("{{content}}", body + pn))
        (OUT / f"{stem}.html").write_text(html, encoding="utf-8")
    (OUT / ".nojekyll").write_text("")
    print(f"built {len(pages)} pages into {OUT}")


if __name__ == "__main__":
    main()
