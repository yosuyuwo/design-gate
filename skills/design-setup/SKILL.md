---
name: design-setup
description: Asks the project-level design questions once, before any design work - UI library, native hub or Storybook, where component files live, and how the component list is grouped - and records the answers for design-dna and design-hub. Use when the user says "/design-setup", "set up design-gate", "start the design workflow", or before a first design-hub setup.
---

# Design setup

The first step of design-gate. It answers the questions that apply to the whole project, even one that never builds a hub, and that shape what design-dna hands off and what design-hub builds. Visual choices (type ratio, control heights, corners, skeleton feel) are not asked here: they need real rendering, so design-hub asks them once the hub exists.

## 1. Detect (read only)

Report in one block:
- Framework and router (Next.js app or pages router, Vite, Remix, Astro...), styling (Tailwind, CSS variables, CSS-in-JS), test runner.
- UI library in use: `components.json` (shadcn), `@radix-ui/*`, `@base-ui-components/*`, `@mui/*`, `@mantine/*`, `@chakra-ui/*`, `@heroui/*`, `@ark-ui/*`, or none. If several, where each is used.
- Storybook present? Which version, and its framework package.
- `design-gate/dna/` present? Which slugs?
- New project (little or no UI) or existing (UI in use)? For existing: which file layout below it is closest to.
- `design-gate/system/decisions.json` already answers any question below? Those are not asked again.

## 2. Ask once

All open questions in one message, each with the recommendation first, what each option gives up, and the project's real material where it helps (its real routes laid out each way, its real components sorted each way). Skip a question when the Skip column applies, and state the answer instead.

| # | Question | Skip when |
|---|---|---|
| 1 | Which UI library? | One is already in use (if several are mixed, ask which one the system standardises on) |
| 2 | Native hub or Storybook? | The project already has Storybook |
| 3 | Where do component files live? | Never on a new project. On an existing one, state the closest layout and recommend keeping it |
| 4 | How is the hub's component list grouped? | Never |

### Q1: UI library

1. **shadcn/ui** (recommended for brand-heavy work): components are copied into the repo, so every one can carry the brand; Tailwind and CSS variables map straight onto DNA tokens; accessible primitives underneath.
2. **Vanilla** (own components, CSS variables or Tailwind only): best for marketing sites and small surfaces. Pair with a headless primitive for dialogs, menus and popovers.
3. **Headless only** (Radix, Base UI, Ark): full styling control, more to build.
4. **Styled kits** (MUI, Mantine, Chakra, HeroUI): fastest to a working app, hardest to make look unique. Only if speed beats identity.

### Q2: Native hub or Storybook

Suggested wording: "Should the hub be built natively in the app, or use Storybook? I recommend native: real fonts, tokens and providers, no second build, and it ships on your preview deployments. Storybook gives you addons for accessibility and interaction testing and stays fully out of the production app, but it's a second build to host, and the gate, ledger and voice pages need rebuilding as custom pages."

Before calling either option unsupported for this framework, check the current peer range of the Storybook framework package (e.g. `@storybook/nextjs`) against the installed framework version; it changes between releases.

### Q3: Where component files live

Read `references/file-layout.md` before asking. It has the three layouts, the suggested wording, the colocate-and-promote rules, traps and enforcement. Fallback: colocate and promote on a new routed app; an existing project keeps its current layout; a non-routed project (a component library) uses by file type.

### Q4: How the component list is grouped

Read `references/grouping.md` before asking. Three guides: by purpose (fallback), atomic design, components and patterns. Show the project's real components sorted each way. This sorts the hub's list only; it never moves files.

## 3. Fall back, never block

If nobody answers, the user says "you pick", or the session is unattended: use each recommendation, record it as `provisional`, and carry on. `design-hub status` lists provisional decisions until someone confirms them.

## 4. Write the answers

**`design-gate/system/decisions.json`** (create the folder if needed). design-hub adds the visual decisions to the same file later.

```json
{
  "decisions": [
    {
      "id": "ui-library",
      "question": "Which UI library?",
      "options": ["shadcn", "vanilla", "headless", "styled-kit"],
      "recommended": "shadcn",
      "chosen": "shadcn",
      "status": "decided",
      "source": "user",
      "blocksApproval": true,
      "by": "Yosua",
      "date": "2026-11-05"
    }
  ]
}
```

- `status`: `open` | `provisional` | `decided`. `source` says where the answer came from: `dna`, `code`, `library`, `user` or `default`.
- `blocksApproval`: `true` for anything that changes how the product looks. `false` for `file-layout` and `component-grouping`, which change where things live and how they are listed, not how they look.
- Ids used by this skill: `ui-library`, `hub-kind`, `file-layout`, `component-grouping`.

**`design-gate/system/manifest.json`**: create it if missing with `library` (`{ "name", "path" }`, the library's own install path, e.g. shadcn's from `components.json`), `hub` (`{ "kind": "route" | "storybook", "path": "/design", "guard": "NEXT_PUBLIC_DESIGN_HUB" }`) and `grouping` (the chosen guide and its groups). Leave `items` empty; design-hub fills it.

**`AGENTS.md`** at the repo root (create if missing): add or update a `## File layout` block with the chosen layout and its promotion rule (wording in `references/file-layout.md`). If the user uses Claude Code or Gemini CLI, make sure `CLAUDE.md` / `GEMINI.md` contains the line `@AGENTS.md`; do not copy the rules into them.

## 5. Next step

Offer one: `design-dna` if there is no DNA yet (recommended for a new brand), otherwise `design-hub setup`.

## Rules

- Never ask a question twice. Read `decisions.json` first.
- Never move files in this skill. If the user picks a different layout on an existing project, write the decision and leave the move to a separate, explicit task (see `references/file-layout.md`).
- Commit nothing; the user reviews.
