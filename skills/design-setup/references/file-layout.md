# Where component files live

A different question from how the hub's list is grouped (`grouping.md`). Grouping sorts the hub; this decides where files sit on disk. A component can be an organism in the hub and still live inside the one route that uses it.

## The three layouts

| Layout | Files live | Good when | Gives up |
|---|---|---|---|
| **Colocate and promote** (fallback) | Inside the route that uses them, moving up only when something else needs them | The app has routes, and people want to find code from what they see in the browser | Takes discipline to move things when they get shared; paths can get deep |
| **Feature folders** | `src/features/<name>`, with routes kept thin | Features span several routes, or teams own features | Folders follow features, not screens; feature boundaries can be unclear |
| **By file type** | `src/components`, `hooks`, `utils`, a component's private parts nested inside it | Small apps, people who jump between files by name, and non-routed projects such as component libraries | A long list that doesn't show which screen uses what |

Background, for the "gives up" column: Kent C. Dodds's colocation rule ("place code as close to where it's relevant as possible") and Next.js's "split project files by feature or route" support the first; Bulletproof React and Robin Wieruch support feature folders; Josh Comeau argues for by file type because feature folders drift and rarely get reorganised. Next.js calls itself unopinionated and says to pick one and be consistent. None of these names a winner: the fallback is a judgment.

**Why colocate and promote is the fallback:** it is the only layout where folders follow the screens, and it delays deciding what is shared until there is a real second user.

## Suggested question

"Where should component files live? I recommend colocate and promote: each component stays inside the route that uses it and moves up when something else needs it, so you can find code from what's on screen. Feature folders suit features that span many routes, but folders stop matching screens. By file type is simplest for small apps, but the list gets long. Small parts like buttons and inputs stay in `src/components/ui` either way. Here are your routes laid out each way."

Show the project's real routes as three folder trees.

## Colocate and promote: the rules

```
src/
  app/
    (group)/
      dashboard/
        page.tsx
        _components/          only /dashboard uses these
          TopBar.tsx
          calendar/           one folder per section on screen
            StudyCalendar.tsx
        _utils/               helpers only /dashboard uses
    _components/              shared across route groups
  components/
    ui/                       button, input and other small parts (library install path)
  lib/                        helpers used across routes
```

- A component starts in its parent: the same section folder, or the page's `_components`.
- When a second user appears, move it to the nearest folder that holds both. Two sections of one page share the page's `_components`; two routes share their parent's (use a route group if only some routes should see it).
- Across route groups, the nearest folder is `src/app/_components`. Only small generic parts and parts the hub tracks go outside `app`, to `src/components`. Helpers follow the same path, ending in `src/lib`.
- **The hub counts as a user.** Anything the hub renders must sit outside any one route's private folder, so a product part waiting for its first route stays in `src/components`.
- The page at `/` needs its own route group, such as `(landing)`; otherwise its private folder is `app/_components`, which is also where shared parts go.
- Move when the second user exists, not when one seems likely. Move, never copy.
- Parts that belong to a layout live next to that layout.

### Traps

- Use `_components` and `_utils` inside `app`, not `components` and `utils`. Next.js opts underscore folders out of routing; without it, a `page.tsx` inside `components` becomes a public route.
- Import with `@/` rather than long relative paths. Inside one `_components`, stop at section then component (two levels).
- Only hub items need a manifest entry. A private section built from approved parts is not a hub item, so the old rule "every `source` sits under `library.path` or is marked `custom`" no longer applies to it.
- A private component may arrange approved parts but may not introduce a new look. If it needs one, that is a missing system item.
- When a promoted component reaches `src/components`, `design-hub add` it as a draft.
- Moving a file is not editing it: `design-hub review` uses git rename detection, so a pure move updates `source` and keeps the approval.
- UI libraries have their own install path (shadcn's is in `components.json`); keep `ui` where the CLI expects it.
- **Search for path text before moving anything.** Scanners, linter targets and coverage settings often name paths. A stale exemption fails loudly; a stale include silently stops checking. Add new private helper folders to coverage.

## Enforcement

Generate a test (project's runner; otherwise a node script under `design-gate/system/checks/`) that reads the real import graph and fails on:
1. a route importing another route's private folders,
2. shared code (`src/components`, `src/lib`) importing from `src/app`,
3. a file sitting higher than the routes that use it need (one user, but lives in a shared folder),
4. a hub item's `source` that no longer exists.

Prefer this test to a lint rule: `eslint-plugin-boundaries` or `import/no-restricted-paths` can block one bad import but cannot see that a single-user component sits too high, which is half of this layout's rule. A team can add lint too, for editor feedback.

Write the test first and run it on the current tree; report the count before moving anything.

## AGENTS.md block

```markdown
## File layout
- Layout: colocate and promote. A component lives in the route that uses it (`_components`, `_utils`); move it to the nearest shared folder only when a second user exists. Move, never copy.
- Small generic parts and anything the design hub renders live in `src/components`; shared helpers in `src/lib`.
- Never import another route's `_components` or `_utils`. Shared code never imports from `src/app`.
```

Adapt the block for feature folders (code flows shared → features → app; features never import each other) or by file type.

## Existing projects

State which layout the project is closest to and recommend keeping it. If the user picks another: move one route per commit, no behaviour changes in that commit, and not while other branches touch those files. A scripted move map in one pass is acceptable if the user prefers and no other branches are open; run the enforcement test before and after.

## Not offered (unless asked)

- **Feature-Sliced Design:** clear import rules, but its own layers, slices and segments to learn. It says itself a working architecture may not be worth switching from.
- **Non-routed projects** skip colocate and promote: there are no routes to follow. Use by file type.
