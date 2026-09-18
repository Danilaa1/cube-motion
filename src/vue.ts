import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
  type Component,
  type ComponentPublicInstance,
  type DefineComponent,
  type PropType,
  type StyleValue,
} from "vue";
import { leave, morph, reveal, rise, type RiseOptions, type RevealOptions } from "./index.js";
import { prepareMorph } from "./morph.js";

// Components: render the element you name, spread the attrs, bind the motion.

type As = string | Component;
const as = (def: string) => ({ type: [String, Object, Function] as PropType<As>, default: def });
const element = (value: Element | ComponentPublicInstance | null): Element | null => {
  const el = value instanceof Element ? value : value?.$el;
  return el instanceof Element ? el : null;
};

/** Rises on mount and leaves before unmount. Use targets="children" for direct children. Renders a div by default. */
export const Rise = defineComponent({
  name: "Rise",
  inheritAttrs: false,
  props: {
    as: as("div"),
    /** Mounted and risen while true; leaves, then unmounts, when it turns false. */
    show: { type: Boolean, default: true },
    targets: String as PropType<RiseOptions["targets"]>,
    stagger: Number,
    delay: Number,
  },
  setup(props, { attrs, slots }) {
    const el = ref<Element | ComponentPublicInstance | null>(null);
    const mounted = ref(props.show);
    let previous: Element | null = null;
    let shown: boolean | undefined;
    let animations: Animation[] = [];
    let run = 0;
    const sync = () => {
      const current = element(el.value);
      if (previous === current && shown === props.show) return;
      if (previous !== current) animations.forEach((a) => a.cancel());
      previous = current;
      shown = props.show;
      const mine = ++run;
      if (!current) return;
      if (props.show) {
        animations = rise(current, { targets: props.targets, stagger: props.stagger, delay: props.delay });
      } else {
        animations = leave(current, { targets: props.targets });
        Promise.all(animations.map((a) => a.finished))
          .then(() => { if (mine === run) mounted.value = false; })
          .catch(() => {});
      }
    };
    watch(() => props.show, (show) => { if (show) mounted.value = true; });
    onMounted(sync);
    onUpdated(sync);
    onBeforeUnmount(() => {
      ++run;
      animations.forEach((a) => a.cancel());
    });
    return () => (mounted.value ? h(props.as as string, { ...attrs, ref: el }, typeof props.as === "string" ? slots.default?.() : slots) : null);
  },
}) as unknown as DefineComponent<RiseOptions & { as?: As; show?: boolean }>;

// The active face sits in the flow and sizes the wrapper; the inactive one floats over it.
const wrap: StyleValue = { position: "relative", display: "inline-flex", alignItems: "center" };
// A constant CSS string is patched only once. Object styles are reapplied by Vue on
// every render and would overwrite the positions and opacity owned by morph().
const face = (shown: boolean) =>
  `display:inline-flex;align-items:center;white-space:nowrap;will-change:opacity,filter,scale${shown ? ";position:relative" : ";position:absolute;inset:0;opacity:0"}`;

/** Two stacked faces. Shows `on` when active, `off` otherwise, morphing between them. Faces come from props or the `off` and `on` slots. */
export const Morph = defineComponent({
  name: "Morph",
  inheritAttrs: false,
  props: {
    as: as("span"),
    active: { type: Boolean, required: true },
    off: String,
    on: String,
  },
  setup(props, { attrs, slots }) {
    const a = ref<Element | null>(null);
    const b = ref<Element | null>(null);
    const shownAtMount = props.active;
    const offStyle = face(!shownAtMount);
    const onStyle = face(shownAtMount);
    let previous: { off: Element; on: Element; active: boolean } | undefined;
    let animations: Animation[] = [];
    const sync = () => {
      if (!a.value || !b.value) return;
      const replaced = previous?.off !== a.value || previous?.on !== b.value;
      if (!replaced && previous?.active === props.active) return;
      const outgoing = props.active ? a.value : b.value;
      const incoming = props.active ? b.value : a.value;
      if (replaced) {
        animations.forEach((a) => a.cancel());
        prepareMorph(outgoing, incoming);
        animations = [];
      } else animations = morph(outgoing, incoming);
      previous = { off: a.value, on: b.value, active: props.active };
    };
    onMounted(sync);
    onUpdated(sync);
    onBeforeUnmount(() => animations.forEach((a) => a.cancel()));
    const faces = () => [
      h("span", { ref: a, style: offStyle, "aria-hidden": shownAtMount, inert: shownAtMount }, slots.off?.() ?? props.off),
      h("span", { ref: b, style: onStyle, "aria-hidden": !shownAtMount, inert: !shownAtMount }, slots.on?.() ?? props.on),
    ];
    return () => h(props.as as string, { ...attrs, style: [wrap, attrs.style as StyleValue] }, typeof props.as === "string" ? faces() : { default: faces });
  },
}) as unknown as DefineComponent<{ as?: As; active: boolean; off?: string; on?: string }>;

/** Reveals as it scrolls into view. Use targets="children" for direct children. Renders a div by default. */
export const Reveal = defineComponent({
  name: "Reveal",
  inheritAttrs: false,
  props: {
    as: as("div"),
    targets: String as PropType<RevealOptions["targets"]>,
    stagger: Number,
    root: Object as PropType<Element | null>,
  },
  setup(props, { attrs, slots }) {
    const el = ref<Element | ComponentPublicInstance | null>(null);
    let previous: Element | null = null;
    let stop = () => {};
    const sync = () => {
      const current = element(el.value);
      if (current === previous) return;
      stop();
      previous = current;
      stop = current ? reveal(current, { targets: props.targets, stagger: props.stagger, root: props.root }) : () => {};
    };
    onMounted(sync);
    onUpdated(sync);
    onBeforeUnmount(() => stop());
    return () => h(props.as as string, { ...attrs, ref: el }, typeof props.as === "string" ? slots.default?.() : slots);
  },
}) as unknown as DefineComponent<RevealOptions & { as?: As }>;
