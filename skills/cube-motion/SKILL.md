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
| Content to appear on load or mount | `rise` / `<Rise>` | Animates the element; `targets="children"` staggers its children. |
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

rise(elements: Targets, options?: { targets?: "self" | "children"; stagger?: number; delay?: number }): Animation[];
leave(elements: Targets, options?: { targets?: "self" | "children"; stagger?: number; delay?: number }): Animation[];
morph(outgoing: Element, incoming: Element): Animation[];
reveal(elements: Targets, options?: { targets?: "self" | "children"; stagger?: number; root?: Element | null }): () => void; // cleanup
```

- `rise`: opacity 0 to 1 with a 12px lift, 640ms, 70ms stagger, `fill: backwards`.
- `leave`: opacity 1 to 0 with a 12px drop, 320ms, 40ms stagger, `fill: both`, holding the interrupted starting state through any delay and the final state until removed or risen again.
- `morph`: content-aware. Text uses temporary inert, `aria-hidden` sibling overlays, split by grapheme. Original text nodes and accessible labels remain untouched. Shared leading letters stay still; other outgoing letters blur out (180ms each, 35ms stagger), incoming letters blur in starting 60ms later. Without `Intl.Segmenter`, or for other content, whole faces crossfade: outgoing opacity 0, scale 0.8, blur 4px over 220ms, incoming starts at 130ms. The outgoing face becomes absolute and inert with `aria-hidden`; incoming returns to flow and accessibility. The parent becomes relative if needed and eases its width over 400ms. Temporary copies are removed on completion or cancellation.
- `reveal`: hides immediately, insets the observer's bottom edge by 10% of the scroll root's height measured at binding, then calls `rise` on first intersection with a 60ms stagger. Cleanup restores waiting elements' authored opacity and cancels active entrances. Duplicate or stale observer notifications are ignored.

`targets` defaults to `"self"` in core functions, components and hooks. `"children"` selects direct element children. A target list is captured when called; rebind to include children added later. Imports are SSR-safe; call core functions in the browser. Cancelled animations reject `finished` with `AbortError`: catch cancellation and do not remove a node whose exit was interrupted.

Every function is interruptible: it reads the element's computed state, cancels what is running, and animates from there, so rise after leave and leave after rise continue smoothly at any moment. Every function reads `prefers-reduced-motion` at call time: translate, scale and blur are dropped, opacity stays.

One curve: `cubic-bezier(0.2, 0, 0, 1)`.

## React

```tsx
import { Rise, Morph, Reveal } from "cube-motion/react";

<Rise as?="div" show?=true targets?="self" stagger? delay? {...elementProps}>children</Rise>
<Morph as?="span" active off on {...elementProps} />
<Reveal as?="div" targets?="self" stagger? root? {...elementProps}>children</Reveal>
```

- Polymorphic: `as` is a tag or a component that forwards its ref. Other props go to the element, typed for that tag. A caller `ref` is merged.
- `Rise` animates its own element on mount. With `show`, turning it false runs `leave`, waits for `finished`, then unmounts. Turning it true retargets the entrance. `show={false}` initially renders nothing. Use `targets="children"` for a staggered group.
- `Morph` renders two `span` faces in inline-flex. The active face sizes the wrapper; the inactive face is absolute, transparent, inert and `aria-hidden` from the first render. No CSS import.
- Hooks return object refs: `useRise(options?)`, `useMorph(active)` returning `[off, on]`, `useReveal(options?)`. Attach refs in the owning component so its commits detect replacement nodes. The React subpath includes `"use client"` for React Server Component frameworks.

## Solid

```tsx
import { Rise, Morph, Reveal } from "cube-motion/solid";

<Rise show={open()} class="toast">Saved</Rise>
<Morph active={saved()} off="Save" on="Saved" />
<Reveal as="ul" targets="children" class="cards">{cards}</Reveal>
```

Same components and props. Solid conventions: `class`, `ref` as a variable or callback, reactive reads (`open()`, not `open`). Bindings run on the client and are released in `onCleanup`.

## Vue

```vue
import { Rise, Morph, Reveal } from "cube-motion/vue";

<Rise as?="div" :show?="true" targets?="self" :stagger? :delay? v-bind="attrs">children</Rise>
<Morph as?="span" :active off? on? v-bind="attrs" />   <!-- or #off and #on slots -->
<Reveal as?="div" targets?="self" :stagger? :root? v-bind="attrs">children</Reveal>
```

Render-function components, no SFC. `inheritAttrs` is off and attrs are spread onto the element: `class`, `style` and listeners all land on it. A template `ref` on the component gives the instance; read `.$el` for the element. Custom `as` components must render one element root.

## Svelte

```svelte
import { rise, leave, morph, reveal } from "cube-motion/svelte";

<div in:rise out:leave>…</div>                     <!-- transitions; Svelte waits for out -->
<li in:rise={{ index: i }}>…</li>                  <!-- index * stagger, or delay: ms -->
<button use:morph={active}><i>off</i><i>on</i></button>  <!-- action; two children are the faces -->
<ul use:reveal={{ targets: "children" }}>…</ul>      <!-- action; explicitly observe children -->
```

No `show` prop: use `{#if}` with `in:rise out:leave`. The transitions evaluate the same curve in JS. Works on Svelte 4 and 5. Actions run only on the client: for SSR, include the initial face layout and `aria-hidden`/`inert` attributes in markup as shown in the README. `use:morph` requires exactly two child faces; `use:reveal` defaults to the element itself.

## Rules

- Never add `duration`, `easing`, `distance` or `scale` options. If a motion feels wrong, the fix is a new job, not a knob.
- Do not wrap a single button in `<Rise>` to press it. Use CSS.
- Do not animate unmount by hand. Use `show` in React, Vue and Solid, `out:leave` in Svelte.
- In vanilla, remove a node only after `leave`'s animations have finished.
- Do not import a stylesheet; there is none.

## Morph faces in vanilla

Give the two faces one parent. The active face sits in the flow and sizes the parent; the inactive one floats over it, hidden:

```css
.faces { position: relative; display: inline-flex; align-items: center; }
.faces > * { display: inline-flex; align-items: center; white-space: nowrap; will-change: opacity, filter, scale; }
.faces > .hidden { position: absolute; inset: 0; opacity: 0; }
```

`morph` swaps which face is in the flow on every call. `white-space: nowrap` keeps a text face from wrapping while the width eases. The framework components set all of this for you.

Set `aria-hidden="true" inert` on the initially inactive vanilla face. Subsequent calls synchronize those attributes.
