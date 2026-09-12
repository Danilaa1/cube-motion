import { useEffect, useRef, type RefObject } from "react";
import { morph, press, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

type Ref<T extends Element> = RefObject<T | null>;

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
