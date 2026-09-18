import { createElement, createRef, forwardRef, type ComponentPropsWithoutRef } from "react";
import { Morph, Reveal, Rise, useReveal, useRise } from "../src/react.js";
import { h, type DefineComponent } from "vue";
import { Morph as VueMorph, Reveal as VueReveal, Rise as VueRise } from "../src/vue.js";
import { Reveal as SolidReveal, Rise as SolidRise } from "../src/solid.js";

const button = createRef<HTMLButtonElement>();
const anchor = createRef<HTMLAnchorElement>();
const div = createRef<HTMLDivElement>();

Rise({ as: "button", ref: button, disabled: true });
Reveal({ as: "a", ref: anchor, href: "/" });
Morph({ as: "button", ref: button, active: false, off: "Save", on: "Saved" });
Rise({ ref: div });
Rise({ as: "button", ref: (el) => { el?.disabled; } });
Rise({ as: "ul", targets: "children" });
Reveal({ targets: "self" });
useRise({ targets: "children" });
useReveal({ targets: "self" });
// @ts-expect-error Only self or direct children are valid target scopes.
Rise({ targets: "descendants" });
// @ts-expect-error Hooks use the same target scopes as components.
useReveal({ targets: "descendants" });

// @ts-expect-error A button ref cannot point at an anchor.
Rise({ as: "a", ref: button });
// @ts-expect-error The default root is a div.
Rise({ ref: button });
// @ts-expect-error Anchor props cannot be used with a button.
Rise({ as: "button", href: "/" });

const Button = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button"> & { label: string }>(
  ({ label, ...props }, ref) => createElement("button", { ...props, ref }, label),
);
Rise({ as: Button, label: "Save", ref: button });
// @ts-expect-error Custom component refs keep their declared element type.
Reveal({ as: Button, label: "Save", ref: anchor });
// @ts-expect-error Custom component required props are preserved.
Rise({ as: Button, ref: button });

const Label = ({ label }: { label: string }) => createElement("span", null, label);
// @ts-expect-error A component without a ref prop cannot receive one.
Rise({ as: Label, label: "Save", ref: button });

const vueRise: DefineComponent<{ as?: string | import("vue").Component; show?: boolean; targets?: "self" | "children"; stagger?: number; delay?: number }> = VueRise;
h(vueRise, { show: false, targets: "children" }, () => "Text");
h(VueReveal, { as: "section", targets: "self" });
h(VueMorph, { active: true, off: "Save", on: "Saved" });
const vueTargets: InstanceType<typeof VueReveal>["$props"]["targets"] = "children";
// @ts-expect-error Vue exposes the same target scopes.
const invalidVueTargets: InstanceType<typeof VueRise>["$props"]["targets"] = "descendants";
SolidRise({ as: "ul", targets: "children" });
SolidReveal({ targets: "self" });
// @ts-expect-error Solid exposes the same target scopes.
SolidReveal({ targets: "descendants" });
void [vueTargets, invalidVueTargets];

type VueMorphProps = InstanceType<typeof VueMorph>["$props"];
const validMorph: VueMorphProps = { active: false };
// @ts-expect-error Morph requires an active selection.
const invalidMorph: VueMorphProps = {};
void [validMorph, invalidMorph];
