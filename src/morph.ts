import { calm, clear } from "./dom.js";
import { EASE, MORPH_BLUR, MORPH_SCALE, MS } from "./tokens.js";

const shown = { opacity: 1, scale: 1, filter: "blur(0)" };

// Start from wherever the face is right now, so a morph interrupted mid-flight
// retargets like a CSS transition instead of snapping back to full size.
const current = (el: Element) => {
  const cs = getComputedStyle(el);
  return { opacity: cs.opacity || "1", scale: cs.scale || "none", filter: cs.filter || "none" };
};

/** Cross-morph one face into another: outgoing shrinks and blurs away, incoming grows in behind it. */
export function morph(outgoing: Element, incoming: Element): [Animation, Animation] {
  const still = calm();
  const gone = still
    ? { opacity: 0, scale: 1, filter: "blur(0)" }
    : { opacity: 0, scale: MORPH_SCALE, filter: MORPH_BLUR };
  const fromOut = current(outgoing);
  const fromIn = current(incoming);
  clear(outgoing);
  clear(incoming);
  return [
    outgoing.animate([fromOut, gone], { duration: MS.morph, easing: EASE, fill: "both" }),
    incoming.animate([fromIn, shown], {
      duration: MS.morph,
      delay: still ? 0 : MS.morphLead,
      easing: EASE,
      fill: "both",
    }),
  ];
}
