// Every number the library uses. Durations are picked by job, never by feel,
// and there is one curve, so nothing here is reachable from the public API.

export const EASE_POINTS = [0.2, 0, 0, 1] as const; // a strong ease-out; Svelte evaluates it in JS
export const EASE = `cubic-bezier(${EASE_POINTS.join(", ")})`;

export const MS = {
  enter: 640, // long enough for a stagger to read as a sequence
  leave: 320, // half the entrance: the eye has already moved on
  morph: 220,
  morphLead: 130, // the incoming face starts this long after the outgoing one
  fit: 400, // a morphing wrapper's width trails the letters, so the edge never leads them
} as const;

// Text faces morph per character: only the letters that differ move.
export const TEXT = { char: 180, lead: 60, stagger: 35 } as const;

export const STAGGER = { rise: 70, leave: 40, reveal: 60 } as const;

export const LIFT_PX = 12; // rise comes up this far; leave drops the same distance
export const MORPH_SCALE = 0.8; // a slight shrink under the blur: focus pulling, not a pop
export const MORPH_BLUR = "blur(4px)";
export const REVEAL_INSET = 0.1; // inset the bottom by 10% of the scroll root's height, measured at binding
