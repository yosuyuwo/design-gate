#!/usr/bin/env bash
# One-time setup for the design-gate renderer.
# Installs Playwright + Chromium into ~/.cache/design-gate (never into your project).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${DESIGN_GATE_HOME:-$HOME/.cache/design-gate}"
command -v node >/dev/null || { echo "Node.js 18+ is required." >&2; exit 1; }
mkdir -p "$DEST"
cp "$HERE/render.mjs" "$HERE/package.json" "$DEST/"
cd "$DEST"
npm install --no-audit --no-fund --silent
npx --yes playwright install chromium
echo "design-gate renderer ready: node $DEST/render.mjs <url-or-file> <outPrefix>"
