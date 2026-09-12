import { calm, clear } from "./dom.js";
import { EASE, MORPH_BLUR, MORPH_SCALE, MS } from "./tokens.js";

/** Cross-morph one face into another: outgoing shrinks and blurs away, incoming grows in behind it. */
export function morph(outgoing: Element, incoming: Element): [Animation, Animation] {
  const still = calm();
  const shown = { opacity: 1, scale: 1, filter: "blur(0)" };
  const gone = still
    ? { opacity: 0, scale: 1, filter: "blur(0)" }
    : { opacity: 0, scale: MORPH_SCALE, filter: MORPH_BLUR };
  clear(outgoing);
  clear(incoming);
  return [
    outgoing.animate([shown, gone], { duration: MS.morph, easing: EASE, fill: "both" }),
    incoming.animate([gone, shown], {
      duration: MS.morph,
      delay: still ? 0 : MS.morphLead,
      easing: EASE,
      fill: "both",
    }),
  ];
}
