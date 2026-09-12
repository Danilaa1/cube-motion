import {
  createElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref as ReactRef,
  type RefObject,
} from "react";
import { morph, press, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

type Ref<T extends Element> = RefObject<T | null>;

// Hooks: the escape hatch when you already own the element.

/** Returns a ref for a container. Its children rise on mount. */
export function useRise<T extends Element = HTMLElement>(options?: RiseOptions): Ref<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (ref.current) rise(ref.current.children, options);
  }, []);
  return ref;
}

/** Returns a ref for the pressable element. */
export function usePress<T extends Element = HTMLElement>(): Ref<T> {
  const ref = useRef<T>(null);
  useEffect(() => (ref.current ? press(ref.current) : undefined), []);
  return ref;
}

/** Returns [off, on] refs. `on` shows when active. Morphs on change, settles without motion on mount. */
export function useMorph<T extends Element = HTMLElement>(active: boolean): [Ref<T>, Ref<T>] {
  const off = useRef<T>(null);
  const on = useRef<T>(null);
  const shown = useRef(active);
  useEffect(() => {
    if (!off.current || !on.current) return;
    const faces = morph(active ? off.current : on.current, active ? on.current : off.current);
    if (shown.current === active) faces.forEach((a) => a.finish());
    shown.current = active;
  }, [active]);
  return [off, on];
}

/** Returns a ref for a container. Its children reveal as they scroll into view. */
export function useReveal<T extends Element = HTMLElement>(options?: RevealOptions): Ref<T> {
  const ref = useRef<T>(null);
  useEffect(() => (ref.current ? reveal(ref.current.children, options) : undefined), []);
  return ref;
}

// Components: render the element you name, spread the rest, bind the motion.

type Props<T extends ElementType, Own> = Own & { as?: T } & Omit<ComponentPropsWithoutRef<T>, keyof Own | "as">;
type Poly<D extends ElementType, Own> = <T extends ElementType = D>(
  props: Props<T, Own> & { ref?: ReactRef<Element> },
) => ReactElement | null;

const merged = (own: Ref<Element>, theirs: ReactRef<Element> | undefined) => (el: Element | null) => {
  (own as { current: Element | null }).current = el;
  if (typeof theirs === "function") theirs(el);
  else if (theirs) (theirs as { current: Element | null }).current = el;
};

/** Children rise on mount, staggered. Renders a div unless `as` says otherwise. */
export const Rise = forwardRef<Element, Props<ElementType, RiseOptions>>(
  ({ as = "div", stagger, delay, ...rest }, ref) =>
    createElement(as, { ...rest, ref: merged(useRise({ stagger, delay }), ref) }),
) as unknown as Poly<"div", RiseOptions>;

/** A pressable element with press feedback. Renders a button unless `as` says otherwise. */
export const Press = forwardRef<Element, Props<ElementType, {}>>(({ as = "button", ...rest }, ref) =>
  createElement(as, { ...rest, ref: merged(usePress(), ref) }),
) as unknown as Poly<"button", {}>;

interface MorphProps {
  active: boolean;
  off: ReactNode;
  on: ReactNode;
}

const face = { gridArea: "1 / 1" };

/** Two stacked faces. Shows `on` when active, `off` otherwise, morphing between them. */
export const Morph = forwardRef<Element, Props<ElementType, MorphProps>>(
  ({ as = "span", active, off, on, style, ...rest }, ref) => {
    const [a, b] = useMorph(active);
    const [shownAtMount] = useState(active);
    return createElement(
      as,
      { ...rest, ref, style: { display: "inline-grid", ...style } },
      createElement("span", { ref: a, style: { ...face, opacity: shownAtMount ? 0 : 1 } }, off),
      createElement("span", { ref: b, style: { ...face, opacity: shownAtMount ? 1 : 0 } }, on),
    );
  },
) as unknown as Poly<"span", MorphProps>;

/** Children reveal as they scroll into view. Renders a div unless `as` says otherwise. */
export const Reveal = forwardRef<Element, Props<ElementType, RevealOptions>>(
  ({ as = "div", stagger, root, ...rest }, ref) =>
    createElement(as, { ...rest, ref: merged(useReveal({ stagger, root }), ref) }),
) as unknown as Poly<"div", RevealOptions>;
