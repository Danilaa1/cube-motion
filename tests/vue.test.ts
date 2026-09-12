import { createApp, h, nextTick, ref, type App } from "vue";
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
    mount(() => h(Rise, { as: "section", class: "hero", stagger: 40 }, () => [h("h1"), h("p")]));
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const open = ref(true);
    mount(() => h(Rise, { show: open.value, class: "panel" }, () => [h("p")]));
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    open.value = false;
    await nextTick();
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "forwards" });
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
    mount(() => h(Morph, { active: saved.value, off: "Save" }, { on: () => "Saved" }));
    const wrapper = host.querySelector("span")!;
    const [off, on] = wrapper.querySelectorAll("span");
    expect(wrapper.style.display).toBe("inline-grid");
    expect([off.textContent, on.textContent]).toEqual(["Save", "Saved"]);
    expect([off.style.opacity, on.style.opacity]).toEqual(["1", "0"]);
    saved.value = true;
    await nextTick();
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Reveal observes its children and disconnects on unmount", () => {
    mount(() => h(Reveal, { as: "ul" }, () => [h("li"), h("li")]));
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    app!.unmount();
    app = undefined;
    expect(observed).toHaveLength(0);
  });
});
