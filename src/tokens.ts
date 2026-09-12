// Every number the library uses. Durations are picked by job, never by feel,
// and there is one curve, so nothing here is reachable from the public API.

export const EASE = "cubic-bezier(0.2, 0, 0, 1)";

export const MS = {
  press: 120,
  release: 320,
  morph: 220,
  morphLead: 130, // the incoming face starts this long after the outgoing one
  enter: 640,
} as const;

export const STAGGER = { rise: 70, reveal: 60 } as const;

export const RISE_PX = 12;
export const PRESS_SCALE = 0.97;
export const PRESS_DIM = 0.8; // what press does instead of shrinking under reduced motion
export const MORPH_SCALE = 0.25;
export const MORPH_BLUR = "blur(4px)";
export const REVEAL_MARGIN = "0px 0px -10% 0px"; // fire once 10% of the viewport height is inside
