# The disconnections ledger

Every difference between the code and the DNA (or a missing piece the full pack expects) is recorded, then fixed or given a named exception. Nothing lives only in a chat table or a hard-coded list on the hub.

## Policy: asked once

When a project has both a DNA and existing UI, ask once during `audit`: **"When the code and the DNA disagree, does the DNA win?"** Recommend yes. Record it in `decisions.json` as `dna-vs-code`. Never ask per difference.

When the DNA wins, the AGENTS.md block gains: "The DNA wins over the code. Record every mismatch in design-gate/system/disconnects.json, then fix it or give it a named exception."

## `design-gate/system/disconnects.json`

```json
{
  "entries": [
    {
      "id": "button-height",
      "item": "button",
      "what": "Regular button is 46px; DNA control_sizes.regular is 48px",
      "code": "46px",
      "dna": "48px",
      "status": "open",
      "note": null
    }
  ]
}
```

`status`: `open` | `fixed` | `exception`. An `exception` needs a `note` giving the reason (who decided, why). `item` must be a manifest id.

## Who writes and reads it

- `audit` writes every mismatch as `open`: DNA vs code, DNA vs itself (below), hover type, missing props (`full-pack.md`), type scale and control size drift.
- `review` lists the item's open entries in the review note.
- `approve` refuses an item with any open entry.
- `status` prints the counts.
- The hub: each item's frame shows a collapsed summary; Overview lists all entries under Open, Exceptions and Fixed.

## Checks (generated in the project)

Add to the project's test runner (or a node script under `design-gate/system/checks/` run in CI). The build fails when:
- an approved item has an `open` entry,
- an entry names an unknown item,
- an `exception` has no `note`,
- the tokens disagree with `dna.json` (compare CSS variables or the theme file against the DNA's structured fields), so new drift fails at once instead of waiting for a review.

## Audit the DNA against itself

Before comparing code with the DNA, look for DNA rules that conflict with each other, and raise them in the same audit report. Typical kinds:
- a lock ("never restyle screen X") against "the DNA wins", once tokens change globally,
- `motion` values against a signature that describes existing behaviour (e.g. an 800ms elastic press against a 200ms hover puff),
- two rules setting the same property differently for overlapping elements.

Resolve each with the user; record the outcome as a DNA edit, a ban, or an `exception` entry.

## Locked screens: the pin

Applying DNA tokens globally silently restyles screens the DNA or the team has locked, because they read the same variables.

1. **First ask whether the lock should stay.** Pinning, then having the lock removed, means pulling the pin and its rules back out.
2. If it stays: expose control values as CSS variables, and re-declare the old values under a class on the locked screen's root (e.g. `.locked-home`).
3. Record it as an `exception` entry naming the screen.
4. Check it by rendering the locked screen before and after the token change and comparing.

Trap: a contextual token such as `--color-surface` can't be defaulted from a variable declared at the root, because variables resolve where they're declared. Use `var(--local, var(--color-surface))` at the point of use.

## Hover type

Add "hover treatment matches what the element does" to the audit's flags. A common rule: a tint for actions (buttons, links), a soft neutral for things that pick (tabs, choice cards, list rows). Tabs or choice cards using the action hover are a mismatch.
