/** A selector, one element, or anything iterable of elements (NodeList, HTMLCollection, array). */
export type Targets = string | Element | Iterable<Element>;

export const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export const list = (targets: Targets): Element[] =>
  typeof targets === "string"
    ? [...document.querySelectorAll(targets)]
    : targets instanceof Element
      ? [targets]
      : [...targets];

/** Cancel everything running on the element so a new motion never stacks on an old fill. */
export const clear = (el: Element) => el.getAnimations().forEach((a) => a.cancel());

/** True while any animation is running or filling on the element. */
export const moving = (el: Element) => el.getAnimations().length > 0;

/**
 * The element's current opacity and transform-related values, read before `clear` so a
 * motion that interrupts another continues from where it is instead of snapping to a
 * fixed first keyframe. Only the keys asked for are returned.
 */
export const current = (el: Element, keys: ("opacity" | "translate" | "scale" | "filter")[]) => {
  const cs = getComputedStyle(el);
  const fallback = { opacity: "1", translate: "none", scale: "none", filter: "none" };
  return Object.fromEntries(keys.map((k) => [k, cs[k] || fallback[k]])) as Keyframe;
};
