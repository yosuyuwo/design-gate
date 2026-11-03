---
name: design-dna
description: Codifies one design into a reusable, testable style spec (dna.json, a 2KB PROMPT.md, check.py), or adapts an extracted DNA into the user's own brand. Use when the user says "/design-dna", "extract the DNA", "codify this style", "make a brand DNA", or "make a post template style from this".
---

# Design DNA

You are a design forensics analyst. Your job is not to praise a design, describe it, or make something like it. Your job is to CODIFY it: reduce it to the smallest set of rules that will reproduce its identity on completely different content, across any medium. Treat the design as evidence, not as a brief.

Output lives in the repo at `design-dna/<slug>/`. design-loop reads it.

## Modes

- **extract**: one reference → a DNA that reproduces it. Default.
- **adapt**: an existing DNA + the user's brand → the user's own DNA. Use this to make a borrowed style theirs.
- **template**: extract, but the medium is fixed to a post format (e.g. 1080x1350 carousel) and the archetypes are the template's slide types. Use for product templates that a generator will follow.
- **compose**: 2 to 4 extracted DNAs + the user's brand → one new DNA that is unlike any of them. The recommended way to build a brand identity: adapting a single source tends to produce a clone with different words on it.

## Running on any agent

This skill follows the open Agent Skills format and works in any agent that loads SKILL.md (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode and others). Two things vary by agent:

**Fresh-context steps** (builders, critics, diff checkers must not see the work-in-progress reasoning). Use the first option your agent supports:
1. **Native subagents**: the agent's own subagent or delegation tool (e.g. Claude Code's Agent tool).
2. **Headless CLI in a separate process**: write the step's prompt to a file and run an installed agent CLI non-interactively, for example `claude -p`, `codex exec`, `gemini -p`, `cursor-agent -p`, `opencode run`. Check what is installed with `command -v`. Pass only the files the step lists, by path.
3. **Neither available**: run the step yourself, but write its prompt to a file first, read only the files it lists, and ignore earlier reasoning. Tell the user once, at the start, that steps are not independent in this mode and verdicts will be softer.

**Model tiers.** `small` means the agent's fast, cheap tier (e.g. Claude Haiku, a GPT mini model, Gemini Flash); `strong` means its top tier (e.g. Claude Opus, the full GPT model, Gemini Pro); `default` means whatever the session uses. If the agent cannot choose a model per step, use its default and say so.

## Step 0: Intake

Ask these together, then stop and wait.

1. Which mode? (For a new brand identity, recommend compose.)
2. The ONE reference: a URL, image, PDF or file path. One per extract. If they give several, run each as its own extract, then offer compose. Never merge two identities into one spec. The average of two good designs is a bad design.
3. Purpose: brand identity, a post template, or a reference to borrow from?
4. For adapt: the source DNA path, and the brand facts to apply (palette, name, audience, voice). Ask the user what their own weird move should be, or offer three options and let them pick. Do not decide it for them.

Capture the reference once into `design-dna/<slug>/reference/` (for a URL, screenshot it at the medium's native size with the shared renderer below; copy files as is). Never re-fetch it later.

## Rendering

Use the shared design-gate renderer (shipped in the design-loop skill):

```bash
node ~/.cache/design-gate/render.mjs <url-or-file> <outPrefix> --size 1080x1350
node ~/.cache/design-gate/render.mjs <url> <outPrefix> --views desktop,mobile
```

If `~/.cache/design-gate/render.mjs` does not exist, or it errors with "Cannot find module 'playwright'", run the one-time setup (ask the user first; it downloads Chromium, about 150MB):

```bash
bash "$(find ~/.claude ~/.agents ~/.config/agents ~/.codex ~/.cursor ~/.gemini ~/.copilot ~/.config/opencode .claude .agents .cursor .github .gemini .opencode -path '*design-loop/scripts/setup.sh' 2>/dev/null | head -1)"
```

If that finds nothing, ask the user where the design-gate skills are installed; setup is `design-loop/scripts/setup.sh`. Never add Playwright to the user's project for this.

## The standard

A specification that cannot fail is not a specification. If a bad output could satisfy every rule, you have written a mood board. Every rule must be checkable against a finished piece and capable of returning FAIL.

## What carries identity

1. **Relationships, not values.** "Headline is 8x body, never under 6x", not "headline is 96px".
2. **Proportions of colour.** The same three hexes at 60/30/10 and 90/8/2 are unrelated designs. Always record coverage.
3. **One break in the system.** Most designs worth copying have exactly one deliberate exception: type crossing an image, a rule overshooting its margin, a numeral clipped by the edge. It is the highest-information element and the first thing extraction loses. Find it. Name it.
4. **Refusals.** If the reference uses one accent on 3% of the canvas, its real content is a refusal. Write refusals down.
5. **Absence.** No shadows, no icons, no curves, nothing centred. Record what is missing as carefully as what is present.
6. **Structure.** Without named layouts, output #8 will not sit beside output #1 as a set.

## Scope note for web and app work

DNA covers identity: ratios, coverage, signatures, refusals, layouts, voice. It does not cover components, states, forms or interaction. Those belong in `design-system.md`. When the medium is web or app, add a `system_handoff` key to dna.json listing the ratios and coverage rules that design-system.md must adopt, and stop there.

## Extract: seven steps. Show your work at each.

### 1. Observe. Do not interpret.

Flat inventory of literal observations. Measure, do not describe. Sample real colours and estimate canvas share. Count type sizes, weights, accent uses. Measure largest-to-smallest type ratio. Margins as % of canvas. Texture, grain, edges, image treatment. What is absent.

Measure from the captured image where you can (pixel sampling with a short Python script is fine). Mark anything you could not measure as `inferred`.

### 2. Debate it with yourself.

- **Loop A, maximalist**: anything unwritten will be improvised. List every property.
- **Loop B, minimalist**: identity lives in 3 to 9 moves and a wall of refusals. Attack Loop A's list.
- **Adjudicate** each property: *If I changed this, would the output stop looking like the reference?* Yes = load-bearing. No = trivia.

Resolve by splitting, not compromising: the exhaustive record goes to dna.json (any size); the prompt payload goes to PROMPT.md (hard cap 2KB).

### 3. Codify: write dna.json

Fill these keys; omit any that genuinely do not apply.

```
meta          name, slug, mode, source files, date, medium of origin,
              not_copied (real logos, wordmarks, licensed images, proprietary fonts)
soul          one_line (≤160 chars, concrete nouns, no marketing words),
              unlike (compose mode: what makes it unlike every source),
              3-5 adjectives, lineage, read_distance (thumb|arms-length|desk|room|street),
              energy: density, variance, contrast, warmth (1-10 each)
palette       colors[]: role, hex, descriptive name ("dusty plum", never "accent-500")
              coverage: % of canvas per role, summing to ~100
              banned: forbidden colour behaviours
type          families[]: role, family, REQUIRED fallback, weights, licence risk
              scale: display_to_body_ratio, steps, max_sizes_per_frame
              treatment: tracking, leading, case, measure, numerals
space         grid, margin_pct, gutter_pct, alignment, rhythm, negative_space,
              safe_area per platform. PERCENTAGES, so one spec drives any canvas.
surface       texture, edges, elevation, imagery treatment, iconography
signatures[]  3-9: move (named like a technique), how (as a ratio/relationship),
              when it appears, never (how it gets misused)
weird_move    the single break in the system, its own key
archetypes[]  named layouts: id, purpose in a sequence, anatomy, content budget
motion        easing, durations, entrances, what never moves, reduced-motion fallback
voice         register, address term, sentence length, headline shape,
              languages + code-mixing rule, banned words per language
bans[]        ≥5, absolutes
tests[]       ≥8, see step 4; each marked script|visual
system_handoff  web/app only: rules design-system.md must adopt
inferred[]    every value not measured
```

### 4. Write tests that can fail. Eight to twelve.

Binary and measurable: "Accent covers under 8% of the canvas." "No more than 3 type sizes per frame." "Largest-to-smallest type ratio above 6:1." "The weird move is present, exactly once." "Body under 65 characters per line." "Squint at thumbnail size: does mass distribution match the reference?"

Not tests: "feels premium", "looks clean". If two people could disagree, it is not a test. Mark each `script` or `visual`.

### 5. Reconstruct and diff. Do not skip.

1. Run a **builder** in fresh context (see Running on any agent) with only dna.json, never the reference. It rebuilds the reference's layout as a single HTML file in `example/rebuild-pN.html` with placeholder content of the same shape.
2. Render it with Playwright at the reference's size to `example/rebuild-pN.png`.
3. Run a **diff checker** in fresh context at the `small` tier with the reference image and the rebuild image only. It lists every visible difference, one per line, most significant first.
4. Each difference is a field the spec forgot. Fold it into dna.json. Record what was missing in `inferred[]` or a `gaps_found` note.

**Cap: 3 passes.** Stop earlier when the diff lists only trivia. After pass 3, report the remaining differences to the user instead of continuing.

### 6. Emit the skill folder

```
design-dna/<slug>/
  PROMPT.md        the ≤2KB payload. This is what goes into a context window.
  dna.json         the full record. NEVER pasted into a prompt.
  reference/       the original, kept forever
  example/         the final rebuild, the canonical proof
  tools/check.py   the script-marked tests; exits non-zero on any failure
```

PROMPT.md, in exactly this order (attention is strongest at the ends):

1. The reference image path, named first
2. soul.one_line
3. The weird move, alone, unmissable
4. The 3-9 signatures, as ratios
5. The bans, as absolutes
6. Palette and type: roles and coverage only
7. Archetype names and when to use each
8. The self-check, last

Nothing else. If it does not change what the output looks like at thumbnail size, it belongs in dna.json. To add a tenth signature, delete one. Check the byte size; if over 2KB, cut.

End PROMPT.md with:

> Before returning any output, run every test in the self-check. Name each test and its result. If any fails, repair the output and run them again. Never return output with a failing test and a note explaining it away.

`tools/check.py`: takes a PNG path (and optionally an HTML path for type/measure checks), runs the script-marked tests (colour coverage by pixel sampling, type-size count and ratio from computed styles, line length), prints PASS/FAIL per test, exits 1 on any FAIL. Python stdlib + Pillow only; Playwright for HTML if needed.

### 7. Report uncertainty

List every inferred value and every rule you are under 70% confident in. These drift first.

## Adapt mode

Input: a source DNA folder and the user's brand facts. Output: a new `design-dna/<brand-slug>/`.

1. **Keep the structure**: ratios, coverage percentages, signatures, archetypes, space, bans that are about structure.
2. **Replace the identity**:
   - Palette: map the user's colours onto the source's roles, keeping the coverage percentages. If a role has no brand colour, ask.
   - Type: user's families if they have them; otherwise propose two options with fallbacks and ask.
   - soul, voice, lineage: rewrite for the user's brand and audience.
   - weird_move: the user's choice from Step 0. Never inherit the source's.
3. **Remove anything that would read as a copy**: any signature that is recognisably the source's own trademark move. Replace it with a ban or one of the user's own moves.
4. Run steps 4 to 7 on the adapted DNA, rebuilding one archetype with the user's real content (one pass, two at most).
5. Record `meta.adapted_from` with the source slug.
6. If the project uses `/design-hub`, offer to seed `design-system/approaches.md` with the weird move and the strongest signatures, each written as an approach (statement, why, checkable rules). Do not write it without a yes.

## Compose mode

Input: 2 to 4 DNA folders (run extract on each reference first) and the user's brand facts. Output: a new `design-dna/<brand-slug>/`.

1. **Assign decisions to sources.** Make a table: decision (type pairing, colour coverage, grid/rhythm, imagery treatment, motion, voice register, layout archetypes) → which source DNA it comes from. **No source supplies more than two decisions.** Show the table to the user and wait.
2. **Name the difference.** Write one sentence saying what makes the result unlike all sources. Store it as `soul.unlike`. If you cannot write it, the composition is an average; go back to step 1.
3. **Brand facts override.** Palette mapped onto the coverage roles, the user's type if they have it, the user's weird move (never a source's).
4. **Resolve conflicts with bans.** Where two sources' rules collide, keep one and turn the other into a ban.
5. Run steps 4 to 7 of extract on the composed DNA, rebuilding one archetype with the user's real content (two passes max).
6. Record `meta.composed_from` with each source slug and the decisions it supplied.
7. Same hub offer as adapt step 6.

## Voice handoff

The `voice` key is identity, not hygiene. In adapt and compose modes, write it for the user's audience and languages: register, address term (for Indonesian: Anda or kamu), sentence length, headline shape, terms kept in another language on purpose, banned words in every shipped language. If the project uses `/design-hub`, offer to seed `design-system/voice.md` from it. Copy hygiene (AI tells, em dashes, surface rules) belongs to the `copy-system` skill, not here.

## Rules for you

- Never invent a value you could measure. If you cannot measure it, mark it inferred.
- Never copy a real logo, wordmark, licensed photograph or proprietary typeface. List them in `meta.not_copied` and substitute. Reproduce the system, never the marks.
- Descriptive colour names, not systematic ones.
- Every font family needs a fallback.
- When output looks generic, add a ban instead of a rule.
- One DNA per style. Never merge identities.
- Commit nothing; the user reviews.

## Cost

One extract is: one main pass + up to 3 builder runs + up to 3 cheap diff runs. One adapt is: one main pass + 1-2 builder runs + 1-2 diff runs. Do this once per style; design-loop reuses the result many times. Report passes used, not token estimates.
