import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Morph, Reveal, Rise, useMorph, useReveal, useRise } from "../src/react.js";
import { animationsOf, install, observed, settle } from "./setup.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement;
let root: Root;

beforeEach(() => {
  install();
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

const render = (node: ReactElementLike) => act(async () => root.render(node as never));
type ReactElementLike = ReturnType<typeof createElement>;
const mount = (component: () => unknown) => render(createElement(component as never));

describe("components", () => {
  it("Rise renders the element it is told to, spreads props, and rises its children", async () => {
    await render(createElement(Rise, { as: "section", className: "hero", stagger: 40 } as never, createElement("h1"), createElement("p")));
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { show: open, className: "panel" } as never, createElement("p"));
    await render(createElement(Panel, { open: true }));
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    await render(createElement(Panel, { open: false }));
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "forwards" });
    await act(async () => settle());
    expect(host.querySelector(".panel")).toBeNull();
    await render(createElement(Panel, { open: true }));
    expect(animationsOf(host.querySelector("p")!)[0].options.duration).toBe(640);
  });

  it("Rise with show false from the start renders nothing until shown", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { show: open } as never, createElement("p"));
    await render(createElement(Panel, { open: false }));
    expect(host.querySelector("p")).toBeNull();
    await render(createElement(Panel, { open: true }));
    expect(animationsOf(host.querySelector("p")!)[0].options.duration).toBe(640);
  });

  it("Morph lays out two faces, floats the inactive one hidden from the first paint, and crossfades element faces on change", async () => {
    const Save = ({ saved }: { saved: boolean }) =>
      createElement(Morph, { active: saved, off: createElement("i", null, "Save"), on: createElement("i", null, "Saved") } as never);
    await render(createElement(Save, { saved: false }));
    const wrapper = host.querySelector("span")!;
    const [off, on] = wrapper.children;
    expect([wrapper.style.position, wrapper.style.display]).toEqual(["relative", "inline-flex"]);
    expect([off.style.position, on.style.position, on.style.opacity]).toEqual(["relative", "absolute", "0"]);
    expect(animationsOf(on)[0].finishedEarly).toBe(true);
    await render(createElement(Save, { saved: true }));
    expect(animationsOf(off)[1]).toMatchObject({ finishedEarly: false, options: { duration: 220 } });
    expect(animationsOf(on)[1].options.delay).toBe(130);
  });

  it("Morph with string faces morphs letter by letter and keeps the shared prefix still", async () => {
    const Save = ({ saved }: { saved: boolean }) => createElement(Morph, { active: saved, off: "Save", on: "Saved" } as never);
    await render(createElement(Save, { saved: false }));
    await render(createElement(Save, { saved: true }));
    const [off, on] = host.querySelector("span")!.children;
    expect([...on.children].map((c) => c.textContent).join("")).toBe("Saved");
    expect((off.children[0] as HTMLElement).style.opacity).toBe("0");
    expect(animationsOf(on.children[4]).at(-1)!.options.delay).toBe(60);
  });

  it("Reveal observes its children and disconnects on unmount", async () => {
    await render(createElement(Reveal, { as: "ul" } as never, createElement("li"), createElement("li")));
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    await act(async () => root.unmount());
    expect(observed).toHaveLength(0);
  });
});

describe("hooks", () => {
  it("useRise rises the container's children on mount", async () => {
    function List() {
      const ref = useRise();
      return createElement("ul", { ref }, createElement("li"), createElement("li"));
    }
    await mount(List);
    expect(animationsOf(host.querySelectorAll("li")[1])[0].options.delay).toBe(70);
  });

  it("useMorph settles without motion on mount and morphs when active flips", async () => {
    function Save({ saved }: { saved: boolean }) {
      const [off, on] = useMorph(saved);
      return createElement("span", null, createElement("i", { ref: off }, createElement("svg")), createElement("i", { ref: on }, createElement("svg")));
    }
    await render(createElement(Save, { saved: false }));
    const [off, on] = host.querySelectorAll("i");
    expect(animationsOf(on)[0].finishedEarly).toBe(true);
    await render(createElement(Save, { saved: true }));
    expect(animationsOf(off)[1].options.duration).toBe(220);
  });

  it("useReveal observes the container's children", async () => {
    function Cards() {
      const ref = useReveal();
      return createElement("div", { ref }, createElement("article"));
    }
    await mount(Cards);
    expect(observed).toHaveLength(1);
  });
});
