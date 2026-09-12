import { calm, list, type Targets } from "./dom.js";
import { EASE, MS, RISE_PX, STAGGER } from "./tokens.js";

export interface RiseOptions {
  /** Milliseconds between each element. Default 70. */
  stagger?: number;
  /** Milliseconds before the first element. Default 0. */
  delay?: number;
}

/** Fade and lift each target in, one after another. Returns one Animation per element. */
export function rise(targets: Targets, { stagger = STAGGER.rise, delay = 0 }: RiseOptions = {}): Animation[] {
  const from = calm() ? { opacity: 0 } : { opacity: 0, translate: `0 ${RISE_PX}px` };
  return list(targets).map((el, i) =>
    el.animate([from, { opacity: 1, translate: "0 0" }], {
      duration: MS.enter,
      delay: delay + i * stagger,
      easing: EASE,
      fill: "backwards",
    }),
  );
}
