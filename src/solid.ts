import {
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  Show,
  splitProps,
  type ComponentProps,
  type JSX,
  type ValidComponent,
} from "solid-js";
import { createComponent, Dynamic } from "solid-js/web";
import { leave, morph, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";
import { prepareMorph } from "./morph.js";

// Components: render the element you name, spread the rest, bind the motion.

type Props<T extends ValidComponent, Own> = Own & { as?: T } & Omit<ComponentProps<T>, keyof Own | "as">;

// Solid applies `ref` outside the owner, so lifecycle hooks are registered in the component body
// and the ref only captures the element and forwards it to the caller.
const element = (as: () => ValidComponent, others: Record<string, unknown>, theirs: unknown, capture: (el: Element) => void) =>
  createComponent(
    Dynamic,
    mergeProps(others, {
      get component() { return as(); },
      ref(el: Element) {
        capture(el);
        if (typeof theirs === "function") theirs(el);
      },
    }) as ComponentProps<typeof Dynamic>,
  );

interface RiseProps extends RiseOptions {
  /** Mounted and risen while true; leaves, then unmounts, when it turns false. Default true. */
  show?: boolean;
}

/** Rises on mount and leaves before unmount. Use targets="children" for direct children. Renders a div by default. */
export function Rise<T extends ValidComponent = "div">(props: Props<T, RiseProps>): JSX.Element {
  const [local, others] = splitProps(props as Props<"div", RiseProps>, ["as", "show", "targets", "stagger", "delay", "ref"]);
  const show = () => local.show ?? true;
  const [mounted, setMounted] = createSignal(show());
  const [el, setEl] = createSignal<Element>();
  let animations: Animation[] = [];
  onCleanup(() => animations.forEach((a) => a.cancel()));
  createEffect(
    on(
      () => [show(), el()] as const,
      ([shown, current], previous) => {
        if (current !== previous?.[1]) animations.forEach((a) => a.cancel());
        if (shown) {
          if (!mounted()) setMounted(true);
          else if (current) animations = rise(current, { targets: local.targets, stagger: local.stagger, delay: local.delay });
          return;
        }
        if (!current) return;
        let live = true;
        animations = leave(current, { targets: local.targets });
        Promise.all(animations.map((a) => a.finished))
          .then(() => live && setMounted(false))
          .catch(() => {});
        onCleanup(() => (live = false));
      },
    ),
  );
  return createComponent(Show, {
    get when() {
      return mounted();
    },
    get children() {
      onCleanup(() => setEl(undefined));
      return element(() => local.as ?? "div", others, local.ref, setEl);
    },
  } as unknown as ComponentProps<typeof Show>);
}

interface MorphProps {
  active: boolean;
  off: JSX.Element;
  on: JSX.Element;
}

// The active face sits in the flow and sizes the wrapper; the inactive one floats over it.
const WRAP = "position:relative;display:inline-flex;align-items:center";
const face = (shown: boolean) =>
  `display:inline-flex;align-items:center;white-space:nowrap;will-change:opacity,filter,scale${shown ? ";position:relative" : ";position:absolute;inset:0;opacity:0"}`;

/** Two stacked faces. Shows `on` when active, `off` otherwise, morphing between them. */
export function Morph<T extends ValidComponent = "span">(props: Props<T, MorphProps>): JSX.Element {
  const [local, others] = splitProps(props as Props<"span", MorphProps>, ["as", "active", "off", "on", "style"]);
  const shownAtMount = local.active;
  const [a, setA] = createSignal<Element>();
  const [b, setB] = createSignal<Element>();
  let animations: Animation[] = [];
  onCleanup(() => animations.forEach((a) => a.cancel()));
  createEffect(
    on(
      () => [local.active, a(), b()] as const,
      ([active, off, on], previous) => {
        if (!off || !on) return;
        const outgoing = active ? off : on;
        const incoming = active ? on : off;
        if (previous?.[1] !== off || previous?.[2] !== on) {
          animations.forEach((a) => a.cancel());
          prepareMorph(outgoing, incoming);
          animations = [];
        } else animations = morph(outgoing, incoming);
      },
    ),
  );
  const style = () =>
    typeof local.style === "string" ? `${WRAP};${local.style}` : { position: "relative", display: "inline-flex", "align-items": "center", ...local.style };
  return createComponent(
    Dynamic,
    mergeProps(others, {
      get component() {
        return local.as ?? "span";
      },
      get style() {
        return style();
      },
      get children() {
        return [
          createComponent(Dynamic, { component: "span", ref: setA, style: face(!shownAtMount), "aria-hidden": shownAtMount, inert: shownAtMount, get children() { return local.off; } }),
          createComponent(Dynamic, { component: "span", ref: setB, style: face(shownAtMount), "aria-hidden": !shownAtMount, inert: !shownAtMount, get children() { return local.on; } }),
        ];
      },
    }) as ComponentProps<typeof Dynamic>,
  );
}

/** Reveals as it scrolls into view. Use targets="children" for direct children. Renders a div by default. */
export function Reveal<T extends ValidComponent = "div">(props: Props<T, RevealOptions>): JSX.Element {
  const [local, others] = splitProps(props as Props<"div", RevealOptions>, ["as", "targets", "stagger", "root", "ref"]);
  const [el, setEl] = createSignal<Element>();
  createEffect(on(el, (current) => {
    if (current) onCleanup(reveal(current, { targets: local.targets, stagger: local.stagger, root: local.root }));
  }));
  return element(() => local.as ?? "div", others, local.ref, setEl);
}
