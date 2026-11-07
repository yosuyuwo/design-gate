#!/usr/bin/env node
// Visual diff for design-gate: compares approved snapshots with new renders.
//
// usage:
//   node diff.mjs <before.png> <after.png> <diff.png> [--max 0.5] [--threshold 0.1]
//   node diff.mjs --snapshots design-gate/system/snapshots [--max 0.5] [--report r.json]
//
// --snapshots pairs approved-<name>.png with pending-<name>.png in every item folder and writes
// diff-<name>.png next to them. --max is the % of changed pixels allowed (default 0.5).
// --threshold is per-pixel colour sensitivity, 0 to 1 (default 0.1).
// Size changes count as changes: images are padded to the larger size before comparing.
// Prints a JSON report. Exit 1 when any pair is over --max (or, with --strict, when a pending
// render has no approved twin yet). Exit 2 on usage errors.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const max = Number(opt('max', 0.5));
const threshold = Number(opt('threshold', 0.1));
const strict = args.includes('--strict');
const reportPath = opt('report');

function pad(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function compare(beforePath, afterPath, diffPath) {
  const a = PNG.sync.read(readFileSync(beforePath));
  const b = PNG.sync.read(readFileSync(afterPath));
  const w = Math.max(a.width, b.width), h = Math.max(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const changed = pixelmatch(pad(a, w, h).data, pad(b, w, h).data, diff.data, w, h, { threshold, includeAA: false });
  mkdirSync(dirname(resolve(diffPath)), { recursive: true });
  writeFileSync(diffPath, PNG.sync.write(diff));
  const percent = +(changed / (w * h) * 100).toFixed(3);
  return {
    before: beforePath, after: afterPath, diff: diffPath, changedPixels: changed, percent,
    sizeChanged: a.width !== b.width || a.height !== b.height,
    before_size: `${a.width}x${a.height}`, after_size: `${b.width}x${b.height}`,
    over: percent > max,
  };
}

const results = [];
const orphans = [];
try {
  const snapDir = opt('snapshots');
  if (snapDir) {
    if (!existsSync(snapDir)) { console.error(`no such folder: ${snapDir}`); process.exit(2); }
    for (const item of readdirSync(snapDir)) {
      const dir = join(snapDir, item);
      if (!statSync(dir).isDirectory()) continue;
      for (const f of readdirSync(dir)) {
        const m = f.match(/^pending-(.+\.png)$/);
        if (!m) continue;
        const approved = join(dir, `approved-${m[1]}`);
        if (!existsSync(approved)) { orphans.push({ item, pending: join(dir, f) }); continue; }
        results.push({ item, ...compare(approved, join(dir, f), join(dir, `diff-${m[1]}`)) });
      }
    }
  } else {
    const [before, after, diffOut] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
    if (!before || !after || !diffOut) { console.error('usage: diff.mjs <before.png> <after.png> <diff.png> [--max %] | --snapshots <dir>'); process.exit(2); }
    results.push(compare(before, after, diffOut));
  }
} catch (e) {
  console.error(`diff failed: ${e.stack || e.message}`);
  if (/Cannot find package/.test(String(e))) console.error('Run the design-gate setup script (design-loop/scripts/setup.sh).');
  process.exit(1);
}

const over = results.filter((r) => r.over);
const summary = { ok: !over.length && !(strict && orphans.length), max, compared: results.length, over: over.length, new: orphans, results };
const json = JSON.stringify(summary, null, 2);
if (reportPath) writeFileSync(reportPath, json);
console.log(json);
for (const r of over) console.error(`CHANGED ${r.item || ''} ${r.after}: ${r.percent}% (max ${max}%)${r.sizeChanged ? ` size ${r.before_size} -> ${r.after_size}` : ''}`);
if (!summary.ok) process.exitCode = 1;
