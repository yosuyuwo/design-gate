#!/usr/bin/env bash
# Fallback installer. Prefer: npx skills add yosuyuwo/design-gate
#
#   ./install.sh --agent codex              project install for one agent (run from project root)
#   ./install.sh --agent claude --global    user-wide install
#   ./install.sh --dir path/to/skills       any directory
#   --no-setup                              skip the renderer setup
#
# Agents: claude, codex, cursor, gemini, copilot, opencode, agents (generic .agents/skills)
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT="agents"; GLOBAL=0; DIR=""; SETUP=1
while [ $# -gt 0 ]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --global|-g) GLOBAL=1; shift ;;
    --dir) DIR="$2"; shift 2 ;;
    --no-setup) SETUP=0; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
if [ -z "$DIR" ]; then
  if [ "$GLOBAL" = 1 ]; then
    case "$AGENT" in
      claude) DIR="$HOME/.claude/skills" ;;
      codex) DIR="$HOME/.codex/skills" ;;
      cursor) DIR="$HOME/.cursor/skills" ;;
      gemini) DIR="$HOME/.gemini/skills" ;;
      copilot) DIR="$HOME/.copilot/skills" ;;
      opencode) DIR="$HOME/.config/opencode/skills" ;;
      agents) DIR="$HOME/.config/agents/skills" ;;
      *) echo "unknown agent: $AGENT" >&2; exit 2 ;;
    esac
  else
    case "$AGENT" in
      claude) DIR="$PWD/.claude/skills" ;;
      opencode) DIR="$PWD/.opencode/skills" ;;
      codex|cursor|gemini|copilot|agents) DIR="$PWD/.agents/skills" ;;
      *) echo "unknown agent: $AGENT" >&2; exit 2 ;;
    esac
  fi
fi
mkdir -p "$DIR"
for s in design-dna design-hub design-loop; do
  rm -rf "${DIR:?}/$s"; cp -r "$HERE/skills/$s" "$DIR/$s"
done
echo "Skills installed to $DIR"
if [ "$SETUP" = 1 ]; then bash "$HERE/skills/design-loop/scripts/setup.sh"; fi
echo "Restart your agent so it picks up design-dna, design-hub and design-loop."
