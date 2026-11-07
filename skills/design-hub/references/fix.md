# fix: resolve open ledger entries

`fix` closes the gap between the code and the DNA for entries in `design-gate/system/disconnects.json`. It changes code, so it is deliberate: the user runs it, it shows a plan first, and it never approves anything.

## Usage

```
design-hub fix                   all open entries, grouped by item
design-hub fix button            one item's open entries
design-hub fix button-height     one entry
design-hub fix --dry-run         plan only
```

## 1. Plan (always shown, then wait)

For each open entry, classify it:

| Class | Example | What fix does |
|---|---|---|
| **Token swap** | hardcoded `#2a3221` where `--color-primary` exists; `p-[13px]` where a spacing token fits | replaces the literal with the token |
| **Value change** | regular button is 46px, DNA says 48px | changes the component's value or the token, whichever the DNA maps to |
| **Missing prop** | input has no `size` | adds the prop following `full-pack.md` and the library's pattern |
| **Needs a decision** | DNA and code disagree and the `dna-vs-code` decision is not `decided`; two DNA rules conflict | skipped: listed as "needs you", with the decision to make |
| **Locked or excepted** | the entry is on a locked screen, or status `exception` | skipped |
| **Not mechanical** | "hero reads as decoration, not proof" | skipped: suggest design-loop |

Show the plan as a table: entry, class, file(s), the change, and what else reads that token or component (blast radius). Group by item. Ask once: all, some (by id), or none. Unattended: do only token swaps, which can't change how anything looks when the token already equals the literal; otherwise stop at the plan.

## 2. Fix, one item at a time

For each item in the plan:

1. **Builder in fresh context** (see design-loop's "Running on any agent"), given only: the item's source files, its open entries (`what`, `code`, `dna`), the DNA fields they name, the design-system tokens file, and the library's conventions. Instruction: change only what the entries name; no refactors, renames or unrelated cleanups.
2. **Check:** the project's checks for this item (token drift, full-pack, file layout), type check, and the copy linter if strings changed. A failing check reverts the item's changes and leaves its entries `open` with a `note` saying why.
3. **Render** the item to `pending-*` and run the visual diff against its approved look. Large changes are expected for value changes; changes on *other* items mean the fix leaked (a shared token): report them.
4. **Mark** each entry the check now passes as `fixed` with a note (`fixed by design-hub fix, <date>, <commit or "uncommitted">`). Entries still failing stay `open`.
5. **Status:** an approved item that changed goes back to `in-review`. A draft stays draft.

Cap: 10 items per run unless the user says more. Stop early and report if two items in a row fail their checks: the plan is probably wrong.

## 3. Report

Per item: entries fixed, still open (and why), files changed, diff % and images, items affected beyond the target. Then: "Run `design-hub review` to send these for approval."

## Rules

- Never set an entry to `exception`. That is a human decision with a reason.
- Never edit `dna.json` to make an entry pass. If the DNA looks wrong, say so and suggest editing it deliberately (or `design-dna sync` if tokens are upstream).
- Never touch locked screens or their pins.
- Commit nothing; the user reviews the diff. Suggest one commit per item.
