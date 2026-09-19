# cube-motion

<p>
  <a href="https://www.npmjs.com/package/cube-motion"><img src="https://img.shields.io/npm/v/cube-motion?color=cb3837&label=npm" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-zero-22c55e" alt="zero dependencies">
  <img src="https://img.shields.io/bundlephobia/minzip/cube-motion?color=8b5cf6&label=size" alt="bundle size">
  <img src="https://img.shields.io/badge/react-✓-61dafb" alt="react">
  <img src="https://img.shields.io/badge/vue-✓-42b883" alt="vue">
  <img src="https://img.shields.io/badge/solid-✓-2c4f7c" alt="solid">
  <img src="https://img.shields.io/badge/svelte-✓-ff3e00" alt="svelte">
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
| `rise(elements, { targets?, stagger?, delay? })` | Fades each element in with a lift, one after another. | `Animation[]` |
| `leave(elements, { targets?, stagger?, delay? })` | Fades each element out with a drop. The end state holds until you remove it. | `Animation[]` |
| `morph(outgoing, incoming)` | Content-aware. Text faces diff per character: shared leading letters stay still, the rest blur out and in, staggered. Other faces crossfade under a blur. The parent's width follows. | `Animation[]` |
| `reveal(elements, { targets?, stagger?, root? })` | Hides now, rises each element the first time it enters the viewport. | `() => void` cleanup |

The supplied element moves by default. Set `targets: "children"` to animate its direct element children instead: `rise(section, { targets: "children" })`. The same rule applies to framework components and hooks.

A new call retargets an interrupted motion from its current state. `rise`, `leave` and `morph` return `Animation` objects. Cancellation rejects their `finished` promises, as it does in the Web Animations API:

```ts
try {
  await Promise.all(leave(toast).map((animation) => animation.finished));
  toast.remove();
} catch (error) {
  if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
}
```

Calling reveal's cleanup restores targets still waiting to enter and cancels its active entrances. Target lists are captured when a binding starts; rebind to include children added later. Core functions run in the browser; imports are safe on the server.

Options say *where* and *when*: targets, stagger, delay, scroll root. *How* it moves is fixed. There is no `easing`, `duration` or `distance` option and there will not be one.

## 🔢 The numbers

The numbers are the product. Each one is a decision you no longer have to make, and here is why it landed where it did.

| Job | Number | Why |
| --- | --- | --- |
| rise | 640ms, 12px lift, 70ms stagger | Long enough that five staggered elements read as a sequence instead of a flicker, and five of them still land inside a second. 12px is the smallest lift that reads as arriving rather than fading. |
| leave | 320ms, 12px drop, 40ms stagger | Half the entrance. The user has already decided to move on, so the exit gets out of the way. The drop mirrors the lift so enter and exit read as one gesture. |
| morph, faces | 220ms, scale 0.8, blur 4px, incoming starts 130ms in | Short enough to feel like one object changing state. The blur hides the frame where both faces overlap and the slight shrink reads as focus pulling, not a pop. The incoming face is already growing before the outgoing one is gone, so there is never an empty frame. |
| morph, text | 180ms per letter, 35ms stagger, incoming starts 60ms in | Only the letters that change move. The stagger runs left to right so the word reads as rewritten, not replaced. |
| morph, width | 400ms | The parent eases to the new face's width, slower than the letters, so the edge trails them and never leads. |
| reveal | rise at 60ms stagger, bottom inset of 10% of the scroll root's height at binding | Elements animate when they are genuinely in view, not while they touch the edge. Scroll already spaces them, so the stagger is tighter than a page load. |
| curve | `cubic-bezier(0.2, 0, 0, 1)` | A strong ease-out. Fast start so the interface answers at once, long settle so nothing snaps. One curve everywhere so every motion feels like the same hand. |

Change them by copying the file into your project. They live in `src/tokens.ts`, one screen, with the reason beside each one.

## ⚛️ React

```tsx
import { Rise, Morph, Reveal } from "cube-motion/react";

<Rise as="section" targets="children" className="hero">
  <h1>Four motions.</h1>
  <p>No dials.</p>
</Rise>

<Rise show={open} className="toast">
  Saved
</Rise>

<button onClick={save}>
  <Morph active={saved} off="Save" on="Saved" />
</button>

<Reveal as="ul" targets="children" className="cards">{cards}</Reveal>
```

Each component renders the element you name with `as`, spreads every other prop onto it, and binds the motion. There is no wrapper: `Reveal` is your list.

| Component | Renders | Own props |
| --- | --- | --- |
| `Rise` | `div` | `show`, `targets`, `stagger`, `delay`. The element rises on mount, leaves before unmount when `show` becomes false. Use `targets="children"` for a staggered group. |
| `Morph` | `span` | `active`, `off`, `on`. Strings morph letter by letter; anything else crossfades. The wrapper takes the active face's width and eases to the next. |
| `Reveal` | `div` | `targets`, `stagger`, `root`. The element reveals as it scrolls in. Use `targets="children"` for a list. |

`as` takes a tag or your own component that forwards its ref to a DOM element. Refs retain that element's type. The React entry includes its client boundary for Next.js. Already own the element? `useRise`, `useMorph` and `useReveal` are exported too, each returning the ref it needs. Attach hook refs in the component that calls the hook so its commits can detect attachment and replacement.

`Morph` preserves the original face content and animates temporary, inaccessible copies of text. The inactive face is inert and hidden from assistive technology. Emoji and combining marks stay together; browsers without `Intl.Segmenter` crossfade the whole face.

## 🔹 Solid

```tsx
import { Rise, Morph, Reveal } from "cube-motion/solid";

<Rise show={open()} class="toast">Saved</Rise>
<Morph active={saved()} off="Save" on="Saved" />
```

Same components, same props, Solid conventions: `class`, a `ref` variable or callback, reactive reads. Bindings run on the client and clean up on unmount.

## 💚 Vue

```vue
<script setup>
import { Rise, Morph, Reveal } from "cube-motion/vue";
</script>

<template>
  <Rise as="section" targets="children" class="hero"><h1>Four motions.</h1></Rise>
  <Rise :show="open" class="toast">Saved</Rise>
  <Morph :active="saved" off="Save" on="Saved" />
  <Reveal as="ul" targets="children" class="cards"><li v-for="card in cards" :key="card.id">{{ card.title }}</li></Reveal>
</template>
```

Same components, same props. Faces can be strings or the `#off` and `#on` slots. Attrs fall through to the element. Custom `as` components need a single element root.

## 🧡 Svelte

Svelte already owns enter and exit through `in:` and `out:`, so rise and leave are transitions and the framework waits for the exit before removing the node. morph and reveal are actions.

```svelte
<script>
  import { rise, leave, morph, reveal } from "cube-motion/svelte";
</script>

{#if open}
  <div class="toast" in:rise out:leave>Saved</div>
{/if}

{#each items as item, i}
  <li in:rise={{ index: i }}>{item}</li>
{/each}

<button>
  <span class="faces" use:morph={saved}>
    <span class:inactive={saved} aria-hidden={saved} inert={saved}>Save</span>
    <span class:inactive={!saved} aria-hidden={!saved} inert={!saved}>Saved</span>
  </span>
</button>
<ul use:reveal={{ targets: "children" }}>…</ul>

<style>
  .faces { position: relative; display: inline-flex; align-items: center; }
  .faces > span { display: inline-flex; white-space: nowrap; }
  .inactive { position: absolute; inset: 0; opacity: 0; }
</style>
```

`index` staggers list items by the job's own stagger. `use:morph` needs exactly two child faces. The styles and inactive attributes above establish the correct initial state during SSR, before actions mount. `use:reveal` observes its own element by default.

All four frameworks are optional peer dependencies. The core has none.

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
npx skills add danielwh2/cube-motion
```

installs it as a skill for Claude Code, Cursor and friends.

## 🧭 Why no dials

Motion libraries hand you every parameter and leave you to find the ones that feel right. Cube ships the answers. New functions arrive for new jobs. No function ever grows an easing option.

Reach for Motion or GSAP when you need a timeline, gestures or layout animation.

## License

MIT
