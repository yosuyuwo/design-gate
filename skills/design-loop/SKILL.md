---
name: design-loop
description: Builds a piece against a real-world reference, then runs gated fresh-context critic subagents with a round cap until ours wins. Use when the user says "/design-loop", "design loop", "run the critic loop", or "loop this against" a reference.
---

# Design Loop (budgeted)

Four phases: interview, preflight, teardown, loop. Do not skip ahead. Do not write product code during phases 1 to 3.

All loop state lives in `.design-loop/<run-name>/` at the repo root:

```
.design-loop/<run-name>/
  brief.md        # goal, pieces, budget (Phase 1)
  bar.md          # mechanisms from the reference (Phase 3)
  ref/            # reference renders, captured once
  renders/        # our renders, per piece per round: <piece>-r<N>-<view>.png
  progress.md     # live status
```

Suggest adding `.design-loop/*/renders/` to `.gitignore`.

## Running on any agent

This skill follows the open Agent Skills format and works in any agent that loads SKILL.md (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and others). Two things vary by agent:

**Fresh-context steps** (builders, critics, diff checkers must not see the work-in-progress reasoning). Use the first option your agent supports:
1. **Native subagents**: the agent's own subagent or delegation tool (e.g. Claude Code's Agent tool).
2. **Headless CLI in a separate process**: write the step's prompt to a file and run an installed agent CLI non-interactively, for example `claude -p`, `codex exec`, `gemini -p`, `cursor-agent -p`, `opencode run`. Check what is installed with `command -v`. Pass only the files the step lists, by path.
3. **Neither available**: run the step yourself, but write its prompt to a file first, read only the files it lists, and ignore earlier reasoning. Tell the user once, at the start, that steps are not independent in this mode and verdicts will be softer.

**Model tiers.** `small` means the agent's fast, cheap tier (e.g. Claude Haiku, a GPT mini model, Gemini Flash); `strong` means its top tier (e.g. Claude Opus, the full GPT model, Gemini Pro); `default` means whatever the session uses. If the agent cannot choose a model per step, use its default and say so.

## Phase 1: Interview

Ask exactly these four, together, then stop and wait.

1. What are you building, and how long or how big? Which files or routes in this repo does it touch?
2. Name something that already does this brilliantly. A specific URL, file or video I can open. If nothing comes to mind, say skip.
3. Any files I should work from? Design system, brand DNA (`design-dna/<slug>/`), script, existing draft. Paths please. If `design-dna/` exists in the repo, list what is there and ask which one applies.
4. Budget: `lean`, `standard` (default) or `max`?

If the reference is vague ("Apple's website", "good SaaS design"), push once for the specific page or section. A vague bar is the number one reason this method fails: the critic invents a comparison and approves everything on round one.

If they say skip on question 2, propose three candidate bars, one line each on why, and wait. If they do not answer, take the hardest one.

No answer on budget means `standard`. Write the answers to `brief.md`.

## Budget

| | lean | standard | max |
|---|---|---|---|
| Looped pieces | 1 | 2 | 4 |
| Round cap per piece | 3 | 4 | 6 |
| Brief + system critic tier | small | small | default |
| Craft critic tier | default | strong | strong |
| Builder tier | default | default | default |
| Viewports per craft check | 1 (desktop) | 2 (desktop + mobile) | 3 |
| Frames per animation check | 4 | 6 | 12 |

- **Looped pieces** are the ones the user would judge the work by (hero, key scene, title page). Everything else is built in a single pass to match the looped pieces, then gets one system-critic check.
- The round cap is a checkpoint, not a failure. See exit rules.
- If the user gave an explicit ceiling ("stop at 30 runs"), it overrides the table.

## Phase 2: Preflight

A check, not a question. Run it before any work and report in one block.

- **Reference.** Fetch or open it now. For a URL, capture it with the render script below into `ref/` at the budget's viewports. For a file, read it. If blocked or missing, say so and ask for another. Never re-fetch the reference during the loop; critics use `ref/`.
- **Render path.** Confirm we can render our output:
  - Site/UI: dev server command (check `package.json` scripts) and a Playwright screenshot. Start the dev server in the background if needed.
  - Animation: a frame filmstrip (Playwright timed screenshots or `ffmpeg -vf fps=...`).
  - Doc: a PDF render to PNG.
  No render means no craft critic.
- **Generation tools.** Name any the goal needs (image, video, voice) and confirm they are available. Note that paid generation re-runs on every rebuild of that piece.
- **Inputs.** Confirm the files from question 3 exist. If there is no design system file, say the system critic goes blind and offer to draft one from the existing code first.
- **Design hub.** If `design-system/manifest.json` exists, it is the design system: read it and `design-system/approaches.md`. List any draft or in-review items this goal would use and say they are not agreed yet. Ask whether to proceed (results may change after review) or approve them first via `/design-hub`.

Print: what is working, what is missing, **which critic goes blind**, and the plan:

```
Looped: <pieces> · Single-pass: <pieces>
Max agent runs: <looped pieces> x <round cap> x 4 = N
```

Wait for a go-ahead if anything is missing; otherwise continue.

### Render script

The renderer ships in this skill's `scripts/` folder; setup copies it to a shared cache outside the project, so it never touches the project's dependencies:

```
~/.cache/design-gate/render.mjs
```

Usage:

```bash
node ~/.cache/design-gate/render.mjs <url-or-file> <outPrefix> \
  [--views desktop,mobile,tablet] [--size 1080x1350] [--selector "#hero"] [--frames 6 --every 250]
```

- Pass only the viewports the budget allows.
- `--size` overrides views with one exact canvas (posts, slides).
- `--frames` captures an animation filmstrip: `<outPrefix>-f1.png` ... `-fN.png`.
- Local HTML files work: pass the file path.

If `~/.cache/design-gate/render.mjs` does not exist, or it errors with "Cannot find module 'playwright'", run the one-time setup (ask the user first; it downloads Chromium, about 150MB):

```bash
bash "$(find ~/.claude ~/.agents ~/.config/agents ~/.codex ~/.cursor ~/.gemini ~/.copilot ~/.config/opencode .claude .agents .cursor .github .gemini .opencode -path '*design-loop/scripts/setup.sh' 2>/dev/null | head -1)"
```

If that finds nothing, the script is at `scripts/setup.sh` next to this SKILL.md; run it from there. Never add Playwright to the user's project for this.

## Phase 3: Teardown

Read the reference properly and write 5 to 7 mechanisms to `bar.md`.

Mechanisms, not adjectives. "Feels premium" is useless. These are useful:
- headline is 5x body size, three type sizes total
- one accent colour, used at most twice per screen
- motion always resolves in one direction
- nothing animates for under 400ms
- whitespace above the fold is at least 40% of the frame

Every line must be something a critic can check by looking. Tag each line `[hard]` (must match) or `[soft]` (nice to match).

**If a brand DNA applies:** the brand wins over the reference. Drop any reference mechanism that conflicts with the DNA's bans, palette coverage or type ratio, and say which ones you dropped. Then append a `## Brand` section to `bar.md` with the DNA's weird move and its bans, all `[hard]`. The reference supplies craft; the DNA supplies identity.

**If `design-system/approaches.md` exists:** append every `[hard]` rule from approaches that apply to this goal under `## Approaches` in `bar.md`. Approaches win over the reference the same way the DNA does.

Show `bar.md` to the user and wait for approval or edits before continuing.

## Phase 4: Loop

Split the goal into pieces, up to the budget's looped-piece count. State which are looped and which are single-pass. Build single-pass pieces after the looped ones pass, so they inherit the winning direction.

For each looped piece, each round:

1. **Builder** — fresh context (see Running on any agent). Its prompt contains only: the piece's target files, `brief.md`, `bar.md`, the design system path, the brand DNA's `PROMPT.md` if one applies (never `dna.json`), the list of approved component ids from `design-system/manifest.json` if it exists (build only from those; report anything missing instead of inventing one-off UI), and on revisions the single named gap. Never the critic transcripts. It edits the repo files directly and reports which files changed.
2. **Render** — run the render script for the piece (use a selector to crop to the piece where possible). Save to `renders/<piece>-r<N>-<view>.png`.
3. **Copy lint** — if `design-system/copy/lint_copy.py` exists, run it on the piece's strings (otherwise copy-system's linter, if the skill is installed). Any fail is an automatic brief FAIL with the hit named as the gap; skip the critics this round (saves runs).
4. **Critics** — each in fresh context (see Running on any agent), at the budget's tier. Run in order and **stop at the first fail**:
   - **Brief critic**: gets `brief.md`, `design-system/voice.md` if it exists, and our renders. Does it do the thing, and does the copy sound like the voice? Ignore visual aesthetics.
   - **System critic**: gets the design system file and our renders. Objective adherence: tokens, spacing, type scale, components. If `design-system/snapshots/*/approved-*.png` exist for the components in view, give the critic those too: components must match their approved look. If a brand DNA applies, first run its `tools/check.py` on the render; any script FAIL is an automatic system FAIL with that test named as the gap, and the critic agent is skipped (saves a run).
   - **Craft critic**: gets `bar.md`, our renders and `ref/` renders, copied to neutral names (`A.png`, `B.png`, order randomised) so it does not know which is ours. Asks: which is better, the single biggest gap in the weaker one, and is that gap `major` or `minor`.

Each critic must reply in exactly this format, nothing else:

```
VERDICT: PASS | FAIL
GAP: <single biggest gap, one sentence, or "none">
SEVERITY: major | minor | none
```

Write each critic's prompt yourself, adapted to this specific goal. Do not reuse generic wording across different goals. Never give a critic file paths to source code.

Rules:
- Critics are harsh. Praise is not useful.
- Critics judge rendered output, never the code. Reading the implementation makes a critic evaluate intent instead of result.
- Binary verdicts, not scores. Scores drift upward every round.
- Brief and system critics must PASS outright.
- Craft passes if ours wins the blind comparison, or if the only remaining gap is `minor` and touches no `[hard]` line in `bar.md`.
- Any fail goes back to the builder with the single biggest gap named.
- If the same gap comes back two rounds in a row, tell the builder to try a structurally different approach, not a tweak.
- Commit nothing. The user reviews the diff.

### Exit rules per piece

- **Pass**: all three critics pass. Move on.
- **Round cap hit**: stop and show the user the best round's renders, the open gap, and the gap history. Ask: continue N more rounds, accept as is, or edit `bar.md`. Do not continue without an answer.
- **User stops**: stop immediately. Point to the best round and the files changed.

If a round regresses (a critic that passed before now fails), tell the builder to restore the previous round's approach for that aspect.

### progress.md

Update at the end of every round only:

```
# <run-name>
Budget: standard · Agent runs: 14 / 32 max

| Piece | Round | Brief | System | Craft | Status |
|---|---|---|---|---|---|
| hero | 3/4 | PASS | PASS | FAIL (major) | looping |
| how-it-works | 0/4 | – | – | – | queued |

## Gap history
- hero r1: craft — headline only 2.5x body
- hero r2: system — accent used 4x in viewport
- hero r3: craft — product shot reads as decoration, not proof
```

Use `skipped` for critics gated out by an earlier fail.

## Cost

There is no reliable self-reported token cost, so do not pretend to show one. Report agent runs used versus planned max, rounds, and pieces done.

If the user names a ceiling (runs, rounds or time), treat it as a checkpoint: pause and ask before continuing past it. Tell them plainly that the real brake is them watching and stopping the run.

## What breaks this

- A vague bar. By far the most common failure.
- The builder judging its own work. Critics need fresh context.
- A soft critic. Binary job, not a score.
- Critics seeing code or knowing which image is ours.
- Feeding critic transcripts back to the builder. Pass the single gap only.
- Running past the cap without asking. The cap exists to hand the call back to the user.
- Over-specifying. Every extra instruction is one fewer decision the model makes with its own judgment.
