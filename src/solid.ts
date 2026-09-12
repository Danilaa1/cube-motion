import { createEffect, mergeProps, on, onCleanup, onMount, splitProps, type ComponentProps, type JSX, type ValidComponent } from "solid-js";
import { createComponent, Dynamic } from "solid-js/web";
import { morph, press, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

// Components: render the element you name, spread the rest, bind the motion.

type Props<T extends ValidComponent, Own> = Own & { as?: T } & Omit<ComponentProps<T>, keyof Own | "as">;

// Solid applies `ref` outside the owner, so lifecycle hooks are registered in the component body
// and the ref only captures the element and forwards it to the caller.
const element = (as: ValidComponent, others: Record<string, unknown>, theirs: unknown, capture: (el: Element) => void) =>
  createComponent(
    Dynamic,
    mergeProps(others, {
      component: as,
      ref(el: Element) {
        capture(el);
        if (typeof theirs === "function") theirs(el);
      },
    }) as ComponentProps<typeof Dynamic>,
  );

/** Children rise on mount, staggered. Renders a div unless `as` says otherwise. */
export function Rise<T extends ValidComponent = "div">(props: Props<T, RiseOptions>): JSX.Element {
  const [local, others] = splitProps(props as Props<"div", RiseOptions>, ["as", "stagger", "delay", "ref"]);
  let el!: Element;
  onMount(() => rise(el.children, { stagger: local.stagger, delay: local.delay }));
  return element(local.as ?? "div", others, local.ref, (e) => (el = e));
}

/** A pressable element with press feedback. Renders a button unless `as` says otherwise. */
export function Press<T extends ValidComponent = "button">(props: Props<T, {}>): JSX.Element {
  const [local, others] = splitProps(props as Props<"button", {}>, ["as", "ref"]);
  let el!: Element;
  onMount(() => onCleanup(press(el)));
  return element(local.as ?? "button", others, local.ref, (e) => (el = e));
}

interface MorphProps {
  active: boolean;
  off: JSX.Element;
  on: JSX.Element;
}

const face = (shown: boolean) => `grid-area:1/1;opacity:${shown ? 1 : 0}`;

/** Two stacked faces. Shows `on` when active, `off` otherwise, morphing between them. */
export function Morph<T extends ValidComponent = "span">(props: Props<T, MorphProps>): JSX.Element {
  const [local, others] = splitProps(props as Props<"span", MorphProps>, ["as", "active", "off", "on", "style"]);
  const shownAtMount = local.active;
  let a!: Element;
  let b!: Element;
  createEffect(
    on(
      () => local.active,
      (active) => morph(active ? a : b, active ? b : a),
      { defer: true },
    ),
  );
  const style = () =>
    typeof local.style === "string" ? `display:inline-grid;${local.style}` : { display: "inline-grid", ...local.style };
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
          createComponent(Dynamic, { component: "span", ref: (el: Element) => (a = el), style: face(!shownAtMount), get children() { return local.off; } }),
          createComponent(Dynamic, { component: "span", ref: (el: Element) => (b = el), style: face(shownAtMount), get children() { return local.on; } }),
        ];
      },
    }) as ComponentProps<typeof Dynamic>,
  );
}

/** Children reveal as they scroll into view. Renders a div unless `as` says otherwise. */
export function Reveal<T extends ValidComponent = "div">(props: Props<T, RevealOptions>): JSX.Element {
  const [local, others] = splitProps(props as Props<"div", RevealOptions>, ["as", "stagger", "root", "ref"]);
  let el!: Element;
  onMount(() => onCleanup(reveal(el.children, { stagger: local.stagger, root: local.root })));
  return element(local.as ?? "div", others, local.ref, (e) => (el = e));
}
