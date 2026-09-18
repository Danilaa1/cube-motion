// The cut sheet. Picture and sound read the same numbers, so a beat can never
// drift from the hit that lands on it.
export const CUT = {
  dials: 0,
  turn: 330,
  thesis: 540,
  four: 820,
  numbers: 1400,
  never: 1630,
  reach: 1870,
  close: 2000,
  end: 2180,
} as const;

export const span = (from: keyof typeof CUT, to: keyof typeof CUT) => ({
  from: CUT[from],
  durationInFrames: CUT[to] - CUT[from],
});

/** In-scene beats, in frames from the scene's own start. */
export const DIALS = { in: 8, out: 132, line: 182 } as const;
export const TURN = [6, 22, 38] as const;
export const THESIS = { name: 10, four: 78, dials: 106, note: 152 } as const;
export const BEAT = 145; // one per function
export const FOUR = { name: 8, line: 34 } as const;
export const NUMBERS = [6, 44, 82, 120] as const;
export const NEVER = { line: 8, morphs: [78, 124], tail: 152 } as const;
export const REACH = { words: 6, zero: 46 } as const;
export const CLOSE = { name: 8, tag: 48, install: 82, link: 124 } as const;
