import { useEffect, useRef, type RefObject } from "react";
import { morph, press, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

type Ref = RefObject<Element | null>;

/** Rise the children of the referenced element once, on mount. */
export function useRise(ref: Ref, options?: RiseOptions): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const animations = rise(el.children, options);
    return () => animations.forEach((a) => a.cancel());
    // An entrance runs once; later option changes have nothing to replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Bind press feedback to the referenced element for its lifetime. */
export function usePress(ref: Ref): void {
  useEffect(() => (ref.current ? press(ref.current) : undefined), [ref]);
}

/**
 * Show `on` when `active` is true and `off` otherwise, morphing between them
 * whenever `active` flips. The first render sets the state without motion.
 */
export function useMorph(off: Ref, on: Ref, active: boolean): void {
  const shown = useRef(active);
  useEffect(() => {
    const a = off.current;
    const b = on.current;
    if (!a || !b) return;
    if (shown.current === active) {
      ((active ? a : b) as HTMLElement).style.opacity = "0";
      return;
    }
    shown.current = active;
    morph(active ? a : b, active ? b : a);
  }, [off, on, active]);
}

/** Reveal the children of the referenced element as they scroll into view. */
export function useReveal(ref: Ref, options?: RevealOptions): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return reveal(el.children, options);
    // Observation starts once; the options describe where, not a value to react to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
