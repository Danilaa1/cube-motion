import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    await render(createElement(Rise, { as: "section", className: "hero", targets: "children", stagger: 40 } as never, createElement("h1", null, createElement("i")), createElement("p")));
    const section = host.querySelector("section.hero")!;
    expect(section).not.toBeNull();
    expect(animationsOf(section.children[1])[0].options.delay).toBe(40);
    expect(animationsOf(section)).toHaveLength(0);
    expect(animationsOf(section.querySelector("i")!)).toHaveLength(0);
    expect(section.hasAttribute("targets")).toBe(false);
  });

  it("Rise with show leaves its children, then unmounts, and comes back with a rise", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { show: open, targets: "children", className: "panel" } as never, createElement("p"));
    await render(createElement(Panel, { open: true }));
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    await render(createElement(Panel, { open: false }));
    expect(host.querySelector(".panel")).not.toBeNull();
    expect(animationsOf(p)[1].options).toMatchObject({ duration: 320, fill: "both" });
    await act(async () => settle());
    expect(host.querySelector(".panel")).toBeNull();
    await render(createElement(Panel, { open: true }));
    expect(animationsOf(host.querySelector("p")!)[0].options.duration).toBe(640);
  });

  it("Rise with show false from the start renders nothing until shown", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { show: open, targets: "children" } as never, createElement("p"));
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
    expect(animationsOf(on)).toHaveLength(0);
    await render(createElement(Save, { saved: true }));
    expect(animationsOf(off)[0]).toMatchObject({ finishedEarly: false, options: { duration: 220 } });
    expect(animationsOf(on)[0].options.delay).toBe(130);
  });

  it("Morph with string faces morphs letter by letter and keeps the shared prefix still", async () => {
    const Save = ({ saved }: { saved: boolean }) => createElement(Morph, { active: saved, off: "Save", on: "Saved" } as never);
    await render(createElement(Save, { saved: false }));
    await render(createElement(Save, { saved: true }));
    const [off, on] = host.querySelector("span")!.children;
    expect([off.textContent, on.textContent]).toEqual(["Save", "Saved"]);
    const incoming = [...host.querySelectorAll("[data-cube-morph-overlay]")].find((el) => el.textContent === "Saved")!;
    expect(animationsOf(incoming.children[0]).at(-1)!.keyframes[0].opacity).toBe(1);
    expect(animationsOf(incoming.children[4]).at(-1)!.options.delay).toBe(60);
  });

  it("Reveal observes its children and disconnects on unmount", async () => {
    await render(createElement(Reveal, { as: "ul", targets: "children" } as never, createElement("li", null, createElement("i")), createElement("li")));
    expect(observed).toHaveLength(2);
    expect(host.querySelector("li")!.style.opacity).toBe("0");
    expect(observed).toEqual([...host.querySelectorAll("li")]);
    expect(host.querySelector("ul")!.hasAttribute("targets")).toBe(false);
    await act(async () => root.unmount());
    expect(observed).toHaveLength(0);
  });

  it("Rise animates text-only content and waits for its exit, including initially hidden content", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { show: open, as: "p" }, "Hello");
    await render(createElement(Panel, { open: false }));
    expect(host.querySelector("p")).toBeNull();
    await render(createElement(Panel, { open: true }));
    const p = host.querySelector("p")!;
    expect(animationsOf(p)[0].options.duration).toBe(640);
    await render(createElement(Panel, { open: false }));
    expect(p.isConnected).toBe(true);
    expect(animationsOf(p)[1].options.duration).toBe(320);
    await act(async () => settle());
    expect(p.isConnected).toBe(false);
  });

  it("Rise animates the whole styled element by default, including its exit", async () => {
    const Panel = ({ open }: { open: boolean }) => createElement(Rise, { as: "button", show: open, style: { background: "black" } }, createElement("i"), "Save");
    await render(createElement(Panel, { open: true }));
    const button = host.querySelector("button")!;
    const icon = button.querySelector("i")!;
    expect(button.style.background).toBe("black");
    expect(animationsOf(button)[0].options.duration).toBe(640);
    expect(animationsOf(icon)).toHaveLength(0);
    await render(createElement(Panel, { open: false }));
    expect(animationsOf(button)[1].options.duration).toBe(320);
    expect(animationsOf(icon)).toHaveLength(0);
    expect(button.isConnected).toBe(true);
    await act(async () => settle());
    expect(button.isConnected).toBe(false);
  });

  it("Reveal observes the whole styled element by default", async () => {
    await render(createElement(Reveal, { as: "button", style: { background: "black" } }, createElement("i"), "Save"));
    const button = host.querySelector("button")!;
    expect(observed).toEqual([button]);
    expect(button.style.opacity).toBe("0");
    expect(button.querySelector("i")!.style.opacity).toBe("");
  });

  it("keeps merged callback refs stable and runs React 19 cleanup on replacement and unmount", async () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    await render(createElement(Rise, { ref, as: "div", title: "first" }, "Text"));
    await render(createElement(Rise, { ref, as: "div", title: "second" }, "Text"));
    expect(ref).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();
    const first = host.firstElementChild!;
    await render(createElement(Rise, { ref, as: "section" }, "Text"));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(ref).toHaveBeenCalledTimes(2);
    expect(animationsOf(first)[0].cancelled).toBe(true);
    expect(animationsOf(host.firstElementChild!)[0].options.duration).toBe(640);
    await act(async () => root.unmount());
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls.every(([el]) => el !== null)).toBe(true);
  });

  it("forwards null to legacy refs and does not detach Reveal refs on ordinary rerenders", async () => {
    const ref = vi.fn((_el: Element | null) => {});
    await render(createElement(Reveal, { ref, title: "first" }, "Text"));
    await render(createElement(Reveal, { ref, title: "second" }, "Text"));
    expect(ref).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
    expect(ref).toHaveBeenLastCalledWith(null);
  });

  it("hides and inerts only the inactive morph face, including before any motion", async () => {
    const view = (active: boolean) => createElement(Morph, { active, off: createElement("button", null, "Off"), on: createElement("button", null, "On") });
    await render(view(false));
    const [off, on] = host.firstElementChild!.children;
    expect(off.hasAttribute("inert")).toBe(false);
    expect(on.hasAttribute("inert")).toBe(true);
    expect(on.getAttribute("aria-hidden")).toBe("true");
    await render(view(true));
    expect(off.hasAttribute("inert")).toBe(true);
    expect(on.hasAttribute("inert")).toBe(false);
    expect(on.getAttribute("aria-hidden")).not.toBe("true");
  });

  it("preserves framework text updates after a morph", async () => {
    const view = (active: boolean, label: string) => createElement(Morph, { active, off: "Save", on: label });
    await render(view(false, "Saved"));
    await render(view(true, "Saved"));
    await act(async () => settle());
    await render(view(true, "Saved again"));
    expect(host.firstElementChild!.children[1].textContent).toBe("Saved again");
    await render(view(false, "Saved again"));
    await act(async () => settle());
    expect(host.querySelectorAll("[data-cube-morph-overlay]")).toHaveLength(0);
  });
});

describe("hooks", () => {
  it("useRise rises the container's children on mount", async () => {
    function List() {
      const ref = useRise({ targets: "children" });
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
    expect(animationsOf(on)).toHaveLength(0);
    await render(createElement(Save, { saved: true }));
    expect(animationsOf(off)[0].options.duration).toBe(220);
  });

  it("useReveal observes the container's children", async () => {
    function Cards() {
      const ref = useReveal({ targets: "children" });
      return createElement("div", { ref }, createElement("article"));
    }
    await mount(Cards);
    expect(observed).toEqual([host.querySelector("article")]);
  });

  it("useRise handles late attachment and replacement while retaining an object ref", async () => {
    let captured: ReturnType<typeof useRise> | undefined;
    function Panel({ id }: { id: string | null }) {
      captured = useRise();
      return id ? createElement("p", { key: id, ref: captured }, id) : null;
    }
    await render(createElement(Panel, { id: null }));
    const ref = captured;
    await render(createElement(Panel, { id: "first" }));
    const first = captured!.current!;
    expect(animationsOf(first)).toHaveLength(1);
    await render(createElement(Panel, { id: "second" }));
    expect(captured).toBe(ref);
    expect(captured!.current).not.toBe(first);
    expect(animationsOf(first)[0].cancelled).toBe(true);
    expect(animationsOf(captured!.current!)).toHaveLength(1);
  });

  it("useRise and useReveal default to the referenced elements with nested content", async () => {
    function Panels() {
      const rise = useRise();
      const reveal = useReveal();
      return createElement("main", null,
        createElement("button", { ref: rise }, createElement("i"), "Save"),
        createElement("section", { ref: reveal }, createElement("i"), "Details"),
      );
    }
    await mount(Panels);
    expect(animationsOf(host.querySelector("button")!)).toHaveLength(1);
    expect(animationsOf(host.querySelector("button i")!)).toHaveLength(0);
    expect(observed).toEqual([host.querySelector("section")]);
  });

  it("useReveal disconnects replaced and detached targets", async () => {
    function Panel({ id }: { id: string | null }) {
      const ref = useReveal({ targets: "children" });
      return id ? createElement("div", { key: id, ref }, createElement("p", null, id)) : null;
    }
    await render(createElement(Panel, { id: null }));
    expect(observed).toHaveLength(0);
    await render(createElement(Panel, { id: "first" }));
    const first = host.querySelector("p")!;
    expect(observed).toEqual([first]);
    await render(createElement(Panel, { id: "second" }));
    expect(observed).toEqual([host.querySelector("p")]);
    expect(observed).not.toContain(first);
    await render(createElement(Panel, { id: null }));
    expect(observed).toHaveLength(0);
  });

  it("useMorph settles late or replaced faces without replaying an unchanged selection", async () => {
    function Faces({ id, active }: { id: string | null; active: boolean }) {
      const [off, on] = useMorph(active);
      return id ? createElement("div", { key: id }, createElement("i", { ref: off }), createElement("i", { ref: on })) : null;
    }
    await render(createElement(Faces, { id: null, active: false }));
    await render(createElement(Faces, { id: "first", active: false }));
    const first = host.querySelectorAll("i")[1];
    expect(first.style.opacity).toBe("0");
    expect(first.hasAttribute("inert")).toBe(true);
    expect(animationsOf(first)).toHaveLength(0);
    await render(createElement(Faces, { id: "first", active: true }));
    expect(animationsOf(first)).toHaveLength(1);
    await render(createElement(Faces, { id: "second", active: true }));
    const second = host.querySelectorAll("i")[1];
    expect(animationsOf(first)[0].cancelled).toBe(true);
    expect(second.style.opacity).toBe("1");
    expect(second.hasAttribute("inert")).toBe(false);
    expect(animationsOf(second)).toHaveLength(0);
  });

  it("rebinds after StrictMode's effect cleanup", async () => {
    await render(createElement(StrictMode, null, createElement(Reveal, { targets: "children" }, createElement("p"))));
    expect(observed).toEqual([host.querySelector("p")]);
  });
});
