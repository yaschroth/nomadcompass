import io, re, json, os, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = r'C:\Users\yasch\Coding Projects\Website Projects\nomadcompass'
g = json.load(io.open(os.path.join(ROOT, 'data', 'guide-content.json'), encoding='utf-8'))
cr = json.load(io.open(os.path.join(ROOT, 'data', 'cost-ranges.json'), encoding='utf-8'))
cr.pop('_meta', None)

num = re.compile(
    r'\$\s?([\d,]{3,6})\s*(?:to|and|-|\u2013)\s*\$?\s?([\d,]{3,6})'
    r'|([\d,]{3,6})\s*(?:to|and|-|\u2013)\s*([\d,]{3,6})\s*(?:US dollars|dollars|USD)')

rows = []
nopose = 0
for slug, r in cr.items():
    sec = (g.get(slug) or {}).get('costOfLiving')
    if not sec:
        continue
    m = num.search(sec)
    if not m:
        nopose += 1
        continue
    a, b = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
    lo, hi = int(a.replace(',', '')), int(b.replace(',', ''))
    if hi <= lo:
        continue
    dlo, dhi = r['low'], r['high']
    pmid, dmid = (lo + hi) / 2, (dlo + dhi) / 2
    drift = (pmid - dmid) / dmid
    rows.append((abs(drift), drift, slug, lo, hi, dlo, dhi))

rows.sort(reverse=True)
over = [x for x in rows if abs(x[0]) > 0.25]
print('cities with BOTH a measured range and a prose range:', len(rows))
print('prose midpoint off the measured midpoint by >25%%: %d' % len(over))
print()
print('%-18s %-16s %-16s %s' % ('city', 'prose says', 'data says', 'drift'))
for _, drift, slug, lo, hi, dlo, dhi in over[:45]:
    print('%-18s $%-6d-%-8d $%-6d-%-8d %+.0f%%' % (slug, lo, hi, dlo, dhi, drift * 100))
print()
print('... %d more' % max(0, len(over) - 45))
print('no parseable prose range:', nopose)
