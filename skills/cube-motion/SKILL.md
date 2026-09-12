---
name: cube-motion
description: Use when adding UI motion with cube-motion. Four fixed motions (rise, leave, morph, reveal) on the Web Animations API with React and Solid components. Nothing to tune; pick the job.
---

# cube-motion

Four fixed UI motions on the Web Animations API. Zero dependencies. Optional React, Vue, Solid and Svelte adapters. Nothing to tune: pick the job, name the element.

```
npm i cube-motion
```

## Which function

| You want | Use | Note |
| --- | --- | --- |
| Content to appear on load or mount | `rise` / `<Rise>` | Staggers the children of a container. |
| Content to disappear before removal | `leave` / `<Rise show={false}>` | Await `finished` before removing the node. The component does this for you. |
| A toast, dialog or panel that comes and goes | `<Rise show={open}>` | Mounts with rise, leaves, then unmounts. |
| An icon or label to change state | `morph` / `<Morph active>` | Both faces stay mounted. |
| Cards to animate as the user scrolls | `reveal` / `<Reveal>` | Hides now, rises on first intersection. |
| A button to react to a press | CSS, not this library | `button:active { scale: 0.97 }` with a `transition`. |
| A timeline, a gesture, layout animation | Motion or GSAP | Out of scope. |

## Core

```ts
import { rise, leave, morph, reveal } from "cube-motion";

type Targets = string | Element | Iterable<Element>;

rise(targets: Targets, options?: { stagger?: number; delay?: number }): Animation[];
leave(targets: Targets, options?: { stagger?: number; delay?: number }): Animation[];
morph(outgoing: Element, incoming: Element): [Animation, Animation];
reveal(targets: Targets, options?: { stagger?: number; root?: Element | null }): () => void; // disconnect
```

- `rise`: opacity 0 to 1 with a 12px lift, 640ms, 70ms stagger, `fill: backwards`.
- `leave`: opacity 1 to 0 with a 12px drop, 320ms, 40ms stagger, `fill: forwards`, so the element stays gone until removed or risen again.
- `morph`: outgoing to opacity 0, scale 0.25, blur 4px over 220ms. Incoming runs the reverse starting 130ms later. `fill: both`. Each face starts from its computed opacity, scale and filter, so interrupting a morph retargets smoothly.
- `reveal`: sets `style.opacity = "0"` at once, observes with `rootMargin: "0px 0px -10% 0px"`, calls `rise` per element on first intersection with a 60ms stagger, then unobserves.

Every function cancels running animations on its elements first, so rise after leave and leave after rise are safe at any moment. Every function reads `prefers-reduced-motion` at call time: translate, scale and blur are dropped, opacity stays.

One curve: `cubic-bezier(0.2, 0, 0, 1)`.

## React

```tsx
import { Rise, Morph, Reveal } from "cube-motion/react";

<Rise as?="div" show?=true stagger? delay? {...elementProps}>children</Rise>
<Morph as?="span" active off on {...elementProps} />
<Reveal as?="div" stagger? root? {...elementProps}>children</Reveal>
```

- Polymorphic: `as` is a tag or a component that forwards its ref. Other props go to the element, typed for that tag. A caller `ref` is merged.
- `Rise` children rise on mount. With `show`, turning it false runs `leave` on the children, waits for `finished`, then unmounts. Turning it true again rises them. `show={false}` from the start renders nothing.
- `Morph` renders two `span` faces in an inline grid, both at `grid-area: 1 / 1`, the inactive one at `opacity: 0` from the first render. No CSS import.
- Hooks for when you already own the element, each returning the ref it needs: `useRise(options?)`, `useMorph(active)` returning `[off, on]`, `useReveal(options?)`.

## Solid

```tsx
import { Rise, Morph, Reveal } from "cube-motion/solid";

<Rise show={open()} class="toast">Saved</Rise>
<Morph active={saved()} off="Save" on="Saved" />
<Reveal as="ul" class="cards">{cards}</Reveal>
```

Same components and props. Solid conventions: `class`, `ref` as a variable or callback, reactive reads (`open()`, not `open`). Bindings happen in `onMount` and are released in `onCleanup`, so SSR is safe.

## Vue

```vue
import { Rise, Morph, Reveal } from "cube-motion/vue";

<Rise as?="div" :show?="true" :stagger? :delay? v-bind="attrs">children</Rise>
<Morph as?="span" :active off? on? v-bind="attrs" />   <!-- or #off and #on slots -->
<Reveal as?="div" :stagger? :root? v-bind="attrs">children</Reveal>
```

Render-function components, no SFC. `inheritAttrs` is off and attrs are spread onto the element: `class`, `style` and listeners all land on it. A template `ref` on the component gives the instance; read `.$el` for the element.

## Svelte

```svelte
import { rise, leave, morph, reveal } from "cube-motion/svelte";

<div in:rise out:leave>…</div>                     <!-- transitions; Svelte waits for out -->
<li in:rise={{ index: i }}>…</li>                  <!-- index * stagger, or delay: ms -->
<button use:morph={active}><i>off</i><i>on</i></button>  <!-- action; two children are the faces -->
<ul use:reveal>…</ul>                               <!-- action; children reveal on scroll -->
```

No `show` prop: use `{#if}` with `in:rise out:leave`. The transitions evaluate the same curve in JS. Works on Svelte 4 and 5.

## Rules

- Never add `duration`, `easing`, `distance` or `scale` options. If a motion feels wrong, the fix is a new job, not a knob.
- Do not wrap a single button in `<Rise>` to press it. Use CSS.
- Do not animate unmount by hand. Use `show` in React, Vue and Solid, `out:leave` in Svelte.
- In vanilla, remove a node only after `leave`'s animations have finished.
- Do not import a stylesheet; there is none.

## Morph faces in vanilla

The two faces must overlap and the inactive one must start hidden:

```css
.faces { display: inline-grid; }
.faces > * { grid-area: 1 / 1; will-change: opacity, filter, scale; }
.faces > .hidden { opacity: 0; }
```

`will-change` keeps the blur on its own layer. The framework components set it for you.
