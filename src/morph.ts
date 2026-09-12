import { calm, clear, current } from "./dom.js";
import { EASE, MORPH_BLUR, MORPH_SCALE, MS } from "./tokens.js";

const shown = { opacity: 1, scale: 1, filter: "blur(0)" };
const keys = ["opacity", "scale", "filter"] as const;

/**
 * Cross-morph one face into another: outgoing shrinks and blurs away, incoming grows in
 * behind it. Each face starts from where it is, so an interrupted morph retargets.
 */
export function morph(outgoing: Element, incoming: Element): [Animation, Animation] {
  const still = calm();
  const gone = still
    ? { opacity: 0, scale: 1, filter: "blur(0)" }
    : { opacity: 0, scale: MORPH_SCALE, filter: MORPH_BLUR };
  const fromOut = current(outgoing, [...keys]);
  const fromIn = current(incoming, [...keys]);
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
