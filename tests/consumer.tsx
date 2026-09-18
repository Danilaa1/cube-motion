import { createRef } from "react";
import { rise, leave, morph, reveal, type Targets } from "cube-motion";
import { Rise, Morph, Reveal, useRise, useMorph, useReveal } from "cube-motion/react";
import { Rise as VueRise, Morph as VueMorph, Reveal as VueReveal } from "cube-motion/vue";
import { Rise as SolidRise, Morph as SolidMorph, Reveal as SolidReveal } from "cube-motion/solid";
import { rise as svelteRise, leave as svelteLeave, morph as svelteMorph, reveal as svelteReveal } from "cube-motion/svelte";
import { h } from "vue";

const button = createRef<HTMLButtonElement>();
<Rise as="button" ref={button} type="button">Saved</Rise>;
<Rise as="button" ref={(node) => { node?.focus(); if (node) node.disabled = true; }}>Saved</Rise>;
<Reveal as="ul" targets="children" ref={createRef<HTMLUListElement>()}><li>Card</li></Reveal>;
<Morph as="button" type="button" active={false} off="Save" on="Saved" />;
// @ts-expect-error a button ref cannot receive a div
<Rise as="div" ref={button} />;
// @ts-expect-error anchors do not accept the disabled property
<Rise as="a" disabled />;
// @ts-expect-error targeting is limited to the element or direct children
<Rise targets="descendants" />;

h(VueRise, { as: "section", show: true, delay: 10 });
h(VueMorph, { active: false, off: "Save", on: "Saved" });
h(VueReveal, { root: null, targets: "children" });
SolidRise({ as: "button", type: "button", children: "Saved" });
SolidMorph({ active: false, off: "Save", on: "Saved" });
SolidReveal({ as: "ul", targets: "children" });

function hooks() {
  useRise<HTMLDivElement>();
  useReveal<HTMLUListElement>();
  useMorph<HTMLSpanElement>(false);
}
function core(targets: Targets, off: Element, on: Element, node: HTMLElement) {
  const animations: Animation[] = [...rise(targets, { targets: "children" }), ...leave(targets), ...morph(off, on)];
  const stop: () => void = reveal(targets);
  svelteRise(node, { index: 1 });
  svelteLeave(node, { delay: 20 });
  svelteMorph(node, false);
  svelteReveal(node, { root: null });
  return { animations, stop };
}
