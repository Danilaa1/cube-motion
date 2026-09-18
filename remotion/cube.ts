// The film animates on the library's own numbers. Everything here reads
// src/tokens.ts, so the promo cannot drift from what ships.
import { Easing, interpolate } from "remotion";
import { EASE_POINTS, LIFT_PX, MORPH_BLUR, MORPH_SCALE, MS, STAGGER, TEXT } from "../src/tokens";

export const EASE = Easing.bezier(EASE_POINTS[0], EASE_POINTS[1], EASE_POINTS[2], EASE_POINTS[3]);
export const BLUR_PX = parseFloat(MORPH_BLUR.replace(/[^\d.]/g, ""));

/** Milliseconds as frames. */
export const ms = (fps: number, value: number) => (value / 1000) * fps;

const ramp = (frame: number, fps: number, duration: number, delay = 0) =>
  interpolate(frame - ms(fps, delay), [0, ms(fps, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

export type Motion = { opacity: number; transform: string; filter?: string };

/** rise: 640ms, 12px lift, 70ms stagger. `fill: backwards` is the clamped left edge. */
export const riseAt = (frame: number, fps: number, i = 0, stagger: number = STAGGER.rise, delay = 0): Motion => {
  const t = ramp(frame, fps, MS.enter, delay + i * stagger);
  return { opacity: t, transform: `translateY(${(1 - t) * LIFT_PX}px)` };
};

/** leave: 320ms, 12px drop, 40ms stagger. `fill: forwards` is the clamped right edge. */
export const leaveAt = (frame: number, fps: number, i = 0, stagger: number = STAGGER.leave, delay = 0): Motion => {
  const t = ramp(frame, fps, MS.leave, delay + i * stagger);
  return { opacity: 1 - t, transform: `translateY(${t * LIFT_PX}px)` };
};

/** rise in, hold, leave out. `hold` counts from the end of the entrance. */
export const riseHoldLeave = (
  frame: number,
  fps: number,
  out: number,
  i = 0,
  delay = 0,
): Motion => (frame < out ? riseAt(frame, fps, i, STAGGER.rise, delay) : leaveAt(frame - out, fps, i));

export const prefixLen = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

export type CharState = { ch: string; opacity: number; blur: number };

/**
 * morph, text face: shared leading letters stay put, the rest blur out and the new
 * ones blur in 60ms later, 35ms apart, 180ms each.
 */
export const morphText = (frame: number, fps: number, from: string, to: string) => {
  const p = prefixLen(from, to);
  const outgoing: CharState[] = [...from].map((ch, i) => {
    if (i < p) return { ch, opacity: 0, blur: 0 };
    const t = ramp(frame, fps, TEXT.char, (i - p) * TEXT.stagger);
    return { ch, opacity: 1 - t, blur: t * BLUR_PX };
  });
  const incoming: CharState[] = [...to].map((ch, i) => {
    if (i < p) return { ch, opacity: 1, blur: 0 };
    const t = ramp(frame, fps, TEXT.char, TEXT.lead + (i - p) * TEXT.stagger);
    return { ch, opacity: t, blur: (1 - t) * BLUR_PX };
  });
  return { prefix: p, outgoing, incoming };
};

/** morph, other faces: 220ms crossfade under a blur, the incoming one 130ms behind. */
export const morphFace = (frame: number, fps: number) => {
  const out = ramp(frame, fps, MS.morph);
  const inc = ramp(frame, fps, MS.morph, MS.morphLead);
  return {
    outgoing: {
      opacity: 1 - out,
      transform: `scale(${1 - (1 - MORPH_SCALE) * out})`,
      filter: `blur(${out * BLUR_PX}px)`,
    },
    incoming: {
      opacity: inc,
      transform: `scale(${MORPH_SCALE + (1 - MORPH_SCALE) * inc})`,
      filter: `blur(${(1 - inc) * BLUR_PX}px)`,
    },
  };
};

/** The wrapper's width trails the letters at 400ms, so the edge never leads them. */
export const fitWidth = (frame: number, fps: number, before: number, after: number) =>
  interpolate(frame, [0, ms(fps, MS.fit)], [before, after], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

/** A plain eased 0 to 1 over `duration` ms, for the film's own furniture. */
export const over = ramp;

/** Layout width of a string, measured with the real font. */
let ctx: CanvasRenderingContext2D | null = null;
export const textWidth = (text: string, font: string, tracking = "0px") => {
  ctx ||= document.createElement("canvas").getContext("2d");
  if (!ctx) return 0;
  ctx.font = font;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = tracking;
  return ctx.measureText(text).width;
};

/** Sum of per-character advances: what a face split into spans actually measures. */
export const charsWidth = (text: string, font: string, tracking = "0px") =>
  [...text].reduce((total, ch) => total + textWidth(ch, font, tracking), 0);
