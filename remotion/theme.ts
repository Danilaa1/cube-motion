// The film's palette is cube-site's, unchanged. Flat surfaces, hairline borders,
// one restrained neutral shadow. No gradients, no glows, no coloured shadows.

export const C = {
  // Warm printing paper, sampled off the reference: #f3eee5 with the grain on top.
  bg: "#f3eee5",
  surface: "#faf7f1",
  block: "#ebe5da",
  ink1: "#1b1a18",
  ink2: "#4a4741",
  ink3: "#7c766c",
  ink4: "#a8a294",
  ink5: "#ddd6c8",
  grid: "#ebe5da",
  accent: "#2a5bd7",
  accentWash: "rgba(42, 91, 215, 0.10)",
  // The two plates that sit a hair out of register under anything inked.
  magenta: "#e0397f",
  cyan: "#2ba7d6",
} as const;

export const SHADOW = {
  card: "0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 16px -8px rgba(0, 0, 0, 0.10)",
  btn: "0 1px 2px rgba(0, 0, 0, 0.10), 0 2px 6px -2px rgba(0, 0, 0, 0.12)",
} as const;

// Sharp and small on tags, pill on controls, one card radius with its own frame pad.
export const R = { tag: 4, in: 14, card: 24, pill: 999 } as const;

export const FONT = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  pen: '"Drawably Pen", Inter, sans-serif',
} as const;

// One scale for the film, named by role. Deviating from it needs a reason.
export const TYPE = {
  hero: 132,
  display: 124,
  title: 98,
  lead: 84,
  sub: 58,
  body: 44,
  small: 26,
} as const;

/** Tracking tightens as display type grows, and all but disappears at reading sizes. */
export const track = (size: number) =>
  size >= 110 ? "-0.045em" : size >= 72 ? "-0.038em" : size >= 44 ? "-0.028em" : size >= 28 ? "-0.018em" : "-0.01em";
