import { calm, clear, current } from "./dom.js";
import { EASE, MORPH_BLUR, MORPH_SCALE, MS, TEXT } from "./tokens.js";

// A face is text when it holds nothing but text, or the character spans of an earlier morph.
const CHARS = "data-cube-chars";
const textOf = (el: Element) =>
  el.hasAttribute(CHARS) ? el.getAttribute(CHARS) : el.childElementCount === 0 ? el.textContent : null;

// Split a text face into one span per character so each can blur on its own.
const chars = (el: Element, text: string): HTMLElement[] => {
  if (el.getAttribute(CHARS) === text) return [...el.children] as HTMLElement[];
  el.setAttribute(CHARS, text);
  el.setAttribute("aria-label", text);
  el.textContent = "";
  return [...text].map((c) => {
    const span = document.createElement("span");
    span.textContent = c;
    span.setAttribute("aria-hidden", "true");
    span.style.cssText = "display:inline-block;white-space:pre";
    el.appendChild(span);
    return span;
  });
};

const prefix = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

const style = (el: Element) => (el as HTMLElement).style;
const run = (el: Element, to: Keyframe, keys: Parameters<typeof current>[1], duration: number, delay = 0) => {
  const from = current(el, keys);
  clear(el);
  return el.animate([from, to], { duration, delay, easing: EASE, fill: "both" });
};

/**
 * Morph one face into another. Text faces diff per character: shared leading letters
 * stay still, the rest blur out and the new ones blur in, staggered. Other faces crossfade,
 * the outgoing one blurring and shrinking slightly as the incoming grows in behind it.
 * The faces' parent takes the incoming face's width, eased. Interrupt it and everything
 * retargets from where it is.
 */
export function morph(outgoing: Element, incoming: Element): Animation[] {
  const still = calm();
  const wrapper = outgoing.parentElement;
  const before = wrapper?.getBoundingClientRect().width ?? 0;

  // The incoming face takes the flow; the outgoing one floats over it. Both are set
  // explicitly so a class that hid the face at first paint cannot reassert itself.
  if (wrapper && ["static", ""].includes(getComputedStyle(wrapper).position)) style(wrapper).position = "relative";
  style(outgoing).position = "absolute";
  style(outgoing).inset = "0";
  style(incoming).position = "relative";
  style(incoming).inset = "auto";

  const outText = textOf(outgoing);
  const inText = textOf(incoming);
  const animations: Animation[] = [];

  if (outText !== null && inText !== null) {
    const a = chars(outgoing, outText);
    const b = chars(incoming, inText);
    const p = prefix(outText, inText);
    const blur = still ? "blur(0)" : MORPH_BLUR;
    style(outgoing).opacity = "1";
    style(incoming).opacity = "1";
    a.forEach((c, i) => {
      if (i < p) style(c).opacity = "0";
      else animations.push(run(c, { opacity: 0, filter: blur }, ["opacity", "filter"], TEXT.char, (i - p) * TEXT.stagger));
    });
    b.forEach((c, i) => {
      style(c).opacity = "";
      if (i < p) animations.push(run(c, { opacity: 1, filter: "blur(0)" }, ["opacity", "filter"], TEXT.char));
      else animations.push(run(c, { opacity: 1, filter: "blur(0)" }, ["opacity", "filter"], TEXT.char, TEXT.lead + (i - p) * TEXT.stagger));
    });
  } else {
    const gone = still ? { opacity: 0, scale: 1, filter: "blur(0)" } : { opacity: 0, scale: MORPH_SCALE, filter: MORPH_BLUR };
    const shown = { opacity: 1, scale: 1, filter: "blur(0)" };
    const keys = ["opacity", "scale", "filter"] as const;
    animations.push(run(outgoing, gone, [...keys], MS.morph), run(incoming, shown, [...keys], MS.morph, still ? 0 : MS.morphLead));
  }

  if (wrapper) {
    const after = wrapper.getBoundingClientRect().width;
    if (before && after && before !== after && !still) {
      clear(wrapper);
      animations.push(wrapper.animate([{ width: `${before}px` }, { width: `${after}px` }], { duration: MS.fit, easing: EASE }));
    }
  }
  return animations;
}
