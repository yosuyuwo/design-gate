# Hub layout (route kind)

The native hub is laid out like a real docs site (Mantine's is the model). A component page holds more than one screen can show, so the hub is navigation plus one item at a time, not one long scroll.

## The frame

1. **Sticky header, two rows.** Row one: the product's real logo component with "Design hub" beside it, and the theme toggle. Row two: the hub's pages as underlined links (Overview, Foundations, Voice, Components, Examples, Approaches, Decisions).
2. **Sticky left list** that picks one item. Grouped, with group titles styled differently from links. The URL hash picks the item, so links stay shareable.
3. **The item in the middle**, which scrolls.
4. **Sticky table of contents on the right**, from `xl`, with the heading in view lit up.

Below `lg`, the left list becomes a horizontal strip above the content, and the table of contents goes away.

Every item frame shows: status badge (draft / in review / approved by X on date / changes requested), a collapsed ledger summary when the item has entries (see `ledger.md`), the "What to check" list, the source link, and a background toggle (default surface, alternate surface, any brand scenery).

### How

- Keep the hash in `useSyncExternalStore`, with the first section as the server snapshot.
- Left-list links are plain `<a href="#id">`. Give panels **no** id matching the hash, so the browser has nothing to jump to.
- Show panels with `hidden`; scroll to the top when the section changes.
- Build the table of contents by scanning the open panel for marked headings (e.g. `data-toc`) with a `MutationObserver`, because switching a tab swaps them. TOC entries are buttons calling `scrollIntoView`; a hash link would change the section.
- Put the header's height in one CSS variable (`--hub-header`) used by the sticky columns' `top` and the headings' `scroll-margin-top`.

### Trap: SVG ids

SVG `url(#id)` resolves to the **first** match in the document, and a match inside a `hidden` section paints nothing. Any SVG rendered more than once needs `useId()` for its pattern, gradient, mask and clip-path ids.

## Routes

```
/design                    Overview: gate status, ledger (Open / Exceptions / Fixed), provisional decisions
/design/foundations        colour (with coverage), type (with Compare ratios tab), spacing, radius,
                           control sizes, elevation, motion, imagery/scenery, iconography
/design/voice              see voice.md
/design/components         one page, aside picks the component (default)
/design/examples           specimens, in real frames (called "Examples" in the UI if the team prefers;
                           the manifest keeps layer "specimens")
/design/approaches         approaches.md rendered with live do/don't pairs
/design/decisions          decisions.json, each linking to its comparison
/design-frame/...          screens for example iframes, outside the hub layout (same guard, noindex)
```

One route per component (`/design/components/[id]`) is allowed but not the default: with the aside it adds build and navigation cost and no benefit.

## Component pages

Each component page follows a Mantine docs page, top to bottom:

1. **Header:** large name, status, a one-line summary from the manifest, then group/level and source link as labelled rows.
2. **Page tabs:** Documentation, Props, Review (with the open count on Review when there is one).
3. **Documentation:** a **Usage** section with the live demo (canvas, controls beside it, generated code under it); one section per variant; then **When to use**.
4. **Each variant:** a one-sentence summary, then a canvas whose toolbar has state tabs on the left and background swatches on the right, showing one centred state at a fixed height. Use swatches, not text chips: with chips, a component with many states wraps to two rows that read as one control.
5. **Props:** a search field and a Name / Type / Default / Description table (see Docs below).
6. **Review:** What to check, plus **Code vs DNA** only when the ledger has entries for this item.

### Spec per component

```ts
{
  id: "button",
  variants: [{ id, label, summary, states: [{ label, node }] }],
  reasons: [{ scenario, use, why }],          // the When to use table
  controls?: { variant: { type: "select", options: [...] }, disabled: { type: "boolean" }, children: { type: "text" } },
  render?: (values) => ReactNode              // lives in a "use client" file
}
```

- Related components share one `reasons` table, so Button and Icon button show the same comparison. Answer the closest confusion ("button or icon button here?"): reviewers and later agents both need it.
- Include a **Not this** variant where misuse is likely.
- Hide state tabs when a variant has one state. A side-by-side comparison (every colour tint) is one state, not twelve tabs.
- **No hover tab.** The canvas is live; the reviewer hovers the real component. Force only states a pointer can't hold: focus (`focus-visible`), pressed, invalid, loading, disabled.
- Stress cases still belong in states: long text, every shipped language, missing image, zero and huge numbers.

### Controls (live props)

The panel under the canvas has a **Controls** tab so a reviewer can change props and see the result. This is the main thing a native hub otherwise loses to Storybook.

- Controls hold client state, so `render` lives in a `"use client"` file.
- Function props can't be edited as values; leave them out.
- Each control starts from the variant's own values; offer a reset.
- Each playground writes its own code from the current values with a small `jsx(tag, props, children)` helper, shown under the canvas and copyable.
- Generate a test that fails on any hub component without a playground.

### Docs (generated props)

- Extract props at build time with `react-docgen-typescript` (or `ts-morph` if that doesn't fit) into a JSON file the hub reads. Show name, type, default and JSDoc description. Filter inherited HTML attributes so the table stays readable.
- Where a component has a playground, derive the table's rows from its controls plus the extracted types, so the two can't disagree.
- Generate a test that fails when a hub item's source has no extracted docs.

## Examples (specimens) in real frames

A width-constrained div does not trigger media queries: it shows the desktop layout squeezed. So viewport presets exist **only on example pages**, and only in iframes.

- Serve screens from a route outside the hub layout (`/design-frame/...`) with the same guard and `noindex`.
- Give the iframe the real device width (Desktop 1440, Tablet 834, Mobile 390) and scale it to fit with a CSS transform, measured with `ResizeObserver`.
- Add an "Open full size" link and `loading="lazy"`, so hidden sections don't load frames.
- Same-origin frames can receive the hub's theme toggle through `contentDocument`.

## Render the hub in the browser only

The hub's pages render only in the browser; the server HTML holds a skeleton of the page. A shared link opens on the section it names with no flash of the first section, and there are no server/browser mismatches to debug. Storybook already works this way.

- Wrap the header and content in one client component in the hub's layout. It renders the skeleton until `useSyncExternalStore` reports the browser, then its children.
- Add a `loading` page with the skeleton (without the header) for moving between hub pages.
- Use the system's Skeleton for every `Suspense` fallback in the hub, never "Loading..." text.
- Product routes are untouched; example frames still load their real routes.

Traps:
- This is **not** a security boundary. Server components still run to read the system files, and their output reaches the browser in the page's script data. Keep the flag guard.
- Check the skeleton against the real page at each width in a browser. A skeleton can pass its tests while its columns are squeezed (e.g. `mx-auto` shrinking a grid inside a flex column).

## Storybook kind

Same content as stories: foundations, voice, approaches, decisions and the ledger as MDX docs pages; each component with its variants as stories, controls via args, props via autodocs; examples as full-page stories with Storybook's viewport addon (which uses real iframes); status from `manifest.json` as a badge parameter.
