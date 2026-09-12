import { list, type Targets } from "./dom.js";
import { rise } from "./rise.js";
import { REVEAL_MARGIN, STAGGER } from "./tokens.js";

export interface RevealOptions {
  /** Milliseconds between elements that enter the viewport together. Default 60. */
  stagger?: number;
  /** Scroll container to observe against. Default the viewport. */
  root?: Element | null;
}

const style = (el: Element) => (el as HTMLElement).style;

/** Hide the targets now and rise each one the first time it scrolls into view. Returns disconnect. */
export function reveal(targets: Targets, { stagger = STAGGER.reveal, root = null }: RevealOptions = {}): () => void {
  const els = list(targets);
  for (const el of els) style(el).opacity = "0";
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        style(entry.target).opacity = "";
        rise(entry.target, { delay: i++ * stagger });
        io.unobserve(entry.target);
      }
    },
    { root, rootMargin: REVEAL_MARGIN },
  );
  for (const el of els) io.observe(el);
  return () => io.disconnect();
}
