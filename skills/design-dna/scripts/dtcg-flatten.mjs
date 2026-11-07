#!/usr/bin/env node
// Flatten W3C Design Tokens (DTCG) JSON into a normalized list for design-dna sync.
// No dependencies.
//
// usage: node dtcg-flatten.mjs <tokens.json> [more.json ...] [--out flat.json]
//
// - Reads $value/$type/$description (DTCG) and also value/type/description (Tokens Studio legacy).
// - Inherits $type from parent groups.
// - Resolves aliases like "{color.brand.primary}", including nested and chained ones.
// - Multiple files are merged in order (later wins), e.g. core.json then light.json.
// - Mode files: pass --mode name=file.json to tag tokens with a mode instead of merging.
//
// Output: { tokens: [{ path, type, value, raw, alias, description, mode, file }], problems: [...] }
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx > -1 ? args[outIdx + 1] : null;
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') { i++; continue; }
  if (args[i] === '--mode') { const [mode, file] = args[++i].split('='); inputs.push({ file, mode }); continue; }
  inputs.push({ file: args[i], mode: null });
}
if (!inputs.length) { console.error('usage: dtcg-flatten.mjs <tokens.json> [...] [--mode dark=dark.json] [--out flat.json]'); process.exit(2); }

const problems = [];
const tokens = new Map(); // key: mode|path

const isToken = (node) => node && typeof node === 'object' && ('$value' in node || ('value' in node && !Object.keys(node).some((k) => typeof node[k] === 'object' && node[k] !== null && !['value'].includes(k) && !k.startsWith('$') && k !== 'description' && k !== 'type' && k !== 'extensions')));

function walk(node, path, inheritedType, ctx) {
  if (!node || typeof node !== 'object') return;
  const groupType = node.$type || inheritedType;
  if (isToken(node)) {
    const raw = '$value' in node ? node.$value : node.value;
    const type = node.$type || node.type || inheritedType || null;
    const key = `${ctx.mode || ''}|${path.join('.')}`;
    tokens.set(key, { path: path.join('.'), type, raw, description: node.$description || node.description || null, mode: ctx.mode, file: ctx.file });
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    walk(v, [...path, k], groupType, ctx);
  }
}

for (const { file, mode } of inputs) {
  let json;
  try { json = JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { problems.push(`cannot read ${file}: ${e.message}`); continue; }
  walk(json, [], null, { file, mode });
}

const byPath = (p, mode) => tokens.get(`${mode || ''}|${p}`) || tokens.get(`|${p}`);
function resolve(value, mode, seen = []) {
  if (typeof value === 'string') {
    const whole = value.match(/^\{([^}]+)\}$/);
    if (whole) {
      const ref = whole[1];
      if (seen.includes(ref)) { problems.push(`alias cycle: ${[...seen, ref].join(' -> ')}`); return value; }
      const t = byPath(ref, mode);
      if (!t) { problems.push(`unresolved alias {${ref}}`); return value; }
      return resolve(t.raw, mode, [...seen, ref]);
    }
    return value.replace(/\{([^}]+)\}/g, (m, ref) => {
      const t = byPath(ref, mode);
      if (!t) { problems.push(`unresolved alias {${ref}}`); return m; }
      const v = resolve(t.raw, mode, [...seen, ref]);
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    });
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, mode, seen));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, mode, seen)]));
  return value;
}

const list = [...tokens.values()].map((t) => {
  const alias = typeof t.raw === 'string' && /^\{[^}]+\}$/.test(t.raw) ? t.raw.slice(1, -1) : null;
  return { ...t, value: resolve(t.raw, t.mode), alias };
}).sort((a, b) => (a.mode || '').localeCompare(b.mode || '') || a.path.localeCompare(b.path));

const result = { count: list.length, types: [...new Set(list.map((t) => t.type || 'untyped'))], tokens: list, problems: [...new Set(problems)] };
const json = JSON.stringify(result, null, 2);
if (out) writeFileSync(out, json);
console.log(out ? `${list.length} tokens -> ${out}${result.problems.length ? `, ${result.problems.length} problem(s)` : ''}` : json);
if (result.problems.length) { console.error(result.problems.join('\n')); process.exitCode = 1; }
