# cube-motion, contributor spec

Read this before touching anything. `.github/agent.md` is the consumer doc and
ships in the npm package; this file is for working on the library itself.

## What this is

Four motions on `Element.animate` and `IntersectionObserver`. The library
makes the motion decisions so the caller does not.

## Invariants

- **Zero runtime dependencies.** React is an optional peer for `./react`.
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
- **Return the handle.** `Animation` objects, or an unbind/disconnect
  function, so the caller can stop what it started.

## Architecture

| File | Owns |
| --- | --- |
| `src/tokens.ts` | every number and the curve |
| `src/index.ts` | `rise`, `press`, `morph`, `reveal`, public types |
| `src/react.ts` | one hook per job, effect-bound, StrictMode safe |
| `tests/setup.ts` | WAAPI, matchMedia and IntersectionObserver stand-ins for happy-dom |

## Definition of done

1. Vitest case in `tests/` for the behaviour: what the animation was asked
   to do, not a pixel.
2. README and `.github/agent.md` updated in the same commit if the public
   API changed.
3. `npm run check && npm test && npm run pack:check` green.

## Site

The landing page lives in `Danilaa1/cube-motion-site` and carries a vendored
copy of the core until the first npm release.
