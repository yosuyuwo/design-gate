# The full pack

Everyone who runs the hub should end up with a complete system, not only the parts their DNA or code happened to mention. An audit that only compares code with the DNA can't find what neither one mentions (no large button, one icon-button size, one field size, a type scale with no stated rule).

## Missing props, per component kind

`audit` compares each component with this list and writes each gap to `disconnects.json`.

| Component kind | It should have |
|---|---|
| Actions (button, icon button, button link) | `size`, `variant`, disabled, loading, an icon that follows the size, a required label on icon-only controls, a link form |
| Fields (input; textarea and select if the product has them) | `size`, invalid with an error line, disabled, a focus state, a label |
| Pickers (checkbox, radio, tabs) | checked or selected, disabled, focus, a target large enough to tap |
| Containers (card, dialog, toast) | tones, an action slot, a close or undo path where it applies |
| Loading (skeleton) | shapes, an animation choice, tokens for colour, corners and duration, a still state for reduced motion |

Mark a prop **not needed, with a reason**, instead of adding it blindly (e.g. a checkbox skips `size` because it is tapped with its label; tabs have a fixed height so their track matches a regular button).

## One set of control heights

`setup` creates small, regular and large as tokens, each with height, padding, text size and icon size. Buttons, icon buttons, button links and inputs all read the same tokens. Values come from the decision order in `decisions.md` (DNA, code, library, fallback). Store them in the DNA as structured fields (e.g. `control_sizes`), not prose, and generate a test comparing the tokens with them.

Why: a field and a button in one row only line up if they share heights (a 52px input beside a 46px button doesn't).

Traps:
- An input's `size` prop collides with the HTML attribute: `Omit<..., "size">` from the prop type.
- Field text stays at **16px or more** at every size, or iOS zooms the page on focus. Small fields stay short but keep the text size.
- WCAG 2.2 asks 24px at AA, 44px at AAA. A small control can stay small to the eye and still give touch users 44px with a `pointer-coarse:after:` hit area.
- Set the default icon size with `[&_svg:not([class*='size-'])]` so a caller's explicit size still wins.
- Check the DNA before adding a loading spinner. If it limits icons, `isLoading` can disable the button and set `aria-busy` while the caller changes the words.

## A type scale with a rule

The DNA states a base, a ratio, the steps on that ratio, and **a reason for each step off it**. Each size token carries its line height (`--text-*--line-height` in Tailwind v4). `audit` measures the ratios between existing sizes and counts sizes used outside the tokens.

Generate a test that checks: on-ratio steps really follow the ratio, every other step has a reason, every token matches the DNA.

Trap: teach `tailwind-merge` the new size (and radius) tokens. Without it, a custom size class is read as a colour and one of them silently wins.

## A skeleton every project can restyle

`setup` creates a Skeleton with one place to change each thing. Start from the library's skeleton if it has one.

| To change | Where |
|---|---|
| Shape | `shape` prop: line, block, circle; size with `className` |
| Feel for one use | `animation` prop: pulse, shimmer, none |
| Feel everywhere | the prop's default in the component |
| Speed | a duration token, overridable per use |
| Colour and corners | a colour token and a radius token |

Show the feels side by side on the component's page with live controls, and include the choice in the one decisions question.

Traps:
- Check the DNA first. If it gives loading to something else (a character, an illustration), ask before adding a skeleton there and record the answer in `disconnects.json` as an exception if the skeleton stays.
- Teach `tailwind-merge` the radius token, or a caller's corners won't replace the shape's.
- A global `corner-shape: squircle` squares off a circle: set `corner-shape: round` on the circle shape.
- Hide each shape from screen readers (`aria-hidden`); the wrapper announces the wait once with `role="status"` and a label.
- Stop the animation under `prefers-reduced-motion`, and remove the shimmer's gradient too.
