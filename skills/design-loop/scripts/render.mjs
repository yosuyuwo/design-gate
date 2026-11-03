#!/usr/bin/env node
// Shared renderer for design-loop and design-dna.
// usage: node render.mjs <url-or-file> <outPrefix> [--views desktop,mobile,tablet]
//        [--size 1080x1350] [--selector "#hero"] [--frames 6 --every 250] [--wait 800]
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const [target, out] = args;
if (!target || !out) {
  console.error('usage: render.mjs <url-or-file> <outPrefix> [--views a,b] [--size WxH] [--selector css] [--frames N --every ms] [--wait ms]');
  process.exit(2);
}
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 && args[i + 1] ? args[i + 1] : def;
};

const PRESETS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

let views;
const size = opt('size');
if (size) {
  const [w, h] = size.toLowerCase().split('x').map(Number);
  views = { [`${w}x${h}`]: { width: w, height: h } };
} else {
  views = {};
  for (const v of opt('views', 'desktop').split(',')) {
    if (!PRESETS[v]) { console.error(`unknown view: ${v}`); process.exit(2); }
    views[v] = PRESETS[v];
  }
}

const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
const selector = opt('selector');
const frames = Number(opt('frames', 0));
const every = Number(opt('every', 250));
const wait = Number(opt('wait', 800));

mkdirSync(dirname(resolve(out)), { recursive: true });

const browser = await chromium.launch();
const written = [];
try {
  for (const [name, viewport] of Object.entries(views)) {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => page.goto(url, { waitUntil: 'load' }));
    const loc = selector ? page.locator(selector).first() : null;
    const shoot = async (path) => {
      if (loc) await loc.screenshot({ path });
      else await page.screenshot({ path, fullPage: false });
      written.push(path);
    };
    const suffix = Object.keys(views).length > 1 || !size ? `-${name}` : '';
    if (frames > 0) {
      for (let f = 1; f <= frames; f++) {
        await page.waitForTimeout(f === 1 ? 0 : every);
        await shoot(`${out}${suffix}-f${f}.png`);
      }
    } else {
      await page.waitForTimeout(wait);
      await shoot(`${out}${suffix}.png`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(written.join('\n'));
