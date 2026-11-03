---
name: design-hub
description: Sets up and runs a reviewable design system hub (an in-app /design route or Storybook) with foundations, components, specimen test pages, a recorded approaches log and an approval gate, so the team agrees the system before features are built. Use when the user says "/design-hub", "design hub", "set up the design system route", "review the design system", "approve a component", or "record a design approach".
---

# Design Hub

One place where anyone on the team can open a URL and see the whole design system rendered for real: foundations, every component in every state, test pages built only from the system, and the approaches that make the brand what it is. Nothing is "done" until a reviewer approves it there, and features are not built on unapproved parts.

## Commands

The user may name one (as a slash command or in plain words, depending on the agent); otherwise infer from context.

| Command | What it does |
|---|---|
| `setup` | First-time install of the hub in this repo (new or existing project) |
| `audit` | Existing projects: inventory what is already in the code, load it into the hub as draft |
| `add <item>` | Add a foundation, component, pattern or specimen to the hub |
| `approach <name>` | Record a design approach (e.g. "writer's window") |
| `review` | Prepare a review: what changed since last approval, with a checklist per item |
| `approve <item> --by <name>` | Mark approved, snapshot it as the approved look |
| `status` | Print the gate: what is approved, in review, draft, blocking |

## Source of truth

All design-gate state lives in one `design-gate/` folder at the repo root, shared with the design-dna and design-loop skills. The hub renders from `design-gate/system/`; nothing about status lives only in the UI. The hub's page code lives in the app (e.g. `src/app/design/`), because the framework needs it there.

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

During setup, ignore generated files. In the project's root `.gitignore` (create it if missing), add this block if it is not already there. Add only the missing lines; never rewrite or reorder the rest of the file, and never create a `.gitignore` inside `design-gate/`:

```
# design-gate
design-gate/loops/*/renders/
design-gate/system/snapshots/*/pending-*
```

`manifest.json` shape:

```json
{
  "hub": { "kind": "route", "path": "/design", "guard": "NEXT_PUBLIC_DESIGN_HUB" },
  "library": { "name": "shadcn", "path": "src/components/ui" },
  "gates": ["foundations", "components", "specimens"],
  "items": [
    {
      "id": "button",
      "layer": "components",
      "status": "draft",
      "source": "src/components/ui/button.tsx",
      "hubPath": "/design/components/button",
      "checklist": ["all variants x states shown", "focus ring visible on cream bg", "long Indonesian label wraps cleanly"],
      "approvedBy": null,
      "approvedAt": null,
      "approvedCommit": null
    }
  ]
}
```

Statuses: `draft` → `in-review` → `approved` (or `changes-requested`). Any edit to an approved item's source sets it back to `in-review` (see Gate).

## setup

### 1. Detect

Report in one block, then continue unless something blocks:
- Framework and router (Next.js app/pages router, Vite, Remix, Astro...), styling (Tailwind, CSS vars, CSS-in-JS), component folder.
- Existing Storybook? Existing tokens (tailwind config, CSS variables, theme file)?
- `design-gate/dna/` present? Which slug applies?
- New project (little or no UI yet) or existing (UI already in use)?

### 2. Choose the UI library

Detect first: `components.json` (shadcn), `@radix-ui/*`, `@base-ui-components/*`, `@mui/*`, `@mantine/*`, `@chakra-ui/*`, `@heroui/*`, `@ark-ui/*`, or none.

- **Existing project with one library in use:** keep it, state it, do not ask. If two or more are mixed, list where each is used and ask which one the system standardises on; the rest become `replace` items in the audit.
- **New project or no library yet:** ask once, with this recommendation order and one line each:
  1. **shadcn/ui** (recommended for brand-heavy work): components are copied into the repo, so every one can carry the brand; Tailwind + CSS variables map straight onto DNA tokens; accessible primitives underneath.
  2. **Vanilla** (own components, CSS variables or Tailwind only): best for marketing sites and small surfaces where a library would be mostly unused. Accessibility of dialogs, menus and popovers is on us, so pair with a headless primitive (Radix or Base UI) for those few.
  3. **Headless only** (Radix, Base UI, Ark): full styling control, no copied component code; more to build.
  4. **Styled kits** (MUI, Mantine, Chakra, HeroUI): fastest to a working app, hardest to make look unique; theme overrides fight the brand. Only if speed beats identity.
  Wait for the answer.

Record the choice in `manifest.json` as `"library": { "name": "shadcn", "path": "src/components/ui" }`. Every component item's `source` must live under that path or be explicitly marked `custom`. Tokens always live in CSS variables (or the library's theme mapped from them), never hardcoded in components.

### 3. Choose the hub kind

Default: **in-app route** at `/design`. It uses the app's real fonts, providers, tokens and data shapes, ships on every preview deployment colleagues already open, and needs no second build.

Use **Storybook** instead when: the project already has it, components are shared across several apps, or the app is not a web app with routes. Same `design-gate/system/` folder either way; only the rendering surface changes.

State which you picked and why in one line. Do not ask unless both are equally plausible.

### 4. Guard it

The hub must not be public in production.
- Route: render only when `process.env.NEXT_PUBLIC_DESIGN_HUB === '1'` (or the framework's equivalent), else return not-found. Set the flag in local dev and preview environments only. Mention it to the user so they set it on their hosting.
- Add `<meta name="robots" content="noindex">` on every hub page.

### 5. Build the hub pages

Route kind (adapt paths to the framework):

```
/design                      overview: principles, approaches summary, gate status board
/design/approaches           approaches.md rendered, each with live do/don't examples
/design/foundations          colour (with coverage rules), type scale, spacing, radius,
                             elevation, motion, imagery/scenery, iconography
/design/voice                voice principles, register, do/don't pairs, glossary,
                             microcopy patterns rendered in real components
/design/components/[id]      one page per component
/design/patterns/[id]        composites: forms, toolbars, empty states, dialogs
/design/specimens/[id]       test pages: realistic screens built only from system parts
```

Every hub page has the same frame:
- **Status badge** from manifest (draft / in review / approved by X on date / changes requested).
- **"What to check"** list from the item's checklist, written for a non-developer reviewer.
- **Source link** to the file.
- Background toggle: default surface, alternate surface, and any brand scenery, so every item is seen on every background it will actually sit on.
- Viewport presets (mobile / tablet / desktop) via a width-constrained frame.

Component pages show a matrix, not a demo: every variant x every state (default, hover, focus, active, disabled, loading, error, empty) x sizes. Force hover/focus states visually with a class or data attribute so they are visible without interaction. Include stress cases: long text, Indonesian and English copy, missing image, zero/huge numbers.

Storybook kind: same content as stories. Foundations and approaches as MDX docs pages, components with a "States" story showing the matrix, specimens as full-page stories, status shown via a `parameters.status` badge read from manifest.json.

### 6. Seed content

- **New project with a DNA:** derive tokens from `design-gate/dna/<slug>/dna.json` (palette roles with coverage, type ratio and steps, space percentages) and its `system_handoff`. Seed approaches.md from the DNA's weird move and signatures. Build only a minimal base set: button, input, card, dialog, toolbar, plus one specimen.
- **New project without a DNA:** suggest running `/design-dna` first. If the user declines, build foundations from their stated palette and type and mark everything draft.
- **Existing project:** run `audit` (below) instead of inventing.

### 7. Write the project rule

Append to the project's `AGENTS.md` (create if missing). AGENTS.md is the cross-agent instructions file read by Codex, Cursor, GitHub Copilot, OpenCode and others:

```markdown
## Design gate
- Design system source of truth: design-gate/system/manifest.json. Hub: /design (needs NEXT_PUBLIC_DESIGN_HUB=1).
- Build feature UI only from items with status "approved". If a needed item is draft or missing, stop and say so; offer to add it to the hub instead of inventing one-off UI.
- Editing an approved item's source sets it to "in-review" in manifest.json.
- Follow design-gate/system/approaches.md and design-gate/system/voice.md. Use design-gate/system/copy/glossary.md terms only.
- Write or change any user-facing string with the copy-system skill, constrained by voice.md, then run design-gate/system/copy/lint_copy.py. No em dashes, no AI tells, no brand-banned words.
```

This is what enforces the gate in every future session, with or without this skill loaded.

Agents with their own instructions file need a pointer so they read it too. If the repo has (or the user uses) Claude Code, ensure `CLAUDE.md` contains the line `@AGENTS.md`; for Gemini CLI, the same line in `GEMINI.md`. Create those files with only that line if missing and the user uses that agent. Do not duplicate the rules into them.

### 8. Write design-gate/README.md

For colleagues, not developers: the hub URL per environment, the review order (foundations, then components, then specimens), how to leave feedback (PR comments, or whatever the team uses: ask once), and what "approved" means.

## Voice

Voice is a foundation: approved before components, because every component carries copy (button labels, errors, empty states, chart titles). The work is split between two skills. Do not duplicate what copy-system already does.

| Owned by | What |
|---|---|
| **copy-system** | The pipeline: string inventory keyed by component / i18n key / selector, surface classification (marketing, app UI, dashboard, transactional), benchmark, de-slop, surface rules, the linter, `glossary.md`, delivery into the i18n/strings files, the swap wall and the proof row |
| **design-hub** (this skill) | `voice.md` (who the brand sounds like), brand and Indonesian extensions to the linter, where the files live, the `/design/voice` page, and the approval gate |

copy-system's rules are the floor for every string. `voice.md` decides tone wherever those rules leave room, and adds brand bans on top. When they conflict, the stricter rule wins (e.g. copy-system bans em dashes; voice.md cannot allow them).

**Check it is installed** during setup: look for a `copy-system` skill (older installs: `landing-copy-system`). If missing, tell the user the voice layer is limited to `voice.md` plus these fallback rules until they install it: sentence case, verb + object buttons, errors say what happened and what to do, empty states say what goes here plus one action, no em dashes.

### Files

copy-system's outputs are pointed into the design system folder so the hub can render them:

```
design-gate/system/
  voice.md              brand voice (this skill)
  copy/
    glossary.md         copy-system's glossary, extended per language
    inventory.json      copy-system's string map: key, surface, before, after, screen
    lint_copy.py        copy-system's linter + brand extensions (below)
    proof.json          latest proof row: sources, strings touched, score before -> after,
                        em dashes before -> after
```

The approved strings themselves live where the app reads them (i18n files, strings module). `inventory.json` is the record, not the runtime source.

### voice.md

Seed it from the DNA's `voice` key if one exists, otherwise interview the user (one message, wait):
1. Who reads this product, and who should it sound like to them? (a person, a publication, a role)
2. Which languages ship? For Indonesian: address the user as **Anda** or **kamu**? Is English mixed into Indonesian UI, and where?
3. Three words it must sound like, three it must never sound like.
4. One product the team thinks has the right voice (copy-system uses it as one of its benchmarks).

Write:

```markdown
# Voice

**One line.** (who it sounds like, to whom)

**Register.** formal / plain / warm; address term (Anda / kamu / you); sentence length target.

**Is / is not.**
| Is | Is not |
|---|---|
| plain like a good editor | cheerful like a growth app |

**Per surface** (tone only; copy-system's surface rules still apply underneath)
- Marketing: ...
- App UI: ...
- Errors: ...
- Empty states: ...
- Dashboards: ...
- Notifications and email: ...

**Languages**
- Default language, and the code-mixing rule.
- Terms kept in another language on purpose, and why.

**Banned** (brand-specific, per language; extends the linter)
- en: ...
- id: ...

**Do / don't pairs** (5 to 8 real product strings, each naming the rule it shows)
```

Starter Indonesian ban list (copy-system's linter is English-only; edit per brand): "solusi terbaik", "solusi lengkap", "inovatif", "revolusioner", "di era digital", "di zaman sekarang", "memudahkan Anda", "tingkatkan produktivitas", "dengan mudah dan cepat", "dalam genggaman", "jangan lewatkan", "nikmati kemudahan", "secara efektif dan efisien", "fitur unggulan", "satu platform untuk semua", "yuk" (unless the register is deliberately casual).

### Glossary and linter extensions

- `glossary.md`: use copy-system's glossary format, with one column per shipped language plus a "Never" column. Example row: generated social post → en "post", id "postingan", never "content, konten, asset".
- `lint_copy.py`: start from copy-system's linter unchanged, then add these word lists, loaded at runtime: `voice.md` banned lines (each language), and `glossary.md` "Never" terms. Match case-insensitively, report hits under their own class (`brand-ban`, `glossary`). Any brand-ban or glossary hit fails, same as an em dash.

### Running the voice layer

**Once, to set the voice (part of foundations):**
1. Write `voice.md` and `glossary.md`. User reviews them.
2. Build the microcopy matrix (below) with placeholder strings.
3. Run copy-system on the matrix strings with `voice.md` and `glossary.md` as constraints. Output goes to `inventory.json` and the i18n files; proof to `proof.json`.
4. Voice is ready for review when the matrix passes the extended linter.

**Per item, whenever a component, pattern or specimen is added or changed:** run copy-system on that item's strings only (surface classified by copy-system), then the extended linter. Never re-run the whole product's copy for one item.

**Existing projects (audit):** run copy-system's inventory and linter across the app for a baseline score. Do not rewrite yet; rewrites happen item by item as each one goes through review.

### /design/voice page

- The one line, is / is-not table, per-surface tone, languages rule.
- The glossary, rendered as a table.
- **Microcopy matrix** built from real components, in every shipped language, one row per surface: primary and destructive buttons, confirm dialog, inline field error, empty state, success toast with undo, long-running progress message, notification, a dashboard metric label and chart title, a marketing hero line. Reviewers approve the voice by reading this.
- **Swap wall** from `inventory.json`: before and after per string, grouped by screen. Reads "before" from the record, "after" from the live i18n source, so it cannot drift.
- **Proof row** from `proof.json`.

### Copy gate

- **Voice** cannot be approved until `voice.md` and `glossary.md` exist, the matrix renders in every shipped language, and it passes the extended linter.
- **A component, pattern or specimen** cannot be approved while its strings fail the extended linter. `review` runs it and puts the score and any hits in the review note.
- Approving a component approves its copy. Editing an approved string sets that item back to `in-review`.

## Imagery and illustration

If the brand uses illustration or scenery (e.g. a recurring background world), it is a foundation too. If the `illustration-graphics-system` skill is installed, use it to define the cast or scenery set, construction rules, art palette and asset inventory, then render the set on `/design/foundations#imagery` with the approach that governs where it may appear.

## audit (existing projects)

1. Inventory components, tokens and one-off styles. For copy, run copy-system's inventory and linter for a baseline (see Voice); note where strings live (i18n files, hardcoded JSX, CMS). Flag: hardcoded colours and sizes, near-duplicate components (three button variants in three folders), components that differ from the DNA's ratios.
2. Report the inventory as a short table: item, where it lives, issues, proposed action (keep / merge / replace).
3. Wait for the user to confirm actions. Do not refactor yet.
4. Add every kept item to the manifest as `draft` and render it in the hub as it is today. The hub shows the current truth first; fixes come through review.

## add

Add the item to manifest.json, build its hub page, write its checklist (3 to 6 lines, each checkable by looking), set status `draft`. For a specimen, build it only from existing system items; if it needs something that does not exist, list the missing items instead of inventing them inline.

### Specimens: test pages for the system

Specimens prove the system holds up on real screens before features are built. Pick screens that stress it:
- the product's most important screen (e.g. the editor)
- the densest screen (settings, tables)
- the emptiest screen (first-run, empty state)
- the marketing hero
- a failure state (error, offline, rate-limited)

Use realistic content in the product's languages, never lorem ipsum. A specimen passes review when it looks right and contains no one-off styles; any one-off is a missing system item.

## approach

Approaches are the decisions that make the brand recognisable and that a component library cannot express on its own. Record each one in `design-gate/system/approaches.md`:

```markdown
## Writer's window
Status: approved · Owner: Yosua · Since: 2026-11-03

**Statement.** Terbit screens are seen through a writer's window: a quiet scenery
image sits behind the working surface, as if the desk faces a window.

**Why.** Writing is solitary and long; the view gives calm and place. It separates
Terbit from flat white SaaS editors.

**Rules** (checkable)
- [hard] Scenery appears on landing hero, auth, empty states and the studio backdrop; never behind dense data (tables, settings).
- [hard] Working surfaces sit on an opaque cream (#FAF8F0) panel over the scenery; text never sits directly on the image.
- [hard] Scenery is muted: no saturated sky blues; overlay keeps contrast of panel edges visible.
- [soft] Time of day can follow the user's local time (dawn / day / dusk / night).

**Do / don't.** Live examples on /design/approaches#writers-window.

**Applies to:** landing, auth, studio, empty states.
```

Then add a live do/don't pair to `/design/approaches`. Rules tagged `[hard]` are added to every design-loop `bar.md` in this repo automatically (see design-loop).

## review

1. Diff `design-gate/system/` and every item's `source` against each item's `approvedCommit`. List what changed.
2. Set changed items to `in-review`.
3. Render each changed item with the shared renderer (setup: see the design-loop skill's Render script section) into `design-gate/system/snapshots/<id>/pending-*.png`:
   ```bash
   node ~/.cache/design-gate/render.mjs <hubUrl><hubPath> design-gate/system/snapshots/<id>/pending --views desktop,mobile
   ```
4. Run copy-system on any changed strings, then `design-gate/system/copy/lint_copy.py` on the changed items.
5. Output a review note the user can paste into the PR or send to colleagues: hub links for each changed item, its checklist, before/after snapshot paths, and the copy lint score with any hits. Keep it short.

## approve

`approve <item> --by <name>`:
1. Refuse if the item uses anything that is not approved (e.g. a specimen using a draft button), or if `design-gate/system/copy/lint_copy.py` fails on its strings. Say what blocks it.
2. Set `status: approved`, `approvedBy`, `approvedAt` (today), `approvedCommit` (current HEAD).
3. Move pending snapshots to `design-gate/system/snapshots/<id>/approved-*.png` (render fresh if none).
4. Never approve on someone's behalf without their name. If the user approves their own work and the team has other reviewers, note it once.

## status (the gate)

Print:

```
Foundations   6/7 approved (voice in review)
Copy lint     4/5, 2 em dashes (studio-editor)
Components    9/14 approved · 3 in review · 2 draft (dialog, toast)
Specimens     1/4 approved
Blocking feature work: dialog, toast (used by: studio-editor, export flow)
```

Layer order is a gate: components cannot be approved before all foundations are; specimens not before the components they use. Feature work should start on screens whose specimen is approved.

## Workflow summary (for the user)

1. `/design-dna` → brand DNA (optional, recommended for new brands; compose mode for a unique one)
2. `design-hub setup` → UI library, hub, manifest, AGENTS.md gate
3. Foundations incl. voice, glossary and imagery → review → approve
4. Components → review → approve
5. Specimens → review → approve (use `/design-loop` here if a specimen needs to hit a reference)
6. Build features from approved parts only
7. Any change to an approved part goes back through review

## Cost

This skill does not spawn critic agents. It is ordinary build work plus renders. Use design-loop only on specimens that must match a reference, not on every component.
