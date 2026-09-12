# cube-motion

Four fixed motions on the Web Animations API. Zero dependencies. Optional React and Solid adapters.

```
npm i cube-motion
```

## API

```ts
import { rise, press, morph, reveal } from "cube-motion";

type Targets = string | Element | Iterable<Element>;

rise(targets: Targets, options?: { stagger?: number; delay?: number }): Animation[];
press(el: Element): () => void;                       // unbind
morph(outgoing: Element, incoming: Element): [Animation, Animation];
reveal(targets: Targets, options?: { stagger?: number; root?: Element | null }): () => void; // disconnect
```

- `rise`: opacity 0 to 1 with a 12px lift, 640ms, 70ms stagger by default, `fill: backwards`.
- `press`: bind on `pointerdown` and the three release events. Scale 0.97 in 120ms, back in 320ms, then the fill is cleared.
- `morph`: outgoing to opacity 0, scale 0.25, blur 4px over 220ms. Incoming runs the reverse starting 130ms later. `fill: both` on each.
- `reveal`: sets `style.opacity = "0"` immediately, observes with `rootMargin: "0px 0px -10% 0px"`, calls `rise` once per element on first intersection with a 60ms stagger, then unobserves.

Every function cancels running animations on its elements before starting. Every function reads `prefers-reduced-motion` at call time: movement, scale and blur are dropped, opacity stays, `press` dims to 0.8 instead.

There are no easing, duration or distance options. Do not add them; add a function for the new job instead.

## React

```tsx
import { Rise, Press, Morph, Reveal } from "cube-motion/react";

<Rise as?="div" stagger? delay? {...elementProps}>children</Rise>   // children rise on mount
<Press as?="button" {...elementProps}>children</Press>               // press feedback on the element
<Morph as?="span" active off on {...elementProps} />                 // shows `on` when active, morphs on change
<Reveal as?="div" stagger? root? {...elementProps}>children</Reveal> // children reveal on scroll
```

Polymorphic: `as` is a tag name or a component that forwards its ref. All other
props go to the element, typed for that tag. A caller `ref` is merged. `Morph`
renders two `span` faces in an inline grid, both in cell `1 / 1`, the inactive
one at `opacity: 0` from the first render; no CSS import needed.

Hooks are exported for when you already own the element:

```ts
const ref = useRise(options?);      // attach to a container; its children rise on mount
const ref = usePress();             // attach to the pressable element
const [off, on] = useMorph(active); // attach to the two faces; settles on mount, morphs on change
const ref = useReveal(options?);    // attach to a container; its children reveal on scroll
```

Each hook creates and returns its ref, generic over the element type
(`usePress<HTMLButtonElement>()`). Hooks bind in `useEffect` and clean up on unmount.

## Solid

```tsx
import { Rise, Press, Morph, Reveal } from "cube-motion/solid";
```

Same components and props as React, Solid conventions: `class` not
`className`, `ref` is a variable or callback, `active` is read reactively so
pass `saved()` or a getter. No hooks; the components are the whole API.
Bindings happen in `onMount` and are released in `onCleanup`, so SSR is safe.

## Markup for morph in vanilla

The two faces must overlap. Stack them in a grid cell:

```css
.faces { display: inline-grid; }
.faces > * { grid-area: 1 / 1; }
```

Hide the inactive face yourself (`style.opacity = "0"` or a class). The React `Morph` component does both for you.
