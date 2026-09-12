// Every number the library uses. Durations are picked by job, never by feel,
// and there is one curve, so nothing here is reachable from the public API.

export const EASE = "cubic-bezier(0.2, 0, 0, 1)";

export const MS = {
  enter: 640, // long enough for a stagger to read as a sequence
  leave: 320, // half the entrance: the eye has already moved on
  morph: 220,
  morphLead: 130, // the incoming face starts this long after the outgoing one
} as const;

export const STAGGER = { rise: 70, leave: 40, reveal: 60 } as const;

export const LIFT_PX = 12; // rise comes up this far; leave drops the same distance
export const MORPH_SCALE = 0.25;
export const MORPH_BLUR = "blur(4px)";
export const REVEAL_MARGIN = "0px 0px -10% 0px"; // fire once 10% of the viewport height is inside
