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
