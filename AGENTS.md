# cube-motion, contributor spec

Read this before touching anything. `.github/agent.md` is the consumer doc and
ships in the npm package; this file is for working on the library itself.

## What this is

Four motions on `Element.animate` and `IntersectionObserver`. The library
makes the motion decisions so the caller does not.

## Invariants

- **Zero runtime dependencies.** React and Solid are optional peers for
  `./react` and `./solid`.
- **No dials.** No function takes an easing, duration, distance or scale.
  A new job gets a new function. An option only ever says where or when
  (targets, stagger, delay, scroll root), never how.
- **One curve.** `cubic-bezier(0.2, 0, 0, 1)` in `src/tokens.ts`. Nothing
  else.
- **Numbers live in `src/tokens.ts`** with the reason beside them.
- **Reduced motion is checked inside every function at call time.** Opacity
  and colour stay, translate, scale and blur go, `press` dims instead.
- **Cancel before animate.** Each function clears the running animations on
  its elements first so interruption never stacks fills.
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
| `src/rise.ts`, `press.ts`, `morph.ts`, `reveal.ts` | one job each, its options type beside it |
| `src/index.ts` | the export list, nothing else |
| `src/react.ts` | four polymorphic components (`as`, props spread, ref merged) on top of one hook per job |
| `src/solid.ts` | the same four components on `Dynamic`, no JSX so tsc is the only build; lifecycle in the component body because Solid applies `ref` outside the owner |
| `tests/setup.ts` | WAAPI, matchMedia and IntersectionObserver stand-ins for happy-dom |
| `vitest.config.ts` | inlines solid-js with the `browser` condition, otherwise Node loads Solid's server build and `render` has no owner |

## Definition of done

1. Vitest case in `tests/` for the behaviour: what the animation was asked
   to do, not a pixel.
2. README and `.github/agent.md` updated in the same commit if the public
   API changed.
3. `npm run check && npm test && npm run pack:check` green.

## Site

The landing page lives in `Danilaa1/cube-motion-site` and carries a vendored
copy of the core until the first npm release.
