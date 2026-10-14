"""
Turns short strings into SVG path outlines in the site's own fonts, for the Confirmed listing badges.

A badge is an <img> on somebody else's site, so it cannot load our web fonts, and whatever font a
<text> element names is a guess about the visitor's machine: the first badges came out in Georgia
and Helvetica on a site set in Chakra Petch and Barlow. Outlines need no font at all.

Reads JSON from stdin: [{"text": "...", "font": "chakra-petch-700", "size": 17, "track": 0}, ...]
Writes JSON to stdout:  [{"d": "<path data, baseline at y=0, starting at x=0>", "width": 123.4,
                           "missing": false}, ...]
"missing" is true when a character exists in none of the font's subsets (a Japanese clinic name in
Barlow); the caller then falls back to a <text> element for that string.

Usage: python -I scripts/text_to_path.py < in.json > out.json
"""
import json
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'fonts')
SUBSETS = ['latin', 'latin-ext', 'vietnamese']
_cache = {}


def faces(font):
    if font not in _cache:
        out = []
        for sub in SUBSETS:
            path = os.path.join(FONT_DIR, f'{font}-{sub}.woff2')
            if os.path.exists(path):
                f = TTFont(path)
                out.append((f, f.getBestCmap(), f.getGlyphSet(), f['head'].unitsPerEm, f['hmtx']))
        if not out:
            raise SystemExit(f'text_to_path: no files for font {font}')
        _cache[font] = out
    return _cache[font]


def render(text, font, size, track):
    fs = faces(font)
    x = 0.0
    parts = []
    missing = False
    for i, ch in enumerate(text):
        hit = next((f for f in fs if ord(ch) in f[1]), None)
        if hit is None:
            missing = True
            continue
        _, cmap, gs, upem, hmtx = hit
        name = cmap[ord(ch)]
        scale = size / upem
        pen = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        # Font units are y-up; SVG is y-down. Baseline sits at y=0.
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 0)))
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += hmtx[name][0] * scale
        if i < len(text) - 1:
            x += track
    return {'d': ' '.join(parts), 'width': round(x, 2), 'missing': missing}


def main():
    # Bytes, decoded as UTF-8: on Windows sys.stdin decodes in the ANSI code page, which turned the
    # ellipsis into "â€¦" and would do the same to every accented name.
    jobs = json.loads(sys.stdin.buffer.read().decode('utf-8'))
    out = [render(j['text'], j['font'], float(j['size']), float(j.get('track', 0))) for j in jobs]
    sys.stdout.write(json.dumps(out))


if __name__ == '__main__':
    main()
