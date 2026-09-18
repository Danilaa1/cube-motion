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
        targets: "children",
        get children() {
          const h1 = document.createElement("h1");
          h1.appendChild(document.createElement("i"));
          return [h1, document.createElement("p")];
        },
      } as never),
    );
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
    expect(animationsOf(section)).toHaveLength(0);
    expect(animationsOf(section.querySelector("i")!)).toHaveLength(0);
    expect(section.hasAttribute("targets")).toBe(false);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const [open, setOpen] = createSignal(true);
    mount(() =>
      createComponent(Rise, {
        get show() {
          return open();
        },
        class: "panel",
        targets: "children",
        get children() {
          return document.createElement("p");
        },
      } as never),
    );
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    setOpen(false);
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "both" });
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
    expect([off.style.position, on.style.position, on.style.opacity]).toEqual(["relative", "absolute", "0"]);
    expect(off.hasAttribute("inert")).toBe(false);
    expect(on.hasAttribute("inert")).toBe(true);
    expect(on.getAttribute("aria-hidden")).toBe("true");
    expect(animationsOf(off)).toHaveLength(0);
    setSaved(true);
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("inert")).toBe(false);
    expect(animationsOf(off)[0].options.duration).toBe(220);
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Reveal observes its children and disconnects on dispose", () => {
    mount(() =>
      createComponent(Reveal, {
        as: "ul",
        targets: "children",
        get children() {
          const li = document.createElement("li");
          li.appendChild(document.createElement("i"));
          return [li, document.createElement("li")];
        },
      } as never),
    );
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    expect(observed).toEqual([...host.querySelectorAll("li")]);
    expect(host.querySelector("ul")!.hasAttribute("targets")).toBe(false);
    dispose();
    expect(observed).toHaveLength(0);
  });

  it("Rise animates initially hidden text-only content and waits for its exit", async () => {
    const [open, setOpen] = createSignal(false);
    mount(() => createComponent(Rise, { as: "p", get show() { return open(); }, children: "Hello" }));
    expect(host.querySelector("p")).toBeNull();
    setOpen(true);
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    setOpen(false);
    expect(p.isConnected).toBe(true);
    expect(animationsOf(p)[1].options.duration).toBe(320);
    settle();
    await Promise.resolve();
    await Promise.resolve();
    expect(p.isConnected).toBe(false);
  });

  it("Rise animates the whole styled element by default, including its exit", async () => {
    const [open, setOpen] = createSignal(true);
    mount(() => createComponent(Rise, {
      as: "button", get show() { return open(); }, style: { background: "black" },
      get children() { return [document.createElement("i"), "Save"]; },
    }));
    const button = host.querySelector("button")!;
    const icon = button.querySelector("i")!;
    expect(button.style.background).toBe("black");
    expect(animationsOf(button)[0].options.duration).toBe(640);
    expect(animationsOf(icon)).toHaveLength(0);
    setOpen(false);
    expect(animationsOf(button)[1].options.duration).toBe(320);
    expect(animationsOf(icon)).toHaveLength(0);
    expect(button.isConnected).toBe(true);
    settle();
    await Promise.resolve();
    await Promise.resolve();
    expect(button.isConnected).toBe(false);
  });

  it("Reveal observes the whole styled element by default", () => {
    mount(() => createComponent(Reveal, {
      as: "button", style: { background: "black" },
      get children() { return [document.createElement("i"), "Save"]; },
    }));
    const button = host.querySelector("button")!;
    expect(observed).toEqual([button]);
    expect(button.style.opacity).toBe("0");
    expect(button.querySelector("i")!.style.opacity).toBe("");
  });

  it("keeps reactive text nodes intact after a morph", async () => {
    const [active, setActive] = createSignal(false);
    const [text, setText] = createSignal("Saved");
    mount(() => createComponent(Morph, { get active() { return active(); }, off: "Save", get on() { return text(); } }));
    setActive(true);
    settle();
    await Promise.resolve();
    await Promise.resolve();
    setText("Saved again");
    expect(host.firstElementChild!.children[1].textContent).toBe("Saved again");
  });

  it("rebinds Rise and Reveal when their root elements are replaced", () => {
    const [tag, setTag] = createSignal<"div" | "section">("div");
    mount(() => [
      createComponent(Rise, { get as() { return tag(); }, class: "rise", children: "Rise" }),
      createComponent(Reveal, { get as() { return tag(); }, class: "reveal", children: "Reveal" }),
    ]);
    const first = host.querySelector(".rise")!;
    const observedFirst = host.querySelector(".reveal")!;
    setTag("section");
    expect(animationsOf(first)[0].cancelled).toBe(true);
    expect(animationsOf(host.querySelector("section.rise")!)[0].options.duration).toBe(640);
    expect(observed).toEqual([host.querySelector("section.reveal")]);
    expect(observed).not.toContain(observedFirst);
  });

  it("keeps the selected morph face when its wrapper is replaced", () => {
    const [tag, setTag] = createSignal<"span" | "div">("span");
    const [active, setActive] = createSignal(false);
    mount(() => createComponent(Morph, { get as() { return tag(); }, get active() { return active(); }, off: "Off", on: "On" }));
    setActive(true);
    setTag("div");
    const [off, on] = host.querySelector("div")!.children as unknown as HTMLElement[];
    expect([off.style.position, on.style.position]).toEqual(["absolute", "relative"]);
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("inert")).toBe(false);
  });
});
