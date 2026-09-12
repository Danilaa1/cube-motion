# cube-motion

<p>
  <a href="https://www.npmjs.com/package/cube-motion"><img src="https://img.shields.io/npm/v/cube-motion?color=cb3837&label=npm" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-zero-22c55e" alt="zero dependencies">
  <img src="https://img.shields.io/bundlephobia/minzip/cube-motion?color=8b5cf6&label=size" alt="bundle size">
  <img src="https://img.shields.io/badge/react-✓-61dafb" alt="react">
  <img src="https://img.shields.io/badge/typescript-✓-3178c6" alt="typescript">
</p>

Four motions, no dials. Every duration, curve and distance is already decided, so the only thing left to choose is which element moves.

```
npm i cube-motion
```

## Quick start

```ts
import { rise, press, morph, reveal } from "cube-motion";

rise(".hero > *");        // staggered entrance on load
press(button);            // pointer feedback, returns unbind
morph(oldIcon, newIcon);  // one state into the next
reveal(".card");          // rise when scrolled into view
```

## API

Targets are a selector, one element, or anything iterable of elements: a NodeList, an HTMLCollection, an array.

| Function | Does | Returns |
| --- | --- | --- |
| `rise(targets, { stagger?, delay? })` | Fades each element in with a 12px lift over 640ms, 70ms apart. | `Animation[]` |
| `press(el)` | Scales to 0.97 while the pointer is down, springs back on release. | `() => void` unbind |
| `morph(outgoing, incoming)` | Outgoing shrinks and blurs away over 220ms, incoming grows in 130ms behind it. | `[Animation, Animation]` |
| `reveal(targets, { stagger?, root? })` | Hides now, rises each element the first time it enters the viewport. | `() => void` disconnect |

Every call cancels what was already running on that element, so rapid clicks and re-renders stay clean. `rise` and `morph` return the `Animation` objects, so you can await `finished` or cancel them yourself.

There is no `easing`, `duration` or `distance` option and there will not be one. Stagger, delay and scroll root describe *where* and *when* a motion happens. *How* it moves is the library's job.

## React

```tsx
import { useRise, usePress, useMorph, useReveal } from "cube-motion/react";

function SaveButton({ saved }) {
  const ref = useRef(null), off = useRef(null), on = useRef(null);
  usePress(ref);
  useMorph(off, on, saved);      // runs when saved flips
  return <button ref={ref}><i ref={off}>Save</i><i ref={on}>Saved</i></button>;
}
```

| Hook | Ref points at |
| --- | --- |
| `useRise(ref, options?)` | A container. Its children rise on mount. |
| `usePress(ref)` | The pressable element. |
| `useMorph(off, on, active)` | The two faces. Mount settles the state with no motion. |
| `useReveal(ref, options?)` | A container. Its children reveal as they scroll in. |

Each hook binds on mount and cleans up on unmount. React is an optional peer dependency; the core has none.

## Reduced motion

Every function reads `prefers-reduced-motion` when it runs. Opacity stays, movement goes: `rise` becomes a fade, `morph` a crossfade, and `press` dims to 0.8 instead of shrinking.

## The numbers

| Job | Duration | Detail |
| --- | --- | --- |
| press | 120ms in, 320ms out | scale 0.97 |
| morph | 220ms | scale 0.25, blur 4px, incoming leads by 130ms |
| rise | 640ms | 12px lift, 70ms stagger |
| reveal | 640ms | 60ms stagger, fires at 10% from the bottom edge |

One curve everywhere: `cubic-bezier(0.2, 0, 0, 1)`.

## Why no dials

Motion libraries hand you every parameter and leave you to find the ones that feel right. Cube ships the answers instead. New functions arrive for new jobs, toast, dialog, reorder. No function ever grows an easing option.

Reach for Motion or GSAP when you need a timeline, gestures or layout animation.

## Try it locally

```
npm run build
```

Then open `examples/index.html` in a browser. It reads the compiled output.

## License

MIT
