# cube-motion, contributor spec

Read this before touching anything. `.github/agent.md` is the consumer doc and
ships in the npm package; this file is for working on the library itself.

## What this is

Four motions on `Element.animate` and `IntersectionObserver`: rise, leave,
morph, reveal. The library makes the motion decisions so the caller does not.
Press was retired on 2026-09-12; it is three lines of CSS and the CSS handles
keyboard activation, which the function never did.

## Invariants

- **Zero runtime dependencies.** React, Vue, Solid and Svelte are optional
  peers for their subpath exports.
- **No dials.** No function takes an easing, duration, distance or scale.
  A new job gets a new function. An option only ever says where or when
  (targets, stagger, delay, scroll root), never how.
- **One curve.** `cubic-bezier(0.2, 0, 0, 1)` in `src/tokens.ts`. Nothing
  else.
- **Numbers live in `src/tokens.ts`** with the reason beside them.
- **Reduced motion is checked inside every function at call time.** Opacity
  and colour stay, translate, scale and blur go, `press` dims instead.
- **Interruptible, always.** Each function reads the computed values it
  animates (`current` in `dom.ts`) before clearing what is running, and
  starts from there, so an interrupted motion retargets like a CSS
  transition. `rise` and `leave` do this only when the element is already
  moving; at rest they start from their canonical hidden or shown state.
  Faces carry `will-change` because blur repaints every frame.
- **Morph is content-aware, never split by content.** One function decides
  from what it is given: text faces diff per character, other faces
  crossfade, the parent's width follows either way. There is no
  `morph/text` or `morph/icons`; the reference (Daniel's Copy to Copied
  recording, 2026-09-12) changes every layer on overlapping clocks and a
  split would hand that coordination back to the caller. Width is the one
  layout property the library animates.
- **Exit belongs to the entrance.** `leave` is the mirror of `rise` and the
  adapters expose it as `show` on `Rise`, never as a separate wrapper.
  Svelte is the exception because `out:` already is that: rise and leave
  are transitions there.
- **One job per file.** A new job is a new `src/<job>.ts` plus one line in
  `index.ts`, one `describe` in `tests/`, one row in the README. Retiring
  is the same in reverse. The adapters stay whole; their shared plumbing is
  the point of reading them together.
- **Return the handle.** `Animation` objects, or an unbind/disconnect
  function, so the caller can stop what it started.
- **React components name elements, never looks.** `as` takes a tag or a
  component. No `kind="card"`, no styling props, no motion props. A
  component's own props are exactly the core function's options.

## Architecture

| File | Owns |
| --- | --- |
| `src/tokens.ts` | every number and the curve |
| `src/dom.ts` | `Targets`, `calm`, `list`, `clear`; keep it to helpers more than one job uses |
| `src/rise.ts`, `leave.ts`, `morph.ts`, `reveal.ts` | one job each, its options type beside it |
| `src/index.ts` | the export list, nothing else |
| `src/react.ts` | four polymorphic components (`as`, props spread, ref merged) on top of one hook per job |
| `src/vue.ts` | the same components as `defineComponent` render functions, attrs spread by hand |
| `src/svelte.ts` | rise and leave as transitions (the curve solved in JS from `EASE_POINTS`), morph and reveal as actions; Svelte owns exit through `out:` |
| `src/solid.ts` | the same four components on `Dynamic`, no JSX so tsc is the only build; lifecycle in the component body because Solid applies `ref` outside the owner |
| `tests/setup.ts` | WAAPI, matchMedia and IntersectionObserver stand-ins for happy-dom |
| `scripts/skill.mjs` | writes `skills/cube-motion/SKILL.md` from `.github/agent.md` on build; edit the source, never the skill |
| `vitest.config.ts` | inlines solid-js with the `browser` condition, otherwise Node loads Solid's server build and `render` has no owner |

## Definition of done

1. Vitest case in `tests/` for the behaviour: what the animation was asked
   to do, not a pixel.
2. README and `.github/agent.md` updated in the same commit if the public
   API changed. The README's numbers table carries the reason for every
   number; a changed number changes its reason.
3. `npm run check && npm test && npm run pack:check` green.

## Site

The landing page lives in `Danilaa1/cube-motion-site` and carries a vendored
copy of the core until the first npm release.
