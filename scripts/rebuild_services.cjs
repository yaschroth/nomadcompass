/**
 * Rebuilds the whole services directory in the one order that works.
 *
 * There are five generators, six sweeps, a sitemap and four gates, and the order is not a
 * preference. build_services.cjs must run first because every other generator lifts its shell out
 * of the page it writes; build_service_pair_pages.cjs must run before build_service_hubs.cjs and
 * apply_city_services_link.cjs because they read the manifest it writes to decide what to link;
 * apply_entity_schema.cjs must run last of the writers; and the sitemap must run after all of them
 * because it is manifest-driven and never walks a directory.
 *
 * Assembling that by hand in a shell is how a step gets forgotten. It is also slow enough that a
 * two-minute command timeout cut it off halfway, leaving the family half-built and the gates
 * unrun, which is a worse state than not having started.
 *
 * One loop is still not fully broken, and the gate rather than the build reports it. When a category
 * and language pair first qualifies for a page of its own, a page built earlier in the same run has
 * already linked to it from the previous run manifest, and check_service_pages says
 * "/services/dentists/italian: is linked 1 times and does not exist". The hub counts on services.html
 * lag the same way, by one run, because build_services writes them from the manifest the hub builder
 * produced last time. A second run settles both,
 * because by then every manifest agrees. Re-run before debugging it: this is expected the first time
 * a new pair appears, and only then.
 *
 * The link check is a gate here and it goes over the network, which no other step does. It earns
 * that with --new-only: it fetches the links this data change added and nothing else, so a rebuild
 * that changed no rows spends no time on it. The standing rule was to run it after every data
 * change and it was easy to forget, and for a while impossible to keep, because a full sweep of all
 * two thousand links ran for hours. A full sweep is still worth doing now and then, by hand:
 *   node scripts/verify_service_links.cjs --all
 *
 * A network that is down does not fail the run. Only DEAD does, which means a server answered with
 * a 4xx or 5xx; being blocked, timing out or failing to resolve are reported and not judged.
 *
 * Usage: node scripts/rebuild_services.cjs [--skip-sweeps]
 */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const skipSweeps = process.argv.includes('--skip-sweeps');

// Generators first, in dependency order. Sweeps second, with the schema one last. Gates at the end,
// because a gate that runs before the last writer is only checking an intermediate state.
// The order is a dependency graph, not a preference, and one loop in it has to be broken by hand.
// The pair pages link to the language pages and the language pages link back to the pair pages, so
// whichever runs first reads the other manifest from the previous run. The pair generator therefore
// runs twice: once to publish a fresh manifest for everything downstream, and once at the end with
// the language manifest in hand. Running the city pages before the pair pages, which is what the
// old order did, left them linking to /services/sapporo/doctors after the similarity cap had held
// that page back.
const STEPS = [
  ['build', 'build_services.cjs', 'the hub, and the shell every other page lifts'],
  ['build', 'build_service_pair_pages.cjs', 'decides what exists, and writes the manifest the rest read'],
  ['build', 'build_service_hubs.cjs', 'one page per service'],
  ['build', 'build_service_lang_pages.cjs', 'one page per service and language'],
  ['build', 'build_service_city_lang_pages.cjs', 'the overflow of a big language section, on a page of its own'],
  ['build', 'build_service_pair_pages.cjs', 'again, now that the language pages exist to link to'],
  ['build', 'build_service_city_pages.cjs', 'city pages, which link to the pages above'],
  ['build', 'apply_city_services_link.cjs', 'the links from cities/ into the directory'],
  ['sweep', 'apply_analytics.cjs', ''],
  ['sweep', 'apply_skip_link.cjs', ''],
  ['sweep', 'apply_tools_nav.cjs', ''],
  ['sweep', 'apply_nav_search.cjs', ''],
  ['sweep', 'apply_footer_legal.cjs', ''],
  ['sweep', 'apply_entity_schema.cjs', 'must be the last writer'],
  ['build', 'generate_sitemap.cjs', 'reads the four manifests'],
  ['gate', 'check_parsers.cjs', 'the readers still read their frozen pages the same way'],
  ['gate', 'check_service_pages.cjs', ''],
  ['gate', 'check_service_dupes.cjs', ''],
  ['gate', 'check_provenance.cjs', ''],
  ['gate', 'check_site_numbers.cjs', ''],
  ['gate', 'check_css_tokens.cjs', 'a var() with no definition and no fallback drops the whole declaration'],
  ['gate', 'check_prose_style.cjs', 'no em-dashes, and every price in USD'],
  ['gate', 'verify_service_links.cjs --new-only', 'fetches the links a data change added, and only those'],
];

let failed = 0;
const started = process.hrtime.bigint();

for (const [kind, script, why] of STEPS) {
  if (skipSweeps && kind === 'sweep') continue;
  const t0 = process.hrtime.bigint();
  let out = '';
  let ok = true;
  try {
    const [file, ...args] = script.split(' ');
    out = execFileSync('node', [path.join(ROOT, 'scripts', file), ...args], {
      encoding: 'utf8', cwd: ROOT, maxBuffer: 1 << 26,
    });
  } catch (e) {
    ok = false;
    out = String((e.stdout || '') + (e.stderr || '')).trim();
    failed++;
  }
  const ms = Number((process.hrtime.bigint() - t0) / 1000000n);
  const last = out.trim().split('\n').filter(Boolean).pop() || '';
  console.log(
    (ok ? '  ok   ' : '  FAIL ') + script.padEnd(32) + String(ms).padStart(6) + 'ms  ' +
    (ok ? last.slice(0, 90) : ''),
  );
  if (!ok) {
    out.split('\n').slice(0, 12).forEach((l) => console.error('         ' + l));
    // A failed generator makes everything after it meaningless, but a failed gate is a report:
    // finish the other gates so one run tells you everything that is wrong, not just the first.
    if (kind !== 'gate') { console.error('\nStopped: a generator failed, so nothing after it would mean anything.'); process.exit(1); }
  }
  if (why) console.log('       ' + why);
}

const total = Number((process.hrtime.bigint() - started) / 1000000000n);
console.log((failed ? failed + ' gate(s) failed' : 'All steps clean') + ', ' + total + 's total.');
process.exit(failed ? 1 : 0);
