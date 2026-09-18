import { createApp, defineComponent, h, nextTick, ref, type App, type FunctionalComponent } from "vue";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Morph, Reveal, Rise } from "../src/vue.js";
import { animationsOf, install, observed, settle } from "./setup.js";

let host: HTMLElement;
let app: App | undefined;

beforeEach(() => {
  install();
  host = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  host.remove();
});

const mount = (render: () => unknown) => {
  app = createApp({ render });
  app.mount(host);
};

describe("vue components", () => {
  it("Rise renders the element it is told to, passes attrs, and rises its children", () => {
    mount(() => h(Rise, { as: "section", class: "hero", targets: "children", stagger: 40 }, () => [h("h1", [h("i")]), h("p")]));
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
    expect(animationsOf(section)).toHaveLength(0);
    expect(animationsOf(section.querySelector("i")!)).toHaveLength(0);
    expect(section.hasAttribute("targets")).toBe(false);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const open = ref(true);
    mount(() => h(Rise, { show: open.value, targets: "children", class: "panel" }, () => [h("p")]));
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    open.value = false;
    await nextTick();
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "both" });
    settle();
    await new Promise((r) => setTimeout(r));
    expect(host.querySelector(".panel")).toBeNull();
    open.value = true;
    await nextTick();
    await nextTick();
    expect(animationsOf(host.querySelector("p")!)[0].options.duration).toBe(640);
  });

  it("Morph stacks two faces from props or slots, hides the inactive one, and morphs on change", async () => {
    const saved = ref(false);
    mount(() => h(Morph, { active: saved.value, off: "Save" }, { on: () => h("i", "Saved") }));
    const wrapper = host.querySelector("span")!;
    const [off, on] = wrapper.children as unknown as HTMLElement[];
    expect([wrapper.style.position, wrapper.style.display]).toEqual(["relative", "inline-flex"]);
    expect([off.textContent, on.textContent]).toEqual(["Save", "Saved"]);
    expect([off.style.position, on.style.position, on.style.opacity]).toEqual(["relative", "absolute", "0"]);
    saved.value = true;
    await nextTick();
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Reveal observes its children and disconnects on unmount", () => {
    mount(() => h(Reveal, { as: "ul", targets: "children" }, () => [h("li", [h("i")]), h("li")]));
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    expect(observed).toEqual([...host.querySelectorAll("li")]);
    expect(host.querySelector("ul")!.hasAttribute("targets")).toBe(false);
    app!.unmount();
    app = undefined;
    expect(observed).toHaveLength(0);
  });

  it("Rise animates initially hidden text-only content and waits for its exit", async () => {
    const open = ref(false);
    mount(() => h(Rise, { show: open.value, as: "p" }, () => "Hello"));
    expect(host.querySelector("p")).toBeNull();
    open.value = true;
    await nextTick();
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    open.value = false;
    await nextTick();
    expect(p.isConnected).toBe(true);
    expect(animationsOf(p)[1].options.duration).toBe(320);
    settle();
    await new Promise((r) => setTimeout(r));
    expect(p.isConnected).toBe(false);
  });

  it("Rise animates the whole styled element by default, including its exit", async () => {
    const open = ref(true);
    mount(() => h(Rise, { as: "button", show: open.value, style: { background: "black" } }, () => [h("i"), "Save"]));
    const button = host.querySelector("button")!;
    const icon = button.querySelector("i")!;
    expect(button.style.background).toBe("black");
    expect(animationsOf(button)[0].options.duration).toBe(640);
    expect(animationsOf(icon)).toHaveLength(0);
    open.value = false;
    await nextTick();
    expect(animationsOf(button)[1].options.duration).toBe(320);
    expect(animationsOf(icon)).toHaveLength(0);
    expect(button.isConnected).toBe(true);
    settle();
    await new Promise((r) => setTimeout(r));
    expect(button.isConnected).toBe(false);
  });

  it("Reveal observes the whole styled element by default", () => {
    mount(() => h(Reveal, { as: "button", style: { background: "black" } }, () => [h("i"), "Save"]));
    const button = host.querySelector("button")!;
    expect(observed).toEqual([button]);
    expect(button.style.opacity).toBe("0");
    expect(button.querySelector("i")!.style.opacity).toBe("");
  });

  it.each([false, true])("resolves custom component roots, functional=%s", async (functional) => {
    const render: FunctionalComponent = (_props, { attrs, slots }) => h("section", attrs, slots.default?.());
    const Panel = functional ? render : defineComponent({ setup: (_props, context) => () => render({}, context) });
    const open = ref(true);
    mount(() => h("main", [
      h(Rise, { as: Panel, show: open.value, targets: "children", class: "rise" }, () => h("p", "Enter")),
      h(Reveal, { as: Panel, targets: "children", class: "reveal" }, () => h("p", "Observe")),
      h(Morph, { as: Panel, active: false, off: "Save", on: "Saved", class: "morph" }),
    ]));
    const rising = host.querySelector(".rise p")!;
    expect(animationsOf(rising)[0].options.duration).toBe(640);
    expect(observed).toEqual([host.querySelector(".reveal p")]);
    expect(host.querySelector(".morph")!.children).toHaveLength(2);
    open.value = false;
    await nextTick();
    expect(animationsOf(rising)[1].options.duration).toBe(320);
  });

  it("rebinds Rise and Reveal when their root elements are replaced", async () => {
    const tag = ref("div");
    mount(() => h("main", [h(Rise, { as: tag.value, class: "rise" }, () => "Rise"), h(Reveal, { as: tag.value, class: "reveal" }, () => "Reveal")]));
    const first = host.querySelector(".rise")!;
    const observedFirst = host.querySelector(".reveal")!;
    tag.value = "section";
    await nextTick();
    const second = host.querySelector("section.rise")!;
    expect(animationsOf(first)[0].cancelled).toBe(true);
    expect(animationsOf(second)[0].options.duration).toBe(640);
    expect(observed).toEqual([host.querySelector("section.reveal")]);
    expect(observed).not.toContain(observedFirst);
  });

  it("keeps morph-owned layout after active changes and unrelated rerenders", async () => {
    const active = ref(false);
    const title = ref("first");
    mount(() => h(Morph, { active: active.value, title: title.value }, { off: () => h("button", "Off"), on: () => h("button", "On") }));
    const [off, on] = host.firstElementChild!.children as unknown as HTMLElement[];
    expect(off.hasAttribute("inert")).toBe(false);
    expect(on.hasAttribute("inert")).toBe(true);
    expect(on.getAttribute("aria-hidden")).toBe("true");
    active.value = true;
    await nextTick();
    settle();
    await nextTick();
    title.value = "second";
    await nextTick();
    expect([off.style.position, on.style.position]).toEqual(["absolute", "relative"]);
    expect([off.style.opacity, on.style.opacity]).toEqual(["0", "1"]);
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("inert")).toBe(false);
    active.value = false;
    await nextTick();
    settle();
    await nextTick();
    title.value = "third";
    await nextTick();
    expect([off.style.position, on.style.position]).toEqual(["relative", "absolute"]);
    expect([off.style.opacity, on.style.opacity]).toEqual(["1", "0"]);
  });

  it("preserves reactive text after morphing", async () => {
    const active = ref(false);
    const text = ref("Saved");
    mount(() => h(Morph, { active: active.value, off: "Save", on: text.value }));
    active.value = true;
    await nextTick();
    settle();
    await nextTick();
    text.value = "Saved again";
    await nextTick();
    expect(host.firstElementChild!.children[1].textContent).toBe("Saved again");
    expect((host.firstElementChild!.children[1] as HTMLElement).style.opacity).toBe("1");
  });

  it("keeps the selected morph face when its wrapper is replaced", async () => {
    const tag = ref("span");
    const active = ref(false);
    mount(() => h(Morph, { as: tag.value, active: active.value, off: "Off", on: "On" }));
    active.value = true;
    await nextTick();
    tag.value = "div";
    await nextTick();
    const [off, on] = host.firstElementChild!.children as unknown as HTMLElement[];
    expect([off.style.position, on.style.position]).toEqual(["absolute", "relative"]);
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("inert")).toBe(false);
  });
});
