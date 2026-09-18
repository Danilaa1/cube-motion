import { calm, clear, current, list, moving, type Targets } from "./dom.js";
import { EASE, LIFT_PX, MS, STAGGER } from "./tokens.js";

export interface LeaveOptions {
  /** Animate the supplied elements or their direct children. Default "self". */
  targets?: "self" | "children";
  /** Milliseconds between each element. Default 40. */
  stagger?: number;
  /** Milliseconds before the first element. Default 0. */
  delay?: number;
}

/**
 * Fade and drop each target out, one after another. The end state holds until you
 * remove the element or rise it again. Returns one Animation per element, so
 * `await Promise.all(leave(el).map((a) => a.finished))` before unmounting.
 * An element already in motion continues from where it is.
 */
export function leave(targets: Targets, { targets: scope = "self", stagger = STAGGER.leave, delay = 0 }: LeaveOptions = {}): Animation[] {
  const still = calm();
  const to = still ? { opacity: 0 } : { opacity: 0, translate: `0 ${LIFT_PX}px` };
  const shown = still ? { opacity: 1 } : { opacity: 1, translate: "0 0" };
  return list(targets, scope).map((el, i) => {
    const from = moving(el) ? current(el, still ? ["opacity"] : ["opacity", "translate"]) : shown;
    clear(el);
    return el.animate([from, to], {
      duration: MS.leave,
      delay: delay + i * stagger,
      easing: EASE,
      fill: "both",
    });
  });
}
