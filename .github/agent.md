# cube-motion

Four fixed motions on the Web Animations API. Zero dependencies. Optional React adapter.

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

```ts
import { useRise, usePress, useMorph, useReveal } from "cube-motion/react";

useRise(ref, options?);            // ref: container; rises its children on mount
usePress(ref);                     // ref: the pressable element
useMorph(offRef, onRef, active);   // settles on mount without motion, morphs on change
useReveal(ref, options?);          // ref: container; reveals its children
```

Hooks bind in `useEffect` and clean up on unmount. Safe under StrictMode. SSR safe: nothing touches the DOM until effects run.

## Markup for morph

The two faces must overlap. Stack them in a grid cell:

```css
.faces { display: inline-grid; }
.faces > * { grid-area: 1 / 1; }
```

Hide the inactive face yourself in vanilla (`style.opacity = "0"` or a class); `useMorph` settles it for you on mount.
