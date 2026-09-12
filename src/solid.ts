import {
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
  type ComponentProps,
  type JSX,
  type ValidComponent,
} from "solid-js";
import { createComponent, Dynamic } from "solid-js/web";
import { leave, morph, reveal, rise, type RevealOptions, type RiseOptions } from "./index.js";

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

interface RiseProps extends RiseOptions {
  /** Mounted and risen while true; leaves, then unmounts, when it turns false. Default true. */
  show?: boolean;
}

/** Children rise on mount and leave before unmount. Renders a div unless `as` says otherwise. */
export function Rise<T extends ValidComponent = "div">(props: Props<T, RiseProps>): JSX.Element {
  const [local, others] = splitProps(props as Props<"div", RiseProps>, ["as", "show", "stagger", "delay", "ref"]);
  const show = () => local.show ?? true;
  const [mounted, setMounted] = createSignal(show());
  let el: Element | undefined;
  const enter = () => el && rise(el.children, { stagger: local.stagger, delay: local.delay });
  createEffect(
    on(
      show,
      (shown) => {
        if (shown) {
          if (mounted()) enter();
          else setMounted(true);
          return;
        }
        if (!el) return;
        let live = true;
        Promise.all(leave(el.children).map((a) => a.finished))
          .then(() => live && setMounted(false))
          .catch(() => {});
        onCleanup(() => (live = false));
      },
      { defer: true },
    ),
  );
  return createComponent(Show, {
    get when() {
      return mounted();
    },
    get children() {
      onMount(enter);
      return element(local.as ?? "div", others, local.ref, (e) => (el = e));
    },
  } as unknown as ComponentProps<typeof Show>);
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
