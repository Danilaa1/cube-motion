import { useEffect, useRef, type RefObject } from "react";
import { morph, press, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

type Ref = RefObject<Element | null>;

/** Rise the children of the container on mount. */
export function useRise(ref: Ref, options?: RiseOptions) {
  useEffect(() => {
    if (ref.current) rise(ref.current.children, options);
  }, []);
}

/** Press feedback on the element for its lifetime. */
export function usePress(ref: Ref) {
  useEffect(() => (ref.current ? press(ref.current) : undefined), []);
}

/** Show `on` when active, `off` otherwise. Morphs on change, settles without motion on mount. */
export function useMorph(off: Ref, on: Ref, active: boolean) {
  const shown = useRef(active);
  useEffect(() => {
    if (!off.current || !on.current) return;
    const faces = morph(active ? off.current : on.current, active ? on.current : off.current);
    if (shown.current === active) faces.forEach((a) => a.finish());
    shown.current = active;
  }, [active]);
}

/** Reveal the children of the container as they scroll into view. */
export function useReveal(ref: Ref, options?: RevealOptions) {
  useEffect(() => (ref.current ? reveal(ref.current.children, options) : undefined), []);
}
