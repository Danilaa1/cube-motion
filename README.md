# cube-motion

<p>
  <a href="https://www.npmjs.com/package/cube-motion"><img src="https://img.shields.io/npm/v/cube-motion?color=cb3837&label=npm" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-zero-22c55e" alt="zero dependencies">
  <img src="https://img.shields.io/bundlephobia/minzip/cube-motion?color=8b5cf6&label=size" alt="bundle size">
  <img src="https://img.shields.io/badge/react-✓-61dafb" alt="react">
  <img src="https://img.shields.io/badge/solid-✓-2c4f7c" alt="solid">
  <img src="https://img.shields.io/badge/typescript-✓-3178c6" alt="typescript">
</p>

Four motions, no dials. Every duration, curve and distance is already decided, so the only thing left to choose is which element moves.

## 📦 Install

```
npm i cube-motion
```

## ⚡ Quick start

```ts
import { rise, leave, morph, reveal } from "cube-motion";

rise(".hero > *");        // staggered entrance
leave(toast);             // staggered exit, holds the end state
morph(oldIcon, newIcon);  // one state into the next
reveal(".card");          // rise when scrolled into view
```

Targets are a selector, one element, or anything iterable of elements.

| Function | Does | Returns |
| --- | --- | --- |
| `rise(targets, { stagger?, delay? })` | Fades each element in with a lift, one after another. | `Animation[]` |
| `leave(targets, { stagger?, delay? })` | Fades each element out with a drop. The end state holds until you remove it. | `Animation[]` |
| `morph(outgoing, incoming)` | Outgoing shrinks and blurs away, incoming grows in behind it. | `[Animation, Animation]` |
| `reveal(targets, { stagger?, root? })` | Hides now, rises each element the first time it enters the viewport. | `() => void` disconnect |

Every call cancels what was already running on that element, so rapid toggles stay clean. `rise`, `leave` and `morph` return the `Animation` objects: `await Promise.all(leave(el).map((a) => a.finished))` before you remove a node.

Options say *where* and *when*: targets, stagger, delay, scroll root. *How* it moves is fixed. There is no `easing`, `duration` or `distance` option and there will not be one.

## 🔢 The numbers

The numbers are the product. Each one is a decision you no longer have to make, and here is why it landed where it did.

| Job | Number | Why |
| --- | --- | --- |
| rise | 640ms, 12px lift, 70ms stagger | Long enough that five staggered elements read as a sequence instead of a flicker, and five of them still land inside a second. 12px is the smallest lift that reads as arriving rather than fading. |
| leave | 320ms, 12px drop, 40ms stagger | Half the entrance. The user has already decided to move on, so the exit gets out of the way. The drop mirrors the lift so enter and exit read as one gesture. |
| morph | 220ms, scale 0.25, blur 4px, incoming starts 130ms in | Short enough to feel like one object changing state. The blur hides the frame where both faces overlap. The incoming face is already growing before the outgoing one is gone, so there is never an empty frame. |
| reveal | rise at 60ms stagger, fires 10% inside the viewport edge | Elements animate when they are genuinely in view, not while they touch the edge. Scroll already spaces them, so the stagger is tighter than a page load. |
| curve | `cubic-bezier(0.2, 0, 0, 1)` | A strong ease-out. Fast start so the interface answers at once, long settle so nothing snaps. One curve everywhere so every motion feels like the same hand. |

Change them by copying the file into your project. They live in `src/tokens.ts`, one screen, with the reason beside each one.

## ⚛️ React

```tsx
import { Rise, Morph, Reveal } from "cube-motion/react";

<Rise as="section" className="hero">
  <h1>Four motions.</h1>
  <p>No dials.</p>
</Rise>

<Rise show={open} className="toast">     // rises in, leaves before unmount
  Saved
</Rise>

<button onClick={save}>
  <Morph active={saved} off="Save" on="Saved" />
</button>

<Reveal as="ul" className="cards">{cards}</Reveal>
```

Each component renders the element you name with `as`, spreads every other prop onto it, and binds the motion. There is no wrapper: `Reveal` is your list.

| Component | Renders | Own props |
| --- | --- | --- |
| `Rise` | `div` | `show`, `stagger`, `delay`. Children rise on mount. With `show`, they leave and then unmount when it turns false. |
| `Morph` | `span` | `active`, `off`, `on`. Faces are stacked for you, the inactive one hidden from the first paint. |
| `Reveal` | `div` | `stagger`, `root`. Children reveal as they scroll in. |

`as` takes a tag or your own component. A `ref` you pass is merged. Already own the element? `useRise`, `useMorph` and `useReveal` are exported too, each returning the ref it needs.

## 🔹 Solid

```tsx
import { Rise, Morph, Reveal } from "cube-motion/solid";

<Rise show={open()} class="toast">Saved</Rise>
<Morph active={saved()} off="Save" on="Saved" />
```

Same components, same props, Solid conventions: `class`, a `ref` variable or callback, reactive reads. Bindings are made in `onMount` and released in `onCleanup`, so nothing runs on the server.

React and Solid are optional peer dependencies. The core has none.

## 👆 Press is CSS

Press feedback used to be the fifth function. It is three lines of CSS, and the CSS version answers keyboard activation too, so the function was retired.

```css
button { transition: scale 320ms cubic-bezier(0.2, 0, 0, 1); }
button:active { scale: 0.97; transition-duration: 120ms; }
```

Fast in, slow out, same curve as everything else.

## ♿ Reduced motion

Every function reads `prefers-reduced-motion` when it runs. Opacity stays, movement goes: `rise` and `leave` become fades, `morph` a crossfade.

## 🤖 Agents

A library with no dials is one an agent cannot misuse. It can only choose the job. `cube-motion/agent.md` is written for that reader: signatures, a job table, the rules, and nothing to tune.

```
npx skills add Danilaa1/cube-motion
```

installs it as a skill for Claude Code, Cursor and friends.

## 🧭 Why no dials

Motion libraries hand you every parameter and leave you to find the ones that feel right. Cube ships the answers. New functions arrive for new jobs. No function ever grows an easing option.

Reach for Motion or GSAP when you need a timeline, gestures or layout animation.

## License

MIT
