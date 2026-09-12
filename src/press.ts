import { calm, clear } from "./dom.js";
import { EASE, MS, PRESS_DIM, PRESS_SCALE } from "./tokens.js";

/** Shrink the element while the pointer is down, spring it back on release. Returns unbind. */
export function press(el: Element): () => void {
  let held: Animation | null = null;
  const down = () => {
    clear(el);
    const to = calm() ? { opacity: PRESS_DIM } : { scale: PRESS_SCALE };
    held = el.animate(to, { duration: MS.press, easing: EASE, fill: "forwards" });
  };
  const up = () => {
    if (!held) return;
    held = null;
    const back = calm() ? { opacity: 1 } : { scale: 1 };
    const release = el.animate(back, { duration: MS.release, easing: EASE, fill: "forwards" });
    // Drop the forward fill once settled so the element owns its own style again.
    release.finished.then(() => clear(el)).catch(() => {});
  };
  const ends = ["pointerup", "pointercancel", "pointerleave"];
  el.addEventListener("pointerdown", down);
  for (const type of ends) el.addEventListener(type, up);
  return () => {
    el.removeEventListener("pointerdown", down);
    for (const type of ends) el.removeEventListener(type, up);
  };
}
