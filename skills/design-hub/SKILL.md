---
name: design-hub
description: Sets up and runs a reviewable design system hub (a native docs-style /design route or Storybook) with foundations, voice, live component docs, real-frame examples, a decisions log, a code-vs-DNA ledger and an approval gate, so the team agrees the system before features are built. Use when the user says "/design-hub", "design hub", "set up the design system route", "review the design system", "approve a component", or "record a design approach".
---

# Design Hub

One place where anyone on the team can open a URL and see the whole design system rendered for real: foundations, voice, every component with live controls and generated docs, examples in real device frames, and the approaches that make the brand what it is. Nothing is "done" until a reviewer approves it there, and features are not built on unapproved parts.

Detail lives in `references/`. Read a reference file when its step comes up, not up front:

| File | Read when |
|---|---|
| `references/hub-layout.md` | building or changing hub pages, component pages, controls, docs, example frames |
| `references/decisions.md` | asking or recording any system decision (type, sizes, corners, motion...) |
| `references/full-pack.md` | creating foundations and base components, or auditing for gaps |
| `references/ledger.md` | auditing an existing project, or anything about code vs DNA |
| `references/voice.md` | setting the voice, glossary, copy linter, or the voice page |
| `references/frameworks.md` | before starting servers, editing config, or on Next.js / Windows |
| `references/fix.md` | running `fix` |
| `references/ci.md` | running `ci`, or when the user asks about pull request checks |

## Commands

The user may name one (as a slash command or in plain words, depending on the agent); otherwise infer from context.

| Command | What it does |
|---|---|
| `setup` | First-time install of the hub (new or existing project) |
| `audit` | Existing projects: inventory the code, fill the ledger, load everything as draft |
| `add <item>` | Add a foundation, component, pattern or example |
| `approach <name>` | Record a design approach (e.g. "writer's window") |
| `fix [item or entry] [--dry-run]` | Resolve open ledger entries in code: plan first, then fix item by item, check, diff, mark fixed. Never approves |
| `ci` | Install the GitHub Actions gate that runs the deterministic checks on pull requests |
| `decide <id> <option> --by <name>` | Confirm or change a decision (turns `provisional` into `decided`) |
| `review` | Prepare a review: what changed since last approval, with a checklist per item |
| `approve <item> --by <name>` | Mark approved, snapshot it as the approved look |
| `status` | Print the gate: approvals, open ledger entries, provisional decisions, what blocks feature work |

## Source of truth

All design-gate state lives in one `design-gate/` folder at the repo root, shared with design-setup, design-dna and design-loop. The hub renders from `design-gate/system/`; nothing about status lives only in the UI. The hub's page code lives in the app (e.g. `src/app/(hub)/design/`), because the framework needs it there.

```
design-gate/
  README.md            how to review, for colleagues (hub URL, review order, what approved means)
  dna/<slug>/          brand DNA: PROMPT.md, dna.json, tools/check.py, reference/, example/
  system/
    manifest.json      every item with its status and approval record
    decisions.json     every system decision: chosen, recommended, provisional or decided
    disconnects.json   the ledger: every code-vs-DNA mismatch and missing piece, open / fixed / exception
    approaches.md      the approaches log
    voice.md           the brand voice (a foundation, approved like colour)
    copy/              copy-system outputs: glossary, string inventory, linter, proof
    checks/            generated checks, if the project has no test runner
    snapshots/         approved renders, one folder per item
  loops/<run>/         design-loop runs
AGENTS.md              (repo root) the design gate rule, read by every agent
```

In the project's root `.gitignore` (create it if missing), add this block if it is not already there. Add only missing lines; never rewrite or reorder the rest, and never create a `.gitignore` inside `design-gate/`:

```
# design-gate
design-gate/loops/*/renders/
design-gate/system/snapshots/*/pending-*
design-gate/system/snapshots/*/diff-*
```

`manifest.json` shape:

```json
{
  "hub": { "kind": "route", "path": "/design", "guard": "NEXT_PUBLIC_DESIGN_HUB" },
  "library": { "name": "shadcn", "path": "src/components/ui" },
  "grouping": { "guide": "purpose", "groups": ["actions", "inputs", "navigation", "feedback", "overlays", "data-display", "layout"] },
  "gates": ["foundations", "components", "patterns", "specimens"],
  "items": [
    {
      "id": "button",
      "layer": "components",
      "group": "actions",
      "summary": "Starts an action. Use for the one or two things a screen is for.",
      "status": "draft",
      "source": "src/components/ui/button.tsx",
      "hubPath": "/design/components#button",
      "dependsOn": ["foundations:control-sizes", "foundations:colour"],
      "checklist": ["every size lines up with a field of the same size", "focus ring visible on every background", "long Indonesian label wraps cleanly"],
      "approvedBy": null,
      "approvedAt": null,
      "approvedCommit": null
    }
  ]
}
```

Statuses: `draft` → `in-review` → `approved` (or `changes-requested`). Any edit to an approved item's source sets it back to `in-review`; a pure file move does not (see review). Only hub items need entries: a private route section built from approved parts is not a hub item.

## setup

### 1. Project decisions first

Read `design-gate/system/decisions.json`. If `ui-library`, `hub-kind`, `file-layout` or `component-grouping` are missing, run the design-setup skill's questions now (load the skill; if it isn't available, read `../design-setup/SKILL.md`) before continuing, rather than stopping. Never ask any of them twice.

### 2. Detect

Report in one block: framework and router, styling, test runner, existing tokens (Tailwind theme, CSS variables, theme file), `design-gate/dna/` slugs, new or existing project. Read `references/frameworks.md` now if the project is Next.js or the machine is Windows, and before starting any server or editing config.

### 3. Guard it

The hub must not be public in production. Render it only when the guard flag is `1` (e.g. `NEXT_PUBLIC_DESIGN_HUB`), else not-found; `noindex` on every hub page and frame route. Tell the user to set the flag on local and preview environments only.

### 4. Build the hub frame

Follow `references/hub-layout.md`: docs-site layout (sticky two-row header with the product's real logo and "Design hub", grouped left list driven by the hash, scrolling item, right table of contents), browser-only rendering with a skeleton, component pages with Documentation / Props / Review tabs, live Controls, generated props docs, and examples in scaled iframes. The left list's groups come from `manifest.grouping`.

Storybook kind: same content as stories and MDX pages (see the end of `hub-layout.md`).

### 5. Seed the system

- **Foundations** from the DNA (`design-gate/dna/<slug>/dna.json` and its `system_handoff`) or the existing code: colour with coverage, type scale with a rule, spacing, radius, control sizes, elevation, motion, imagery, voice. Follow `references/full-pack.md` for control sizes and the type scale.
- **Decisions:** for every decision in `references/decisions.md`, work it out from the DNA and code first; render comparisons for the rest; ask once; fall back to `provisional`. Write all of them to `decisions.json`.
- **Base components** (new projects): button, icon button, button link, input, checkbox, tabs, card, dialog, toast, skeleton, each with the full-pack props, a spec, a playground and generated docs. Plus one example.
- **Voice:** follow `references/voice.md`.
- **Imagery:** if the brand uses illustration or scenery, it is a foundation. If the `illustration-graphics-system` skill is installed, use it to define the set, then render it on `/design/foundations#imagery`.
- **Existing project:** run `audit` instead of inventing.
- **No DNA on a new project:** suggest `design-dna` first. If declined, seed from the user's stated palette and type, mark everything draft.

### 6. Generate the checks

Copy this skill's `scripts/gate.mjs` to `design-gate/system/checks/gate.mjs`. It covers the shared files with no dependencies: manifest validity, sources, groups, layer order, ledger and decisions (`node design-gate/system/checks/gate.mjs`). Then add the project-specific checks to the project's test runner (or as node scripts next to it). Together they fail when:
- the manifest is invalid, a component has no `group`, or a `source` no longer exists,
- an approved item has an open ledger entry or depends on a blocking `open`/`provisional` decision,
- a ledger entry names an unknown item, or an exception has no note,
- tokens disagree with `dna.json` (colours, type scale with ratio and reasons, control sizes),
- a hub component has no playground or no extracted docs,
- the file-layout rules from design-setup are broken (see design-setup's `references/file-layout.md`).

Offer `ci` once the checks pass locally.

### 7. Write the project rule

Append to the project's `AGENTS.md` (create if missing):

```markdown
## Design gate
- Design system source of truth: design-gate/system/manifest.json. Hub: /design (needs NEXT_PUBLIC_DESIGN_HUB=1).
- Build feature UI only from items with status "approved". If a needed item is draft or missing, stop and say so; offer to add it to the hub instead of inventing one-off UI.
- Editing an approved item's source sets it to "in-review" in manifest.json.
- The DNA wins over the code. Record every mismatch in design-gate/system/disconnects.json, then fix it or give it a named exception.
- Decisions live in design-gate/system/decisions.json. Don't change a decided value without asking.
- Follow design-gate/system/approaches.md and design-gate/system/voice.md. Use design-gate/system/copy/glossary.md terms only.
- Write or change any user-facing string with the copy-system skill, constrained by voice.md, then run design-gate/system/copy/lint_copy.py. No em dashes, no AI tells, no brand-banned words.
```

Drop the DNA line if the `dna-vs-code` decision went the other way. If the user uses Claude Code or Gemini CLI, ensure `CLAUDE.md` / `GEMINI.md` contains `@AGENTS.md`; don't copy the rules into them.

### 8. Write design-gate/README.md

For colleagues, not developers: the hub URL per environment, the review order (foundations, then components, then examples), how to leave feedback (ask once which channel), and what "approved" means.

### 9. Verify

Start the app (see `references/frameworks.md` first), then run the renderer's walk mode over the hub:

```bash
node ~/.cache/design-gate/render.mjs <appUrl>/design design-gate/system/snapshots/_setup/hub --walk "aside a[href^='#']" --views desktop,mobile --expect "[data-hub-ready]"
```

Setup passes only when every section reports no console errors, no horizontal overflow, and the expected content marker (a 200 status alone proves nothing). Compare the skeleton with the loaded page at each width.

## audit (existing projects)

1. **Ask the policy once:** "When the code and the DNA disagree, does the DNA win?" (see `references/ledger.md`). Record as `dna-vs-code`.
2. **Audit the DNA against itself** for conflicting rules, and **check locks** (ask whether each locked screen stays locked before pinning).
3. **Inventory** components, tokens, one-off styles and copy (copy-system's inventory and linter for a baseline; note where strings live).
4. **Flag**, each as a ledger entry with status `open`:
   - hardcoded colours and sizes; sizes used outside the tokens; measured type ratios vs the DNA,
   - near-duplicate components (three buttons in three folders),
   - DNA vs code differences,
   - hover treatment that doesn't match what the element does,
   - missing props per component kind (`references/full-pack.md`),
   - controls that don't share heights.
5. **Report** a short table: item, where it lives, issues, proposed action (keep / merge / replace), plus ledger counts and the copy baseline.
6. **Wait** for the user to confirm actions. Don't refactor yet.
7. **Load** every kept item into the manifest as `draft` and render it as it is today. The hub shows the current truth first; fixes come through review.

## add

Add the item to the manifest (`layer`, `group`, `summary`, `source`, `dependsOn`, a 3 to 6 line checklist, each line checkable by looking), build its spec with variants, states and `reasons`, its playground and docs, and set status `draft`. When a component is promoted into `src/components` under colocate-and-promote, add it as a draft.

### Examples (specimens)

Examples prove the system holds up on real screens before features are built. Pick screens that stress it: the most important screen, the densest, the emptiest (first run), the marketing hero, a failure state. Use realistic content in every shipped language, never lorem ipsum. Build them only from system items; any one-off style is a missing system item, so list it instead of inventing it inline. Show them in real iframes at Desktop, Tablet and Mobile (`references/hub-layout.md`).

## approach

Approaches are decisions that make the brand recognisable and that a component library can't express. Record each in `design-gate/system/approaches.md`:

```markdown
## Writer's window
Status: approved · Owner: Yosua · Since: 2026-11-03

**Statement.** A quiet scenery image sits behind the working surface, as if the desk faces a window.

**Why.** Writing is solitary and long; the view gives calm and place.

**Rules** (checkable)
- [hard] Scenery appears on landing hero, auth, empty states and the studio backdrop; never behind dense data.
- [hard] Working surfaces sit on an opaque panel over the scenery; text never sits directly on the image.
- [soft] Time of day can follow the user's local time.

**Do / don't.** Live examples on /design/approaches#writers-window.

**Applies to:** landing, auth, studio, empty states.
```

Add a live do/don't pair to the Approaches page. `[hard]` rules are added to every design-loop `bar.md` in this repo. The component placement rule for the chosen grouping also lives here.

## fix

Follow `references/fix.md`. In short: classify every open entry (token swap, value change, missing prop, needs a decision, locked, not mechanical), show the plan and wait, then per item run a fresh-context builder limited to the named entries, re-run the checks, render and diff, and mark entries `fixed` only when their check passes. Changed approved items go back to `in-review`. It never sets exceptions, never edits the DNA to pass, and never approves.

## ci

Follow `references/ci.md`: copy the workflow template into `.github/workflows/design-gate.yml`, generate `design-gate/system/checks/run.mjs` if the checks aren't in the test runner, set the mode (`warn` or `block`) and CODEOWNERS for `design-gate/system/`.

## review

1. Diff `design-gate/system/` and every item's `source` against its `approvedCommit`, **with rename detection** (`git diff -M`). A pure move updates `source` and keeps the approval; any content change sets the item to `in-review`.
2. Render each changed item into `design-gate/system/snapshots/<id>/pending-*.png` (full page, every view the item needs):
   ```bash
   node ~/.cache/design-gate/render.mjs <hubUrl><hubPath> design-gate/system/snapshots/<id>/pending --views desktop,mobile --full
   ```
3. **Visual diff** against the approved look:
   ```bash
   node ~/.cache/design-gate/diff.mjs --snapshots design-gate/system/snapshots --max 0.5 --report design-gate/system/snapshots/_review/diff-report.json
   ```
   It writes `diff-*.png` (changed pixels in red) next to each pair and reports the % changed. A change is not a failure by itself: it tells the reviewer exactly where to look. A change on an item whose source didn't change is a regression from somewhere else (a token, a shared component): name the cause.
4. **Render QA** (layout, not taste): in fresh context at the `small` tier, give one checker the pending render and its diff image only. It answers per image `PASS` or `FAIL: <one sentence>` for layout breaks code checks miss: clipped or cut-off text, overlapping elements, z-index clipping (menus or popovers under other layers), elements outside their container, misaligned rows, broken spacing rhythm, missing images. Aesthetic judgement is out of scope here (that is the reviewer, or design-loop). A FAIL goes in the review note as a blocker.
5. Run copy-system on changed strings, then `design-gate/system/copy/lint_copy.py`.
6. Collect the item's open ledger entries and blocking decisions.
7. Output a short review note to paste into the PR or send to colleagues: hub links, snapshots and diff images with % changed, render QA results, lint score, and this checklist per item:

```
- [ ] Open ledger entries for this item: none
- [ ] Decisions for this item: none open or provisional
- [ ] Every component passed the missing-props audit, or the gap has a reason
- [ ] A field and a button of the same size line up
- [ ] Every text size is on the ratio or has a named reason
- [ ] Every size says where it came from: DNA, code, UI library or default
- [ ] Every component page has a summary, a live demo with code, and a props table
- [ ] Each variant has a sentence on when to use it; When to use answers the closest confusion
- [ ] The component has a place in the chosen grouping, by the rule in approaches.md
- [ ] The component's files follow the chosen layout; no route imports another route's private components
- [ ] Examples checked in real frames at all three widths
- [ ] The hub's server HTML holds only the skeleton, and it matches the real page at all three widths
- [ ] Copy lint passes
- [ ] Render QA: no layout breaks; every visual change in the diff is intended
```

Plus the item's own checklist from the manifest.

## approve

`approve <item> --by <name>`:
1. Refuse, saying what blocks it, if the item: uses anything not approved, has an open ledger entry, depends on an `open` or `provisional` decision that blocks approval, fails the copy linter, or has a render QA FAIL.
2. Set `status: approved`, `approvedBy`, `approvedAt` (today), `approvedCommit` (current HEAD).
3. Move pending snapshots to `approved-*.png` (render fresh if none) and delete that item's `diff-*.png`.
4. Never approve on someone's behalf without their name. If the user approves their own work and the team has other reviewers, note it once.

## status (the gate)

```
Foundations   6/8 approved · voice in review · control sizes provisional (from shadcn)
Decisions     9 decided · 2 provisional (type-ratio, skeleton-feel) · 0 open
Ledger        4 open (button 2, tabs 1, input 1; 3 fixable by `fix`) · 3 exceptions · 12 fixed
Copy lint     4/5, 2 em dashes (studio-editor)
Components    9/14 approved · 3 in review · 2 draft (dialog, toast)
Examples      1/4 approved
Blocking feature work: dialog, toast (used by: studio-editor, export flow)
```

Layer order is a gate: components can't be approved before all foundations are; patterns and examples not before the components they use. Feature work starts on screens whose example is approved.

## Workflow summary (for the user)

1. `design-setup`: UI library, hub kind, file layout, component grouping
2. `design-dna`: brand DNA (optional; compose mode for a unique one)
3. `design-hub setup`: hub, manifest, decisions, ledger, checks, AGENTS.md gate
4. Foundations (incl. voice and imagery), components, examples: each reviewed and approved
5. `design-loop` on key examples that must hit a reference
6. Build features from approved parts only; changes to approved parts go back through review

## Cost

This skill doesn't spawn critic agents: it is ordinary build work plus renders. Use design-loop only on examples that must match a reference, not on every component.
