import { calm, clear, list, type Targets } from "./dom.js";
import { EASE, LIFT_PX, MS, STAGGER } from "./tokens.js";

export interface LeaveOptions {
  /** Milliseconds between each element. Default 40. */
  stagger?: number;
  /** Milliseconds before the first element. Default 0. */
  delay?: number;
}

/**
 * Fade and drop each target out, one after another. The end state holds until you
 * remove the element or rise it again. Returns one Animation per element, so
 * `await Promise.all(leave(el).map((a) => a.finished))` before unmounting.
 */
export function leave(targets: Targets, { stagger = STAGGER.leave, delay = 0 }: LeaveOptions = {}): Animation[] {
  const to = calm() ? { opacity: 0 } : { opacity: 0, translate: `0 ${LIFT_PX}px` };
  return list(targets).map((el, i) => {
    clear(el);
    return el.animate([{ opacity: 1, translate: "0 0" }, to], {
      duration: MS.leave,
      delay: delay + i * stagger,
      easing: EASE,
      fill: "forwards",
    });
  });
}
