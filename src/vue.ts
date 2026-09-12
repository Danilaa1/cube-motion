import {
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
  type PropType,
  type StyleValue,
} from "vue";
import { leave, morph, reveal, rise } from "./index.js";

// Components: render the element you name, spread the attrs, bind the motion.

type As = string | Component;
const as = (def: string) => ({ type: [String, Object] as PropType<As>, default: def });

/** Children rise on mount and leave before unmount. Renders a div unless `as` says otherwise. */
export const Rise = defineComponent({
  name: "Rise",
  inheritAttrs: false,
  props: {
    as: as("div"),
    /** Mounted and risen while true; leaves, then unmounts, when it turns false. */
    show: { type: Boolean, default: true },
    stagger: Number,
    delay: Number,
  },
  setup(props, { attrs, slots }) {
    const el = ref<Element | null>(null);
    const mounted = ref(props.show);
    const enter = () => el.value && rise(el.value.children, { stagger: props.stagger, delay: props.delay });
    onMounted(enter);
    let run = 0;
    watch(
      () => props.show,
      async (show) => {
        const mine = ++run;
        if (show) {
          if (mounted.value) return enter();
          mounted.value = true;
          await nextTick();
          return enter();
        }
        if (!el.value) return;
        await Promise.all(leave(el.value.children).map((a) => a.finished)).catch(() => {});
        if (mine === run) mounted.value = false;
      },
    );
    return () => (mounted.value ? h(props.as as string, { ...attrs, ref: el }, slots.default?.()) : null);
  },
});

const face = (shown: boolean): StyleValue => ({ gridArea: "1 / 1", opacity: shown ? 1 : 0 });

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
    watch(
      () => props.active,
      (active) => a.value && b.value && morph(active ? a.value : b.value, active ? b.value : a.value),
    );
    return () =>
      h(props.as as string, { ...attrs, style: [{ display: "inline-grid" }, attrs.style as StyleValue] }, [
        h("span", { ref: a, style: face(!shownAtMount) }, slots.off?.() ?? props.off),
        h("span", { ref: b, style: face(shownAtMount) }, slots.on?.() ?? props.on),
      ]);
  },
});

/** Children reveal as they scroll into view. Renders a div unless `as` says otherwise. */
export const Reveal = defineComponent({
  name: "Reveal",
  inheritAttrs: false,
  props: {
    as: as("div"),
    stagger: Number,
    root: Object as PropType<Element | null>,
  },
  setup(props, { attrs, slots }) {
    const el = ref<Element | null>(null);
    let stop = () => {};
    onMounted(() => {
      if (el.value) stop = reveal(el.value.children, { stagger: props.stagger, root: props.root });
    });
    onBeforeUnmount(() => stop());
    return () => h(props.as as string, { ...attrs, ref: el }, slots.default?.());
  },
});
