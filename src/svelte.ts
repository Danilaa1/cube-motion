import type { Action } from "svelte/action";
import type { TransitionConfig } from "svelte/transition";
import { calm } from "./dom.js";
import { morph as morphFaces, reveal as observe, type RevealOptions } from "./index.js";
import { EASE_POINTS, LIFT_PX, MS, STAGGER } from "./tokens.js";

// Svelte owns enter and exit through `in:` and `out:`, so rise and leave are transitions and
// the framework waits for the exit before removing the node. morph and reveal are actions.

// The one curve, evaluated in JS because Svelte samples css transitions itself.
const bezier = ([x1, y1, x2, y2]: readonly [number, number, number, number]) => {
  const at = (t: number, a1: number, a2: number) => ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
  const slope = (t: number, a1: number, a2: number) => 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (!s) break;
      t -= (at(t, x1, x2) - x) / s;
    }
    return at(t, y1, y2);
  };
};
const easing = bezier(EASE_POINTS);

export interface TransitionParams {
  /** Milliseconds before this element starts. Default 0. */
  delay?: number;
  /** Position in a list; multiplied by the stagger for that job. Default 0. */
  index?: number;
}

const fade = (t: number, u: number) => (calm() ? `opacity:${t}` : `opacity:${t};translate:0 ${LIFT_PX * u}px`);

/** `in:rise` fades and lifts the element in. Use `index` on list items to stagger them. */
export function rise(_node: Element, { delay = 0, index = 0 }: TransitionParams = {}): TransitionConfig {
  return { delay: delay + index * STAGGER.rise, duration: MS.enter, easing, css: fade };
}

/** `out:leave` fades and drops the element out. Svelte removes the node when it finishes. */
export function leave(_node: Element, { delay = 0, index = 0 }: TransitionParams = {}): TransitionConfig {
  return { delay: delay + index * STAGGER.leave, duration: MS.leave, easing, css: fade };
}

// The active face sits in the flow and sizes the node; the inactive one floats over it.
const face = (el: Element, shown: boolean) =>
  ((el as HTMLElement).style.cssText += `;display:inline-flex;align-items:center;white-space:nowrap;will-change:opacity,filter,scale${shown ? ";position:relative" : ";position:absolute;inset:0;opacity:0"}`);

/** `use:morph={active}` on an element whose two children are the off and on faces. */
export const morph: Action<HTMLElement, boolean> = (node, active) => {
  const off = node.children[0];
  const on = node.children[1];
  node.style.cssText += ";position:relative;display:inline-flex;align-items:center";
  face(off, !active);
  face(on, active);
  return {
    update(next) {
      if (next === active) return;
      active = next;
      morphFaces(active ? off : on, active ? on : off);
    },
  };
};

/** `use:reveal` on a container. Its children reveal as they scroll into view. */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => ({
  destroy: observe(node.children, options),
});
