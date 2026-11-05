# design-gate

Agent skills that make teams agree on a design before building it: brand DNA, an in-app design system hub with approvals, and a critic loop for key screens. Written to the open [Agent Skills](https://agentskills.io) format, so they work in Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and other agents that load `SKILL.md`.

| Skill | Job |
|---|---|
| `design-setup` | Asks the project questions once, before any design work: UI library, native hub or Storybook, where component files live, how the component list is grouped. |
| `design-dna` | Codify a style you admire into rules that can fail (`dna.json`, a 2KB `PROMPT.md`, `check.py`). Compose 2 to 4 of them into your own brand. |
| `design-hub` | A reviewable design system inside the app: a docs-style `/design` route (or Storybook) with foundations, voice, live component controls and generated props docs, examples in real device frames, a decisions log, a code-vs-DNA ledger, and an approval gate your team signs off on. |
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
design-setup   library, hub kind, file layout, component grouping     once per project
     │
design-dna     extract x2-3, then compose                              once per brand
     │
design-hub     setup → foundations + voice → components → examples
     │         decisions asked once, shown with real fonts; mismatches go in the ledger;
     │         review / approve at each layer
design-loop    on 2-3 key examples only
     │
build features from approved parts (enforced by the AGENTS.md gate)
```

Nothing blocks on an unanswered question: the skills use their recommendation, mark it `provisional`, and keep going. Provisional decisions and open ledger entries block approval, not the build.

### New project

1. `design-setup`: answer four questions (or say "you pick").
2. `design-dna`: extract 2 to 3 references, then compose them with your palette and audience.
3. `design-hub setup`: builds the hub from the DNA, creates base components with every size and state (buttons, fields, pickers, containers, skeleton), shows each open decision (type ratio, control heights, corners...) as a live comparison, asks once, and writes the checks and the AGENTS.md gate.
4. Foundations, voice and glossary: `review`, send the note to colleagues, `approve --by <name>`.
5. Components, then examples. Loop only the key examples with `design-loop`.
6. Build features. Sessions refuse to invent UI that is not in the approved system.

### Existing project

1. `design-setup`: detects your library and file layout and recommends keeping them.
2. `design-dna` as above, from your current brand plus references.
3. `design-hub setup` runs `audit`: asks once whether the DNA wins over the code, checks the DNA for conflicts with itself, measures your type scale and control sizes, flags missing props and mismatches into the ledger, and loads everything into the hub as draft. Nothing is refactored until you confirm.
4. Record what makes the product recognisable: `design-hub approach "<name>"`.
5. Fix and approve item by item; every ledger entry gets fixed or a named exception.
6. Loop the screens that matter most, then build.

## What it writes into a project

Everything goes in one folder, plus the gate and file-layout rules in `AGENTS.md` (agents only read it at the root):

```
design-gate/
  README.md            how to review, for colleagues
  dna/<slug>/          brand DNA: PROMPT.md, dna.json, tools/check.py, reference/, example/
  system/
    manifest.json      every item with its status, group and approval record
    decisions.json     every system decision, decided or provisional, and where it came from
    disconnects.json   the ledger: code-vs-DNA mismatches and gaps, open / fixed / exception
    approaches.md
    voice.md
    copy/              glossary, string inventory, lint_copy.py, proof
    checks/            generated checks, if the project has no test runner
    snapshots/         approved looks
  loops/<run>/         design-loop runs
AGENTS.md              design gate and file layout rules
```

The hub's page code goes in your app's routes (e.g. `src/app/(hub)/design/`). Generated renders and pending snapshots are ignored via a `# design-gate` block the skills add to your root `.gitignore`. Renderer cache: `~/.cache/design-gate` (outside the project).

## Cost

- design-dna: about 4 to 8 fresh-context runs per extract, once per style.
- design-hub: ordinary session work, no critics.
- design-loop: `lean` up to 12 runs per piece, `standard` up to 32, `max` up to 96. Cheap checks run first and stop the round on fail; the round cap hands the decision back to you.

## Update

`npx skills update`, `/plugin marketplace update yosuyuwo`, or `git pull && ./install.sh ...`.

## License

MIT
