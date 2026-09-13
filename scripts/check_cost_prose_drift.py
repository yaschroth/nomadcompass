"""Compare TOTAL monthly-budget figures stated in guide prose against the measured
Numbeo range in data/cost-ranges.json that the hero, title, meta description, FAQ
answer and Article schema all print.

Only TOTAL-budget ranges are comparable. A guide that quotes a rent range is not
contradicting anything: rent sits below the whole basket by definition, and an
earlier version of this script compared the first dollar range it found, which was
usually rent, and reported 34 false positives.

Usage:  python scripts/check_cost_prose_drift.py [--all]
"""
import io, re, json, os, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOW_ALL = '--all' in sys.argv

g = json.load(io.open(os.path.join(ROOT, 'data', 'guide-content.json'), encoding='utf-8'))
cr = json.load(io.open(os.path.join(ROOT, 'data', 'cost-ranges.json'), encoding='utf-8'))
cr.pop('_meta', None)

RANGE = re.compile(
    r'\$\s?([\d,]{3,6})\s*(?:to|and|-|–)\s*\$?\s?([\d,]{3,6})'
    r'|([\d,]{3,6})\s*(?:to|and|-|–)\s*([\d,]{3,6})\s*(?:US dollars|dollars|USD)')

# a range is a TOTAL only if the clause around it talks about the whole cost of living
TOTAL = re.compile(r'\bbudget\b|\bspend\b|\ba month\b|per month for|cost of living|'
                   r'monthly (?:cost|total|outgoing)|live (?:on|comfortably)|lands? (?:roughly )?between', re.I)
# ...and not if it is plainly about one line item
ITEM = re.compile(r'\brent\b|apartment|flat\b|studio|bedroom|room\b|groceries|grocery|meal|coffee|'
                  r'transport|utilities|coworking|hot-?desk|sim\b|insurance|visa fee|eating out', re.I)
# ...unless the clause explicitly says the figure is the sum of those items
SUM = re.compile(r'added together|all[- ]in\b|once .{0,40}are added|covering rent|including rent|'
                 r'rent included|with rent', re.I)


def clause(text, start, end):
    # keep any "<strong>Groceries:</strong>" style label that precedes the figure
    a = max(text.rfind('.', 0, start), text.rfind('\n', 0, start),
            text.rfind(';', 0, start)) + 1
    b = min([x for x in (text.find('.', end), text.find('\n', end), len(text)) if x != -1])
    return text[a:b]


rows, skipped, reconciled = [], 0, []
for slug, r in sorted(cr.items()):
    sec = (g.get(slug) or {}).get('costOfLiving')
    if not sec:
        continue
    best = None
    for m in RANGE.finditer(sec):
        a, b = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
        lo, hi = int(a.replace(',', '')), int(b.replace(',', ''))
        if hi <= lo:
            continue
        c = clause(sec, m.start(), m.end())
        if not TOTAL.search(c):
            continue
        if ITEM.search(c) and not SUM.search(c):
            continue
        best = (lo, hi, c.strip())
        break
    if not best:
        skipped += 1
        continue
    lo, hi, c = best
    dlo, dhi = r['low'], r['high']
    # A page that states BOTH figures and explains the gap is reconciled, not drifting.
    flat = sec.replace(',', '')
    if str(dlo) in flat and str(dhi) in flat:
        reconciled.append(slug)
        continue
    drift = ((lo + hi) / 2 - (dlo + dhi) / 2) / ((dlo + dhi) / 2)
    rows.append((abs(drift), drift, slug, lo, hi, dlo, dhi, c))

rows.sort(reverse=True)
# A prose "all-in" total sitting 25-40% above the Numbeo basket is EXPECTED, not an error:
# the basket prices one person in an ordinary local flat cooking at home, and the prose usually
# prices a foreigner in a central flat with a coworking desk. Only a larger gap misleads a reader,
# so that is what fails the build. Everything above 25% is still listed, for eyes.
LIST_AT, FAIL_AT = 0.25, 0.40
bad = [x for x in rows if x[0] > LIST_AT]
fail = [x for x in rows if x[0] > FAIL_AT]

print('cities with a measured range AND a prose TOTAL-budget range: %d' % len(rows))
print('(%d more state only rent or per-item figures, which are not comparable)' % skipped)
print('(%d state both figures and explain the gap: %s)' % (len(reconciled), ', '.join(reconciled) or 'none'))
print()
print('above the measured midpoint by more than 25%%: %d  (listed below)' % len(bad))
print('above 40%%, which is what fails this check: %d' % len(fail))
print()
print('%-16s %-16s %-16s %s' % ('city', 'prose total', 'measured total', 'drift'))
for _, drift, slug, lo, hi, dlo, dhi, c in (rows if SHOW_ALL else bad):
    print('%-16s $%-6d-%-8d $%-6d-%-8d %+.0f%%' % (slug, lo, hi, dlo, dhi, drift * 100))

sys.exit(1 if fail else 0)
