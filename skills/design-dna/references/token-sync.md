# sync: design tokens and Figma into dna.json

For teams whose source of truth is Figma or a tokens file, not a reference site. `sync` maps their tokens into dna.json's structured fields so the hub and its checks follow the design team, without hand translation.

## 1. Decide the direction once

Ask (or read `decisions.json`, id `token-source`): **who is upstream?**

| Answer | Means |
|---|---|
| **Tokens are upstream** (recommended when designers own Figma variables) | `sync` overwrites the mapped dna.json fields. Code drift is measured against them. A token change arrives as a sync, not a code edit |
| **DNA is upstream** | `sync` only reports differences between the tokens and dna.json, as ledger entries; it never overwrites |

Record the answer in `decisions.json` with `blocksApproval: true`. Without an answer, use "report only" and mark it `provisional` (it can't damage anything).

## 2. Get the tokens, in this order

1. **A W3C Design Tokens (DTCG) JSON file** in the repo or attached: the most portable. Tokens Studio, Style Dictionary, Penpot and most Figma token plugins export it. Legacy Tokens Studio files (`value`/`type` without `$`) also work.
2. **A connected Figma MCP server** (e.g. `get_variable_defs` on the file or frame): works on any Figma plan. Save what it returns to `design-gate/dna/<slug>/tokens/figma-variables.json` with the file key and date, so the sync is reproducible.
3. **The Figma Variables REST API** (`GET /v1/files/:key/variables/local`, token with `file_variables:read`): only for full members of an **Enterprise** org. Check the plan before suggesting it; on other plans it fails without a clear error. Read the token from an environment variable, never write it to a file.

Never scrape or guess values from screenshots in this mode; that is `extract`.

## 3. Flatten

```bash
node <design-dna skill dir>/scripts/dtcg-flatten.mjs core.json light.json --mode dark=dark.json --out design-gate/dna/<slug>/tokens/flat.json
```

It inherits group `$type`, resolves aliases (`{color.brand.primary}`, chained and nested), merges files in order, tags mode files, and exits 1 listing unresolved aliases or cycles. Fix or report those before mapping.

## 4. Map onto dna.json

| Token type / name pattern | dna.json field |
|---|---|
| `color` | `palette.colors[]`: keep the token path as `role`, add a descriptive `name` ("dusty plum"), never a systematic one |
| `fontFamily` | `type.families[]`: ask for the fallback if none is given |
| `fontSize`, `dimension` under type/text/font | `type.scale.steps` / `off_ratio`: measure the ratio between steps; on-ratio steps vs off-ratio steps with a reason asked from the user |
| `typography` composites | `type.families`, `type.treatment` (leading, tracking) |
| `dimension` under control/button/input/size | `control_sizes.small / regular / large` |
| `dimension` under radius/corner | `surface.edges` and the corners decision |
| `dimension` under space/spacing | `space.rhythm` and the spacing-unit decision |
| `shadow` | `surface.elevation` |
| `duration`, `cubicBezier` | `motion` |
| modes (light/dark, brand) | the colour-mode decision; one palette per mode |

What tokens can't supply, sync can't invent: **coverage percentages, signatures, the signature break, bans, voice and archetypes**. Keep existing values for those; if the DNA is new, mark them `inferred` and suggest an `extract` on a real screen built with these tokens to fill them.

Put every unmapped token in `meta.unmapped_tokens` with its path, so nothing disappears silently.

## 5. Record and check

- `meta.token_source`: `{ "kind": "dtcg" | "figma-mcp" | "figma-rest", "files": [...], "figmaFileKey": "...", "synced": "2026-11-07" }`.
- Show a diff of every dna.json field that changed (old → new) before writing. In "report only" mode, write the differences to `design-gate/system/disconnects.json` instead, as `open` entries with `what: "Token X differs from DNA"`.
- After writing, the hub's token-drift check (code vs dna.json) runs as usual, so code that hasn't caught up with the designers shows up as ledger entries.

## Re-syncing

Run `sync` again whenever the design team changes tokens. Items whose foundations changed go back to `in-review` in the hub. If the project has the CI gate (`design-hub ci`), it can run the flatten step against a committed tokens file and fail when dna.json is stale.
