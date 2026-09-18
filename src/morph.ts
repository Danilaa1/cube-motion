import { calm, clear, current } from "./dom.js";
import { EASE, MORPH_BLUR, MORPH_SCALE, MS, TEXT } from "./tokens.js";

// TypeScript's ES2020 lib predates Segmenter; browsers without it crossfade whole faces.
const Segmenter = (Intl as typeof Intl & {
  Segmenter?: new (locale: undefined, options: { granularity: "grapheme" }) => {
    segment(text: string): Iterable<{ segment: string }>;
  };
}).Segmenter;
const segmenter = Segmenter && new Segmenter(undefined, { granularity: "grapheme" });
const textOf = (el: Element) =>
  el instanceof HTMLElement && !el.childElementCount && el.textContent?.trim() ? el.textContent : null;
const style = (el: Element) => (el as HTMLElement).style;
type Keys = Parameters<typeof current>[1];
type Overlay = { node: HTMLElement; chars: HTMLElement[]; text: string };
const overlays = new WeakMap<Element, Overlay>();
const owners = new WeakMap<Element, object>();

// CSS width is a content-box size unless border-box was requested. offsetWidth is
// always the border box, but unlike the painted rectangle it ignores transforms.
const width = (el: Element) => {
  const cs = getComputedStyle(el);
  const computed = parseFloat(cs.width);
  if (Number.isFinite(computed)) return computed;
  const borderBox = (el as HTMLElement).offsetWidth ?? el.getBoundingClientRect().width;
  const edges = [cs.paddingLeft, cs.paddingRight, cs.borderLeftWidth, cs.borderRightWidth];
  return borderBox - (cs.boxSizing === "border-box" ? 0 : edges.reduce((sum, edge) => sum + (parseFloat(edge) || 0), 0));
};

// Offsets use the parent's layout coordinates, so padding is included and a
// transform on the wrapper cannot scale the position a second time. Insets locate
// the margin box; offsetLeft/Top locate the border box.
const position = (el: Element) => {
  const cs = getComputedStyle(el);
  const html = el as HTMLElement;
  let left = html.offsetLeft;
  let top = html.offsetTop;
  // SVG faces have no offsetLeft/Top. Convert their viewport box back into the
  // parent's layout coordinates, including a parent press scale and border.
  if (left === undefined || top === undefined) {
    const parent = el.parentElement;
    const box = el.getBoundingClientRect();
    const bounds = parent?.getBoundingClientRect();
    const sx = parent?.offsetWidth && bounds?.width ? bounds.width / parent.offsetWidth : 1;
    const sy = parent?.offsetHeight && bounds?.height ? bounds.height / parent.offsetHeight : 1;
    left = (box.left - (bounds?.left ?? 0)) / sx - (parent?.clientLeft ?? 0);
    top = (box.top - (bounds?.top ?? 0)) / sy - (parent?.clientTop ?? 0);
  }
  return {
    left: `${left - (parseFloat(cs.marginLeft) || 0)}px`,
    top: `${top - (parseFloat(cs.marginTop) || 0)}px`,
  };
};

const selectFaces = (outgoing: Element, incoming: Element) => {
  const wrapper = outgoing.parentElement;
  if (wrapper && ["static", ""].includes(getComputedStyle(wrapper).position)) style(wrapper).position = "relative";
  const at = position(outgoing);
  Object.assign(style(outgoing), { position: "absolute", inset: "auto", ...at });
  style(outgoing).opacity = "0";
  outgoing.setAttribute("aria-hidden", "true");
  outgoing.setAttribute("inert", "");
  style(incoming).position = "relative";
  style(incoming).inset = "auto";
  style(incoming).opacity = "1";
  incoming.removeAttribute("aria-hidden");
  incoming.removeAttribute("inert");
};

const removeOverlay = (el: Element, cancel = true) => {
  const overlay = overlays.get(el);
  if (!overlay) return;
  if (cancel) overlay.chars.forEach(clear);
  overlay.node.remove();
  overlays.delete(el);
};

/** Internal adapter helper: establish the selected face without a mount animation. */
export function prepareMorph(outgoing: Element, incoming: Element): void {
  for (const el of [outgoing, incoming]) {
    // A cancelled run may still have its promise cleanup queued. Preparation owns
    // this selection now, including when an adapter replaced only the other face.
    owners.delete(el);
    removeOverlay(el);
    clear(el);
    if (el.parentElement) clear(el.parentElement);
  }
  selectFaces(outgoing, incoming);
}

// Keep framework-owned children untouched. The real face supplies layout and the
// accessible text; a temporary, inert sibling supplies only the animated pixels.
const characters = (el: Element, text: string): Overlay => {
  const old = overlays.get(el);
  if (old?.text === text && old.node.parentElement === el.parentElement) return old;
  removeOverlay(el);
  const node = el.cloneNode(false) as HTMLElement;
  node.removeAttribute("id");
  node.removeAttribute("aria-label");
  node.removeAttribute("aria-labelledby");
  node.setAttribute("aria-hidden", "true");
  node.setAttribute("inert", "");
  node.setAttribute("data-cube-morph-overlay", "");
  Object.assign(node.style, { position: "absolute", inset: "auto", ...position(el), width: "max-content", gap: "0", opacity: "1", scale: "1", filter: "none", pointerEvents: "none" });
  const chars = [...segmenter!.segment(text)].map(({ segment }) => {
    const char = document.createElement("cube-morph-char");
    char.textContent = segment;
    char.style.cssText = "all:unset;display:inline-block;box-sizing:content-box;margin:0;padding:0;border:0;white-space:pre;will-change:opacity,filter";
    node.appendChild(char);
    return char;
  });
  el.parentElement!.appendChild(node);
  const overlay = { node, chars, text };
  overlays.set(el, overlay);
  return overlay;
};

const animate = (el: Element, from: Keyframe, to: Keyframe, duration: number, delay = 0) => {
  clear(el);
  const animation = el.animate([from, to], { duration, delay, easing: EASE, fill: "both" });
  // Consumers can cancel the returned handle without producing an unhandled rejection.
  void animation.finished.catch(() => {});
  return animation;
};

const finishFace = (el: Element, owner: object, animations: Animation[], opacity: string) => {
  const finish = (cancelled: boolean) => {
    if (owners.get(el) !== owner) return;
    owners.delete(el);
    style(el).opacity = opacity;
    removeOverlay(el, cancelled);
    // Keep successfully finished handles resolved. Cancelling them here would
    // reset WAAPI's finished promise, leaving callers who await later pending.
    if (cancelled) animations.forEach((animation) => animation.cancel());
  };
  // Cancellation also removes visual copies and reveals the latest framework text.
  void Promise.all(animations.map((animation) => animation.finished)).then(() => finish(false), () => finish(true));
};

/**
 * Morph one face into another. Text faces diff per grapheme: shared leading letters
 * stay still, the rest blur out and in, staggered. Other faces crossfade. The parent
 * follows the incoming width. Interrupted faces retarget from their current pixels.
 */
export function morph(outgoing: Element, incoming: Element): Animation[] {
  if (outgoing === incoming) return [];
  const still = calm();
  const wrapper = outgoing.parentElement;
  const before = wrapper ? width(wrapper) : 0;
  const outText = textOf(outgoing);
  const inText = textOf(incoming);
  const keys: Keys = still ? ["opacity"] : ["opacity", "scale", "filter"];
  const gone = still ? { opacity: 0 } : { opacity: 0, scale: MORPH_SCALE, filter: MORPH_BLUR };
  const shown = still ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0)" };
  const outFrom = outgoing.getAnimations().length ? current(outgoing, keys) : shown;
  const inFrom = incoming.getAnimations().length ? current(incoming, keys) : gone;
  clear(outgoing);
  clear(incoming);
  const owner = {};
  owners.set(outgoing, owner);
  owners.set(incoming, owner);
  // Measure the interrupted width first, then remove its fill before measuring the target.
  if (wrapper) clear(wrapper);
  selectFaces(outgoing, incoming);
  const outAnimations: Animation[] = [];
  const inAnimations: Animation[] = [];

  if (!still && segmenter && wrapper && incoming.parentElement === wrapper && outText !== null && inText !== null) {
    const a = characters(outgoing, outText).chars;
    const b = characters(incoming, inText).chars;
    const charKeys: Keys = ["opacity", "filter"];
    const visible = { opacity: 1, filter: "blur(0)" };
    const hidden = { opacity: 0, filter: MORPH_BLUR };
    // Snapshot both sets before cancelling anything: prefix pixels transfer to the
    // incoming copy, including partially visible letters during a rapid reversal.
    const aFrom = a.map((c) => c.getAnimations().length ? current(c, charKeys) : { ...visible, opacity: c.style.opacity || 1 });
    const bFrom = b.map((c) => c.getAnimations().length ? current(c, charKeys) : hidden);
    clear(outgoing);
    clear(incoming);
    style(outgoing).opacity = style(incoming).opacity = "0";
    let p = 0;
    while (p < a.length && p < b.length && a[p].textContent === b[p].textContent) p++;
    a.forEach((c, i) => {
      if (i < p) {
        clear(c);
        c.style.opacity = "0";
      } else {
        outAnimations.push(animate(c, aFrom[i], hidden, TEXT.char, (i - p) * TEXT.stagger));
      }
    });
    b.forEach((c, i) => {
      c.style.opacity = "1";
      inAnimations.push(animate(c, i < p ? aFrom[i] : bFrom[i], visible, TEXT.char, i < p ? 0 : TEXT.lead + (i - p) * TEXT.stagger));
    });
  } else {
    removeOverlay(outgoing);
    removeOverlay(incoming);
    style(outgoing).willChange = style(incoming).willChange = keys.join(", ");
    outAnimations.push(animate(outgoing, outFrom, gone, MS.morph));
    inAnimations.push(animate(incoming, inFrom, shown, MS.morph, still ? 0 : MS.morphLead));
  }

  finishFace(outgoing, owner, outAnimations, "0");
  finishFace(incoming, owner, inAnimations, "1");
  const animations = [...outAnimations, ...inAnimations];
  if (wrapper && !still) {
    const after = width(wrapper);
    if (before > 0 && after > 0 && before !== after) {
      const fit = wrapper.animate([{ width: `${before}px` }, { width: `${after}px` }], { duration: MS.fit, easing: EASE });
      void fit.finished.catch(() => {});
      animations.push(fit);
    }
  }
  return animations;
}
