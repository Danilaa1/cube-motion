import { vi } from "vitest";

// happy-dom has no Web Animations API. Record what each call asked for.
export interface Recorded {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  options: KeyframeAnimationOptions;
  cancelled: boolean;
  finishedEarly: boolean;
  cancel(): void;
  finish(): void;
  finished: Promise<void>;
}

const live = new WeakMap<Element, Recorded[]>();

export const animationsOf = (el: Element) => live.get(el) ?? [];

export let reduceMotion = false;
export const setReduceMotion = (on: boolean) => {
  reduceMotion = on;
};

export let intersect: (entries: Partial<IntersectionObserverEntry>[]) => void = () => {};
export let observed: Element[] = [];
export let observerOptions: IntersectionObserverInit | undefined;

export function install() {
  Element.prototype.animate = function (keyframes, options) {
    const a: Recorded = {
      keyframes: keyframes as Keyframe[],
      options: options as KeyframeAnimationOptions,
      cancelled: false,
      finishedEarly: false,
      cancel() {
        a.cancelled = true;
      },
      finish() {
        a.finishedEarly = true;
      },
      finished: Promise.resolve(),
    };
    live.set(this, [...(live.get(this) ?? []), a]);
    return a as unknown as Animation;
  };
  Element.prototype.getAnimations = function () {
    return animationsOf(this).filter((a) => !a.cancelled) as unknown as Animation[];
  };
  vi.stubGlobal("matchMedia", () => ({ matches: reduceMotion }));
  observed = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        intersect = (entries) => cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
        observerOptions = options;
      }
      observe(el: Element) {
        observed.push(el);
      }
      unobserve() {}
      disconnect() {
        observed = [];
      }
    },
  );
}
