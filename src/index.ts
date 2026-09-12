import {
  EASE,
  MORPH_BLUR,
  MORPH_SCALE,
  MS,
  PRESS_DIM,
  PRESS_SCALE,
  REVEAL_MARGIN,
  RISE_PX,
  STAGGER,
} from "./tokens.js";

/** A selector, one element, or anything iterable of elements (NodeList, HTMLCollection, array). */
export type Targets = string | Element | Iterable<Element>;

export interface RiseOptions {
  /** Milliseconds between each element. Default 70. */
  stagger?: number;
  /** Milliseconds before the first element. Default 0. */
  delay?: number;
}

export interface RevealOptions {
  /** Milliseconds between elements that enter the viewport together. Default 60. */
  stagger?: number;
  /** Scroll container to observe against. Default the viewport. */
  root?: Element | null;
}

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const list = (targets: Targets): Element[] =>
  typeof targets === "string"
    ? [...document.querySelectorAll(targets)]
    : targets instanceof Element
      ? [targets]
      : [...targets];

const clear = (el: Element) => el.getAnimations().forEach((a) => a.cancel());

const style = (el: Element) => (el as HTMLElement).style;

/** Fade and lift each target in, one after another. Returns one Animation per element. */
export function rise(targets: Targets, { stagger = STAGGER.rise, delay = 0 }: RiseOptions = {}): Animation[] {
  const from = calm() ? { opacity: 0 } : { opacity: 0, translate: `0 ${RISE_PX}px` };
  return list(targets).map((el, i) =>
    el.animate([from, { opacity: 1, translate: "0 0" }], {
      duration: MS.enter,
      delay: delay + i * stagger,
      easing: EASE,
      fill: "backwards",
    }),
  );
}

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

/** Hide the targets now and rise each one the first time it scrolls into view. Returns disconnect. */
export function reveal(targets: Targets, { stagger = STAGGER.reveal, root = null }: RevealOptions = {}): () => void {
  const els = list(targets);
  for (const el of els) style(el).opacity = "0";
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        style(entry.target).opacity = "";
        rise(entry.target, { delay: i++ * stagger });
        io.unobserve(entry.target);
      }
    },
    { root, rootMargin: REVEAL_MARGIN },
  );
  for (const el of els) io.observe(el);
  return () => io.disconnect();
}
