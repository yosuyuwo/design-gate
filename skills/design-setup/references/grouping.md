# How the hub's component list is grouped

This sorts the hub's list only. Never move files or folders to match it: a later switch should be a manifest edit, not an import rewrite.

## The three guides

| Guide | Sorts by | Groups | Good when | Gives up |
|---|---|---|---|---|
| **By purpose** (fallback) | The job it does | Start from Actions, Inputs, Navigation, Feedback, Overlays, Data display, Layout; show only groups with items | People mostly come to find a component, or nobody has a preference | Doesn't show what is built from what |
| **Atomic design** | Size and composition | Atoms, molecules, organisms, plus behaviours (things other components wear) | The team wants to see how parts build on each other | Time spent arguing which level something belongs in |
| **Components and patterns** | Finished part, or recipe for a task | Components by purpose, plus patterns such as "asking for information" | Teams need guidance on combining parts, not only the parts | Patterns take writing; a new system has few |

Published systems differ: Mantine groups by purpose; Carbon and GOV.UK separate components from patterns; atomic design (Brad Frost) sorts by composition.

**Why by purpose is the fallback:** anyone can place a new component without a debate. Atomic design's molecule/organism split is a known source of argument, and a user who didn't ask for it shouldn't inherit that.

## Suggested question

"How should the component list be organised? I recommend by purpose: Actions, Inputs, Navigation and so on, because anyone can place a new component without debate. Atomic design shows how parts build on each other, but the levels can be hard to agree on. Components and patterns also documents recipes for common tasks, but those take writing. Here's your list sorted each way."

Show the project's real components in three short lists.

## How

- Record the choice in `decisions.json` as `component-grouping` (`blocksApproval: false`).
- Store each item's place in `manifest.json` as `group` (e.g. `"group": "actions"` or `"group": "atom"`), and have the hub's list and each item's header read it, so they can't disagree. The manifest check fails when a component has no `group`.
- Record the placement rule in `design-gate/system/approaches.md` with a test someone can apply. For atomic design: an atom uses no other system component; a molecule combines a few for one job; an organism is a whole section of a screen.
- Atomic design: leave templates and pages out of the component list; those are the Examples (specimens) page.
- Components and patterns: hide the patterns group until the first pattern exists. The manifest's `layer` supports `patterns`.

## Not offered (unless asked)

- **Flat A to Z** (as shadcn/ui lists its components): the least structure for a reviewer, and says nothing about when to use what.
- **Feature-Sliced Design:** it splits app code by business domain, which is a different question from organising a component library.
