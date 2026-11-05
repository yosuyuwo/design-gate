#!/usr/bin/env node
// Shared renderer for design-gate skills.
//
// usage: node render.mjs <url-or-file> <outPrefix> [options]
//   --views desktop,tablet,mobile   viewport presets (default: desktop)
//   --size 1080x1350                one exact canvas instead of presets
//   --selector "#hero"              screenshot one element
//   --full                          full-page screenshot
//   --frames 6 --every 250          animation filmstrip
//   --wait 800                      ms to wait after load (default 800)
//   --idle                          wait for networkidle (never on dev servers: HMR keeps the network busy)
//   --walk "aside a[href^='#']"     visit every matching hash link, one shot and check per section
//   --expect "[data-hub-ready]"     fail a page/section when this selector is missing
//   --report out.json               write the JSON report to a file (always printed to stdout)
//   --no-shots                      checks only, no screenshots
//
// Every page is checked for console errors, page errors, HTTP status >= 400, horizontal
// overflow, and the --expect marker. Exit code 1 when any check fails, 2 on usage errors.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const [target, out] = args;
const usage = 'usage: render.mjs <url-or-file> <outPrefix> [--views a,b] [--size WxH] [--selector css] [--full] [--frames N --every ms] [--wait ms] [--idle] [--walk css] [--expect css] [--report file] [--no-shots]';
if (!target || !out || target.startsWith('--') || out.startsWith('--')) { console.error(usage); process.exit(2); }
const has = (name) => args.includes(`--${name}`);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};

const PRESETS = { desktop: { width: 1440, height: 900 }, tablet: { width: 834, height: 1112 }, mobile: { width: 390, height: 844 } };
let views = {};
const size = opt('size');
if (size) {
  const [w, h] = size.toLowerCase().split('x').map(Number);
  if (!w || !h) { console.error(`bad --size: ${size}`); process.exit(2); }
  views[`${w}x${h}`] = { width: w, height: h };
} else {
  for (const v of opt('views', 'desktop').split(',')) {
    if (!PRESETS[v]) { console.error(`unknown view: ${v}`); process.exit(2); }
    views[v] = PRESETS[v];
  }
}

const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
const selector = opt('selector');
const full = has('full');
const frames = Number(opt('frames', 0));
const every = Number(opt('every', 250));
const wait = Number(opt('wait', 800));
const idle = has('idle');
const walk = opt('walk');
const expect = opt('expect');
const reportPath = opt('report');
const shots = !has('no-shots');
const multiView = Object.keys(views).length > 1 || !size;

mkdirSync(dirname(resolve(out)), { recursive: true });
const slug = (s) => s.replace(/^#/, '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '') || 'top';

async function check(page, errors) {
  const metrics = await page.evaluate((exp) => {
    const el = document.documentElement;
    return {
      overflowPx: Math.max(0, el.scrollWidth - el.clientWidth),
      expectFound: exp ? !!document.querySelector(exp) : null,
      title: document.title,
    };
  }, expect || null);
  const problems = [];
  if (errors.length) problems.push(`${errors.length} console/page error(s)`);
  if (metrics.overflowPx > 0) problems.push(`horizontal overflow ${metrics.overflowPx}px`);
  if (metrics.expectFound === false) problems.push(`missing ${expect}`);
  return { ...metrics, errors: [...errors], problems };
}

async function shoot(page, path) {
  if (!shots) return null;
  if (selector) await page.locator(selector).first().screenshot({ path });
  else await page.screenshot({ path, fullPage: full });
  return path;
}

const report = [];
let browser;
try {
  browser = await chromium.launch();
  for (const [name, viewport] of Object.entries(views)) {
    const page = await browser.newPage({ viewport });
    let errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    const suffix = multiView ? `-${name}` : '';

    const res = await page.goto(url, { waitUntil: idle ? 'networkidle' : 'load', timeout: 60000 });
    const status = res ? res.status() : null;
    await page.waitForTimeout(wait);

    if (walk) {
      const hrefs = [...new Set(await page.$$eval(walk, (as) => as.map((a) => a.getAttribute('href')).filter(Boolean)))];
      if (!hrefs.length) {
        report.push({ view: name, url, status, problems: [`--walk matched no links: ${walk}`], errors: [] });
      }
      for (const href of hrefs) {
        errors = [];
        if (href.startsWith('#')) {
          await page.evaluate((h) => { location.hash = h; }, href);
        } else {
          await page.goto(new URL(href, page.url()).href, { waitUntil: idle ? 'networkidle' : 'load', timeout: 60000 });
        }
        await page.waitForTimeout(wait);
        const r = await check(page, errors);
        const shot = await shoot(page, `${out}${suffix}-${slug(href)}.png`);
        report.push({ view: name, url: page.url(), section: href, status, shot, ...r });
      }
    } else if (frames > 0) {
      const files = [];
      for (let f = 1; f <= frames; f++) {
        if (f > 1) await page.waitForTimeout(every);
        files.push(await shoot(page, `${out}${suffix}-f${f}.png`));
      }
      report.push({ view: name, url, status, shot: files, ...(await check(page, errors)) });
    } else {
      const shot = await shoot(page, `${out}${suffix}.png`);
      report.push({ view: name, url, status, shot, ...(await check(page, errors)) });
    }
    await page.close();
  }
} catch (e) {
  console.error(`render failed: ${e.stack || e.message}`);
  if (/Executable doesn't exist|browserType.launch/.test(String(e))) {
    console.error('Chromium is missing. Run the design-gate setup script (design-loop/scripts/setup.sh).');
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}

for (const r of report) if (r.status && r.status >= 400) r.problems.unshift(`HTTP ${r.status}`);
const failed = report.filter((r) => r.problems.length);
const summary = { ok: !failed.length && process.exitCode !== 1, checked: report.length, failed: failed.length, results: report };
const json = JSON.stringify(summary, null, 2);
if (reportPath) { mkdirSync(dirname(resolve(reportPath)), { recursive: true }); writeFileSync(reportPath, json); }
console.log(json);
for (const r of failed) console.error(`FAIL ${r.view} ${r.section || r.url}: ${r.problems.join('; ')}${r.errors.length ? `\n  ${r.errors.slice(0, 5).join('\n  ')}` : ''}`);
if (failed.length) process.exitCode = 1;
