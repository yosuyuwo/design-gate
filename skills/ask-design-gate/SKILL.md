---
name: ask-design-gate
description: Ask which design-gate skill or flow fits your situation, and where this project currently is in the flow. A router over design-setup, design-dna, design-hub and design-loop. Only routes, never builds.
disable-model-invocation: true
---

# Ask design-gate

You don't remember every skill and command, so ask. This skill answers "what should I run next?" and nothing else: it reads the project's state, names the skill and command, says why, and stops. It never builds, edits or approves anything.

## 1. Where is this project? (read only)

Check, quietly, and report in one short block:

| Look at | Tells you |
|---|---|
| `design-gate/system/decisions.json` | design-setup done? (`ui-library`, `hub-kind`, `file-layout`, `component-grouping`), and any `provisional` or `open` decisions |
| `design-gate/dna/*/` | a DNA exists? Extracted only, or composed/adapted into the brand (`meta.composed_from` / `meta.adapted_from`)? |
| `design-gate/system/manifest.json` | hub set up? Counts per layer and status |
| `design-gate/system/disconnects.json` | open ledger entries |
| `design-gate/loops/*/progress.md` | a loop in progress, paused at its round cap? |
| `AGENTS.md` | the design gate rule is installed |

Then say the single next step, with its command. If the user asked something specific, answer that instead, using the state as context.

## 2. The main flow: nothing → approved system → features

1. **`design-setup`**: once per project. UI library, native hub or Storybook, where component files live, how components are grouped. Skip nothing; say "you pick" and it records recommendations as provisional.
2. **`design-dna`**: once per brand. For a new identity: `extract` 2 to 3 references, then `compose`. One reference with `adapt` is quicker but closer to a copy. Skip it only if the brand is already fully specified and the team is happy with it.
3. **`design-hub setup`**: builds the hub, seeds foundations and base components, asks the visual decisions once with live comparisons, writes the checks and the AGENTS.md gate. On an existing project it runs `audit` first.
4. **Review, layer by layer**: `design-hub review` → send the note → `design-hub approve <item> --by <name>`. Order: foundations (incl. voice), then components, then examples. `design-hub decide` turns provisional decisions into decided ones.
5. **`design-loop`**: only on the 2 or 3 examples that must hit a reference (the hero, the main screen). Not on components: review handles those.
6. **Build features** from approved parts. The AGENTS.md gate makes later sessions stop instead of inventing UI.

## 3. On-ramps

| Situation | Go to |
|---|---|
| "It looks generic / has no taste" | `design-dna` compose from 2 to 3 references, then `design-hub approach` for the signature idea |
| "It works but every screen looks different" | `design-hub audit`: the ledger and duplicate detection show where |
| "We have a design system but nobody agreed it" | `design-hub setup` on the existing code, then review with the team |
| "This one screen needs to be great" | `design-loop` on that screen, after its parts are approved |
| "The copy sounds like AI / off-brand" | `design-hub` voice (voice.md, glossary, linter); copy-system does the rewriting |
| "Pilot users are confused" | Not a loop problem. Fix the flow from their feedback directly, then add the fixed screen as an example in the hub |
| "We need social post or slide templates" | `design-dna template`, one per template style |
| "I want to change an approved component" | Edit it, then `design-hub review`: it goes back to in-review automatically |
| "Which library / Storybook / folder layout?" | `design-setup` (or `design-hub decide` if already set) |
| "What's blocking us?" | `design-hub status` |

## 4. When not to use a skill

- **Don't loop components.** design-loop is the expensive one; components are agreed through review.
- **Don't extract a DNA from your own bland UI.** You'll codify the blandness. Extract references you admire, then compose.
- **Don't run design-setup again** to change one answer: use `design-hub decide <id> <option>`.
- **Don't approve your own work** if the team has other reviewers. The skill will let you, and say so once.
- **Small fixes** (a spacing tweak, one label) don't need any of these: edit, then `design-hub review`.

## 5. Companions (separate installs)

- **copy-system**: copy hygiene and rewriting; design-hub's voice layer sits on top of it.
- **illustration-graphics-system**: illustration or scenery sets; design-hub uses it for imagery foundations.

If one is missing, say what it would add and continue without it.

## 6. Cost, roughly

| Skill | Cost |
|---|---|
| design-setup, design-hub | ordinary session work, no extra agents |
| design-dna | about 4 to 8 fresh-context runs per extract, once per style |
| design-loop | lean up to 12 runs per piece, standard up to 32, max up to 96 |

## Rules

- Route, don't build. Name the next command and stop; the user runs it.
- Prefer one next step over a list. Give the full flow only when asked.
- If the state contradicts the flow (features built before anything was approved), say so plainly and suggest the on-ramp, not a restart.
