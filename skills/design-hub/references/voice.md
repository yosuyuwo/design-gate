# Voice

Voice is a foundation: approved before components, because every component carries copy (button labels, errors, empty states, chart titles). The work is split between two skills. Do not duplicate what copy-system already does.

| Owned by | What |
|---|---|
| **copy-system** | The pipeline: string inventory keyed by component / i18n key / selector, surface classification (marketing, app UI, dashboard, transactional), benchmark, de-slop, surface rules, the linter, `glossary.md`, delivery into the i18n/strings files, the swap wall and the proof row |
| **design-hub** (this skill) | `voice.md` (who the brand sounds like), brand and Indonesian extensions to the linter, where the files live, the `/design/voice` page, and the approval gate |

copy-system's rules are the floor for every string. `voice.md` decides tone wherever those rules leave room, and adds brand bans on top. When they conflict, the stricter rule wins (e.g. copy-system bans em dashes; voice.md cannot allow them).

**Check it is installed** during setup: look for a `copy-system` skill (older installs: `landing-copy-system`). If missing, tell the user the voice layer is limited to `voice.md` plus these fallback rules until they install it: sentence case, verb + object buttons, errors say what happened and what to do, empty states say what goes here plus one action, no em dashes.

**Fallback linter** (no copy-system): generate `design-gate/system/copy/lint_copy.py` yourself with the brand and glossary lists below plus em dashes, and:
- scan **single-word strings** too (a banned word used alone must fail);
- take targets from a glob that **includes the hub's components and examples**, since those carry real strings, not only product routes.

## Files

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

## voice.md

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

## Glossary and linter extensions

- `glossary.md`: use copy-system's glossary format, with one column per shipped language plus a "Never" column. Example row: generated social post → en "post", id "postingan", never "content, konten, asset".
- `lint_copy.py`: start from copy-system's linter unchanged, then add these word lists, loaded at runtime: `voice.md` banned lines (each language), and `glossary.md` "Never" terms. Match case-insensitively, report hits under their own class (`brand-ban`, `glossary`). Any brand-ban or glossary hit fails, same as an em dash.

## Running the voice layer

**Once, to set the voice (part of foundations):**
1. Write `voice.md` and `glossary.md`. User reviews them.
2. Build the microcopy matrix (below) with placeholder strings.
3. Run copy-system on the matrix strings with `voice.md` and `glossary.md` as constraints. Output goes to `inventory.json` and the i18n files; proof to `proof.json`.
4. Voice is ready for review when the matrix passes the extended linter.

**Per item, whenever a component, pattern or specimen is added or changed:** run copy-system on that item's strings only (surface classified by copy-system), then the extended linter. Never re-run the whole product's copy for one item.

**Existing projects (audit):** run copy-system's inventory and linter across the app for a baseline score. Do not rewrite yet; rewrites happen item by item as each one goes through review.

## /design/voice page

- The one line, is / is-not table, per-surface tone, languages rule.
- The glossary, rendered as a table.
- **Microcopy matrix** built from real components, in every shipped language, one row per surface: primary and destructive buttons, confirm dialog, inline field error, empty state, success toast with undo, long-running progress message, notification, a dashboard metric label and chart title, a marketing hero line. Reviewers approve the voice by reading this.
- **Swap wall** from `inventory.json`: before and after per string, grouped by screen. Reads "before" from the record, "after" from the live i18n source, so it cannot drift.
- **Proof row** from `proof.json`.

## Copy gate

- **Voice** cannot be approved until `voice.md` and `glossary.md` exist, the matrix renders in every shipped language, and it passes the extended linter.
- **A component, pattern or specimen** cannot be approved while its strings fail the extended linter. `review` runs it and puts the score and any hits in the review note.
- Approving a component approves its copy. Editing an approved string sets that item back to `in-review`.
