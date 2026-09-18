"use client";

import {
  createElement,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  version,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref as ReactRef,
  type RefObject,
} from "react";
import { leave, morph, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";
import { prepareMorph } from "./morph.js";

type Ref<T extends Element> = RefObject<T | null>;
const cancel = (animations: Animation[]) => animations.forEach((animation) => animation.cancel());

// Hooks: the escape hatch when you already own the element.

/** Returns a ref. The element rises on attachment; use targets="children" for its direct children. */
export function useRise<T extends Element = HTMLElement>(options?: RiseOptions): Ref<T> {
  const ref = useRef<T>(null);
  const previous = useRef<T | null>(null);
  const animations = useRef<Animation[]>([]);
  useEffect(() => {
    if (previous.current === ref.current) return;
    cancel(animations.current);
    previous.current = ref.current;
    animations.current = ref.current ? rise(ref.current, options) : [];
  });
  useEffect(() => () => {
    cancel(animations.current);
    previous.current = null;
  }, []);
  return ref;
}

/** Returns [off, on] refs. `on` shows when active. Morphs on change, settles without motion on mount. */
export function useMorph<T extends Element = HTMLElement>(active: boolean): [Ref<T>, Ref<T>] {
  const off = useRef<T>(null);
  const on = useRef<T>(null);
  const previous = useRef<{ off: T; on: T; active: boolean } | null>(null);
  const animations = useRef<Animation[]>([]);
  useEffect(() => {
    const replaced = previous.current?.off !== off.current || previous.current?.on !== on.current;
    if (replaced) {
      cancel(animations.current);
      previous.current = null;
    }
    if (!off.current || !on.current) return;
    if (previous.current?.active === active) return;
    const outgoing = active ? off.current : on.current;
    const incoming = active ? on.current : off.current;
    if (!previous.current) {
      prepareMorph(outgoing, incoming);
      animations.current = [];
    } else animations.current = morph(outgoing, incoming);
    previous.current = { off: off.current, on: on.current, active };
  });
  useEffect(() => () => {
    cancel(animations.current);
    previous.current = null;
  }, []);
  return [off, on];
}

/** Returns a ref. The element reveals as it scrolls into view; use targets="children" for its direct children. */
export function useReveal<T extends Element = HTMLElement>(options?: RevealOptions): Ref<T> {
  const ref = useRef<T>(null);
  const previous = useRef<T | null>(null);
  const stop = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    if (previous.current === ref.current) return;
    stop.current?.();
    previous.current = ref.current;
    stop.current = ref.current ? reveal(ref.current, options) : undefined;
  });
  useEffect(() => () => {
    stop.current?.();
    previous.current = null;
  }, []);
  return ref;
}

// Components: render the element you name, spread the rest, bind the motion.

type Props<T extends ElementType, Own> = Own & { as?: T } & Omit<ComponentPropsWithoutRef<T>, keyof Own | "as">;
type PolyRef<T extends ElementType> = "ref" extends keyof ComponentPropsWithRef<T> ? ComponentPropsWithRef<T>["ref"] : never;
type Poly<D extends ElementType, Own> = <T extends ElementType = D>(
  props: Props<T, Own> & { ref?: PolyRef<T> },
) => ReactElement | null;

const useMergedRef = (own: Ref<Element>, theirs: ReactRef<Element> | undefined) => useMemo(() => {
  let cleanup: void | (() => void);
  return (el: Element | null) => {
    (own as { current: Element | null }).current = el;
    if (typeof theirs === "function") {
      if (el) cleanup = theirs(el);
      else if (typeof cleanup === "function") {
        cleanup();
        cleanup = undefined;
      } else theirs(null);
    } else if (theirs) (theirs as { current: Element | null }).current = el;
  };
}, [own, theirs]);

interface RiseProps extends RiseOptions {
  /** Mounted and risen while true; leaves, then unmounts, when it turns false. Default true. */
  show?: boolean;
}

/** Rises on mount and leaves before unmount. Use targets="children" for direct children. Renders a div by default. */
export const Rise = forwardRef<Element, Props<ElementType, RiseProps>>(
  ({ as = "div", show = true, targets, stagger, delay, ...rest }, ref) => {
    const el = useRef<Element>(null);
    const mergedRef = useMergedRef(el, ref);
    const previous = useRef<{ el: Element | null; show: boolean } | null>(null);
    const animations = useRef<Animation[]>([]);
    const run = useRef(0);
    const [mounted, setMounted] = useState(show);
    if (show && !mounted) setMounted(true);
    useEffect(() => {
      if (previous.current?.el === el.current && previous.current.show === show) return;
      if (previous.current?.el !== el.current) cancel(animations.current);
      previous.current = { el: el.current, show };
      const mine = ++run.current;
      if (!el.current) return;
      if (show) {
        animations.current = rise(el.current, { targets, stagger, delay });
        return;
      }
      animations.current = leave(el.current, { targets });
      Promise.all(animations.current.map((a) => a.finished))
        .then(() => mine === run.current && setMounted(false))
        .catch(() => {});
    });
    useEffect(() => () => {
      ++run.current;
      cancel(animations.current);
      previous.current = null;
    }, []);
    return mounted ? createElement(as, { ...rest, ref: mergedRef }) : null;
  },
) as unknown as Poly<"div", RiseProps>;

interface MorphProps {
  active: boolean;
  off: ReactNode;
  on: ReactNode;
}

// The active face sits in the flow and sizes the wrapper; the inactive one floats over it.
const wrap = { position: "relative", display: "inline-flex", alignItems: "center" } as const;
const face = (shown: boolean) => ({
  display: "inline-flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  willChange: "opacity, filter, scale",
  ...(shown ? { position: "relative" } : { position: "absolute", inset: 0, opacity: 0 }),
});

// React 18 forwards inert as an unknown attribute; React 19 knows it is boolean.
const inert = version.startsWith("18.") ? "" : true;

/** Two stacked faces. Shows `on` when active, `off` otherwise, morphing between them. */
export const Morph = forwardRef<Element, Props<ElementType, MorphProps>>(
  ({ as = "span", active, off, on, style, ...rest }, ref) => {
    const [a, b] = useMorph(active);
    const [shownAtMount] = useState(active);
    return createElement(
      as,
      { ...rest, ref, style: { ...wrap, ...style } },
      createElement("span", { ref: a, style: face(!shownAtMount), "aria-hidden": shownAtMount, inert: shownAtMount ? inert : undefined }, off),
      createElement("span", { ref: b, style: face(shownAtMount), "aria-hidden": !shownAtMount, inert: shownAtMount ? undefined : inert }, on),
    );
  },
) as unknown as Poly<"span", MorphProps>;

/** Reveals as it scrolls into view. Use targets="children" for direct children. Renders a div by default. */
export const Reveal = forwardRef<Element, Props<ElementType, RevealOptions>>(
  ({ as = "div", targets, stagger, root, ...rest }, ref) =>
    createElement(as, { ...rest, ref: useMergedRef(useReveal({ targets, stagger, root }), ref) }),
) as unknown as Poly<"div", RevealOptions>;
