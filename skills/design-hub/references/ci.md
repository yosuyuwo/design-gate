# ci: the pull request gate

`AGENTS.md` binds agents. It doesn't bind a human who edits a file by hand, a merge that brings drift back, or a teammate on another editor. The CI gate checks the same rules on every pull request.

## What CI can and can't run

The gate runs only **deterministic** checks: scripts with a pass/fail answer. Agent skills such as `audit` or `fix` need a model and a judgment call, so they don't belong in a required check: they'd be slow, cost money per PR, and give different answers on re-runs. If a team wants an agent to comment on PRs, that is a separate, optional workflow (e.g. an agent action triggered by a label), never the gate.

| Check | Runs in CI | Source |
|---|---|---|
| Manifest valid, sources exist, components grouped | yes | `gate.mjs` |
| Approved items have no open ledger entries; exceptions have notes; entries name real items | yes | `gate.mjs` |
| Approved items don't depend on open/provisional blocking decisions, or on unapproved items | yes | `gate.mjs` |
| Token drift vs dna.json, type scale rule, control sizes, file layout, playground/docs coverage | yes | the project's generated tests (`DESIGN_CHECKS_COMMAND`) |
| Copy lint (AI tells, em dashes, brand bans, glossary) | yes | `lint_copy.py` |
| Hub renders with no console errors, no overflow, content present | opt-in | `render.mjs --walk` |
| Approved items look the same as their approved snapshots | opt-in | `render.mjs` + `diff.mjs` |
| New drift found by reading code with judgment | no | run `design-hub audit` locally |

## Install

1. Copy the skill's `templates/design-gate.yml` to `.github/workflows/design-gate.yml`.
2. Copy the tools into the repo so CI doesn't depend on anyone's machine:
   - `scripts/gate.mjs` (this skill) → `design-gate/system/checks/gate.mjs`
   - `render.mjs`, `diff.mjs`, `package.json` (design-loop's `scripts/`) → `design-gate/system/checks/`
3. Fill the `env` block from the project: install, build and start commands, app URL, hub path and flag, and `DESIGN_CHECKS_COMMAND` pointing at the generated design tests (leave empty if they run in the normal test job).
4. Ask once: **warn or block?** Recommend `warn` for the first week (people see the summary without being stopped), then `block`. Record it as decision `ci-mode`.
5. Ask whether to enable the visual job. Recommend yes only if the app can build and start in CI without secrets beyond placeholders (see `frameworks.md`); otherwise leave it off. If yes, tell the user to set the repository variable `DESIGN_GATE_VISUAL=1`.
6. Add CODEOWNERS so exceptions and approvals need a design reviewer:
   ```
   /design-gate/system/ @<design-reviewer-or-team>
   /design-gate/dna/    @<design-reviewer-or-team>
   ```
   Ask for the handle; never guess it.
7. Tell the user the two settings only they can change: make `design-gate / gate` (and `visual`, if on) a **required check** in branch protection, and enable "Require review from Code Owners".

## How sign-off works

A drift found in a PR is resolved one of two ways, both visible in the diff:
- **Fix it** in code (or with `design-hub fix` locally), and the check passes.
- **Accept it** by setting the ledger entry to `exception` with a `note` in `design-gate/system/disconnects.json`. CODEOWNERS makes a design reviewer approve that change. The gate then passes, and the exception stays on record.

Visual changes on approved items are resolved by re-approving locally (`design-hub review`, then `approve --by`), which commits new approved snapshots in the same PR.

## Keeping the tools current

When the design-gate skills update, re-copy `gate.mjs`, `render.mjs`, `diff.mjs` and `package.json` into `design-gate/system/checks/`. `design-hub ci` does this and shows the diff.
