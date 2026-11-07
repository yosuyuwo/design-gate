#!/usr/bin/env node
// design-gate: deterministic gate checks over design-gate/system/. No dependencies.
// Runs locally and in CI. Project-specific checks (token drift vs dna.json, file layout,
// playground/docs coverage) live in the project's own tests; this covers the shared files.
//
// usage: node gate.mjs [--root .] [--mode block|warn] [--summary $GITHUB_STEP_SUMMARY] [--json]
// exit 1 on any failure in block mode; always 0 in warn mode (failures still reported).
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const root = opt('root', '.');
const mode = opt('mode', process.env.DESIGN_GATE_MODE || 'block');
const summaryPath = opt('summary');
const sys = join(root, 'design-gate', 'system');

const failures = [];
const warnings = [];
const fail = (check, msg) => failures.push({ check, msg });
const warn = (check, msg) => warnings.push({ check, msg });

function load(name, required) {
  const p = join(sys, name);
  if (!existsSync(p)) { if (required) fail('files', `missing design-gate/system/${name}`); return null; }
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { fail('files', `design-gate/system/${name} is not valid JSON: ${e.message}`); return null; }
}

const manifest = load('manifest.json', true);
const decisionsFile = load('decisions.json', false);
const ledgerFile = load('disconnects.json', false);
const items = manifest?.items || [];
const decisions = decisionsFile?.decisions || [];
const entries = ledgerFile?.entries || [];
const ids = new Set(items.map((i) => i.id));
const STATUSES = ['draft', 'in-review', 'approved', 'changes-requested'];
const LAYERS = manifest?.gates || ['foundations', 'components', 'patterns', 'specimens'];

// manifest
const seen = new Set();
for (const it of items) {
  const where = `item "${it.id ?? '?'}"`;
  if (!it.id) { fail('manifest', 'an item has no id'); continue; }
  if (seen.has(it.id)) fail('manifest', `duplicate id ${it.id}`);
  seen.add(it.id);
  if (!STATUSES.includes(it.status)) fail('manifest', `${where}: unknown status "${it.status}"`);
  if (!LAYERS.includes(it.layer)) fail('manifest', `${where}: unknown layer "${it.layer}"`);
  if (it.layer === 'components' && !it.group) fail('manifest', `${where}: component has no group`);
  if (it.source && !existsSync(join(root, it.source))) fail('manifest', `${where}: source ${it.source} no longer exists`);
  if (it.status === 'approved' && (!it.approvedBy || !it.approvedAt)) fail('manifest', `${where}: approved without approvedBy/approvedAt`);
}

// layer order: an approved item may only depend on approved items
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
for (const it of items.filter((i) => i.status === 'approved')) {
  for (const dep of it.dependsOn || []) {
    const depId = dep.includes(':') ? dep.split(':')[1] : dep;
    const d = byId[depId];
    if (d && d.status !== 'approved') fail('gate', `approved item "${it.id}" depends on "${depId}", which is ${d.status}`);
  }
  const li = LAYERS.indexOf(it.layer);
  if (li > 0) {
    const earlier = items.filter((x) => LAYERS.indexOf(x.layer) < li && LAYERS.indexOf(x.layer) === 0 && x.status !== 'approved');
    if (it.layer === 'components' && earlier.length) fail('gate', `component "${it.id}" is approved but foundations are not: ${earlier.map((x) => x.id).join(', ')}`);
  }
}

// ledger
const LEDGER = ['open', 'fixed', 'exception'];
for (const e of entries) {
  const where = `ledger entry "${e.id ?? '?'}"`;
  if (!LEDGER.includes(e.status)) fail('ledger', `${where}: unknown status "${e.status}"`);
  if (e.item && !ids.has(e.item)) fail('ledger', `${where}: names unknown item "${e.item}"`);
  if (e.status === 'exception' && !e.note) fail('ledger', `${where}: exception without a note`);
  if (e.status === 'open' && byId[e.item]?.status === 'approved') fail('ledger', `approved item "${e.item}" has open entry "${e.id}"`);
}
const open = entries.filter((e) => e.status === 'open');
if (open.length) warn('ledger', `${open.length} open entr${open.length === 1 ? 'y' : 'ies'}`);

// decisions
const DEC = ['open', 'provisional', 'decided'];
for (const d of decisions) {
  if (!DEC.includes(d.status)) fail('decisions', `decision "${d.id}": unknown status "${d.status}"`);
  if (d.status !== 'decided' && d.blocksApproval !== false) {
    const affected = (d.affects || []).map((a) => (a.includes(':') ? a.split(':')[1] : a));
    for (const it of items.filter((i) => i.status === 'approved')) {
      const deps = (it.dependsOn || []).map((x) => (x.includes(':') ? x.split(':')[1] : x));
      if (affected.includes(it.id) || affected.includes(it.layer) || deps.some((x) => affected.includes(x))) {
        fail('decisions', `approved item "${it.id}" depends on ${d.status} decision "${d.id}"`);
      }
    }
  }
}
const prov = decisions.filter((d) => d.status === 'provisional');
if (prov.length) warn('decisions', `${prov.length} provisional: ${prov.map((d) => d.id).join(', ')}`);

// report
const count = (l) => items.filter((i) => i.layer === l);
const lines = [];
lines.push(`## design-gate ${failures.length ? (mode === 'warn' ? '⚠️ issues (warn mode)' : '❌ failed') : '✅ passed'}`);
lines.push('');
lines.push('| Layer | Approved | In review | Draft |');
lines.push('|---|---|---|---|');
for (const l of LAYERS) {
  const c = count(l);
  if (!c.length) continue;
  lines.push(`| ${l} | ${c.filter((i) => i.status === 'approved').length}/${c.length} | ${c.filter((i) => i.status === 'in-review').length} | ${c.filter((i) => i.status === 'draft').length} |`);
}
lines.push('');
lines.push(`Ledger: ${open.length} open · ${entries.filter((e) => e.status === 'exception').length} exceptions · ${entries.filter((e) => e.status === 'fixed').length} fixed`);
lines.push(`Decisions: ${decisions.filter((d) => d.status === 'decided').length} decided · ${prov.length} provisional · ${decisions.filter((d) => d.status === 'open').length} open`);
if (failures.length) { lines.push('', '### Failures'); for (const f of failures) lines.push(`- **${f.check}**: ${f.msg}`); }
if (warnings.length) { lines.push('', '### Notes'); for (const w of warnings) lines.push(`- ${w.check}: ${w.msg}`); }
const md = lines.join('\n') + '\n';

if (summaryPath) appendFileSync(summaryPath, md);
if (args.includes('--json')) console.log(JSON.stringify({ ok: !failures.length, mode, failures, warnings }, null, 2));
else console.log(md);
if (failures.length && mode !== 'warn') process.exitCode = 1;
