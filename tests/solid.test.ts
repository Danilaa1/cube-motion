import { createSignal } from "solid-js";
import { createComponent, render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Morph, Reveal, Rise } from "../src/solid.js";
import { animationsOf, install, observed, settle } from "./setup.js";

let host: HTMLElement;
let dispose = () => {};

beforeEach(() => {
  install();
  host = document.body.appendChild(document.createElement("div"));
});

afterEach(() => {
  dispose();
  host.remove();
});

const mount = (node: () => unknown) => {
  dispose = render(node as () => Element, host);
};

describe("solid components", () => {
  it("Rise renders the element it is told to, spreads props, and rises its children", () => {
    mount(() =>
      createComponent(Rise, {
        as: "section",
        class: "hero",
        stagger: 40,
        get children() {
          return [document.createElement("h1"), document.createElement("p")];
        },
      } as never),
    );
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const [open, setOpen] = createSignal(true);
    mount(() =>
      createComponent(Rise, {
        get show() {
          return open();
        },
        class: "panel",
        get children() {
          return document.createElement("p");
        },
      } as never),
    );
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    setOpen(false);
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "forwards" });
    expect(host.querySelector(".panel")).not.toBeNull();
    settle();
    await Promise.resolve();
    await Promise.resolve();
    expect(host.querySelector(".panel")).toBeNull();
    setOpen(true);
    expect(animationsOf(host.querySelector("p")!)[0].options.duration).toBe(640);
  });

  it("Rise hands back the ref", () => {
    let captured: Element | undefined;
    mount(() => createComponent(Rise, { as: "section", ref: (el: Element) => (captured = el) } as never));
    expect(captured).toBe(host.querySelector("section"));
  });

  it("Morph stacks two faces, hides the inactive one from the first paint, and morphs on change", () => {
    const [saved, setSaved] = createSignal(false);
    mount(() =>
      createComponent(Morph, {
        get active() {
          return saved();
        },
        off: (() => { const i = document.createElement("i"); i.textContent = "Save"; return i; })(),
        on: (() => { const i = document.createElement("i"); i.textContent = "Saved"; return i; })(),
      } as never),
    );
    const wrapper = host.querySelector("span")!;
    const [off, on] = wrapper.children as unknown as HTMLElement[];
    expect([wrapper.style.position, wrapper.style.display]).toEqual(["relative", "inline-flex"]);
    expect([off.style.position, on.style.position, on.style.opacity]).toEqual(["", "absolute", "0"]);
    expect(animationsOf(off)).toHaveLength(0);
    setSaved(true);
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Reveal observes its children and disconnects on dispose", () => {
    mount(() =>
      createComponent(Reveal, {
        as: "ul",
        get children() {
          return [document.createElement("li"), document.createElement("li")];
        },
      } as never),
    );
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    dispose();
    expect(observed).toHaveLength(0);
  });
});
