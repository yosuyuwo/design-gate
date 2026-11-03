# design-gate

Agent skills that make teams agree on a design before building it: brand DNA, an in-app design system hub with approvals, and a critic loop for key screens. Written to the open [Agent Skills](https://agentskills.io) format, so they work in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and other agents that load `SKILL.md`.

| Skill | Job |
|---|---|
| `design-dna` | Codify a style you admire into rules that can fail (`dna.json`, a 2KB `PROMPT.md`, `check.py`). Compose 2 to 4 of them into your own brand. |
| `design-hub` | A reviewable design system inside the app (`/design` route or Storybook): foundations, voice, components, specimens, approaches, with an approval gate your team signs off on. |
| `design-loop` | Build a key screen, then have fresh-context critics judge it blind against a reference until it wins. Budgeted, gated, capped. |

Optional companions, used when installed: `copy-system` (copy hygiene), `illustration-graphics-system` (imagery).

## Install

### Any agent (recommended)

```bash
npx skills add yosuyuwo/design-gate
```

The CLI detects your installed agents and asks where to install. Useful flags: `-a codex -a cursor` to pick agents, `-g` for user-wide, `--skill design-hub` for one skill, `-y` to skip prompts.

Then run the one-time renderer setup (Playwright + Chromium into `~/.cache/design-gate`, never into your project). It lives inside the installed design-loop skill, e.g.:

```bash
bash .agents/skills/design-loop/scripts/setup.sh
```

Skills also offer to run it the first time they need to render.

### Claude Code plugin

```
/plugin marketplace add yosuyuwo/design-gate
/plugin install design-gate@yosuyuwo
```

Team-wide, commit to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "yosuyuwo": { "source": { "source": "github", "repo": "yosuyuwo/design-gate" } }
  },
  "enabledPlugins": { "design-gate@yosuyuwo": true }
}
```

### Without a CLI

```bash
git clone https://github.com/yosuyuwo/design-gate
cd your-project
/path/to/design-gate/install.sh --agent codex          # project
/path/to/design-gate/install.sh --agent claude --global
```

Agents: `claude`, `codex`, `cursor`, `gemini`, `copilot`, `opencode`, `agents` (generic `.agents/skills`). Or `--dir <path>`.

## How it adapts per agent

- **Fresh-context steps** (builders and critics that must not see the work in progress) use the agent's own subagents when it has them, otherwise an installed agent CLI in a separate process (`claude -p`, `codex exec`, `gemini -p`, `cursor-agent -p`, `opencode run`). With neither, they run in the same session and the skill warns that verdicts will be softer.
- **Model tiers** are `small` / `default` / `strong`, mapped to whatever the agent offers.
- **Project rules** go in `AGENTS.md`. design-hub adds a one-line `@AGENTS.md` pointer to `CLAUDE.md` or `GEMINI.md` when you use those agents.

## Requirements

- An agent that supports Agent Skills
- Node.js 18+ (renderer)
- macOS, Linux or WSL

## Workflow

```
design-dna  (extract x2-3, then compose)      once per brand
     │
design-hub setup → foundations + voice → components → specimens
     │                 review / approve at each layer
design-loop on 2-3 key specimens only
     │
build features from approved parts (enforced by the AGENTS.md gate)
```

### New project

1. `design-dna`: extract 2 to 3 references, then compose them with your palette and audience. Pick your own weird move.
2. `design-hub setup`: choose the UI library (shadcn recommended for brand-heavy work); the hub is built from the DNA and the design gate is written to `AGENTS.md`.
3. Foundations, voice and glossary: `review`, send the note to colleagues, `approve --by <name>`.
4. Components, then specimens. Loop only the key specimens with `design-loop`.
5. Build features. Sessions refuse to invent UI that is not in the approved system.

### Existing project

1. `design-dna` as above, from your current brand plus references.
2. `design-hub setup`: detects the library, audits components and copy (keep / merge / replace table plus a baseline lint score), loads everything into the hub as draft. Nothing is refactored until you confirm.
3. Record what makes the product recognisable: `design-hub approach "<name>"`.
4. Fix and approve item by item. Copy is rewritten per item, never the whole app at once.
5. Loop the screens that matter most, then build.

## What it writes into a project

Everything goes in one folder, plus the gate rule in `AGENTS.md` (agents only read it at the root):

```
design-gate/
  README.md            how to review, for colleagues (hub URL, review order, what approved means)
  dna/<slug>/          brand DNA: PROMPT.md, dna.json, tools/check.py, reference/, example/
  system/
    manifest.json      every item with its status and approval record
    approaches.md      the approaches log
    voice.md           the brand voice (a foundation, approved like colour)
    copy/              copy-system outputs: glossary, string inventory, linter, proof
    snapshots/         approved renders, one folder per item, the "approved look"
  loops/<run>/         design-loop runs: brief, bar, ref/, renders/, progress
AGENTS.md              (repo root) the design gate rule, read by every agent
```

The hub's page code goes in your app's routes (e.g. `src/app/design/`). Generated renders and pending snapshots are ignored via a `# design-gate` block the skills add to your root `.gitignore`. Renderer cache: `~/.cache/design-gate` (outside the project).

## Cost

- design-dna: about 4 to 8 fresh-context runs per extract, once per style.
- design-hub: ordinary session work, no critics.
- design-loop: `lean` up to 12 runs per piece, `standard` up to 32, `max` up to 96. Cheap checks run first and stop the round on fail; the round cap hands the decision back to you.

## Update

`npx skills update`, `/plugin marketplace update yosuyuwo`, or `git pull && ./install.sh ...`.

## License

MIT
