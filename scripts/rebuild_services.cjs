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
 * Usage: node scripts/rebuild_services.cjs [--skip-sweeps]
 */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const skipSweeps = process.argv.includes('--skip-sweeps');

// Generators first, in dependency order. Sweeps second, with the schema one last. Gates at the end,
// because a gate that runs before the last writer is only checking an intermediate state.
const STEPS = [
  ['build', 'build_services.cjs', 'the hub, and the shell every other page lifts'],
  ['build', 'build_service_city_pages.cjs', '287 city pages'],
  ['build', 'build_service_pair_pages.cjs', 'city and service, and the manifest the rest read'],
  ['build', 'build_service_hubs.cjs', 'one page per service'],
  ['build', 'build_service_lang_pages.cjs', 'one page per service and language'],
  ['build', 'apply_city_services_link.cjs', 'the links from cities/ into the directory'],
  ['sweep', 'apply_analytics.cjs', ''],
  ['sweep', 'apply_skip_link.cjs', ''],
  ['sweep', 'apply_tools_nav.cjs', ''],
  ['sweep', 'apply_nav_search.cjs', ''],
  ['sweep', 'apply_footer_legal.cjs', ''],
  ['sweep', 'apply_entity_schema.cjs', 'must be the last writer'],
  ['build', 'generate_sitemap.cjs', 'reads the four manifests'],
  ['gate', 'check_service_pages.cjs', ''],
  ['gate', 'check_service_dupes.cjs', ''],
  ['gate', 'check_provenance.cjs', ''],
  ['gate', 'check_site_numbers.cjs', ''],
];

let failed = 0;
const started = process.hrtime.bigint();

for (const [kind, script, why] of STEPS) {
  if (skipSweeps && kind === 'sweep') continue;
  const t0 = process.hrtime.bigint();
  let out = '';
  let ok = true;
  try {
    out = execFileSync('node', [path.join(ROOT, 'scripts', script)], {
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
