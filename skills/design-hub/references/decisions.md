# Decisions

Every system decision follows the same four steps, and none of them may block the build.

1. **Work it out first.** Read the DNA and measure the code. If they already answer it, state the answer (`source: dna` or `code`) and don't ask.
2. **Show it.** Render the options in the hub with the project's real fonts, tokens and copy, and mark the recommendation. Say what each option breaks, in terms of that project's own rules (e.g. "1.25 breaks your 2:1 headline rule at the hero").
3. **Ask once.** Put all open decisions in one question, each with the recommendation first and a link to its comparison in the hub.
4. **Fall back.** If nobody answers, the hub can't run, or the user says "you pick": use the recommendation, record it as `provisional`, keep building. `status` lists provisional decisions until someone confirms them.

A `provisional` or `open` decision with `blocksApproval: true` blocks approval of every item it affects, the same as an open ledger entry. `file-layout` and `component-grouping` (asked by design-setup) don't block: they don't change how anything looks.

## `design-gate/system/decisions.json`

Shared with design-setup, which creates it.

```json
{
  "decisions": [
    {
      "id": "type-ratio",
      "question": "Which type ratio?",
      "options": ["1.25", "1.333", "1.414", "1.5"],
      "recommended": "1.414",
      "chosen": "1.414",
      "status": "decided",
      "source": "code",
      "blocksApproval": true,
      "affects": ["foundations:type"],
      "compare": "/design/foundations#type-compare",
      "by": "Yosua",
      "date": "2026-11-05"
    }
  ]
}
```

`source`: `dna` | `code` | `library` | `user` | `default`. `status` can say "from shadcn" from this field, and a later library upgrade can be checked against it. Generate a check that fails when an approved item depends on an `open` or `provisional` decision with `blocksApproval: true`.

## Decisions the hub covers

| Decision | Show | Fallback when DNA and code say nothing |
|---|---|---|
| Base text size | One paragraph at 16, 17 and 18px | 16px |
| Type ratio | The same headline, title and body at 1.25, 1.333, 1.414 and 1.5 | 1.25 for a product, 1.333 for a marketing site |
| Smallest text | Real metadata at 12, 13 and 14px | 13px, never for instructions or errors |
| Control heights | A field and a button in one row at each set, library's set first | The UI library's sizes (below). No library: 36, 44, 52px |
| Corners | A control, a card and a sheet at each set, library's first | The UI library's radius. No library: 8, 12, 16px |
| Skeleton feel | The same block pulsing, shimmering and still | The library's own. No library: pulse |
| Spacing unit | One card at 4px and 8px steps | 4px |
| Motion | The press and an entrance, played | 200ms ease-out |
| Colour mode | One screen in light and dark | Both |
| DNA vs code (existing projects) | The ledger's first entries | DNA wins (see `ledger.md`) |

These fallbacks are starting points, not findings. Ratio pairings come from common practice; published systems such as Tailwind, Radix and Carbon don't follow one strict ratio.

Measure first. Real scales rarely follow a ratio exactly, and existing sizes often already sit on one nobody named (e.g. 17, 24, 34 on 1.414). Measuring keeps approved sizes and avoids switching to a popular ratio that breaks an existing rule.

## Sizes from the selected UI library

For control heights and corners, each value's source follows this order:

1. The DNA, if it states one (stop: state it, don't ask).
2. The project's code, if it has already settled on one (stop: state it).
3. **The selected UI library's own values.** Still ask: show the library's set first as the recommendation next to the alternatives. If nobody answers, use it and record `provisional`.
4. The fixed fallbacks above, only when there is no library.

Why: components added later from the library arrive at its sizes; a fixed set would make every new one need restyling.

Read the values from the **installed** library's source, because they change between versions. Examples at time of writing, to verify:

| Library | Heights | Corners |
|---|---|---|
| shadcn/ui (new-york) | `sm` 32, `default` 36, `lg` 40 | `rounded-md` |
| Mantine | `xs` 30, `sm` 36, `md` 42, `lg` 50, `xl` 60 | theme default radius |

Map onto small, regular and large (Mantine's `sm`, `md`, `lg` are the closest) and keep any extra sizes.

A library's regular size can sit under 44px (shadcn's 36). Say so in the question; keeping it is fine as long as touch users get the larger target (see `full-pack.md`).

Suggested question: "Your UI library is shadcn/ui, so I recommend its control heights of 32, 36 and 40px, because components you add later will already match. Its regular size is under the 44px touch target, so I'd add a larger tap area on touch screens. Here it is in a real row beside two other sets. Keep it, or pick another?"
